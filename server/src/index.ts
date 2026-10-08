import { createApp } from './app.js';
import { ensureVectorIndex } from './config/atlasIndexes.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';
import { startScheduler } from './jobs/scheduler.js';
import { refreshSlaStates } from './services/sla.service.js';

async function main() {
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`[server] CivicPulse API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  // Don't block startup on Mongo: health check should respond even while connecting.
  void connectDb(async () => {
    await ensureVectorIndex();
    await refreshSlaStates();
  });
  startScheduler();

  const shutdown = async (signal: string) => {
    console.log(`[server] ${signal} received, shutting down`);
    server.close();
    await disconnectDb().catch(() => undefined);
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[server] fatal startup error', err);
  process.exit(1);
});
