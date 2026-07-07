import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTrip, type TripPayload } from "../api/trips";
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

export function NewTripPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(payload: TripPayload) {
    setIsSaving(true);
    setServerError(null);
    try {
      const trip = await createTrip(payload);
      navigate(`/trips/${trip.id}`, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error, t("builder.tripCouldNotBeCreated")));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow={t("builder.eyebrow")} title={t("builder.createTripTitle")} description={t("builder.tripDescription")} />
      <TripForm submitLabel={t("builder.createTripTitle")} isSaving={isSaving} serverError={serverError} onSubmit={handleSubmit} />
    </section>
  );
}
