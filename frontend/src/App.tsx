import React, { useEffect, useState, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
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

/* ── Layout & common ────────────────── */
import Navbar from "./views/components/layout/navbar";
import Footer from "./views/components/layout/footer";
import DashboardLayout from "./views/components/layout/DashboardLayout";
import ChatbotWidget from "./views/components/common/ChatbotWidget";
import LoadingScreen from "./views/components/common/LoadingScreen";

/* ── PrivateRoute HOC ────────────────── */
function PrivateRoute({ children }: { children: JSX.Element }) {
  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");
  const location = useLocation();
  const startRef = useRef(Date.now());
  const MIN_SPINNER = 700;

  useEffect(() => {
    const finish = (next: "ok" | "fail") => {
      const elapsed = Date.now() - startRef.current;
      setTimeout(() => setStatus(next), Math.max(0, MIN_SPINNER - elapsed));
    };

    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? finish("ok") : Promise.reject()))
      .catch(() => finish("fail"));
  }, []);

  if (status === "loading") return <LoadingScreen />;
  if (status === "fail")
    return <Navigate to="/auth" replace state={{ from: location }} />;
  return children;
}

/* ── App ─────────────────────────────── */
export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Home />
              <Footer />
              <ChatbotWidget />
            </>
          }
        />
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
