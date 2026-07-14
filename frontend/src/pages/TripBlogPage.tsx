import axios from "axios";
import { BookOpen, Copy, Eye, EyeOff, RefreshCw, Save, Send, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { generateTripBlog, getTripBlog, publishTripBlog, unpublishTripBlog, updateTripBlog, type TripBlog, type TripBlogContent } from "../api/blogs";
import { getTrip, type TripDetail } from "../api/trips";
import { BlogArticle } from "../components/blogs/BlogArticle";
import { PageHeader } from "../components/PageHeader";
import { useI18n } from "../i18n";

export function TripBlogPage() {
  const { tripId } = useParams();
  const { locale, t } = useI18n();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [blog, setBlog] = useState<TripBlog | null>(null);
  const [draft, setDraft] = useState<TripBlogContent | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!tripId) { setIsLoading(false); return; }
    let active = true;
    Promise.all([
      getTrip(tripId),
      getTripBlog(tripId).catch((requestError: unknown) => {
        if (axios.isAxiosError(requestError) && requestError.response?.status === 404) return null;
        throw requestError;
      }),
    ])
      .then(([loadedTrip, loadedBlog]) => {
        if (!active) return;
        setTrip(loadedTrip);
        setBlog(loadedBlog);
        setDraft(loadedBlog?.draft ?? null);
      })
      .catch(() => { if (active) setError(t("blog.loadFailed")); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [t, tripId]);

  async function handleGenerate() {
    if (!tripId || (blog && !window.confirm(t("blog.regenerateConfirm")))) return;
    setIsMutating(true); setError(null); setNotice(null);
    try {
      const generated = await generateTripBlog(tripId, locale);
      setBlog(generated); setDraft(generated.draft); setMode("preview"); setNotice(t("blog.generated"));
    } catch (requestError) {
      const title = axios.isAxiosError(requestError) ? requestError.response?.data?.title : null;
      setError(typeof title === "string" ? title : t("blog.generateFailed"));
    } finally { setIsMutating(false); }
  }

  async function saveDraft() {
    if (!tripId || !draft) return null;
    const saved = await updateTripBlog(tripId, {
      title: draft.title,
      introduction: draft.introduction,
      conclusion: draft.conclusion,
      sections: draft.sections.map(({ sourceStepId, heading, body }) => ({ sourceStepId, heading, body })),
    });
    setBlog(saved); setDraft(saved.draft);
    return saved;
  }

  async function handleSave() {
    setIsMutating(true); setError(null); setNotice(null);
    try { await saveDraft(); setNotice(t("blog.saved")); }
    catch { setError(t("blog.saveFailed")); }
    finally { setIsMutating(false); }
  }

  async function handlePublish() {
    if (!tripId || !draft || !window.confirm(t("blog.publishConfirm"))) return;
    setIsMutating(true); setError(null); setNotice(null);
    try {
      await saveDraft();
      const published = await publishTripBlog(tripId);
      setBlog(published); setDraft(published.draft); setNotice(t("blog.published"));
    } catch { setError(t("blog.publishFailed")); }
    finally { setIsMutating(false); }
  }

  async function handleUnpublish() {
    if (!tripId || !window.confirm(t("blog.unpublishConfirm"))) return;
    setIsMutating(true); setError(null); setNotice(null);
    try {
      await unpublishTripBlog(tripId);
      setBlog((current) => current ? { ...current, isPublished: false, publishedAt: null, publicUrl: null } : current);
      setNotice(t("blog.unpublished"));
    } catch { setError(t("blog.unpublishFailed")); }
    finally { setIsMutating(false); }
  }

  if (isLoading) return <div className="surface-card px-5 py-4 text-sm text-stone-600">{t("blog.loading")}</div>;
  if (!trip) return <PageHeader eyebrow={t("blog.eyebrow")} title={t("common.tripNotFound")} description={t("blog.loadFailed")} />;

  return (
    <section className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader eyebrow={t("blog.eyebrow")} title={t("blog.workspaceTitle")} description={`${trip.title} · ${trip.destination}`} />
        <Link className="button-secondary pressable" to={`/trips/${trip.id}`}>{t("common.backToTrip")}</Link>
      </div>

      <div className="surface-card overflow-hidden bg-[linear-gradient(135deg,rgba(15,118,110,0.10),rgba(245,158,11,0.08))] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 text-coast"><Sparkles size={22} aria-hidden="true" /><h2 className="text-lg font-semibold text-ink">{blog ? t("blog.draftReady") : t("blog.createTitle")}</h2></div>
            <p className="mt-2 text-pretty text-sm leading-6 text-stone-600">{t("blog.aiDisclosure")}</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-44">
            <button className="button-primary pressable min-h-11 justify-center disabled:cursor-not-allowed disabled:opacity-60" type="button" onClick={handleGenerate} disabled={isMutating || trip.steps.length === 0}>
              <RefreshCw className={isMutating ? "animate-spin motion-reduce:animate-none" : ""} size={18} aria-hidden="true" />
              {blog ? t("blog.regenerate") : t("blog.generate")}
            </button>
          </div>
        </div>
      </div>

      {blog?.generatedProvider && blog.generatedModel ? <p className="text-sm text-stone-600">{t("blog.generatedWith")} <span className="font-semibold text-ink">{blog.generatedProvider} · {blog.generatedModel}</span></p> : null}

      {error ? <p role="alert" className="surface-card border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {notice ? <p role="status" className="surface-card border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">{notice}</p> : null}

      {draft ? (
        <>
          <div className="flex flex-col gap-4 rounded-[1.5rem] bg-slate-950 p-4 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
            <div className="flex rounded-full bg-white/10 p-1" role="group" aria-label={t("blog.viewMode")}>
              <button className={`min-h-10 rounded-full px-4 text-sm font-semibold ${mode === "edit" ? "bg-white text-slate-950" : "text-slate-200"}`} type="button" onClick={() => setMode("edit")}><BookOpen className="mr-2 inline" size={16} aria-hidden="true" />{t("blog.edit")}</button>
              <button className={`min-h-10 rounded-full px-4 text-sm font-semibold ${mode === "preview" ? "bg-white text-slate-950" : "text-slate-200"}`} type="button" onClick={() => setMode("preview")}><Eye className="mr-2 inline" size={16} aria-hidden="true" />{t("blog.preview")}</button>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="button-secondary pressable disabled:opacity-60" type="button" onClick={handleSave} disabled={isMutating}><Save size={17} aria-hidden="true" />{t("blog.save")}</button>
              <button className="button-primary pressable disabled:opacity-60" type="button" onClick={handlePublish} disabled={isMutating}><Send size={17} aria-hidden="true" />{blog?.isPublished ? t("blog.republish") : t("blog.publish")}</button>
              {blog?.isPublished ? <button className="button-danger pressable disabled:opacity-60" type="button" onClick={handleUnpublish} disabled={isMutating}><EyeOff size={17} aria-hidden="true" />{t("blog.unpublish")}</button> : null}
            </div>
          </div>

          {blog?.isPublished && blog.publicUrl ? (
            <div className="surface-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <a className="break-all text-sm font-semibold text-coast hover:underline" href={blog.publicUrl} target="_blank" rel="noreferrer">{blog.publicUrl}</a>
              <button className="button-ghost pressable shrink-0" type="button" onClick={() => void navigator.clipboard.writeText(blog.publicUrl!)}><Copy size={16} aria-hidden="true" />{t("common.copy")}</button>
            </div>
          ) : null}

          {mode === "preview" ? <BlogArticle content={draft} locale={locale} /> : <BlogEditor draft={draft} onChange={setDraft} t={t} />}
        </>
      ) : (
        <div className="surface-card p-8 text-center sm:p-12">
          <BookOpen className="mx-auto text-coast" size={34} aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold text-ink">{t("blog.emptyTitle")}</h2>
          <p className="mx-auto mt-2 max-w-xl text-pretty text-sm leading-6 text-stone-600">{t("blog.emptyDescription")}</p>
        </div>
      )}
    </section>
  );
}

function BlogEditor({ draft, onChange, t }: { draft: TripBlogContent; onChange: (draft: TripBlogContent) => void; t: (key: string) => string }) {
  return (
    <div className="surface-card space-y-7 p-5 sm:p-7">
      <label className="block text-sm font-semibold text-ink">{t("blog.articleTitle")}<input className="form-input mt-2" maxLength={200} value={draft.title} onChange={(event) => onChange({ ...draft, title: event.target.value })} /></label>
      <label className="block text-sm font-semibold text-ink">{t("blog.introduction")}<textarea className="form-input mt-2 min-h-32 resize-y" maxLength={5000} value={draft.introduction} onChange={(event) => onChange({ ...draft, introduction: event.target.value })} /></label>
      <div className="space-y-5">
        {draft.sections.map((section, index) => (
          <fieldset key={section.sourceStepId} className="rounded-[1.5rem] bg-stone-50 p-4 ring-1 ring-stone-200 sm:p-5">
            <legend className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-coast">{t("blog.section")} {index + 1}</legend>
            <label className="block text-sm font-semibold text-ink">{t("blog.heading")}<input className="form-input mt-2" maxLength={200} value={section.heading} onChange={(event) => onChange({ ...draft, sections: draft.sections.map((item) => item.sourceStepId === section.sourceStepId ? { ...item, heading: event.target.value } : item) })} /></label>
            <label className="mt-4 block text-sm font-semibold text-ink">{t("blog.body")}<textarea className="form-input mt-2 min-h-40 resize-y" maxLength={5000} value={section.body} onChange={(event) => onChange({ ...draft, sections: draft.sections.map((item) => item.sourceStepId === section.sourceStepId ? { ...item, body: event.target.value } : item) })} /></label>
          </fieldset>
        ))}
      </div>
      <label className="block text-sm font-semibold text-ink">{t("blog.conclusion")}<textarea className="form-input mt-2 min-h-32 resize-y" maxLength={5000} value={draft.conclusion} onChange={(event) => onChange({ ...draft, conclusion: event.target.value })} /></label>
    </div>
  );
}
