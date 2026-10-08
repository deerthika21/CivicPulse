import { rateLimit } from 'express-rate-limit';

const common = { standardHeaders: 'draft-8' as const, legacyHeaders: false, message: { error: 'Too many requests, please try again later' } };

export const submitLimiter = rateLimit({ ...common, windowMs: 10 * 60_000, limit: 15 });
export const loginLimiter = rateLimit({ ...common, windowMs: 15 * 60_000, limit: 20 });
export const aiLimiter = rateLimit({ ...common, windowMs: 60 * 60_000, limit: 10 });
