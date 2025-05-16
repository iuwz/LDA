/* ────────────────────────────────────────────────────────────────
frontend/src/views/pages/Auth/auth.tsx

RELEASE 3-h • 2025-05-17  
This file completely replaces every previous snippet.  
Copy-paste it over **frontend/src/views/pages/Auth/auth.tsx**.

Changes vs. 3-g
────────────────
1. Spinner inside the e-mail field now always rotates (`animate-spin`)
   and has explicit `h-4 w-4` size so it’s visible.
2. Tooltip on the red ✗ removed – we rely on the inline error message
   “Email already registered” below the field.

Everything else works exactly as before.
────────────────────────────────────────────────────────────────── */

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  login,
  register,
  sendVerificationCode,
  verifyEmailCode,
  checkEmailExists,
} from "../../../api";
import {
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/common/button";
import myImage from "../../../assets/images/pic.jpg";

/* ───────── Shared constants ───────── */
const EMAIL_REGEX =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/* ───────── Tooltip helper (still used for the eye icon) ───────── */
const Tooltip = ({ text }: { text: string }) => (
  <span className="pointer-events-none absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-800 text-white text-xs px-2 py-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
    {text}
    <span className="absolute left-full top-1/2 -translate-y-1/2 border-6 border-y-transparent border-r-transparent border-l-gray-800" />
  </span>
);

/* ═════════════════════════ Sign-In Form ════════════════════════ */
interface SignInFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error?: string | null;
  credError?: string | null;
}

function SignInForm({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  isSubmitting,
  error,
  credError,
}: SignInFormProps) {
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="min-h-[440px] flex flex-col justify-between">
      {/* header */}
      <div>
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl font-bold text-[#2C2C4A] mb-2">
            Sign&nbsp;In
          </h2>
          <p className="text-gray-600 text-base">Access your account</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 rounded border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {/* Email */}
          <div>
            <label className="block text-gray-700 mb-2 text-sm">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                className={`w-full px-4 py-3 border rounded-lg shadow-sm text-base
                           focus:outline-none focus:ring-2 focus:ring-[#C17829]
                           ${
                             credError
                               ? "border-red-500"
                               : "border-gray-300 focus:border-transparent"
                           }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
              {!credError && email && (
                <FaCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />
              )}
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-gray-700 mb-2 text-sm">
              Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm text-base
                           focus:outline-none focus:ring-2 focus:ring-[#C17829]
                           ${
                             credError
                               ? "border-red-500"
                               : "border-gray-300 focus:border-transparent"
                           }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="group absolute inset-y-0 right-4 flex items-center text-gray-400"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <FaEyeSlash /> : <FaEye />}
                <Tooltip text={showPw ? "Hide password" : "Show password"} />
              </button>
            </div>

            {credError && (
              <p className="text-red-600 text-sm mt-1">{credError}</p>
            )}

            <div className="mt-2 text-right">
              <a
                href="/forgot-password"
                className="text-sm text-[#C17829] hover:text-[#ad6823]"
              >
                Forgot&nbsp;Password?
              </a>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-full font-semibold text-base shadow-lg transition transform hover:scale-105 disabled:opacity-40"
          >
            {isSubmitting ? (
              <FaSpinner className="animate-spin h-4 w-4" />
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ═════════════════════ Sign-Up Form ═════════════════════ */
interface SignUpFormProps {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  isSending: boolean;
  codeSent: boolean;
  code: string;
  setCode: (v: string) => void;
  codeVerified: boolean;
  codeError: string | null;
  canSend: boolean;
  handleSendCode: () => Promise<boolean>;
  handleVerifyCode: () => void;
  onSubmit: () => void;
  error?: string | null;
  emailError?: string | null;
  checkingEmail: boolean;
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
  isSending,
  handleSendCode,
  handleVerifyCode,
  onSubmit,
  error,
  emailError,
  checkingEmail,
  hasUppercase,
  hasNumber,
  hasSymbol,
  hasMinLength,
  isAllValid,
}: SignUpFormProps) {
  const [showPw, setShowPw] = useState(false);
  const [localErrors, setLocalErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [showSuccess, setShowSuccess] = useState(false);

  /* client-side validation helper */
  const validate = () => {
    const errs: any = {};
    if (!firstName.trim()) errs.firstName = "First name is required";
    if (!lastName.trim()) errs.lastName = "Last name is required";
    if (!EMAIL_REGEX.test(email.trim()))
      errs.email = "Enter a valid e-mail (example@domain.com)";
    setLocalErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSend = async () => {
    if (!validate()) return;
    const ok = await handleSendCode();
    setShowSuccess(ok);
  };

  /* hide “Code sent!” if any error pops up */
  useEffect(() => {
    if (emailError || error || codeError) setShowSuccess(false);
  }, [emailError, error, codeError]);

  return (
    <div className="min-h-[480px] flex flex-col justify-between">
      {/* header */}
      <div>
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl font-bold text-[#2C2C4A] mb-2">
            Create&nbsp;Account
          </h2>
          <p className="text-gray-600 text-base">Join us today</p>
        </div>

        {/* banners */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mb-4 rounded border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 rounded border border-green-300 bg-green-100 px-4 py-3 text-sm text-green-700"
          >
            Code sent! Check your inbox.
          </motion.div>
        )}
        {codeVerified && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mb-4 rounded border border-green-300 bg-green-100 px-4 py-3 text-sm text-green-700"
          >
            Verification successful ✓
          </motion.div>
        )}

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!validate()) return;
            onSubmit();
          }}
        >
          {/* names */}
          <div className="flex gap-3">
            {/* first */}
            <div className="relative w-1/2">
              <input
                type="text"
                className={`w-full px-4 py-3 border rounded-lg text-base
                           focus:outline-none focus:ring-2 focus:ring-[#C17829]
                           ${
                             localErrors.firstName
                               ? "border-red-500"
                               : "border-gray-300 focus:border-transparent"
                           }`}
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (localErrors.firstName)
                    setLocalErrors({ ...localErrors, firstName: "" });
                }}
                placeholder="First name"
                required
              />
              {firstName && !localErrors.firstName && (
                <FaCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />
              )}
              {localErrors.firstName && (
                <p className="text-red-600 text-xs mt-1">
                  {localErrors.firstName}
                </p>
              )}
            </div>

            {/* last */}
            <div className="relative w-1/2">
              <input
                type="text"
                className={`w-full px-4 py-3 border rounded-lg text-base
                           focus:outline-none focus:ring-2 focus:ring-[#C17829]
                           ${
                             localErrors.lastName
                               ? "border-red-500"
                               : "border-gray-300 focus:border-transparent"
                           }`}
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (localErrors.lastName)
                    setLocalErrors({ ...localErrors, lastName: "" });
                }}
                placeholder="Last name"
                required
              />
              {lastName && !localErrors.lastName && (
                <FaCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />
              )}
              {localErrors.lastName && (
                <p className="text-red-600 text-xs mt-1">
                  {localErrors.lastName}
                </p>
              )}
            </div>
          </div>

          {/* e-mail + Send/Resend */}
          <div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setCode("");
                    if (localErrors.email)
                      setLocalErrors({ ...localErrors, email: "" });
                  }}
                  placeholder="Email"
                  className={`w-full px-4 py-3 border rounded-lg text-base
                             focus:outline-none focus:ring-2 focus:ring-[#C17829]
                             ${
                               localErrors.email || emailError
                                 ? "border-red-500"
                                 : "border-gray-300 focus:border-transparent"
                             }`}
                  required
                />

                {/* icon / spinner / check */}
                {checkingEmail ? (
                  <FaSpinner className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#C17829]" />
                ) : emailError ? (
                  <FaTimes className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600" />
                ) : (
                  EMAIL_REGEX.test(email) &&
                  !localErrors.email && (
                    <FaCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />
                  )
                )}
              </div>

              <Button
                type="button"
                disabled={!canSend || isSending}
                onClick={handleSend}
                className="shrink-0 px-4 py-3 bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-lg text-sm shadow-lg transition transform hover:scale-105 disabled:opacity-40"
              >
                {isSending ? (
                  <FaSpinner className="h-4 w-4 animate-spin" />
                ) : codeSent ? (
                  "Resend"
                ) : (
                  "Send Code"
                )}
              </Button>
            </div>
            {(localErrors.email || emailError) && (
              <p className="text-red-600 text-sm mt-1">
                {localErrors.email || emailError}
              </p>
            )}
          </div>

          {/* verification code */}
          {codeSent && (
            <div className="mt-4 flex gap-3 items-center">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                placeholder="6-digit code"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#C17829]"
              />
              <Button
                type="button"
                onClick={handleVerifyCode}
                disabled={code.length !== 6 || codeVerified}
                className="px-4 py-3 bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-lg text-sm shadow-lg transition transform hover:scale-105 disabled:opacity-40"
              >
                Verify
              </Button>
            </div>
          )}
          {codeError && (
            <p className="text-red-600 text-sm mt-1">{codeError}</p>
          )}

          {/* Password */}
          <div>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base
                           focus:outline-none focus:ring-2 focus:ring-[#C17829]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
              <button
                type="button"
                className="group absolute inset-y-0 right-4 flex items-center text-gray-400"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <FaEyeSlash /> : <FaEye />}
                <Tooltip text={showPw ? "Hide password" : "Show password"} />
              </button>
            </div>

            {/* checklist */}
            <ul className="mt-2 text-sm space-y-0.5">
              <li
                className={`flex items-center ${
                  hasUppercase ? "text-green-600" : "text-gray-500"
                }`}
              >
                <span className="mr-2">{hasUppercase ? "✓" : "○"}</span>
                Uppercase letter
              </li>
              <li
                className={`flex items-center ${
                  hasNumber ? "text-green-600" : "text-gray-500"
                }`}
              >
                <span className="mr-2">{hasNumber ? "✓" : "○"}</span>
                Number
              </li>
              <li
                className={`flex items-center ${
                  hasSymbol ? "text-green-600" : "text-gray-500"
                }`}
              >
                <span className="mr-2">{hasSymbol ? "✓" : "○"}</span>
                Special character
              </li>
              <li
                className={`flex items-center ${
                  hasMinLength ? "text-green-600" : "text-gray-500"
                }`}
              >
                <span className="mr-2">{hasMinLength ? "✓" : "○"}</span>
                ≥ 8 characters
              </li>
            </ul>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={
              !isAllValid ||
              !codeVerified ||
              Object.values(localErrors).some(Boolean)
            }
            className="w-full inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-full font-semibold text-base shadow-lg transition transform hover:scale-105 disabled:opacity-40"
          >
            Create Account
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════ Master Auth component ═══════════════════ */
export default function Auth() {
  /* core state */
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [loginCredError, setLoginCredError] = useState<string | null>(
    null
  );
  const [signupEmailError, setSignupEmailError] = useState<
    string | null
  >(null);

  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  /* derived */
  const canSend =
    !codeSent && EMAIL_REGEX.test(email) && !signupEmailError;

  const navigate = useNavigate();
  const location = useLocation();

  /* live e-mail availability check */
  useEffect(() => {
    if (!EMAIL_REGEX.test(email)) {
      setSignupEmailError(null);
      return;
    }

    let stale = false;
    setCheckingEmail(true);
    const timer = setTimeout(async () => {
      try {
        await checkEmailExists(email);
        if (!stale) setSignupEmailError(null);
      } catch (e: any) {
        if (!stale) setSignupEmailError(e.message);
      } finally {
        if (!stale) setCheckingEmail(false);
      }
    }, 400); // debounce
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [email]);

  /* send-verification-code wrapper */
  const handleSendCodeWrapped = async (): Promise<boolean> => {
    setCodeError(null);
    setSignupEmailError(null);
    setIsSending(true);
    try {
      await sendVerificationCode(email);
      setCodeSent(true);
      return true;
    } catch (e: any) {
      if (e.message?.toLowerCase().includes("email already registered")) {
        setSignupEmailError("Email already registered");
      } else if (e.status === 429) {
        setCodeError("E-mail quota reached – please try again tomorrow.");
      } else {
        setCodeError(e.message || "Could not send e-mail.");
      }
      return false;
    } finally {
      setIsSending(false);
    }
  };

  /* verify code */
  const handleVerifyCode = async () => {
    setCodeError(null);
    try {
      await verifyEmailCode(email, code);
      setCodeVerified(true);
    } catch (e: any) {
      setCodeError(e.message);
    }
  };

  /* sign up */
  const handleSignUp = async () => {
    setError(null);
    setSignupEmailError(null);
    try {
      await register({
        first_name: firstName,
        last_name: lastName,
        email,
        hashed_password: password,
      });
      navigate("/dashboard");
    } catch (e: any) {
      if (e.message?.toLowerCase().includes("email already registered"))
        setSignupEmailError("Email already registered");
      else setError(e.message);
    }
  };

  /* sign in */
  const handleSignIn = async () => {
    setError(null);
    setLoginCredError(null);
    setIsSigningIn(true);
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (e: any) {
      if (e.message?.toLowerCase().includes("invalid email or password"))
        setLoginCredError("Invalid e-mail / password combination");
      else setError(e.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  /* URL param sync */
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

  /* password live validation */
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const hasMinLength = password.length >= 8;
  const isAllValid =
    hasUppercase && hasNumber && hasSymbol && hasMinLength;

  /* JSX */
  return (
    <main className="bg-gradient-to-r from-[#f7ede1] to-white min-h-screen w-full flex items-center justify-center overflow-y-auto py-4">
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
                      setEmail={(v) => {
                        setEmail(v);
                        if (!v) {
                          setCodeSent(false);
                          setCodeVerified(false);
                          setCode("");
                          setSignupEmailError(null);
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
                      isSending={isSending}
                      handleSendCode={handleSendCodeWrapped}
                      handleVerifyCode={handleVerifyCode}
                      onSubmit={handleSignUp}
                      error={error}
                      emailError={signupEmailError}
                      checkingEmail={checkingEmail}
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
                      isSubmitting={isSigningIn}
                      error={error}
                      credError={loginCredError}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* illustration side – unchanged */}
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
                    Create an account to explore how our AI tools streamline
                    your legal tasks.
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
              {isSignUp
                ? "Already have an account?"
                : "New to our platform?"}
            </p>
            <Button
              variant="secondary"
              onClick={() => setIsSignUp((s) => !s)}
              className="inline-flex items-center justify-center text-[#C17829] rounded-full font-semibold text-sm px-6 py-2 transition hover:bg-gradient-to-r hover:from-[#C17829] hover:to-[#E3A063] hover:text-white"
            >
              {isSignUp ? "Sign In" : "Create Account"}
            </Button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
