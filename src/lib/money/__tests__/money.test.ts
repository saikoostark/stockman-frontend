import { describe, expect, it } from "vitest";

import { formatDecimal, formatMoney, precisionFor } from "../format";
import { parseDecimalInput } from "../parse";

const locales = ["en", "de", "es", "ar"];

function separators(locale: string): { group: string; decimal: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
  const group = parts.find((p) => p.type === "group")?.value ?? "";
  const decimal = parts.find((p) => p.type === "decimal")?.value ?? ".";
  return { group, decimal };
}

describe("formatDecimal / formatMoney", () => {
  it("respects currency precision", () => {
    expect(formatMoney("1.2", "EGP", "en")).toBe("1.20");
    expect(formatMoney("1.2", "USDT", "en")).toBe("1.20000000");
  });

  it("exposes precision per currency", () => {
    expect(precisionFor("EGP")).toBe(2);
    expect(precisionFor("USDT")).toBe(8);
    expect(precisionFor("UNKNOWN")).toBe(2);
  });

  it("keeps full decimal places for the given precision", () => {
    expect(formatDecimal("1234.5", "en", 2)).toBe("1,234.50");
  });
});

describe("parseDecimalInput", () => {
  it("parses plain decimals", () => {
    expect(parseDecimalInput("1234.56", "en")).toBe("1234.56");
    expect(parseDecimalInput("0.00000001", "en")).toBe("0.00000001");
    expect(parseDecimalInput("-5", "en")).toBe("-5");
  });

  it("parses locale-grouped input", () => {
    for (const locale of locales) {
      const { group, decimal } = separators(locale);
      const input = `1${group}234${decimal}56`;
      expect(parseDecimalInput(input, locale)).toBe("1234.56");
    }
  });

  it("normalizes Arabic-Indic digits", () => {
    expect(parseDecimalInput("١٢٣٤.٥٦", "en")).toBe("1234.56");
  });

  it("rejects empty, non-numeric, and ambiguous input", () => {
    expect(parseDecimalInput("", "en")).toBeNull();
    expect(parseDecimalInput("   ", "en")).toBeNull();
    expect(parseDecimalInput("abc", "en")).toBeNull();
    expect(parseDecimalInput("1..2", "en")).toBeNull();
    expect(parseDecimalInput("1.23.45", "en")).toBeNull();
    // In German the group separator is '.', so this grouping is invalid.
    expect(parseDecimalInput("1.234.56", "de")).toBeNull();
  });

  it("round-trips format -> parse for every locale", () => {
    for (const locale of locales) {
      const formatted = formatDecimal("1234.56", locale, 2);
      expect(parseDecimalInput(formatted, locale)).toBe("1234.56");
    }
  });
});
