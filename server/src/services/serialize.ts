import type { Types } from 'mongoose';
import { computeSlaState } from './sla.service.js';

/* Shapes the API returns. Keep in sync with client/src/lib/types.ts. */

type AnyDoc = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

const mediaUrl = (id?: Types.ObjectId | null) => (id ? `/api/media/${id.toString()}` : null);
const latLng = (loc?: { coordinates: number[] }) => (loc ? { lat: loc.coordinates[1], lng: loc.coordinates[0] } : null);

export function serializeComplaint(c: AnyDoc, opts: { includeCitizen?: boolean } = {}) {
  return {
    id: c._id.toString(),
    trackingCode: c.trackingCode,
    createdAt: c.createdAt,
    text: c.text,
    transcript: c.transcript,
    translation: c.translation,
    language: c.language,
    category: c.category,
    department: c.department,
    priority: c.priority,
    priorityReason: c.priorityReason,
    summary: c.summary,
    locationHint: c.locationHint,
    sentiment: c.sentiment,
    isSpam: c.isSpam,
    spamReason: c.spamReason,
    slaHours: c.slaHours,
    confidence: c.confidence,
    aiModel: c.aiModel,
    aiFallback: c.aiFallback,
    aiLatencyMs: c.aiLatencyMs,
    location: latLng(c.location),
    address: c.address,
    photoUrl: mediaUrl(c.photo),
    audioUrl: mediaUrl(c.audio),
    mergedAsDuplicate: c.mergedAsDuplicate,
    duplicateSimilarity: c.duplicateSimilarity ?? null,
    duplicateDistanceM: c.duplicateDistanceM ?? null,
    duplicateMethod: c.duplicateMethod ?? null,
    issueId: c.issue ? (c.issue._id ?? c.issue).toString() : null,
    ...(opts.includeCitizen ? { citizen: c.citizen } : {}),
  };
}

export function serializeIssue(i: AnyDoc) {
  return {
    id: i._id.toString(),
    category: i.category,
    department: i.department,
    priority: i.priority,
    priorityReason: i.priorityReason,
    summary: i.summary,
    locationHint: i.locationHint,
    location: latLng(i.location),
    status: i.status,
    reportCount: i.reportCount,
    confidence: i.confidence,
    aiFallback: i.aiFallback,
    slaHours: i.slaHours,
    slaDueAt: i.slaDueAt,
    slaState: computeSlaState(i as never),
    resolvedAt: i.resolvedAt ?? null,
    resolutionNote: i.resolutionNote ?? '',
    lockedFields: i.lockedFields ?? [],
    overrides: (i.overrides ?? []).map((o: AnyDoc) => ({ field: o.field, from: o.from, to: o.to, reason: o.reason, byName: o.byName, at: o.at })),
    timeline: i.timeline ?? [],
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
    lastReportedAt: i.lastReportedAt,
  };
}
