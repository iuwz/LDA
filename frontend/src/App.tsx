// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Import pages
import Home from "./views/pages/Home/home";
import About from "./views/pages/About/about";
import Contact from "./views/pages/Contact/contact";
import AuthForm from "./views/pages/Auth/authForm";
import Dashboard from "./views/pages/Dashboard/dashBoard";

// Import layout components
import Navbar from "./views/components/layout/navbar";
import Footer from "./views/components/layout/footer";

function App() {
  return (
    <Router>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/auth" element={<AuthForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Add more routes if needed */}
      </Routes>

      <Footer />
    </Router>
  );
}

export default App;
