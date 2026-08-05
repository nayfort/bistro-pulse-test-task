import { createWriteStream } from "node:fs";
import type { ImportRow } from "./matcher.js";

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function writeMarketplaceXml(args: {
  file: string;
  rows: ImportRow[];
  columnMap: Record<string, number>;
  chunkSize: number;
}) {
  const stream = createWriteStream(args.file, { encoding: "utf8" });
  const write = (chunk: string) => new Promise<void>((resolve) => stream.write(chunk, () => resolve()));

  await write(`<?xml version="1.0" encoding="UTF-8"?>\n`);
  await write(`<yml_catalog date="${new Date().toISOString()}">\n<shop>\n<name>Webdev Test Marketplace Feed</name>\n<offers>\n`);

  for (let index = 0; index < args.rows.length; index += args.chunkSize) {
    const chunk = args.rows.slice(index, index + args.chunkSize);

    for (const row of chunk) {
      const id = row.values[args.columnMap.id] || row.sku || row.index;
      const url = row.values[args.columnMap.url] || "";
      const available = String(row.values[args.columnMap.availability] ?? "1") !== "0";
      const images = String(row.values[args.columnMap.gallery] ?? "")
        .split("|")
        .map((image) => image.trim())
        .filter(Boolean)
        .slice(0, 10);

      await write(`  <offer id="${escapeXml(id)}" available="${available ? "true" : "false"}">\n`);
      await write(`    <name>${escapeXml(row.title)}</name>\n`);
      await write(`    <vendorCode>${escapeXml(row.sku)}</vendorCode>\n`);
      await write(`    <price>${escapeXml(row.values[args.columnMap.price])}</price>\n`);
      await write(`    <oldprice>${escapeXml(row.values[args.columnMap.oldPrice])}</oldprice>\n`);
      if (url) await write(`    <url>${escapeXml(url)}</url>\n`);
      for (const image of images) {
        await write(`    <picture>${escapeXml(image)}</picture>\n`);
      }
      await write(`  </offer>\n`);
    }
  }

  await write(`</offers>\n</shop>\n</yml_catalog>\n`);
  stream.end();

  await new Promise<void>((resolve) => stream.on("finish", resolve));
}

