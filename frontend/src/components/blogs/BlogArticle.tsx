import { CalendarDays, CircleDollarSign, MapPin } from "lucide-react";
import type { TripBlogContent } from "../../api/blogs";
import type { Locale } from "../../i18n/messages";
import { TripStepImageCarousel } from "../trips/TripStepImageCarousel";
import { formatDateRange, formatMoney, resolveAssetUrl } from "../trips/tripFormatting";

type BlogArticleProps = {
  content: TripBlogContent;
  locale: Locale;
  publishedLabel?: string;
};

export function BlogArticle({ content, locale, publishedLabel }: BlogArticleProps) {
  const coverUrl = resolveAssetUrl(content.coverImageUrl);

  return (
    <article className="overflow-hidden rounded-[2rem] bg-[#fffdf8] shadow-[0_30px_90px_rgba(41,37,36,0.14)] ring-1 ring-stone-900/5">
      <header className="relative isolate min-h-[28rem] overflow-hidden bg-[#163b37] px-6 py-12 text-white sm:px-10 lg:px-16 lg:py-20">
        {coverUrl ? <img className="absolute inset-0 -z-20 h-full w-full object-cover" src={coverUrl} alt="" /> : null}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(12,34,31,0.94),rgba(12,34,31,0.64)_58%,rgba(12,34,31,0.25))]" />
        <div className="flex min-h-[22rem] max-w-3xl flex-col justify-end">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-100">TripFlow journal</p>
          <h1 className="mt-5 max-w-2xl text-balance text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">{content.title}</h1>
          <p className="mt-6 max-w-2xl text-pretty text-base leading-8 text-white/85 sm:text-lg">{content.introduction}</p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 backdrop-blur"><MapPin size={16} aria-hidden="true" />{content.destination}</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 backdrop-blur"><CalendarDays size={16} aria-hidden="true" /><span className="tabular-nums">{formatDateRange(content.startDate, content.endDate, locale)}</span></span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 backdrop-blur"><CircleDollarSign size={16} aria-hidden="true" /><span className="tabular-nums">{formatMoney(content.totalCost, content.currencyCode, locale)}</span></span>
          </div>
          {publishedLabel ? <p className="mt-5 text-xs text-white/65">{publishedLabel}</p> : null}
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-10 lg:px-16 lg:py-20">
        <ol className="space-y-16">
          {content.sections.map((section, index) => (
            <li key={section.sourceStepId} className="grid gap-7 lg:grid-cols-[72px_minmax(0,1fr)]">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d9eee8] text-xl font-semibold text-[#165f57] tabular-nums">{String(index + 1).padStart(2, "0")}</div>
              <section>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="text-balance text-3xl font-semibold leading-tight text-stone-900 sm:text-4xl">{section.heading}</h2>
                  {section.costAmount != null ? <span className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 tabular-nums">{formatMoney(section.costAmount, content.currencyCode, locale)}</span> : null}
                </div>
                {section.scheduledAt ? <time className="mt-3 block text-sm text-stone-500 tabular-nums" dateTime={section.scheduledAt}>{new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(section.scheduledAt))}</time> : null}
                <p className="mt-6 whitespace-pre-wrap text-pretty text-base leading-8 text-stone-700 sm:text-lg">{section.body}</p>
                {section.imageUrls.length > 0 ? <TripStepImageCarousel className="mt-7" imageUrls={section.imageUrls} altPrefix={section.heading} /> : null}
              </section>
            </li>
          ))}
        </ol>

        <footer className="mt-20 border-t border-stone-200 pt-10">
          <p className="text-2xl leading-10 text-stone-800 sm:text-3xl">{content.conclusion}</p>
        </footer>
      </div>
    </article>
  );
}
