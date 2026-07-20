import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  API_BASE_URL: z.string().url(),
  MAIN_COOKIE_DOMAIN: z.string().optional(),
  ROOT_COOKIE_DOMAIN: z.string().optional(),

  DATABASE_URL: z.string().default('file:./dev.db'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWKS_URI: z.string().url().optional(),
  JWT_ISSUER: z.string().optional(),

  NEXT_PUBLIC_LOCAL_AUTH: z.string().default('true'),
  NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS: z.string().optional().default('false'),
  NEXT_PUBLIC_BETA_LOGO: z.string().optional(),

  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_ENV: z.string().optional(),
  NEXT_PUBLIC_RECAPTCHA_KEY: z.string().optional(),
  NEXT_PUBLIC_CAROUSEL_CDN_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUGGESTIONS_FORM: z.string().url().optional(),

  NEXT_PUBLIC_KBIS_URL: z.string().url().optional(),
  NEXT_PUBLIC_ADDRESS_URL: z.string().url().optional(),
  NEXT_PUBLIC_GITHUB_URL: z.string().url().optional(),
  NEXT_PUBLIC_FACEBOOK_URL: z.string().url().optional(),
  NEXT_PUBLIC_TWITTER_URL: z.string().url().optional(),
  NEXT_PUBLIC_INSTAGRAM_URL: z.string().url().optional(),
  NEXT_PUBLIC_WHATSAPP_SUPPORT_LINK: z.string().url().optional(),

  NEXT_PUBLIC_CODE_OF_HONOR: z.string().url().optional(),
  NEXT_PUBLIC_INTERNAL_REGULATIONS: z.string().url().optional(),
  NEXT_PUBLIC_EDUCATIONAL_ORGANIZATION_REGULATION: z.string().url().optional(),
  NEXT_PUBLIC_PROGRAM_ANTICORRUPTION: z.string().url().optional(),

  NEXT_PUBLIC_USER_MANUAL_URL: z.string().url().optional(),
  NEXT_PUBLIC_STUDENT_MANUAL_URL: z.string().url().optional(),
  NEXT_PUBLIC_CAMPUS_DOCUMENT_TEMPLATE: z.string().url().optional(),
  NEXT_PUBLIC_SCHEDULE_URL: z.string().url().optional(),
  NEXT_PUBLIC_DNVR: z.string().url().optional(),
  NEXT_PUBLIC_UNIVERSITY_NOTICE_BOARD_URL: z.string().url().optional(),
  NEXT_PUBLIC_LIBRARY_DISCOVERY_URL: z.string().url().optional(),
  NEXT_PUBLIC_UNIVERSITY_NEWS: z.string().url().optional(),
  NEXT_PUBLIC_STUDENT_COUNCIL: z.string().url().optional(),

  NEXT_PUBLIC_FEATURE_DARK_MODE: z.string().optional(),
  NEXT_PUBLIC_FEATURE_COMMAND_PALETTE: z.string().optional(),
  NEXT_PUBLIC_FEATURE_REALTIME_NOTIFICATIONS: z.string().optional(),
  NEXT_PUBLIC_FEATURE_ADMIN_PANEL: z.string().optional(),

  CRON_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

const cleanEnv = Object.fromEntries(
  Object.entries(process.env).map(([key, val]) => [key, val === '' ? undefined : val]),
);

export const env = envSchema.parse(cleanEnv);
