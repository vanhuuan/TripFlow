import type { TripStatus } from "../../api/trips";

export function formatDateRange(startDate: string | null, endDate: string | null) {
  if (!startDate && !endDate) {
    return "Dates not set";
  }

  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }

  return formatDate(startDate ?? endDate ?? "");
}

export function formatDate(date: string) {
  if (!date) {
    return "Date not set";
  }

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${date}T00:00:00`));
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
