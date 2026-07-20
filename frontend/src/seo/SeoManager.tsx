import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../i18n";
import { buildStructuredData, getMarketingRoute, normalizeSiteUrl } from "./marketingSeo";

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element!.setAttribute(name, value));
}

function upsertLink(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([name, value]) => element!.setAttribute(name, value));
}

function removeMarketingHead() {
  document.head.querySelectorAll('[data-tripflow-seo="marketing"]').forEach((element) => element.remove());
}

export function SeoManager() {
  const location = useLocation();
  const { locale } = useI18n();

  useEffect(() => {
    const route = getMarketingRoute(location.pathname);
    const siteUrl = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);
    removeMarketingHead();

    if (!route) {
      document.title = "TripFlow";
      upsertMeta('meta[name="robots"]', { name: "robots", content: "noindex, nofollow" });
      document.documentElement.lang = locale;
      return;
    }

    const canonicalUrl = `${siteUrl}${route.path}`;
    const alternateUrl = `${siteUrl}${route.alternatePath}`;
    const viUrl = route.locale === "vi" ? canonicalUrl : alternateUrl;
    const enUrl = route.locale === "en" ? canonicalUrl : alternateUrl;
    const imageUrl = `${siteUrl}/resource.png`;

    document.title = route.title;
    document.documentElement.lang = route.locale;
    upsertMeta('meta[name="description"]', { name: "description", content: route.description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: "index, follow" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: route.title, "data-tripflow-seo": "marketing" });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: route.description, "data-tripflow-seo": "marketing" });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website", "data-tripflow-seo": "marketing" });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl, "data-tripflow-seo": "marketing" });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: imageUrl, "data-tripflow-seo": "marketing" });
    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: route.locale === "vi" ? "vi_VN" : "en_US", "data-tripflow-seo": "marketing" });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image", "data-tripflow-seo": "marketing" });
    upsertLink('link[rel="canonical"]', { rel: "canonical", href: canonicalUrl, "data-tripflow-seo": "marketing" });
    upsertLink('link[rel="alternate"][hreflang="vi"]', { rel: "alternate", hreflang: "vi", href: viUrl, "data-tripflow-seo": "marketing" });
    upsertLink('link[rel="alternate"][hreflang="en"]', { rel: "alternate", hreflang: "en", href: enUrl, "data-tripflow-seo": "marketing" });
    upsertLink('link[rel="alternate"][hreflang="x-default"]', { rel: "alternate", hreflang: "x-default", href: viUrl, "data-tripflow-seo": "marketing" });

    const structuredData = document.createElement("script");
    structuredData.type = "application/ld+json";
    structuredData.dataset.tripflowSeo = "marketing";
    structuredData.textContent = JSON.stringify(buildStructuredData(route, siteUrl));
    document.head.appendChild(structuredData);
  }, [locale, location.pathname]);

  return null;
}
