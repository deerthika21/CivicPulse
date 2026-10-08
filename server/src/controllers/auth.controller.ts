import bcrypt from 'bcryptjs';
import type { Request, Response } from 'express';
import { z } from 'zod';
import type { Department, Role } from '../constants/taxonomy.js';
import { signToken, type AuthUser } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { User } from '../models/User.js';

const LoginBody = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = LoginBody.parse(req.body);
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  const authUser: AuthUser = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role as Role,
    department: (user.department ?? undefined) as Department | undefined,
  };
  res.json({ token: signToken(authUser), user: authUser });
}

export function me(req: Request, res: Response): void {
  res.json({ user: req.user });
}
