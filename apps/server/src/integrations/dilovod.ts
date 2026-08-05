import { config } from "../config.js";
import type { IntegrationResult, NormalizedLead } from "../types.js";

type DilovodPacket = {
  version: string;
  key: string;
  clientID?: string;
  action: string;
  params: Record<string, unknown>;
};

async function postPacket(packet: DilovodPacket) {
  const body = new URLSearchParams({
    packet: JSON.stringify(packet)
  });

  const response = await fetch(config.dilovod.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json"
    },
    body
  });

  const rawText = await response.text();
  let raw: unknown = rawText;

  try {
    raw = JSON.parse(rawText);
  } catch {
    raw = rawText;
  }

  if (!response.ok) {
    throw new Error(`Dilovod request failed: ${response.status} ${rawText}`);
  }

  return raw;
}

export async function syncLeadToDilovod(lead: NormalizedLead, salesDriveOrderId?: string | number): Promise<IntegrationResult> {
  if (config.dryRun) {
    return {
      skipped: true,
      id: `dry-dilovod-${lead.externalId}`,
      raw: { lead, salesDriveOrderId }
    };
  }

  const packet: DilovodPacket = {
    version: config.dilovod.version,
    key: config.dilovod.apiKey,
    clientID: config.dilovod.clientId,
    action: "saveObject",
    params: {
      header: {
        id: "catalogs.persons",
        name: { uk: lead.name, ru: lead.name },
        category: "Клієнт",
        details: {
          phone: lead.phone,
          email: lead.email,
          comment: lead.message,
          source: "SalesDrive",
          externalId: lead.externalId,
          salesDriveOrderId
        }
      }
    }
  };

  const raw = await postPacket(packet);
  return {
    skipped: false,
    id: typeof raw === "object" && raw && "id" in raw ? String((raw as { id: unknown }).id) : undefined,
    raw
  };
}

export async function checkDilovodHealth() {
  if (config.dryRun || !config.dilovod.apiKey) {
    return { ok: true, skipped: true };
  }

  const packet: DilovodPacket = {
    version: config.dilovod.version,
    key: config.dilovod.apiKey,
    clientID: config.dilovod.clientId,
    action: "listMetadata",
    params: {}
  };

  try {
    await postPacket(packet);
    return { ok: true, skipped: false };
  } catch (error) {
    return { ok: false, skipped: false, error: error instanceof Error ? error.message : String(error) };
  }
}

