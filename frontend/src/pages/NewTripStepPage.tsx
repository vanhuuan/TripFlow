import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createTripStep, type TripStepPayload } from "../api/trips";
import { PageHeader } from "../components/PageHeader";
import { TripStepForm } from "../components/trips/TripStepForm";

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; title?: string } } }).response;
    return response?.data?.message ?? response?.data?.title ?? "Step could not be created.";
  }

  return "Step could not be created.";
}

export function NewTripStepPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(payload: TripStepPayload) {
    if (!tripId) {
      return;
    }

    setIsSaving(true);
    setServerError(null);
    try {
      const step = await createTripStep(tripId, payload);
      navigate(`/trips/${tripId}`, { replace: true, state: { highlightStepId: step.id } });
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (!tripId) {
    return (
      <section className="space-y-6">
        <PageHeader eyebrow="Itinerary" title="Trip not found" description="The trip could not be resolved for step creation." />
        <Link className="inline-flex rounded bg-coast px-4 py-2 font-semibold text-white" to="/dashboard">
          Back to dashboard
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-3xl space-y-6">
      <PageHeader eyebrow="Itinerary" title="Add step" description="Create a new itinerary step for this trip." />
      <TripStepForm submitLabel="Add step" isSaving={isSaving} serverError={serverError} onSubmit={handleSubmit} />
    </section>
  );
}
