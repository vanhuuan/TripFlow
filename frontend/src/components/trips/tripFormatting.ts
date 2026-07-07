import type { TripStatus } from "../../api/trips";
import { getLocaleCode, getMessage, getStatusLabel, type Locale } from "../../i18n";

export function formatDateRange(startDate: string | null, endDate: string | null, locale: Locale = "vi") {
  if (!startDate && !endDate) {
    return getMessage(locale, "common.datesNotSet");
  }

  if (startDate && endDate) {
    return `${formatDate(startDate, locale)} - ${formatDate(endDate, locale)}`;
  }

  return formatDate(startDate ?? endDate ?? "", locale);
}

export function formatDate(date: string, locale: Locale = "vi") {
  if (!date) {
    return getMessage(locale, "common.dateNotSet");
  }

  return new Intl.DateTimeFormat(getLocaleCode(locale), { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

export function formatMoney(amount: string | number | null, currencyCode: string, locale: Locale = "vi") {
  if (amount === null || amount === "") {
    return getMessage(locale, "common.noCost");
  }

  const numericAmount = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(numericAmount)) {
    return getMessage(locale, "common.noCost");
  }

  const normalizedCurrencyCode = currencyCode.trim().toUpperCase();
  try {
    return new Intl.NumberFormat(getLocaleCode(locale), { style: "currency", currency: normalizedCurrencyCode }).format(numericAmount);
  } catch {
    return `${numericAmount.toLocaleString(getLocaleCode(locale))} ${normalizedCurrencyCode}`;
  }
}

export function statusClassName(status: TripStatus) {
  switch (status) {
    case "Active":
      return "bg-teal-50 text-coast ring-teal-100";
    case "Completed":
      return "bg-stone-100 text-stone-700 ring-stone-200";
    case "Draft":
    default:
      return "bg-amber-50 text-amber-700 ring-amber-100";
  }
}

export function statusLabel(status: TripStatus, locale: Locale = "vi") {
  return getStatusLabel(locale, status);
}

export function resolveAssetUrl(url: string | null) {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
  return `${baseUrl.replace(/\/$/, "")}${url}`;
}
