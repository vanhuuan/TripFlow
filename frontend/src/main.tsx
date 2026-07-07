import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { PublicOnlyRoute } from "./auth/PublicOnlyRoute";
import { I18nProvider } from "./i18n";
import { DashboardPage } from "./pages/DashboardPage";
import { EditTripPage } from "./pages/EditTripPage";
import { EditTripStepPage } from "./pages/EditTripStepPage";
import { FocusModePage } from "./pages/FocusModePage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { NewTripPage } from "./pages/NewTripPage";
import { NewTripStepPage } from "./pages/NewTripStepPage";
import { PublicTripPage } from "./pages/PublicTripPage";
import { SignupPage } from "./pages/SignupPage";
import { TripDetailPage } from "./pages/TripDetailPage";
import { TripStepsEditPage } from "./pages/TripStepsEditPage";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: "share/:token", element: <PublicTripPage /> },
      {
        element: <PublicOnlyRoute />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "signup", element: <SignupPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "dashboard", element: <DashboardPage /> },
          { path: "trips/new", element: <NewTripPage /> },
          { path: "trips/:tripId", element: <TripDetailPage /> },
          { path: "trips/:tripId/edit", element: <EditTripPage /> },
          { path: "trips/:tripId/steps/edit", element: <TripStepsEditPage /> },
          { path: "trips/:tripId/steps/new", element: <NewTripStepPage /> },
          { path: "trips/:tripId/steps/:stepId/edit", element: <EditTripStepPage /> },
          { path: "trips/:tripId/focus", element: <FocusModePage /> },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <RouterProvider router={router} />
    </I18nProvider>
  </StrictMode>,
);
