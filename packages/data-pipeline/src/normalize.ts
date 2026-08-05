export function normalizeSku(value: unknown) {
  return String(value ?? "")
    .trim()
    .replace(/\.0$/, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

export function normalizeText(value: unknown) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&[a-z]+;/g, " ")
    .replace(/[^\p{L}\p{N}.]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parsePrice(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  let cleaned = String(value ?? "")
    .replace(/\s/g, "")
    .replace(/грн\.?/gi, "")
    .replace(/[^\d.]/g, "");

  const raw = String(value ?? "").replace(/\s/g, "");
  if (raw.includes(",") && raw.includes(".")) {
    cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  } else if (raw.includes(",")) {
    cleaned = raw.replace(",", ".").replace(/[^\d.]/g, "");
  }

  if (!cleaned) {
    return undefined;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function priceChanged(current: unknown, next: number) {
  const parsed = parsePrice(current);
  return parsed === undefined || Math.round(parsed * 100) !== Math.round(next * 100);
}

export function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1);
}
