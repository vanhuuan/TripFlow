import { ArrowRight, Banknote, Crosshair, Images, Link2, MapPinned, Route } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n";
import { getHowItWorksPath, getLocaleHome } from "../seo/marketingSeo";

export function FeaturesPage() {
  const { locale, t } = useI18n();
  const features = [
    { icon: Route, title: t("seoPages.features.itineraryTitle"), description: t("seoPages.features.itineraryDescription") },
    { icon: MapPinned, title: t("seoPages.features.placesTitle"), description: t("seoPages.features.placesDescription") },
    { icon: Banknote, title: t("seoPages.features.costsTitle"), description: t("seoPages.features.costsDescription") },
    { icon: Crosshair, title: t("seoPages.features.focusTitle"), description: t("seoPages.features.focusDescription") },
    { icon: Images, title: t("seoPages.features.photosTitle"), description: t("seoPages.features.photosDescription") },
    { icon: Link2, title: t("seoPages.features.sharingTitle"), description: t("seoPages.features.sharingDescription") },
  ];

  return (
    <section className="mx-auto max-w-7xl space-y-16 sm:space-y-20">
      <header className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#073f3a_0%,#0f766e_58%,#159487_100%)] px-6 py-14 text-white shadow-[0_28px_80px_rgba(15,118,110,0.24)] sm:px-10 sm:py-20 lg:px-16">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-amber-200/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-teal-100">{t("seoPages.features.eyebrow")}</p>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{t("seoPages.features.title")}</h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-teal-50/90 sm:text-lg">{t("seoPages.features.description")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="button-primary pressable bg-white text-coast hover:bg-teal-50 active:scale-[0.96]" to="/signup">
              {t("nav.getStarted")}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link className="inline-flex min-h-11 items-center justify-center rounded-full bg-white/10 px-4 py-3 text-sm font-semibold text-white ring-1 ring-white/25 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/15 active:scale-[0.96]" to={getHowItWorksPath(locale)}>
              {t("nav.howItWorks")}
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <article key={title} className="surface-card-strong p-6 sm:p-7">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-coast shadow-sm ring-1 ring-teal-100">
              <Icon size={21} aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-balance text-xl font-semibold text-ink">{title}</h2>
            <p className="mt-3 text-pretty text-sm leading-7 text-stone-600">{description}</p>
          </article>
        ))}
      </div>

      <section className="surface-card-strong grid gap-8 bg-[linear-gradient(135deg,rgba(15,118,110,0.08),rgba(255,255,255,0.96))] p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-coast">{t("seoPages.features.workflowEyebrow")}</p>
          <h2 className="mt-3 max-w-3xl text-balance text-3xl font-semibold text-ink">{t("seoPages.features.workflowTitle")}</h2>
          <p className="mt-4 max-w-3xl text-pretty text-sm leading-7 text-stone-600">{t("seoPages.features.workflowDescription")}</p>
        </div>
        <Link className="button-secondary pressable active:scale-[0.96]" to={getLocaleHome(locale)}>
          {t("nav.home")}
        </Link>
      </section>
    </section>
  );
}
