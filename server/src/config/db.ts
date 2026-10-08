import mongoose from 'mongoose';
import { env } from './env.js';

const RETRY_DELAY_MS = 5000;

const STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

export function dbState(): string {
  return STATES[mongoose.connection.readyState] ?? 'unknown';
}

/**
 * Connects to MongoDB and keeps retrying in the background on failure,
 * so the API (and /api/health) stays up while Atlas is unreachable.
 */
export async function connectDb(onFirstConnect?: () => Promise<void>): Promise<void> {
  if (!env.MONGODB_URI) {
    console.warn('[db] MONGODB_URI not set — running without a database.');
    return;
  }

  mongoose.connection.on('connected', () => console.log(`[db] connected to "${mongoose.connection.name}"`));
  mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'));
  mongoose.connection.on('error', (err) => console.error('[db] error:', err.message));

  const attempt = async (): Promise<void> => {
    try {
      await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
      await onFirstConnect?.().catch((err) => console.error('[db] post-connect task failed', err));
    } catch (err) {
      console.error(`[db] connection failed: ${(err as Error).message}. Retrying in ${RETRY_DELAY_MS / 1000}s`);
      setTimeout(attempt, RETRY_DELAY_MS);
    }
  };

  await attempt();
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
