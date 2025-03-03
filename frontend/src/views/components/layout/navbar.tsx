import React, { useState, useRef, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBalanceScale,
  FaGlobe,
  FaHome,
  FaBars,
  FaTimes,
  FaSearch,
  FaMoon,
  FaSun,
  FaChevronDown,
} from "react-icons/fa";
import { LogIn } from "lucide-react"; // For a 'login' icon
import { Button } from "../../components/common/button"; // Import the Button component

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("EN");
  const location = useLocation();
  const navigate = useNavigate();
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  // Close language dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLanguageDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
  };

  const toggleTheme = () => {
    setIsDarkTheme((prev) => !prev);
    // Here you would implement the actual theme switching logic
    // document.documentElement.classList.toggle('dark');
  };

  const toggleLanguageDropdown = () => {
    setIsLanguageDropdownOpen((prev) => !prev);
  };

  // Change language function
  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    setIsLanguageDropdownOpen(false);
    // Here you would implement the actual language change
    // i18n.changeLanguage(lang) or similar
  };

  // Navigate to Login form using query parameter
  const handleLoginClick = () => {
    // Navigate to auth page with form=login in the URL to ensure login form is shown
    navigate("/auth?form=login");
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  // Both Login and Register buttons should show the login form
  const handleRegisterClick = () => {
    // Also navigate to auth page with form=login to ensure login form is shown
    navigate("/auth?form=login");
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const scrollToServices = (e: React.MouseEvent) => {
    e.preventDefault();

    // If we're not on the home page, navigate to home page first
    if (location.pathname !== "/") {
      window.location.href = "/#services";
      return;
    }

    // If we're already on the home page, just scroll to services
    const servicesSection = document.getElementById("services");
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth" });
    }

    // Close mobile menu if open
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="relative font-sans">
      {/* Desktop Nav */}
      <nav className="sticky top-0 z-50 flex items-center bg-[#F5F5F5] px-4 sm:px-6 py-3 shadow-md">
        {/* Brand / Logo */}
        <div className="flex-1 flex justify-start">
          <NavLink to="/" className="flex items-center space-x-2">
            <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
            <span className="text-xl font-bold text-[#C17829] font-serif">
              LDA
            </span>
          </NavLink>
        </div>

        {/* Desktop Links - Truly Centered */}
        <div className="hidden md:flex flex-1 justify-center space-x-8 items-center">
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
            to="/about"
            className={({ isActive }) =>
              "transition-colors hover:text-[#C17829] " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            About Us
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              "transition-colors hover:text-[#C17829] " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            Contact Us
          </NavLink>
        </div>

        {/* Search and Right Section */}
        <div className="hidden md:flex flex-1 justify-end items-center space-x-5">
          {/* Modern Search Bar */}
          <div
            className={`relative transition-all duration-300 ${
              isSearchFocused ? "w-56" : "w-40"
            }`}
          >
            <div
              className={`relative flex items-center overflow-hidden rounded-full transition-all duration-300 bg-white shadow-sm ${
                isSearchFocused
                  ? "shadow-md ring-2 ring-[#C17829]/30"
                  : "hover:shadow"
              }`}
            >
              <input
                type="text"
                placeholder="Search..."
                className="hidden md:block w-full border-none outline-none rounded-full pl-10 pr-4 py-1.5 text-gray-700 text-sm"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              <FaSearch
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                  isSearchFocused ? "text-[#C17829]" : "text-gray-400"
                }`}
              />
            </div>
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={languageDropdownRef}>
            <div
              className="flex items-center cursor-pointer group px-2 py-1 rounded-md hover:bg-gray-200 transition-colors"
              onClick={toggleLanguageDropdown}
            >
              <FaGlobe className="text-[#2C2C4A] text-lg group-hover:text-[#C17829] transition-colors" />
              <span className="ml-1 text-sm text-[#2C2C4A]">
                {currentLanguage}
              </span>
              <FaChevronDown
                className={`ml-1 text-xs text-[#2C2C4A] transition-transform duration-200 ${
                  isLanguageDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {/* Language Dropdown Menu */}
            {isLanguageDropdownOpen && (
              <div className="absolute right-0 mt-1 bg-white rounded-md shadow-lg py-1 w-32 z-50 border border-gray-100">
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    currentLanguage === "EN"
                      ? "bg-gray-100 text-[#C17829] font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => changeLanguage("EN")}
                >
                  English
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    currentLanguage === "AR"
                      ? "bg-gray-100 text-[#C17829] font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => changeLanguage("AR")}
                >
                  العربية
                </button>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-600 hover:text-[#C17829] hover:bg-gray-200 transition-colors"
            aria-label="Toggle dark theme"
          >
            {isDarkTheme ? (
              <FaSun className="text-[#C17829]" />
            ) : (
              <FaMoon className="text-[#2C2C4A]" />
            )}
          </button>

          {/* Login button */}
          <Button
            onClick={handleLoginClick}
            className="bg-transparent border border-[#C17829] text-[#C17829] text-sm font-semibold rounded-full px-3 py-1.5 shadow-md hover:bg-[#C17829]/10 hover:shadow-lg transition-all active:bg-[#C17829]/20 hover:scale-[1.01] flex items-center gap-1"
          >
            Login
            <LogIn size={16} />
          </Button>

          {/* Register button */}
          <Button
            onClick={handleRegisterClick}
            className="bg-[#C17829] text-white text-sm font-semibold rounded-full px-3 py-1.5 shadow-md hover:bg-[#ad6823] hover:shadow-lg transition-all active:bg-[#A66F24] hover:scale-[1.01]"
          >
            Register
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center ml-auto gap-4">
          {/* Search Icon for Mobile */}
          <button
            className="text-[#2C2C4A] hover:text-[#C17829] transition-colors"
            aria-label="Search"
          >
            <FaSearch />
          </button>

          {/* Language Toggle for Mobile */}
          <div
            className="flex items-center cursor-pointer"
            onClick={() =>
              changeLanguage(currentLanguage === "EN" ? "AR" : "EN")
            }
          >
            <FaGlobe className="text-[#2C2C4A] hover:text-[#C17829] transition-colors" />
          </div>

          {/* Theme Toggle for Mobile */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center text-gray-600 hover:text-[#C17829]"
            aria-label="Toggle dark theme"
          >
            {isDarkTheme ? (
              <FaSun className="text-[#C17829]" />
            ) : (
              <FaMoon className="text-[#2C2C4A]" />
            )}
          </button>

          {/* Menu Toggle */}
          <button
            onClick={toggleMobileMenu}
            className="text-[#2C2C4A] transition-colors hover:text-[#C17829]"
          >
            {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
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
          {/* Mobile Search */}
          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Search..."
              className="w-full border border-gray-200 outline-none rounded-full pl-10 pr-4 py-2 text-gray-700 shadow-sm focus:border-[#C17829] focus:ring-2 focus:ring-[#C17829]/30 transition-all"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>

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
            to="/about"
            onClick={toggleMobileMenu}
            className={({ isActive }) =>
              "block transition-colors hover:text-[#C17829] " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            About Us
          </NavLink>
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

          {/* Language options in mobile menu */}
          <div className="space-y-2">
            <div className="text-[#2C2C4A] font-medium">Language</div>
            <div className="flex space-x-3">
              <button
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  currentLanguage === "EN"
                    ? "bg-[#C17829] text-white"
                    : "bg-gray-100 text-[#2C2C4A] hover:bg-gray-200"
                }`}
                onClick={() => changeLanguage("EN")}
              >
                English
              </button>
              <button
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  currentLanguage === "AR"
                    ? "bg-[#C17829] text-white"
                    : "bg-gray-100 text-[#2C2C4A] hover:bg-gray-200"
                }`}
                onClick={() => changeLanguage("AR")}
              >
                العربية
              </button>
            </div>
          </div>
        </div>

        {/* Footer area in mobile panel */}
        <div className="mt-auto px-4 py-6 border-t space-y-4">
          <Button
            onClick={handleLoginClick}
            className="w-full bg-transparent border border-[#C17829] text-[#C17829] text-sm rounded-full font-semibold py-1.5 shadow-md hover:bg-[#C17829]/10 hover:shadow-lg transition-all active:bg-[#C17829]/20 hover:scale-[1.01] flex items-center justify-center gap-1"
          >
            Login
            <LogIn size={16} />
          </Button>
          <Button
            onClick={handleRegisterClick}
            className="w-full bg-[#C17829] text-white text-sm rounded-full font-semibold py-1.5 shadow-md hover:bg-[#ad6823] hover:shadow-lg transition-all active:bg-[#A66F24] hover:scale-[1.01]"
          >
            Register
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
