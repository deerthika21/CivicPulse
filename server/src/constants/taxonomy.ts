export const CATEGORIES = [
  'Roads & Potholes',
  'Garbage & Sanitation',
  'Water Supply',
  'Drainage & Sewage',
  'Streetlights & Electricity',
  'Public Health',
  'Encroachment',
  'Noise & Pollution',
  'Parks & Trees',
  'Other',
] as const;
export type Category = (typeof CATEGORIES)[number];

export const DEPARTMENTS = [
  'Roads',
  'Solid Waste Mgmt',
  'Water Board',
  'Storm Water Drains',
  'Electrical',
  'Health',
  'Town Planning',
  'Environment',
  'Parks',
  'General Admin',
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const CATEGORY_TO_DEPARTMENT: Record<Category, Department> = {
  'Roads & Potholes': 'Roads',
  'Garbage & Sanitation': 'Solid Waste Mgmt',
  'Water Supply': 'Water Board',
  'Drainage & Sewage': 'Storm Water Drains',
  'Streetlights & Electricity': 'Electrical',
  'Public Health': 'Health',
  Encroachment: 'Town Planning',
  'Noise & Pollution': 'Environment',
  'Parks & Trees': 'Parks',
  Other: 'General Admin',
};

export const PRIORITY_RUBRIC: Record<number, string> = {
  5: 'Danger to life (live wire, open manhole, flooding)',
  4: 'Health/safety risk to many',
  3: 'Significant inconvenience',
  2: 'Minor',
  1: 'Cosmetic / suggestion',
};

/** Default SLA (hours) per priority; AI may suggest a value, clamped to [min, max] around this. */
export const SLA_HOURS_BY_PRIORITY: Record<number, number> = { 5: 4, 4: 24, 3: 72, 2: 168, 1: 336 };

export const LANGUAGES = ['English', 'Tamil', 'Hindi', 'Tanglish', 'Other'] as const;
export type Language = (typeof LANGUAGES)[number];

export const SENTIMENTS = ['angry', 'frustrated', 'concerned', 'neutral', 'positive'] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export const ISSUE_STATUSES = ['open', 'in_progress', 'resolved', 'rejected'] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export const ACTIVE_STATUSES: IssueStatus[] = ['open', 'in_progress'];

export const SLA_STATES = ['on_track', 'at_risk', 'breached', 'met', 'missed'] as const;
export type SlaState = (typeof SLA_STATES)[number];

export const ROLES = ['officer', 'admin'] as const;
export type Role = (typeof ROLES)[number];

export function slaHoursFor(priority: number, aiSuggested?: number): number {
  const base = SLA_HOURS_BY_PRIORITY[priority] ?? 72;
  if (!aiSuggested || !Number.isFinite(aiSuggested)) return base;
  // Let the AI tighten/loosen within 0.5x–1.5x of policy so it can't produce absurd SLAs.
  return Math.round(Math.min(base * 1.5, Math.max(base * 0.5, aiSuggested)));
}
