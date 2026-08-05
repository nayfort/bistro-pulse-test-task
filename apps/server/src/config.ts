import "dotenv/config";

function bool(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function numberValue(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  port: numberValue(process.env.PORT, 4300),
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  dryRun: bool(process.env.INTEGRATIONS_DRY_RUN, true),
  spamTokenSecret: process.env.SPAM_TOKEN_SECRET || "dev-only-spam-token-secret",
  salesDrive: {
    account: process.env.SALESDRIVE_ACCOUNT || "",
    apiKey: process.env.SALESDRIVE_API_KEY || "",
    site: process.env.SALESDRIVE_SITE || "webdev-test-task.local",
    formId: process.env.SALESDRIVE_FORM_ID || ""
  },
  dilovod: {
    apiUrl: process.env.DILOVOD_API_URL || "https://api.dilovod.ua",
    apiKey: process.env.DILOVOD_API_KEY || "",
    version: process.env.DILOVOD_API_VERSION || "0.25",
    clientId: process.env.DILOVOD_CLIENT_ID || "webdev-test-task"
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || "",
    chatId: process.env.TELEGRAM_CHAT_ID || "",
    intervalMs: numberValue(process.env.HEALTHCHECK_INTERVAL_MS, 300000)
  }
};

export function assertRuntimeConfig() {
  if (!config.dryRun && (!config.salesDrive.account || !config.salesDrive.apiKey)) {
    throw new Error("SALESDRIVE_ACCOUNT and SALESDRIVE_API_KEY are required when dry-run is disabled.");
  }

  if (!config.dryRun && !config.dilovod.apiKey) {
    throw new Error("DILOVOD_API_KEY is required when dry-run is disabled.");
  }
}

