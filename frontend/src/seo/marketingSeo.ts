import type { Locale } from "../i18n";

export type MarketingPageKind = "home" | "features" | "how-it-works";

export type MarketingRoute = {
  path: string;
  locale: Locale;
  kind: MarketingPageKind;
  title: string;
  description: string;
  alternatePath: string;
  breadcrumbLabel?: string;
};

export const defaultSiteUrl = "https://tripflow.app";

export const marketingRoutes: MarketingRoute[] = [
  {
    path: "/vi",
    locale: "vi",
    kind: "home",
    title: "TripFlow | Lập kế hoạch chuyến đi rõ ràng",
    description: "Lập kế hoạch chuyến đi, theo sát từng bước và chia sẻ hành trình bằng một luồng đơn giản với TripFlow.",
    alternatePath: "/en",
  },
  {
    path: "/en",
    locale: "en",
    kind: "home",
    title: "TripFlow | Clear trip planning from start to finish",
    description: "Plan a trip, stay focused on the next step, and share the itinerary through one simple workflow with TripFlow.",
    alternatePath: "/vi",
  },
  {
    path: "/vi/tinh-nang",
    locale: "vi",
    kind: "features",
    title: "Tính năng lập kế hoạch chuyến đi | TripFlow",
    description: "Khám phá cách TripFlow giúp bạn quản lý lịch trình, chi phí, địa điểm, chế độ tập trung và liên kết chia sẻ chỉ xem.",
    alternatePath: "/en/features",
    breadcrumbLabel: "Tính năng",
  },
  {
    path: "/en/features",
    locale: "en",
    kind: "features",
    title: "Trip planning features | TripFlow",
    description: "Explore itinerary planning, costs, places, focus mode, travel photos, and read-only sharing in TripFlow.",
    alternatePath: "/vi/tinh-nang",
    breadcrumbLabel: "Features",
  },
  {
    path: "/vi/cach-hoat-dong",
    locale: "vi",
    kind: "how-it-works",
    title: "Cách TripFlow hoạt động | Từ kế hoạch đến hành trình",
    description: "Tạo chuyến đi, sắp xếp từng điểm dừng, theo sát bước tiếp theo và chia sẻ lịch trình an toàn với TripFlow.",
    alternatePath: "/en/how-it-works",
    breadcrumbLabel: "Cách hoạt động",
  },
  {
    path: "/en/how-it-works",
    locale: "en",
    kind: "how-it-works",
    title: "How TripFlow works | From plan to journey",
    description: "Create a trip, organize every stop, follow the next action, and safely share the itinerary with TripFlow.",
    alternatePath: "/vi/cach-hoat-dong",
    breadcrumbLabel: "How it works",
  },
];

export function normalizeSiteUrl(value?: string) {
  return (value?.trim() || defaultSiteUrl).replace(/\/$/, "");
}

export function getMarketingRoute(pathname: string) {
  const normalizedPath = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return marketingRoutes.find((route) => route.path === normalizedPath);
}

export function getLocaleHome(locale: Locale) {
  return locale === "vi" ? "/vi" : "/en";
}

export function getFeaturesPath(locale: Locale) {
  return locale === "vi" ? "/vi/tinh-nang" : "/en/features";
}

export function getHowItWorksPath(locale: Locale) {
  return locale === "vi" ? "/vi/cach-hoat-dong" : "/en/how-it-works";
}

export function buildStructuredData(route: MarketingRoute, siteUrl: string) {
  const canonicalUrl = `${siteUrl}${route.path}`;
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "TripFlow",
      url: siteUrl,
      logo: `${siteUrl}/resource.png`,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      name: "TripFlow",
      url: siteUrl,
      inLanguage: ["vi", "en"],
      publisher: { "@id": `${siteUrl}/#organization` },
    },
    {
      "@type": "WebApplication",
      name: "TripFlow",
      url: canonicalUrl,
      applicationCategory: "TravelApplication",
      operatingSystem: "Web",
      inLanguage: route.locale,
      description: route.description,
      publisher: { "@id": `${siteUrl}/#organization` },
    },
  ];

  if (route.breadcrumbLabel) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: route.locale === "vi" ? "Trang chủ" : "Home",
          item: `${siteUrl}${getLocaleHome(route.locale)}`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: route.breadcrumbLabel,
          item: canonicalUrl,
        },
      ],
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
