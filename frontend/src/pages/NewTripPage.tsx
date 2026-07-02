import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createTrip, type TripPayload } from "../api/trips";
import { PageHeader } from "../components/PageHeader";
import { TripForm } from "../components/trips/TripForm";

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; title?: string } } }).response;
    return response?.data?.message ?? response?.data?.title ?? "Trip could not be created.";
  }

  return "Trip could not be created.";
}

export function NewTripPage() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(payload: TripPayload) {
    setIsSaving(true);
    setServerError(null);
    try {
      const trip = await createTrip(payload);
      navigate(`/trips/${trip.id}`, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="max-w-3xl space-y-6">
      <PageHeader eyebrow="Trip builder" title="Create trip" description="Add the core details and an optional cover image." />
      <TripForm submitLabel="Create trip" isSaving={isSaving} serverError={serverError} onSubmit={handleSubmit} />
    </section>
  );
}
