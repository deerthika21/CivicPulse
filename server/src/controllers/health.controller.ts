import type { Request, Response } from 'express';
import { dbState } from '../config/db.js';
import { env } from '../config/env.js';

export function getHealth(_req: Request, res: Response): void {
  const db = dbState();
  res.status(200).json({
    status: 'ok',
    service: 'civicpulse-server',
    env: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: db,
    gemini: {
      configured: Boolean(env.GEMINI_API_KEY),
      model: env.GEMINI_MODEL,
      embeddingModel: env.GEMINI_EMBEDDING_MODEL,
    },
  });
}
