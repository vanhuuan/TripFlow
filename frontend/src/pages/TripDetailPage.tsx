import { CheckCircle2, Copy, Edit, Eye, ListPlus, Play, Share2, Trash2, Unlock } from "lucide-react";
import { BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { completeTrip, createTripShareLink, deleteTrip, disableTripShareLink, getTrip, startTrip, type TripDetail, type TripMember, type TripStep } from "../api/trips";
import { useI18n } from "../i18n";
import { PageHeader } from "../components/PageHeader";
import { TripStepImageCarousel } from "../components/trips/TripStepImageCarousel";
import { formatDateRange, formatMoney, resolveAssetUrl, statusClassName, statusLabel } from "../components/trips/tripFormatting";
import { stepTypeLabel } from "../components/trips/tripStepFormatting";

function getStepParticipants(step: TripStep, members: TripMember[]) {
  if (members.length === 0) return [];
  const selected = members.filter((member) => step.participantMemberIds.includes(member.id));
  return selected.length > 0 ? selected : members;
}

function calculateSplitTotals(trip: TripDetail) {
  const totals = new Map(trip.members.map((member) => [member.id, 0]));
  for (const step of trip.steps) {
    const cost = step.costAmount == null ? 0 : Number(step.costAmount);
    const participants = getStepParticipants(step, trip.members);
    if (!Number.isFinite(cost) || cost <= 0 || participants.length === 0) continue;
    const share = cost / participants.length;
    for (const participant of participants) {
      totals.set(participant.id, (totals.get(participant.id) ?? 0) + share);
    }
  }
  return trip.members.map((member) => ({ member, amount: totals.get(member.id) ?? 0 }));
}
export function TripDetailPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { locale, t } = useI18n();
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
  }, [t, tripId]);

  async function handleStart() {
    if (!tripId) return;
    setIsMutating(true);
    try {
      const startedTrip = await startTrip(tripId);
      setTrip(startedTrip);
      setError(null);
      navigate(`/trips/${startedTrip.id}/focus`, { replace: true });
    } catch {
      setError(t("common.tripCouldNotBeStarted"));
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
      setError(t("common.tripCouldNotBeCompleted"));
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteTrip() {
    if (!tripId || !window.confirm("X�a chuy?n di n�y? Thao t�c n�y kh�ng th? ho�n t�c.")) return;
    setIsMutating(true);
    try {
      await deleteTrip(tripId);
      navigate("/dashboard", { replace: true });
    } catch {
      setError(t("common.tripCouldNotBeDeleted"));
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
      setError(t("common.shareLinkCouldNotBeCreated"));
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
      setError(t("common.shareLinkCouldNotBeDisabled"));
    } finally {
      setIsMutating(false);
    }
  }

  async function handleCopyShareLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
  }

  if (isLoading) {
    return <div className="surface-card px-5 py-4 text-sm text-stone-600">{t("common.loadingTrip")}</div>;
  }

  if (!trip) {
    return (
      <section className="space-y-6">
        <PageHeader eyebrow={t("trip.itinerary")} title={t("common.tripNotFound")} description={t("common.tripCouldNotBeLoaded")} />
        {error ? <p className="surface-card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        <Link className="button-primary pressable active:scale-[0.96]" to="/dashboard">
          {t("common.backToDashboard")}
        </Link>
      </section>
    );
  }

  const coverUrl = resolveAssetUrl(trip.coverImageUrl);
  const splitTotals = calculateSplitTotals(trip);

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader eyebrow={t("trip.itinerary")} title={trip.title} description={trip.destination} />
        <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusClassName(trip.status)}`}>{statusLabel(trip.status, locale)}</span>
      </div>

      {error ? <p className="surface-card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="surface-card overflow-hidden">
          <div className="relative h-64 bg-stone-100 sm:h-72">
            {coverUrl ? <img className="image-outline h-full w-full object-cover" src={coverUrl} alt="" /> : <div className="flex h-full items-center justify-center text-sm text-stone-500">{t("common.noCoverImage")}</div>}
          </div>
          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <h2 className="text-base font-semibold text-ink">{t("trip.tripInformation")}</h2>
              <p className="mt-1 text-sm text-stone-600">{formatDateRange(trip.startDate, trip.endDate, locale)}</p>
            </div>
            <p className="text-sm text-stone-600">{t("common.estimatedCost")}: {formatMoney(trip.totalCost, trip.currencyCode, locale)}</p>
            {trip.description ? <p className="whitespace-pre-wrap text-sm leading-7 text-stone-700">{trip.description}</p> : <p className="text-sm text-stone-500">{t("common.noDescriptionYet")}</p>}
          </div>
        </div>

        <div className="surface-card space-y-3 p-5 sm:p-6">
          <Link className="button-secondary pressable w-full active:scale-[0.96]" to={`/trips/${trip.id}/edit`}>
            <Edit size={18} aria-hidden="true" />
            {t("trip.editTrip")}
          </Link>
          <button className="button-primary pressable w-full active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={handleStart} disabled={isMutating || trip.status === "Active"}>
            <Play size={18} aria-hidden="true" />
            {t("trip.startTrip")}
          </button>
          <button className="button-ghost pressable w-full active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={handleComplete} disabled={isMutating || trip.status === "Completed"}>
            <CheckCircle2 size={18} aria-hidden="true" />
            {t("trip.completeTrip")}
          </button>
          <Link className="button-secondary pressable w-full active:scale-[0.96]" to={`/trips/${trip.id}/focus`}>
            <Eye size={18} aria-hidden="true" />
            {t("trip.openFocusMode")}
          </Link>
          <Link className="button-secondary pressable w-full active:scale-[0.96]" to={`/trips/${trip.id}/blog`}>
            <BookOpen size={18} aria-hidden="true" />
            {t("blog.openWorkspace")}
          </Link>
          <button className="button-danger pressable w-full active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={handleDeleteTrip} disabled={isMutating}>
            <Trash2 size={18} aria-hidden="true" />
            {t("trip.deleteTrip")}
          </button>
        </div>
      </div>


      {trip.members.length > 0 ? (
        <div className="surface-card p-5 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-ink">Bill split</h2>
              <p className="mt-1 text-sm text-stone-600">Each step cost is split evenly between members selected for that step.</p>
            </div>
            <Link className="button-secondary pressable active:scale-[0.96]" to={`/trips/${trip.id}/edit`}>
              Manage members
            </Link>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {splitTotals.map(({ member, amount }) => (
              <div key={member.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200">
                <p className="text-sm font-semibold text-ink">{member.name}</p>
                <p className="mt-2 text-2xl font-semibold text-coast tabular-nums">{formatMoney(amount, trip.currencyCode, locale)}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="surface-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">{t("trip.sharing")}</h2>
            <p className="mt-1 text-sm text-stone-600">{t("trip.generateShareDescription")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="button-secondary pressable active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={handleCreateShare} disabled={isMutating}>
              <Share2 size={18} aria-hidden="true" />
              {trip.isPublicShared ? t("trip.regenerateLink") : t("trip.createShareLink")}
            </button>
            <button className="button-secondary pressable active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={handleDisableShare} disabled={isMutating || !trip.isPublicShared}>
              <Unlock size={18} aria-hidden="true" />
              {t("trip.disableShare")}
            </button>
          </div>
        </div>

        {shareUrl ? (
          <div className="mt-5 flex flex-col gap-3 rounded-[1.25rem] border border-stone-200 bg-stone-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <a className="break-all text-sm font-medium text-coast underline-offset-4 hover:underline" href={shareUrl} target="_blank" rel="noreferrer">
              {shareUrl}
            </a>
            <button className="button-ghost pressable active:scale-[0.96]" type="button" onClick={handleCopyShareLink}>
              <Copy size={16} aria-hidden="true" />
              {t("common.copy")}
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-stone-500">{t("common.noPublicShareLinkYet")}</p>
        )}
      </div>

      <div className="surface-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-ink">{t("trip.itinerarySteps")}</h2>
            <p className="mt-1 text-sm text-stone-600">{t("trip.readOnlyStepList")}</p>
          </div>
          <Link className="button-secondary pressable active:scale-[0.96]" to={`/trips/${trip.id}/steps/edit`}>
            <ListPlus size={18} aria-hidden="true" />
            {t("trip.editSteps")}
          </Link>
        </div>

        {trip.steps.length === 0 ? (
          <p className="mt-5 rounded-[1.25rem] border border-dashed border-stone-200 px-4 py-4 text-sm text-stone-500">{t("common.noItineraryStepsYet")}</p>
        ) : (
          <ol className="mt-5 space-y-3">
            {trip.steps.map((step) => (
              <li key={step.id} className="rounded-[1.25rem] border border-stone-200 bg-white p-4 shadow-sm">
                <div className="grid gap-3 md:grid-cols-[140px_minmax(0,1fr)_220px] md:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{stepTypeLabel(step.type, locale)}</p>
                    <p className="mt-1 text-sm text-stone-600">{step.scheduledAt ? new Date(step.scheduledAt).toLocaleString(locale === "vi" ? "vi-VN" : "en-US") : t("common.unscheduled")}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{step.title}</p>
                    {step.costAmount != null ? <p className="mt-1 text-sm text-stone-600">{t("common.cost")}: {formatMoney(step.costAmount, trip.currencyCode, locale)}</p> : null}
                    {trip.members.length > 0 ? (
                      <p className="mt-1 text-sm text-stone-600">
                        Members: {getStepParticipants(step, trip.members).map((member) => member.name).join(", ")}
                        {step.costAmount != null && getStepParticipants(step, trip.members).length > 0 ? ` · ${formatMoney(Number(step.costAmount) / getStepParticipants(step, trip.members).length, trip.currencyCode, locale)} each` : ""}
                      </p>
                    ) : null}
                    {step.description ? <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-stone-700">{step.description}</p> : <p className="mt-1 text-sm text-stone-500">{t("common.noDescriptionYet")}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {step.googleMapsUrl ? (
                      <a className="button-secondary pressable px-3 py-2 text-sm active:scale-[0.96]" href={step.googleMapsUrl} target="_blank" rel="noreferrer">
                        {t("tripSteps.maps")}
                      </a>
                    ) : null}
                    {step.externalUrl ? (
                      <a className="button-secondary pressable px-3 py-2 text-sm active:scale-[0.96]" href={step.externalUrl} target="_blank" rel="noreferrer">
                        {t("tripSteps.link")}
                      </a>
                    ) : null}
                    {step.imageUrls.length > 0 ? <span className="inline-flex items-center rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-ink">{step.imageUrls.length} {step.imageUrls.length === 1 ? t("tripSteps.photo") : t("tripSteps.photos")}</span> : null}
                  </div>
                  {step.imageUrls.length > 0 ? (
                    <div className="w-full md:col-start-2 md:col-span-2 md:max-w-[720px] md:justify-self-start">
                      <TripStepImageCarousel className="mt-5" imageUrls={step.imageUrls} altPrefix={step.title} />
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

