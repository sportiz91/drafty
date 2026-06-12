import { z } from 'zod';

const serverConfigSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  jwtSecret: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  jwtAccessTokenExpiry: z.string().default('15m'),
  databasePath: z.string().default('./data/drafty.db'),
  // Secure cookies require HTTPS. Off by default so the app works on
  // http://localhost (this assignment runs locally); set true on real deploys.
  cookieSecure: z
    .enum(['true', 'false'])
    .default('false')
    .transform(value => value === 'true'),
  // e2e runs many auth flows from one IP in seconds — the suite disables
  // limits explicitly (rate limiting itself is unit-tested).
  rateLimitDisabled: z
    .enum(['true', 'false'])
    .default('false')
    .transform(value => value === 'true'),
});

export const serverConfig = serverConfigSchema.parse({
  nodeEnv: process.env.NODE_ENV,
  jwtSecret: process.env.JWT_SECRET,
  jwtAccessTokenExpiry: process.env.JWT_ACCESS_TOKEN_EXPIRY,
  databasePath: process.env.DATABASE_PATH,
  cookieSecure: process.env.COOKIE_SECURE,
  rateLimitDisabled: process.env.RATE_LIMIT_DISABLED,
});
