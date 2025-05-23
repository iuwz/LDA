// src/views/components/Navbar.tsx
import React, { useState, useRef, useEffect } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaBalanceScale,
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaUserCircle,
  FaHome,
  FaTools,
  FaInfoCircle,
  FaEnvelope,
  FaLightbulb,
} from "react-icons/fa";
import { LogIn } from "lucide-react";
import { Button } from "../../components/common/button";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const ACCENT = "#C17829";
const NAV_HEIGHT_PX = 80;

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

  const profileRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname !== "/") {
      setActiveSection(null);
      return;
    }
    const servicesEl = document.getElementById("services");
    if (!servicesEl) return;

    const onScroll = () => {
      const y = window.scrollY + NAV_HEIGHT_PX + 1;
      setActiveSection(
        y >= servicesEl.offsetTop &&
          y < servicesEl.offsetTop + servicesEl.offsetHeight
          ? "services"
          : "home"
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

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

  useEffect(() => {
    const onResize = () => {
      setScreenWidth(window.innerWidth);
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (
        isProfileDropdownOpen &&
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [isProfileDropdownOpen]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (location.hash === "#services") {
      document
        .getElementById("services")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.hash]);

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
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
    navigate("/");
  };

  const getIconSz = () => (screenWidth < 350 ? 16 : 18);

  const deskActive = `text-[${ACCENT}] font-semibold border-b-2 border-[${ACCENT}]`;
  const deskIdle = "hover:text-[#C17829] transition-colors";
  const mobLink = (a: boolean) =>
    `flex items-center gap-2 px-1 py-2 ${
      a ? deskActive : "text-gray-700 hover:text-[#C17829]"
    }`;
  const loginBtn =
    "w-[105px] h-[40px] inline-flex items-center justify-center text-[#C17829] rounded-full font-semibold text-lg transition hover:bg-gradient-to-r hover:from-[#C17829] hover:to-[#E3A063] hover:text-white";
  const registerBtn =
    "w-[105px] h-[40px] inline-flex items-center justify-center bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-full font-semibold text-lg shadow-lg transition hover:scale-105";

  return (
    <div className="relative font-sans" ref={profileRef}>
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

        <div className="hidden lg:flex flex-1 justify-center space-x-8 text-[#2C2C4A]">
          <NavLink
            to="/"
            end
            className={() =>
              `relative px-1 pb-1 ${
                activeSection !== "services" && location.pathname === "/"
                  ? deskActive
                  : deskIdle
              } flex items-center gap-2`
            }
          >
            <FaHome size={16} />
            <span>Home</span>
          </NavLink>

          {authChecked && isAuthenticated && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `relative px-1 pb-1 ${
                  isActive ? deskActive : deskIdle
                } flex items-center gap-2`
              }
            >
              <FaTools size={16} />
              <span>Dashboard</span>
            </NavLink>
          )}

          <Link
            to="/#services"
            onClick={handleServicesClick}
            className={`relative px-1 pb-1 ${
              activeSection === "services" ? deskActive : deskIdle
            } flex items-center gap-2`}
          >
            <FaLightbulb size={16} />
            <span>Services</span>
          </Link>

          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `relative px-1 pb-1 ${
                isActive ? deskActive : deskIdle
              } flex items-center gap-2`
            }
          >
            <FaEnvelope size={16} />
            <span>Contact</span>
          </NavLink>

          <NavLink
            to="/about"
            className={({ isActive }) =>
              `relative px-1 pb-1 ${
                isActive ? deskActive : deskIdle
              } flex items-center gap-2`
            }
          >
            <FaInfoCircle size={16} />
            <span>About</span>
          </NavLink>
        </div>

        <div className="hidden lg:flex flex-1 justify-end items-center space-x-4 min-w-[150px]">
          {authChecked ? (
            isAuthenticated ? (
              <div className="relative">
                <div
                  onClick={() => setIsProfileDropdownOpen((v) => !v)}
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
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FaUserCircle className="text-[#2C2C4A]" size={14} />
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FaSignOutAlt size={14} />
                      Logout
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
                  <div className="flex items-center gap-2">
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

        <div className="lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            className="text-[#2C2C4A] hover:text-[#C17829] p-2"
          >
            {isMobileMenuOpen ? (
              <FaTimes size={getIconSz()} />
            ) : (
              <FaBars size={getIconSz()} />
            )}
          </button>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="fixed inset-y-0 left-0 w-64 bg-white z-50 lg:hidden flex flex-col overflow-hidden">
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
                <span
                  className="text-xl font-bold font-serif"
                  style={{ color: ACCENT }}
                >
                  LDA
                </span>
              </NavLink>
            </div>

            <div className="flex-1 overflow-y-auto pt-6 flex flex-col items-start pl-6 space-y-6">
              <NavLink
                to="/"
                end
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => mobLink(isActive)}
              >
                <FaHome size={16} />
                <span>Home</span>
              </NavLink>

              {authChecked && isAuthenticated && (
                <NavLink
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => mobLink(isActive)}
                >
                  <FaTools size={16} />
                  <span>Dashboard</span>
                </NavLink>
              )}

              <Link
                to="/#services"
                onClick={handleServicesClick}
                className={mobLink(activeSection === "services")}
              >
                <FaLightbulb size={16} />
                <span>Services</span>
              </Link>

              <NavLink
                to="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => mobLink(isActive)}
              >
                <FaInfoCircle size={16} />
                <span>About</span>
              </NavLink>

              <NavLink
                to="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => mobLink(isActive)}
              >
                <FaEnvelope size={16} />
                <span>Contact</span>
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
                    className="flex items-center gap-2 px-1 py-2 text-gray-700 hover:text-[#C17829]"
                  >
                    <FaUserCircle size={16} />
                    <span>Profile</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-1 py-2 text-red-600 hover:text-red-700"
                  >
                    <FaSignOutAlt size={16} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <div className="mt-8 pl-6 flex flex-col gap-4 items-start">
                  <div className="ml-[2px]">
                    <Button
                      size="md"
                      variant="secondary"
                      className={loginBtn}
                      onClick={handleLoginClick}
                    >
                      <div className="flex items-center gap-2">
                        <LogIn size={16} />
                        <span>Login</span>
                      </div>
                    </Button>
                  </div>
                  <div className="ml-[2px]">
                    <Button
                      size="md"
                      variant="primary"
                      className={registerBtn}
                      onClick={handleRegisterClick}
                    >
                      Register
                    </Button>
                  </div>
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
