import { BusFront, Hotel, MapPin, Sparkles, StickyNote, UtensilsCrossed } from "lucide-react";
import type { TripStepStatus, TripStepType } from "../../api/trips";
import { getLocaleCode, getMessage, getStepStatusLabel, getStepTypeLabel, type Locale } from "../../i18n";

export function formatStepDateTime(value: string | null, locale: Locale = "vi") {
  if (!value) {
    return getMessage(locale, "common.unscheduled");
  }

  return new Intl.DateTimeFormat(getLocaleCode(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function stepStatusClassName(status: TripStepStatus) {
  switch (status) {
    case "Done":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";
    case "Skipped":
      return "bg-stone-100 text-stone-600 ring-stone-200";
    case "Todo":
    default:
      return "bg-amber-50 text-amber-700 ring-amber-100";
  }
}

export function stepStatusLabel(status: TripStepStatus, locale: Locale = "vi") {
  return getStepStatusLabel(locale, status);
}

export function stepTypeLabel(type: TripStepType, locale: Locale = "vi") {
  return getStepTypeLabel(locale, type);
}

export function stepTypeIcon(type: TripStepType) {
  switch (type) {
    case "Transport":
      return BusFront;
    case "Hotel":
      return Hotel;
    case "Restaurant":
      return UtensilsCrossed;
    case "Activity":
      return Sparkles;
    case "Note":
      return StickyNote;
    case "Place":
    default:
      return MapPin;
  }
}
