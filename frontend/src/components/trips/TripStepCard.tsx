import { Edit2, ExternalLink, GripVertical, Image as ImageIcon, MapPinned, ReceiptText, Trash2 } from "lucide-react";
import type { HTMLAttributes } from "react";
import { Link } from "react-router-dom";
import type { TripStep } from "../../api/trips";
import { formatMoney } from "./tripFormatting";
import { formatStepDateTime, stepStatusClassName, stepTypeIcon, stepTypeLabel } from "./tripStepFormatting";

type TripStepCardProps = {
  tripId: string;
  step: TripStep;
  isDragging?: boolean;
  onDelete: (step: TripStep) => void;
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
};

export function TripStepCard({ tripId, step, isDragging, onDelete, dragHandleProps }: TripStepCardProps) {
  const TypeIcon = stepTypeIcon(step.type);
  const scheduledLabel = formatStepDateTime(step.scheduledAt);

  return (
    <article className={`rounded border border-stone-200 bg-white p-4 shadow-sm transition ${isDragging ? "cursor-grabbing border-coast bg-teal-50/30" : "hover:border-coast"}`} data-step-id={step.id}>
      <div className="flex items-start gap-3">
        <button type="button" className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded border border-stone-200 text-stone-500 hover:bg-stone-50" aria-label={`Drag ${step.title}`} {...dragHandleProps}><GripVertical size={16} aria-hidden="true" /></button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex items-center gap-2 text-coast"><TypeIcon size={16} aria-hidden="true" /><p className="text-xs font-semibold uppercase tracking-wide">{stepTypeLabel(step.type)}</p></div><h3 className="mt-1 text-base font-semibold text-ink">{step.title}</h3><p className="mt-1 text-sm text-stone-500">{scheduledLabel}</p></div><span className={`w-fit rounded px-2 py-1 text-xs font-semibold ring-1 ${stepStatusClassName(step.status)}`}>{step.status}</span></div>
          {step.description ? <p className="mt-3 whitespace-pre-wrap text-sm text-stone-700">{step.description}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">{step.costAmount != null ? <span className="inline-flex items-center rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink">{formatMoney(step.costAmount, "USD")}</span> : null}{step.googleMapsUrl ? <a className="inline-flex items-center gap-2 rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50" href={step.googleMapsUrl} target="_blank" rel="noreferrer"><MapPinned size={16} aria-hidden="true" />Maps</a> : null}{step.externalUrl ? <a className="inline-flex items-center gap-2 rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50" href={step.externalUrl} target="_blank" rel="noreferrer"><ExternalLink size={16} aria-hidden="true" />Link</a> : null}{step.imageUrls.length > 0 ? <a className="inline-flex items-center gap-2 rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50" href={step.imageUrls[0]} target="_blank" rel="noreferrer"><ReceiptText size={16} aria-hidden="true" />Images</a> : null}</div>
          <div className="mt-4 flex flex-wrap gap-2"><Link className="inline-flex items-center gap-2 rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50" to={`/trips/${tripId}/steps/${step.id}/edit`}><Edit2 size={16} aria-hidden="true" />Edit</Link><button className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50" type="button" onClick={() => onDelete(step)}><Trash2 size={16} aria-hidden="true" />Delete</button></div>
        </div>
      </div>
    </article>
  );
}

