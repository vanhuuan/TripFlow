import { CheckCircle2, Edit, ListPlus, Play, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { completeTrip, deleteTrip, getTrip, startTrip, type TripDetail } from "../api/trips";
import { PageHeader } from "../components/PageHeader";
import { formatDateRange, resolveAssetUrl, statusClassName } from "../components/trips/tripFormatting";

export function TripDetailPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
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
    getTrip(tripId)
      .then((loadedTrip) => {
        if (isMounted) {
          setTrip(loadedTrip);
          setError(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Trip could not be loaded.");
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

  async function handleStart() {
    if (!tripId) {
      return;
    }

    setIsMutating(true);
    try {
      setTrip(await startTrip(tripId));
      setError(null);
    } catch {
      setError("Trip could not be started.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleComplete() {
    if (!tripId) {
      return;
    }

    setIsMutating(true);
    try {
      setTrip(await completeTrip(tripId));
      setError(null);
    } catch {
      setError("Trip could not be completed.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDelete() {
    if (!tripId || !window.confirm("Delete this trip? This cannot be undone.")) {
      return;
    }

    setIsMutating(true);
    try {
      await deleteTrip(tripId);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Trip could not be deleted.");
      setIsMutating(false);
    }
  }

  if (isLoading) {
    return <div className="rounded border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">Loading trip...</div>;
  }

  if (!trip) {
    return (
      <section className="space-y-6">
        <PageHeader eyebrow="Itinerary" title="Trip not found" description="The trip could not be loaded." />
        {error ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <Link className="inline-flex rounded bg-coast px-4 py-2 font-semibold text-white" to="/dashboard">
          Back to dashboard
        </Link>
      </section>
    );
  }

  const coverUrl = resolveAssetUrl(trip.coverImageUrl);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader eyebrow="Itinerary" title={trip.title} description={trip.destination} />
        <span className={`w-fit rounded px-2 py-1 text-xs font-semibold ring-1 ${statusClassName(trip.status)}`}>{trip.status}</span>
      </div>

      {error ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="overflow-hidden rounded border border-stone-200 bg-white shadow-sm">
          <div className="h-56 bg-stone-100">
            {coverUrl ? <img className="h-full w-full object-cover" src={coverUrl} alt="" /> : <div className="flex h-full items-center justify-center text-sm text-stone-500">No cover image</div>}
          </div>
          <div className="space-y-4 p-5">
            <div>
              <h2 className="text-base font-semibold">Trip information</h2>
              <p className="mt-1 text-sm text-stone-600">{formatDateRange(trip.startDate, trip.endDate)}</p>
            </div>
            {trip.description ? <p className="whitespace-pre-wrap text-sm text-stone-700">{trip.description}</p> : <p className="text-sm text-stone-500">No description yet.</p>}
          </div>
        </div>

        <div className="space-y-3 rounded border border-stone-200 bg-white p-5 shadow-sm">
          <Link className="flex items-center justify-center gap-2 rounded border border-stone-300 px-4 py-2 font-semibold text-ink hover:bg-stone-50" to={`/trips/${trip.id}/edit`}>
            <Edit size={18} aria-hidden="true" />
            Edit trip
          </Link>
          <button className="flex w-full items-center justify-center gap-2 rounded bg-coast px-4 py-2 font-semibold text-white disabled:opacity-60" type="button" onClick={handleStart} disabled={isMutating || trip.status === "Active"}>
            <Play size={18} aria-hidden="true" />
            Start trip
          </button>
          <button className="flex w-full items-center justify-center gap-2 rounded bg-ink px-4 py-2 font-semibold text-white disabled:opacity-60" type="button" onClick={handleComplete} disabled={isMutating || trip.status === "Completed"}>
            <CheckCircle2 size={18} aria-hidden="true" />
            Complete trip
          </button>
          <Link className="flex items-center justify-center gap-2 rounded border border-stone-300 px-4 py-2 font-semibold text-ink hover:bg-stone-50" to={`/trips/${trip.id}/focus`}>
            Open focus mode
          </Link>
          <button className="flex w-full items-center justify-center gap-2 rounded border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60" type="button" onClick={handleDelete} disabled={isMutating}>
            <Trash2 size={18} aria-hidden="true" />
            Delete trip
          </button>
        </div>
      </div>

      <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Itinerary steps</h2>
            <p className="mt-1 text-sm text-stone-600">Steps are shown in itinerary order.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded border border-stone-300 px-4 py-2 font-semibold text-stone-500" type="button" disabled title="Step editing lands in Epic 8">
            <ListPlus size={18} aria-hidden="true" />
            Add step
          </button>
        </div>

        {trip.steps.length === 0 ? (
          <p className="mt-5 rounded border border-dashed border-stone-200 p-4 text-sm text-stone-500">No itinerary steps yet.</p>
        ) : (
          <ol className="mt-5 space-y-3">
            {trip.steps.map((step) => (
              <li key={step.id} className="rounded border border-stone-200 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold">{step.title}</p>
                    <p className="text-sm text-stone-600">{step.type} · {step.status}</p>
                  </div>
                  {step.scheduledAt ? <p className="text-sm text-stone-500">{new Date(step.scheduledAt).toLocaleString()}</p> : null}
                </div>
                {step.description ? <p className="mt-2 text-sm text-stone-700">{step.description}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
