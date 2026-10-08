/**
 * Zero-setup local mode: starts an in-memory MongoDB, seeds it, then boots the API.
 * Data is lost when the process exits. Use `npm run dev` with Atlas for real work.
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri('civicpulse');
console.log('[memory] in-memory MongoDB started');

const mongoose = (await import('mongoose')).default;
const { seedDatabase, DEMO_PASSWORDS } = await import('./seed.js');
await mongoose.connect(process.env.MONGODB_URI);
await Promise.all(mongoose.modelNames().map((n) => mongoose.model(n).syncIndexes()));
await seedDatabase();
await mongoose.disconnect();
console.log(`[memory] seeded. Login: admin@civicpulse.in / ${DEMO_PASSWORDS.admin}, roads@civicpulse.in / ${DEMO_PASSWORDS.officer}`);

await import('../index.js');

const stop = async () => {
  await mongod.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
