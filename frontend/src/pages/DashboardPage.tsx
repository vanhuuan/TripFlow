import { CalendarPlus, MapPinned, PlaneTakeoff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTrips, type TripSummary } from "../api/trips";
import { useI18n } from "../i18n";
import { PageHeader } from "../components/PageHeader";
import { formatDateRange, resolveAssetUrl, statusClassName, statusLabel } from "../components/trips/tripFormatting";

export function DashboardPage() {
  const { locale, t } = useI18n();
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
          setError(t("common.tripCouldNotBeLoaded"));
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
  }, [t]);

  const activeTrip = trips.find((trip) => trip.status === "Active");

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader eyebrow={t("dashboard.eyebrow")} title={t("dashboard.title")} description={t("dashboard.description")} />
        <Link className="button-primary pressable active:scale-[0.96]" to="/trips/new">
          <CalendarPlus size={18} aria-hidden="true" />
          {t("dashboard.createTrip")}
        </Link>
      </div>

      {error ? <p className="surface-card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {activeTrip ? (
        <div className="surface-card overflow-hidden">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-coast">
                <MapPinned size={22} aria-hidden="true" />
                <h2 className="text-base font-semibold text-balance">{t("dashboard.activeTrip")}</h2>
              </div>
              <p className="text-lg font-semibold text-ink">{activeTrip.title}</p>
              <p className="text-sm text-stone-600">{activeTrip.destination}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to={`/trips/${activeTrip.id}`} className="button-secondary pressable active:scale-[0.96]">
                {t("dashboard.tripDetails")}
              </Link>
              <Link to={`/trips/${activeTrip.id}/focus`} className="button-primary pressable active:scale-[0.96]">
                {t("dashboard.continueTrip")}
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {isLoading ? <div className="surface-card px-5 py-4 text-sm text-stone-600">{t("common.loadingTrips")}</div> : null}

      {!isLoading && trips.length === 0 ? (
        <div className="surface-card flex flex-col items-center justify-center px-6 py-10 text-center">
          <PlaneTakeoff className="text-coast" size={32} aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-ink">{t("dashboard.noTripsYet")}</h2>
          <p className="mt-2 max-w-md text-sm text-stone-600">{t("dashboard.createFirstTrip")}</p>
          <Link className="button-primary pressable mt-5 active:scale-[0.96]" to="/trips/new">
            {t("dashboard.createTrip")}
          </Link>
        </div>
      ) : null}

      {!isLoading && trips.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {trips.map((trip) => {
            const coverUrl = resolveAssetUrl(trip.coverImageUrl);
            return (
              <Link key={trip.id} to={`/trips/${trip.id}`} className="surface-card pressable group overflow-hidden active:scale-[0.99]">
                <div className="relative h-40 bg-stone-100">
                  {coverUrl ? (
                    <img className="image-outline h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" src={coverUrl} alt="" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-stone-500">{t("common.noCoverImage")}</div>
                  )}
                </div>
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-ink text-balance">{trip.title}</h2>
                      <p className="text-sm text-stone-600">{trip.destination}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClassName(trip.status)}`}>{statusLabel(trip.status, locale)}</span>
                  </div>
                  <p className="text-sm text-stone-600">{formatDateRange(trip.startDate, trip.endDate, locale)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
