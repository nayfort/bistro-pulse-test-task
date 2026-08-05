import fs from "node:fs/promises";
import path from "node:path";
import xlsx from "xlsx-js-style";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { extractPriceEntries, buildSkuIndex, matchPrice, type ImportRow } from "./matcher.js";
import { parsePrice, priceChanged } from "./normalize.js";
import { writeMarketplaceXml } from "./xml.js";

const changedFill = { fgColor: { rgb: "FFF2CC" } };
const identicalFill = { fgColor: { rgb: "D9EAD3" } };
const missingFill = { fgColor: { rgb: "F4CCCC" } };

const aliases = {
  id: ["id"],
  sku: ["артикул", "sku", "vendorcode", "код"],
  title: ["название", "назва", "name", "товар"],
  price: ["цена", "ціна", "price"],
  oldPrice: ["старая цена", "стара ціна", "old_price", "oldprice"],
  gallery: ["галерея", "gallery", "picture"],
  availability: ["tv.availability", "availability", "наявність"],
  url: ["url", "uri", "посилання"]
};

function normalizeHeader(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "");
}

function findColumn(headers: unknown[], names: string[]) {
  const normalized = headers.map(normalizeHeader);
  return names
    .map(normalizeHeader)
    .map((name) => normalized.indexOf(name))
    .find((index) => index >= 0);
}

function requiredColumn(headers: unknown[], names: string[]) {
  const found = findColumn(headers, names);
  if (found === undefined) {
    throw new Error(`Missing required column: ${names.join(" / ")}`);
  }

  return found;
}

function ensureColumn(headers: unknown[], name: string) {
  let index = headers.findIndex((header) => normalizeHeader(header) === normalizeHeader(name));
  if (index < 0) {
    headers.push(name);
    index = headers.length - 1;
  }

  return index;
}

function roundPrice(value: number) {
  return Math.round(value * 100) / 100;
}

function rowStatusFill(status: string) {
  if (status === "changed") return changedFill;
  if (status === "identical") return identicalFill;
  return missingFill;
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("import", { type: "string", demandOption: true })
    .option("price", { type: "string", demandOption: true })
    .option("out", { type: "string", default: "data/output/import-updated.xlsx" })
    .option("xml", { type: "string", default: "data/output/marketplace.xml" })
    .option("report", { type: "string", default: "data/output/sync-report.json" })
    .option("chunk-size", { type: "number", default: 500 })
    .strict()
    .parse();

  const importBook = xlsx.readFile(argv.import);
  const priceBook = xlsx.readFile(argv.price);
  const importSheetName = importBook.SheetNames[0];
  const importSheet = importBook.Sheets[importSheetName];
  const matrix = xlsx.utils.sheet_to_json(importSheet, { header: 1, raw: false, defval: "" }) as unknown[][];

  if (!matrix.length) {
    throw new Error("Import workbook is empty.");
  }

  const headers = [...matrix[0]];
  const columnMap = {
    id: findColumn(headers, aliases.id) ?? 0,
    sku: requiredColumn(headers, aliases.sku),
    title: requiredColumn(headers, aliases.title),
    price: requiredColumn(headers, aliases.price),
    oldPrice: findColumn(headers, aliases.oldPrice) ?? ensureColumn(headers, "old_price"),
    gallery: findColumn(headers, aliases.gallery) ?? -1,
    availability: findColumn(headers, aliases.availability) ?? -1,
    url: findColumn(headers, aliases.url) ?? -1,
    status: ensureColumn(headers, "price_sync_status"),
    source: ensureColumn(headers, "price_sync_source"),
    score: ensureColumn(headers, "price_sync_score"),
    previousPrice: ensureColumn(headers, "previous_price")
  };

  const importRows: ImportRow[] = matrix.slice(1).map((values, index) => ({
    index: index + 2,
    values: [...values],
    sku: String(values[columnMap.sku] ?? "").trim(),
    title: String(values[columnMap.title] ?? "").trim(),
    price: parsePrice(values[columnMap.price])
  }));

  const priceEntries = extractPriceEntries({ ...priceBook, utils: xlsx.utils });
  const skuIndex = buildSkuIndex(priceEntries);
  const report = {
    total: importRows.length,
    changed: 0,
    identical: 0,
    missing: 0,
    priceEntries: priceEntries.length,
    generatedAt: new Date().toISOString()
  };

  for (let offset = 0; offset < importRows.length; offset += argv.chunkSize) {
    const chunk = importRows.slice(offset, offset + argv.chunkSize);

    for (const row of chunk) {
      const match = matchPrice(row, priceEntries, skuIndex);
      const previousPrice = row.values[columnMap.price];

      row.values[columnMap.previousPrice] = previousPrice;

      if (!match.entry) {
        row.values[columnMap.status] = "missing";
        row.values[columnMap.source] = "";
        row.values[columnMap.score] = roundPrice(match.score);
        report.missing += 1;
        continue;
      }

      const nextPrice = roundPrice(match.entry.price);
      const changed = priceChanged(previousPrice, nextPrice);
      row.values[columnMap.price] = nextPrice;
      row.values[columnMap.oldPrice] = roundPrice(nextPrice * 1.1);
      row.values[columnMap.status] = changed ? "changed" : "identical";
      row.values[columnMap.source] = `${match.strategy}:${match.entry.sheet}!${match.entry.row}`;
      row.values[columnMap.score] = roundPrice(match.score);
      report[changed ? "changed" : "identical"] += 1;
    }
  }

  const outputMatrix = [headers, ...importRows.map((row) => row.values)];
  const outputSheet = xlsx.utils.aoa_to_sheet(outputMatrix);

  for (let rowIndex = 1; rowIndex < outputMatrix.length; rowIndex += 1) {
    const status = outputMatrix[rowIndex][columnMap.status] as string;
    const fill = rowStatusFill(status);

    for (const colIndex of [columnMap.price, columnMap.oldPrice, columnMap.status, columnMap.source]) {
      const cell = xlsx.utils.encode_cell({ r: rowIndex, c: colIndex });
      outputSheet[cell] ||= { t: "s", v: "" };
      outputSheet[cell].s = { fill };
    }
  }

  outputSheet["!cols"] = headers.map((header, index) => ({
    wch: index === columnMap.title ? 42 : Math.min(Math.max(String(header).length + 3, 12), 28)
  }));

  const outputBook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(outputBook, outputSheet, importSheetName);
  await fs.mkdir(path.dirname(argv.out), { recursive: true });
  xlsx.writeFile(outputBook, argv.out);

  await fs.mkdir(path.dirname(argv.xml), { recursive: true });
  await writeMarketplaceXml({
    file: argv.xml,
    rows: importRows,
    columnMap: {
      id: columnMap.id,
      price: columnMap.price,
      oldPrice: columnMap.oldPrice,
      gallery: columnMap.gallery,
      availability: columnMap.availability,
      url: columnMap.url
    },
    chunkSize: argv.chunkSize
  });

  await fs.writeFile(argv.report, JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

