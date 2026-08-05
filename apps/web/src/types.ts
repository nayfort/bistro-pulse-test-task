export type LeadPayload = {
  name: string;
  phone: string;
  email?: string;
  message?: string;
  company?: string;
  startedAt: number;
  spamToken: string;
  source: "landing";
};

export type SpamTokenResponse = {
  token: string;
  issuedAt: number;
};

