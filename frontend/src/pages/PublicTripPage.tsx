import { CheckCircle2, Clock3, ExternalLink, EyeOff, Images, ListChecks, MapPinned } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicTrip, type PublicTripDetail, type PublicTripStep } from "../api/trips";
import { useI18n } from "../i18n";
import { PageHeader } from "../components/PageHeader";
import { TripStepImageCarousel } from "../components/trips/TripStepImageCarousel";
import { stepStatusClassName, stepStatusLabel, stepTypeIcon, stepTypeLabel } from "../components/trips/tripStepFormatting";

function resolveAssetUrl(url: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
  return `${baseUrl.replace(/\/$/, "")}${url}`;
}

function findCurrentStep(steps: PublicTripStep[]) {
  return steps.filter((step) => step.status === "Todo").sort((a, b) => a.orderIndex - b.orderIndex)[0] ?? null;
}

type PublicStepCardProps = {
  step: PublicTripStep;
  index: number;
  isCurrent?: boolean;
};

function PublicStepCard({ step, index, isCurrent = false }: PublicStepCardProps) {
  const { locale, t } = useI18n();
  const TypeIcon = stepTypeIcon(step.type);

  return (
    <article className={`surface-card p-5 sm:p-6 ${isCurrent ? "bg-white/95" : ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-coast shadow-sm ring-1 ring-teal-100">
            <TypeIcon size={20} aria-hidden="true" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600 tabular-nums">
                {t("publicTrip.stop")} {index + 1}
              </span>
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
                {stepTypeLabel(step.type, locale)}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${stepStatusClassName(step.status)}`}>
                {stepStatusLabel(step.status, locale)}
              </span>
            </div>
            <h3 className={`${isCurrent ? "text-2xl" : "text-xl"} mt-3 text-balance font-semibold text-ink`}>{step.title}</h3>
          </div>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-stone-900 px-3 py-2 text-sm font-semibold text-white shadow-sm">
          <Clock3 size={16} aria-hidden="true" />
          <span className="tabular-nums">{step.scheduledTime ?? t("publicTrip.noPublicTime")}</span>
        </div>
      </div>

      {step.description ? (
        <p className="mt-5 whitespace-pre-wrap text-pretty text-sm leading-7 text-stone-700">{step.description}</p>
      ) : (
        <p className="mt-5 text-sm text-stone-500">{t("common.noDescriptionForThisStep")}</p>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {step.googleMapsUrl ? (
          <a className="button-secondary pressable active:scale-[0.96]" href={step.googleMapsUrl} target="_blank" rel="noreferrer">
            <MapPinned size={18} aria-hidden="true" />
            {t("common.openGoogleMaps")}
          </a>
        ) : null}
        {step.externalUrl ? (
          <a className="button-secondary pressable active:scale-[0.96]" href={step.externalUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={18} aria-hidden="true" />
            {t("common.openLink")}
          </a>
        ) : null}
      </div>

      {step.imageUrls.length > 0 ? <TripStepImageCarousel className="mt-5" imageUrls={step.imageUrls} altPrefix={step.title} variant={isCurrent ? "default" : "compact"} /> : null}
    </article>
  );
}

export function PublicTripPage() {
  const { token } = useParams();
  const { t } = useI18n();
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

  const orderedSteps = useMemo(() => (trip ? [...trip.steps].sort((a, b) => a.orderIndex - b.orderIndex) : []), [trip]);
  const currentStep = useMemo(() => findCurrentStep(orderedSteps), [orderedSteps]);

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
  const completedSteps = orderedSteps.filter((step) => step.status !== "Todo");
  const photoCount = orderedSteps.reduce((count, step) => count + step.imageUrls.length, 0);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader eyebrow={t("publicTrip.eyebrow")} title={trip.title} description={trip.destination} />
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-stone-100 px-3 py-2 text-sm font-medium text-stone-700">
          <EyeOff size={16} aria-hidden="true" />
          {t("publicTrip.readOnly")}
        </span>
      </div>

      <div className="surface-card overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
          <div className="h-72 overflow-hidden bg-stone-100 sm:h-80 lg:h-[26rem]">
            {coverUrl ? <img className="image-outline block h-full w-full object-cover" src={coverUrl} alt="" /> : <div className="flex h-full items-center justify-center text-sm text-stone-500">{t("common.noCoverImage")}</div>}
          </div>
          <div className="flex flex-col justify-between gap-8 p-5 sm:p-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-coast">{t("publicTrip.publicPreview")}</p>
              <h2 className="mt-3 text-balance text-3xl font-semibold text-ink">{trip.destination}</h2>
              {trip.description ? <p className="mt-5 whitespace-pre-wrap text-pretty text-sm leading-7 text-stone-700">{trip.description}</p> : <p className="mt-5 text-sm text-stone-500">{t("common.noDescriptionYet")}</p>}
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-stone-200/70">
                <p className="text-2xl font-semibold text-ink tabular-nums">{orderedSteps.length}</p>
                <p className="mt-1 text-sm text-stone-600">{t("publicTrip.totalSteps")}</p>
              </div>
              <div className="rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-stone-200/70">
                <p className="text-2xl font-semibold text-ink tabular-nums">{completedSteps.length}</p>
                <p className="mt-1 text-sm text-stone-600">{t("publicTrip.completedOrSkipped")}</p>
              </div>
              <div className="rounded-2xl bg-white/85 p-4 shadow-sm ring-1 ring-stone-200/70">
                <p className="text-2xl font-semibold text-ink tabular-nums">{photoCount}</p>
                <p className="mt-1 text-sm text-stone-600">{t("publicTrip.sharedPhotos")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_320px]">
        <div className="space-y-6">
          {currentStep ? (
            <section className="space-y-4">
              <div className="flex items-center gap-3 text-coast">
                <ListChecks size={22} aria-hidden="true" />
                <h2 className="text-xl font-semibold text-ink">{t("publicTrip.currentStep")}</h2>
              </div>
              <PublicStepCard step={currentStep} index={orderedSteps.findIndex((step) => step.id === currentStep.id)} isCurrent />
            </section>
          ) : (
            <div className="surface-card p-5 sm:p-6">
              <div className="flex items-center gap-3 text-coast">
                <CheckCircle2 size={22} aria-hidden="true" />
                <h2 className="text-base font-semibold text-balance">{t("publicTrip.tripComplete")}</h2>
              </div>
              <p className="mt-3 text-sm text-stone-600">{t("publicTrip.allItineraryStepsCompleted")}</p>
            </div>
          )}

          <section className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold text-ink">{t("publicTrip.fullItinerary")}</h2>
              <p className="mt-2 text-sm text-stone-600">{t("publicTrip.safeShareDescription")}</p>
            </div>
            {orderedSteps.length === 0 ? (
              <p className="surface-card p-5 text-sm text-stone-500">{t("common.noItineraryStepsYet")}</p>
            ) : (
              <ol className="space-y-4">
                {orderedSteps.map((step, index) => (
                  <li key={step.id}>
                    <PublicStepCard step={step} index={index} isCurrent={step.id === currentStep?.id} />
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <div className="surface-card p-5 sm:p-6">
            <h3 className="text-base font-semibold text-ink">{t("publicTrip.stepSummary")}</h3>
            <p className="mt-2 text-sm text-stone-600"><span className="font-semibold tabular-nums text-ink">{orderedSteps.length}</span> {t("publicTrip.totalSteps")}</p>
            <p className="mt-1 text-sm text-stone-600"><span className="font-semibold tabular-nums text-ink">{completedSteps.length}</span> {t("publicTrip.completedOrSkipped")}</p>
            <p className="mt-1 text-sm text-stone-600"><span className="font-semibold tabular-nums text-ink">{photoCount}</span> {t("publicTrip.sharedPhotos")}</p>
          </div>
          <div className="surface-card p-5 sm:p-6">
            <div className="flex items-center gap-3 text-coast">
              <Images size={20} aria-hidden="true" />
              <h3 className="text-base font-semibold text-ink">{t("publicTrip.publicPrivacy")}</h3>
            </div>
            <p className="mt-3 text-pretty text-sm leading-6 text-stone-600">{t("publicTrip.publicPrivacyDescription")}</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

