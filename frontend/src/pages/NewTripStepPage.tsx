import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getTrip, createTripStep, type TripDetail, type TripStepPayload } from "../api/trips";
import { useI18n } from "../i18n";
import { PageHeader } from "../components/PageHeader";
import { TripStepForm } from "../components/trips/TripStepForm";

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; title?: string } } }).response;
    return response?.data?.message ?? response?.data?.title ?? fallback;
  }

  return fallback;
}

export function NewTripStepPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    getTrip(tripId)
      .then((loadedTrip) => {
        if (isMounted) {
          setTrip(loadedTrip);
          setServerError(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setServerError(t("builder.tripCouldNotBeLoaded"));
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

  async function handleSubmit(payload: TripStepPayload) {
    if (!tripId) {
      return;
    }

    setIsSaving(true);
    setServerError(null);
    try {
      const step = await createTripStep(tripId, payload);
      navigate(`/trips/${tripId}/steps/edit`, { replace: true, state: { highlightStepId: step.id } });
    } catch (error) {
      setServerError(getErrorMessage(error, t("builder.tripCouldNotBeCreated")));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="surface-card px-5 py-4 text-sm text-stone-600">{t("common.loadingTrip")}</div>;
  }

  if (!tripId || !trip) {
    return (
      <section className="space-y-6">
        <PageHeader eyebrow={t("trip.itinerary")} title={t("trip.stepNotFound")} description={t("builder.tripCouldNotBeLoaded")} />
        {serverError ? <p className="surface-card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p> : null}
        <Link className="button-primary pressable active:scale-[0.96]" to="/dashboard">
          {t("builder.backToDashboard")}
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader eyebrow={t("trip.itinerary")} title={t("trip.addStep")} description={`${t("trip.addStep")} cho ${trip.title}.`} />
        <Link className="button-secondary pressable active:scale-[0.96]" to={`/trips/${tripId}/steps/edit`}>
          {t("trip.backToTrip")}
        </Link>
      </div>
      <TripStepForm submitLabel={t("trip.addStep")} isSaving={isSaving} serverError={serverError} currencyCode={trip.currencyCode} onSubmit={handleSubmit} />
    </section>
  );
}
