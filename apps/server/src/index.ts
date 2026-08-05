import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertRuntimeConfig, config } from "./config.js";
import { createSalesDriveOrder } from "./integrations/salesDrive.js";
import { syncLeadToDilovod } from "./integrations/dilovod.js";
import { logger } from "./logger.js";
import { runHealthCheck, startHealthMonitor } from "./monitor.js";
import { assertNotSpam, createSpamToken } from "./spam.js";
import { leadSchema, normalizeLead } from "./validation.js";

assertRuntimeConfig();

const app = express();
app.set("trust proxy", true);
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: "64kb" }));

app.get("/api/health", async (_request, response) => {
  const health = await runHealthCheck();
  response.status(health.ok ? 200 : 503).json(health);
});

app.get("/api/spam-token", (_request, response) => {
  const issuedAt = Date.now();
  response.json({ token: createSpamToken(issuedAt), issuedAt });
});

app.post("/api/leads", async (request, response) => {
  const parsed = leadSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(422).json({
      success: false,
      message: parsed.error.issues[0]?.message || "Validation failed"
    });
    return;
  }

  try {
    assertNotSpam({
      token: parsed.data.spamToken,
      startedAt: parsed.data.startedAt,
      honeypot: parsed.data.company,
      ip: request.ip || request.socket.remoteAddress || "unknown"
    });

    const lead = normalizeLead(parsed.data);
    const salesDrive = await createSalesDriveOrder(lead);
    const dilovod = await syncLeadToDilovod(lead, salesDrive.id);

    response.status(201).json({
      success: true,
      dryRun: config.dryRun,
      salesDriveOrderId: salesDrive.id,
      dilovodId: dilovod.id
    });
  } catch (error) {
    logger.error({ error }, "Lead processing failed");
    response.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Lead processing failed"
    });
  }
});

app.post("/api/salesdrive/webhook", express.json(), async (request, response) => {
  logger.info({ payload: request.body }, "SalesDrive webhook received");
  response.status(202).json({ success: true });
});

const dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultWebDist = path.resolve(dirname, "../../web/dist");
const webDist = process.env.WEB_DIST_DIR || defaultWebDist;

if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get("*", (_request, response) => {
    response.sendFile(path.join(webDist, "index.html"));
  });
}

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
