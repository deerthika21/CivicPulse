import type { Request, Response } from 'express';
import { getIssueDetail, listIssues, queueSummary, updateIssue } from '../services/issue.service.js';

export async function list(req: Request, res: Response): Promise<void> {
  res.json(await listIssues(req.user!, req.query));
}

export async function summary(req: Request, res: Response): Promise<void> {
  const dept = typeof req.query.department === 'string' ? req.query.department : undefined;
  res.json(await queueSummary(req.user!, dept));
}

export async function detail(req: Request, res: Response): Promise<void> {
  res.json(await getIssueDetail(req.user!, String(req.params.id)));
}

export async function update(req: Request, res: Response): Promise<void> {
  res.json(await updateIssue(req.user!, String(req.params.id), req.body));
}
