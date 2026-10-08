import { isValidObjectId, type QueryFilter, type SortOrder } from 'mongoose';
import { z } from 'zod';
import {
  ACTIVE_STATUSES,
  CATEGORIES,
  CATEGORY_TO_DEPARTMENT,
  DEPARTMENTS,
  ISSUE_STATUSES,
  SLA_STATES,
  slaHoursFor,
  type Category,
} from '../constants/taxonomy.js';
import type { AuthUser } from '../middleware/auth.js';
import { HttpError } from '../middleware/errorHandler.js';
import { Complaint } from '../models/Complaint.js';
import { Issue, type IssueAttrs } from '../models/Issue.js';
import { escapeRegex } from '../utils/ids.js';
import { serializeComplaint, serializeIssue } from './serialize.js';
import { computeSlaState } from './sla.service.js';

const HOUR = 3_600_000;

export const ListQuery = z.object({
  status: z.enum(['active', 'all', ...ISSUE_STATUSES]).default('active'),
  department: z.enum(DEPARTMENTS).optional(),
  category: z.enum(CATEGORIES).optional(),
  priority: z.coerce.number().int().min(1).max(5).optional(),
  sla: z.enum(SLA_STATES).optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['priority', 'sla', 'recent', 'reports']).default('priority'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

/** Officers are locked to their own department; admins may pick any (or all). */
function scopeDepartment(user: AuthUser, requested?: string): string | undefined {
  if (user.role === 'admin') return requested;
  if (!user.department) throw new HttpError(403, 'Officer account has no department');
  return user.department;
}

const SORTS: Record<string, Record<string, SortOrder>> = {
  priority: { priority: -1, slaDueAt: 1 },
  sla: { slaDueAt: 1, priority: -1 },
  recent: { lastReportedAt: -1 },
  reports: { reportCount: -1, priority: -1 },
};

export async function listIssues(user: AuthUser, rawQuery: unknown) {
  const q = ListQuery.parse(rawQuery);
  const filter: Record<string, unknown> = {};
  const department = scopeDepartment(user, q.department);
  if (department) filter.department = department;
  if (q.status === 'active') filter.status = { $in: ACTIVE_STATUSES };
  else if (q.status !== 'all') filter.status = q.status;
  if (q.category) filter.category = q.category;
  if (q.priority) filter.priority = q.priority;
  if (q.sla) filter.slaState = q.sla;
  if (q.q) {
    const rx = new RegExp(escapeRegex(q.q), 'i');
    filter.$or = [{ summary: rx }, { locationHint: rx }, { category: rx }];
  }

  const [items, total] = await Promise.all([
    Issue.find(filter as QueryFilter<IssueAttrs>).sort(SORTS[q.sort]).skip((q.page - 1) * q.limit).limit(q.limit).lean(),
    Issue.countDocuments(filter as QueryFilter<IssueAttrs>),
  ]);
  return { items: items.map(serializeIssue), total, page: q.page, limit: q.limit };
}

export async function queueSummary(user: AuthUser, requestedDept?: string) {
  const department = scopeDepartment(user, requestedDept);
  const base: Record<string, unknown> = department ? { department } : {};
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const active = { ...base, status: { $in: ACTIVE_STATUSES } };
  const [open, inProgress, critical, atRisk, breached, resolvedToday] = await Promise.all([
    Issue.countDocuments(<QueryFilter<IssueAttrs>>{ ...base, status: 'open' }),
    Issue.countDocuments(<QueryFilter<IssueAttrs>>{ ...base, status: 'in_progress' }),
    Issue.countDocuments(<QueryFilter<IssueAttrs>>{ ...active, priority: 5 }),
    Issue.countDocuments(<QueryFilter<IssueAttrs>>{ ...active, slaState: 'at_risk' }),
    Issue.countDocuments(<QueryFilter<IssueAttrs>>{ ...active, slaState: 'breached' }),
    Issue.countDocuments(<QueryFilter<IssueAttrs>>{ ...base, status: 'resolved', resolvedAt: { $gte: startOfDay } }),
  ]);
  return { department: department ?? null, open, inProgress, critical, atRisk, breached, resolvedToday };
}

async function loadScopedIssue(user: AuthUser, id: string) {
  if (!isValidObjectId(id)) throw new HttpError(404, 'Issue not found');
  const issue = await Issue.findById(id);
  if (!issue) throw new HttpError(404, 'Issue not found');
  if (user.role !== 'admin' && issue.department !== user.department) {
    throw new HttpError(403, 'This issue belongs to another department');
  }
  return issue;
}

export async function getIssueDetail(user: AuthUser, id: string) {
  const issue = await loadScopedIssue(user, id);
  const complaints = await Complaint.find({ issue: issue._id }).sort({ createdAt: 1 }).lean();
  return {
    issue: serializeIssue(issue.toObject()),
    complaints: complaints.map((c) => serializeComplaint(c, { includeCitizen: true })),
  };
}

export const UpdateBody = z
  .object({
    status: z.enum(ISSUE_STATUSES).optional(),
    note: z.string().trim().max(1000).optional(),
    category: z.enum(CATEGORIES).optional(),
    department: z.enum(DEPARTMENTS).optional(),
    priority: z.number().int().min(1).max(5).optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .refine((b) => Object.values(b).some((v) => v !== undefined), { message: 'Nothing to update' });

export async function updateIssue(user: AuthUser, id: string, rawBody: unknown) {
  const body = UpdateBody.parse(rawBody);
  const issue = await loadScopedIssue(user, id);
  const now = new Date();

  // --- AI overrides (category / department / priority) ---
  const changes: { field: 'category' | 'department' | 'priority'; from: unknown; to: unknown }[] = [];
  if (body.category && body.category !== issue.category) {
    changes.push({ field: 'category', from: issue.category, to: body.category });
    const mapped = CATEGORY_TO_DEPARTMENT[body.category as Category];
    if (!body.department && mapped !== issue.department) changes.push({ field: 'department', from: issue.department, to: mapped });
  }
  if (body.department && body.department !== issue.department) {
    changes.push({ field: 'department', from: issue.department, to: body.department });
  }
  if (body.priority && body.priority !== issue.priority) {
    changes.push({ field: 'priority', from: issue.priority, to: body.priority });
  }

  if (changes.length) {
    if (!body.reason || body.reason.length < 3) throw new HttpError(400, 'A reason is required to override the AI decision');
    for (const c of changes) {
      issue.set(c.field, c.to);
      issue.overrides.push({ ...c, reason: body.reason, by: user.id, byName: user.name, at: now });
      if (!issue.lockedFields.includes(c.field)) issue.lockedFields.push(c.field);
      issue.timeline.push({ type: 'override', message: `${c.field} changed from ${c.from} to ${c.to}: ${body.reason}`, byName: user.name, at: now });
      if (c.field === 'priority') {
        issue.priorityReason = `Officer override: ${body.reason}`;
        issue.slaHours = slaHoursFor(issue.priority);
        issue.slaDueAt = new Date(issue.createdAt.getTime() + issue.slaHours * HOUR);
      }
    }
  }

  // --- status workflow ---
  if (body.status && body.status !== issue.status) {
    const from = issue.status;
    issue.status = body.status;
    if (body.status === 'resolved' || body.status === 'rejected') {
      issue.resolvedAt = now;
      issue.resolutionNote = body.note ?? '';
    } else {
      issue.resolvedAt = undefined;
      issue.resolutionNote = '';
    }
    const label = body.status.replace('_', ' ');
    issue.timeline.push({
      type: 'status_changed',
      message: `Status ${from.replace('_', ' ')} → ${label}${body.note ? `: ${body.note}` : ''}`,
      byName: user.name,
      at: now,
    });
  } else if (body.note) {
    issue.timeline.push({ type: 'note', message: body.note, byName: user.name, at: now });
  }

  issue.slaState = computeSlaState(issue, now);
  await issue.save();
  return getIssueDetail({ ...user, role: 'admin' }, id); // re-read; dept may have changed
}
