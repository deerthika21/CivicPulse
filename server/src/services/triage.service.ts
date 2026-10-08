import { Type, type Part, type Schema } from '@google/genai';
import { z } from 'zod';
import { env } from '../config/env.js';
import {
  CATEGORIES,
  CATEGORY_TO_DEPARTMENT,
  LANGUAGES,
  PRIORITY_RUBRIC,
  SENTIMENTS,
  slaHoursFor,
  type Category,
  type Department,
} from '../constants/taxonomy.js';
import { AI_TIMEOUT_MS, gemini, parseJsonLoose } from './gemini.client.js';

export const TriageSchema = z.object({
  language: z.enum(LANGUAGES),
  transcript: z.string().default(''),
  translation: z.string().min(1),
  category: z.enum(CATEGORIES),
  priority: z.number().int().min(1).max(5),
  priorityReason: z.string().min(1),
  summary: z.string().min(1),
  locationHint: z.string().default(''),
  sentiment: z.enum(SENTIMENTS),
  isSpam: z.boolean(),
  spamReason: z.string().default(''),
  slaHours: z.number().positive(),
  confidence: z.number().min(0).max(1),
});
export type AiTriage = z.infer<typeof TriageSchema>;

export interface TriageResult extends AiTriage {
  department: Department;
  aiModel: string;
  aiFallback: boolean;
  aiLatencyMs: number;
}

export interface TriageInput {
  text: string;
  address?: string;
  photo?: { mimeType: string; data: Buffer };
  audio?: { mimeType: string; data: Buffer };
}

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    language: { type: Type.STRING, enum: [...LANGUAGES], description: 'Language of the citizen input. Tamil words in Latin script mixed with English = Tanglish.' },
    transcript: { type: Type.STRING, description: 'Verbatim transcript of the voice note in its original language; empty string if no audio.' },
    translation: { type: Type.STRING, description: 'Faithful English translation of the full complaint (text + voice + what the photo shows).' },
    category: { type: Type.STRING, enum: [...CATEGORIES] },
    priority: { type: Type.INTEGER, minimum: 1, maximum: 5 },
    priorityReason: { type: Type.STRING, description: 'One line explaining the priority using the rubric.' },
    summary: { type: Type.STRING, description: 'Neutral English summary for an officer, at most 20 words.' },
    locationHint: { type: Type.STRING, description: 'Street / landmark / area mentioned, e.g. "Near Ranganathan St, T Nagar". Empty if none.' },
    sentiment: { type: Type.STRING, enum: [...SENTIMENTS] },
    isSpam: { type: Type.BOOLEAN, description: 'True for gibberish, ads, abuse with no civic issue, tests, or clearly non-civic content.' },
    spamReason: { type: Type.STRING, description: 'Why it is spam; empty if not spam.' },
    slaHours: { type: Type.NUMBER, description: 'Suggested hours to resolve.' },
    confidence: { type: Type.NUMBER, minimum: 0, maximum: 1, description: 'Confidence in category + priority.' },
  },
  required: [
    'language', 'transcript', 'translation', 'category', 'priority', 'priorityReason', 'summary',
    'locationHint', 'sentiment', 'isSpam', 'spamReason', 'slaHours', 'confidence',
  ],
  propertyOrdering: [
    'language', 'transcript', 'translation', 'category', 'priority', 'priorityReason', 'summary',
    'locationHint', 'sentiment', 'isSpam', 'spamReason', 'slaHours', 'confidence',
  ],
};

const SYSTEM_INSTRUCTION = `You are the complaint triage officer for Greater Chennai Corporation (GCC), Tamil Nadu, India.
Citizens report civic problems in English, Tamil (தமிழ்), Hindi, or Tanglish (Tamil written in English letters mixed with English, e.g. "road la periya pallam iruku, bike la vizhunthutten").
Input may be text, a photo, and/or a voice note. Use ALL of them; the photo and voice can carry the main complaint.

Categories (pick exactly one): ${CATEGORIES.join(' | ')}.
- Roads & Potholes: potholes, damaged roads, broken footpaths, speed breakers.
- Garbage & Sanitation: uncollected garbage, overflowing bins, dumping, dead animals, public toilets.
- Water Supply: no water, low pressure, contaminated/muddy water, pipe leaks, Metro water lorry.
- Drainage & Sewage: blocked drains, sewage overflow, waterlogging, flooding, open manholes.
- Streetlights & Electricity: streetlights out, live/hanging wires, transformer sparks, poles.
- Public Health: mosquitoes/dengue, stray dog bites, food safety, disease outbreaks.
- Encroachment: shops/structures blocking footpath or road, illegal construction.
- Noise & Pollution: loudspeakers, burning garbage, construction dust, industrial smoke.
- Parks & Trees: fallen/dangerous trees, park maintenance, tree cutting.
- Other: anything civic that fits none of the above.

Priority rubric (1-5):
${Object.entries(PRIORITY_RUBRIC).sort(([a], [b]) => Number(b) - Number(a)).map(([p, d]) => `${p} = ${d}`).join('\n')}
Escalate when children, elderly, hospitals or schools are affected, or during monsoon flooding. Do not inflate priority because of angry tone.

Rules:
- Never invent facts. If the input is too vague, choose "Other", priority 2-3 and lower confidence.
- summary: neutral, factual, max 20 words, English.
- Spam = no genuine civic issue (ads, gibberish, jokes, personal disputes, test messages). Angry or abusive language about a REAL issue is NOT spam.
- Respond with JSON only, matching the schema.`;

function buildParts(input: TriageInput): Part[] {
  const parts: Part[] = [];
  const lines = [
    input.text ? `Citizen complaint text:\n"""${input.text.slice(0, 4000)}"""` : 'No text provided.',
    input.address ? `Address chosen on map: ${input.address}` : '',
    input.audio ? 'A voice note is attached; transcribe it into "transcript".' : '',
    input.photo ? 'A photo is attached; use what it shows.' : '',
  ].filter(Boolean);
  parts.push({ text: lines.join('\n\n') });
  if (input.photo) parts.push({ inlineData: { mimeType: input.photo.mimeType, data: input.photo.data.toString('base64') } });
  if (input.audio) parts.push({ inlineData: { mimeType: input.audio.mimeType.split(';')[0], data: input.audio.data.toString('base64') } });
  return parts;
}

function truncateWords(s: string, n: number): string {
  const words = s.trim().split(/\s+/).filter(Boolean);
  return words.length <= n ? words.join(' ') : `${words.slice(0, n).join(' ')}…`;
}

export function fallbackTriage(input: TriageInput, reason: string): TriageResult {
  const text = input.text?.trim() || (input.audio ? 'Voice note complaint (not transcribed)' : 'Photo complaint');
  return {
    language: 'Other',
    transcript: '',
    translation: text,
    category: 'Other',
    priority: 3,
    priorityReason: `AI triage unavailable (${reason}); default priority pending officer review.`,
    summary: truncateWords(text, 20),
    locationHint: input.address ?? '',
    sentiment: 'neutral',
    isSpam: false,
    spamReason: '',
    slaHours: slaHoursFor(3),
    confidence: 0,
    department: CATEGORY_TO_DEPARTMENT.Other,
    aiModel: 'fallback',
    aiFallback: true,
    aiLatencyMs: 0,
  };
}

/** Finalises a validated AI triage: department from our own map, SLA clamped to policy. */
export function finaliseTriage(ai: AiTriage, meta: { aiModel: string; aiLatencyMs: number; aiFallback?: boolean }): TriageResult {
  const category = ai.category as Category;
  return {
    ...ai,
    summary: truncateWords(ai.summary, 24),
    slaHours: slaHoursFor(ai.priority, ai.slaHours),
    department: CATEGORY_TO_DEPARTMENT[category],
    aiModel: meta.aiModel,
    aiFallback: meta.aiFallback ?? false,
    aiLatencyMs: meta.aiLatencyMs,
  };
}

/**
 * Triage a complaint with Gemini structured output.
 * Validates with zod, retries once, and never throws: falls back to Other / P3.
 */
export async function triageComplaint(input: TriageInput): Promise<TriageResult> {
  const ai = gemini();
  if (!ai) return fallbackTriage(input, 'no API key configured');

  const started = Date.now();
  let lastError = 'unknown error';
  let current = input;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: [{ role: 'user', parts: buildParts(current) }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.1,
          httpOptions: { timeout: AI_TIMEOUT_MS },
        },
      });
      const parsed = TriageSchema.parse(parseJsonLoose(res.text));
      return finaliseTriage(parsed, { aiModel: env.GEMINI_MODEL, aiLatencyMs: Date.now() - started });
    } catch (err) {
      lastError = err instanceof z.ZodError ? 'invalid AI output' : (err as Error).message;
      console.warn(`[triage] attempt ${attempt} failed: ${lastError}`);
      // If the model rejected an attachment (corrupt photo, unsupported audio codec), retry without it.
      if (/mime|unsupported|invalid argument|unable to process|400/i.test(lastError)) {
        const blamesImage = /image|photo/i.test(lastError);
        if (current.photo && (blamesImage || !current.audio) && (current.text || current.audio)) {
          current = { ...current, photo: undefined };
        } else if (current.audio && (current.text || current.photo)) {
          current = { ...current, audio: undefined };
        }
      }
    }
  }
  return fallbackTriage(input, lastError.slice(0, 80));
}
