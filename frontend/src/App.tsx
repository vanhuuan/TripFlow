import { Outlet } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { AppLayout } from "./layouts/AppLayout";

export default function App() {
  return (
    <AuthProvider>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AuthProvider>
  );
}
