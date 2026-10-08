import { ACTIVE_STATUSES, type SlaState } from '../constants/taxonomy.js';
import { Issue } from '../models/Issue.js';

const AT_RISK_FRACTION = 0.75;

interface SlaInput {
  status: string;
  slaDueAt: Date;
  createdAt: Date;
  resolvedAt?: Date | null;
}

export function computeSlaState(issue: SlaInput, now = new Date()): SlaState {
  const due = issue.slaDueAt.getTime();
  if (!ACTIVE_STATUSES.includes(issue.status as never)) {
    const closedAt = issue.resolvedAt?.getTime() ?? now.getTime();
    return closedAt <= due ? 'met' : 'missed';
  }
  if (now.getTime() > due) return 'breached';
  const total = due - issue.createdAt.getTime();
  const elapsed = now.getTime() - issue.createdAt.getTime();
  return total > 0 && elapsed / total >= AT_RISK_FRACTION ? 'at_risk' : 'on_track';
}

/** Recomputes slaState for all active issues; logs a timeline entry on new breaches. */
export async function refreshSlaStates(now = new Date()): Promise<{ updated: number; newlyBreached: number }> {
  const issues = await Issue.find({ status: { $in: ACTIVE_STATUSES } }).select('status slaDueAt createdAt resolvedAt slaState');
  let updated = 0;
  let newlyBreached = 0;
  for (const issue of issues) {
    const next = computeSlaState(issue, now);
    if (next === issue.slaState) continue;
    const update: Record<string, unknown> = { $set: { slaState: next } };
    if (next === 'breached') {
      newlyBreached++;
      update.$push = { timeline: { type: 'sla_breached', message: 'SLA deadline passed without resolution', at: issue.slaDueAt } };
    }
    await Issue.updateOne({ _id: issue._id }, update);
    updated++;
  }
  return { updated, newlyBreached };
}
