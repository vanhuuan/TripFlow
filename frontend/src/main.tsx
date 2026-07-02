import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import App from "./App";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { PublicOnlyRoute } from "./auth/PublicOnlyRoute";
import { DashboardPage } from "./pages/DashboardPage";
import { EditTripPage } from "./pages/EditTripPage";
import { FocusModePage } from "./pages/FocusModePage";
import { LoginPage } from "./pages/LoginPage";
import { NewTripPage } from "./pages/NewTripPage";
import { SignupPage } from "./pages/SignupPage";
import { TripDetailPage } from "./pages/TripDetailPage";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
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
          { path: "trips/:tripId/focus", element: <FocusModePage /> },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
