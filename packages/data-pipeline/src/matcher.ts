import { normalizeSku, normalizeText, parsePrice, tokenize } from "./normalize.js";

export type ImportRow = {
  index: number;
  values: unknown[];
  sku: string;
  title: string;
  price?: number;
};

export type PriceEntry = {
  sheet: string;
  row: number;
  sku?: string;
  title: string;
  searchable: string;
  price: number;
};

export type MatchResult = {
  entry?: PriceEntry;
  score: number;
  strategy: "sku" | "text" | "none";
};

const articleLike = /^[\p{L}\p{N}][\p{L}\p{N}\-./_ ]{1,48}$/u;
const genericTokens = new Set([
  "кабель",
  "нагрівальний",
  "нагревательный",
  "мат",
  "тепла",
  "підлога",
  "пола",
  "для",
  "комплект",
  "україна",
  "польша",
  "німеччина",
  "сша",
  "ціна",
  "цена",
  "грн",
  "вт",
  "w",
  "м2",
  "m2",
  "см",
  "cm",
  "кв",
  "квм",
  "розница",
  "роздрібна"
]);

function isLikelySku(value: unknown) {
  const text = String(value ?? "").trim();
  return articleLike.test(text) && /\d/.test(text) && (/[A-Za-zА-Яа-яІіЇїЄєҐґ]/.test(text) || /[-/.]/.test(text));
}

function bestNumericPrice(row: unknown[], startColumn: number) {
  const candidates = row
    .slice(startColumn)
    .map(parsePrice)
    .filter((price): price is number => price !== undefined && price >= 50 && price <= 1_000_000);

  return candidates.at(-1);
}

export function extractPriceEntries(workbook: any): PriceEntry[] {
  const entries: PriceEntry[] = [];

  for (const sheet of workbook.SheetNames as string[]) {
    const matrix = workbook.utils.sheet_to_json(workbook.Sheets[sheet], { header: 1, raw: false, defval: "" }) as unknown[][];

    matrix.forEach((row, rowIndex) => {
      const cells = row.map((cell) => String(cell ?? "").trim()).filter(Boolean);
      if (cells.length < 2) {
        return;
      }

      let skuColumn = row.findIndex(isLikelySku);
      if (skuColumn < 0) {
        skuColumn = row.findIndex((cell) => normalizeText(cell).length > 5 && /\d/.test(String(cell)));
      }

      if (skuColumn < 0) {
        return;
      }

      const price = bestNumericPrice(row, skuColumn + 1);
      if (!price) {
        return;
      }

      const sku = isLikelySku(row[skuColumn]) ? String(row[skuColumn]).trim() : undefined;
      const title = cells
        .filter((cell) => parsePrice(cell) === undefined || cell.length > 8)
        .slice(0, 5)
        .join(" ");

      entries.push({
        sheet,
        row: rowIndex + 1,
        sku,
        title: title || String(row[skuColumn]).trim(),
        searchable: normalizeText(cells.join(" ")),
        price
      });
    });
  }

  return entries;
}

export function buildSkuIndex(entries: PriceEntry[]) {
  const index = new Map<string, PriceEntry>();

  for (const entry of entries) {
    if (!entry.sku) {
      continue;
    }

    index.set(normalizeSku(entry.sku), entry);
  }

  return index;
}

function similarity(importRow: ImportRow, entry: PriceEntry) {
  const importTokens = tokenize(`${importRow.sku} ${importRow.title}`).filter(
    (token) => !genericTokens.has(token) && /\p{L}/u.test(token)
  );
  const entryTokens = tokenize(`${entry.sku ?? ""} ${entry.searchable}`).filter(
    (token) => !genericTokens.has(token) && /\p{L}/u.test(token)
  );
  const tokenOverlaps = importTokens.filter((left) =>
    entryTokens.some((right) => left === right || (left.length >= 4 && right.length >= 4 && (left.includes(right) || right.includes(left))))
  );
  const union = new Set([...importTokens, ...entryTokens]).size || 1;
  const jaccard = tokenOverlaps.length / union;

  const importNumbers = new Set(normalizeText(importRow.title).match(/\d+(?:\.\d+)?/g) || []);
  const entryNumbers = new Set(entry.searchable.match(/\d+(?:\.\d+)?/g) || []);
  const numberHits = [...importNumbers].filter((token) => entryNumbers.has(token)).length;
  const numberScore = importNumbers.size ? numberHits / importNumbers.size : 0;

  const normalizedEntrySku = normalizeSku(entry.sku);
  const skuHint =
    entry.sku && normalizedEntrySku.length >= 5 && normalizeSku(importRow.sku).includes(normalizedEntrySku) ? 0.35 : 0;
  const brandScore = tokenOverlaps.length ? 0.35 : 0;

  if (!brandScore && !skuHint) {
    return 0;
  }

  if (!skuHint && importNumbers.size >= 2 && entryNumbers.size >= 2 && numberHits < 2) {
    return 0;
  }

  return jaccard * 0.2 + numberScore * 0.45 + brandScore + skuHint;
}

export function matchPrice(importRow: ImportRow, entries: PriceEntry[], skuIndex: Map<string, PriceEntry>): MatchResult {
  const skuMatch = skuIndex.get(normalizeSku(importRow.sku));
  if (skuMatch) {
    return { entry: skuMatch, score: 1, strategy: "sku" };
  }

  let best: MatchResult = { score: 0, strategy: "none" };

  for (const entry of entries) {
    const score = similarity(importRow, entry);
    if (score > best.score) {
      best = { entry, score, strategy: "text" };
    }
  }

  return best.score >= 0.58 ? best : { score: best.score, strategy: "none" };
}
