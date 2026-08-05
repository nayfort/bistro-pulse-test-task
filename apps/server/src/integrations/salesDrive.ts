import { config } from "../config.js";
import type { IntegrationResult, NormalizedLead } from "../types.js";

export async function createSalesDriveOrder(lead: NormalizedLead): Promise<IntegrationResult> {
  if (config.dryRun) {
    return {
      skipped: true,
      id: `dry-salesdrive-${lead.externalId}`,
      raw: { lead }
    };
  }

  const endpoint = `https://${config.salesDrive.account}.salesdrive.me/handler/`;
  const payload = {
    getResultData: 1,
    fName: lead.name,
    phone: lead.phone,
    email: lead.email,
    comment: lead.message,
    externalId: lead.externalId,
    sajt: config.salesDrive.site,
    form: config.salesDrive.formId || undefined,
    utmSource: "webdev-test-task",
    utmMedium: "landing",
    utmCampaign: "test-assignment"
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Api-Key": config.salesDrive.apiKey
    },
    body: JSON.stringify(payload)
  });

  const raw = await response.json().catch(() => null);
  if (!response.ok || raw?.success === false) {
    throw new Error(`SalesDrive request failed: ${response.status} ${JSON.stringify(raw)}`);
  }

  return {
    skipped: false,
    id: raw?.data?.orderId,
    raw
  };
}

export async function checkSalesDriveHealth() {
  if (config.dryRun || !config.salesDrive.account || !config.salesDrive.apiKey) {
    return { ok: true, skipped: true };
  }

  const endpoint = `https://${config.salesDrive.account}.salesdrive.me/api/order/list/?limit=1`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      "X-Api-Key": config.salesDrive.apiKey
    }
  });

  return { ok: response.ok, status: response.status, skipped: false };
}

