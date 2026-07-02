import { CalendarPlus, MapPinned, PlaneTakeoff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTrips, type TripSummary } from "../api/trips";
import { PageHeader } from "../components/PageHeader";
import { formatDateRange, resolveAssetUrl, statusClassName } from "../components/trips/tripFormatting";

export function DashboardPage() {
  const [trips, setTrips] = useState<TripSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getTrips()
      .then((loadedTrips) => {
        if (isMounted) {
          setTrips(loadedTrips);
          setError(null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Trips could not be loaded.");
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
  }, []);

  const activeTrip = trips.find((trip) => trip.status === "Active");

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader eyebrow="Workspace" title="Trip dashboard" description="View draft, active, and completed trips." />
        <Link className="inline-flex items-center gap-2 rounded bg-coast px-4 py-2 font-semibold text-white" to="/trips/new">
          <CalendarPlus size={18} aria-hidden="true" />
          Create trip
        </Link>
      </div>

      {error ? <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {activeTrip ? (
        <Link to={`/trips/${activeTrip.id}`} className="block rounded border border-teal-100 bg-white p-5 shadow-sm transition hover:border-coast">
          <div className="flex items-center gap-3 text-coast">
            <MapPinned size={22} aria-hidden="true" />
            <h2 className="text-base font-semibold">Active trip</h2>
          </div>
          <p className="mt-2 font-semibold">{activeTrip.title}</p>
          <p className="text-sm text-stone-600">{activeTrip.destination}</p>
        </Link>
      ) : null}

      {isLoading ? <div className="rounded border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">Loading trips...</div> : null}

      {!isLoading && trips.length === 0 ? (
        <div className="rounded border border-dashed border-coast bg-white p-6 text-center shadow-sm">
          <PlaneTakeoff className="mx-auto text-coast" size={28} aria-hidden="true" />
          <h2 className="mt-3 text-base font-semibold">No trips yet</h2>
          <p className="mt-2 text-sm text-stone-600">Create your first trip to start planning.</p>
          <Link className="mt-4 inline-flex rounded bg-coast px-4 py-2 font-semibold text-white" to="/trips/new">
            Create trip
          </Link>
        </div>
      ) : null}

      {!isLoading && trips.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((trip) => {
            const coverUrl = resolveAssetUrl(trip.coverImageUrl);
            return (
              <Link key={trip.id} to={`/trips/${trip.id}`} className="overflow-hidden rounded border border-stone-200 bg-white shadow-sm transition hover:border-coast">
                <div className="h-36 bg-stone-100">
                  {coverUrl ? <img className="h-full w-full object-cover" src={coverUrl} alt="" /> : <div className="flex h-full items-center justify-center text-sm text-stone-500">No cover image</div>}
                </div>
                <div className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{trip.title}</h2>
                      <p className="text-sm text-stone-600">{trip.destination}</p>
                    </div>
                    <span className={`shrink-0 rounded px-2 py-1 text-xs font-semibold ring-1 ${statusClassName(trip.status)}`}>{trip.status}</span>
                  </div>
                  <p className="text-sm text-stone-600">{formatDateRange(trip.startDate, trip.endDate)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
