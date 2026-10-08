import type { Request, Response } from 'express';
import {
  CATEGORIES,
  CATEGORY_TO_DEPARTMENT,
  DEPARTMENTS,
  ISSUE_STATUSES,
  PRIORITY_RUBRIC,
  SLA_HOURS_BY_PRIORITY,
} from '../constants/taxonomy.js';
import { Complaint } from '../models/Complaint.js';
import { Issue } from '../models/Issue.js';

export function getMeta(_req: Request, res: Response): void {
  res.json({
    categories: CATEGORIES,
    departments: DEPARTMENTS,
    categoryToDepartment: CATEGORY_TO_DEPARTMENT,
    priorityRubric: PRIORITY_RUBRIC,
    slaHoursByPriority: SLA_HOURS_BY_PRIORITY,
    statuses: ISSUE_STATUSES,
  });
}

/** Small public counters for the landing page. */
export async function getPublicStats(_req: Request, res: Response): Promise<void> {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [complaints, resolved, active, merged, resolution] = await Promise.all([
    Complaint.countDocuments({ isSpam: false }),
    Issue.countDocuments({ status: 'resolved' }),
    Issue.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    Complaint.countDocuments({ mergedAsDuplicate: true }),
    Issue.aggregate<{ avgHours: number }>([
      { $match: { status: 'resolved', resolvedAt: { $gte: since } } },
      { $group: { _id: null, avgHours: { $avg: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3_600_000] } } } },
    ]),
  ]);
  res.json({
    complaints,
    resolvedIssues: resolved,
    activeIssues: active,
    duplicatesMerged: merged,
    avgResolutionHours: resolution[0] ? Math.round(resolution[0].avgHours) : null,
  });
}
