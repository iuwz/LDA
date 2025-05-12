/* ────────────────────────────────────────────────────────────────
frontend/src/views/pages/Auth/auth.tsx

Fully-integrated file with:
• e-mail verification (send + verify 6-digit code)
• clear “email already registered” / “invalid credentials” messages
• Create-Account disabled until code is verified
────────────────────────────────────────────────────────────────── */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  login,
  register,
  sendVerificationCode,   // NEW
  verifyEmailCode,       // NEW
} from "../../../api";
import { motion, AnimatePresence } from "framer-motion";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Button } from "../../components/common/button";
import myImage from "../../../assets/images/pic.jpg";

/* ───────────────────────── Sign-In ─────────────────────────── */

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
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2C2C4A] mb-2">
          Sign In
        </h2>
        <p className="text-gray-600 text-sm md:text-base">
          Access your account
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mb-4 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700 shadow-sm"
        >
          {error}
        </motion.div>
      )}

      <form
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {/* Email */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2 text-sm">
            Email
          </label>
          <input
            type="email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C17829] transition-all text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <label className="block text-gray-700 font-medium text-sm">
              Password
            </label>
            <a
              href="/forgot-password"
              className="text-xs text-[#C17829] hover:text-[#ad6823] transition-colors"
            >
              Forgot Password?
            </a>
          </div>

          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C17829] transition-all text-sm"
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

        <Button
          type="submit"
          className="w-full bg-[#C17829] text-white py-3 rounded-full font-semibold text-lg hover:bg-[#ad6823] shadow-md transition-all active:bg-[#A66F24] hover:scale-[1.01]"
        >
          Sign In
        </Button>
      </form>
    </>
  );
}

/* ───────────────────────── Sign-Up ─────────────────────────── */

interface SignUpFormProps {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;

  /* NEW props for 2-step e-mail verification */
  codeSent: boolean;
  code: string;
  setCode: (v: string) => void;
  codeVerified: boolean;
  codeError: string | null;
  canSend: boolean;
  handleSendCode: () => void;
  handleVerifyCode: () => void;

  onSubmit: () => void;
  error?: string | null;

  /* validators */
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
  codeSent,
  code,
  setCode,
  codeVerified,
  codeError,
  canSend,
  handleSendCode,
  handleVerifyCode,
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

  /* strength bar */
  const metRules = [hasUppercase, hasNumber, hasSymbol, hasMinLength].filter(
    Boolean
  ).length;
  const strengthWidth = `${metRules * 25}%`;
  const strengthColor = isAllValid ? "bg-green-500" : "bg-yellow-400";

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2C2C4A] mb-2">
          Create Account
        </h2>
        <p className="text-gray-600 text-sm md:text-base">
          Join our platform
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mb-4 rounded-lg border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700 shadow-sm"
        >
          {error}
        </motion.div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {/* First Name */}
        <div className="mb-3">
          <label className="block text-gray-700 font-medium mb-2 text-sm">
            First Name
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C17829] transition-all text-sm"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
            required
          />
        </div>

        {/* Last Name */}
        <div className="mb-3">
          <label className="block text-gray-700 font-medium mb-2 text-sm">
            Last Name
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C17829] transition-all text-sm"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your last name"
            required
          />
        </div>

        {/* ─── Email + Send-code ─────────────────────────────── */}
        <div className="mb-3">
          <label className="block text-gray-700 font-medium mb-2 text-sm">
            Email
          </label>

          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                /* reset verification state if email changes */
                setCode("");
              }}
              placeholder="example@example.com"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C17829] transition-all text-sm"
              required
            />
            <Button
              type="button"
              disabled={!canSend}
              onClick={handleSendCode}
              className="shrink-0 px-4 py-3 bg-[#C17829] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {codeSent ? "Resend" : "Send Code"}
            </Button>
          </div>

          {/* Inline “valid email” hint */}
          {email.length > 0 && !isValidEmail(email) && (
            <p className="text-red-600 text-xs mt-1 flex items-center">
              ✗&nbsp;Invalid email format
            </p>
          )}
          {email.length > 0 && isValidEmail(email) && (
            <p className="text-green-600 text-xs mt-1 flex items-center">
              ✓&nbsp;Valid email
            </p>
          )}

          {/* Code input & verify */}
          {codeSent && !codeVerified && (
            <div className="mt-3">
              <label className="block text-gray-700 mb-1 text-xs">
                Enter the 6-digit code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  maxLength={6}
                  className="flex-1 px-4 py-2 border rounded-lg text-sm"
                />
                <Button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={code.length !== 6}
                  className="px-4 py-2 bg-[#2C2C4A] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Verify
                </Button>
              </div>
              {codeError && (
                <p className="text-red-600 text-xs mt-1">{codeError}</p>
              )}
            </div>
          )}

          {codeVerified && (
            <p className="text-green-600 text-xs mt-1 flex items-center">
              ✓&nbsp;E-mail verified
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2 text-sm">
            Password
          </label>

          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C17829] transition-all text-sm"
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
          <div className="mt-3 text-xs space-y-1 bg-gray-50 p-3 rounded-lg">
            <p
              className={`${hasUppercase ? "text-green-600" : "text-gray-500"} flex items-center`}
            >
              <span className="mr-2">{hasUppercase ? "✓" : "○"}</span>
              Uppercase letter
            </p>
            <p
              className={`${hasNumber ? "text-green-600" : "text-gray-500"} flex items-center`}
            >
              <span className="mr-2">{hasNumber ? "✓" : "○"}</span>
              Number
            </p>
            <p
              className={`${hasSymbol ? "text-green-600" : "text-gray-500"} flex items-center`}
            >
              <span className="mr-2">{hasSymbol ? "✓" : "○"}</span>
              Special character
            </p>
            <p
              className={`${hasMinLength ? "text-green-600" : "text-gray-500"} flex items-center`}
            >
              <span className="mr-2">{hasMinLength ? "✓" : "○"}</span>
              At least 8 characters
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

        <Button
          type="submit"
          disabled={!isAllValid || !codeVerified}
          className="w-full bg-[#C17829] text-white py-3 rounded-full font-semibold text-lg hover:bg-[#ad6823] shadow-md transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
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

  /* user details */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  /* NEW verification state */
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const canSend = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(
    email.trim()
  ) && !codeSent;

  const navigate = useNavigate();
  const location = useLocation();

  /* ───── handlers ───── */
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
        email: email,
        hashed_password: password,
      });
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.message);
    }
  };

  /* NEW: send / verify code */
  const handleSendCode = async () => {
    setCodeError(null);
    try {
      await sendVerificationCode(email);
      setCodeSent(true);
    } catch (e: any) {
      setCodeError(e.message);
    }
  };

  const handleVerifyCode = async () => {
    setCodeError(null);
    try {
      await verifyEmailCode(email, code);
      setCodeVerified(true);
    } catch (e: any) {
      setCodeError(e.message);
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
  const isValidEmail = (val: string) =>
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(val.trim());
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const hasMinLength = password.length >= 8;
  const isAllValid =
    hasUppercase && hasNumber && hasSymbol && hasMinLength;

  /* ───────── JSX ───────── */
  return (
    <main className="bg-gradient-to-r from-[#f7ede1] to-white min-h-screen w-full flex items-center justify-center overflow-y-auto py-4">
      {/* auth card */}
      <div className="relative z-10 px-4 py-12 w-full max-w-7xl flex justify-center">
        <motion.div
          className="w-full max-w-6xl flex flex-wrap overflow-hidden bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* form side */}
          <div className="w-full md:w-1/2 p-8 md:p-16 flex items-center justify-center">
            <div className="w-full max-w-md">
              <AnimatePresence mode="wait">
                {isSignUp ? (
                  <motion.div
                    key="signup"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <SignUpForm
                      firstName={firstName}
                      setFirstName={setFirstName}
                      lastName={lastName}
                      setLastName={setLastName}
                      email={email}
                      setEmail={(val) => {
                        setEmail(val);
                        if (!val) {
                          setCodeSent(false);
                          setCodeVerified(false);
                          setCode("");
                        }
                      }}
                      password={password}
                      setPassword={setPassword}
                      codeSent={codeSent}
                      code={code}
                      setCode={setCode}
                      codeVerified={codeVerified}
                      codeError={codeError}
                      canSend={canSend}
                      handleSendCode={handleSendCode}
                      handleVerifyCode={handleVerifyCode}
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

          {/* image side */}
          <div className="hidden md:block md:w-1/2 bg-cover bg-center relative overflow-hidden">
            <motion.div
              className="absolute inset-0 z-10 flex"
              animate={{ x: isSignUp ? "-100%" : "0%" }}
              transition={{
                duration: 0.6,
                ease: [0.43, 0.13, 0.23, 0.96],
              }}
            >
              {/* sign-in promo */}
              <div className="w-full flex-shrink-0 h-full relative">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${myImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#2C2C4A]/70 to-[#C17829]/50" />
                <div className="relative h-full flex flex-col items-center justify-center text-center p-12 text-white">
                  <h2 className="font-serif text-3xl font-bold mb-6">
                    New to our platform?
                  </h2>
                  <p className="text-lg mb-8 opacity-90">
                    Join us and discover how our AI tools transform legal
                    workflows.
                  </p>
                  <Button
                    onClick={() => setIsSignUp(true)}
                    className="px-8 py-3 rounded-full bg-white text-[#2C2C4A] font-semibold border-2 border-white transition-all shadow-lg hover:bg-white/90 hover:scale-105"
                  >
                    Create Account
                  </Button>
                </div>
              </div>

              {/* sign-up promo */}
              <div className="w-full flex-shrink-0 h-full relative">
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${myImage})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#C17829]/50 to-[#2C2C4A]/70" />
                <div className="relative h-full flex flex-col items-center justify-center text-center p-12 text-white">
                  <h2 className="font-serif text-3xl font-bold mb-6">
                    Already have an account?
                  </h2>
                  <p className="text-lg mb-8 opacity-90">
                    Sign in to continue your legal journey with us.
                  </p>
                  <Button
                    onClick={() => setIsSignUp(false)}
                    className="px-8 py-3 rounded-full bg-white text-[#2C2C4A] font-semibold border-2 border-white transition-all shadow-lg hover:bg-white/90 hover:scale-105"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* mobile toggle */}
          <div className="md:hidden w-full p-4 text-center border-t border-gray-100">
            <p className="text-gray-600 mb-3 text-sm">
              {isSignUp ? "Already have an account?" : "New to our platform?"}
            </p>
            <Button
              onClick={() => setIsSignUp((s) => !s)}
              className="px-6 py-2 rounded-full bg-transparent border border-[#C17829] text-[#C17829] hover:bg-[#C17829] hover:text-white transition-all text-sm"
            >
              {isSignUp ? "Sign In" : "Create Account"}
            </Button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
