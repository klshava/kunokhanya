const zarFormatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 2,
});

/** Formats a number as South African Rand, e.g. formatZAR(1500) -> "R 1,500.00" */
export function formatZAR(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? parseFloat(amount) : amount ?? 0;
  if (Number.isNaN(n)) return "R 0.00";
  return zarFormatter.format(n).replace("ZAR", "R").replace("R\u00A0", "R ");
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
}
