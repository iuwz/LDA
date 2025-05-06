// src/views/components/Navbar.tsx
import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { FaBalanceScale, FaBars, FaTimes } from "react-icons/fa";
import { LogIn } from "lucide-react";
import { Button } from "../../components/common/button";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const ACCENT = "#C17829";

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initials, setInitials] = useState("");

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // only underline “Services” when pathname is "/" and hash is "#services"
  const isServicesTab =
    location.pathname === "/" && location.hash === "#services";

  // fetch authentication
  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => {
        setIsAuthenticated(true);
        setInitials(
          `${u.first_name[0].toUpperCase()}${u.last_name[0].toUpperCase()}`
        );
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  // close mobile menu on large resize
  useEffect(() => {
    const onResize = () => {
      setScreenWidth(window.innerWidth);
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // click outside to close profile dropdown
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        isProfileDropdownOpen &&
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(e.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isProfileDropdownOpen]);

  // lock scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // smooth-scroll into #services if hash changes
  useEffect(() => {
    if (location.hash === "#services") {
      document
        .getElementById("services")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

  const toggleMobileMenu = () => setIsMobileMenuOpen((v) => !v);
  const toggleProfileDropdown = () => setIsProfileDropdownOpen((v) => !v);

  const handleLoginClick = () => {
    navigate("/auth?form=login");
    setIsMobileMenuOpen(false);
  };
  const handleRegisterClick = () => {
    navigate("/auth?form=register");
    setIsMobileMenuOpen(false);
  };
  const handleLogout = async () => {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setIsAuthenticated(false);
    setIsProfileDropdownOpen(false);
    setIsMobileMenuOpen(false);
    navigate("/");
  };

  const getIconSize = () => (screenWidth < 350 ? 16 : 20);

  const activeLink = `text-[${ACCENT}] font-semibold border-b-2 border-[${ACCENT}]`;
  const inactiveLink = "hover:text-[#C17829] transition-colors";

  return (
    <div className="relative font-sans" ref={profileDropdownRef}>
      {/* Desktop Navbar */}
      <nav className="sticky top-0 z-50 flex items-center bg-white px-6 py-3 shadow-md">
        {/* Brand */}
        <div className="flex-1">
          <NavLink to="/" end className="flex items-center space-x-2">
            <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
            <span
              className="font-serif font-bold text-xl"
              style={{ color: ACCENT }}
            >
              LDA
            </span>
          </NavLink>
        </div>

        {/* Center Links */}
        <div className="hidden lg:flex flex-1 justify-center space-x-8 text-[#2C2C4A]">
          {/* Home: only active if no hash */}
          <NavLink
            to="/"
            end
            className={({ isActive }) => {
              const homeActive = isActive && location.hash === "";
              return `relative px-1 pb-1 ${
                homeActive ? activeLink : inactiveLink
              }`;
            }}
          >
            Home
          </NavLink>

          {isAuthenticated && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `relative px-1 pb-1 ${isActive ? activeLink : inactiveLink}`
              }
            >
              Dashboard
            </NavLink>
          )}

          {/* Services: custom underline when at /#services */}
          <Link
            to="/#services"
            className={`relative px-1 pb-1 ${
              isServicesTab ? activeLink : inactiveLink
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Services
          </Link>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `relative px-1 pb-1 ${isActive ? activeLink : inactiveLink}`
            }
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `relative px-1 pb-1 ${isActive ? activeLink : inactiveLink}`
            }
          >
            Contact
          </NavLink>
        </div>

        {/* Right side */}
        <div className="hidden lg:flex flex-1 justify-end items-center space-x-4">
          {isAuthenticated ? (
            <div className="relative">
              <div
                onClick={toggleProfileDropdown}
                className="h-8 w-8 rounded-full bg-[#2C2C4A] text-white flex items-center justify-center cursor-pointer"
              >
                {initials}
              </div>
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 bg-white border rounded-md shadow-lg py-1">
                  <button
                    onClick={() => {
                      navigate("/dashboard/profile");
                      setIsProfileDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button
                size="md"
                variant="secondary"
                className="rounded-full"
                onClick={handleLoginClick}
              >
                <div className="flex items-center space-x-1">
                  <LogIn size={16} />
                  <span>Login</span>
                </div>
              </Button>
              <Button
                size="md"
                variant="primary"
                className="rounded-full"
                onClick={handleRegisterClick}
              >
                Register
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="lg:hidden">
          <button
            onClick={toggleMobileMenu}
            className="text-[#2C2C4A] hover:text-[#C17829] p-2"
          >
            {isMobileMenuOpen ? (
              <FaTimes size={getIconSize()} />
            ) : (
              <FaBars size={getIconSize()} />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={toggleMobileMenu}
        />
      )}

      {/* Mobile side panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-4/5 max-w-xs bg-white z-50
          transform transition-transform duration-300
          ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b">
          <NavLink
            to="/"
            end
            onClick={toggleMobileMenu}
            className="flex items-center space-x-2"
          >
            <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
            <span
              className="font-serif font-bold text-xl"
              style={{ color: ACCENT }}
            >
              LDA
            </span>
          </NavLink>
          <button
            onClick={toggleMobileMenu}
            className="text-[#2C2C4A] hover:text-[#C17829]"
          >
            <FaTimes size={getIconSize()} />
          </button>
        </div>

        {/* Links */}
        <div className="px-4 py-6 space-y-4 text-[#2C2C4A]">
          <NavLink
            to="/"
            end
            onClick={toggleMobileMenu}
            className="block hover:text-[#C17829]"
          >
            Home
          </NavLink>
          {isAuthenticated && (
            <NavLink
              to="/dashboard"
              onClick={toggleMobileMenu}
              className="block hover:text-[#C17829]"
            >
              Dashboard
            </NavLink>
          )}
          <Link
            to="/#services"
            className="block hover:text-[#C17829]"
            onClick={() => toggleMobileMenu()}
          >
            Services
          </Link>
          <NavLink
            to="/about"
            onClick={toggleMobileMenu}
            className="block hover:text-[#C17829]"
          >
            About
          </NavLink>
          <NavLink
            to="/contact"
            onClick={toggleMobileMenu}
            className="block hover:text-[#C17829]"
          >
            Contact
          </NavLink>
        </div>

        {/* Footer auth */}
        <div className="px-4 py-6 border-t space-y-4">
          {isAuthenticated ? (
            <>
              <Button
                size="md"
                variant="primary"
                className="w-full rounded-full"
                onClick={() => {
                  navigate("/dashboard/profile");
                  toggleMobileMenu();
                }}
              >
                Profile
              </Button>
              <Button
                size="md"
                variant="secondary"
                className="w-full rounded-full"
                onClick={handleLogout}
              >
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button
                size="md"
                variant="secondary"
                className="w-full rounded-full"
                onClick={() => {
                  handleLoginClick();
                  toggleMobileMenu();
                }}
              >
                Login
              </Button>
              <Button
                size="md"
                variant="primary"
                className="w-full rounded-full"
                onClick={() => {
                  handleRegisterClick();
                  toggleMobileMenu();
                }}
              >
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
