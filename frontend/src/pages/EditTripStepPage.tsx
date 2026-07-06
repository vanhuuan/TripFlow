import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getTripSteps, updateTripStep, type TripStep, type TripStepPayload } from "../api/trips";
import { PageHeader } from "../components/PageHeader";
import { TripStepForm } from "../components/trips/TripStepForm";

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; title?: string } } }).response;
    return response?.data?.message ?? response?.data?.title ?? "Step could not be saved.";
  }

  return "Step could not be saved.";
}

export function EditTripStepPage() {
  const { tripId, stepId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<TripStep | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId || !stepId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    getTripSteps(tripId)
      .then((steps) => {
        if (isMounted) {
          setStep(steps.find((item) => item.id === stepId) ?? null);
          setServerError(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setServerError("Step could not be loaded.");
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
  }, [stepId, tripId]);

  async function handleSubmit(payload: TripStepPayload) {
    if (!tripId || !stepId) {
      return;
    }

    setIsSaving(true);
    setServerError(null);
    try {
      await updateTripStep(tripId, stepId, payload);
      navigate(`/trips/${tripId}`, { replace: true });
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="rounded border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">Loading step...</div>;
  }

  if (!tripId || !step) {
    return (
      <section className="space-y-6">
        <PageHeader eyebrow="Itinerary" title="Step not found" description="The step could not be loaded for editing." />
        {serverError ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p> : null}
        <Link className="inline-flex rounded bg-coast px-4 py-2 font-semibold text-white" to={`/trips/${tripId ?? ""}`}>
          Back to trip
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-3xl space-y-6">
      <PageHeader eyebrow="Itinerary" title="Edit step" description="Update itinerary details, images, and links." />
      <TripStepForm step={step} submitLabel="Save changes" isSaving={isSaving} serverError={serverError} onSubmit={handleSubmit} />
    </section>
  );
}
