// src/views/pages/Auth/ResetPassword.tsx
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../../../api";
import { motion } from "framer-motion";
import { FaSpinner } from "react-icons/fa";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  // Password checks
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const hasMinLength = password.length >= 8;

  const valid = hasUppercase && hasNumber && hasSymbol && hasMinLength;

  const strengthScore = [
    hasUppercase,
    hasNumber,
    hasSymbol,
    hasMinLength,
  ].filter(Boolean).length;
  const strengthColor =
    strengthScore === 4
      ? "bg-green-500"
      : strengthScore === 3
      ? "bg-yellow-400"
      : strengthScore === 2
      ? "bg-orange-400"
      : "bg-red-400";
  const strengthWidth = `${(strengthScore / 4) * 100}%`;

  useEffect(() => {
    if (!token) return;
    setPassword("");
    setConfirm("");
    setError(null);
    setSuccess(false);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSending(true);

    if (!valid) {
      setError(
        "Password must include at least 8 characters, one uppercase letter, one number, and one special character."
      );
      setIsSending(false);
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match");
      setIsSending(false);
      return;
    }

    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/auth"), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsSending(false);
    }
  };

  if (!token) {
    return (
      <main className="bg-gradient-to-r from-[#f7ede1] to-white min-h-screen flex items-center justify-center py-12">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl text-red-600 text-center">
          <p>Invalid or missing token.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-gradient-to-r from-[#f7ede1] to-white min-h-screen flex items-center justify-center py-12">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl font-bold text-[#2C2C4A] mb-2">
            Reset Password
          </h2>
          <p className="text-gray-600 text-base">
            Create a new password for your account
          </p>
        </div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-green-600 text-center mb-8"
          >
            Password reset! Redirecting to login...
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            onSubmit={handleSubmit}
            className="space-y-5 mb-8"
          >
            {/* New Password */}
            <div>
              <label className="block text-gray-700 text-sm mb-2">
                New Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-base focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#C17829]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Rule checklist */}
            <div className="mt-1 text-sm space-y-1 bg-gray-50 p-3 rounded-lg">
              <p
                className={`${
                  hasUppercase ? "text-green-600" : "text-gray-500"
                } flex items-center`}
              >
                <span className="mr-2">{hasUppercase ? "✓" : "○"}</span>{" "}
                Uppercase letter
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
                <span className="mr-2">{hasMinLength ? "✓" : "○"}</span> At
                least 8 characters
              </p>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <div className="mt-3 h-2 w-full bg-gray-200 rounded">
                <div
                  className={`${strengthColor} h-full rounded`}
                  style={{ width: strengthWidth }}
                />
              </div>
            )}

            {/* Confirm Password */}
            <div>
              <label className="block text-gray-700 text-sm mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-base focus:outline-none focus:border-transparent focus:ring-2 focus:ring-[#C17829]"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {/* Match bar & message */}
            {confirm.length > 0 && (
              <>
                <div className="mt-1 h-2 w-full bg-gray-200 rounded">
                  <div
                    className={`h-full rounded ${
                      password === confirm ? "bg-green-500" : "bg-red-500"
                    }`}
                    style={{ width: "100%" }}
                  />
                </div>
                {password !== confirm && (
                  <p className="text-sm text-red-600 mt-1 ml-1">
                    Passwords do not match
                  </p>
                )}
              </>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSending}
              className="inline-flex items-center justify-center w-full px-8 py-3 bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-full font-semibold text-lg shadow-lg transition transform hover:scale-105 disabled:opacity-50 mt-4"
            >
              {isSending && <FaSpinner className="animate-spin mr-2" />}
              Reset Password
            </button>
          </motion.form>
        )}

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Remembered your password?{" "}
            <button
              onClick={() => navigate("/auth")}
              className="text-[#C17829] hover:text-[#ad6823] font-medium"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
