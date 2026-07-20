import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { I18nProvider } from "../i18n";
import { FeaturesPage } from "../pages/FeaturesPage";
import { HowItWorksPage } from "../pages/HowItWorksPage";
import { LandingPageContent } from "../pages/LandingPage";
import { marketingRoutes, type MarketingPageKind } from "./marketingSeo";

const pageByKind: Record<MarketingPageKind, () => React.ReactNode> = {
  home: () => <LandingPageContent />,
  features: () => <FeaturesPage />,
  "how-it-works": () => <HowItWorksPage />,
};

export { marketingRoutes };

export function renderMarketingRoute(pathname: string) {
  const route = marketingRoutes.find((candidate) => candidate.path === pathname);
  if (!route) {
    throw new Error(`Unknown marketing route: ${pathname}`);
  }

  const Page = pageByKind[route.kind];
  return renderToStaticMarkup(
    <I18nProvider initialLocale={route.locale}>
      <MemoryRouter initialEntries={[route.path]}>
        <div className="app-shell min-h-screen text-ink">
          <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10">
            <Page />
          </main>
        </div>
      </MemoryRouter>
    </I18nProvider>,
  );
}
