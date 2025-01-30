import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url(),
  API_SECRET_KEY: z.string().min(10),
});

export const env = envSchema.parse(process.env);