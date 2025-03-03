// src/views/components/layout/navbar.tsx

import React, { useState } from "react";
import {
  FaBalanceScale,
  FaGlobe,
  FaHome,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { LogIn } from "lucide-react"; // For a 'login' icon instead of 'logout'

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <div className="relative">
      {/* Desktop Nav */}
      <nav className="flex items-center justify-between bg-[#F5F5F5] px-4 sm:px-6 py-3 shadow-md">
        {/* Brand / Logo */}
        <div>
          <a href="/" className="flex items-center space-x-2">
            <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
            <span className="text-xl font-bold text-[#C17829]">LDA</span>
          </a>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex space-x-8 items-center">
          <a
            href="/"
            className="flex items-center space-x-1 text-[#2C2C4A] hover:text-[#C17829] transition-colors"
          >
            <FaHome />
            <span>Home</span>
          </a>
          <a
            href="/services"
            className="text-[#2C2C4A] hover:text-[#C17829] transition-colors"
          >
            Services
          </a>
          <a
            href="/contact"
            className="text-[#2C2C4A] hover:text-[#C17829] transition-colors"
          >
            Contact Us
          </a>
          <a
            href="/about"
            className="text-[#2C2C4A] hover:text-[#C17829] transition-colors"
          >
            About Us
          </a>
        </div>

        {/* Desktop Right Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Register */}
          <button className="bg-[#C17829] text-white px-4 py-1 rounded hover:bg-[#ad6823] transition-colors">
            Register
          </button>
          {/* Login */}
          <button className="bg-[#C17829] text-white px-4 py-1 rounded flex items-center gap-2 hover:bg-[#ad6823] transition-colors">
            Login
            <LogIn size={18} />
          </button>
          <FaGlobe className="text-[#2C2C4A] text-xl cursor-pointer hover:text-[#C17829]" />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden text-[#2C2C4A] hover:text-[#C17829] transition-colors"
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
          fixed top-0 right-0 h-full w-3/4 max-w-sm bg-white z-50
          shadow-lg transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header inside mobile menu */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <a href="/" className="flex items-center space-x-2">
            <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
            <span className="text-xl font-bold text-[#C17829]">LDA</span>
          </a>
          <button
            onClick={toggleMobileMenu}
            className="text-[#2C2C4A] hover:text-[#C17829] transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Mobile Menu Links */}
        <div className="px-4 py-6 space-y-6">
          <a
            href="/"
            onClick={toggleMobileMenu}
            className="flex items-center space-x-2 text-[#2C2C4A] hover:text-[#C17829] transition-colors"
          >
            <FaHome />
            <span>Home</span>
          </a>
          <a
            href="/services"
            onClick={toggleMobileMenu}
            className="block text-[#2C2C4A] hover:text-[#C17829] transition-colors"
          >
            Services
          </a>
          <a
            href="/contact"
            onClick={toggleMobileMenu}
            className="block text-[#2C2C4A] hover:text-[#C17829] transition-colors"
          >
            Contact Us
          </a>
          <a
            href="/about"
            onClick={toggleMobileMenu}
            className="block text-[#2C2C4A] hover:text-[#C17829] transition-colors"
          >
            About Us
          </a>
        </div>

        {/* Footer area in mobile panel */}
        <div className="mt-auto px-4 py-6 border-t space-y-4">
          {/* Register */}
          <button className="w-full bg-[#C17829] text-white px-4 py-2 rounded hover:bg-[#ad6823] transition-colors">
            Register
          </button>
          {/* Login */}
          <button className="w-full bg-[#C17829] text-white px-4 py-2 rounded flex items-center justify-center gap-2 hover:bg-[#ad6823] transition-colors">
            Login
            <LogIn size={18} />
          </button>
          <div className="flex items-center justify-center">
            <FaGlobe className="text-[#2C2C4A] text-xl cursor-pointer hover:text-[#C17829]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
