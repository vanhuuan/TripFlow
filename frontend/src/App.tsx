import { Outlet } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { AppLayout } from "./layouts/AppLayout";
import { SeoManager } from "./seo/SeoManager";

export default function App() {
  return (
    <AuthProvider>
      <AppLayout>
        <SeoManager />
        <Outlet />
      </AppLayout>
    </AuthProvider>
  );
}
