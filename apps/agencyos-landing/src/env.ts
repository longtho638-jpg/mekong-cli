import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    POLAR_ACCESS_TOKEN: z.string().min(1).optional(),
    POLAR_ORGANIZATION_ID: z.string().min(1).optional(),
    POLAR_WEBHOOK_SECRET: z.string().min(1).optional(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },
  client: {
    NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_POLAR_PRICE_STARTER: z.string().min(1).optional(),
    NEXT_PUBLIC_POLAR_PRICE_PRO: z.string().min(1).optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_POLAR_PRICE_STARTER: process.env.NEXT_PUBLIC_POLAR_PRICE_STARTER,
    NEXT_PUBLIC_POLAR_PRICE_PRO: process.env.NEXT_PUBLIC_POLAR_PRICE_PRO,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
