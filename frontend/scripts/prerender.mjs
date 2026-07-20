import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { build } from "vite";

const root = process.cwd();
const distDirectory = path.join(root, "dist");
const serverDirectory = path.join(root, ".prerender");
const siteUrl = (process.env.VITE_SITE_URL?.trim() || "https://tripflow.app").replace(/\/$/, "");

function escapeAttribute(value) {
  return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function buildStructuredData(route) {
  const canonicalUrl = `${siteUrl}${route.path}`;
  const graph = [
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
          item: `${siteUrl}/${route.locale}`,
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

function buildHead(route) {
  const canonicalUrl = `${siteUrl}${route.path}`;
  const alternateUrl = `${siteUrl}${route.alternatePath}`;
  const viUrl = route.locale === "vi" ? canonicalUrl : alternateUrl;
  const enUrl = route.locale === "en" ? canonicalUrl : alternateUrl;
  const imageUrl = `${siteUrl}/resource.png`;
  const structuredData = JSON.stringify(buildStructuredData(route)).replaceAll("<", "\\u003c");

  return `<!-- seo:start -->
    <title>${escapeAttribute(route.title)}</title>
    <meta name="description" content="${escapeAttribute(route.description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />
    <link rel="alternate" hreflang="vi" href="${escapeAttribute(viUrl)}" />
    <link rel="alternate" hreflang="en" href="${escapeAttribute(enUrl)}" />
    <link rel="alternate" hreflang="x-default" href="${escapeAttribute(viUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeAttribute(route.title)}" />
    <meta property="og:description" content="${escapeAttribute(route.description)}" />
    <meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />
    <meta property="og:image" content="${escapeAttribute(imageUrl)}" />
    <meta property="og:locale" content="${route.locale === "vi" ? "vi_VN" : "en_US"}" />
    <meta name="twitter:card" content="summary_large_image" />
    <script type="application/ld+json">${structuredData}</script>
    <!-- seo:end -->`;
}

function buildDocument(template, route, body) {
  return template
    .replace(/<html lang="[^"]*">/, `<html lang="${route.locale}">`)
    .replace(/<!-- seo:start -->[\s\S]*?<!-- seo:end -->/, buildHead(route))
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

function buildSitemap(routes) {
  const entries = routes.map((route) => {
    const canonicalUrl = `${siteUrl}${route.path}`;
    const alternateUrl = `${siteUrl}${route.alternatePath}`;
    const viUrl = route.locale === "vi" ? canonicalUrl : alternateUrl;
    const enUrl = route.locale === "en" ? canonicalUrl : alternateUrl;
    return `  <url>
    <loc>${canonicalUrl}</loc>
    <xhtml:link rel="alternate" hreflang="vi" href="${viUrl}" />
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${viUrl}" />
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;
}

try {
  await build({
    logLevel: "warn",
    build: {
      ssr: "src/seo/prerender.tsx",
      outDir: serverDirectory,
      emptyOutDir: true,
      copyPublicDir: false,
      rollupOptions: { output: { entryFileNames: "prerender.js" } },
    },
  });

  const serverModule = await import(`${pathToFileURL(path.join(serverDirectory, "prerender.js")).href}?v=${Date.now()}`);
  const template = await readFile(path.join(distDirectory, "index.html"), "utf8");

  for (const route of serverModule.marketingRoutes) {
    const outputDirectory = path.join(distDirectory, route.path.slice(1));
    await mkdir(outputDirectory, { recursive: true });
    const body = serverModule.renderMarketingRoute(route.path);
    await writeFile(path.join(outputDirectory, "index.html"), buildDocument(template, route, body), "utf8");
  }

  await writeFile(path.join(distDirectory, "sitemap.xml"), buildSitemap(serverModule.marketingRoutes), "utf8");
  await writeFile(
    path.join(distDirectory, "robots.txt"),
    `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`,
    "utf8",
  );
} finally {
  await rm(serverDirectory, { recursive: true, force: true });
}
