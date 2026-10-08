import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),

  MONGODB_URI: z.string().default(''),
  ATLAS_VECTOR_INDEX: z.string().default('complaint_embedding_index'),

  GEMINI_API_KEY: z.string().default(''),
  GEMINI_MODEL: z.string().default('gemini-flash-latest'),
  GEMINI_EMBEDDING_MODEL: z.string().default('gemini-embedding-001'),

  JWT_SECRET: z.string().default('dev-insecure-secret'),
  JWT_EXPIRES_IN: z.string().default('12h'),

  DUPLICATE_SIMILARITY_THRESHOLD: z.coerce.number().min(0).max(1).default(0.85),
  DUPLICATE_RADIUS_METERS: z.coerce.number().positive().default(300),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  clientOrigins: parsed.data.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
};

// Empty or short secrets would start fine and then break every login, so refuse to boot instead.
if (env.isProd && (env.JWT_SECRET === 'dev-insecure-secret' || env.JWT_SECRET.length < 32)) {
  console.error('JWT_SECRET must be set to a random string of at least 32 characters in production.');
  process.exit(1);
}
