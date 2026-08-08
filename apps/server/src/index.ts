import { app } from "./app.js";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { startHealthMonitor } from "./monitor.js";

const server = app.listen(config.port, () => {
  logger.info({ port: config.port, dryRun: config.dryRun }, "API server started");
});

const monitor = startHealthMonitor(config.telegram.intervalMs);

function shutdown() {
  clearInterval(monitor);
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
