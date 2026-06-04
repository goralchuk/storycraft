import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number().default(6379),
  MINIO_ENDPOINT: z.string().url(),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET: z.string(),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  GOOGLE_CALLBACK_URL: z.string().url(),
  FRONTEND_URL: z.string().url().default('http://localhost:3001'),
  // Optional — only needed when textProvider is "gemini". Stub works without it.
  GEMINI_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validate(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const message = Object.entries(errors)
      .map(([field, msgs]) => `${field}: ${msgs?.join(', ')}`)
      .join('\n');
    throw new Error(`Config validation failed:\n${message}`);
  }
  return result.data;
}
