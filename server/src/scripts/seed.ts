import bcrypt from 'bcryptjs';
import { DEPARTMENTS, type Department } from '../constants/taxonomy.js';
import { Complaint } from '../models/Complaint.js';
import { Insight } from '../models/Insight.js';
import { Issue, type IssueDoc } from '../models/Issue.js';
import { Media } from '../models/Media.js';
import { User } from '../models/User.js';
import { submitComplaint } from '../services/complaint.service.js';
import { generateWeeklyInsight } from '../services/insight.service.js';
import { updateIssue } from '../services/issue.service.js';
import { computeSlaState, refreshSlaStates } from '../services/sla.service.js';
import { finaliseTriage } from '../services/triage.service.js';
import { AREAS, SEED_COMPLAINTS, type SeedComplaint } from './seedData.js';

const HOUR = 3_600_000;

export const DEMO_PASSWORDS = { admin: 'Admin@123', officer: 'Officer@123' };

const OFFICER_EMAIL: Record<Department, string> = {
  Roads: 'roads',
  'Solid Waste Mgmt': 'swm',
  'Water Board': 'water',
  'Storm Water Drains': 'drains',
  Electrical: 'electrical',
  Health: 'health',
  'Town Planning': 'townplanning',
  Environment: 'environment',
  Parks: 'parks',
  'General Admin': 'general',
};
const OFFICER_NAMES = ['R. Karthik', 'S. Lakshmi', 'M. Arun', 'K. Divya', 'P. Senthil', 'A. Meena', 'V. Prakash', 'N. Revathi', 'J. Suresh', 'G. Kavitha'];

function coordsFor(c: SeedComplaint): { lat: number; lng: number } {
  const [lat, lng] = AREAS[c.area];
  const [north, east] = c.offset ?? [0, 0];
  return { lat: lat + north / 111_320, lng: lng + east / 108_470 };
}

/** Deterministic pseudo-random in [0,1) so every seed run looks the same. */
function rand(i: number): number {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export async function seedDatabase({ live = false, log = console.log }: { live?: boolean; log?: (m: string) => void } = {}) {
  await Promise.all([User, Complaint, Issue, Media, Insight].map((m) => (m as typeof User).deleteMany()));
  log('[seed] cleared collections');

  // ---- users ----
  const [adminHash, officerHash] = await Promise.all([bcrypt.hash(DEMO_PASSWORDS.admin, 10), bcrypt.hash(DEMO_PASSWORDS.officer, 10)]);
  await User.create({ name: 'Commissioner (Admin)', email: 'admin@civicpulse.in', passwordHash: adminHash, role: 'admin' });
  const officerByDept = new Map<string, { id: string; name: string }>();
  for (const [i, dept] of DEPARTMENTS.entries()) {
    const u = await User.create({
      name: `${OFFICER_NAMES[i]}`,
      email: `${OFFICER_EMAIL[dept]}@civicpulse.in`,
      passwordHash: officerHash,
      role: 'officer',
      department: dept,
    });
    officerByDept.set(dept, { id: u._id.toString(), name: u.name });
  }
  log(`[seed] created 1 admin + ${DEPARTMENTS.length} officers`);

  // ---- complaints through the real pipeline (oldest first so duplicates merge in order) ----
  const now = Date.now();
  const ordered = [...SEED_COMPLAINTS].sort((a, b) => b.ago - a.ago);
  const firstSeedOfIssue = new Map<string, SeedComplaint>();
  let merged = 0;
  let spam = 0;
  for (const [i, c] of ordered.entries()) {
    const createdAt = new Date(now - c.ago * HOUR);
    const triage = live
      ? undefined
      : finaliseTriage(
          {
            language: c.lang,
            transcript: '',
            translation: c.tr,
            category: c.cat,
            priority: c.p,
            priorityReason: c.why,
            summary: c.sum,
            locationHint: c.hint,
            sentiment: c.sent,
            isSpam: Boolean(c.spam),
            spamReason: c.spam ?? '',
            slaHours: 0,
            confidence: c.spam ? 0.97 : Math.round((0.78 + rand(i) * 0.2) * 100) / 100,
          },
          { aiModel: 'seed', aiLatencyMs: Math.round(1100 + rand(i + 99) * 1500) },
        );
    const r = await submitComplaint({ text: c.text, ...coordsFor(c), address: c.hint, name: c.name }, { triage, createdAt });
    if (r.complaint.isSpam) spam++;
    else if (r.duplicate) merged++;
    else if (r.issue) firstSeedOfIssue.set(r.issue._id.toString(), c);
  }
  log(`[seed] ${ordered.length} complaints → ${firstSeedOfIssue.size} issues (${merged} merged as duplicates, ${spam} spam)`);

  // ---- workflow history: resolve / start / reject older issues ----
  for (const [i, issue] of (await Issue.find()).entries()) {
    const seed = firstSeedOfIssue.get(issue._id.toString());
    const ageH = (now - issue.createdAt.getTime()) / HOUR;
    const outcome = seed?.outcome ?? (ageH > 7 * 24 ? 'resolved' : 'open');
    if (outcome === 'open') continue;
    const officer = officerByDept.get(issue.department)!;
    applyOutcome(issue, outcome, officer.name, i, now);
    issue.slaState = computeSlaState(issue, new Date(now));
    await issue.save({ timestamps: false });
  }

  // ---- an officer override, so the audit trail has an example ----
  const park = await Issue.findOne({ category: 'Parks & Trees', priority: 1 });
  if (park) {
    const o = officerByDept.get('Parks')!;
    await updateIssue(
      { id: o.id, name: o.name, email: 'parks@civicpulse.in', role: 'officer', department: 'Parks' },
      park._id.toString(),
      { priority: 2, reason: "Rusty swings in a children's play area can cause cuts; raising priority." },
    );
  }

  await refreshSlaStates();
  const insight = await generateWeeklyInsight();
  log(`[seed] weekly insight generated (${insight.aiModel})`);

  return { complaints: ordered.length, issues: firstSeedOfIssue.size, merged, spam };
}

function applyOutcome(issue: IssueDoc, outcome: 'in_progress' | 'resolved' | 'rejected', officer: string, i: number, now: number) {
  const created = issue.createdAt.getTime();
  const startedAt = new Date(Math.min(now - HOUR, created + Math.max(1, issue.slaHours * 0.15) * HOUR));
  issue.timeline.push({ type: 'status_changed', message: 'Status open → in progress: Field crew assigned', byName: officer, at: startedAt });
  issue.status = 'in_progress';
  if (outcome === 'in_progress') return;

  // ~70% resolved within SLA, the rest late — gives analytics a realistic compliance figure.
  const factor = rand(i + 7) < 0.7 ? 0.3 + rand(i) * 0.6 : 1.1 + rand(i) * 0.8;
  const closedAt = new Date(Math.min(now - HOUR, created + issue.slaHours * factor * HOUR));
  const note =
    outcome === 'resolved'
      ? ['Work completed and verified on site.', 'Crew fixed the problem; photos uploaded to work order.', 'Cleared and area sanitised.'][i % 3]
      : 'Outside GCC jurisdiction — forwarded to the responsible agency.';
  issue.status = outcome;
  issue.resolvedAt = closedAt;
  issue.resolutionNote = note;
  issue.timeline.push({ type: 'status_changed', message: `Status in progress → ${outcome}: ${note}`, byName: officer, at: closedAt });
}
