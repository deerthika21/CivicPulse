import type { Request, Response } from 'express';
import { z } from 'zod';
import { getAnalytics } from '../services/analytics.service.js';
import { generateWeeklyInsight, latestInsight } from '../services/insight.service.js';

const AnalyticsQuery = z.object({ days: z.coerce.number().int().min(1).max(365).default(30) });

export async function analytics(req: Request, res: Response): Promise<void> {
  const { days } = AnalyticsQuery.parse(req.query);
  res.json(await getAnalytics(days));
}

export async function getLatestInsight(_req: Request, res: Response): Promise<void> {
  res.json({ insight: await latestInsight() });
}

export async function regenerateInsight(_req: Request, res: Response): Promise<void> {
  const insight = await generateWeeklyInsight();
  res.status(201).json({ insight: insight.toObject() });
}
