import { MapPin, Hotel, BusFront, UtensilsCrossed, Sparkles, StickyNote } from "lucide-react";
import type { TripStepStatus, TripStepType } from "../../api/trips";

export function formatStepDateTime(value: string | null) {
  if (!value) {
    return "Unscheduled";
  }

  return new Intl.DateTimeFormat(undefined, {
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

export function stepTypeLabel(type: TripStepType) {
  return type;
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
