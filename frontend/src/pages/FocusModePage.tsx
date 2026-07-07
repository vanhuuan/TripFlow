import { CheckCircle2, ExternalLink, MapPinned, SkipForward, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getTrip, markTripStepDone, skipTripStep, type TripDetail, type TripStep } from "../api/trips";
import { useI18n } from "../i18n";
import { PageHeader } from "../components/PageHeader";
import { TripStepImageCarousel } from "../components/trips/TripStepImageCarousel";
import { formatStepDateTime, stepStatusClassName, stepStatusLabel, stepTypeIcon, stepTypeLabel } from "../components/trips/tripStepFormatting";
import { statusClassName, statusLabel } from "../components/trips/tripFormatting";

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
  const { locale, t } = useI18n();
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
          setError(t("common.tripCouldNotBeLoaded"));
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
  }, [t, tripId]);

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
      setError(status === "Done" ? t("common.stepCouldNotBeMarkedDone") : t("common.stepCouldNotBeMarkedSkipped"));
    } finally {
      setIsMutating(false);
    }
  }

  if (isLoading) {
    return <div className="surface-card px-5 py-4 text-sm text-stone-600">{t("common.loadingFocusMode")}</div>;
  }

  if (!trip) {
    return (
      <section className="space-y-6">
        <PageHeader eyebrow={t("focus.eyebrow")} title={t("common.tripNotFound")} description={t("common.tripCouldNotBeLoaded")} />
        {error ? <p className="surface-card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        <Link className="button-primary pressable active:scale-[0.96]" to="/dashboard">
          {t("common.backToDashboard")}
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
          <PageHeader eyebrow={t("focus.eyebrow")} title={trip.title} description={trip.destination} />
          <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClassName(trip.status)}`}>{statusLabel(trip.status, locale)}</span>
        </div>
        <div className="surface-card p-5 sm:p-6">
          <div className="flex items-center gap-3 text-coast">
            <Sparkles size={22} aria-hidden="true" />
            <h2 className="text-base font-semibold text-balance">{t("focus.tripComplete")}</h2>
          </div>
          <p className="mt-3 text-sm text-stone-600">{t("focus.allItineraryStepsCompleted")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="button-primary pressable active:scale-[0.96]" to={`/trips/${trip.id}`}>
              {t("common.backToTrip")}
            </Link>
            <Link className="button-secondary pressable active:scale-[0.96]" to="/dashboard">
              {t("common.backToDashboard")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const TypeIcon = stepTypeIcon(currentStepResolved.type);
  const coverUrl = resolveAssetUrl(trip.coverImageUrl);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader eyebrow={t("focus.eyebrow")} title={trip.title} description={trip.destination} />
        <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClassName(trip.status)}`}>{statusLabel(trip.status, locale)}</span>
      </div>

      {error ? <p className="surface-card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_320px]">
        <div className="space-y-6">
          <div className="surface-card p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-stone-500">{t("focus.tripProgress")}</p>
                <p className="mt-1 text-3xl font-semibold text-ink">
                  {completedCount + skippedCount} / {trip.steps.length || 1}
                </p>
                <p className="mt-1 text-sm text-stone-600">
                  {completedCount} {t("focus.done")}, {skippedCount} {t("focus.skipped")}, {todoCount} {t("focus.remaining")}
                </p>
              </div>
              <Link className="button-secondary pressable active:scale-[0.96]" to={`/trips/${trip.id}`}>
                {t("focus.viewTrip")}
              </Link>
            </div>
          </div>

          <div className="surface-card p-5 sm:p-6">
            <div className="flex items-center gap-3 text-coast">
              <TypeIcon size={22} aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">{stepTypeLabel(currentStepResolved.type, locale)}</p>
                <h2 className="text-balance text-2xl font-semibold text-ink">{currentStepResolved.title}</h2>
              </div>
            </div>

            <p className="mt-3 text-sm text-stone-600">{formatStepDateTime(currentStepResolved.scheduledAt, locale)}</p>
            {currentStepResolved.description ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-700">{currentStepResolved.description}</p> : <p className="mt-4 text-sm text-stone-500">{t("common.noDescriptionForThisStep")}</p>}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {currentStepResolved.googleMapsUrl ? (
                <a className="button-secondary pressable px-4 py-3 active:scale-[0.96]" href={currentStepResolved.googleMapsUrl} target="_blank" rel="noreferrer">
                  <MapPinned size={18} aria-hidden="true" />
                  {t("common.openGoogleMaps")}
                </a>
              ) : null}
              {currentStepResolved.externalUrl ? (
                <a className="button-secondary pressable px-4 py-3 active:scale-[0.96]" href={currentStepResolved.externalUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={18} aria-hidden="true" />
                  {t("common.openLink")}
                </a>
              ) : null}
            </div>

            {currentStepResolved.imageUrls.length > 0 ? <TripStepImageCarousel className="mt-5" imageUrls={currentStepResolved.imageUrls} altPrefix={currentStepResolved.title} /> : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button className="button-primary pressable flex-1 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={() => handleStatus(currentStepResolved, "Done")} disabled={isMutating}>
                <CheckCircle2 size={18} aria-hidden="true" />
                {t("focus.markDone")}
              </button>
              <button className="button-secondary pressable flex-1 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={() => handleStatus(currentStepResolved, "Skipped")} disabled={isMutating}>
                <SkipForward size={18} aria-hidden="true" />
                {t("focus.skip")}
              </button>
            </div>
          </div>

          <div className="surface-card p-5 sm:p-6">
            <h3 className="text-base font-semibold text-ink">{t("focus.upcomingSteps")}</h3>
            {upcomingSteps.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">{t("focus.noMoreUpcomingSteps")}</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {upcomingSteps.map((step) => {
                  const Icon = stepTypeIcon(step.type);
                  return (
                    <li key={step.id} className="rounded-[1.25rem] border border-stone-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <Icon size={18} className="mt-0.5 shrink-0 text-coast" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{step.title}</p>
                          <p className="mt-1 text-sm text-stone-600">{stepTypeLabel(step.type, locale)}</p>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="surface-card overflow-hidden">
            <div className="h-36 bg-stone-100">{coverUrl ? <img className="image-outline h-full w-full object-cover" src={coverUrl} alt="" /> : <div className="flex h-full items-center justify-center text-sm text-stone-500">{t("common.noCoverImage")}</div>}</div>
            <div className="space-y-3 p-5">
              <p className="text-sm font-medium text-stone-500">{t("focus.tripProgress")}</p>
              <p className="text-lg font-semibold text-ink">{trip.destination}</p>
              <p className="text-sm text-stone-600">{trip.description ?? t("common.noTripDescriptionYet")}</p>
            </div>
          </div>

          <div className="surface-card p-5 sm:p-6">
            <h3 className="text-base font-semibold text-ink">{t("focus.completedAndSkipped")}</h3>
            {completedOrSkippedSteps.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">{t("focus.nothingHereYet")}</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {completedOrSkippedSteps.map((step) => (
                  <li key={step.id} className="rounded-[1rem] border border-stone-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{step.title}</p>
                        <p className="mt-1 text-xs text-stone-500">{stepTypeLabel(step.type, locale)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${stepStatusClassName(step.status)}`}>{stepStatusLabel(step.status, locale)}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
