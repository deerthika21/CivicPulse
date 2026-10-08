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

/** Status palette (dataviz reference): critical / serious / warning, then neutrals. Always shown with a "P#" label. */
export const PRIORITY_META: Record<number, { label: string; ta: string; color: string; badge: string }> = {
  5: { label: 'Critical', ta: 'அவசரம்', color: '#d03b3b', badge: 'bg-red-50 text-red-800 border-red-200' },
  4: { label: 'High', ta: 'உயர்', color: '#ec835a', badge: 'bg-orange-50 text-orange-800 border-orange-200' },
  3: { label: 'Medium', ta: 'நடுத்தர', color: '#fab219', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  2: { label: 'Low', ta: 'குறைவு', color: '#8a8984', badge: 'bg-slate-50 text-slate-700 border-slate-200' },
  1: { label: 'Cosmetic', ta: 'சிறியது', color: '#b5b4ae', badge: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export const STATUS_META: Record<IssueStatus, { label: string; ta: string; badge: string }> = {
  open: { label: 'Open', ta: 'திறந்தது', badge: 'bg-sky-50 text-sky-800 border-sky-200' },
  in_progress: { label: 'In progress', ta: 'நடைபெறுகிறது', badge: 'bg-violet-50 text-violet-800 border-violet-200' },
  resolved: { label: 'Resolved', ta: 'தீர்க்கப்பட்டது', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Closed', ta: 'மூடப்பட்டது', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const SLA_META: Record<SlaState, { label: string; badge: string }> = {
  on_track: { label: 'On track', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  at_risk: { label: 'At risk', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
  breached: { label: 'SLA breached', badge: 'bg-red-50 text-red-800 border-red-200' },
  met: { label: 'SLA met', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  missed: { label: 'SLA missed', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const CHENNAI_CENTER: [number, number] = [13.0475, 80.2209];
export const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** dataviz reference categorical slots 1-2 (light). */
export const SERIES = { one: '#2a78d6', two: '#eb6834' };
