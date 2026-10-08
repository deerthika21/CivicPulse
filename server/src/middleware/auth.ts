import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { Department, Role } from '../constants/taxonomy.js';
import { HttpError } from './errorHandler.js';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: Department;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: AuthUser): string {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return next(new HttpError(401, 'Login required'));
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser & jwt.JwtPayload;
    req.user = { id: payload.id, name: payload.name, email: payload.email, role: payload.role, department: payload.department };
    next();
  } catch {
    next(new HttpError(401, 'Session expired, please log in again'));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have access to this resource'));
    next();
  };
}
