import { CheckCircle2, Copy, Edit, Eye, ListPlus, Link2, Play, Share2, Trash2, Unlock } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { completeTrip, createTripShareLink, deleteTrip, disableTripShareLink, getTrip, startTrip, type TripDetail } from "../api/trips";
import { PageHeader } from "../components/PageHeader";
import { formatDateRange, resolveAssetUrl, statusClassName } from "../components/trips/tripFormatting";

export function TripDetailPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
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
          setShareUrl(loadedTrip.isPublicShared && loadedTrip.publicShareToken ? `${window.location.origin}/share/${loadedTrip.publicShareToken}` : null);
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
    if (!tripId) return;
    setIsMutating(true);
    try {
      const startedTrip = await startTrip(tripId);
      setTrip(startedTrip);
      setError(null);
      navigate(`/trips/${startedTrip.id}/focus`, { replace: true });
    } catch {
      setError("Trip could not be started.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleComplete() {
    if (!tripId) return;
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

  async function handleDeleteTrip() {
    if (!tripId || !window.confirm("Delete this trip? This cannot be undone.")) return;
    setIsMutating(true);
    try {
      await deleteTrip(tripId);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Trip could not be deleted.");
      setIsMutating(false);
    }
  }

  async function handleCreateShare() {
    if (!tripId) return;
    setIsMutating(true);
    try {
      const response = await createTripShareLink(tripId);
      setShareUrl(response.shareUrl);
      setTrip((currentTrip) => (currentTrip ? { ...currentTrip, isPublicShared: true } : currentTrip));
      setError(null);
    } catch {
      setError("Share link could not be created.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDisableShare() {
    if (!tripId) return;
    setIsMutating(true);
    try {
      await disableTripShareLink(tripId);
      setShareUrl(null);
      setTrip((currentTrip) => (currentTrip ? { ...currentTrip, isPublicShared: false } : currentTrip));
      setError(null);
    } catch {
      setError("Share link could not be disabled.");
    } finally {
      setIsMutating(false);
    }
  }

  async function handleCopyShareLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
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
            <Eye size={18} aria-hidden="true" />
            Open focus mode
          </Link>
          <button className="flex w-full items-center justify-center gap-2 rounded border border-red-200 px-4 py-2 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60" type="button" onClick={handleDeleteTrip} disabled={isMutating}>
            <Trash2 size={18} aria-hidden="true" />
            Delete trip
          </button>
        </div>
      </div>

      <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Sharing</h2>
            <p className="mt-1 text-sm text-stone-600">Generate a public read-only link for this trip.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded border border-stone-300 px-4 py-2 font-semibold text-ink hover:bg-stone-50 disabled:opacity-60" type="button" onClick={handleCreateShare} disabled={isMutating}>
              <Share2 size={18} aria-hidden="true" />
              {trip.isPublicShared ? "Regenerate link" : "Create share link"}
            </button>
            <button className="inline-flex items-center gap-2 rounded border border-stone-300 px-4 py-2 font-semibold text-ink hover:bg-stone-50 disabled:opacity-60" type="button" onClick={handleDisableShare} disabled={isMutating || !trip.isPublicShared}>
              <Unlock size={18} aria-hidden="true" />
              Disable share
            </button>
          </div>
        </div>

        {shareUrl ? (
          <div className="mt-4 flex flex-col gap-3 rounded border border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <a className="break-all text-sm font-medium text-coast underline-offset-4 hover:underline" href={shareUrl} target="_blank" rel="noreferrer">
              {shareUrl}
            </a>
            <button className="inline-flex items-center justify-center gap-2 rounded border border-stone-300 px-4 py-2 text-sm font-semibold text-ink hover:bg-white" type="button" onClick={handleCopyShareLink}>
              <Copy size={16} aria-hidden="true" />
              Copy
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-500">No public share link yet.</p>
        )}
      </div>

      <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Itinerary steps</h2>
            <p className="mt-1 text-sm text-stone-600">Read-only step list. Use the edit page to change order or details.</p>
          </div>
          <Link className="inline-flex items-center gap-2 rounded border border-stone-300 px-4 py-2 font-semibold text-ink hover:bg-stone-50" to={`/trips/${trip.id}/steps/edit`}>
            <ListPlus size={18} aria-hidden="true" />
            Edit steps
          </Link>
        </div>

        {trip.steps.length === 0 ? (
          <p className="mt-5 rounded border border-dashed border-stone-200 p-4 text-sm text-stone-500">No itinerary steps yet.</p>
        ) : (
          <ol className="mt-5 space-y-3">
            {trip.steps.map((step) => (
              <li key={step.id} className="rounded border border-stone-200 p-4">
                <div className="grid gap-2 md:grid-cols-[140px_minmax(0,1fr)_220px] md:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{step.type}</p>
                    <p className="mt-1 text-sm text-stone-600">{step.scheduledAt ? new Date(step.scheduledAt).toLocaleString() : "Unscheduled"}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{step.title}</p>
                    {step.description ? <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">{step.description}</p> : <p className="mt-1 text-sm text-stone-500">No description.</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {step.googleMapsUrl ? (
                      <a className="rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50" href={step.googleMapsUrl} target="_blank" rel="noreferrer">
                        Maps
                      </a>
                    ) : null}
                    {step.externalUrl ? (
                      <a className="rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-stone-50" href={step.externalUrl} target="_blank" rel="noreferrer">
                        Link
                      </a>
                    ) : null}
                    {step.imageUrls.length > 0 ? (
                      <span className="rounded border border-stone-300 px-3 py-2 text-sm font-semibold text-ink">{step.imageUrls.length} images</span>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
