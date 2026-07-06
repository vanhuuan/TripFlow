import type { ReactNode } from "react";
import { CalendarPlus, LayoutDashboard, LogIn, LogOut, UserPlus } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

type AppLayoutProps = {
  children: ReactNode;
};

const authenticatedLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trips/new", label: "New trip", icon: CalendarPlus },
];

const anonymousLinks = [
  { to: "/login", label: "Login", icon: LogIn },
  { to: "/signup", label: "Signup", icon: UserPlus },
];

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, logout, user } = useAuth();
  const links = isAuthenticated ? authenticatedLinks : anonymousLinks;

  return (
    <div className="min-h-screen text-ink app-shell">
      <header className="border-b border-white/15 bg-slate-950/75 text-white backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <span className="flex h-12 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-1 shadow-lg shadow-slate-950/20">
              <img src="/resource.png" alt="TripFlow logo" className="h-full w-full object-contain" />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-wide">TripFlow</span>
              <span className="block text-sm text-slate-300">Plan, start, and follow each trip</span>
            </span>
          </NavLink>

          <nav className="flex flex-wrap items-center gap-2">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition",
                    isActive ? "bg-white text-slate-950" : "text-slate-200 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <button
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
                type="button"
                onClick={logout}
                title={user ? `Signed in as ${user.displayName}` : "Logout"}
              >
                <LogOut size={16} aria-hidden="true" />
                Logout
              </button>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
