import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useI18n } from "../i18n";

export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useI18n();

  if (isLoading) {
    return <div className="rounded border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">{t("common.loading")}</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
