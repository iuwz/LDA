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
import { LogIn } from "lucide-react";
import { Button } from "../../components/common/button";

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("EN");
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const location = useLocation();
  const navigate = useNavigate();
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Handle window resize and update screen width state.
  // (For this version we're using lg (1024px) as the breakpoint for the full desktop view.)
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      if (window.innerWidth >= 1024 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
      if (window.innerWidth >= 1024 && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [isMobileMenuOpen, isSearchOpen]);

  // Close language dropdown and mobile search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(event.target as Node)
      ) {
        setIsLanguageDropdownOpen(false);
      }

      if (
        isSearchOpen &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);

  // Focus search input when opening
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev);
    if (isSearchOpen) setIsSearchOpen(false);
  };

  const toggleLanguageDropdown = () => {
    setIsLanguageDropdownOpen((prev) => !prev);
  };

  const toggleMobileSearch = () => {
    setIsSearchOpen((prev) => !prev);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  // Change language function
  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    setIsLanguageDropdownOpen(false);
    // Insert your language switch logic here (e.g., i18n.changeLanguage(lang))
  };

  // Navigate to Login form using a query parameter
  const handleLoginClick = () => {
    navigate("/auth?form=login");
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  // Both Login and Register should show the same form
  const handleRegisterClick = () => {
    navigate("/auth?form=login");
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const scrollToServices = (e: React.MouseEvent) => {
    e.preventDefault();

    if (location.pathname !== "/") {
      window.location.href = "/#services";
      return;
    }

    const servicesSection = document.getElementById("services");
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: "smooth" });
    }

    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  // Determine brand text size based on screen width
  const getBrandTextClass = () => {
    if (screenWidth < 350) return "text-sm font-bold text-[#C17829] font-serif";
    return "text-lg sm:text-xl font-bold text-[#C17829] font-serif";
  };

  // Determine icon size based on screen width
  const getIconSize = () => {
    return screenWidth < 350 ? 16 : 20;
  };

  return (
    <div className="relative font-sans">
      {/* Desktop Navigation: Visible on screens lg (1024px) and above */}
      <nav className="sticky top-0 z-50 flex items-center bg-[#F5F5F5] px-2 xs:px-3 sm:px-6 py-2 xs:py-3 shadow-md">
        {/* Brand / Logo */}
        <div className="flex-1 flex justify-start">
          <NavLink to="/" className="flex items-center space-x-1 xs:space-x-2">
            <FaBalanceScale className="text-lg xs:text-xl sm:text-2xl text-[#2C2C4A]" />
            <span className={getBrandTextClass()}>LDA</span>
          </NavLink>
        </div>

        {/* Desktop Links: Visible only on lg and above */}
        <div className="hidden lg:flex flex-1 justify-center space-x-2 lg:space-x-8 items-center">
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
            About
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              "transition-colors hover:text-[#C17829] " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            Contact
          </NavLink>
        </div>

        {/* Desktop Search and Right Section: Added ml-4 for extra space between Contact and the search bar */}
        <div className="hidden lg:flex flex-1 justify-end items-center space-x-2 lg:space-x-4 ml-4">
          {/* Modern Search Bar */}
          <div
            className={`relative transition-all duration-300 ${
              isSearchFocused ? "w-24 sm:w-36 lg:w-56" : "w-20 sm:w-32 lg:w-40"
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
                className="w-full border-none outline-none rounded-full pl-8 sm:pl-10 pr-2 sm:pr-4 py-1 sm:py-1.5 text-gray-700 text-xs sm:text-sm"
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              <FaSearch
                className={`absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-300 ${
                  isSearchFocused ? "text-[#C17829]" : "text-gray-400"
                } text-xs sm:text-sm`}
              />
            </div>
          </div>

          {/* Language Selector Dropdown */}
          <div className="relative" ref={languageDropdownRef}>
            <div
              className="flex items-center cursor-pointer group p-1 sm:p-1.5 rounded-md hover:bg-gray-200 transition-colors"
              onClick={toggleLanguageDropdown}
            >
              <FaGlobe className="text-[#2C2C4A] text-sm sm:text-base lg:text-lg group-hover:text-[#C17829] transition-colors" />
              <span className="ml-1 text-xs text-[#2C2C4A]">
                {currentLanguage}
              </span>
              <FaChevronDown
                className={`ml-1 text-xs text-[#2C2C4A] transition-transform duration-200 ${
                  isLanguageDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>

            {isLanguageDropdownOpen && (
              <div className="absolute right-0 mt-1 bg-white rounded-md shadow-lg py-1 w-28 sm:w-32 z-50 border border-gray-100">
                <button
                  className={`block w-full text-left px-4 py-2 text-xs sm:text-sm ${
                    currentLanguage === "EN"
                      ? "bg-gray-100 text-[#C17829] font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => changeLanguage("EN")}
                >
                  English
                </button>
                <button
                  className={`block w-full text-left px-4 py-2 text-xs sm:text-sm ${
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

          {/* Login Button */}
          <Button
            onClick={handleLoginClick}
            className="bg-transparent border border-[#C17829] text-[#C17829] text-xs lg:text-sm font-semibold rounded-full px-2 lg:px-3 py-1 lg:py-1.5 shadow-md hover:bg-[#C17829]/10 hover:shadow-lg transition-all active:bg-[#C17829]/20 hover:scale-[1.01] flex items-center gap-1"
          >
            <span>Login</span>
            <LogIn size={14} className="hidden sm:inline" />
          </Button>

          {/* Register Button */}
          <Button
            onClick={handleRegisterClick}
            className="bg-[#C17829] text-white text-xs lg:text-sm font-semibold rounded-full px-2 lg:px-3 py-1 lg:py-1.5 shadow-md hover:bg-[#ad6823] hover:shadow-lg transition-all active:bg-[#A66F24] hover:scale-[1.01]"
          >
            Register
          </Button>
        </div>

        {/* Mobile Controls: Visible on screens smaller than lg */}
        <div className="lg:hidden flex items-center ml-auto gap-1 xs:gap-2 sm:gap-3">
          {/* Mobile Search Toggle */}
          <button
            onClick={toggleMobileSearch}
            className="text-[#2C2C4A] hover:text-[#C17829] transition-colors p-1"
            aria-label="Search"
          >
            <FaSearch size={getIconSize() - 4} />
          </button>

          {/* Mobile Language Toggle */}
          <div
            className="p-1 flex items-center cursor-pointer"
            onClick={() =>
              changeLanguage(currentLanguage === "EN" ? "AR" : "EN")
            }
          >
            <FaGlobe
              className="text-[#2C2C4A] hover:text-[#C17829] transition-colors"
              size={getIconSize() - 4}
            />
          </div>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={toggleMobileMenu}
            className="text-[#2C2C4A] transition-colors hover:text-[#C17829] p-1"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <FaTimes size={getIconSize()} />
            ) : (
              <FaBars size={getIconSize()} />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Search Bar */}
      {isSearchOpen && (
        <div
          ref={mobileSearchRef}
          className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-md z-50 p-2 xs:p-3 animate-slideDown"
        >
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              className="w-full border border-gray-200 outline-none rounded-full pl-8 xs:pl-10 pr-8 xs:pr-10 py-1.5 xs:py-2 text-xs xs:text-sm text-gray-700 shadow-sm focus:border-[#C17829] focus:ring-2 focus:ring-[#C17829]/30 transition-all"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs xs:text-sm" />
            <button
              onClick={toggleMobileSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#C17829]"
            >
              <FaTimes size={screenWidth < 350 ? 14 : 16} />
            </button>
          </div>
        </div>
      )}

      {/* Overlay for Mobile Menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={toggleMobileMenu}
          aria-label="Close menu backdrop"
        />
      )}

      {/* Mobile Side Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-4/5 max-w-xs bg-white z-50 shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto
          ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header inside Mobile Menu */}
        <div className="flex justify-between items-center px-3 xs:px-4 py-2 xs:py-3 border-b">
          <NavLink
            to="/"
            className="flex items-center space-x-2"
            onClick={toggleMobileMenu}
          >
            <FaBalanceScale className="text-xl xs:text-2xl text-[#2C2C4A]" />
            <span className="text-lg xs:text-xl font-bold text-[#C17829] font-serif">
              LDA
            </span>
          </NavLink>
          <button
            onClick={toggleMobileMenu}
            className="text-[#2C2C4A] transition-colors hover:text-[#C17829]"
          >
            <FaTimes size={getIconSize()} />
          </button>
        </div>

        {/* Mobile Menu Links */}
        <div className="px-3 xs:px-4 py-4 xs:py-6 space-y-4 xs:space-y-6">
          {/* Mobile Search Input */}
          <div className="relative mb-2">
            <input
              type="text"
              placeholder="Search..."
              className="w-full border border-gray-200 outline-none rounded-full pl-8 xs:pl-10 pr-3 xs:pr-4 py-1.5 xs:py-2 text-xs xs:text-sm text-gray-700 shadow-sm focus:border-[#C17829] focus:ring-2 focus:ring-[#C17829]/30 transition-all"
            />
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs xs:text-sm" />
          </div>

          <NavLink
            to="/"
            onClick={toggleMobileMenu}
            className={({ isActive }) =>
              "flex items-center space-x-2 transition-colors hover:text-[#C17829] text-sm xs:text-base " +
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
            className="block transition-colors hover:text-[#C17829] text-[#2C2C4A] text-sm xs:text-base"
          >
            Services
          </a>
          <NavLink
            to="/about"
            onClick={toggleMobileMenu}
            className={({ isActive }) =>
              "block transition-colors hover:text-[#C17829] text-sm xs:text-base " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            onClick={toggleMobileMenu}
            className={({ isActive }) =>
              "block transition-colors hover:text-[#C17829] text-sm xs:text-base " +
              (isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]")
            }
          >
            Contact
          </NavLink>

          {/* Mobile Language Options */}
          <div className="space-y-2">
            <div className="text-[#2C2C4A] font-medium text-sm xs:text-base">
              Language
            </div>
            <div className="flex space-x-3">
              <button
                className={`px-2 xs:px-3 py-1 rounded-md text-xs xs:text-sm transition-colors ${
                  currentLanguage === "EN"
                    ? "bg-[#C17829] text-white"
                    : "bg-gray-100 text-[#2C2C4A] hover:bg-gray-200"
                }`}
                onClick={() => changeLanguage("EN")}
              >
                English
              </button>
              <button
                className={`px-2 xs:px-3 py-1 rounded-md text-xs xs:text-sm transition-colors ${
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

        {/* Mobile Menu Footer Buttons */}
        <div className="mt-auto px-3 xs:px-4 py-4 xs:py-6 border-t space-y-3 xs:space-y-4">
          <Button
            onClick={handleLoginClick}
            className="w-full bg-transparent border border-[#C17829] text-[#C17829] text-xs xs:text-sm rounded-full font-semibold py-1 xs:py-1.5 shadow-md hover:bg-[#C17829]/10 hover:shadow-lg transition-all active:bg-[#C17829]/20 hover:scale-[1.01] flex items-center justify-center gap-1"
          >
            Login
            <LogIn size={screenWidth < 350 ? 14 : 16} />
          </Button>
          <Button
            onClick={handleRegisterClick}
            className="w-full bg-[#C17829] text-white text-xs xs:text-sm rounded-full font-semibold py-1 xs:py-1.5 shadow-md hover:bg-[#ad6823] hover:shadow-lg transition-all active:bg-[#A66F24] hover:scale-[1.01]"
          >
            Register
          </Button>
        </div>
      </div>

      {/* Global Styles for Animations and Custom Breakpoints */}
      <style jsx global>{`
        @keyframes slideDown {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease forwards;
        }

        /* Custom extra small (xs) breakpoint styles */
        @media (min-width: 350px) {
          .xs\\:px-3 {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
          }
          .xs\\:px-4 {
            padding-left: 1rem;
            padding-right: 1rem;
          }
          .xs\\:py-2 {
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
          }
          .xs\\:py-3 {
            padding-top: 0.75rem;
            padding-bottom: 0.75rem;
          }
          .xs\\:py-6 {
            padding-top: 1.5rem;
            padding-bottom: 1.5rem;
          }
          .xs\\:space-x-2 {
            margin-left: 0.5rem;
          }
          .xs\\:space-y-6 > * + * {
            margin-top: 1.5rem;
          }
          .xs\\:gap-2 {
            gap: 0.5rem;
          }
          .xs\\:text-base {
            font-size: 1rem;
            line-height: 1.5rem;
          }
          .xs\\:text-lg {
            font-size: 1.125rem;
            line-height: 1.75rem;
          }
          .xs\\:text-xl {
            font-size: 1.25rem;
            line-height: 1.75rem;
          }
          .xs\\:text-sm {
            font-size: 0.875rem;
            line-height: 1.25rem;
          }
          .xs\\:pl-10 {
            padding-left: 2.5rem;
          }
          .xs\\:pr-10 {
            padding-right: 2.5rem;
          }
          .xs\\:pr-4 {
            padding-right: 1rem;
          }
          .xs\\:space-y-4 > * + * {
            margin-top: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Navbar;
