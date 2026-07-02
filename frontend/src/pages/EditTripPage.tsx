import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getTrip, updateTrip, type TripDetail, type TripPayload } from "../api/trips";
import { PageHeader } from "../components/PageHeader";
import { TripForm } from "../components/trips/TripForm";

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; title?: string } } }).response;
    return response?.data?.message ?? response?.data?.title ?? "Trip could not be saved.";
  }

  return "Trip could not be saved.";
}

export function EditTripPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
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
          setServerError("Trip could not be loaded.");
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
      setServerError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="rounded border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">Loading trip...</div>;
  }

  if (!trip) {
    return (
      <section className="max-w-3xl space-y-6">
        <PageHeader eyebrow="Trip builder" title="Trip not found" description="The trip could not be loaded for editing." />
        {serverError ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p> : null}
        <Link className="inline-flex rounded bg-coast px-4 py-2 font-semibold text-white" to="/dashboard">
          Back to dashboard
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-3xl space-y-6">
      <PageHeader eyebrow="Trip builder" title="Edit trip" description="Update trip details and cover image." />
      <TripForm trip={trip} submitLabel="Save changes" isSaving={isSaving} serverError={serverError} onSubmit={handleSubmit} />
    </section>
  );
}
