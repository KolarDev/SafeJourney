import "dotenv/config";
import * as z from "zod";

const configSchema = z
  .object({
    PORT: z.coerce.number().default(5050),

    NODE_ENV: z.enum(["DEVELOPMENT", "PRODUCTION", "STAGING"]).default("DEVELOPMENT"),

    JWT_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

    EMAIL_FROM: z.string().email(),

    BREVO_HOST: z.string(),
    BREVO_PORT: z.coerce.number(),
    BREVO_USERNAME: z.string().email(),
    BREVO_PASSWORD: z.string(),

    MONGO_URI: z.string().url(),

    ALLOWED_ORIGINS: z.string().default("*"),
  })
  .passthrough();
  // .strict();

type TConfig = z.infer<typeof configSchema>;

const config = configSchema.parse(process.env);

export { config, TConfig };

