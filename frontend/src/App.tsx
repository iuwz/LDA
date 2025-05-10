// src/App.tsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

/* ── ENV ─────────────────────────────── */
const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

/* ── Public pages ────────────────────── */
import Home from "./views/pages/Home/home";
import About from "./views/pages/About/about";
import Contact from "./views/pages/Contact/contact";
import Auth from "./views/pages/Auth/auth";
import ForgotPassword from "./views/pages/Auth/ForgotPassword";
import ResetPassword from "./views/pages/Auth/ResetPassword";

/* ── Dashboard pages ─────────────────── */
import DashboardHome from "./views/pages/Dashboard/DashboardHome";
import AllUploads from "./views/pages/Dashboard/AllUploads";
import RephrasingTool from "./views/pages/Dashboard/RephrasingTool";
import RiskAssessmentTool from "./views/pages/Dashboard/RiskAssessmentTool";
import ComplianceChecker from "./views/pages/Dashboard/ComplianceChecker";
import TranslationTool from "./views/pages/Dashboard/TranslationTool";
import DashboardChatbot from "./views/pages/Dashboard/DashboardChatbot";
import EditProfile from "./views/pages/Dashboard/EditProfile";


/* ── Admin page ──────────────────────── */
import AdminPage from "./views/pages/Admin/AdminPage";

/* ── Layout & common ────────────────── */
import Navbar from "./views/components/layout/navbar";
import Footer from "./views/components/layout/footer";
import DashboardLayout from "./views/components/layout/DashboardLayout";
import LoadingScreen from "./views/components/common/LoadingScreen";

/* ── RoleChecker (optional) ─────────── */
// If you still want an automatic redirect based on role,
// mount it at "/redirect" instead of "/".
const RoleChecker = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) {
          navigate("/auth");
          return;
        }
        const { role } = await res.json();
        navigate(role === "admin" ? "/admin" : "/dashboard");
      } catch {
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) return <LoadingScreen />;
  return null;
};

/* ── PrivateRoute HOC ────────────────── */
function PrivateRoute({ children }: { children: JSX.Element }) {
  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");
  const location = useLocation();

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? setStatus("ok") : Promise.reject()))
      .catch(() => setStatus("fail"));
  }, []);

  if (status === "loading") return <LoadingScreen />;
  if (status === "fail")
    return <Navigate to="/auth" replace state={{ from: location }} />;
  return children;
}

/* ── AdminRoute HOC ─────────────────── */
function AdminRoute() {
  const [status, setStatus] = useState<"loading" | "ok" | "fail" | "forbidden">(
    "loading"
  );
  const location = useLocation();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });
        if (!r.ok) throw new Error();
        const { role } = await r.json();
        setStatus(role === "admin" ? "ok" : "forbidden");
      } catch {
        setStatus("fail");
      }
    })();
  }, []);

  if (status === "loading") return <LoadingScreen />;
  if (status === "fail")
    return <Navigate to="/auth" replace state={{ from: location }} />;
  if (status === "forbidden") return <Navigate to="/dashboard" replace />;
  return <AdminPage />;
}

/* ── App ─────────────────────────────── */
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Home page */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Home />
              <Footer />

            </>
          }
        />

        {/* Optional: role‐based redirect */}
        <Route path="/redirect" element={<RoleChecker />} />

        {/* Public pages */}
        <Route
          path="/about"
          element={
            <>
              <Navbar />
              <About />
              <Footer />

            </>
          }
        />
        <Route
          path="/contact"
          element={
            <>
              <Navbar />
              <Contact />
              <Footer />

            </>
          }
        />
        <Route
          path="/auth"
          element={
            <>
              <Navbar />
              <Auth />
              <Footer />
            </>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <>
              <Navbar />
              <ForgotPassword />

            </>
          }
        />
        <Route
          path="/reset-password"
          element={
            <>
              <Navbar />
              <ResetPassword />

            </>
          }
        />
        {/* Dashboard (protected) */}
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="uploads" element={<AllUploads />} />
          <Route path="profile" element={<EditProfile />} />
          <Route path="rephrasing" element={<RephrasingTool />} />
          <Route path="risk-assessment" element={<RiskAssessmentTool />} />
          <Route path="compliance" element={<ComplianceChecker />} />
          <Route path="translation" element={<TranslationTool />} />
          <Route path="chatbot" element={<DashboardChatbot />} />
        </Route>

        {/* Admin page (protected + admin role) */}
        <Route path="/admin" element={<AdminRoute />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
