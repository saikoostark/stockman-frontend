import Decimal from "decimal.js";

export const CURRENCY_PRECISION: Record<string, number> = {
  EGP: 2,
  USDT: 8,
};

export function precisionFor(currency: string): number {
  return CURRENCY_PRECISION[currency] ?? 2;
}

/**
 * Format a decimal string for display in the given locale, preserving the
 * currency's decimal places. Never performs float arithmetic on the value.
 * Falls back to a manual string grouping only for magnitudes beyond Number's
 * safe integer range (never expected for a paper-trading wallet).
 */
export function formatDecimal(value: string, locale: string, dp: number): string {
  const rounded = new Decimal(value).toDecimalPlaces(dp, Decimal.ROUND_HALF_UP);
  const numeric = rounded.toNumber();
  if (!Number.isFinite(numeric) || Math.abs(numeric) >= Number.MAX_SAFE_INTEGER) {
    return manualFormat(rounded, locale, dp);
  }
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
    useGrouping: true,
  }).format(numeric);
}

export function formatMoney(value: string, currency: string, locale: string): string {
  return formatDecimal(value, locale, precisionFor(currency));
}

export function formatNumber(value: string, locale: string): string {
  return formatDecimal(value, locale, 8).replace(/0+$/, "").replace(/\.$/, "");
}

function manualFormat(value: Decimal, locale: string, dp: number): string {
  const sign = value.isNegative() ? "-" : "";
  const [intPart, fracPart] = value.abs().toFixed(dp).split(".");
  const { group, decimal } = separatorsFor(locale);
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  return `${sign}${grouped}${dp > 0 ? decimal + fracPart : ""}`;
}

function separatorsFor(locale: string): { group: string; decimal: string } {
  const parts = new Intl.NumberFormat(locale, { useGrouping: true }).formatToParts(1234567.5);
  const group = parts.find((p) => p.type === "group")?.value ?? ",";
  const decimal = parts.find((p) => p.type === "decimal")?.value ?? ".";
  return { group, decimal };
}
