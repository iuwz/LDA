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
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2C2C4A] mb-2">
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

        {/* Password w| eye toggle */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <label className="block text-gray-700 font-medium">Password</label>
            <a
              href="#"
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
  username: string;
  setUsername: (v: string) => void;
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
  username,
  setUsername,
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

  /* strength as percentage of rules satisfied */
  const metRules = [hasUppercase, hasNumber, hasSymbol, hasMinLength].filter(
    Boolean
  ).length;
  const strengthWidth = `${metRules * 25}%`;
  const strengthColor = isAllValid ? "bg-green-500" : "bg-yellow-400";

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#2C2C4A] mb-2">
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
        {/* Username */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Username
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C17829] focus:border-[#C17829] transition-all"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
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
              className={`${
                hasUppercase ? "text-green-600" : "text-gray-500"
              } flex items-center`}
            >
              <span className="mr-2">{hasUppercase ? "✓" : "○"}</span> Uppercase
              letter
            </p>
            <p
              className={`${
                hasNumber ? "text-green-600" : "text-gray-500"
              } flex items-center`}
            >
              <span className="mr-2">{hasNumber ? "✓" : "○"}</span> Number
            </p>
            <p
              className={`${
                hasSymbol ? "text-green-600" : "text-gray-500"
              } flex items-center`}
            >
              <span className="mr-2">{hasSymbol ? "✓" : "○"}</span> Special
              character
            </p>
            <p
              className={`${
                hasMinLength ? "text-green-600" : "text-gray-500"
              } flex items-center`}
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

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  /* ── handlers ── */
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
      await register({ username, email, hashed_password: password });
      navigate("/dashboard");
    } catch (e: any) {
      setError(e.message);
    }
  };

  /* ── URL param / state check ── */
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

  /* ── validators ── */
  const isValidEmail = (val: string) => /.+@.+\..+/.test(val.trim());
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const hasMinLength = password.length >= 8;
  const isAllValid = hasUppercase && hasNumber && hasSymbol && hasMinLength;

  /* ── JSX ── */
  return (
    <main className="bg-gradient-to-r from-[#f7ede1] to-white min-h-screen w-full flex items-center justify-center overflow-hidden fixed inset-0">
      {/* animated bubbles */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div
          className="fixed w-[400px] h-[400px] bg-[#C17829] rounded-full opacity-10 top-[-100px] left-[-100px]"
          animate={{ x: [0, 40, 0], y: [0, 40, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="fixed w-[600px] h-[600px] bg-[#2C2C4A] rounded-full opacity-5 bottom-[-200px] right-[-200px]"
          animate={{ x: [0, -50, 0], y: [0, -50, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="fixed w-[300px] h-[300px] bg-[#C17829] rounded-full opacity-5 top-[40%] right-[-100px]"
          animate={{ x: [0, -40, 0], y: [0, 60, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="fixed w-[350px] h-[350px] bg-[#2C2C4A] rounded-full opacity-5 bottom-[30%] left-[-100px]"
          animate={{ x: [0, 80, 0], y: [0, -40, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className={`fixed rounded-full bg-gradient-to-r ${
              i % 2 === 0
                ? "from-[#C17829]/10 to-[#C17829]/5"
                : "from-[#2C2C4A]/10 to-[#2C2C4A]/5"
            }`}
            style={{
              width: `${Math.random() * 100 + 20}px`,
              height: `${Math.random() * 100 + 20}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3 + 0.1,
              zIndex: 0,
            }}
            animate={{
              x: [0, Math.random() * 200 - 100, 0],
              y: [0, Math.random() * 200 - 100, 0],
              scale: [1, Math.random() * 0.4 + 0.8, 1],
            }}
            transition={{
              duration: Math.random() * 5 + 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
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
          <div className="w-full md:w-1/2 p-8 md:p-16 flex items-center justify-center z-10">
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
                      /* state */
                      username={username}
                      setUsername={setUsername}
                      email={email}
                      setEmail={setEmail}
                      password={password}
                      setPassword={setPassword}
                      /* submit */
                      onSubmit={handleSignUp}
                      error={error}
                      /* validation */
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
              {/* sign-in side */}
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
                    Join us today and discover how our AI-powered tools can
                    transform your legal workflow.
                  </p>
                  <Button
                    onClick={() => setIsSignUp(true)}
                    className="px-8 py-3 rounded-full bg-white text-[#2C2C4A] font-semibold border-2 border-white transition-all duration-300 shadow-lg hover:bg-white/90 hover:border-white/90 hover:scale-105 hover:shadow-xl"
                  >
                    Create Account
                  </Button>
                </div>
              </div>

              {/* sign-up side */}
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
                    Sign in to access your account and continue your legal
                    journey with us.
                  </p>
                  <Button
                    onClick={() => setIsSignUp(false)}
                    className="px-8 py-3 rounded-full bg-white text-[#2C2C4A] font-semibold border-2 border-white transition-all duration-300 shadow-lg hover:bg-white/90 hover:border-white/90 hover:scale-105 hover:shadow-xl"
                  >
                    Sign In
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* mobile toggle */}
          <div className="md:hidden mt-8 text-center">
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
