import { checkDilovodHealth } from "./integrations/dilovod.js";
import { checkSalesDriveHealth } from "./integrations/salesDrive.js";
import { sendTelegramAlert } from "./integrations/telegram.js";
import { logger } from "./logger.js";

let lastFailureKey = "";

export async function runHealthCheck() {
  const [salesDrive, dilovod] = await Promise.all([checkSalesDriveHealth(), checkDilovodHealth()]);
  const failures = [
    salesDrive.ok ? null : `SalesDrive API is unavailable (${salesDrive.status || "unknown"})`,
    dilovod.ok ? null : `Dilovod API is unavailable (${dilovod.error || "unknown"})`
  ].filter(Boolean) as string[];

  if (!failures.length) {
    lastFailureKey = "";
    return { ok: true, salesDrive, dilovod };
  }

  const failureKey = failures.join("|");
  logger.warn({ failures }, "Integration health check failed");

  if (failureKey !== lastFailureKey) {
    lastFailureKey = failureKey;
    await sendTelegramAlert(`API monitor alert:\n${failures.join("\n")}`).catch((error) => {
      logger.error({ error }, "Telegram alert failed");
    });
  }

  return { ok: false, salesDrive, dilovod };
}

export function startHealthMonitor(intervalMs: number) {
  runHealthCheck().catch((error) => logger.error({ error }, "Initial health check failed"));
  return setInterval(() => {
    runHealthCheck().catch((error) => logger.error({ error }, "Scheduled health check failed"));
  }, intervalMs);
}

