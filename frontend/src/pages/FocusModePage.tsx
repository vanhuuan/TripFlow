import { CheckCircle2, ExternalLink, Image as ImageIcon, MapPinned, SkipForward, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTrip, markTripStepDone, skipTripStep, type TripDetail, type TripStep } from "../api/trips";
import { PageHeader } from "../components/PageHeader";
import { formatStepDateTime, stepStatusClassName, stepTypeIcon, stepTypeLabel } from "../components/trips/tripStepFormatting";
import { statusClassName } from "../components/trips/tripFormatting";

function resolveAssetUrl(url: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
  return `${baseUrl.replace(/\/$/, "")}${url}`;
}

function findCurrentStep(steps: TripStep[]) {
  return steps.filter((step) => step.status === "Todo").sort((a, b) => a.orderIndex - b.orderIndex)[0] ?? null;
}

export function FocusModePage() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    getTrip(tripId)
      .then((loadedTrip) => {
        if (isMounted) {
          setTrip(loadedTrip);
          setError(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Trip could not be loaded.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tripId]);

  const currentStep = useMemo(() => (trip ? findCurrentStep(trip.steps) : null), [trip]);
  const completedCount = trip?.steps.filter((step) => step.status === "Done").length ?? 0;
  const skippedCount = trip?.steps.filter((step) => step.status === "Skipped").length ?? 0;
  const todoCount = trip?.steps.filter((step) => step.status === "Todo").length ?? 0;

  async function handleStatus(step: TripStep, status: "Done" | "Skipped") {
    if (!tripId) return;
    setIsMutating(true);
    try {
      const updatedStep = status === "Done" ? await markTripStepDone(tripId, step.id) : await skipTripStep(tripId, step.id);
      setTrip((currentTrip) =>
        currentTrip
          ? {
              ...currentTrip,
              steps: currentTrip.steps.map((item) => (item.id === updatedStep.id ? updatedStep : item)),
            }
          : currentTrip,
      );
      setError(null);
    } catch {
      setError(`Step could not be marked ${status.toLowerCase()}.`);
    } finally {
      setIsMutating(false);
    }
  }

  if (isLoading) {
    return <div className="rounded border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">Loading focus mode...</div>;
  }

  if (!trip) {
    return (
      <section className="space-y-6">
        <PageHeader eyebrow="Focus mode" title="Trip not found" description="The trip could not be loaded." />
        {error ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <Link className="inline-flex rounded bg-coast px-4 py-2 font-semibold text-white" to="/dashboard">
          Back to dashboard
        </Link>
      </section>
    );
  }

  const currentStepResolved = currentStep;
  const upcomingSteps = trip.steps.filter((step) => step.status === "Todo" && step.id !== currentStepResolved?.id).sort((a, b) => a.orderIndex - b.orderIndex);
  const completedOrSkippedSteps = trip.steps.filter((step) => step.status !== "Todo").sort((a, b) => a.orderIndex - b.orderIndex);

  if (!currentStepResolved) {
    return (
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader eyebrow="Focus mode" title={trip.title} description={trip.destination} />
          <span className={`w-fit rounded px-2 py-1 text-xs font-semibold ring-1 ${statusClassName(trip.status)}`}>{trip.status}</span>
        </div>
        <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-coast">
            <Sparkles size={22} aria-hidden="true" />
            <h2 className="text-base font-semibold">Trip complete</h2>
          </div>
          <p className="mt-3 text-sm text-stone-600">All itinerary steps have been completed or skipped.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="inline-flex items-center gap-2 rounded bg-coast px-4 py-2 font-semibold text-white" to={`/trips/${trip.id}`}>
              Back to trip
            </Link>
            <Link className="inline-flex items-center gap-2 rounded border border-stone-300 px-4 py-2 font-semibold text-ink hover:bg-stone-50" to="/dashboard">
              Back to dashboard
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const TypeIcon = stepTypeIcon(currentStepResolved.type);
  const attachmentUrl = resolveAssetUrl(currentStepResolved.imageUrls[0] ?? null);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader eyebrow="Focus mode" title={trip.title} description={trip.destination} />
        <span className={`w-fit rounded px-2 py-1 text-xs font-semibold ring-1 ${statusClassName(trip.status)}`}>{trip.status}</span>
      </div>

      {error ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_320px]">
        <div className="space-y-5">
          <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-stone-500">Trip progress</p>
                <p className="mt-1 text-2xl font-semibold text-ink">
                  {completedCount + skippedCount} / {trip.steps.length || 1}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {completedCount} done, {skippedCount} skipped, {todoCount} remaining
                </p>
              </div>
              <Link className="inline-flex items-center justify-center gap-2 rounded border border-stone-300 px-4 py-2 font-semibold text-ink hover:bg-stone-50" to={`/trips/${trip.id}`}>
                View trip
              </Link>
            </div>
          </div>

          <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 text-coast">
              <TypeIcon size={22} aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{stepTypeLabel(currentStepResolved.type)}</p>
                <h2 className="text-xl font-semibold text-ink">{currentStepResolved.title}</h2>
              </div>
            </div>

            <p className="mt-3 text-sm text-stone-600">{formatStepDateTime(currentStepResolved.scheduledAt)}</p>
            {currentStepResolved.description ? <p className="mt-4 whitespace-pre-wrap text-sm text-stone-700">{currentStepResolved.description}</p> : <p className="mt-4 text-sm text-stone-500">No description for this step.</p>}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {currentStepResolved.googleMapsUrl ? (
                <a className="inline-flex items-center justify-center gap-2 rounded border border-stone-300 px-4 py-3 font-semibold text-ink hover:bg-stone-50" href={currentStepResolved.googleMapsUrl} target="_blank" rel="noreferrer">
                  <MapPinned size={18} aria-hidden="true" />
                  Open Google Maps
                </a>
              ) : null}
              {currentStepResolved.externalUrl ? (
                <a className="inline-flex items-center justify-center gap-2 rounded border border-stone-300 px-4 py-3 font-semibold text-ink hover:bg-stone-50" href={currentStepResolved.externalUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={18} aria-hidden="true" />
                  Open link
                </a>
              ) : null}
              {attachmentUrl ? (
                <a className="inline-flex items-center justify-center gap-2 rounded border border-stone-300 px-4 py-3 font-semibold text-ink hover:bg-stone-50 sm:col-span-2" href={attachmentUrl} target="_blank" rel="noreferrer">
                  <ImageIcon size={18} aria-hidden="true" />
                  Open attachment
                </a>
              ) : null}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button className="inline-flex flex-1 items-center justify-center gap-2 rounded bg-ink px-4 py-3 font-semibold text-white disabled:opacity-60" type="button" onClick={() => handleStatus(currentStepResolved, "Done")} disabled={isMutating}>
                <CheckCircle2 size={18} aria-hidden="true" />
                Mark done
              </button>
              <button className="inline-flex flex-1 items-center justify-center gap-2 rounded border border-stone-300 px-4 py-3 font-semibold text-ink hover:bg-stone-50 disabled:opacity-60" type="button" onClick={() => handleStatus(currentStepResolved, "Skipped")} disabled={isMutating}>
                <SkipForward size={18} aria-hidden="true" />
                Skip
              </button>
            </div>
          </div>

          <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-ink">Upcoming steps</h3>
            {upcomingSteps.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">No more upcoming steps.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {upcomingSteps.map((step) => {
                  const Icon = stepTypeIcon(step.type);
                  return (
                    <li key={step.id} className="rounded border border-stone-200 p-4">
                      <div className="flex items-start gap-3">
                        <Icon size={18} className="mt-0.5 shrink-0 text-coast" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{step.title}</p>
                          <p className="mt-1 text-sm text-stone-600">{stepTypeLabel(step.type)}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-ink">Completed and skipped</h3>
            {completedOrSkippedSteps.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">Nothing here yet.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {completedOrSkippedSteps.map((step) => (
                  <li key={step.id} className="rounded border border-stone-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{step.title}</p>
                        <p className="mt-1 text-xs text-stone-500">{stepTypeLabel(step.type)}</p>
                      </div>
                      <span className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ring-1 ${stepStatusClassName(step.status)}`}>{step.status}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-stone-500">Trip summary</p>
            <p className="mt-2 text-lg font-semibold text-ink">{trip.destination}</p>
            <p className="mt-2 text-sm text-stone-600">{trip.description ?? "No trip description yet."}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}
