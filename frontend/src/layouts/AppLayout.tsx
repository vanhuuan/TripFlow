import type { ReactNode } from "react";
import { CalendarPlus, Compass, LayoutDashboard, LogIn, LogOut, UserPlus } from "lucide-react";
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
    <div className="min-h-screen bg-stone-50 text-ink">
      <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded bg-coast text-white">
              <Compass size={22} aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-semibold">TripFlow</span>
              <span className="block text-sm text-stone-500">Plan, start, and follow each trip</span>
            </span>
          </NavLink>

          <nav className="flex flex-wrap items-center gap-2">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition",
                    isActive ? "bg-ink text-white" : "text-stone-600 hover:bg-stone-100 hover:text-ink",
                  ].join(" ")
                }
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <button
                className="inline-flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-ink"
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
