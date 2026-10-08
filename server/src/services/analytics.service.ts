import { ACTIVE_STATUSES, CATEGORIES, DEPARTMENTS } from '../constants/taxonomy.js';
import { Complaint } from '../models/Complaint.js';
import { Issue } from '../models/Issue.js';

const DAY = 86_400_000;
const hoursExpr = { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3_600_000] };
const TZ = 'Asia/Kolkata';

type Count = { _id: string | number; count: number };

/** Admin dashboard data for the last `days` days. */
export async function getAnalytics(days: number) {
  const since = new Date(Date.now() - days * DAY);

  const [complaintFacets] = await Complaint.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              spam: { $sum: { $cond: ['$isSpam', 1, 0] } },
              merged: { $sum: { $cond: ['$mergedAsDuplicate', 1, 0] } },
              aiFallback: { $sum: { $cond: ['$aiFallback', 1, 0] } },
              avgConfidence: { $avg: '$confidence' },
              avgLatencyMs: { $avg: { $cond: [{ $gt: ['$aiLatencyMs', 0] }, '$aiLatencyMs', null] } },
              withPhoto: { $sum: { $cond: [{ $ifNull: ['$photo', false] }, 1, 0] } },
              withAudio: { $sum: { $cond: [{ $ifNull: ['$audio', false] }, 1, 0] } },
            },
          },
        ],
        byDay: [
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ],
        byLanguage: [{ $group: { _id: '$language', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
        bySentiment: [{ $group: { _id: '$sentiment', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
      },
    },
  ]);

  const [issueFacets] = await Issue.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $facet: {
        byCategory: [{ $group: { _id: '$category', count: { $sum: 1 }, reports: { $sum: '$reportCount' } } }, { $sort: { count: -1 } }],
        byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }, { $sort: { _id: -1 } }],
        byDepartment: [
          {
            $group: {
              _id: '$department',
              total: { $sum: 1 },
              active: { $sum: { $cond: [{ $in: ['$status', ACTIVE_STATUSES] }, 1, 0] } },
              resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
              breached: { $sum: { $cond: [{ $eq: ['$slaState', 'breached'] }, 1, 0] } },
              met: { $sum: { $cond: [{ $eq: ['$slaState', 'met'] }, 1, 0] } },
              missed: { $sum: { $cond: [{ $eq: ['$slaState', 'missed'] }, 1, 0] } },
              avgResolutionHours: { $avg: { $cond: [{ $eq: ['$status', 'resolved'] }, hoursExpr, null] } },
            },
          },
          { $sort: { total: -1 } },
        ],
        totals: [
          {
            $group: {
              _id: null,
              issues: { $sum: 1 },
              active: { $sum: { $cond: [{ $in: ['$status', ACTIVE_STATUSES] }, 1, 0] } },
              resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
              breached: { $sum: { $cond: [{ $eq: ['$slaState', 'breached'] }, 1, 0] } },
              met: { $sum: { $cond: [{ $eq: ['$slaState', 'met'] }, 1, 0] } },
              missed: { $sum: { $cond: [{ $eq: ['$slaState', 'missed'] }, 1, 0] } },
              overridden: { $sum: { $cond: [{ $gt: [{ $size: { $ifNull: ['$overrides', []] } }, 0] }, 1, 0] } },
              avgResolutionHours: { $avg: { $cond: [{ $eq: ['$status', 'resolved'] }, hoursExpr, null] } },
            },
          },
        ],
        resolvedByDay: [
          { $match: { resolvedAt: { $ne: null }, status: 'resolved' } },
          { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$resolvedAt', timezone: TZ } }, count: { $sum: 1 } } },
        ],
        topIssues: [
          { $match: { status: { $in: ACTIVE_STATUSES } } },
          { $sort: { reportCount: -1, priority: -1 } },
          { $limit: 5 },
          { $project: { summary: 1, category: 1, department: 1, priority: 1, reportCount: 1, locationHint: 1, slaState: 1 } },
        ],
        points: [
          { $limit: 2000 },
          { $project: { _id: 1, priority: 1, category: 1, status: 1, reportCount: 1, summary: 1, coords: '$location.coordinates' } },
        ],
      },
    },
  ]);

  const ct = complaintFacets.totals[0] ?? {};
  const it = issueFacets.totals[0] ?? {};
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : null);

  // Fill every day in range so the line chart has no gaps.
  const complaintsByDay = new Map((complaintFacets.byDay as Count[]).map((d) => [d._id, d.count]));
  const resolvedByDay = new Map((issueFacets.resolvedByDay as Count[]).map((d) => [d._id, d.count]));
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeline = Array.from({ length: days }, (_, i) => {
    const date = fmt.format(new Date(Date.now() - (days - 1 - i) * DAY));
    return { date, complaints: complaintsByDay.get(date) ?? 0, resolved: resolvedByDay.get(date) ?? 0 };
  });

  const byCategory = new Map((issueFacets.byCategory as (Count & { reports: number })[]).map((c) => [c._id, c]));
  const byDept = new Map<string, Record<string, number>>(
    (issueFacets.byDepartment as (Record<string, number> & { _id: string })[]).map((d) => [d._id, d]),
  );

  return {
    days,
    since,
    kpis: {
      complaints: ct.total ?? 0,
      issues: it.issues ?? 0,
      activeIssues: it.active ?? 0,
      resolvedIssues: it.resolved ?? 0,
      breachedIssues: it.breached ?? 0,
      duplicatesMerged: ct.merged ?? 0,
      dedupRate: pct(ct.merged ?? 0, (ct.total ?? 0) - (ct.spam ?? 0)),
      spamFiltered: ct.spam ?? 0,
      slaCompliance: pct(it.met ?? 0, (it.met ?? 0) + (it.missed ?? 0)),
      avgResolutionHours: it.avgResolutionHours != null ? Math.round(it.avgResolutionHours * 10) / 10 : null,
      aiOverrideRate: pct(it.overridden ?? 0, it.issues ?? 0),
      aiFallbackRate: pct(ct.aiFallback ?? 0, ct.total ?? 0),
      avgConfidence: ct.avgConfidence != null ? Math.round(ct.avgConfidence * 100) : null,
      avgAiLatencyMs: ct.avgLatencyMs != null ? Math.round(ct.avgLatencyMs) : null,
      withPhoto: ct.withPhoto ?? 0,
      withAudio: ct.withAudio ?? 0,
    },
    timeline,
    byCategory: CATEGORIES.map((c) => ({ category: c, issues: byCategory.get(c)?.count ?? 0, reports: byCategory.get(c)?.reports ?? 0 })).filter(
      (c) => c.issues > 0,
    ),
    byPriority: [5, 4, 3, 2, 1].map((p) => ({ priority: p, count: (issueFacets.byPriority as Count[]).find((x) => x._id === p)?.count ?? 0 })),
    byDepartment: DEPARTMENTS.map((d) => {
      const r = byDept.get(d);
      if (!r) return null;
      return {
        department: d,
        total: r.total,
        active: r.active,
        resolved: r.resolved,
        breached: r.breached,
        slaCompliance: pct(r.met, r.met + r.missed),
        avgResolutionHours: r.avgResolutionHours != null ? Math.round(r.avgResolutionHours * 10) / 10 : null,
      };
    }).filter(Boolean),
    byLanguage: (complaintFacets.byLanguage as Count[]).map((l) => ({ language: l._id, count: l.count })),
    bySentiment: (complaintFacets.bySentiment as Count[]).map((s) => ({ sentiment: s._id, count: s.count })),
    topIssues: (issueFacets.topIssues as Record<string, unknown>[]).map((t) => ({ ...t, id: String(t._id), _id: undefined })),
    points: (issueFacets.points as { _id: unknown; coords: number[]; [k: string]: unknown }[]).map(({ _id, coords, ...rest }) => ({
      id: String(_id),
      lat: coords[1],
      lng: coords[0],
      ...rest,
    })),
  };
}
