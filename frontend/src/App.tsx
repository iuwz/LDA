// src/App.tsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

// Base URL for your FastAPI backend (via Vite env var)
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Import pages
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

// Import layout components
import Navbar from "./views/components/layout/navbar";
import Footer from "./views/components/layout/footer";
import DashboardLayout from "./views/components/layout/DashboardLayout";
import ChatbotWidget from "./views/components/common/ChatbotWidget";

// ─── PrivateRoute ──────────────────────────────────────────────────────────
// Wraps your dashboard routes and redirects to /auth if not authenticated.
function PrivateRoute({ children }: { children: JSX.Element }) {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
      })
      .catch(() => {
        navigate("/auth", { replace: true });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes with Navbar, Footer, and ChatbotWidget */}
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

        {/* Protected Dashboard Routes */}
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

        {/* Redirect any unknown route to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
