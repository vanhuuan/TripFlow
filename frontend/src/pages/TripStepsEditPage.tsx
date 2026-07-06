import { CheckCircle2, Edit, GripVertical, ListPlus, Play, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { completeTrip, deleteTrip, deleteTripStep, getTrip, reorderTripSteps, startTrip, updateTripStep, type TripDetail, type TripStep, type TripStepPayload } from "../api/trips";
import { PageHeader } from "../components/PageHeader";
import { formatDateRange, resolveAssetUrl, statusClassName } from "../components/trips/tripFormatting";

type Draft = {
  title: string;
  description: string;
  type: TripStep["type"];
  scheduledAt: string;
  googleMapsUrl: string;
  externalUrl: string;
  imageUrls: string[];
};

function toDraft(step: TripStep): Draft {
  return {
    title: step.title,
    description: step.description ?? "",
    type: step.type,
    scheduledAt: step.scheduledAt ? step.scheduledAt.slice(0, 16) : "",
    googleMapsUrl: step.googleMapsUrl ?? "",
    externalUrl: step.externalUrl ?? "",
    imageUrls: step.imageUrls,
  };
}

function toPayload(draft: Draft): TripStepPayload {
  return {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    type: draft.type,
    scheduledAt: draft.scheduledAt ? new Date(draft.scheduledAt).toISOString() : null,
    googleMapsUrl: draft.googleMapsUrl.trim() || null,
    externalUrl: draft.externalUrl.trim() || null,
    imageUrls: draft.imageUrls,
  };
}

function imagePreview(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
  return `${baseUrl.replace(/\/$/, "")}${url}`;
}

function StepReadOnly({ step }: { step: TripStep }) {
  return (
    <div className="grid gap-2 md:grid-cols-[140px_minmax(0,1fr)_220px] md:items-start">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{step.type}</p>
        <p className="mt-1 text-sm text-stone-600">{step.scheduledAt ? new Date(step.scheduledAt).toLocaleString() : "Unscheduled"}</p>
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-ink">{step.title}</p>
        {step.description ? <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">{step.description}</p> : <p className="mt-1 text-sm text-stone-500">No description.</p>}
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end">
        {step.googleMapsUrl ? <a className="rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50" href={step.googleMapsUrl} target="_blank" rel="noreferrer">Maps</a> : null}
        {step.externalUrl ? <a className="rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50" href={step.externalUrl} target="_blank" rel="noreferrer">Link</a> : null}
        {step.imageUrls.length > 0 ? <span className="rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink">{step.imageUrls.length} images</span> : null}
      </div>
    </div>
  );
}

function StepEditor({ draft, onChange, onSave, onCancel, onDelete, onDragStart, onDragEnd, onDrop, isMutating }: {
  draft: Draft;
  onChange: (next: Draft) => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDrop: () => void;
  isMutating: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Type
          <input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" value={draft.type} readOnly />
        </label>
        <label className="block text-sm font-medium">
          Title
          <input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" value={draft.title} onChange={(e) => onChange({ ...draft, title: e.target.value })} />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Description
        <textarea className="mt-1 min-h-24 w-full rounded border border-stone-300 px-3 py-2" value={draft.description} onChange={(e) => onChange({ ...draft, description: e.target.value })} />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Scheduled date/time
          <input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" type="datetime-local" value={draft.scheduledAt} onChange={(e) => onChange({ ...draft, scheduledAt: e.target.value })} />
        </label>
        <label className="block text-sm font-medium">
          Google Maps URL
          <input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" value={draft.googleMapsUrl} onChange={(e) => onChange({ ...draft, googleMapsUrl: e.target.value })} />
        </label>
      </div>
      <label className="block text-sm font-medium">
        External URL
        <input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" value={draft.externalUrl} onChange={(e) => onChange({ ...draft, externalUrl: e.target.value })} />
      </label>
      <div className="flex flex-wrap gap-2">
        {draft.imageUrls.map((url, index) => (
          <img key={`${url}-${index}`} className="h-14 w-14 rounded object-cover ring-1 ring-stone-200" src={imagePreview(url)} alt="Attachment preview" />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="inline-flex items-center gap-2 rounded bg-coast px-3 py-2 text-sm font-semibold text-white disabled:opacity-60" onClick={onSave} disabled={isMutating}>
          <Save size={16} aria-hidden="true" />
          Save
        </button>
        <button type="button" className="inline-flex items-center gap-2 rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50" onClick={onCancel} disabled={isMutating}>
          <X size={16} aria-hidden="true" />
          Cancel
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50"
          draggable
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            onDrop();
          }}
          title="Drag to reorder"
        >
          <GripVertical size={16} aria-hidden="true" />
          Drag
        </button>
        <button type="button" className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50" onClick={onDelete} disabled={isMutating}>
          <Trash2 size={16} aria-hidden="true" />
          Delete
        </button>
      </div>
    </div>
  );
}

export function TripStepsEditPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [draggingStepId, setDraggingStepId] = useState<string | null>(null);
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    getTrip(tripId)
      .then((loadedTrip) => {
        if (!isMounted) return;
        setTrip(loadedTrip);
        setDrafts(Object.fromEntries(loadedTrip.steps.map((step) => [step.id, toDraft(step)])));
        setError(null);
      })
      .catch(() => {
        if (isMounted) setError("Trip could not be loaded.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [tripId]);

  async function handleSaveStep(stepId: string) {
    if (!tripId || !trip) return;
    setIsMutating(true);
    try {
      const updatedStep = await updateTripStep(tripId, stepId, toPayload(drafts[stepId]));
      setTrip({ ...trip, steps: trip.steps.map((step) => (step.id === stepId ? updatedStep : step)) });
      setEditingStepId(null);
    } catch {
      setError("Step could not be saved.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteStep(step: TripStep) {
    if (!tripId || !window.confirm(`Delete step "${step.title}"? This cannot be undone.`)) return;
    setIsMutating(true);
    try {
      await deleteTripStep(tripId, step.id);
      setTrip((current) => (current ? { ...current, steps: current.steps.filter((item) => item.id !== step.id) } : current));
    } catch {
      setError("Step could not be deleted.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleReorder(stepIds: string[]) {
    if (!tripId) return;
    try {
      const reorderedSteps = await reorderTripSteps(tripId, stepIds);
      setTrip((current) => (current ? { ...current, steps: reorderedSteps } : current));
      setError(null);
    } catch {
      setError("Steps could not be reordered.");
    }
  }

  if (isLoading) {
    return <div className="rounded border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">Loading steps...</div>;
  }

  if (!tripId || !trip) {
    return (
      <section className="space-y-6">
        <PageHeader eyebrow="Itinerary" title="Step list not found" description="The trip could not be loaded for step editing." />
        {error ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <Link className="inline-flex rounded bg-coast px-4 py-2 font-semibold text-white" to="/dashboard">
          Back to dashboard
        </Link>
      </section>
    );
  }

  const coverUrl = resolveAssetUrl(trip.coverImageUrl);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader eyebrow="Itinerary" title="Edit steps" description={trip.title} />
        <span className={`w-fit rounded px-2 py-1 text-xs font-semibold ring-1 ${statusClassName(trip.status)}`}>{trip.status}</span>
      </div>

      {error ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="overflow-hidden rounded border border-stone-200 bg-white shadow-sm">
          <div className="h-56 bg-stone-100">
            {coverUrl ? <img className="h-full w-full object-cover" src={coverUrl} alt="" /> : <div className="flex h-full items-center justify-center text-sm text-stone-500">No cover image</div>}
          </div>
          <div className="space-y-4 p-5">
            <div>
              <h2 className="text-base font-semibold">Trip information</h2>
              <p className="mt-1 text-sm text-stone-600">{formatDateRange(trip.startDate, trip.endDate)}</p>
            </div>
            {trip.description ? <p className="whitespace-pre-wrap text-sm text-stone-700">{trip.description}</p> : <p className="text-sm text-stone-500">No description yet.</p>}
          </div>
        </div>

        <div className="space-y-3 rounded border border-stone-200 bg-white p-5 shadow-sm">
          <Link className="flex items-center justify-center gap-2 rounded border border-stone-300 px-4 py-2 font-semibold text-ink hover:bg-stone-50" to={`/trips/${trip.id}`}>
            Back to trip
          </Link>
        </div>
      </div>

      <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Step list editor</h2>
            <p className="mt-1 text-sm text-stone-600">Click Edit to open a step, then save or cancel. Drag handle is in the actions row.</p>
          </div>
        </div>

        {trip.steps.length === 0 ? (
          <p className="mt-5 rounded border border-dashed border-stone-200 p-4 text-sm text-stone-500">No itinerary steps yet.</p>
        ) : (
          <ol className="mt-5 space-y-3">
            {trip.steps.map((step) => {
              const isEditing = editingStepId === step.id;
              const draft = drafts[step.id] ?? toDraft(step);

              return (
                <li key={step.id} className="rounded border border-stone-200 p-4">
                  {isEditing ? (
                    <StepEditor
                      draft={draft}
                      onChange={(next) => setDrafts((current) => ({ ...current, [step.id]: next }))}
                      onSave={() => handleSaveStep(step.id)}
                      onCancel={() => {
                        setEditingStepId(null);
                        setDrafts((current) => ({ ...current, [step.id]: toDraft(step) }));
                      }}
                      onDelete={() => handleDeleteStep(step)}
                      onDragStart={() => setDraggingStepId(step.id)}
                      onDragEnd={() => setDraggingStepId(null)}
                      onDrop={async () => {
                        if (!draggingStepId || draggingStepId === step.id || !trip) return;
                        const nextSteps = [...trip.steps];
                        const fromIndex = nextSteps.findIndex((item) => item.id === draggingStepId);
                        const toIndex = nextSteps.findIndex((item) => item.id === step.id);
                        const [moved] = nextSteps.splice(fromIndex, 1);
                        nextSteps.splice(toIndex, 0, moved);
                        setDraggingStepId(null);
                        setTrip({ ...trip, steps: nextSteps });
                        await handleReorder(nextSteps.map((item) => item.id));
                      }}
                      isMutating={isMutating}
                    />
                  ) : (
                    <>
                      <StepReadOnly step={step} />
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button type="button" className="inline-flex items-center gap-2 rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50" onClick={() => setEditingStepId(step.id)}>
                          <Edit size={16} aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50"
                          draggable
                          onDragStart={() => setDraggingStepId(step.id)}
                          onDragEnd={() => setDraggingStepId(null)}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={async (event) => {
                            event.preventDefault();
                            if (!draggingStepId || draggingStepId === step.id || !trip) return;
                            const nextSteps = [...trip.steps];
                            const fromIndex = nextSteps.findIndex((item) => item.id === draggingStepId);
                            const toIndex = nextSteps.findIndex((item) => item.id === step.id);
                            const [moved] = nextSteps.splice(fromIndex, 1);
                            nextSteps.splice(toIndex, 0, moved);
                            setDraggingStepId(null);
                            setTrip({ ...trip, steps: nextSteps });
                            await handleReorder(nextSteps.map((item) => item.id));
                          }}
                          title="Drag to reorder"
                        >
                          <GripVertical size={16} aria-hidden="true" />
                          Drag
                        </button>
                        <button type="button" className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50" onClick={() => handleDeleteStep(step)} disabled={isMutating}>
                          <Trash2 size={16} aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}


