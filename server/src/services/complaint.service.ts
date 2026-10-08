import { Types } from 'mongoose';
import { slaHoursFor } from '../constants/taxonomy.js';
import { Complaint, type ComplaintDoc } from '../models/Complaint.js';
import { Issue, type IssueDoc } from '../models/Issue.js';
import { Media } from '../models/Media.js';
import { newTrackingCode } from '../utils/ids.js';
import { findDuplicateIssue, type DuplicateMatch } from './duplicate.service.js';
import { embedText } from './embedding.service.js';
import { computeSlaState } from './sla.service.js';
import { triageComplaint, type TriageResult } from './triage.service.js';

const HOUR = 3_600_000;
/** Community escalation: this many reports bump priority by one (up to 4; 5 is reserved for danger-to-life). */
const ESCALATE_AT_REPORTS = 5;

export interface UploadedFile {
  mimeType: string;
  data: Buffer;
}

export interface SubmitInput {
  text: string;
  lat: number;
  lng: number;
  address?: string;
  name?: string;
  phone?: string;
  photo?: UploadedFile;
  audio?: UploadedFile;
}

export interface SubmitOptions {
  /** Pre-computed triage (seed script). */
  triage?: TriageResult;
  /** Backdate (seed script). */
  createdAt?: Date;
}

export interface SubmitResult {
  complaint: ComplaintDoc;
  issue: IssueDoc | null;
  duplicate: DuplicateMatch | null;
}

async function uniqueTrackingCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = newTrackingCode();
    if (!(await Complaint.exists({ trackingCode: code }))) return code;
  }
  throw new Error('Could not allocate tracking code');
}

export function embeddingTextFor(t: Pick<TriageResult, 'translation' | 'summary'>): string {
  return `${t.summary}\n${t.translation}`;
}

/**
 * Full pipeline: store media → Gemini triage → embed → duplicate search →
 * create a new Issue or merge into an existing one.
 */
export async function submitComplaint(input: SubmitInput, opts: SubmitOptions = {}): Promise<SubmitResult> {
  const createdAt = opts.createdAt ?? new Date();
  const coordinates: [number, number] = [input.lng, input.lat];

  const [photo, audio] = await Promise.all([
    input.photo ? Media.create({ kind: 'photo', mimeType: input.photo.mimeType, size: input.photo.data.length, data: input.photo.data }) : null,
    input.audio ? Media.create({ kind: 'audio', mimeType: input.audio.mimeType, size: input.audio.data.length, data: input.audio.data }) : null,
  ]);

  const triage = opts.triage ?? (await triageComplaint({ text: input.text, address: input.address, photo: input.photo, audio: input.audio }));

  const complaint = new Complaint({
    _id: new Types.ObjectId(),
    trackingCode: await uniqueTrackingCode(),
    text: input.text,
    photo: photo?._id,
    audio: audio?._id,
    location: { type: 'Point', coordinates },
    address: input.address ?? '',
    citizen: { name: input.name ?? '', phone: input.phone ?? '' },
    language: triage.language,
    transcript: triage.transcript,
    translation: triage.translation,
    category: triage.category,
    department: triage.department,
    priority: triage.priority,
    priorityReason: triage.priorityReason,
    summary: triage.summary,
    locationHint: triage.locationHint,
    sentiment: triage.sentiment,
    isSpam: triage.isSpam,
    spamReason: triage.spamReason,
    slaHours: triage.slaHours,
    confidence: triage.confidence,
    aiModel: triage.aiModel,
    aiFallback: triage.aiFallback,
    aiLatencyMs: triage.aiLatencyMs,
    createdAt,
    updatedAt: createdAt,
  });

  // Spam is stored for audit but never enters a department queue.
  if (triage.isSpam) {
    await complaint.save({ timestamps: false });
    return { complaint, issue: null, duplicate: null };
  }

  const embedding = await embedText(embeddingTextFor(triage));
  complaint.embedding = embedding.values;
  complaint.embeddingModel = embedding.model;

  const duplicate = await findDuplicateIssue({ embedding, category: triage.category, coordinates });

  let issue = duplicate ? await mergeIntoIssue(duplicate, complaint, triage, createdAt) : null;
  if (duplicate && issue) {
    complaint.mergedAsDuplicate = true;
    complaint.duplicateSimilarity = Number(duplicate.similarity.toFixed(4));
    complaint.duplicateDistanceM = duplicate.distanceM;
    complaint.duplicateMethod = duplicate.method;
  }

  if (!issue) {
    const slaHours = triage.slaHours;
    issue = new Issue({
      category: triage.category,
      department: triage.department,
      priority: triage.priority,
      priorityReason: triage.priorityReason,
      summary: triage.summary,
      locationHint: triage.locationHint || input.address || '',
      location: { type: 'Point', coordinates },
      complaints: [complaint._id],
      confidence: triage.confidence,
      aiFallback: triage.aiFallback,
      slaHours,
      slaDueAt: new Date(createdAt.getTime() + slaHours * HOUR),
      embedding: embedding.values,
      embeddingModel: embedding.model,
      lastReportedAt: createdAt,
      timeline: [
        {
          type: 'created',
          message: `Reported and routed to ${triage.department} (P${triage.priority}${triage.aiFallback ? ', AI fallback' : ''})`,
          at: createdAt,
        },
      ],
      createdAt,
      updatedAt: createdAt,
    });
    issue.slaState = computeSlaState(issue);
    await issue.save({ timestamps: false });
  }

  complaint.issue = issue._id;
  await complaint.save({ timestamps: false });
  return { complaint, issue, duplicate };
}

async function mergeIntoIssue(
  match: DuplicateMatch,
  complaint: ComplaintDoc,
  triage: TriageResult,
  at: Date,
): Promise<IssueDoc | null> {
  const issue = await Issue.findById(match.issueId);
  if (!issue) return null;

  issue.reportCount += 1;
  issue.complaints.push(complaint._id);
  issue.lastReportedAt = at;
  issue.timeline.push({
    type: 'duplicate_merged',
    message: `New report ${complaint.trackingCode} merged (${Math.round(match.similarity * 100)}% similar, ${match.distanceM} m away). Total reports: ${issue.reportCount}`,
    at,
  });

  const priorityLocked = issue.lockedFields.includes('priority');
  let newPriority = issue.priority;
  let reason = '';
  if (!priorityLocked && triage.priority > issue.priority) {
    newPriority = triage.priority;
    reason = `New report indicates higher severity: ${triage.priorityReason}`;
  } else if (!priorityLocked && issue.reportCount === ESCALATE_AT_REPORTS && issue.priority < 4) {
    newPriority = issue.priority + 1;
    reason = `${ESCALATE_AT_REPORTS} citizens reported this issue — community escalation`;
  }
  if (newPriority !== issue.priority) {
    issue.timeline.push({ type: 'priority_escalated', message: `Priority P${issue.priority} → P${newPriority}. ${reason}`, at });
    issue.priority = newPriority;
    issue.priorityReason = reason;
    issue.slaHours = slaHoursFor(newPriority);
    const tightened = new Date(issue.createdAt.getTime() + issue.slaHours * HOUR);
    if (tightened < issue.slaDueAt) issue.slaDueAt = tightened;
  }
  issue.slaState = computeSlaState(issue);
  issue.updatedAt = at;
  await issue.save({ timestamps: false });
  return issue;
}
