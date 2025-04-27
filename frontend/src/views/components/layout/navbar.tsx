// src/components/Navbar.tsx

import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaBalanceScale,
  FaGlobe,
  FaHome,
  FaBars,
  FaTimes,
  FaSearch,
  FaChevronDown,
  FaLogIn,
} from "react-icons/fa";
import { Button } from "../../components/common/button";

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState("EN");
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [file, setFile] = useState<File | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Handle resize
  useEffect(() => {
    const onResize = () => {
      setScreenWidth(window.innerWidth);
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        languageDropdownRef.current &&
        !languageDropdownRef.current.contains(e.target as Node)
      ) {
        setIsLanguageDropdownOpen(false);
      }
      if (
        isSearchOpen &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isSearchOpen]);

  // Focus mobile search input
  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  // Prevent body scroll on mobile menu
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    if (isSearchOpen) setIsSearchOpen(false);
  };
  const toggleMobileSearch = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };
  const toggleLanguageDropdown = () => {
    setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
  };

  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    setIsLanguageDropdownOpen(false);
    // e.g. i18n.changeLanguage(lang)
  };

  const handleLoginClick = () => {
    navigate("/auth?form=login");
    setIsMobileMenuOpen(false);
  };
  const handleRegisterClick = () => {
    navigate("/auth?form=login");
    setIsMobileMenuOpen(false);
  };

  const scrollToServices = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname !== "/") {
      window.location.href = "/#services";
      return;
    }
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
    setIsMobileMenuOpen(false);
  };

  const getBrandTextClass = () =>
    screenWidth < 350
      ? "text-sm font-bold text-[#C17829] font-serif"
      : "text-lg sm:text-xl font-bold text-[#C17829] font-serif";

  const getIconSize = () => (screenWidth < 350 ? 16 : 20);

  return (
    <div className="relative font-sans">
      {/* Desktop Nav */}
      <nav className="sticky top-0 z-50 flex items-center bg-[#F5F5F5] px-3 sm:px-6 py-2 shadow-md">
        {/* Logo */}
        <div className="flex-1 flex">
          <NavLink to="/" className="flex items-center space-x-2">
            <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
            <span className={getBrandTextClass()}>LDA</span>
          </NavLink>
        </div>

        {/* Links (lg+) */}
        <div className="hidden lg:flex flex-1 justify-center space-x-8 items-center">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center space-x-1 hover:text-[#C17829] ${
                isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]"
              }`
            }
          >
            <FaHome />
            <span>Home</span>
          </NavLink>
          <a
            href="#services"
            onClick={scrollToServices}
            className="hover:text-[#C17829] text-[#2C2C4A]"
          >
            Services
          </a>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `hover:text-[#C17829] ${
                isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]"
              }`
            }
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `hover:text-[#C17829] ${
                isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]"
              }`
            }
          >
            Contact
          </NavLink>
        </div>

        {/* Right (lg+) */}
        <div className="hidden lg:flex flex-1 justify-end items-center space-x-4 ml-4">
          {/* Search */}
          <div
            className={`relative transition-all duration-300 ${
              isSearchOpen ? "w-56" : "w-40"
            }`}
          >
            <div
              className={`flex items-center rounded-full bg-white shadow-sm transition-all ${
                isSearchOpen ? "ring-2 ring-[#C17829]/30" : "hover:shadow"
              }`}
            >
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-full pl-10 pr-4 py-1 text-sm text-gray-700 outline-none"
                onFocus={() => setIsSearchOpen(true)}
                onBlur={() => setIsSearchOpen(false)}
              />
              <FaSearch
                className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isSearchOpen ? "text-[#C17829]" : "text-gray-400"
                }`}
              />
            </div>
          </div>

          {/* Language */}
          <div className="relative" ref={languageDropdownRef}>
            <div
              className="flex items-center cursor-pointer p-1 hover:bg-gray-200 rounded-md"
              onClick={toggleLanguageDropdown}
            >
              <FaGlobe className="text-[#2C2C4A]" />
              <span className="ml-1 text-xs">{currentLanguage}</span>
              <FaChevronDown
                className={`ml-1 text-xs transition-transform ${
                  isLanguageDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </div>
            {isLanguageDropdownOpen && (
              <div className="absolute right-0 mt-1 bg-white border rounded-md shadow-lg w-32">
                <button
                  className={`w-full px-4 py-2 text-left text-sm ${
                    currentLanguage === "EN"
                      ? "bg-gray-100 text-[#C17829] font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => changeLanguage("EN")}
                >
                  English
                </button>
                <button
                  className={`w-full px-4 py-2 text-left text-sm ${
                    currentLanguage === "AR"
                      ? "bg-gray-100 text-[#C17829] font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => changeLanguage("AR")}
                >
                  العربية
                </button>
              </div>
            )}
          </div>

          {/* Login / Register */}
          <Button
            onClick={handleLoginClick}
            className="flex items-center gap-1 px-3 py-1 text-sm font-semibold text-[#C17829] border border-[#C17829] rounded-full hover:bg-[#C17829]/10 transition"
          >
            Login <FaLogIn size={16} />
          </Button>
          <Button
            onClick={handleRegisterClick}
            className="px-3 py-1 text-sm font-semibold text-white bg-[#C17829] rounded-full hover:bg-[#ad6823] transition"
          >
            Register
          </Button>
        </div>

        {/* Mobile Controls */}
        <div className="lg:hidden flex items-center space-x-2 ml-auto">
          <button
            onClick={toggleMobileSearch}
            className="p-1 hover:text-[#C17829]"
          >
            <FaSearch size={getIconSize()} />
          </button>
          <button
            onClick={() =>
              changeLanguage(currentLanguage === "EN" ? "AR" : "EN")
            }
            className="p-1 hover:text-[#C17829]"
          >
            <FaGlobe size={getIconSize()} />
          </button>
          <button
            onClick={toggleMobileMenu}
            className="p-1 hover:text-[#C17829]"
          >
            {isMobileMenuOpen ? (
              <FaTimes size={getIconSize()} />
            ) : (
              <FaBars size={getIconSize()} />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Search */}
      {isSearchOpen && (
        <div
          ref={mobileSearchRef}
          className="absolute top-full left-0 right-0 bg-white shadow p-2 z-50"
        >
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              className="w-full rounded-full border px-10 py-2 text-sm outline-none focus:border-[#C17829] focus:ring-2 focus:ring-[#C17829]/30"
            />
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <button
              onClick={toggleMobileSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#C17829]"
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile Side Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-4/5 max-w-xs bg-white z-50 shadow transform transition-transform ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <NavLink
            to="/"
            onClick={toggleMobileMenu}
            className="flex items-center space-x-2"
          >
            <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
            <span className="text-xl font-bold text-[#C17829] font-serif">
              LDA
            </span>
          </NavLink>
          <button
            onClick={toggleMobileMenu}
            className="p-1 hover:text-[#C17829]"
          >
            <FaTimes size={getIconSize()} />
          </button>
        </div>

        {/* Links */}
        <div className="p-4 space-y-4">
          <NavLink
            to="/"
            onClick={toggleMobileMenu}
            className={({ isActive }) =>
              `flex items-center space-x-2 text-sm ${
                isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]"
              } hover:text-[#C17829]`
            }
          >
            <FaHome /> <span>Home</span>
          </NavLink>
          <a
            href="#services"
            onClick={(e) => {
              scrollToServices(e);
              toggleMobileMenu();
            }}
            className="block text-sm text-[#2C2C4A] hover:text-[#C17829]"
          >
            Services
          </a>
          <NavLink
            to="/about"
            onClick={toggleMobileMenu}
            className={({ isActive }) =>
              `block text-sm ${
                isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]"
              } hover:text-[#C17829]`
            }
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            onClick={toggleMobileMenu}
            className={({ isActive }) =>
              `block text-sm ${
                isActive ? "text-[#C17829] font-semibold" : "text-[#2C2C4A]"
              } hover:text-[#C17829]`
            }
          >
            Contact
          </NavLink>

          {/* Language */}
          <div>
            <div className="text-gray-700 font-medium mb-1">Language</div>
            <div className="flex space-x-2">
              <button
                onClick={() => changeLanguage("EN")}
                className={`px-3 py-1 rounded ${
                  currentLanguage === "EN"
                    ? "bg-[#C17829] text-white"
                    : "bg-gray-100 text-[#2C2C4A] hover:bg-gray-200"
                } text-sm`}
              >
                English
              </button>
              <button
                onClick={() => changeLanguage("AR")}
                className={`px-3 py-1 rounded ${
                  currentLanguage === "AR"
                    ? "bg-[#C17829] text-white"
                    : "bg-gray-100 text-[#2C2C4A] hover:bg-gray-200"
                } text-sm`}
              >
                العربية
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto p-4 border-t space-y-3">
          <Button
            onClick={handleLoginClick}
            className="w-full flex items-center justify-center gap-2 px-3 py-1 text-sm border border-[#C17829] text-[#C17829] rounded hover:bg-[#C17829]/10"
          >
            Login <FaLogIn size={16} />
          </Button>
          <Button
            onClick={handleRegisterClick}
            className="w-full px-3 py-1 text-sm text-white bg-[#C17829] rounded hover:bg-[#ad6823]"
          >
            Register
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
