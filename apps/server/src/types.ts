export type LeadInput = {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  company?: string;
  startedAt: number;
  spamToken: string;
  source: "landing";
};

export type NormalizedLead = {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  source: "landing";
  createdAt: string;
  externalId: string;
};

export type IntegrationResult = {
  skipped: boolean;
  id?: number | string;
  raw?: unknown;
};

