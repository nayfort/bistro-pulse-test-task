import { describe, expect, it } from "vitest";
import { normalizeSku, parsePrice, priceChanged } from "./normalize.js";

describe("data normalization", () => {
  it("normalizes supplier and internal sku punctuation", () => {
    expect(normalizeSku(" BR-IM-110.7 ")).toBe("brim1107");
  });

  it("parses localized prices", () => {
    expect(parsePrice("1 890,00 грн")).toBe(1890);
    expect(parsePrice("2,821.00")).toBe(2821);
  });

  it("detects price changes with cents tolerance", () => {
    expect(priceChanged("100", 100)).toBe(false);
    expect(priceChanged("100", 110)).toBe(true);
  });
});
