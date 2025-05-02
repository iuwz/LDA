// src/App.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

// ── ENV – API base URL ────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Pages ────────────────────────────────────────────────────────────────────
import Home from "./views/pages/Home/home";
import About from "./views/pages/About/about";
import Contact from "./views/pages/Contact/contact";
import Auth from "./views/pages/Auth/auth";
import DashboardHome from "./views/pages/Dashboard/DashboardHome";
import RephrasingTool from "./views/pages/Dashboard/RephrasingTool";
import RiskAssessmentTool from "./views/pages/Dashboard/RiskAssessmentTool";
import ComplianceChecker from "./views/pages/Dashboard/ComplianceChecker";
import TranslationTool from "./views/pages/Dashboard/TranslationTool";
import DashboardChatbot from "./views/pages/Dashboard/DashboardChatbot";
import EditProfile from "./views/pages/Dashboard/EditProfile";
import Settings from "./views/pages/Dashboard/Settings";

// ── Layout & common components ───────────────────────────────────────────────
import Navbar from "./views/components/layout/navbar";
import Footer from "./views/components/layout/footer";
import DashboardLayout from "./views/components/layout/DashboardLayout";
import ChatbotWidget from "./views/components/common/ChatbotWidget";
import LoadingScreen from "./views/components/common/LoadingScreen";

/* ────────────────────────────── PrivateRoute ────────────────────────────────
   Checks authentication by calling /auth/me. Displays a branded loading screen
   for at least MIN_SPINNER ms to prevent flicker.                           */
function PrivateRoute({ children }: { children: JSX.Element }) {
  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");
  const location = useLocation();
  const startRef = useRef<number>(Date.now());
  const MIN_SPINNER = 700; // ms

  useEffect(() => {
    const finish = (next: "ok" | "fail") => {
      const elapsed = Date.now() - startRef.current;
      const delay = Math.max(0, MIN_SPINNER - elapsed);
      setTimeout(() => setStatus(next), delay);
    };

    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error();
        finish("ok");
      })
      .catch(() => finish("fail"));
  }, []);

  if (status === "loading") return <LoadingScreen />;

  if (status === "fail") {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}

/* ─────────────────────────────────── App ────────────────────────────────────*/
function App() {
  return (
    <Router>
      <Routes>
        {/* ── Public routes ─────────────────────────────────────────────────── */}
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

        {/* ── Protected dashboard routes ────────────────────────────────────── */}
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="profile" element={<EditProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="rephrasing" element={<RephrasingTool />} />
          <Route path="risk-assessment" element={<RiskAssessmentTool />} />
          <Route path="compliance" element={<ComplianceChecker />} />
          <Route path="translation" element={<TranslationTool />} />
          <Route path="chatbot" element={<DashboardChatbot />} />
        </Route>

        {/* ── Fallback ──────────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
