import type { LeadPayload, SpamTokenResponse } from "./types";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = body?.message || "Request failed";
    throw new Error(message);
  }

  return body as T;
}

export async function getSpamToken(): Promise<SpamTokenResponse> {
  const response = await fetch(`${API_BASE}/spam-token`, {
    headers: { Accept: "application/json" }
  });

  return parseResponse<SpamTokenResponse>(response);
}

export async function submitLead(payload: LeadPayload) {
  const response = await fetch(`${API_BASE}/leads`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  return parseResponse<{ success: boolean; dryRun: boolean; salesDriveOrderId?: number }>(response);
}

