import Decimal from "decimal.js";

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_INDIC = "۰۱۲۳۴۵۶۷۸۹";

function normalizeDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(ARABIC_INDIC.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_INDIC.indexOf(d)));
}

interface Separators {
  group: string;
  decimal: string;
}

function separatorsFor(locale: string): Separators {
  const parts = new Intl.NumberFormat(locale, { useGrouping: true }).formatToParts(1234567.5);
  const group = parts.find((p) => p.type === "group")?.value ?? ",";
  const decimal = parts.find((p) => p.type === "decimal")?.value ?? ".";
  return { group, decimal };
}

/**
 * Parse a locale-formatted decimal string into a canonical decimal string
 * (ASCII digits, '.' decimal point). Returns null for invalid or ambiguous input.
 */
export function parseDecimalInput(input: string, locale: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const normalized = normalizeDigits(trimmed);
  const { group, decimal } = separatorsFor(locale);

  // Reject inputs that mix a group separator and a decimal separator in an
  // ambiguous order (e.g. "1.234,56" is fine in de, "1,234.56" is fine in en,
  // but both separators plus non-3-digit groups are rejected below).
  let candidate = normalized;
  if (group && group !== decimal) {
    // Validate grouping: every group after the first must be exactly 3 digits.
    const parts = candidate.split(decimal);
    const intPart = parts[0];
    if (intPart.includes(group)) {
      const groups = intPart.split(group);
      if (
        groups[0].length === 0 ||
        groups.some((g, i) => i > 0 && g.length !== 3)
      ) {
        return null;
      }
      candidate = candidate.split(group).join("");
    }
    if (candidate.includes(decimal)) {
      candidate = candidate.split(decimal).join(".");
    }
  } else if (decimal !== ".") {
    candidate = candidate.split(decimal).join(".");
  }

  if (!/^-?\d*\.?\d+$/.test(candidate)) return null;
  try {
    const value = new Decimal(candidate);
    if (!value.isFinite()) return null;
    return value.toFixed();
  } catch {
    return null;
  }
}
