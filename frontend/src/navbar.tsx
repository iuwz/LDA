import React, { useState, useRef, useEffect } from 'react';
import { FaBalanceScale, FaGlobe, FaHome, FaChevronDown, FaBars, FaTimes } from 'react-icons/fa';
import { Button } from "./button";


const Navbar: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
    // Close dropdown when closing mobile menu
    if (isMobileDropdownOpen) setMobileDropdownOpen(false);
  };

  const toggleMobileDropdown = () => {
    setIsMobileDropdownOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { text: "Advanced Document Analysis", href: "#" },
    { text: "AI-Powered Legal Chatbot", href: "#" },
    { text: "AI Compliance Checker", href: "#" },
    { text: "Risk and Rephrasing Tools", href: "#" },
  ];

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

          {/* Services Dropdown - desktop */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="text-[#2C2C4A] hover:text-[#C17829] transition-colors inline-flex items-center space-x-1"
            >
              <span>Services</span>
              <FaChevronDown className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <div className={`absolute left-0 mt-2 w-56 bg-white shadow-lg rounded-xl border border-gray-200 overflow-hidden transition-all duration-300 ease-in-out transform ${
              isDropdownOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
            }`}>
              <ul className="py-2">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <a href={item.href} className="block px-6 py-3 text-[#2C2C4A] hover:bg-[#F6E8DC] hover:text-[#C17829] transition-all">
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <a href="#" className="text-[#2C2C4A] hover:text-[#C17829] transition-colors">
            About Us
          </a>
          <a href="#" className="text-[#2C2C4A] hover:text-[#C17829] transition-colors">
            Contact
          </a>
        </div>

        {/* Right section: buttons + language - desktop */}
        <div className="hidden md:flex items-center space-x-4">
          <button className="border border-[#C17829] px-4 py-1 rounded text-[#C17829] hover:bg-[#C17829] hover:text-white transition-colors">
            Login
          </button>
          <button className="bg-[#C17829] text-white px-4 py-1 rounded hover:bg-[#ad6823] transition-colors">
            Sign Up
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

            {/* Services Dropdown - mobile */}
            <div>
              <button
                onClick={toggleMobileDropdown}
                className="flex items-center justify-between w-full text-[#2C2C4A] hover:text-[#C17829] transition-colors"
              >
                <span>Services</span>
                <FaChevronDown className={`transition-transform duration-300 ${isMobileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`mt-2 space-y-2 transition-all duration-300 ${isMobileDropdownOpen ? 'block' : 'hidden'}`}>
                {menuItems.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    className="block pl-4 py-2 text-[#2C2C4A] hover:text-[#C17829] transition-colors"
                  >
                    {item.text}
                  </a>
                ))}
              </div>
            </div>

            <a href="#" className="block text-[#2C2C4A] hover:text-[#C17829] transition-colors">
              About Us
            </a>
            <a href="#" className="block text-[#2C2C4A] hover:text-[#C17829] transition-colors">
              Contact
            </a>
          </div>

          <div className="mt-auto px-4 py-6 border-t space-y-4">
            <button className="w-full border border-[#C17829] px-4 py-2 rounded text-[#C17829] hover:bg-[#C17829] hover:text-white transition-colors">
              Login
            </button>
            <button className="w-full bg-[#C17829] text-white px-4 py-2 rounded hover:bg-[#ad6823] transition-colors">
              Sign Up
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