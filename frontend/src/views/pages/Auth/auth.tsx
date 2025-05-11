// src/views/pages/Auth/auth.tsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login, register } from "../../../api";
import { motion, AnimatePresence } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Button } from "../../components/common/button";
import myImage from "../../../assets/images/pic.jpg";

/* ───────────────────────── Sign-In ───────────────────────── */

interface SignInFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onSubmit: () => void;
  error?: string | null;
}

function SignInForm({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  error,
}: SignInFormProps) {
  const [showPw, setShowPw] = useState(false);

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl lg:text-3xl font-bold text-[#2C2C4A] mb-2">
          Sign In
        </h2>
        <p className="text-gray-600">Access your account</p>
      </div>

      <form
        className="mt-12"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {/* Email */}
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">Email</label>
          <input
            type="email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C17829] focus:border-[#C17829] transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>

        {/* Password w/ eye toggle */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <label className="block text-gray-700 font-medium">Password</label>
            <a
              href="/forgot-password"
              className="text-sm text-[#C17829] hover:text-[#ad6823] transition-colors"
            >
              Forgot Password?
            </a>
          </div>

          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C17829] focus:border-[#C17829] transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-4 flex items-center text-gray-400"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        {/* Remember-me */}
        <div className="flex items-center mb-8">
          <input
            type="checkbox"
            id="remember"
            className="mr-2 h-4 w-4 text-[#C17829] focus:ring-[#C17829] rounded"
          />
          <label htmlFor="remember" className="text-sm text-gray-700">
            Remember me for 30 days
          </label>
        </div>

        {error && <p className="text-red-600 mt-2">{error}</p>}
        <Button
          type="submit"
          className="w-full bg-[#C17829] text-white py-3 rounded-full font-semibold text-lg hover:bg-[#ad6823] shadow-md hover:shadow-lg transition-all active:bg-[#A66F24] hover:scale-[1.01]"
        >
          Sign In
        </Button>
      </form>
    </>
  );
}

/* ───────────────────────── Sign-Up ───────────────────────── */

interface SignUpFormProps {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onSubmit: () => void;
  error?: string | null;
  isValidEmail: (val: string) => boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSymbol: boolean;
  hasMinLength: boolean;
  isAllValid: boolean;
}

function SignUpForm({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  error,
  isValidEmail,
  hasUppercase,
  hasNumber,
  hasSymbol,
  hasMinLength,
  isAllValid,
}: SignUpFormProps) {
  const [showPw, setShowPw] = useState(false);
  const metRules = [hasUppercase, hasNumber, hasSymbol, hasMinLength].filter(
    Boolean
  ).length;
  const strengthWidth = `${metRules * 25}%`;
  const strengthColor = isAllValid ? "bg-green-500" : "bg-yellow-400";

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl lg:text-3xl font-bold text-[#2C2C4A] mb-2">
          Create Account
        </h2>
        <p className="text-gray-600">Join our platform</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {/* First Name */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            First Name
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C17829] focus:border-[#C17829] transition-all"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
            required
          />
        </div>

        {/* Last Name */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Last Name
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C17829] focus:border-[#C17829] transition-all"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your last name"
            required
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Email</label>
          <input
            type="email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C17829] focus:border-[#C17829] transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@example.com"
            required
          />
          {email.length > 0 && !isValidEmail(email) && (
            <p className="text-red-600 text-sm mt-1 flex items-center">
              <span className="mr-1">✗</span> Invalid email format
            </p>
          )}
          {email.length > 0 && isValidEmail(email) && (
            <p className="text-green-600 text-sm mt-1 flex items-center">
              <span className="mr-1">✓</span> Valid email
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C17829] focus:border-[#C17829] transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-4 flex items-center text-gray-400"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
            >
              {showPw ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Rule checklist */}
          <div className="mt-3 text-sm space-y-1.5 bg-gray-50 p-3 rounded-lg">
            <p
              className={`flex items-center ${
                hasUppercase ? "text-green-600" : "text-gray-500"
              }`}
            >
              <span className="mr-2">{hasUppercase ? "✓" : "○"}</span> Uppercase
              letter
            </p>
            <p
              className={`flex items-center ${
                hasNumber ? "text-green-600" : "text-gray-500"
              }`}
            >
              <span className="mr-2">{hasNumber ? "✓" : "○"}</span> Number
            </p>
            <p
              className={`flex items-center ${
                hasSymbol ? "text-green-600" : "text-gray-500"
              }`}
            >
              <span className="mr-2">{hasSymbol ? "✓" : "○"}</span> Special
              character
            </p>
            <p
              className={`flex items-center ${
                hasMinLength ? "text-green-600" : "text-gray-500"
              }`}
            >
              <span className="mr-2">{hasMinLength ? "✓" : "○"}</span> At least
              8 characters
            </p>
          </div>

          {/* Strength bar */}
          {password.length > 0 && (
            <div className="mt-3 h-2 w-full bg-gray-200 rounded">
              <div
                className={`h-full rounded ${strengthColor}`}
                style={{ width: strengthWidth }}
              />
            </div>
          )}
        </div>

        {error && <p className="text-red-600 mt-2">{error}</p>}
        <Button
          type="submit"
          disabled={!isAllValid}
          className="w-full bg-[#C17829] text-white py-3 rounded-full font-semibold text-lg hover:bg-[#ad6823] shadow-md hover:shadow-lg transition-all active:bg-[#A66F24] hover:scale-[1.01]"
        >
          Create Account
        </Button>
      </form>
    </>
  );
}

/* ───────────────────────── Master Auth ───────────────────────── */

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  /* handlers */
  const handleSignIn = async () => {
    setError(null);
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSignUp = async () => {
    setError(null);
    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        hashed_password: password,
      });
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.message);
    }
  };

  /* URL param / state check */
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const form = q.get("form");
    if (form === "login") setIsSignUp(false);
    else if (form === "register") setIsSignUp(true);
    else if (location.state && typeof location.state === "object") {
      const s = location.state as { isSignUp?: boolean };
      if (s.isSignUp !== undefined) setIsSignUp(s.isSignUp);
    }
  }, [location]);

  /* validators */
  const isValidEmail = (val: string) => /.+@.+\..+/.test(val.trim());
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const hasMinLength = password.length >= 8;
  const isAllValid =
    hasUppercase && hasNumber && hasSymbol && hasMinLength;

  return (
    <main className="bg-gradient-to-r from-[#f7ede1] to-white min-h-screen w-full flex items-center justify-center overflow-hidden fixed inset-0">
      {/* animated bubbles */}
      <div className="fixed inset-0 pointer-events-none">
        {/* ... your motion bubbles unchanged ... */}
      </div>

      {/* auth card */}
      <div className="relative z-10 px-4 py-12 w-full max-w-7xl flex justify-center">
        <motion.div
          className="w-full max-w-5xl flex flex-wrap overflow-hidden bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* form side */}
          <div className="w-full lg:w-1/2 p-8 lg:p-16 flex items-center justify-center z-10">
            <div className="w-full max-w-md h-[650px] flex items-center">
              <AnimatePresence mode="wait">
                {isSignUp ? (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    <SignUpForm
                      firstName={firstName}
                      setFirstName={setFirstName}
                      lastName={lastName}
                      setLastName={setLastName}
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      onSubmit={handleSignUp}
                      error={error}
                      isValidEmail={isValidEmail}
                      hasUppercase={hasUppercase}
                      hasNumber={hasNumber}
                      hasSymbol={hasSymbol}
                      hasMinLength={hasMinLength}
                      isAllValid={isAllValid}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="signin"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                  >
                    <SignInForm
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      onSubmit={handleSignIn}
                      error={error}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* image side (only ≥lg) */}
          <div className="hidden lg:block lg:w-1/2 bg-cover bg-center relative overflow-hidden">
            <motion.div
              className="absolute inset-0 z-10 flex"
              animate={{ x: isSignUp ? "-100%" : "0%" }}
              transition={{
                duration: 0.6,
                ease: [0.43, 0.13, 0.23, 0.96],
              }}
            >
              {/* sign-in & sign-up slides... unchanged */}
            </motion.div>
          </div>

          {/* toggle (visible <lg) */}
          <div className="lg:hidden mt-8 text-center">
            <p className="text-gray-600 mb-3">
              {isSignUp ? "Already have an account?" : "New to our platform?"}
            </p>
            <Button
              onClick={() => setIsSignUp((s) => !s)}
              className="px-6 py-2 rounded-full bg-transparent border border-[#C17829] text-[#C17829] hover:bg-[#C17829] hover:text-white transition-all"
            >
              {isSignUp ? "Sign In" : "Create Account"}
            </Button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
