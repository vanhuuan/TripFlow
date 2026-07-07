import type { ReactNode } from "react";
import { CalendarPlus, LayoutDashboard, LogIn, LogOut, UserPlus } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useI18n } from "../i18n";

type AppLayoutProps = {
  children: ReactNode;
};

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, logout, user } = useAuth();
  const { locale, toggleLocale, t } = useI18n();
  const location = useLocation();
  const isLandingSurface = location.pathname === "/";
  const isPublicSurface = isLandingSurface || location.pathname === "/login" || location.pathname === "/signup" || location.pathname.startsWith("/share/");

  const homeTo = isAuthenticated ? "/dashboard" : "/";
  const languageLabel = locale === "vi" ? "EN" : "VI";
  const languageTitle = locale === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt";

  const authenticatedLinks = [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/trips/new", label: t("nav.newTrip"), icon: CalendarPlus },
  ];

  return (
    <div className="app-shell min-h-screen text-ink">
      <header
        className={
          isPublicSurface
            ? "sticky top-0 z-30 border-b border-white/70 bg-white/65 text-ink shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl"
            : "sticky top-0 z-30 border-b border-white/30 bg-slate-950/80 text-white shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl"
        }
      >
        <div className={isPublicSurface ? "mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10" : "mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10"}>
          <Link to={homeTo} className="flex items-center gap-3">
            <span className={isPublicSurface ? "flex h-12 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-1 shadow-lg shadow-slate-950/10 ring-1 ring-slate-950/5" : "flex h-12 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-1 shadow-lg shadow-slate-950/20 ring-1 ring-white/10"}>
              <img src="/resource.png" alt="TripFlow logo" className="h-full w-full object-contain" />
            </span>
            <span>
              <span className={isPublicSurface ? "block text-lg font-semibold tracking-wide text-ink" : "block text-lg font-semibold tracking-wide"}>TripFlow</span>
              <span className={isPublicSurface ? "block text-sm text-stone-600" : "block text-sm text-slate-300"}>{isPublicSurface ? t("landing.heroDescription") : "Plan, start, and follow each trip"}</span>
            </span>
          </Link>

          <nav className="flex flex-wrap items-center gap-2">
            {isPublicSurface ? (
              <>
                {isLandingSurface ? (
                  <a
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-stone-600 transition-transform transition-colors duration-200 hover:-translate-y-0.5 hover:bg-stone-100 hover:text-ink active:scale-[0.96]"
                    href="#how-it-works"
                  >
                    {t("nav.howItWorks")}
                  </a>
                ) : (
                  <Link
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-stone-600 transition-transform transition-colors duration-200 hover:-translate-y-0.5 hover:bg-stone-100 hover:text-ink active:scale-[0.96]"
                    to="/"
                  >
                    {t("nav.home")}
                  </Link>
                )}
                <Link
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-stone-600 transition-transform transition-colors duration-200 hover:-translate-y-0.5 hover:bg-stone-100 hover:text-ink active:scale-[0.96]"
                  to="/login"
                >
                  <LogIn size={16} aria-hidden="true" />
                  {t("nav.login")}
                </Link>
                <Link
                  className="inline-flex items-center gap-2 rounded-full bg-coast px-4 py-2 text-sm font-medium text-white shadow-[0_10px_20px_rgba(13,148,136,0.16)] transition-transform transition-colors duration-200 hover:-translate-y-0.5 hover:bg-[#0d6b63] active:scale-[0.96]"
                  to="/signup"
                >
                  <UserPlus size={16} aria-hidden="true" />
                  {t("nav.getStarted")}
                </Link>
              </>
            ) : (
              <>
                {authenticatedLinks.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      [
                        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-transform transition-colors duration-200 hover:-translate-y-0.5 active:scale-[0.96]",
                        isActive ? "bg-white text-slate-950 shadow-lg shadow-slate-950/20" : "text-slate-200 hover:bg-white/10 hover:text-white",
                      ].join(" ")
                    }
                  >
                    <Icon size={16} aria-hidden="true" />
                    {label}
                  </NavLink>
                ))}
                {isAuthenticated ? (
                  <button
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-200 transition-transform transition-colors duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white active:scale-[0.96]"
                    type="button"
                    onClick={logout}
                    title={user ? `Signed in as ${user.displayName}` : t("nav.logout")}
                  >
                    <LogOut size={16} aria-hidden="true" />
                    {t("nav.logout")}
                  </button>
                ) : null}
              </>
            )}
            <button
              className={isPublicSurface ? "inline-flex min-w-14 items-center justify-center rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-700 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-stone-50 active:scale-[0.96]" : "inline-flex min-w-14 items-center justify-center rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/15 active:scale-[0.96]"}
              type="button"
              onClick={toggleLocale}
              aria-label={languageTitle}
              title={languageTitle}
            >
              {languageLabel}
            </button>
          </nav>
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
