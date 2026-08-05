import { describe, expect, it } from "vitest";
import { leadSchema, normalizePhone } from "./validation.js";

describe("lead validation", () => {
  it("accepts Ukrainian names and mobile operators", () => {
    const result = leadSchema.safeParse({
      name: "Олена Коваль",
      phone: "+38 (050) 123-45-67",
      email: "",
      message: "Table for two",
      company: "",
      startedAt: Date.now() - 5000,
      spamToken: "1234567890123456",
      source: "landing"
    });

    expect(result.success).toBe(true);
  });

  it("rejects digits in names", () => {
    const result = leadSchema.safeParse({
      name: "Olena123",
      phone: "+38 (050) 123-45-67",
      startedAt: Date.now(),
      spamToken: "1234567890123456",
      source: "landing"
    });

    expect(result.success).toBe(false);
  });

  it("normalizes phone to international format", () => {
    expect(normalizePhone("050 123 45 67")).toBe("+380501234567");
  });
});

