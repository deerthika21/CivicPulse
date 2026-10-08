import {
  Building2,
  CircleHelp,
  Droplets,
  HeartPulse,
  Lightbulb,
  Trash2,
  TreePine,
  Volume2,
  Waves,
  Construction,
  type LucideIcon,
} from 'lucide-react';
import type { IssueStatus, SlaState } from './types';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'Roads & Potholes': Construction,
  'Garbage & Sanitation': Trash2,
  'Water Supply': Droplets,
  'Drainage & Sewage': Waves,
  'Streetlights & Electricity': Lightbulb,
  'Public Health': HeartPulse,
  Encroachment: Building2,
  'Noise & Pollution': Volume2,
  'Parks & Trees': TreePine,
  Other: CircleHelp,
};

/** Priority: soft tinted pill + dot. Always shown with a "P#" label, never colour alone. */
export const PRIORITY_META: Record<number, { label: string; ta: string; color: string; badge: string }> = {
  5: { label: 'Critical', ta: 'அவசரம்', color: '#dc2626', badge: 'bg-red-50 text-red-700 ring-red-600/20' },
  4: { label: 'High', ta: 'உயர்', color: '#f97316', badge: 'bg-orange-50 text-orange-700 ring-orange-500/25' },
  3: { label: 'Medium', ta: 'நடுத்தர', color: '#f59e0b', badge: 'bg-amber-50 text-amber-700 ring-amber-500/25' },
  2: { label: 'Low', ta: 'குறைவு', color: '#0ea5e9', badge: 'bg-sky-50 text-sky-700 ring-sky-500/25' },
  1: { label: 'Cosmetic', ta: 'சிறியது', color: '#94a3b8', badge: 'bg-slate-50 text-slate-600 ring-slate-400/30' },
};

export const STATUS_META: Record<IssueStatus, { label: string; ta: string; badge: string; dot: string }> = {
  open: { label: 'Open', ta: 'திறந்தது', badge: 'bg-brand-50 text-brand-800 ring-brand-500/20', dot: 'bg-brand-500' },
  in_progress: { label: 'In progress', ta: 'நடைபெறுகிறது', badge: 'bg-violet-50 text-violet-700 ring-violet-500/20', dot: 'bg-violet-500' },
  resolved: { label: 'Resolved', ta: 'தீர்க்கப்பட்டது', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', dot: 'bg-emerald-500' },
  rejected: { label: 'Closed', ta: 'மூடப்பட்டது', badge: 'bg-slate-100 text-slate-600 ring-slate-400/25', dot: 'bg-slate-400' },
};

export const SLA_META: Record<SlaState, { label: string; badge: string }> = {
  on_track: { label: 'On track', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  at_risk: { label: 'At risk', badge: 'bg-amber-50 text-amber-700 ring-amber-500/30' },
  breached: { label: 'SLA breached', badge: 'bg-red-600 text-white ring-red-600' },
  met: { label: 'SLA met', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  missed: { label: 'SLA missed', badge: 'bg-slate-100 text-slate-600 ring-slate-400/25' },
};

export const CHENNAI_CENTER: [number, number] = [13.0475, 80.2209];
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Chart series from the theme (validated: CVD ΔE 22, contrast ≥ 3:1 on white). */
export const SERIES = { one: '#4F46E5', two: '#0D9488' };
