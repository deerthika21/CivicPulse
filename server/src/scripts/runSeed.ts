/**
 * npm run seed            → wipe + seed using precomputed triage (no Gemini quota used)
 * npm run seed -- --live  → wipe + seed, triaging every complaint with Gemini
 */
import mongoose from 'mongoose';
import { ensureVectorIndex } from '../config/atlasIndexes.js';
import { env } from '../config/env.js';
import { DEMO_PASSWORDS, seedDatabase } from './seed.js';

if (!env.MONGODB_URI) {
  console.error('MONGODB_URI is not set (server/.env).');
  process.exit(1);
}

const live = process.argv.includes('--live');
await mongoose.connect(env.MONGODB_URI);
console.log(`[seed] connected to "${mongoose.connection.name}" — this WIPES all CivicPulse data${live ? ' (live Gemini triage)' : ''}`);
await Promise.all(mongoose.modelNames().map((n) => mongoose.model(n).syncIndexes()));
const result = await seedDatabase({ live });
await ensureVectorIndex();
console.log('[seed] done', result);
console.log(`[seed] admin: admin@civicpulse.in / ${DEMO_PASSWORDS.admin}   officers: roads@ swm@ water@ drains@ electrical@ health@ townplanning@ environment@ parks@ general@ (…@civicpulse.in) / ${DEMO_PASSWORDS.officer}`);
await mongoose.disconnect();
