import { env } from '../config/env.js';
import { ACTIVE_STATUSES } from '../constants/taxonomy.js';
import { Complaint } from '../models/Complaint.js';
import { Insight } from '../models/Insight.js';
import { Issue } from '../models/Issue.js';
import { generateInsightWithAi, type InsightAi } from './insight.ai.js';

const DAY = 86_400_000;

type Count = { _id: string; count: number };

async function countBy(model: typeof Complaint | typeof Issue, match: object, field: string): Promise<Record<string, number>> {
  const rows = await (model as typeof Complaint).aggregate<Count>([{ $match: match }, { $group: { _id: `$${field}`, count: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map((r) => [r._id ?? 'unknown', r.count]));
}

/** Area name from a free-text location hint: last comma part, e.g. "Near X St, T Nagar" → "T Nagar". */
function areaOf(hint: string): string {
  const parts = hint.split(',').map((p) => p.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? '';
}

export async function buildWeeklyStats(periodEnd = new Date()) {
  const periodStart = new Date(periodEnd.getTime() - 7 * DAY);
  const prevStart = new Date(periodStart.getTime() - 7 * DAY);
  const week = { createdAt: { $gte: periodStart, $lt: periodEnd } };
  const prevWeek = { createdAt: { $gte: prevStart, $lt: periodStart } };

  const [thisWeekByCategory, lastWeekByCategory, byLanguage, bySentiment, deptActive, deptBreached, resolvedThisWeek, complaints, topIssues] =
    await Promise.all([
      countBy(Complaint, { ...week, isSpam: false }, 'category'),
      countBy(Complaint, { ...prevWeek, isSpam: false }, 'category'),
      countBy(Complaint, week, 'language'),
      countBy(Complaint, week, 'sentiment'),
      countBy(Issue, { status: { $in: ACTIVE_STATUSES } }, 'department'),
      countBy(Issue, { status: { $in: ACTIVE_STATUSES }, slaState: 'breached' }, 'department'),
      Issue.countDocuments({ status: 'resolved', resolvedAt: { $gte: periodStart, $lt: periodEnd } }),
      Complaint.find({ ...week, isSpam: false }).select('locationHint category').lean(),
      Issue.find({ status: { $in: ACTIVE_STATUSES } })
        .sort({ reportCount: -1, priority: -1 })
        .limit(8)
        .select('summary category department priority reportCount locationHint slaState')
        .lean(),
    ]);

  const hotspotCounts = new Map<string, { area: string; category: string; count: number }>();
  for (const c of complaints) {
    const area = areaOf(c.locationHint ?? '');
    if (!area) continue;
    const key = `${area}|${c.category}`;
    const cur = hotspotCounts.get(key) ?? { area, category: c.category, count: 0 };
    cur.count++;
    hotspotCounts.set(key, cur);
  }

  const total = Object.values(thisWeekByCategory).reduce((a, b) => a + b, 0);
  const prevTotal = Object.values(lastWeekByCategory).reduce((a, b) => a + b, 0);

  return {
    periodStart,
    periodEnd,
    stats: {
      complaintsThisWeek: total,
      complaintsLastWeek: prevTotal,
      thisWeekByCategory,
      lastWeekByCategory,
      byLanguage,
      bySentiment,
      activeIssuesByDepartment: deptActive,
      breachedIssuesByDepartment: deptBreached,
      resolvedThisWeek,
      hotspots: [...hotspotCounts.values()].sort((a, b) => b.count - a.count).slice(0, 8),
      mostReportedActiveIssues: topIssues.map(({ _id, ...i }) => i),
    },
  };
}

type WeeklyStats = Awaited<ReturnType<typeof buildWeeklyStats>>['stats'];

/** Rule-based insights so the admin page always has something useful without Gemini. */
export function fallbackInsight(s: WeeklyStats): InsightAi {
  const top = Object.entries(s.thisWeekByCategory).sort((a, b) => b[1] - a[1]);
  const change = s.complaintsLastWeek ? Math.round(((s.complaintsThisWeek - s.complaintsLastWeek) / s.complaintsLastWeek) * 100) : null;
  const worstDept = Object.entries(s.breachedIssuesByDepartment).sort((a, b) => b[1] - a[1])[0];
  const highlights: InsightAi['highlights'] = [
    {
      title: 'Complaint volume',
      detail: `${s.complaintsThisWeek} complaints this week${change !== null ? ` (${change >= 0 ? '+' : ''}${change}% vs last week)` : ''}; ${s.resolvedThisWeek} issues resolved.`,
      severity: change !== null && change > 25 ? 'warning' : 'info',
    },
  ];
  if (top[0]) highlights.push({ title: 'Top category', detail: `${top[0][0]} led with ${top[0][1]} complaints.`, severity: 'info' });
  if (worstDept) {
    highlights.push({ title: 'SLA breaches', detail: `${worstDept[0]} has ${worstDept[1]} active issues past their SLA deadline.`, severity: 'critical' });
  }
  return {
    headline: top[0] ? `${top[0][0]} dominated this week with ${top[0][1]} of ${s.complaintsThisWeek} complaints.` : 'Quiet week — no complaints recorded.',
    highlights,
    hotspots: s.hotspots.slice(0, 5),
    recommendations: [
      worstDept ? `Clear the ${worstDept[1]} breached ${worstDept[0]} issues first.` : 'Keep current response times.',
      s.hotspots[0] ? `Send an inspection team to ${s.hotspots[0].area} for ${s.hotspots[0].category}.` : 'Review open P4-P5 issues daily.',
    ],
  };
}

export async function generateWeeklyInsight(periodEnd = new Date()) {
  const { periodStart, stats } = await buildWeeklyStats(periodEnd);
  const ai = await generateInsightWithAi(stats);
  const content = ai ?? fallbackInsight(stats);
  return Insight.create({
    periodStart,
    periodEnd,
    ...content,
    stats,
    aiModel: ai ? env.GEMINI_MODEL : 'rules',
    aiFallback: !ai,
  });
}

export async function latestInsight() {
  return Insight.findOne().sort({ createdAt: -1 }).lean();
}
