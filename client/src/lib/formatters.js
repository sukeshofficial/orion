/**
 * Shared Formatting Utilities for ORION
 * Handles currency (minor units <-> major units), dates, and status helpers.
 */

export function toMinorUnits(value) {
  if (value === null || value === undefined || value === "") return 0;
  const num = Number(value);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

export function fromMinorUnits(minor) {
  if (minor === null || minor === undefined || isNaN(minor)) return 0;
  return Number(minor) / 100;
}

export function formatCurrency(amount, isMinor = true) {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹ 0";
  const num = isMinor ? Number(amount) / 100 : Number(amount);
  return `₹ ${num.toLocaleString("en-IN", {
    minimumFractionDigits: num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatDateInput(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

