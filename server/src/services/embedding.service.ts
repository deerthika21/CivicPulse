import { createHash } from 'node:crypto';
import { env } from '../config/env.js';
import { AI_TIMEOUT_MS, gemini } from './gemini.client.js';

export const EMBEDDING_DIMS = 768;
const LOCAL_DIMS = 256;
export const LOCAL_EMBEDDING_MODEL = 'local-hash-v1';

export interface Embedding {
  values: number[];
  model: string;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

const STOPWORDS = new Set(
  'a an the is are was were be been of in on at to for from and or but with near this that there here it its my our we i you they very please sir madam since days day still not no has have had by as'.split(' '),
);

/**
 * Deterministic hashed bag-of-words embedding. Only used when Gemini is
 * unavailable, so duplicate detection still works offline / in demos.
 * Embeddings are only ever compared against the same `model`.
 */
export function localEmbedding(text: string): Embedding {
  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map((t) => t.replace(/(ing|ed|es|s)$/, ''));
  const v = new Array<number>(LOCAL_DIMS).fill(0);
  for (const f of new Set(tokens)) {
    const h = createHash('md5').update(f).digest();
    const idx = h.readUInt16BE(0) % LOCAL_DIMS;
    v[idx] += h[2] & 1 ? 1 : -1;
  }
  return { values: v, model: LOCAL_EMBEDDING_MODEL };
}

/** Embeds text with Gemini (retry once), falling back to the local hashed embedding. */
export async function embedText(text: string): Promise<Embedding> {
  const ai = gemini();
  const input = text.slice(0, 2000);
  if (ai) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await ai.models.embedContent({
          model: env.GEMINI_EMBEDDING_MODEL,
          contents: input,
          config: { taskType: 'SEMANTIC_SIMILARITY', outputDimensionality: EMBEDDING_DIMS, httpOptions: { timeout: AI_TIMEOUT_MS } },
        });
        const values = res.embeddings?.[0]?.values;
        if (values?.length) return { values, model: `${env.GEMINI_EMBEDDING_MODEL}@${EMBEDDING_DIMS}` };
        throw new Error('empty embedding');
      } catch (err) {
        console.warn(`[embed] attempt ${attempt} failed: ${(err as Error).message}`);
      }
    }
  }
  return localEmbedding(input);
}
