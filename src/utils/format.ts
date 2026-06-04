/** Українська локаль для числового форматування (пробіл між тисячами, кома як десятковий). */
const NUMBER_FORMATTER_CACHE = new Map<string, Intl.NumberFormat>();

export function formatNumber(value: number | undefined | null, decimals = 3): string {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return "—";
  }
  const key = `${decimals}`;
  let formatter = NUMBER_FORMATTER_CACHE.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("uk-UA", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: true,
    });
    NUMBER_FORMATTER_CACHE.set(key, formatter);
  }
  return formatter.format(value);
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("uk-UA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
