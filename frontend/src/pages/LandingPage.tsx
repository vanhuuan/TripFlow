import { type ComponentType } from "react";
import { ArrowRight, CalendarPlus, CheckCircle2, Clock3, Link2, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n";

type IconComponent = ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;

type FeatureCard = {
  icon: IconComponent;
  title: string;
  description: string;
};

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const featureCards: FeatureCard[] = [
    {
      icon: CalendarPlus,
      title: t("landing.featurePlanningTitle"),
      description: t("landing.featurePlanningDescription"),
    },
    {
      icon: Target,
      title: t("landing.featureFocusTitle"),
      description: t("landing.featureFocusDescription"),
    },
    {
      icon: Link2,
      title: t("landing.featureSharingTitle"),
      description: t("landing.featureSharingDescription"),
    },
  ];

  const previewItems = [
    {
      label: t("landing.now"),
      tone: "active" as const,
      text: t("landing.nowItem"),
    },
    {
      label: t("landing.next"),
      tone: "muted" as const,
      text: t("landing.nextItem"),
    },
  ];

  return (
    <section className="relative space-y-20 overflow-hidden sm:space-y-24 lg:space-y-28">
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] h-[30rem] overflow-hidden">
        <div className="absolute left-[-6rem] top-8 h-72 w-72 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="absolute right-[-5rem] top-20 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="absolute inset-x-1/4 top-2 h-24 rounded-full bg-white/40 blur-3xl" />
      </div>

      <div className="relative grid items-center gap-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:gap-16">
        <div className="landing-reveal space-y-8" style={{ animationDelay: "40ms" }}>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-coast shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_30px_rgba(15,23,42,0.06)] ring-1 ring-white/80">
            <Sparkles size={16} aria-hidden={true} />
            {t("landing.publicPreview")}
          </div>

          <div className="space-y-5">
            <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">{t("landing.heroTitle")}</h1>
            <p className="max-w-2xl text-pretty text-lg leading-8 text-stone-600 sm:text-xl">{t("landing.heroDescription")}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link className="button-primary pressable active:scale-[0.96]" to="/signup">
              {t("landing.createAccount")}
              <ArrowRight size={16} aria-hidden={true} />
            </Link>
            <Link className="button-secondary pressable active:scale-[0.96]" to="/login">
              {t("landing.login")}
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: CalendarPlus, label: t("landing.draftTrips") },
              { icon: Target, label: t("landing.focusMode") },
              { icon: Link2, label: t("landing.shareLinks") },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center justify-center gap-2 rounded-[1.15rem] bg-white/75 px-4 py-3 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_20px_rgba(15,23,42,0.05)] ring-1 ring-white/75">
                <Icon size={14} aria-hidden={true} className="text-coast" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="landing-reveal relative" style={{ animationDelay: "140ms" }}>
          <div className="surface-card-strong relative overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,247,246,0.92))]">
            <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(13,148,136,0.14),transparent_55%),radial-gradient(circle_at_top_right,rgba(245,158,11,0.12),transparent_45%)]" />

            <div className="relative flex items-center justify-between border-b border-white/75 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#f5b34d]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#6dc6b6]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#d9dee3]" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{t("landing.workspacePreview")}</p>
                  <p className="text-xs text-stone-500">{t("landing.workspaceSubtitle")}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-coast ring-1 ring-teal-100">
                <Clock3 size={14} aria-hidden={true} />
                {t("landing.livePlanning")}
              </span>
            </div>

            <div className="relative grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="space-y-4">
                <div className="rounded-[1.85rem] bg-white/82 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-white/70">
                  <img src="/resource.png" alt={t("landing.workspacePreview")} className="image-outline aspect-[16/10] w-full rounded-[1.4rem] object-cover" />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 pb-1">
                    <div>
                      <p className="text-sm font-semibold text-ink">{t("landing.kyotoTitle")}</p>
                      <p className="text-xs text-stone-500">{t("landing.kyotoDescription")}</p>
                    </div>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 ring-1 ring-stone-200">{t("landing.draftTrip")}</span>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="surface-card p-4 transition-transform duration-200 hover:-translate-y-0.5">
                    <div className="flex items-center gap-2 text-coast">
                      <CheckCircle2 size={16} aria-hidden={true} />
                      <p className="text-sm font-semibold text-ink">{t("landing.focusMode")}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{t("landing.focusDescription")}</p>
                  </div>
                  <div className="surface-card p-4 transition-transform duration-200 hover:-translate-y-0.5">
                    <div className="flex items-center gap-2 text-coast">
                      <Link2 size={16} aria-hidden={true} />
                      <p className="text-sm font-semibold text-ink">{t("landing.shareLinks")}</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{t("landing.shareDescription")}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="surface-card p-5 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center gap-2 text-coast">
                    <Target size={18} aria-hidden={true} />
                    <p className="text-sm font-semibold text-ink">{t("landing.focusMode")}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{t("landing.focusDescription")}</p>
                  <div className="mt-4 space-y-2">
                    {previewItems.map((item) => (
                      <div key={item.label} className="flex items-center justify-between rounded-[1.15rem] bg-stone-50 px-3 py-2.5 text-sm text-stone-700 ring-1 ring-stone-200 transition-colors duration-200 hover:bg-white">
                        <span>{item.text}</span>
                        <span className={item.tone === "active" ? "rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-coast ring-1 ring-teal-100" : "rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-500 ring-1 ring-stone-200"}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="surface-card p-5 transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="flex items-center gap-2 text-coast">
                    <Link2 size={18} aria-hidden={true} />
                    <p className="text-sm font-semibold text-ink">{t("landing.shareLinks")}</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{t("landing.shareDescription")}</p>
                  <div className="mt-4 rounded-[1.15rem] bg-stone-50 px-4 py-3 text-sm font-medium text-stone-600 ring-1 ring-stone-200">
                    tripflow.app/share/8F3K...A2
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-stone-500">
                    <ShieldCheck size={16} aria-hidden={true} className="text-coast" />
                    {t("common.readOnly")}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative grid gap-3 border-t border-white/75 bg-white/60 px-4 py-4 sm:grid-cols-3 sm:px-5">
              {[
                { title: t("landing.draftTrips"), description: t("landing.heroDescription") },
                { title: t("landing.focusMode"), description: t("landing.focusDescription") },
                { title: t("landing.shareLinks"), description: t("landing.shareDescription") },
              ].map((item, index) => (
                <div key={item.title} className="rounded-[1.25rem] bg-white/90 px-4 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-white/80" style={{ animationDelay: `${index * 70}ms` }}>
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="landing-reveal grid gap-5 md:grid-cols-3" style={{ animationDelay: "220ms" }}>
        {featureCards.map(({ icon: Icon, title, description }) => (
          <article key={title} className="surface-card-strong group p-6 transition-transform duration-200 hover:-translate-y-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-coast ring-1 ring-teal-100 transition-transform duration-200 group-hover:scale-[1.03]">
              <Icon size={20} aria-hidden={true} />
            </div>
            <h2 className="mt-5 text-balance text-xl font-semibold text-ink">{title}</h2>
            <p className="mt-3 text-pretty text-sm leading-7 text-stone-600">{description}</p>
          </article>
        ))}
      </div>

      <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12" id="how-it-works">
        <div className="landing-reveal space-y-5" style={{ animationDelay: "300ms" }}>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-coast">{t("nav.howItWorks")}</p>
          <h2 className="max-w-xl text-balance text-3xl font-semibold text-ink sm:text-4xl">{t("landing.howItWorksTitle")}</h2>
          <p className="max-w-lg text-pretty text-base leading-7 text-stone-600">{t("landing.howItWorksDescription")}</p>
          <div className="flex flex-wrap gap-3">
            <Link className="button-primary pressable active:scale-[0.96]" to="/signup">
              {t("landing.createAccount")}
              <ArrowRight size={16} aria-hidden={true} />
            </Link>
            <Link className="button-secondary pressable active:scale-[0.96]" to="/login">
              {t("landing.login")}
            </Link>
          </div>
        </div>

        <ol className="landing-reveal grid gap-4" style={{ animationDelay: "380ms" }}>
          {[
            { title: t("landing.draftTrips"), description: t("landing.kyotoDescription") },
            { title: t("landing.focusMode"), description: t("landing.focusDescription") },
            { title: t("landing.shareLinks"), description: t("landing.shareDescription") },
          ].map((step, index) => (
            <li key={step.title} className="surface-card-strong flex gap-4 p-5 sm:p-6 transition-transform duration-200 hover:-translate-y-0.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-coast text-sm font-semibold text-white shadow-[0_10px_20px_rgba(13,148,136,0.16)]">
                {index + 1}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
                <p className="text-pretty text-sm leading-7 text-stone-600">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-reveal surface-card-strong flex flex-col gap-6 bg-[linear-gradient(135deg,rgba(15,118,110,0.08),rgba(255,255,255,0.92))] p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between" style={{ animationDelay: "460ms" }}>
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-coast">{t("landing.publicPreview")}</p>
          <h2 className="text-balance text-2xl font-semibold text-ink sm:text-3xl">{t("landing.readyTitle")}</h2>
          <p className="max-w-2xl text-pretty text-sm leading-7 text-stone-600">{t("landing.readyDescription")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="button-primary pressable active:scale-[0.96]" to="/signup">
            {t("nav.getStarted")}
            <ArrowRight size={16} aria-hidden={true} />
          </Link>
          <Link className="button-secondary pressable active:scale-[0.96]" to="/login">
            {t("nav.login")}
          </Link>
        </div>
      </section>
    </section>
  );
}
