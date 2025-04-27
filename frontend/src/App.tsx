// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

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
import ChatbotWidget from "./views/components/common/ChatbotWidget";
import EditProfile from "./views/pages/Dashboard/EditProfile";
import Settings from "./views/pages/Dashboard/Settings"; // ← new

// Import layout components
import Navbar from "./views/components/layout/navbar";
import Footer from "./views/components/layout/footer";
import DashboardLayout from "./views/components/layout/DashboardLayout";

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes with Navbar and Footer */}
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

        {/* Dashboard Routes - without Navbar and Footer */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="profile" element={<EditProfile />} />
          <Route path="settings" element={<Settings />} /> {/* ← new */}
          <Route path="rephrasing" element={<RephrasingTool />} />
          <Route path="risk-assessment" element={<RiskAssessmentTool />} />
          <Route path="compliance" element={<ComplianceChecker />} />
          <Route path="translation" element={<TranslationTool />} />
          <Route path="chatbot" element={<DashboardChatbot />} />
        </Route>

        {/* Redirect to home for any unmatched routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
