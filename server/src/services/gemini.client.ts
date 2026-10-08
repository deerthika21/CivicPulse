import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

let client: GoogleGenAI | null = null;

/** Lazily-created shared Gemini client; null when no API key is configured. */
export function gemini(): GoogleGenAI | null {
  if (!env.GEMINI_API_KEY) return null;
  client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return client;
}

export const AI_TIMEOUT_MS = 30_000;

/** Strips ```json fences some models still add, then parses. */
export function parseJsonLoose(text: string | undefined): unknown {
  if (!text) throw new Error('Empty AI response');
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
  return JSON.parse(cleaned);
}
