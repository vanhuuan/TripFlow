import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarPlus, Languages, LayoutDashboard, LogIn, LogOut, Menu, UserPlus, X, type LucideIcon } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n";
import { getFeaturesPath, getHowItWorksPath, getLocaleHome, getMarketingRoute } from "../seo/marketingSeo";

type AppLayoutProps = {
  children: ReactNode;
};

type NavigationItem = {
  to: string;
  label: string;
  icon?: LucideIcon;
  emphasis?: boolean;
  showActiveState?: boolean;
};

type HeaderNavigationProps = {
  items: NavigationItem[];
  isAuthenticated: boolean;
  isPublicSurface: boolean;
  languageLabel: string;
  languageTitle: string;
  languageTarget?: string;
  logoutLabel: string;
  userTitle?: string;
  mobile?: boolean;
  onLanguageChange: () => void;
  onLogout: () => void;
  onNavigate?: () => void;
};

function HeaderNavigation({
  items,
  isAuthenticated,
  isPublicSurface,
  languageLabel,
  languageTitle,
  languageTarget,
  logoutLabel,
  userTitle,
  mobile = false,
  onLanguageChange,
  onLogout,
  onNavigate,
}: HeaderNavigationProps) {
  const focusClassName = isPublicSurface
    ? "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coast"
    : "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

  const getLinkClassName = (item: NavigationItem, isActive: boolean) => {
    if (mobile) {
      if (item.emphasis) {
        return `flex min-h-11 w-full items-center gap-3 rounded-2xl bg-coast px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(13,148,136,0.16)] transition-[transform,background-color] duration-200 hover:bg-[#0d6b63] active:scale-[0.96] motion-reduce:transition-none ${focusClassName}`;
      }

      if (!isPublicSurface && isActive) {
        return `flex min-h-11 w-full items-center gap-3 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-slate-950 shadow-lg shadow-slate-950/20 transition-[transform,background-color,color] duration-200 active:scale-[0.96] motion-reduce:transition-none ${focusClassName}`;
      }

      return `flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-[transform,background-color,color] duration-200 active:scale-[0.96] motion-reduce:transition-none ${
        isPublicSurface ? "text-stone-700 hover:bg-stone-100 hover:text-ink" : "text-slate-100 hover:bg-white/10 hover:text-white"
      } ${focusClassName}`;
    }

    if (item.emphasis) {
      return `inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-coast px-4 py-2 text-sm font-medium text-white shadow-[0_10px_20px_rgba(13,148,136,0.16)] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-[#0d6b63] active:scale-[0.96] motion-reduce:transition-none ${focusClassName}`;
    }

    const stateClassName = isPublicSurface
      ? "text-stone-600 hover:bg-stone-100 hover:text-ink"
      : isActive
        ? "bg-white text-slate-950 shadow-lg shadow-slate-950/20"
        : "text-slate-200 hover:bg-white/10 hover:text-white";

    return `inline-flex min-h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-[transform,background-color,color] duration-200 hover:-translate-y-0.5 active:scale-[0.96] motion-reduce:transition-none ${stateClassName} ${focusClassName}`;
  };

  const utilityClassName = mobile
    ? `flex min-h-11 w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-[transform,background-color,color] duration-200 active:scale-[0.96] motion-reduce:transition-none ${
      isPublicSurface ? "text-stone-700 hover:bg-stone-100 hover:text-ink" : "text-slate-100 hover:bg-white/10 hover:text-white"
    } ${focusClassName}`
    : `inline-flex min-h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full border px-3 py-2 text-sm font-semibold shadow-sm transition-[transform,background-color] duration-200 hover:-translate-y-0.5 active:scale-[0.96] motion-reduce:transition-none ${
      isPublicSurface
        ? "min-w-14 border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
        : "min-w-14 border-white/15 bg-white/10 text-white hover:bg-white/15"
    } ${focusClassName}`;

  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => getLinkClassName(item, Boolean(item.showActiveState && isActive))}
            onClick={onNavigate}
          >
            {Icon ? <Icon size={mobile ? 18 : 16} aria-hidden="true" /> : null}
            {item.label}
          </NavLink>
        );
      })}

      {isAuthenticated ? (
        <button
          className={mobile ? utilityClassName : getLinkClassName({ to: "", label: "" }, false)}
          type="button"
          onClick={() => {
            onNavigate?.();
            onLogout();
          }}
          title={userTitle ?? logoutLabel}
        >
          <LogOut size={mobile ? 18 : 16} aria-hidden="true" />
          {logoutLabel}
        </button>
      ) : null}

      {languageTarget ? (
        <Link
          className={utilityClassName}
          to={languageTarget}
          onClick={() => {
            onNavigate?.();
            onLanguageChange();
          }}
          aria-label={languageTitle}
          title={languageTitle}
        >
          {mobile ? <Languages size={18} aria-hidden="true" /> : null}
          {mobile ? <span className="flex-1 text-left">{languageTitle}</span> : null}
          <span>{languageLabel}</span>
        </Link>
      ) : (
        <button
          className={utilityClassName}
          type="button"
          onClick={() => {
            onNavigate?.();
            onLanguageChange();
          }}
          aria-label={languageTitle}
          title={languageTitle}
        >
          {mobile ? <Languages size={18} aria-hidden="true" /> : null}
          {mobile ? <span className="flex-1 text-left">{languageTitle}</span> : null}
          <span>{languageLabel}</span>
        </button>
      )}
    </>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, logout, user } = useAuth();
  const { locale, setLocale, toggleLocale, t } = useI18n();
  const location = useLocation();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [mobileMenu, setMobileMenu] = useState({ isOpen: false, pathname: location.pathname });
  const isMobileMenuOpen = mobileMenu.isOpen && mobileMenu.pathname === location.pathname;
  const marketingRoute = getMarketingRoute(location.pathname);
  const isMarketingSurface = Boolean(marketingRoute);
  const isPublicSurface = isMarketingSurface || location.pathname === "/login" || location.pathname === "/signup" || location.pathname.startsWith("/share/") || location.pathname.startsWith("/blogs/");

  const homeTo = isAuthenticated ? "/dashboard" : getLocaleHome(locale);
  const languageLabel = locale === "vi" ? "EN" : "VI";
  const languageTitle = locale === "vi" ? t("common.switchToEnglish") : t("common.switchToVietnamese");
  const nextLocale = locale === "vi" ? "en" : "vi";
  const languageTarget = marketingRoute?.alternatePath;
  const closeMobileMenu = useCallback(() => {
    setMobileMenu({ isOpen: false, pathname: location.pathname });
  }, [location.pathname]);
  const toggleMobileMenu = () => setMobileMenu({ isOpen: !isMobileMenuOpen, pathname: location.pathname });
  const changeLanguage = () => (languageTarget ? setLocale(nextLocale) : toggleLocale());

  const navigationItems: NavigationItem[] = isPublicSurface
    ? [
        ...(isMarketingSurface
          ? [
              { to: getLocaleHome(locale), label: t("nav.home") },
              { to: getFeaturesPath(locale), label: t("nav.features") },
              { to: getHowItWorksPath(locale), label: t("nav.howItWorks") },
            ]
          : [{ to: getLocaleHome(locale), label: t("nav.home") }]),
        { to: "/login", label: t("nav.login"), icon: LogIn },
        { to: "/signup", label: t("nav.getStarted"), icon: UserPlus, emphasis: true },
      ]
    : [
        { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard, showActiveState: true },
        { to: "/trips/new", label: t("nav.newTrip"), icon: CalendarPlus, showActiveState: true },
      ];

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMobileMenu();
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeMobileMenu, isMobileMenuOpen]);

  const navigationProps = {
    items: navigationItems,
    isAuthenticated,
    isPublicSurface,
    languageLabel,
    languageTitle,
    languageTarget,
    logoutLabel: t("nav.logout"),
    userTitle: user ? t("common.signedInAs", { name: user.displayName }) : undefined,
    onLanguageChange: changeLanguage,
    onLogout: logout,
  };

  return (
    <div className="app-shell min-h-screen text-ink">
      <header
        className={
          isPublicSurface
            ? "sticky top-0 z-30 border-b border-white/70 bg-white/65 text-ink shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl"
            : "sticky top-0 z-30 border-b border-white/30 bg-slate-950/80 text-white shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl"
        }
      >
        <div className={isPublicSurface ? "mx-auto max-w-7xl px-4 py-3 sm:px-6 md:py-4 lg:px-10" : "mx-auto max-w-6xl px-4 py-3 sm:px-6 md:py-4 lg:px-10"}>
          <div className="flex items-center justify-between gap-3">
            <Link
              to={homeTo}
              className={`flex min-w-0 items-center gap-3 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${isPublicSurface ? "focus-visible:outline-coast" : "focus-visible:outline-white"}`}
              onClick={closeMobileMenu}
            >
              <span className={isPublicSurface ? "flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-1 shadow-lg shadow-slate-950/10 ring-1 ring-slate-950/5 md:h-12 md:w-16" : "flex h-11 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-1 shadow-lg shadow-slate-950/20 ring-1 ring-white/10 md:h-12 md:w-16"}>
                <img src="/resource.svg" alt={t("common.appName")} className="h-full w-full object-contain" />
              </span>
              <span className="min-w-0 md:hidden lg:block">
                <span className={isPublicSurface ? "block truncate text-lg font-semibold tracking-wide text-ink" : "block truncate text-lg font-semibold tracking-wide"}>TripFlow</span>
                <span className={isPublicSurface ? "hidden text-sm text-stone-600 xl:block" : "hidden text-sm text-slate-300 xl:block"}>{isPublicSurface ? t("landing.heroDescription") : t("common.appTagline")}</span>
              </span>
            </Link>

            <nav aria-label={t("nav.primaryNavigation")} className="hidden items-center gap-2 md:flex">
              <HeaderNavigation {...navigationProps} />
            </nav>

            <button
              ref={menuButtonRef}
              className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-[transform,background-color] duration-200 active:scale-[0.96] motion-reduce:transition-none md:hidden ${
                isPublicSurface
                  ? "border border-stone-200 bg-white/90 text-stone-700 shadow-sm hover:bg-stone-100 focus-visible:outline-coast"
                  : "border border-white/15 bg-white/10 text-white shadow-sm hover:bg-white/15 focus-visible:outline-white"
              } focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
              type="button"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-primary-navigation"
              aria-label={isMobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              title={isMobileMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            >
              <span className="relative h-5 w-5" aria-hidden="true">
                <Menu
                  className={`absolute inset-0 h-5 w-5 transition-[transform,opacity,filter] duration-200 ease-out motion-reduce:transition-none ${isMobileMenuOpen ? "scale-25 opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-0"}`}
                />
                <X
                  className={`absolute inset-0 h-5 w-5 transition-[transform,opacity,filter] duration-200 ease-out motion-reduce:transition-none ${isMobileMenuOpen ? "scale-100 opacity-100 blur-0" : "scale-25 opacity-0 blur-[4px]"}`}
                />
              </span>
            </button>
          </div>

          <div
            className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none md:hidden ${
              isMobileMenuOpen ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0"
            }`}
            aria-hidden={!isMobileMenuOpen}
            inert={!isMobileMenuOpen ? true : undefined}
          >
            <div className="overflow-hidden">
              <nav
                id="mobile-primary-navigation"
                aria-label={t("nav.primaryNavigation")}
                className={`mt-3 flex flex-col gap-2 rounded-[1.5rem] p-2 shadow-[0_16px_40px_rgba(15,23,42,0.14)] ring-1 ${
                  isPublicSurface ? "bg-white/95 ring-slate-950/5" : "bg-slate-900/95 ring-white/10"
                }`}
              >
                <HeaderNavigation {...navigationProps} mobile onNavigate={closeMobileMenu} />
              </nav>
            </div>
          </div>
        </div>
      </header>

      <main
        className={
          isPublicSurface
            ? "px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10"
            : "mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10"
        }
      >
        {children}
      </main>
    </div>
  );
}
