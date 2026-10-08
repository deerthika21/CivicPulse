import { env } from './env.js';
import { Issue } from '../models/Issue.js';
import { EMBEDDING_DIMS } from '../services/embedding.service.js';

export const VECTOR_INDEX_DEFINITION = {
  fields: [
    { type: 'vector', path: 'embedding', numDimensions: EMBEDDING_DIMS, similarity: 'cosine' },
    { type: 'filter', path: 'category' },
    { type: 'filter', path: 'status' },
    { type: 'filter', path: 'embeddingModel' },
  ],
};

/**
 * Creates the Atlas Vector Search index on `issues` if it's missing.
 * Silently skipped on non-Atlas MongoDB (local / memory server) — the cosine fallback covers it.
 */
export async function ensureVectorIndex(): Promise<void> {
  try {
    const existing = await Issue.collection.listSearchIndexes(env.ATLAS_VECTOR_INDEX).toArray();
    if (existing.length) return;
    await Issue.collection.createSearchIndex({ name: env.ATLAS_VECTOR_INDEX, type: 'vectorSearch', definition: VECTOR_INDEX_DEFINITION });
    console.log(`[db] created Atlas Vector Search index "${env.ATLAS_VECTOR_INDEX}" (takes ~1 min to become queryable)`);
  } catch (err) {
    console.warn(`[db] vector index not ensured (${(err as Error).message.slice(0, 100)}); using cosine fallback`);
  }
}
