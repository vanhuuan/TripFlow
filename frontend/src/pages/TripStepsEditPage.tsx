import { CheckCircle2, Edit, GripVertical, Save, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  completeTrip,
  createTripStep,
  deleteTripStep,
  getTrip,
  reorderTripSteps,
  startTrip,
  updateTripStep,
  uploadFile,
  type TripDetail,
  type TripStep,
  type TripStepPayload,
  type TripStepType,
} from "../api/trips";
import { PageHeader } from "../components/PageHeader";
import { TripStepImageCarousel } from "../components/trips/TripStepImageCarousel";
import { formatDateRange, resolveAssetUrl, statusClassName } from "../components/trips/tripFormatting";

type Draft = {
  title: string;
  description: string;
  type: TripStepType;
  scheduledAt: string;
  costAmount: string;
  googleMapsUrl: string;
  externalUrl: string;
  imageUrls: string[];
};

type StepCard = {
  clientId: string;
  serverId: string | null;
  draft: Draft;
  originalDraft: Draft;
  isEditing: boolean;
};

function asText(value: unknown) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function imagePreview(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
  return `${baseUrl.replace(/\/$/, "")}${url}`;
}

function blankDraft(): Draft {
  return {
    title: "",
    description: "",
    type: "Place",
    scheduledAt: "",
    costAmount: "",
    googleMapsUrl: "",
    externalUrl: "",
    imageUrls: [],
  };
}

function toDraft(step: TripStep): Draft {
  return {
    title: asText(step.title),
    description: asText(step.description),
    type: step.type,
    scheduledAt: step.scheduledAt ? asText(step.scheduledAt).slice(0, 16) : "",
    costAmount: asText(step.costAmount),
    googleMapsUrl: asText(step.googleMapsUrl),
    externalUrl: asText(step.externalUrl),
    imageUrls: step.imageUrls,
  };
}

function draftToPayload(draft: Draft): TripStepPayload {
  return {
    title: asText(draft.title).trim(),
    description: asText(draft.description).trim() || null,
    type: draft.type,
    scheduledAt: asText(draft.scheduledAt) ? new Date(asText(draft.scheduledAt)).toISOString() : null,
    costAmount: asText(draft.costAmount).trim() ? Number(asText(draft.costAmount)) : null,
    googleMapsUrl: asText(draft.googleMapsUrl).trim() || null,
    externalUrl: asText(draft.externalUrl).trim() || null,
    imageUrls: draft.imageUrls,
  };
}

function createClientId() {
  if ("randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `draft-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function draftSignature(draft: Draft) {
  return JSON.stringify(draft);
}

function isDraftDirty(card: StepCard) {
  return draftSignature(card.draft) !== draftSignature(card.originalDraft);
}

function validateDraft(draft: Draft) {
  if (!asText(draft.title).trim()) return "Title is required.";
  if (!asText(draft.costAmount).trim()) return null;

  const cost = Number(asText(draft.costAmount));
  if (!Number.isFinite(cost) || cost < 0) return "Cost must be zero or greater.";

  return null;
}

function StepSummary({ draft, isDirty }: { draft: Draft; isDirty: boolean }) {
  const scheduledText = asText(draft.scheduledAt);
  const scheduledLabel = scheduledText ? new Date(scheduledText).toLocaleString() : "Unscheduled";

  return (
    <div className="grid gap-3 md:grid-cols-[140px_minmax(0,1fr)_180px_220px] md:items-start">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{draft.type}</p>
        <p className="mt-1 text-sm text-stone-600">{scheduledLabel}</p>
        {isDirty ? <p className="mt-2 text-xs font-semibold text-coast">Unsaved changes</p> : null}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-ink">{asText(draft.title) || "Untitled step"}</p>
        {asText(draft.costAmount).trim() ? <p className="mt-1 text-sm text-stone-600">Cost: {asText(draft.costAmount)}</p> : null}
        {asText(draft.description).trim() ? <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">{asText(draft.description)}</p> : <p className="mt-1 text-sm text-stone-500">No description.</p>}
        {draft.imageUrls.length > 0 ? <TripStepImageCarousel className="max-w-[180px]" imageUrls={draft.imageUrls} altPrefix={draft.title || "Step"} variant="compact" /> : null}
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end">
        {asText(draft.googleMapsUrl).trim() ? (
          <a className="rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50" href={asText(draft.googleMapsUrl).trim()} target="_blank" rel="noreferrer">
            Maps
          </a>
        ) : null}
        {asText(draft.externalUrl).trim() ? (
          <a className="rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50" href={asText(draft.externalUrl).trim()} target="_blank" rel="noreferrer">
            Link
          </a>
        ) : null}
      </div>
    </div>
  );
}

function StepEditor({
  draft,
  onChange,
  onDone,
  onCancel,
  onDelete,
  onDragStart,
  onDragEnd,
  isMutating,
}: {
  draft: Draft;
  onChange: (next: Draft) => void;
  onDone: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  isMutating: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleImageSelection(files: FileList | null) {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const uploadedUrls: string[] = [];
      for (const file of Array.from(files)) {
        uploadedUrls.push(await uploadFile(file, "TripStep"));
      }
      onChange({ ...draft, imageUrls: [...draft.imageUrls, ...uploadedUrls] });
    } catch {
      setUploadError("Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage(url: string) {
    onChange({ ...draft, imageUrls: draft.imageUrls.filter((item) => item !== url) });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Type
          <select className="mt-1 w-full rounded border border-stone-300 px-3 py-2" value={draft.type} onChange={(event) => onChange({ ...draft, type: event.target.value as TripStepType })}>
            {["Place", "Transport", "Hotel", "Restaurant", "Activity", "Note"].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium">
          Title
          <input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Scheduled date/time
          <input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" type="datetime-local" value={draft.scheduledAt} onChange={(event) => onChange({ ...draft, scheduledAt: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">
          Cost
          <input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" inputMode="decimal" type="number" min="0" step="0.01" value={draft.costAmount} onChange={(event) => onChange({ ...draft, costAmount: event.target.value })} />
        </label>
      </div>
      <label className="block text-sm font-medium">
        Description
        <textarea className="mt-1 min-h-24 w-full rounded border border-stone-300 px-3 py-2" value={draft.description} onChange={(event) => onChange({ ...draft, description: event.target.value })} />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm font-medium">
          Google Maps URL
          <input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" value={draft.googleMapsUrl} onChange={(event) => onChange({ ...draft, googleMapsUrl: event.target.value })} />
        </label>
        <label className="block text-sm font-medium">
          External URL
          <input className="mt-1 w-full rounded border border-stone-300 px-3 py-2" value={draft.externalUrl} onChange={(event) => onChange({ ...draft, externalUrl: event.target.value })} />
        </label>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {draft.imageUrls.length > 0 ? (
            draft.imageUrls.map((url, index) => (
              <div key={`${url}-${index}`} className="relative">
                <img className="h-20 w-20 rounded object-cover ring-1 ring-stone-200" src={imagePreview(url)} alt="Current image" />
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-stone-700 shadow hover:bg-white"
                  onClick={() => removeImage(url)}
                  aria-label="Remove image"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
            ))
          ) : (
            <div className="text-sm text-stone-500">No images yet.</div>
          )}
        </div>
        <label className="block text-sm font-medium">
          Select images
          <input
            className="mt-1 w-full rounded border border-stone-300 px-3 py-2 text-sm"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => void handleImageSelection(event.target.files)}
            disabled={isUploading || isMutating}
          />
        </label>
        {uploadError ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{uploadError}</p> : null}
        {isUploading ? <p className="text-sm text-stone-500">Uploading images...</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="inline-flex cursor-grab items-center gap-2 rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50 active:cursor-grabbing"
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", draft.title || "step");
            onDragStart();
          }}
          onDragEnd={onDragEnd}
          title="Drag to reorder"
        >
          <GripVertical size={16} aria-hidden="true" />
          Drag
        </button>
        <button type="button" className="inline-flex items-center gap-2 rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50" onClick={onDone} disabled={isMutating || isUploading}>
          <Save size={16} aria-hidden="true" />
          Done
        </button>
        <button type="button" className="inline-flex items-center gap-2 rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50" onClick={onCancel} disabled={isMutating || isUploading}>
          <X size={16} aria-hidden="true" />
          Cancel
        </button>
        <button type="button" className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50" onClick={onDelete} disabled={isMutating || isUploading}>
          <Trash2 size={16} aria-hidden="true" />
          Delete
        </button>
      </div>
    </div>
  );
}

function cardOrderSignature(cards: StepCard[]) {
  return cards.map((card) => card.serverId ?? card.clientId).join("|");
}

export function TripStepsEditPage() {
  const { tripId } = useParams();
  const location = useLocation();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [cards, setCards] = useState<StepCard[]>([]);
  const [savedOrder, setSavedOrder] = useState<string[]>([]);
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

        const highlightedStepId = (location.state as { highlightStepId?: string } | null | undefined)?.highlightStepId ?? null;
        const nextCards = loadedTrip.steps.map((step) => {
          const draft = toDraft(step);
          return {
            clientId: step.id,
            serverId: step.id,
            draft,
            originalDraft: draft,
            isEditing: step.id === highlightedStepId,
          };
        });

        setTrip(loadedTrip);
        setCards(nextCards);
        setSavedOrder(nextCards.map((card) => card.serverId ?? card.clientId));
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
  }, [location.state, tripId]);

  const hasUnsavedChanges = useMemo(() => {
    const currentOrder = cardOrderSignature(cards);
    return currentOrder !== savedOrder.join("|") || cards.some((card) => card.serverId === null || isDraftDirty(card));
  }, [cards, savedOrder]);

  function updateCard(clientId: string, update: (card: StepCard) => StepCard) {
    setCards((current) => current.map((card) => (card.clientId === clientId ? update(card) : card)));
  }

  function addDraftCard() {
    const draft = blankDraft();
    const clientId = createClientId();
    setCards((current) => [...current, { clientId, serverId: null, draft, originalDraft: draft, isEditing: true }]);
    setError(null);
  }

  function moveCard(draggedId: string, targetId: string) {
    setCards((current) => {
      const fromIndex = current.findIndex((card) => card.clientId === draggedId);
      const toIndex = current.findIndex((card) => card.clientId === targetId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return current;

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function cancelCard(card: StepCard) {
    if (card.serverId === null) {
      setCards((current) => current.filter((item) => item.clientId !== card.clientId));
      return;
    }

    updateCard(card.clientId, (current) => ({ ...current, draft: current.originalDraft, isEditing: false }));
  }

  async function deleteCard(card: StepCard) {
    if (!tripId || !window.confirm(`Delete step "${card.draft.title || "Untitled step"}"? This cannot be undone.`)) return;

    if (card.serverId === null) {
      setCards((current) => current.filter((item) => item.clientId !== card.clientId));
      return;
    }

    setIsSaving(true);
    try {
      await deleteTripStep(tripId, card.serverId);
      setCards((current) => current.filter((item) => item.clientId !== card.clientId));
      setSavedOrder((current) => current.filter((id) => id !== card.serverId));
      setError(null);
    } catch {
      setError("Step could not be deleted.");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveAllChanges() {
    if (!tripId || !cards.length) return;

    for (const card of cards) {
      const validationError = validateDraft(card.draft);
      if (validationError) {
        setError(validationError);
        updateCard(card.clientId, (current) => ({ ...current, isEditing: true }));
        return;
      }
    }

    setIsSaving(true);
    setError(null);
    let nextCards = [...cards];

    try {
      for (let index = 0; index < nextCards.length; index++) {
        const card = nextCards[index];
        if (card.serverId === null) {
          const createdStep = await createTripStep(tripId, draftToPayload(card.draft));
          const savedDraft = toDraft(createdStep);
          nextCards[index] = {
            ...card,
            clientId: createdStep.id,
            serverId: createdStep.id,
            draft: savedDraft,
            originalDraft: savedDraft,
            isEditing: false,
          };
          setCards([...nextCards]);
          continue;
        }

        if (isDraftDirty(card)) {
          const updatedStep = await updateTripStep(tripId, card.serverId, draftToPayload(card.draft));
          const savedDraft = toDraft(updatedStep);
          nextCards[index] = {
            ...card,
            draft: savedDraft,
            originalDraft: savedDraft,
            isEditing: false,
          };
          setCards([...nextCards]);
          continue;
        }

        nextCards[index] = { ...card, isEditing: false };
      }

      const persistedIds = nextCards.map((card) => card.serverId).filter((id): id is string => Boolean(id));
      if (persistedIds.length > 0) {
        await reorderTripSteps(tripId, persistedIds);
      }

      setCards(nextCards);
      setSavedOrder(persistedIds);
      setError(null);
    } catch {
      setError("Changes could not be saved.");
    } finally {
      setIsSaving(false);
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
          <button className="flex w-full items-center justify-center gap-2 rounded bg-coast px-4 py-2 font-semibold text-white disabled:opacity-60" type="button" onClick={() => void startTrip(trip.id)} disabled={isSaving || trip.status === "Active"}>
            <CheckCircle2 size={18} aria-hidden="true" />
            Start trip
          </button>
          <button className="flex w-full items-center justify-center gap-2 rounded bg-ink px-4 py-2 font-semibold text-white disabled:opacity-60" type="button" onClick={() => void completeTrip(trip.id)} disabled={isSaving || trip.status === "Completed"}>
            <CheckCircle2 size={18} aria-hidden="true" />
            Complete trip
          </button>
          <Link className="flex items-center justify-center gap-2 rounded border border-stone-300 px-4 py-2 font-semibold text-ink hover:bg-stone-50" to={`/trips/${trip.id}`}>
            Back to trip
          </Link>
        </div>
      </div>

      <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Step list editor</h2>
            <p className="mt-1 text-sm text-stone-600">Add a step to append a new editable card. Reorder locally, then save all changes together.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center justify-center gap-2 rounded border border-stone-300 px-4 py-2 font-semibold text-ink hover:bg-stone-50 disabled:opacity-60" type="button" onClick={addDraftCard} disabled={isSaving}>
              <Edit size={16} aria-hidden="true" />
              Add step
            </button>
            <button className="inline-flex items-center justify-center gap-2 rounded bg-coast px-4 py-2 font-semibold text-white disabled:opacity-60" type="button" onClick={() => void saveAllChanges()} disabled={isSaving || !hasUnsavedChanges}>
              <Save size={16} aria-hidden="true" />
              {isSaving ? "Saving..." : "Save all changes"}
            </button>
          </div>
        </div>

        {cards.length === 0 ? (
          <div className="mt-5 rounded border border-dashed border-stone-200 p-4">
            <p className="text-sm text-stone-500">No itinerary steps yet.</p>
            <button className="mt-3 inline-flex items-center gap-2 rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50" type="button" onClick={addDraftCard} disabled={isSaving}>
              <Edit size={16} aria-hidden="true" />
              Add your first step
            </button>
          </div>
        ) : (
          <>
            <ol className="mt-5 space-y-3">
              {cards.map((card) => (
                <li
                  key={card.clientId}
                  className={`rounded border border-stone-200 p-4 ${draggingCardId === card.clientId ? "border-coast bg-teal-50/20" : ""}`}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (!draggingCardId || draggingCardId === card.clientId) return;
                    moveCard(draggingCardId, card.clientId);
                    setDraggingCardId(null);
                  }}
                >
                  {card.isEditing ? (
                    <StepEditor
                      draft={card.draft}
                      onChange={(next) => updateCard(card.clientId, (current) => ({ ...current, draft: next }))}
                      onDone={() => updateCard(card.clientId, (current) => ({ ...current, isEditing: false }))}
                      onCancel={() => cancelCard(card)}
                      onDelete={() => void deleteCard(card)}
                      onDragStart={() => setDraggingCardId(card.clientId)}
                      onDragEnd={() => setDraggingCardId(null)}
                      isMutating={isSaving}
                    />
                  ) : (
                    <>
                      <StepSummary draft={card.draft} isDirty={isDraftDirty(card) || card.serverId === null} />
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button type="button" className="inline-flex items-center gap-2 rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50" onClick={() => updateCard(card.clientId, (current) => ({ ...current, isEditing: true }))} disabled={isSaving}>
                          <Edit size={16} aria-hidden="true" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="inline-flex cursor-grab items-center gap-2 rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50 active:cursor-grabbing"
                          draggable
                          onDragStart={(event) => {
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", card.clientId);
                            setDraggingCardId(card.clientId);
                          }}
                          onDragEnd={() => setDraggingCardId(null)}
                          title="Drag to reorder"
                          disabled={isSaving}
                        >
                          <GripVertical size={16} aria-hidden="true" />
                          Drag
                        </button>
                        <button type="button" className="inline-flex items-center gap-2 rounded border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50" onClick={() => void deleteCard(card)} disabled={isSaving}>
                          <Trash2 size={16} aria-hidden="true" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ol>
            <div className="mt-5 flex justify-end">
              <button className="inline-flex items-center justify-center gap-2 rounded border border-stone-300 px-4 py-2 font-semibold text-ink hover:bg-stone-50 disabled:opacity-60" type="button" onClick={addDraftCard} disabled={isSaving}>
                <Edit size={16} aria-hidden="true" />
                Add step
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
