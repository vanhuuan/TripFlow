import { CheckCircle2, ExternalLink, EyeOff, Image as ImageIcon, MapPinned } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getPublicTrip, type PublicTripDetail, type TripStep } from "../api/trips";
import { PageHeader } from "../components/PageHeader";
import { formatStepDateTime, stepTypeIcon, stepTypeLabel } from "../components/trips/tripStepFormatting";

function resolveAssetUrl(url: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";
  return `${baseUrl.replace(/\/$/, "")}${url}`;
}

function findCurrentStep(steps: TripStep[]) {
  return steps.filter((step) => step.status === "Todo").sort((a, b) => a.orderIndex - b.orderIndex)[0] ?? null;
}

export function PublicTripPage() {
  const { token } = useParams();
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
          setError("Shared trip could not be loaded.");
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
  }, [token]);

  const currentStep = useMemo(() => (trip ? findCurrentStep(trip.steps) : null), [trip]);

  if (isLoading) {
    return <div className="rounded border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">Loading shared trip...</div>;
  }

  if (!trip) {
    return (
      <section className="space-y-6">
        <PageHeader eyebrow="Shared trip" title="Trip not found" description="This shared link is invalid or disabled." />
        {error ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <Link className="inline-flex rounded bg-coast px-4 py-2 font-semibold text-white" to="/dashboard">
          Back to dashboard
        </Link>
      </section>
    );
  }

  const coverUrl = resolveAssetUrl(trip.coverImageUrl);
  const attachmentUrl = resolveAssetUrl(currentStep?.imageUrls[0] ?? null);
  const upcomingSteps = trip.steps.filter((step) => step.status === "Todo" && step.id !== currentStep?.id);
  const completedSteps = trip.steps.filter((step) => step.status !== "Todo");

  if (!currentStep) {
    return (
      <section className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <PageHeader eyebrow="Shared trip" title={trip.title} description={trip.destination} />
          <span className="inline-flex items-center gap-2 rounded bg-stone-100 px-3 py-2 text-sm font-medium text-stone-700">
            <EyeOff size={16} aria-hidden="true" />
            Read only
          </span>
        </div>
        <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 text-coast">
            <CheckCircle2 size={22} aria-hidden="true" />
            <h2 className="text-base font-semibold">Trip complete</h2>
          </div>
          <p className="mt-3 text-sm text-stone-600">All itinerary steps have been completed or skipped.</p>
        </div>
      </section>
    );
  }

  const TypeIcon = stepTypeIcon(currentStep.type);

  return (
    <section className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader eyebrow="Shared trip" title={trip.title} description={trip.destination} />
        <span className="inline-flex items-center gap-2 rounded bg-stone-100 px-3 py-2 text-sm font-medium text-stone-700">
          <EyeOff size={16} aria-hidden="true" />
          Read only
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_320px]">
        <div className="space-y-5">
          <div className="overflow-hidden rounded border border-stone-200 bg-white shadow-sm">
            <div className="h-56 bg-stone-100">
              {coverUrl ? <img className="h-full w-full object-cover" src={coverUrl} alt="" /> : <div className="flex h-full items-center justify-center text-sm text-stone-500">No cover image</div>}
            </div>
            <div className="space-y-4 p-5">
              {trip.description ? <p className="whitespace-pre-wrap text-sm text-stone-700">{trip.description}</p> : <p className="text-sm text-stone-500">No description yet.</p>}
            </div>
          </div>

          <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 text-coast">
              <TypeIcon size={22} aria-hidden="true" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{stepTypeLabel(currentStep.type)}</p>
                <h2 className="text-xl font-semibold text-ink">{currentStep.title}</h2>
              </div>
            </div>
            <p className="mt-3 text-sm text-stone-600">{formatStepDateTime(currentStep.scheduledAt)}</p>
            {currentStep.description ? <p className="mt-4 whitespace-pre-wrap text-sm text-stone-700">{currentStep.description}</p> : <p className="mt-4 text-sm text-stone-500">No description for this step.</p>}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {currentStep.googleMapsUrl ? (
                <a className="inline-flex items-center justify-center gap-2 rounded border border-stone-300 px-4 py-3 font-semibold text-ink hover:bg-stone-50" href={currentStep.googleMapsUrl} target="_blank" rel="noreferrer">
                  <MapPinned size={18} aria-hidden="true" />
                  Open Google Maps
                </a>
              ) : null}
              {currentStep.externalUrl ? (
                <a className="inline-flex items-center justify-center gap-2 rounded border border-stone-300 px-4 py-3 font-semibold text-ink hover:bg-stone-50" href={currentStep.externalUrl} target="_blank" rel="noreferrer">
                  <ExternalLink size={18} aria-hidden="true" />
                  Open link
                </a>
              ) : null}
              {attachmentUrl ? (
                <a className="inline-flex items-center justify-center gap-2 rounded border border-stone-300 px-4 py-3 font-semibold text-ink hover:bg-stone-50 sm:col-span-2" href={attachmentUrl} target="_blank" rel="noreferrer">
                  <ImageIcon size={18} aria-hidden="true" />
                  Open attachment
                </a>
              ) : null}
            </div>
          </div>

          <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-ink">Upcoming steps</h3>
            {upcomingSteps.length === 0 ? <p className="mt-3 text-sm text-stone-500">No more upcoming steps.</p> : <ol className="mt-4 space-y-3">{upcomingSteps.map((step) => { const Icon = stepTypeIcon(step.type); return (<li key={step.id} className="rounded border border-stone-200 p-4"><div className="flex items-start gap-3"><Icon size={18} className="mt-0.5 shrink-0 text-coast" aria-hidden="true" /><div><p className="font-medium text-ink">{step.title}</p><p className="mt-1 text-sm text-stone-600">{stepTypeLabel(step.type)}</p></div></div></li>); })}</ol>}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-ink">Step summary</h3>
            <p className="mt-2 text-sm text-stone-600">{trip.steps.length} total steps</p>
            <p className="mt-1 text-sm text-stone-600">{completedSteps.length} completed or skipped</p>
          </div>
          <div className="rounded border border-stone-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-ink">Completed and skipped</h3>
            {completedSteps.length === 0 ? <p className="mt-3 text-sm text-stone-500">Nothing here yet.</p> : <ol className="mt-4 space-y-3">{completedSteps.map((step) => (<li key={step.id} className="rounded border border-stone-200 p-3"><p className="font-medium text-ink">{step.title}</p><p className="mt-1 text-xs text-stone-500">{step.status}</p></li>))}</ol>}
          </div>
        </aside>
      </div>
    </section>
  );
}
