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
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

/* ── Public pages ────────────────────── */
import Home from "./views/pages/Home/home";
import About from "./views/pages/About/about";
import Contact from "./views/pages/Contact/contact";
import Auth from "./views/pages/Auth/auth";

/* ── Dashboard pages ─────────────────── */
import DashboardHome from "./views/pages/Dashboard/DashboardHome";
import AllUploads from "./views/pages/Dashboard/AllUploads";
import RephrasingTool from "./views/pages/Dashboard/RephrasingTool";
import RiskAssessmentTool from "./views/pages/Dashboard/RiskAssessmentTool";
import ComplianceChecker from "./views/pages/Dashboard/ComplianceChecker";
import TranslationTool from "./views/pages/Dashboard/TranslationTool";
import DashboardChatbot from "./views/pages/Dashboard/DashboardChatbot";
import EditProfile from "./views/pages/Dashboard/EditProfile";
import Settings from "./views/pages/Dashboard/Settings";

/* ── Admin page ──────────────────────── */
import AdminPage from "./views/pages/Admin/AdminPage";

/* ── Layout & common ────────────────── */
import Navbar from "./views/components/layout/navbar";
import Footer from "./views/components/layout/footer";
import DashboardLayout from "./views/components/layout/DashboardLayout";
import ChatbotWidget from "./views/components/common/ChatbotWidget";
import LoadingScreen from "./views/components/common/LoadingScreen";

/* ── RoleChecker ────────────────────── */
// Component to check user role and redirect accordingly
const RoleChecker = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          credentials: "include",
        });

        if (!res.ok) {
          navigate("/auth");
          return;
        }

        const userData = await res.json();

        // If user is admin, redirect to admin page
        if (userData.role === "admin") {
          navigate("/admin");
        } else {
          // Otherwise, redirect to user dashboard
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error checking role:", error);
        navigate("/auth");
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [navigate]);

  if (loading) {
    return <LoadingScreen />;
  }

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

/* ── AdminRoute HOC ────────────────── */
function AdminRoute() {
  const [status, setStatus] = useState<"loading" | "ok" | "fail" | "forbidden">(
    "loading"
  );
  const location = useLocation();

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then(async (r) => {
        if (!r.ok) return Promise.reject();
        const data = await r.json();
        if (data.role !== "admin") {
          setStatus("forbidden");
        } else {
          setStatus("ok");
        }
      })
      .catch(() => setStatus("fail"));
  }, []);

  if (status === "loading") return <LoadingScreen />;
  if (status === "fail")
    return <Navigate to="/auth" replace state={{ from: location }} />;
  if (status === "forbidden") return <Navigate to="/dashboard" replace />;

  // If we get here, the user is an admin
  return <AdminPage />;
}

/* ── App ─────────────────────────────── */
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Home route with role checker */}
        <Route path="/" element={<RoleChecker />} />

        {/* Public */}
        <Route
          path="/about"
          element={
            <>
              <Navbar />
              <About />
              <Footer />
              <ChatbotWidget />
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
              <ChatbotWidget />
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
              <ChatbotWidget />
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
          <Route path="settings" element={<Settings />} />
          <Route path="rephrasing" element={<RephrasingTool />} />
          <Route path="risk-assessment" element={<RiskAssessmentTool />} />
          <Route path="compliance" element={<ComplianceChecker />} />
          <Route path="translation" element={<TranslationTool />} />
          <Route path="chatbot" element={<DashboardChatbot />} />
        </Route>

        {/* Admin page (protected + admin role check) */}
        <Route path="/admin" element={<AdminRoute />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
