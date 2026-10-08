import { Type, type Schema } from '@google/genai';
import { z } from 'zod';
import { env } from '../config/env.js';
import { AI_TIMEOUT_MS, gemini, parseJsonLoose } from './gemini.client.js';

export const InsightAiSchema = z.object({
  headline: z.string().min(1),
  highlights: z
    .array(z.object({ title: z.string().min(1), detail: z.string().min(1), severity: z.enum(['info', 'warning', 'critical']) }))
    .min(1)
    .max(6),
  hotspots: z.array(z.object({ area: z.string(), category: z.string(), count: z.number() })).max(5),
  recommendations: z.array(z.string().min(1)).min(1).max(5),
});
export type InsightAi = z.infer<typeof InsightAiSchema>;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    headline: { type: Type.STRING, description: 'One-sentence headline for the week.' },
    highlights: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          detail: { type: Type.STRING, description: 'One or two sentences with concrete numbers.' },
          severity: { type: Type.STRING, enum: ['info', 'warning', 'critical'] },
        },
        required: ['title', 'detail', 'severity'],
      },
    },
    hotspots: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: { area: { type: Type.STRING }, category: { type: Type.STRING }, count: { type: Type.INTEGER } },
        required: ['area', 'category', 'count'],
      },
    },
    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['headline', 'highlights', 'hotspots', 'recommendations'],
};

/** Asks Gemini to turn weekly stats into insights. Returns null on failure (caller falls back). */
export async function generateInsightWithAi(stats: unknown): Promise<InsightAi | null> {
  const ai = gemini();
  if (!ai) return null;
  const prompt = `You are a data analyst for Greater Chennai Corporation's grievance cell.
Below are last week's complaint statistics (JSON). Write insights for the Commissioner:
- headline: the single most important takeaway.
- 3-5 highlights with concrete numbers (trends vs previous week, SLA breaches, departments falling behind, spikes).
- up to 5 hotspots (area + category + count) using the locationHints/areas given.
- 3-5 short, actionable recommendations (which department, what action, where).
Only use facts present in the data.

DATA:
${JSON.stringify(stats).slice(0, 30000)}`;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await ai.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0.3,
          httpOptions: { timeout: AI_TIMEOUT_MS * 2 },
        },
      });
      return InsightAiSchema.parse(parseJsonLoose(res.text));
    } catch (err) {
      console.warn(`[insights] attempt ${attempt} failed: ${(err as Error).message}`);
    }
  }
  return null;
}
