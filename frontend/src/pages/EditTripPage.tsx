import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getTrip, updateTrip, type TripDetail, type TripPayload } from "../api/trips";
import { useI18n } from "../i18n";
import { PageHeader } from "../components/PageHeader";
import { TripForm } from "../components/trips/TripForm";

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; title?: string } } }).response;
    return response?.data?.message ?? response?.data?.title ?? fallback;
  }

  return fallback;
}

export function EditTripPage() {
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

  async function handleSubmit(payload: TripPayload) {
    if (!tripId) {
      return;
    }

    setIsSaving(true);
    setServerError(null);
    try {
      const updatedTrip = await updateTrip(tripId, payload);
      navigate(`/trips/${updatedTrip.id}`, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, t("builder.tripCouldNotBeSaved")));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="surface-card px-5 py-4 text-sm text-stone-600">{t("common.loadingTrip")}</div>;
  }

  if (!trip) {
    return (
      <section className="space-y-6">
        <PageHeader eyebrow={t("builder.eyebrow")} title={t("builder.tripNotFound")} description={t("builder.tripCouldNotBeLoaded")} />
        {serverError ? <p className="surface-card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p> : null}
        <Link className="button-primary pressable active:scale-[0.96]" to="/dashboard">
          {t("builder.backToDashboard")}
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow={t("builder.eyebrow")} title={t("builder.editTripTitle")} description={t("builder.updateDescription")} />
      <TripForm trip={trip} submitLabel={t("builder.saveChanges")} isSaving={isSaving} serverError={serverError} onSubmit={handleSubmit} />
    </section>
  );
}
