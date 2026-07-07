import { CheckCircle2, ExternalLink, EyeOff, MapPinned } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicTrip, type PublicTripDetail, type TripStep } from "../api/trips";
import { useI18n } from "../i18n";
import { PageHeader } from "../components/PageHeader";
import { TripStepImageCarousel } from "../components/trips/TripStepImageCarousel";
import { formatMoney } from "../components/trips/tripFormatting";
import { formatStepDateTime, stepTypeIcon, stepTypeLabel } from "../components/trips/tripStepFormatting";

function resolveAssetUrl(url: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
  return `${baseUrl.replace(/\/$/, "")}${url}`;
}

function findCurrentStep(steps: TripStep[]) {
  return steps.filter((step) => step.status === "Todo").sort((a, b) => a.orderIndex - b.orderIndex)[0] ?? null;
}

export function PublicTripPage() {
  const { token } = useParams();
  const { locale, t } = useI18n();
  const [trip, setTrip] = useState<PublicTripDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    getPublicTrip(token)
      .then((loadedTrip) => {
        if (isMounted) {
          setTrip(loadedTrip);
          setError(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(t("common.sharedTripCouldNotBeLoaded"));
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
  }, [t, token]);

  const currentStep = useMemo(() => (trip ? findCurrentStep(trip.steps) : null), [trip]);

  if (isLoading) {
    return <div className="surface-card px-5 py-4 text-sm text-stone-600">{t("common.loadingSharedTrip")}</div>;
  }

  if (!trip) {
    return (
      <section className="space-y-6">
        <PageHeader eyebrow={t("publicTrip.eyebrow")} title={t("publicTrip.sharedTripNotFound")} description={t("publicTrip.sharedTripDescription")} />
        {error ? <p className="surface-card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        <Link className="button-primary pressable active:scale-[0.96]" to="/dashboard">
          {t("common.backToDashboard")}
        </Link>
      </section>
    );
  }

  const coverUrl = resolveAssetUrl(trip.coverImageUrl);
  const upcomingSteps = trip.steps.filter((step) => step.status === "Todo" && step.id !== currentStep?.id);
  const completedSteps = trip.steps.filter((step) => step.status !== "Todo");

  if (!currentStep) {
    return (
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader eyebrow={t("publicTrip.eyebrow")} title={trip.title} description={trip.destination} />
          <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-2 text-sm font-medium text-stone-700">
            <EyeOff size={16} aria-hidden="true" />
            {t("publicTrip.readOnly")}
          </span>
        </div>
        <div className="surface-card p-5 sm:p-6">
          <div className="flex items-center gap-3 text-coast">
            <CheckCircle2 size={22} aria-hidden="true" />
            <h2 className="text-base font-semibold text-balance">{t("publicTrip.tripComplete")}</h2>
          </div>
          <p className="mt-3 text-sm text-stone-600">{t("publicTrip.allItineraryStepsCompleted")}</p>
        </div>
      </section>
    );
  }

  const TypeIcon = stepTypeIcon(currentStep.type);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader eyebrow={t("publicTrip.eyebrow")} title={trip.title} description={trip.destination} />
        <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-2 text-sm font-medium text-stone-700">
          <EyeOff size={16} aria-hidden="true" />
          {t("publicTrip.readOnly")}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_320px]">
        <div className="space-y-6">
          <div className="surface-card overflow-hidden">
            <div className="h-56 bg-stone-100">{coverUrl ? <img className="image-outline h-full w-full object-cover" src={coverUrl} alt="" /> : <div className="flex h-full items-center justify-center text-sm text-stone-500">{t("common.noCoverImage")}</div>}</div>
            <div className="space-y-4 p-5 sm:p-6">
              <p className="text-sm text-stone-600">{t("publicTrip.estimatedCost")}: {formatMoney(trip.totalCost, trip.currencyCode, locale)}</p>
              {trip.description ? <p className="whitespace-pre-wrap text-sm leading-7 text-stone-700">{trip.description}</p> : <p className="text-sm text-stone-500">{t("common.noDescriptionYet")}</p>}
            </div>
          </div>

          <div className="surface-card p-5 sm:p-6">
            <div className="flex items-center gap-3 text-coast">
              <TypeIcon size={22} aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">{stepTypeLabel(currentStep.type, locale)}</p>
                <h2 className="text-balance text-2xl font-semibold text-ink">{currentStep.title}</h2>
              </div>
            </div>
            <p className="mt-3 text-sm text-stone-600">{formatStepDateTime(currentStep.scheduledAt, locale)}</p>
            {currentStep.costAmount != null ? <p className="mt-2 text-sm text-stone-600">{t("common.cost")}: {formatMoney(currentStep.costAmount, trip.currencyCode, locale)}</p> : null}
            {currentStep.description ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-700">{currentStep.description}</p> : <p className="mt-4 text-sm text-stone-500">{t("common.noDescriptionForThisStep")}</p>}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {currentStep.googleMapsUrl ? (
                <a className="button-secondary pressable px-4 py-3 active:scale-[0.96]" href={currentStep.googleMapsUrl} target="_blank" rel="noreferrer">
                  <MapPinned size={18} aria-hidden="true" />
                  {t("common.openGoogleMaps")}
                </a>
              ) : null}
              {currentStep.externalUrl ? (
                <a className="button-secondary pressable px-4 py-3 active:scale-[0.96]" href={currentStep.externalUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={18} aria-hidden="true" />
                  {t("common.openLink")}
                </a>
              ) : null}
            </div>
            {currentStep.imageUrls.length > 0 ? <TripStepImageCarousel className="mt-5" imageUrls={currentStep.imageUrls} altPrefix={currentStep.title} /> : null}
          </div>

          <div className="surface-card p-5 sm:p-6">
            <h3 className="text-base font-semibold text-ink">{t("publicTrip.upcomingSteps")}</h3>
            {upcomingSteps.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">{t("publicTrip.noMoreUpcomingSteps")}</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {upcomingSteps.map((step) => {
                  const Icon = stepTypeIcon(step.type);
                  return (
                    <li key={step.id} className="rounded-[1.25rem] border border-stone-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <Icon size={18} className="mt-0.5 shrink-0 text-coast" aria-hidden="true" />
                        <div>
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
          <div className="surface-card p-5 sm:p-6">
            <h3 className="text-base font-semibold text-ink">{t("publicTrip.stepSummary")}</h3>
            <p className="mt-2 text-sm text-stone-600">{trip.steps.length} {t("publicTrip.totalSteps")}</p>
            <p className="mt-1 text-sm text-stone-600">{completedSteps.length} {t("publicTrip.completedOrSkipped")}</p>
          </div>
          <div className="surface-card p-5 sm:p-6">
            <h3 className="text-base font-semibold text-ink">{t("publicTrip.completedOrSkipped")}</h3>
            {completedSteps.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">{t("publicTrip.nothingHereYet")}</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {completedSteps.map((step) => (
                  <li key={step.id} className="rounded-[1rem] border border-stone-200 bg-white p-3 shadow-sm">
                    <p className="font-medium text-ink">{step.title}</p>
                    <p className="mt-1 text-xs text-stone-500">{step.status}</p>
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
