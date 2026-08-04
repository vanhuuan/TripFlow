import { AlertTriangle, ArrowLeft, Bot, Check, ChevronUp, Clock3, ListChecks, RotateCcw, Send, Sparkles, Trash2, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { applyPlanProposal, dismissPlanProposal, getPlannerMessages, sendPlannerMessage, type PlanProposal, type PlannerMessage, type ProposedTripPlan, type ProposedTripStep } from "../api/planner";
import { getTrip, type TripDetail, type TripStep } from "../api/trips";
import { PageHeader } from "../components/PageHeader";
import { formatDateRange, formatMoney } from "../components/trips/tripFormatting";
import { stepStatusLabel, stepTypeLabel } from "../components/trips/tripStepFormatting";
import { useI18n } from "../i18n";

function apiError(error: unknown, fallback: string) {
  const response = (error as { response?: { status?: number; data?: { title?: string; message?: string } } }).response;
  return { status: response?.status, message: response?.data?.title ?? response?.data?.message ?? fallback };
}

function sameValues(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function stepChanged(step: TripStep, proposal: ProposedTripStep) {
  return !sameValues(
    [step.title, step.description, step.type, step.scheduledAt, step.costAmount == null ? null : Number(step.costAmount), step.googleMapsUrl, step.externalUrl, step.imageUrls, [...step.participantMemberIds].sort()],
    [proposal.title, proposal.description, proposal.type, proposal.scheduledAt, proposal.costAmount, proposal.googleMapsUrl, proposal.externalUrl, proposal.imageUrls, [...proposal.participantMemberIds].sort()],
  );
}

function proposalDiff(trip: TripDetail, proposal: PlanProposal) {
  const plan = proposal.plan;
  const existingById = new Map(trip.steps.map((step) => [step.id, step]));
  const proposedIds = new Set(plan.steps.flatMap((step) => (step.id ? [step.id] : [])));
  const created = plan.steps.filter((step) => !step.id);
  const deleted = trip.steps.filter((step) => !proposedIds.has(step.id));
  const updated = plan.steps.filter((step) => step.id && existingById.has(step.id) && stepChanged(existingById.get(step.id)!, step));
  const statusChanged = plan.steps.filter((step) => step.id && existingById.get(step.id)?.status !== step.status);
  const currentRetainedOrder = trip.steps.filter((step) => proposedIds.has(step.id)).map((step) => step.id);
  const proposedRetainedOrder = plan.steps.flatMap((step) => (step.id ? [step.id] : []));
  const reordered = !sameValues(currentRetainedOrder, proposedRetainedOrder);
  const tripFields = [
    trip.title !== plan.title ? "title" : null,
    trip.destination !== plan.destination ? "destination" : null,
    trip.description !== plan.description ? "description" : null,
    trip.startDate !== plan.startDate || trip.endDate !== plan.endDate ? "dates" : null,
    trip.currencyCode !== plan.currencyCode ? "currency" : null,
  ].filter((value): value is string => Boolean(value));
  return { created, deleted, updated, statusChanged, reordered, tripFields, total: created.length + deleted.length + updated.length + statusChanged.length + (reordered ? 1 : 0) + tripFields.length };
}

function savedPlan(trip: TripDetail): ProposedTripPlan {
  return {
    title: trip.title,
    destination: trip.destination,
    description: trip.description,
    startDate: trip.startDate,
    endDate: trip.endDate,
    currencyCode: trip.currencyCode,
    steps: trip.steps.map((step) => ({
      key: step.id,
      id: step.id,
      title: step.title,
      description: step.description,
      type: step.type,
      status: step.status,
      scheduledAt: step.scheduledAt,
      costAmount: step.costAmount == null ? null : Number(step.costAmount),
      googleMapsUrl: step.googleMapsUrl,
      externalUrl: step.externalUrl,
      imageUrls: step.imageUrls,
      participantMemberIds: step.participantMemberIds,
    })),
  };
}

function WorkingPlanReview({ trip, proposal, busy, onSave, onReset, onContinue }: { trip: TripDetail; proposal: PlanProposal | null; busy: boolean; onSave: () => void; onReset: () => void; onContinue: () => void }) {
  const { locale, t } = useI18n();
  const plan = useMemo(() => proposal?.plan ?? savedPlan(trip), [proposal, trip]);
  const diff = useMemo(() => proposal ? proposalDiff(trip, proposal) : null, [proposal, trip]);
  const currentById = useMemo(() => new Map(trip.steps.map((step) => [step.id, step])), [trip.steps]);
  const retainedCurrentOrder = trip.steps.filter((step) => plan.steps.some((item) => item.id === step.id)).map((step) => step.id);
  const retainedWorkingOrder = plan.steps.flatMap((step) => step.id ? [step.id] : []);
  const deleted = diff?.deleted ?? [];
  const hasChanges = Boolean(diff && diff.total > 0);

  return (
    <section className="rounded-[1.5rem] bg-white p-4 shadow-[0_0_0_0.0625rem_rgba(15,23,42,0.06),0_0.75rem_2rem_rgba(15,23,42,0.08)] sm:p-5" aria-labelledby="working-plan-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-coast">{proposal ? t("planner.workingPlan") : t("planner.savedPlan")}</p>
          <h2 id="working-plan-title" className="mt-1 text-balance text-xl font-semibold text-ink">{plan.title}</h2>
          <p className="mt-1 text-pretty text-sm text-stone-600">{plan.destination}</p>
          {plan.description ? <p className="mt-2 text-pretty text-sm leading-6 text-stone-600">{plan.description}</p> : null}
        </div>
        <span className={`inline-flex min-h-8 items-center rounded-full px-3 text-xs font-semibold ring-1 ${hasChanges ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-stone-100 text-stone-700 ring-stone-300"}`}>
          {hasChanges ? t("planner.unsavedChanges") : t("planner.upToDate")}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-stone-50 p-3 shadow-[inset_0_0_0_0.0625rem_rgba(120,113,108,0.18)]"><p className="text-xs text-stone-600">{t("planner.dates")}</p><p className="mt-1 text-pretty text-sm font-semibold text-ink">{formatDateRange(plan.startDate, plan.endDate, locale)}</p></div>
        <div className="rounded-2xl bg-stone-50 p-3 shadow-[inset_0_0_0_0.0625rem_rgba(120,113,108,0.18)]"><p className="text-xs text-stone-600">{t("planner.steps")}</p><p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{plan.steps.length}</p></div>
      </div>

      {diff ? <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {diff.tripFields.length > 0 ? <DiffPill label={t("planner.tripUpdates")} count={diff.tripFields.length} /> : null}
        {diff.created.length > 0 ? <DiffPill label={t("planner.createdSteps")} count={diff.created.length} /> : null}
        {diff.updated.length > 0 ? <DiffPill label={t("planner.editedSteps")} count={diff.updated.length} /> : null}
        {diff.statusChanged.length > 0 ? <DiffPill label={t("planner.statusChanges")} count={diff.statusChanged.length} /> : null}
        {diff.reordered ? <DiffPill label={t("planner.reorderedSteps")} count={1} /> : null}
        {deleted.length > 0 ? <DiffPill label={t("planner.deletedSteps")} count={deleted.length} destructive /> : null}
      </div> : null}

      <ol className="mt-5 space-y-2" aria-label={t("planner.workingItinerary")}>
        {plan.steps.map((step, index) => {
          const isNew = !step.id;
          const current = step.id ? currentById.get(step.id) : null;
          const reordered = Boolean(step.id) && retainedCurrentOrder.indexOf(step.id!) !== retainedWorkingOrder.indexOf(step.id!);
          return (
            <li key={step.key} className="rounded-2xl bg-stone-50 p-3 shadow-[inset_0_0_0_0.0625rem_rgba(120,113,108,0.18)]">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold tabular-nums text-stone-700 shadow-sm">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-pretty text-sm font-semibold text-ink">{step.title}</p>
                    {isNew ? <ChangeBadge label={t("planner.newBadge")} /> : null}
                    {current && stepChanged(current, step) ? <ChangeBadge label={t("planner.editedBadge")} /> : null}
                    {current && current.status !== step.status ? <ChangeBadge label={stepStatusLabel(step.status, locale)} /> : null}
                    {reordered ? <ChangeBadge label={t("planner.reorderedBadge")} /> : null}
                  </div>
                  <p className="mt-1 text-xs text-stone-600">{stepTypeLabel(step.type, locale)} · {stepStatusLabel(step.status, locale)} · {step.scheduledAt ? new Date(step.scheduledAt).toLocaleString(locale === "vi" ? "vi-VN" : "en-US") : t("common.unscheduled")}</p>
                  {step.costAmount != null ? <p className="mt-1 text-xs tabular-nums text-stone-600">{formatMoney(step.costAmount, plan.currencyCode, locale)}</p> : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {plan.steps.length === 0 ? <p className="mt-5 rounded-2xl bg-stone-50 px-4 py-5 text-center text-sm text-stone-600 shadow-[inset_0_0_0_0.0625rem_rgba(120,113,108,0.18)]">{t("planner.noSteps")}</p> : null}

      {deleted.length > 0 ? <div className="mt-4 space-y-2" aria-label={t("planner.stepsToDelete")}>
        {deleted.map((step) => <div key={step.id} className="rounded-2xl bg-red-50 p-3 text-red-900 shadow-[inset_0_0_0_0.0625rem_rgba(220,38,38,0.2)]">
          <div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-red-700 shadow-sm"><Trash2 size={16} aria-hidden="true" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-pretty text-sm font-semibold line-through">{step.title}</p><ChangeBadge label={t("planner.pendingDeleteBadge")} destructive /></div><p className="mt-1 text-xs text-red-800">{stepTypeLabel(step.type, locale)}</p></div></div>
        </div>)}
      </div> : null}

      {proposal && diff ? (
        <div className="sticky bottom-3 mt-5 rounded-[1.25rem] bg-white/95 p-2 shadow-[0_0_0_0.0625rem_rgba(15,23,42,0.08),0_0.75rem_2rem_rgba(15,23,42,0.14)] backdrop-blur">
          {hasChanges ? <button className="button-primary pressable min-h-11 w-full active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={onSave} disabled={busy}>
            <Check size={18} aria-hidden="true" />{busy ? t("planner.saving") : t("planner.saveAll", { count: diff.total })}
          </button> : null}
          <div className={`${hasChanges ? "mt-2" : ""} grid grid-cols-2 gap-2`}>
            <button className="button-secondary pressable min-h-11 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={onContinue} disabled={busy}><Bot size={18} aria-hidden="true" />{t("planner.keepDiscussing")}</button>
            <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-red-800 transition-[background-color,transform] duration-150 hover:bg-red-50 active:scale-[0.96] motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={onReset} disabled={busy}><RotateCcw size={18} aria-hidden="true" />{t("planner.resetChanges")}</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function DiffPill({ label, count, destructive = false }: { label: string; count: number; destructive?: boolean }) {
  return <div className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium ${destructive ? "bg-red-50 text-red-800 ring-1 ring-red-200" : "bg-teal-50 text-teal-900 ring-1 ring-teal-200"}`}><span>{label}</span><span className="tabular-nums">{count}</span></div>;
}

function ChangeBadge({ label, destructive = false }: { label: string; destructive?: boolean }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[0.68rem] font-semibold ring-1 ${destructive ? "bg-red-50 text-red-800 ring-red-200" : "bg-teal-50 text-teal-900 ring-teal-200"}`}>{label}</span>;
}

function MessageBubble({ message }: { message: PlannerMessage }) {
  const { locale, t } = useI18n();
  const isUser = message.role === "User";
  return (
    <article className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-coast text-white shadow-md"><Bot size={19} aria-hidden="true" /></span> : null}
      <div className={`max-w-[86%] rounded-[1.25rem] px-4 py-3 shadow-sm ${isUser ? "rounded-br-md bg-slate-900 text-white" : "rounded-bl-md bg-white text-stone-800 ring-1 ring-stone-200"}`}>
        <p className="whitespace-pre-wrap text-pretty text-sm leading-6">{message.content}</p>
        <div className={`mt-2 flex flex-wrap items-center gap-2 text-[0.68rem] ${isUser ? "text-slate-300" : "text-stone-500"}`}>
          <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString(locale === "vi" ? "vi-VN" : "en-US", { hour: "2-digit", minute: "2-digit" })}</time>
          {!isUser && message.model ? <span>{t("planner.generatedWith", { model: message.model })}</span> : null}
        </div>
      </div>
      {isUser ? <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 shadow-sm"><UserRound size={19} aria-hidden="true" /></span> : null}
    </article>
  );
}

export function TripPlannerPage() {
  const { tripId } = useParams();
  const { locale, t } = useI18n();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [messages, setMessages] = useState<PlannerMessage[]>([]);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [busyProposalId, setBusyProposalId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "plan">("chat");
  const bottomRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!tripId) { setIsLoading(false); return; }
    let active = true;
    Promise.all([getTrip(tripId), getPlannerMessages(tripId)])
      .then(([loadedTrip, page]) => {
        if (!active) return;
        setTrip(loadedTrip); setMessages(page.messages); setNextBefore(page.nextBefore); setError(null);
      })
      .catch(() => active && setError(t("planner.loadFailed")))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, [t, tripId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages.length, isSending]);

  const activeProposal = useMemo(() => [...messages].reverse().find((message) => message.proposal?.status === "Pending")?.proposal ?? null, [messages]);

  async function reloadMessages() {
    if (!tripId) return;
    const page = await getPlannerMessages(tripId);
    setMessages(page.messages); setNextBefore(page.nextBefore);
  }

  async function loadOlder() {
    if (!tripId || !nextBefore) return;
    const page = await getPlannerMessages(tripId, nextBefore);
    setMessages((current) => {
      const currentIds = new Set(current.map((message) => message.id));
      return [...page.messages.filter((message) => !currentIds.has(message.id)), ...current];
    });
    setNextBefore(page.nextBefore);
  }

  async function sendMessage(text = draft) {
    const message = text.trim();
    if (!tripId || !message || isSending) return;
    setIsSending(true); setError(null); setDraft("");
    try {
      const turn = await sendPlannerMessage(tripId, message, locale, crypto.randomUUID());
      setMessages((current) => [...current, turn.userMessage, turn.assistantMessage]);
      setAnnouncement(t("planner.responseReady"));
      if (turn.assistantMessage.proposal) setActiveTab("plan");
    } catch (caught) {
      const result = apiError(caught, t("planner.sendFailed"));
      setError(result.status === 429 ? t("planner.rateLimited") : result.message);
      setDraft(message);
    } finally { setIsSending(false); }
  }

  async function applyProposal(proposal: PlanProposal) {
    if (!tripId) return;
    setBusyProposalId(proposal.id); setError(null);
    try {
      setTrip(await applyPlanProposal(tripId, proposal.id));
      await reloadMessages();
      setAnnouncement(t("planner.appliedAnnouncement"));
    } catch (caught) {
      const result = apiError(caught, t("planner.applyFailed"));
      if (result.status === 409) {
        setTrip(await getTrip(tripId));
        await reloadMessages();
        setError(t("planner.staleProposal"));
      } else setError(result.message);
    } finally { setBusyProposalId(null); }
  }

  async function resetProposal(proposal: PlanProposal) {
    if (!tripId) return;
    setBusyProposalId(proposal.id); setError(null);
    try {
      await dismissPlanProposal(tripId, proposal.id);
      setMessages((current) => current.map((message) => message.proposal?.id === proposal.id ? { ...message, proposal: { ...message.proposal, status: "Dismissed" } } : message));
      setAnnouncement(t("planner.resetAnnouncement"));
    } catch (caught) { setError(apiError(caught, t("planner.resetFailed")).message); }
    finally { setBusyProposalId(null); }
  }

  function continueDiscussing() {
    setActiveTab("chat");
    setAnnouncement(t("planner.draftPreservedAnnouncement"));
    window.requestAnimationFrame(() => composerRef.current?.focus());
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); }
  }

  if (isLoading) return <div className="surface-card px-5 py-4 text-sm text-stone-600">{t("planner.loading")}</div>;
  if (!tripId || !trip) return <section className="space-y-6"><PageHeader eyebrow={t("planner.eyebrow")} title={t("common.tripNotFound")} description={t("planner.loadFailed")} />{error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{error}</p> : null}<Link className="button-primary pressable active:scale-[0.96]" to="/dashboard">{t("common.backToDashboard")}</Link></section>;

  const suggestedPrompts = [t("planner.promptAddDay"), t("planner.promptReorder"), t("planner.promptBudget")];
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader eyebrow={t("planner.eyebrow")} title={t("planner.title")} description={trip.title} />
        <Link className="button-secondary pressable min-h-11 active:scale-[0.96]" to={`/trips/${trip.id}`}><ArrowLeft size={18} aria-hidden="true" />{t("common.backToTrip")}</Link>
      </div>
      {error ? <p className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200"><AlertTriangle className="mt-0.5 shrink-0" size={17} aria-hidden="true" />{error}</p> : null}
      <p className="sr-only" aria-live="polite">{announcement}</p>

      <div className="grid grid-cols-2 gap-2 rounded-[1.25rem] bg-white/85 p-2 shadow-sm ring-1 ring-stone-200 lg:hidden" role="tablist" aria-label={t("planner.mobileViews")}>
        <button className={`min-h-11 rounded-xl px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coast ${activeTab === "chat" ? "bg-coast text-white" : "text-stone-700"}`} type="button" role="tab" aria-selected={activeTab === "chat"} onClick={() => setActiveTab("chat")}><Bot className="mr-2 inline" size={17} aria-hidden="true" />{t("planner.chatTab")}</button>
        <button className={`min-h-11 rounded-xl px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coast ${activeTab === "plan" ? "bg-coast text-white" : "text-stone-700"}`} type="button" role="tab" aria-selected={activeTab === "plan"} onClick={() => setActiveTab("plan")}><ListChecks className="mr-2 inline" size={17} aria-hidden="true" />{t("planner.planTab")}</button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)] lg:items-start">
        <section className={`${activeTab === "chat" ? "flex" : "hidden"} surface-card min-h-[640px] flex-col overflow-hidden lg:flex`} aria-label={t("planner.conversation")}>
          <div className="border-b border-stone-200 bg-white/70 px-5 py-4">
            <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-coast text-white shadow-md"><Sparkles size={20} aria-hidden="true" /></span><div><h2 className="text-balance font-semibold text-ink">{t("planner.assistantName")}</h2><p className="text-pretty text-xs text-stone-600">{t("planner.assistantDescription")}</p></div></div>
          </div>
          <div className="flex-1 space-y-5 overflow-y-auto bg-stone-50/60 p-4 sm:p-5">
            {nextBefore ? <button className="mx-auto flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-stone-700 shadow-sm ring-1 ring-stone-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coast" type="button" onClick={() => void loadOlder()}><ChevronUp size={17} aria-hidden="true" />{t("planner.loadOlder")}</button> : null}
            {messages.length === 0 ? <div className="rounded-[1.5rem] bg-white p-5 text-center shadow-sm ring-1 ring-stone-200"><Bot className="mx-auto text-coast" size={28} aria-hidden="true" /><h2 className="mt-3 text-balance font-semibold text-ink">{t("planner.emptyTitle")}</h2><p className="mt-2 text-pretty text-sm leading-6 text-stone-600">{t("planner.emptyDescription")}</p><div className="mt-4 flex flex-col gap-2">{suggestedPrompts.map((prompt) => <button key={prompt} className="min-h-11 rounded-2xl bg-teal-50 px-4 text-left text-sm font-medium text-teal-900 ring-1 ring-teal-200 transition-[background-color,transform] duration-200 hover:bg-teal-100 active:scale-[0.96] motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coast" type="button" onClick={() => void sendMessage(prompt)}>{prompt}</button>)}</div></div> : messages.map((message) => <MessageBubble key={message.id} message={message} />)}
            {isSending ? <div className="flex gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-coast text-white"><Bot size={19} aria-hidden="true" /></span><div className="rounded-[1.25rem] rounded-bl-md bg-white px-4 py-3 text-sm text-stone-600 ring-1 ring-stone-200"><span className="inline-flex items-center gap-2"><Clock3 className="animate-pulse motion-reduce:animate-none" size={16} aria-hidden="true" />{t("planner.thinking")}</span></div></div> : null}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-stone-200 bg-white p-4 sm:p-5">
            <label className="sr-only" htmlFor="planner-message">{t("planner.messageLabel")}</label>
            <textarea ref={composerRef} id="planner-message" className="form-input min-h-24 resize-y text-sm" value={draft} maxLength={4000} placeholder={t("planner.placeholder")} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleComposerKeyDown} disabled={isSending} />
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-pretty text-xs text-stone-600">{t("planner.composerHint")}</p><button className="button-primary pressable min-h-11 shrink-0 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={() => void sendMessage()} disabled={isSending || !draft.trim()}><Send size={18} aria-hidden="true" />{t("planner.send")}</button></div>
            <p className="mt-3 text-pretty text-xs leading-5 text-stone-500">{t("planner.disclosure")}</p>
          </div>
        </section>

        <aside className={`${activeTab === "plan" ? "block" : "hidden"} lg:sticky lg:top-28 lg:block`} aria-label={t("planner.planPreview")}>
          <WorkingPlanReview trip={trip} proposal={activeProposal} busy={busyProposalId === activeProposal?.id} onSave={() => activeProposal && void applyProposal(activeProposal)} onReset={() => activeProposal && void resetProposal(activeProposal)} onContinue={continueDiscussing} />
        </aside>
      </div>
    </section>
  );
}
