import { ArrowRight, CheckCircle2, Link2, ListPlus, Play, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { getFeaturesPath } from "../seo/marketingSeo";

export function HowItWorksPage() {
  const { locale, t } = useI18n();
  const steps = [
    { icon: ListPlus, title: t("seoPages.how.stepOneTitle"), description: t("seoPages.how.stepOneDescription") },
    { icon: Play, title: t("seoPages.how.stepTwoTitle"), description: t("seoPages.how.stepTwoDescription") },
    { icon: CheckCircle2, title: t("seoPages.how.stepThreeTitle"), description: t("seoPages.how.stepThreeDescription") },
    { icon: Link2, title: t("seoPages.how.stepFourTitle"), description: t("seoPages.how.stepFourDescription") },
  ];

  return (
    <section className="mx-auto max-w-6xl space-y-16 sm:space-y-20">
      <header className="mx-auto max-w-4xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-coast">{t("seoPages.how.eyebrow")}</p>
        <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-6xl">{t("seoPages.how.title")}</h1>
        <p className="mx-auto mt-6 max-w-3xl text-pretty text-base leading-8 text-stone-600 sm:text-lg">{t("seoPages.how.description")}</p>
      </header>

      <ol className="grid gap-5 lg:grid-cols-2">
        {steps.map(({ icon: Icon, title, description }, index) => (
          <li key={title} className="surface-card-strong flex gap-5 p-6 sm:p-7">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-coast text-white shadow-[0_10px_24px_rgba(13,148,136,0.2)]">
              <Icon size={20} aria-hidden="true" />
              <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-400 px-1 text-xs font-bold text-stone-900 shadow-sm tabular-nums">{index + 1}</span>
            </div>
            <div>
              <h2 className="text-balance text-xl font-semibold text-ink">{title}</h2>
              <p className="mt-3 text-pretty text-sm leading-7 text-stone-600">{description}</p>
            </div>
          </li>
        ))}
      </ol>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
        <div className="surface-card-strong p-6 sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coast">{t("seoPages.how.readyEyebrow")}</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold text-ink">{t("seoPages.how.readyTitle")}</h2>
          <p className="mt-4 max-w-2xl text-pretty text-sm leading-7 text-stone-600">{t("seoPages.how.readyDescription")}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link className="button-primary pressable active:scale-[0.96]" to="/signup">
              {t("nav.getStarted")}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="button-secondary pressable active:scale-[0.96]" to={getFeaturesPath(locale)}>
              {t("nav.features")}
            </Link>
          </div>
        </div>

        <aside className="surface-card flex flex-col justify-center p-6 sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-coast ring-1 ring-teal-100">
            <ShieldCheck size={22} aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-balance text-xl font-semibold text-ink">{t("seoPages.how.privacyTitle")}</h2>
          <p className="mt-3 text-pretty text-sm leading-7 text-stone-600">{t("seoPages.how.privacyDescription")}</p>
        </aside>
      </section>
    </section>
  );
}
