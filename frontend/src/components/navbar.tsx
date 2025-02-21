import React, { useState } from "react";
import { FaBalanceScale, FaGlobe, FaHome, FaBars, FaTimes } from "react-icons/fa";
import { LogOut } from "lucide-react";

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  return (
    <div className="relative">
      <nav className="flex items-center justify-between bg-[#F5F5F5] px-4 sm:px-6 py-3 shadow-md">
        {/* Left section: brand/logo */}
        <div>
          <a href="/" className="flex items-center space-x-2">
            <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
            <span className="text-xl font-bold text-[#C17829]">LDA</span>
          </a>
        </div>

        {/* Center: nav links - desktop */}
        <div className="hidden md:flex space-x-8 items-center">
          <a href="/" className="flex items-center space-x-1 text-[#2C2C4A] hover:text-[#C17829] transition-colors">
            <FaHome />
            <span>Home</span>
          </a>

          <a href="/services" className="text-[#2C2C4A] hover:text-[#C17829] transition-colors">
            Services
          </a>

          <a href="#" className="text-[#2C2C4A] hover:text-[#C17829] transition-colors">
            Chatbot
          </a>

          <a href="#" className="text-[#2C2C4A] hover:text-[#C17829] transition-colors">
            About Us
          </a>
        </div>

        {/* Right section: buttons + language - desktop */}
        <div className="hidden md:flex items-center space-x-4">
          <button className="bg-[#C17829] text-white px-4 py-1 rounded hover:bg-[#ad6823] transition-colors">
            Register
          </button>
          <button className="bg-[#D9534F] text-white px-4 py-1 rounded flex items-center gap-2 hover:bg-[#C9302C] transition-colors">
            Logout
            <LogOut size={18} />
          </button>
          <FaGlobe className="text-[#2C2C4A] text-xl cursor-pointer hover:text-[#C17829]" />
        </div>

        {/* Mobile menu button */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden text-[#2C2C4A] hover:text-[#C17829] transition-colors"
        >
          {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div className={`md:hidden fixed inset-0 bg-white z-50 transition-transform duration-300 ease-in-out transform ${
        isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"
      }`}>
        <div className="flex flex-col h-full overflow-y-auto">
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

          <div className="px-4 py-6 space-y-6">
            <a href="/" className="flex items-center space-x-2 text-[#2C2C4A] hover:text-[#C17829] transition-colors">
              <FaHome />
              <span>Home</span>
            </a>

            <a href="/services" className="block text-[#2C2C4A] hover:text-[#C17829] transition-colors">
              Services
            </a>

            <a href="#" className="block text-[#2C2C4A] hover:text-[#C17829] transition-colors">
              Chatbot
            </a>

            <a href="#" className="block text-[#2C2C4A] hover:text-[#C17829] transition-colors">
              About Us
            </a>
          </div>

          <div className="mt-auto px-4 py-6 border-t space-y-4">
            <button className="w-full bg-[#C17829] text-white px-4 py-2 rounded hover:bg-[#ad6823] transition-colors">
              Register
            </button>
            <div className="flex items-center justify-center">
              <FaGlobe className="text-[#2C2C4A] text-xl cursor-pointer hover:text-[#C17829]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
