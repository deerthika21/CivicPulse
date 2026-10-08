import type { QueryFilter, Types } from 'mongoose';
import { env } from '../config/env.js';
import { ACTIVE_STATUSES } from '../constants/taxonomy.js';
import { Issue, type IssueAttrs } from '../models/Issue.js';
import { haversineMeters, radiusToRadians } from '../utils/geo.js';
import { cosineSimilarity, LOCAL_EMBEDDING_MODEL, type Embedding } from './embedding.service.js';

export interface DuplicateMatch {
  issueId: Types.ObjectId;
  similarity: number;
  distanceM: number;
  method: 'vector_search' | 'cosine_fallback';
}

interface Candidate {
  _id: Types.ObjectId;
  embedding?: number[];
  location: { coordinates: number[] };
}

interface Query {
  embedding: Embedding;
  category: string;
  coordinates: [number, number]; // [lng, lat]
}

let vectorSearchPausedUntil = 0;

function bestMatch(candidates: Candidate[], q: Query, method: DuplicateMatch['method']): DuplicateMatch | null {
  let best: DuplicateMatch | null = null;
  for (const c of candidates) {
    if (!c.embedding?.length) continue;
    const distanceM = haversineMeters(q.coordinates, c.location.coordinates);
    if (distanceM > env.DUPLICATE_RADIUS_METERS) continue;
    const similarity = cosineSimilarity(q.embedding.values, c.embedding);
    if (similarity <= env.DUPLICATE_SIMILARITY_THRESHOLD) continue;
    if (!best || similarity > best.similarity) best = { issueId: c._id, similarity, distanceM: Math.round(distanceM), method };
  }
  return best;
}

/** Atlas Vector Search (semantic), then geo/category check in code. */
async function viaVectorSearch(q: Query): Promise<DuplicateMatch | null> {
  if (q.embedding.model === LOCAL_EMBEDDING_MODEL || Date.now() < vectorSearchPausedUntil) return null;
  try {
    const candidates = await Issue.aggregate<Candidate>([
      {
        $vectorSearch: {
          index: env.ATLAS_VECTOR_INDEX,
          path: 'embedding',
          queryVector: q.embedding.values,
          numCandidates: 150,
          limit: 15,
          filter: { category: q.category, status: { $in: ACTIVE_STATUSES }, embeddingModel: q.embedding.model },
        },
      },
      { $project: { embedding: 1, location: 1 } },
    ]);
    return bestMatch(candidates, q, 'vector_search');
  } catch (err) {
    // Not on Atlas / index missing: pause attempts for 10 minutes and use the fallback.
    vectorSearchPausedUntil = Date.now() + 10 * 60_000;
    console.warn(`[duplicates] $vectorSearch unavailable, using cosine fallback: ${(err as Error).message.slice(0, 120)}`);
    return null;
  }
}

/** 2dsphere radius query + same category, cosine similarity computed in code. */
async function viaCosineFallback(q: Query): Promise<DuplicateMatch | null> {
  const filter: Record<string, unknown> = {
    category: q.category,
    status: { $in: ACTIVE_STATUSES },
    embeddingModel: q.embedding.model,
    location: { $geoWithin: { $centerSphere: [q.coordinates, radiusToRadians(env.DUPLICATE_RADIUS_METERS)] } },
  };
  const candidates = await Issue.find(filter as QueryFilter<IssueAttrs>)
    .select('+embedding location')
    .limit(100)
    .lean<Candidate[]>();
  return bestMatch(candidates, q, 'cosine_fallback');
}

/**
 * Finds an active Issue that this complaint duplicates:
 * similarity > threshold AND within radius AND same category.
 * An empty vector-search result can also mean the index doesn't exist (Atlas
 * returns no error), so the geo fallback always runs when no match is found.
 */
export async function findDuplicateIssue(q: Query): Promise<DuplicateMatch | null> {
  return (await viaVectorSearch(q)) ?? (await viaCosineFallback(q));
}
