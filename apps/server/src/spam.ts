import crypto from "node:crypto";
import { config } from "./config.js";

const minFormAgeMs = 2500;
const maxFormAgeMs = 1000 * 60 * 45;
const rateLimitWindowMs = 1000 * 60 * 10;
const maxRequestsPerWindow = 8;
const rateLimitStore = new Map<string, number[]>();

function hmac(payload: string) {
  return crypto.createHmac("sha256", config.spamTokenSecret).update(payload).digest("hex");
}

export function createSpamToken(now = Date.now()) {
  const nonce = crypto.randomBytes(12).toString("hex");
  const payload = `${now}.${nonce}`;
  return `${payload}.${hmac(payload)}`;
}

export function verifySpamToken(token: string, now = Date.now()) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [issuedAtRaw, nonce, signature] = parts;
  const issuedAt = Number(issuedAtRaw);
  if (!Number.isFinite(issuedAt) || !nonce) {
    return false;
  }

  const payload = `${issuedAtRaw}.${nonce}`;
  const expected = hmac(payload);
  if (signature.length !== expected.length) {
    return false;
  }

  const signaturesMatch = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  const age = now - issuedAt;

  return signaturesMatch && age >= 0 && age <= maxFormAgeMs;
}

export function assertNotSpam(args: { token: string; startedAt: number; honeypot?: string; ip: string }) {
  const now = Date.now();

  if (args.honeypot) {
    throw new Error("Spam check failed.");
  }

  if (!verifySpamToken(args.token, now)) {
    throw new Error("Spam token is invalid or expired.");
  }

  const formAge = now - args.startedAt;
  if (formAge < minFormAgeMs || formAge > maxFormAgeMs) {
    throw new Error("Form timing check failed.");
  }

  const recent = (rateLimitStore.get(args.ip) || []).filter((timestamp) => now - timestamp < rateLimitWindowMs);
  recent.push(now);
  rateLimitStore.set(args.ip, recent);

  if (recent.length > maxRequestsPerWindow) {
    throw new Error("Too many requests. Please try again later.");
  }
}
