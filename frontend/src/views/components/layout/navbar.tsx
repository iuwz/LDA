// src/views/components/Navbar.tsx
import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaBalanceScale,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";
import { LogIn } from "lucide-react";
import { Button } from "../../components/common/button";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const ACCENT = "#C17829";
const NAV_HEIGHT_PX = 80; // top-nav / drawer brand height

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initials, setInitials] = useState("");
  const [activeSection, setActiveSection] = useState<
    "home" | "services" | null
  >(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  /* ───────── active section on scroll ───────── */
  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection(null);
      return;
    }
    const servicesEl = document.getElementById("services");
    if (!servicesEl) return;

    const handleScroll = () => {
      const y = window.scrollY + NAV_HEIGHT_PX + 1;
      const top = servicesEl.offsetTop;
      const bottom = top + servicesEl.offsetHeight;
      setActiveSection(y >= top && y < bottom ? "services" : "home");
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  /* ───────── auth check ───────── */
  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((u) => {
        setIsAuthenticated(true);
        setInitials(
          `${u.first_name[0].toUpperCase()}${u.last_name[0].toUpperCase()}`
        );
      })
      .catch(() => setIsAuthenticated(false))
      .finally(() => setAuthChecked(true));
  }, []);

  /* ───────── resize ───────── */
  useEffect(() => {
    const onResize = () => {
      setScreenWidth(window.innerWidth);
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ───────── close profile dropdown on outside click ───────── */
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

  /* ───────── lock body scroll when mobile menu open ───────── */
  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  /* ───────── scroll to #services on hash change ───────── */
  useEffect(() => {
    if (location.hash === "#services") {
      document
        .getElementById("services")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

  /* ───────── helper to always scroll to services ───────── */
  const handleServicesClick = (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (location.pathname !== "/") {
      navigate("/#services");
    } else {
      document
        .getElementById("services")
        ?.scrollIntoView({ behavior: "smooth" });
      if (window.location.hash !== "#services") {
        window.history.replaceState(null, "", "#services");
      }
    }
  };

  /* ───────── callbacks ───────── */
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

  /* ───────── styles ───────── */
  const desktopActive = `text-[${ACCENT}] font-semibold border-b-2 border-[${ACCENT}]`;
  const desktopInactive = "hover:text-[#C17829] transition-colors";

  // vertical list; w-full keeps underline sized to text only (border set on element content)
  const mobileLink = (isActive: boolean) =>
    `block w-auto px-1 py-2 text-center ${
      isActive ? desktopActive : "text-gray-700 hover:text-[#C17829]"
    }`;

  const loginBtn =
    "w-[105px] h-[40px] inline-flex items-center justify-center text-[#C17829] rounded-full font-semibold text-lg transition hover:bg-gradient-to-r hover:from-[#C17829] hover:to-[#E3A063] hover:text-white";
  const registerBtn =
    "w-[105px] h-[40px] inline-flex items-center justify-center bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-full font-semibold text-lg shadow-lg transition hover:scale-105";

  /* ───────── JSX ───────── */
  return (
    <div className="relative font-sans" ref={profileDropdownRef}>
      {/* top-nav */}
      <nav
        className="sticky top-0 z-50 flex items-center bg-white px-6 py-3 shadow-md"
        style={{ height: NAV_HEIGHT_PX }}
      >
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

        {/* desktop links */}
        <div className="hidden lg:flex flex-1 justify-center space-x-8 text-[#2C2C4A]">
          <NavLink
            to="/"
            end
            className={() =>
              `relative px-1 pb-1 ${
                activeSection !== "services" && location.pathname === "/"
                  ? desktopActive
                  : desktopInactive
              }`
            }
          >
            Home
          </NavLink>

          {authChecked && isAuthenticated && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `relative px-1 pb-1 ${
                  isActive ? desktopActive : desktopInactive
                }`
              }
            >
              Dashboard
            </NavLink>
          )}

          <Link
            to="/#services"
            onClick={handleServicesClick}
            className={`relative px-1 pb-1 ${
              activeSection === "services" ? desktopActive : desktopInactive
            }`}
          >
            Services
          </Link>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `relative px-1 pb-1 ${isActive ? desktopActive : desktopInactive}`
            }
          >
            Contact
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `relative px-1 pb-1 ${isActive ? desktopActive : desktopInactive}`
            }
          >
            About
          </NavLink>
        </div>

        {/* desktop auth */}
        <div className="hidden lg:flex flex-1 justify-end items-center space-x-4 min-w-[150px]">
          {authChecked ? (
            isAuthenticated ? (
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
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center"
                    >
                      <FaUserCircle className="mr-2 text-[#2C2C4A]" size={14} />{" "}
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center"
                    >
                      <FaSignOutAlt className="mr-2" size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  className={loginBtn}
                  onClick={handleLoginClick}
                >
                  <div className="flex items-center space-x-1">
                    <LogIn size={14} />
                    <span>Login</span>
                  </div>
                </Button>
                <Button
                  size="sm"
                  variant="primary"
                  className={registerBtn}
                  onClick={handleRegisterClick}
                >
                  Register
                </Button>
              </>
            )
          ) : (
            <div className="h-8 w-32" />
          )}
        </div>

        {/* mobile hamburger */}
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

      {/* mobile drawer */}
      {isMobileMenuOpen && (
        <>
          {/* overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* side-panel */}
          <div className="fixed inset-y-0 left-0 w-64 bg-white z-50 lg:hidden flex flex-col">
            {/* brand - divider aligns w/ top-nav */}
            <div
              className="flex items-center h-full px-4 border-b"
              style={{ height: NAV_HEIGHT_PX }}
            >
              <NavLink
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-2"
              >
                <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
                <span className="text-xl font-bold text-[#C17829] font-serif">
                  LDA
                </span>
              </NavLink>
            </div>

            {/* vertical links w/ breathing space */}
            <div className="flex-1 overflow-y-auto pt-6 flex flex-col items-center space-y-6">
              <NavLink
                to="/"
                end
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => mobileLink(isActive)}
              >
                Home
              </NavLink>

              {authChecked && isAuthenticated && (
                <NavLink
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => mobileLink(isActive)}
                >
                  Dashboard
                </NavLink>
              )}

              <Link
                to="/#services"
                onClick={handleServicesClick}
                className={mobileLink(activeSection === "services")}
              >
                Services
              </Link>

              <NavLink
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => mobileLink(isActive)}
              >
                About
              </NavLink>
              <NavLink
                to="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => mobileLink(isActive)}
              >
                Contact
              </NavLink>

              {!authChecked ? (
                <div className="h-8 w-32" />
              ) : isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      navigate("/dashboard/profile");
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-auto px-1 py-2 text-center text-gray-700 hover:text-[#C17829]"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-auto px-1 py-2 text-center text-red-600 hover:text-red-700"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <Button
                    size="md"
                    variant="secondary"
                    className={loginBtn}
                    onClick={handleLoginClick}
                  >
                    <div className="flex items-center space-x-1 justify-center">
                      <LogIn size={16} />
                      <span>Login</span>
                    </div>
                  </Button>
                  <Button
                    size="md"
                    variant="primary"
                    className={registerBtn}
                    onClick={handleRegisterClick}
                  >
                    Register
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Navbar;
