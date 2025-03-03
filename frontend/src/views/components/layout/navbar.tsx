// src/views/components/layout/navbar.tsx

import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaBalanceScale,
  FaGlobe,
  FaHome,
  FaBars,
  FaTimes,
  FaSearch,
} from "react-icons/fa";
import { LogIn } from "lucide-react"; // For a 'login' icon
import { Button } from "../../components/common/button"; // Import the Button component

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const scrollToServices = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If we're not on the home page, navigate to home page first
    if (location.pathname !== '/') {
      window.location.href = '/#services';
      return;
    }
    
    // If we're already on the home page, just scroll to services
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Close mobile menu if open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="relative font-sans">
      {/* Desktop Nav */}
      <nav className="sticky top-0 z-50 flex items-center justify-between bg-[#F5F5F5] px-4 sm:px-6 py-3 shadow-md">
        {/* Brand / Logo */}
        <div>
          <NavLink to="/" className="flex items-center space-x-2">
            <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
            <span className="text-xl font-bold text-[#C17829] font-serif">
              LDA
            </span>
          </NavLink>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-8 items-center">
          <NavLink
            to="/"
            className={({ isActive }) =>
              "flex items-center space-x-1 transition-colors hover:text-[#C17829] " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            <FaHome />
            <span>Home</span>
          </NavLink>
          <a
            href="#services"
            onClick={scrollToServices}
            className="transition-colors hover:text-[#C17829] text-[#2C2C4A]"
          >
            Services
          </a>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              "transition-colors hover:text-[#C17829] " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            Contact Us
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              "transition-colors hover:text-[#C17829] " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            About Us
          </NavLink>
          {/* Optional: Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="hidden md:block border border-gray-300 rounded-full pl-10 pr-4 py-1 focus:outline-none focus:border-[#C17829]"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        {/* Desktop Right Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Register as solid button */}
          <Button 
            variant="primary" 
            className="rounded"
          >
            Register
          </Button>
          {/* Login as outlined button */}
          <Button
            variant="secondary"
            className="rounded flex items-center gap-2"
          >
            Login
            <LogIn size={18} />
          </Button>
          {/* Language Selector */}
          <div className="flex items-center cursor-pointer">
            <FaGlobe className="text-[#2C2C4A] text-xl hover:text-[#C17829]" />
            <span className="ml-1 text-sm text-[#2C2C4A]">EN</span>
          </div>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden text-[#2C2C4A] transition-colors hover:text-[#C17829]"
        >
          {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </nav>

      {/* Overlay if open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={toggleMobileMenu}
          aria-label="Close menu backdrop"
        />
      )}

      {/* Mobile side panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-3/4 max-w-sm bg-white z-50 shadow-lg transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header inside mobile menu */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <NavLink
            to="/"
            className="flex items-center space-x-2"
            onClick={toggleMobileMenu}
          >
            <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
            <span className="text-xl font-bold text-[#C17829] font-serif">
              LDA
            </span>
          </NavLink>
          <button
            onClick={toggleMobileMenu}
            className="text-[#2C2C4A] transition-colors hover:text-[#C17829]"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Mobile Menu Links */}
        <div className="px-4 py-6 space-y-6">
          <NavLink
            to="/"
            onClick={toggleMobileMenu}
            className={({ isActive }) =>
              "flex items-center space-x-2 transition-colors hover:text-[#C17829] " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            <FaHome />
            <span>Home</span>
          </NavLink>
          <a
            href="#services"
            onClick={(e) => {
              scrollToServices(e);
              toggleMobileMenu();
            }}
            className="block transition-colors hover:text-[#C17829] text-[#2C2C4A]"
          >
            Services
          </a>
          <NavLink
            to="/contact"
            onClick={toggleMobileMenu}
            className={({ isActive }) =>
              "block transition-colors hover:text-[#C17829] " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            Contact Us
          </NavLink>
          <NavLink
            to="/about"
            onClick={toggleMobileMenu}
            className={({ isActive }) =>
              "block transition-colors hover:text-[#C17829] " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            About Us
          </NavLink>
        </div>

        {/* Footer area in mobile panel */}
        <div className="mt-auto px-4 py-6 border-t space-y-4">
          <Button
            className="w-full bg-[#C17829] border-[#C17829] hover:bg-[#ad6823] px-4 py-2"
          >
            Register
          </Button>
          <Button
            
            className="w-full bg-[#C17829] border-[#C17829] hover:bg-[#ad6823] px-4 py-2 flex items-center justify-center gap-2"
          >
            Login
            <LogIn size={18} />
          </Button>
          <div className="flex items-center justify-center">
            <FaGlobe className="text-[#2C2C4A] text-xl cursor-pointer hover:text-[#C17829]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;