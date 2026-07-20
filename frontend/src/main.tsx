import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "@fontsource/be-vietnam-pro/800.css";
import App from "./App";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { PublicOnlyRoute } from "./auth/PublicOnlyRoute";
import { I18nProvider } from "./i18n";
import { DashboardPage } from "./pages/DashboardPage";
import { EditTripPage } from "./pages/EditTripPage";
import { EditTripStepPage } from "./pages/EditTripStepPage";
import { FocusModePage } from "./pages/FocusModePage";
import { LandingPage } from "./pages/LandingPage";
import { FeaturesPage } from "./pages/FeaturesPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { LoginPage } from "./pages/LoginPage";
import { NewTripPage } from "./pages/NewTripPage";
import { NewTripStepPage } from "./pages/NewTripStepPage";
import { PublicTripPage } from "./pages/PublicTripPage";
import { PublicTripBlogPage } from "./pages/PublicTripBlogPage";
import { SignupPage } from "./pages/SignupPage";
import { TripDetailPage } from "./pages/TripDetailPage";
import { TripStepsEditPage } from "./pages/TripStepsEditPage";
import { TripBlogPage } from "./pages/TripBlogPage";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/vi" replace /> },
      { path: "vi", element: <LandingPage /> },
      { path: "en", element: <LandingPage /> },
      { path: "vi/tinh-nang", element: <FeaturesPage /> },
      { path: "en/features", element: <FeaturesPage /> },
      { path: "vi/cach-hoat-dong", element: <HowItWorksPage /> },
      { path: "en/how-it-works", element: <HowItWorksPage /> },
      { path: "share/:token", element: <PublicTripPage /> },
      { path: "blogs/:token", element: <PublicTripBlogPage /> },
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
          { path: "trips/:tripId/blog", element: <TripBlogPage /> },
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
