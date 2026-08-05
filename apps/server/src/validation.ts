import { z } from "zod";
import type { LeadInput, NormalizedLead } from "./types.js";

export const uaPhoneRegex = /^\+?38\s?\(?0(39|50|63|66|67|68|73|91|92|93|94|95|96|97|98|99)\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;
export const nameRegex = /^[A-Za-zА-Яа-яІіЇїЄєҐґ'’\-\s]{2,60}$/;

export const leadSchema = z.object({
  name: z.string().trim().regex(nameRegex, "Name may contain only letters, spaces, apostrophe, or hyphen."),
  phone: z.string().trim().regex(uaPhoneRegex, "Phone must be a valid Ukrainian mobile number."),
  email: z.string().trim().email().optional().or(z.literal("")),
  message: z.string().trim().max(1200).optional().or(z.literal("")),
  company: z.string().max(0).optional().or(z.literal("")),
  startedAt: z.number().int().positive(),
  spamToken: z.string().min(16),
  source: z.literal("landing")
});

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const withoutCountry = digits.startsWith("38") ? digits.slice(2) : digits;
  return `+38${withoutCountry}`;
}

export function normalizeLead(input: LeadInput): NormalizedLead {
  const now = new Date();
  const cleanedName = input.name.replace(/\s+/g, " ").trim();

  return {
    name: cleanedName,
    phone: normalizePhone(input.phone),
    email: input.email?.trim() || undefined,
    message: input.message?.trim() || undefined,
    source: input.source,
    createdAt: now.toISOString(),
    externalId: `web-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`
  };
}

