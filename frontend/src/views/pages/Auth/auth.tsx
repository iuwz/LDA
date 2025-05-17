/* ────────────────────────────────────────────────────────────────
frontend/src/views/pages/Auth/auth.tsx

RELEASE 5-j • 2025-05-17
‣ “Send Code / Resend” and “Verify” are now *exactly*
  112 × 44 px (Tailwind `w-28 h-11`).  
‣ Everything else unchanged from 5-i.
────────────────────────────────────────────────────────────────── */

import { useState, useEffect, FocusEvent } from "react";
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
  FaCheck,
  FaTimes,
  FaCircleNotch,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../../components/common/button";
import myImage from "../../../assets/images/pic.jpg";

/* ═════════════════════ Validation helpers ═════════════════════ */
const nameRegex = /^[A-Za-z]+$/;
const isValidName = (s: string) => nameRegex.test(s);

function isValidEmail(e: string) {
  if (!e || e.length > 320 || /\s/.test(e)) return false;
  const [l, d] = e.split("@");
  if (!l || !d || l.length > 64 || d.length > 255) return false;
  if (d.indexOf(".") === -1) return false;
  if (!/^[A-Za-z0-9._+-]+$/.test(l)) return false;
  if (!/^[A-Za-z0-9.-]+$/.test(d)) return false;
  if (!/^[A-Za-z0-9]/.test(l) || !/[A-Za-z0-9]$/.test(l)) return false;
  if (!/^[A-Za-z0-9]/.test(d) || !/[A-Za-z0-9]$/.test(d)) return false;
  if (l.includes("..") || d.includes("..")) return false;
  const tld = d.split(".").pop()!;
  return /^[A-Za-z]{2,}$/.test(tld);
}

/* ═════════════════════ Tooltip ═════════════════════ */
const Tooltip = ({ text }: { text: string }) => (
  <span className="pointer-events-none absolute right-full mr-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-800 text-white text-xs px-2 py-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
    {text}
    <span className="absolute left-full top-1/2 -translate-y-1/2 border-6 border-y-transparent border-r-transparent border-l-gray-800" />
  </span>
);

/* ═════════════════════ Password rules ═════════════════════ */
function PasswordSection({
  password,
  setPassword,
  showPw,
  setShowPw,
  hasUppercase,
  hasNumber,
  hasSymbol,
  hasMinLength,
}: any) {
  const open = password.length > 0;

  return (
    <div>
      <div className="relative">
        <input
          type={showPw ? "text" : "password"}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#C17829]"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button
          type="button"
          className="group absolute inset-y-0 right-4 flex items-center text-gray-400"
          onClick={() => setShowPw((s: boolean) => !s)}
          aria-label={showPw ? "Hide password" : "Show password"}
        >
          {showPw ? <FaEyeSlash /> : <FaEye />}
          <Tooltip text={showPw ? "Hide password" : "Show password"} />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="rules"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.45 } }}
            exit={{ opacity: 0, y: -6, transition: { duration: 0.3 } }}
            className="mt-3 rounded-lg bg-gray-100 px-4 py-3"
          >
            <ul className="text-sm space-y-1">
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
                <span className="mr-2">{hasMinLength ? "✓" : "○"}</span>≥ 8
                characters
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═════════════════════ Sign-Up form ═════════════════════ */
function SignUpForm(props: any) {
  const {
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
    isSending,
    handleSendCode,
    handleVerifyCode,
    onSubmit,
    globalError,
    emailError,
    checkingEmail,
    hasUppercase,
    hasNumber,
    hasSymbol,
    hasMinLength,
    isAllValid,
    canSend,
  } = props;

  const [showPw, setShowPw] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [firstTouched, setFirstTouched] = useState(false);
  const [lastTouched, setLastTouched] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const firstErr =
    firstName.trim() === "" && (attempted || firstTouched)
      ? "First name is required"
      : firstName && !isValidName(firstName)
      ? "Invalid name"
      : "";
  const lastErr =
    lastName.trim() === "" && (attempted || lastTouched)
      ? "Last name is required"
      : lastName && !isValidName(lastName)
      ? "Invalid name"
      : "";
  const liveEmailErr =
    email && !isValidEmail(email) ? "Write a valid e-mail" : "";

  useEffect(() => {
    if (globalError || emailError || codeError) setShowSuccess(false);
  }, [globalError, emailError, codeError]);

  const blur =
    (fn: (b: boolean) => void) => (e: FocusEvent<HTMLInputElement>) => {
      if (!e.target.value.trim()) fn(true);
    };

  const send = async () => {
    setAttempted(true);
    if (firstErr || lastErr || liveEmailErr) return;
    const ok = await handleSendCode();
    setShowSuccess(ok);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (firstErr || lastErr || liveEmailErr) return;
    onSubmit();
  };

  return (
    <div className="min-h-[480px] flex flex-col justify-between">
      <div>
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl font-bold text-[#2C2C4A] mb-2">
            Create&nbsp;Account
          </h2>
          <p className="text-gray-600 text-base">Join us today</p>
        </div>

        {globalError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 rounded border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700"
          >
            {globalError}
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

        <form className="space-y-5" onSubmit={submit}>
          {/* names */}
          <div className="flex gap-3">
            <div className="relative w-1/2">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={blur(setFirstTouched)}
                placeholder="First name"
                className={`w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#C17829] ${
                  firstErr
                    ? "border-red-500"
                    : "border-gray-300 focus:border-transparent"
                }`}
              />
              {!firstErr && firstName && (
                <FaCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />
              )}
              {firstErr && (
                <p className="text-red-600 text-xs mt-1">{firstErr}</p>
              )}
            </div>

            <div className="relative w-1/2">
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={blur(setLastTouched)}
                placeholder="Last name"
                className={`w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#C17829] ${
                  lastErr
                    ? "border-red-500"
                    : "border-gray-300 focus:border-transparent"
                }`}
              />
              {!lastErr && lastName && (
                <FaCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />
              )}
              {lastErr && (
                <p className="text-red-600 text-xs mt-1">{lastErr}</p>
              )}
            </div>
          </div>

          {/* email row */}
          <div>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setCode("");
                  }}
                  placeholder="Email"
                  className={`w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#C17829] ${
                    liveEmailErr || emailError
                      ? "border-red-500"
                      : "border-gray-300 focus:border-transparent"
                  }`}
                />
                {emailError || liveEmailErr ? (
                  <FaTimes className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600" />
                ) : !checkingEmail && isValidEmail(email) ? (
                  <FaCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />
                ) : null}
              </div>

              {/* Send / Resend button (112 × 44) */}
              <Button
                type="button"
                disabled={!canSend || isSending}
                onClick={send}
                className="shrink-0 w-28 h-11 flex items-center justify-center bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-lg text-sm shadow-lg transition transform hover:scale-105 disabled:opacity-40"
              >
                {checkingEmail || isSending ? (
                  <FaCircleNotch className="h-4 w-4 animate-spin" />
                ) : codeSent ? (
                  "Resend"
                ) : (
                  "Send Code"
                )}
              </Button>
            </div>

            {(liveEmailErr || emailError) && (
              <p className="text-red-600 text-sm mt-1">
                {emailError || liveEmailErr}
              </p>
            )}
          </div>

          {/* verification */}
          {codeSent && (
            <>
              <div className="flex gap-3 items-center mt-2">
                <div className="relative flex-1">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    placeholder="6-digit code"
                    className={`w-full px-4 py-3 border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-[#C17829] ${
                      codeError && !codeVerified
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {codeError && !codeVerified ? (
                    <FaTimes className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600" />
                  ) : codeVerified ? (
                    <FaCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />
                  ) : null}
                </div>

                {/* Verify button (112 × 44) */}
                <Button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={code.length !== 6 || codeVerified}
                  className="w-28 h-11 flex items-center justify-center bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-lg text-sm shadow-lg transition transform hover:scale-105 disabled:opacity-40"
                >
                  Verify
                </Button>
              </div>

              {codeError && !codeVerified && (
                <p className="-mt-2 mb-0 text-red-600 text-sm">Invalid code</p>
              )}
            </>
          )}

          {/* password section */}
          <PasswordSection
            password={password}
            setPassword={setPassword}
            showPw={showPw}
            setShowPw={setShowPw}
            hasUppercase={hasUppercase}
            hasNumber={hasNumber}
            hasSymbol={hasSymbol}
            hasMinLength={hasMinLength}
          />

          <Button
            type="submit"
            disabled={
              !isAllValid ||
              !codeVerified ||
              firstErr !== "" ||
              lastErr !== "" ||
              liveEmailErr !== ""
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

/* ═════════════════════ Sign-In form ═════════════════════ */
function SignInForm({
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  isSubmitting,
  error,
  credError,
}: {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  error?: string | null;
  credError?: string | null;
}) {
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="min-h-[440px] flex flex-col justify-between">
      <div>
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl font-bold text-[#2C2C4A] mb-2">
            Sign In
          </h2>
          <p className="text-gray-600 text-base">Access your account</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
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
          <div>
            <label className="block text-gray-700 mb-2 text-sm">Email</label>
            <div className="relative">
              <input
                type="email"
                className={`w-full px-4 py-3 border rounded-lg shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-[#C17829] ${
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

          <div>
            <label className="block text-gray-700 mb-2 text-sm">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-[#C17829] ${
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
                Forgot Password?
              </a>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-full font-semibold text-base shadow-lg transition transform hover:scale-105 disabled:opacity-40"
          >
            {isSubmitting ? (
              <FaCircleNotch className="animate-spin h-4 w-4" />
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ═════════════════════ Auth master component ═════════════════════ */
export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loginCredError, setLoginCredError] = useState<string | null>(null);
  const [signupEmailError, setSignupEmailError] = useState<string | null>(null);

  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const canSend =
    !codeSent && isValidEmail(email) && !signupEmailError && !checkingEmail;

  /* live email availability */
  useEffect(() => {
    if (!isValidEmail(email)) {
      setSignupEmailError(null);
      return;
    }
    let stale = false;
    setCheckingEmail(true);
    const t = setTimeout(async () => {
      try {
        await checkEmailExists(email);
        if (!stale) setSignupEmailError(null);
      } catch (e: any) {
        if (!stale) setSignupEmailError(e.message);
      } finally {
        if (!stale) setCheckingEmail(false);
      }
    }, 400);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [email]);

  /* send code */
  const handleSendCode = async () => {
    setCodeError(null);
    setSignupEmailError(null);
    setIsSending(true);
    try {
      await sendVerificationCode(email);
      setCodeSent(true);
      return true;
    } catch (e: any) {
      if (e.message?.toLowerCase().includes("email already registered"))
        setSignupEmailError("Email already registered");
      else if (e.status === 429)
        setCodeError("E-mail quota reached – please try again tomorrow.");
      else setCodeError(e.message || "Could not send e-mail.");
      return false;
    } finally {
      setIsSending(false);
    }
  };

  /* verify */
  const handleVerifyCode = async () => {
    setCodeError(null);
    try {
      await verifyEmailCode(email, code);
      setCodeVerified(true);
    } catch (e: any) {
      setCodeError(e.message);
    }
  };

  /* sign-up */
  const handleSignUp = async () => {
    setGlobalError(null);
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
      else setGlobalError(e.message);
    }
  };

  /* sign-in */
  const handleSignIn = async () => {
    setGlobalError(null);
    setLoginCredError(null);
    setIsSigningIn(true);
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (e: any) {
      if (e.message?.toLowerCase().includes("invalid email or password"))
        setLoginCredError("Invalid e-mail / password combination");
      else setGlobalError(e.message);
    } finally {
      setIsSigningIn(false);
    }
  };

  /* ?form param sync */
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const f = q.get("form");
    if (f === "login") setIsSignUp(false);
    else if (f === "register") setIsSignUp(true);
    else if (location.state && typeof location.state === "object") {
      const s = location.state as { isSignUp?: boolean };
      if (s.isSignUp !== undefined) setIsSignUp(s.isSignUp);
    }
  }, [location]);

  /* password flags */
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const hasMinLength = password.length >= 8;
  const isAllValid = hasUppercase && hasNumber && hasSymbol && hasMinLength;

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
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      codeSent={codeSent}
                      code={code}
                      setCode={setCode}
                      codeVerified={codeVerified}
                      codeError={codeError}
                      isSending={isSending}
                      handleSendCode={handleSendCode}
                      handleVerifyCode={handleVerifyCode}
                      onSubmit={handleSignUp}
                      globalError={globalError}
                      emailError={signupEmailError}
                      checkingEmail={checkingEmail}
                      hasUppercase={hasUppercase}
                      hasNumber={hasNumber}
                      hasSymbol={hasSymbol}
                      hasMinLength={hasMinLength}
                      isAllValid={isAllValid}
                      canSend={canSend}
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
                      error={globalError}
                      credError={loginCredError}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* illustration side */}
          <div className="hidden md:block md:w-1/2 bg-cover bg-center relative overflow-hidden">
            <motion.div
              className="absolute inset-0 z-10 flex"
              animate={{ x: isSignUp ? "-100%" : "0%" }}
              transition={{
                duration: 0.6,
                ease: [0.43, 0.13, 0.23, 0.96],
              }}
            >
              <PromoCard
                title="New to our platform?"
                subtitle="Create an account to explore how our AI tools streamline your legal tasks."
                button="Create Account"
                onClick={() => setIsSignUp(true)}
                gradient="from-[#2C2C4A]/70 to-[#C17829]/50"
              />
              <PromoCard
                title="Already have an account?"
                subtitle="Sign in to continue your legal journey with us."
                button="Sign In"
                onClick={() => setIsSignUp(false)}
                gradient="from-[#C17829]/50 to-[#2C2C4A]/70"
              />
            </motion.div>
          </div>

          {/* mobile toggle */}
          <div className="md:hidden w-full p-4 text-center border-t border-gray-100">
            <p className="text-gray-600 mb-3 text-sm">
              {isSignUp ? "Already have an account?" : "New to our platform?"}
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

/* ═════════════════════ Promo card ═════════════════════ */
function PromoCard({
  title,
  subtitle,
  button,
  onClick,
  gradient,
}: {
  title: string;
  subtitle: string;
  button: string;
  onClick: () => void;
  gradient: string;
}) {
  return (
    <div className="w-full flex-shrink-0 h-full relative">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${myImage})` }}
      />
      <div className={`absolute inset-0 bg-gradient-to-r ${gradient}`} />
      <div className="relative h-full flex flex-col items-center justify-center text-center p-12 text-white">
        <h2 className="font-serif text-3xl font-bold mb-6">{title}</h2>
        <p className="text-lg mb-8 opacity-90">{subtitle}</p>
        <Button
          onClick={onClick}
          className="px-8 py-3 rounded-full bg-white text-[#2C2C4A] font-semibold border-2 border-white transition-all shadow-lg hover:bg-white/90 hover:scale-105"
        >
          {button}
        </Button>
      </div>
    </div>
  );
}
