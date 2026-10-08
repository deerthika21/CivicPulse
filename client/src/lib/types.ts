/* Mirrors server/src/services/serialize.ts and controllers. */

export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'rejected';
export type SlaState = 'on_track' | 'at_risk' | 'breached' | 'met' | 'missed';
export type Role = 'officer' | 'admin';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Complaint {
  id: string;
  trackingCode: string;
  createdAt: string;
  text: string;
  transcript: string;
  translation: string;
  language: string;
  category: string;
  department: string;
  priority: number;
  priorityReason: string;
  summary: string;
  locationHint: string;
  sentiment: string;
  isSpam: boolean;
  spamReason: string;
  slaHours: number;
  confidence: number;
  aiModel: string;
  aiFallback: boolean;
  aiLatencyMs: number;
  location: LatLng;
  address: string;
  photoUrl: string | null;
  audioUrl: string | null;
  mergedAsDuplicate: boolean;
  duplicateSimilarity: number | null;
  duplicateDistanceM: number | null;
  duplicateMethod: string | null;
  issueId: string | null;
  citizen?: { name: string; phone: string };
}

export interface TimelineEntry {
  type: string;
  message: string;
  byName: string;
  at: string;
}

export interface Override {
  field: string;
  from: unknown;
  to: unknown;
  reason: string;
  byName: string;
  at: string;
}

export interface Issue {
  id: string;
  category: string;
  department: string;
  priority: number;
  priorityReason: string;
  summary: string;
  locationHint: string;
  location: LatLng;
  status: IssueStatus;
  reportCount: number;
  confidence: number;
  aiFallback: boolean;
  slaHours: number;
  slaDueAt: string;
  slaState: SlaState;
  resolvedAt: string | null;
  resolutionNote: string;
  lockedFields: string[];
  overrides: Override[];
  timeline: TimelineEntry[];
  createdAt: string;
  updatedAt: string;
  lastReportedAt: string;
}

export interface SubmitResponse {
  complaint: Complaint;
  issue: Issue | null;
  duplicate: { similarity: number; distanceM: number; method: string } | null;
}

export interface TrackResponse {
  complaint: Complaint;
  issue: Issue | null;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
}

export interface IssueList {
  items: Issue[];
  total: number;
  page: number;
  limit: number;
}

export interface QueueSummary {
  department: string | null;
  open: number;
  inProgress: number;
  critical: number;
  atRisk: number;
  breached: number;
  resolvedToday: number;
}

export interface IssueDetail {
  issue: Issue;
  complaints: Complaint[];
}

export interface Meta {
  categories: string[];
  departments: string[];
  categoryToDepartment: Record<string, string>;
  priorityRubric: Record<string, string>;
  slaHoursByPriority: Record<string, number>;
}

export interface PublicStats {
  complaints: number;
  resolvedIssues: number;
  activeIssues: number;
  duplicatesMerged: number;
  avgResolutionHours: number | null;
}

export interface Analytics {
  days: number;
  kpis: {
    complaints: number;
    issues: number;
    activeIssues: number;
    resolvedIssues: number;
    breachedIssues: number;
    duplicatesMerged: number;
    dedupRate: number | null;
    spamFiltered: number;
    slaCompliance: number | null;
    avgResolutionHours: number | null;
    aiOverrideRate: number | null;
    aiFallbackRate: number | null;
    avgConfidence: number | null;
    avgAiLatencyMs: number | null;
    withPhoto: number;
    withAudio: number;
  };
  timeline: { date: string; complaints: number; resolved: number }[];
  byCategory: { category: string; issues: number; reports: number }[];
  byPriority: { priority: number; count: number }[];
  byDepartment: {
    department: string;
    total: number;
    active: number;
    resolved: number;
    breached: number;
    slaCompliance: number | null;
    avgResolutionHours: number | null;
  }[];
  byLanguage: { language: string; count: number }[];
  bySentiment: { sentiment: string; count: number }[];
  topIssues: { id: string; summary: string; category: string; department: string; priority: number; reportCount: number; locationHint: string; slaState: SlaState }[];
  points: { id: string; lat: number; lng: number; priority: number; category: string; status: IssueStatus; reportCount: number; summary: string }[];
}

export interface Insight {
  _id: string;
  periodStart: string;
  periodEnd: string;
  headline: string;
  highlights: { title: string; detail: string; severity: 'info' | 'warning' | 'critical' }[];
  hotspots: { area: string; category: string; count: number }[];
  recommendations: string[];
  aiModel: string;
  aiFallback: boolean;
  createdAt: string;
}
