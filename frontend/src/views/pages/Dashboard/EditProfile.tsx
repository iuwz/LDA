// src/views/pages/Profile/EditProfile.tsx
import React, { useState, useEffect, FocusEvent } from "react";
import {
  FaUser,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaPencilAlt,
  FaCheck,
  FaCircleNotch,
} from "react-icons/fa";
import { motion } from "framer-motion";
import {
  sendVerificationCode,
  verifyEmailCode,
  checkEmailExists,
} from "../../../api";

/* ───────── helpers ───────── */
const isValidEmail = (val: string) => {
  if (!val || val.length > 320 || /\s/.test(val)) return false;
  const [l, d] = val.split("@");
  if (!l || !d || l.length > 64 || d.length > 255) return false;
  if (d.indexOf(".") === -1) return false;
  if (!/^[A-Za-z0-9._+-]+$/.test(l)) return false;
  if (!/^[A-Za-z0-9.-]+$/.test(d)) return false;
  if (!/^[A-Za-z0-9]/.test(l) || !/[A-Za-z0-9]$/.test(l)) return false;
  if (!/^[A-Za-z0-9]/.test(d) || !/[A-Za-z0-9]$/.test(d)) return false;
  if (l.includes("..") || d.includes("..")) return false;
  const tld = d.split(".").pop()!;
  return /^[A-Za-z]{2,}$/.test(tld);
};

const passwordCriteria = (password: string) => ({
  hasUppercase: /[A-Z]/.test(password),
  hasNumber: /\d/.test(password),
  hasSymbol: /[^A-Za-z0-9]/.test(password),
  hasMinLength: password.length >= 8,
});

/* ───────── main component ───────── */
const EditProfile: React.FC = () => {
  /* ─── profile state ─── */
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [origEmail, setOrigEmail] = useState("");
  const [email, setEmail] = useState("");

  /* ─── passwords ─── */
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  /* ─── verification flow ─── */
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [codeVerified, setCodeVerified] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  /* ─── misc ui state ─── */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /* ─── load current profile ─── */
  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/auth/me`,
      { credentials: "include" }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data) => {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setEmail(data.email || "");
        setOrigEmail(data.email || "");
      })
      .catch((err) => setErrorMessage(err.message));
  }, []);

  /* ─── password rules ─── */
  const { hasUppercase, hasNumber, hasSymbol, hasMinLength } =
    passwordCriteria(newPassword);
  const isPasswordValid =
    hasUppercase && hasNumber && hasSymbol && hasMinLength;

  /* ─── cooldown tick ─── */
  useEffect(() => {
    if (cooldown === 0) return;
    const id = setInterval(() => setCooldown((t) => Math.max(t - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  /* ─── live e-mail availability check (only if changed) ─── */
  useEffect(() => {
    if (email === origEmail || !isValidEmail(email)) {
      setEmailError(null);
      return;
    }
    let stale = false;
    setCheckingEmail(true);
    const t = setTimeout(async () => {
      try {
        await checkEmailExists(email);
        if (!stale) setEmailError(null);
      } catch (e: any) {
        if (!stale) setEmailError(e.message);
      } finally {
        if (!stale) setCheckingEmail(false);
      }
    }, 400);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [email, origEmail]);

  /* ─── helpers ─── */
  const canSend =
    email !== origEmail &&
    isValidEmail(email) &&
    !emailError &&
    !checkingEmail &&
    cooldown === 0;

  const sendCode = async () => {
    setCodeError(null);
    setIsSending(true);
    try {
      await sendVerificationCode(email);
      setCodeSent(true);
      setCodeVerified(false);
      setCooldown(60);
    } catch (e: any) {
      if (e.message?.toLowerCase().includes("already registered"))
        setEmailError("Email already registered");
      else if (e.status === 429)
        setCodeError("E-mail quota reached – please try again tomorrow.");
      else setCodeError(e.message || "Could not send e-mail.");
    } finally {
      setIsSending(false);
    }
  };

  const verifyCode = async () => {
    setCodeError(null);
    try {
      await verifyEmailCode(email, code);
      setCodeVerified(true);
    } catch (e: any) {
      setCodeError(e.message || "Invalid code");
    }
  };

  /* ─── submit profile ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    /* validation */
    if (!firstName.trim() || !lastName.trim() || !isValidEmail(email)) {
      setErrorMessage("Please fill in all fields with valid values.");
      return;
    }
    if (email !== origEmail && !codeVerified) {
      setErrorMessage("Please verify your new e-mail address first.");
      return;
    }
    if (emailError) {
      setErrorMessage(emailError);
      return;
    }
    if (showChangePassword) {
      if (!currentPassword) {
        setErrorMessage("Please enter your current password.");
        return;
      }
      if (!isPasswordValid) {
        setErrorMessage(
          "New password must be ≥ 8 chars and include uppercase, number, symbol."
        );
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage("New passwords do not match.");
        return;
      }
    }

    /* patch */
    setIsSubmitting(true);
    try {
      const body: any = {
        first_name: firstName,
        last_name: lastName,
        email,
      };
      if (showChangePassword) {
        body.current_password = currentPassword;
        body.new_password = newPassword;
      }

      const res = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/auth/me`,
        {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.detail || res.statusText);
      }

      setSuccessMessage("Profile updated successfully!");
      setOrigEmail(email);
      setCodeSent(false);
      setCode("");
      setCodeVerified(false);
      setIsEditing(false);
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── password strength meter ─── */
  const metRules = [hasUppercase, hasNumber, hasSymbol, hasMinLength].filter(
    Boolean
  ).length;
  const strengthWidth = `${(metRules / 4) * 100}%`;
  const strengthColor = isPasswordValid ? "bg-green-500" : "bg-yellow-400";

  /* ─── focus helper for names ─── */
  const blur =
    (fn: (b: boolean) => void) => (e: FocusEvent<HTMLInputElement>) => {
      if (!e.target.value.trim()) fn(true);
    };

  /* ─── rendering ─── */
  return (
    <div className="space-y-8">
      {/* ─── header card ─── */}
      <header className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="h-2 bg-gradient-to-r from-[color:var(--accent-dark)] to-[color:var(--accent-light)]" />
        <div className="flex items-center gap-4 p-6">
          <span className="rounded-full bg-[color:var(--accent-light)] p-3 text-[color:var(--accent-dark)]">
            <FaUser size={22} />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-bold text-[color:var(--brand-dark)]">
              Profile
            </h1>
            <p className="text-gray-600">
              {isEditing
                ? "Editing your account info"
                : "View your account info"}
            </p>
          </div>
        </div>
      </header>

      {/* ─── banners ─── */}
      {errorMessage && (
        <div className="rounded-md bg-red-100 p-4 text-red-800">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-md bg-green-100 p-4 text-green-800">
          {successMessage}
        </div>
      )}

      {/* ─── form card ─── */}
      <section className="relative rounded-xl border bg-white shadow-sm p-6">
        <button
          onClick={() => {
            setIsEditing(!isEditing);
            setErrorMessage(null);
            setSuccessMessage(null);
            setShowChangePassword(false);
            setCodeSent(false);
            setCodeVerified(false);
            setEmailError(null);
          }}
          className="absolute top-4 right-4 text-[color:var(--accent-dark)] hover:text-[color:var(--accent-light)]"
        >
          <FaPencilAlt size={18} />
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ─── names ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-3 focus:ring focus:ring-[color:var(--accent-dark)] outline-none"
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-md">{firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-3 focus:ring focus:ring-[color:var(--accent-dark)] outline-none"
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-md">{lastName}</p>
              )}
            </div>
          </div>

          {/* ─── email row ─── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>

            {isEditing ? (
              <>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setCode("");
                        setCodeSent(false);
                        setCodeVerified(false);
                      }}
                      placeholder="you@example.com"
                      className={`w-full rounded-md border p-3 text-base focus:ring focus:ring-[color:var(--accent-dark)] outline-none ${
                        emailError ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {emailError ? (
                      <FaTimes className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600" />
                    ) : email !== origEmail &&
                      isValidEmail(email) &&
                      !checkingEmail ? (
                      <FaCheck className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />
                    ) : null}
                  </div>

                  {/* Send / Resend button */}
                  {email !== origEmail && (
                    <button
                      type="button"
                      disabled={!canSend || isSending}
                      onClick={sendCode}
                      className="w-28 h-11 shrink-0 flex items-center justify-center rounded-lg bg-gradient-to-r from-[color:var(--accent-dark)] to-[color:var(--accent-light)] text-white text-sm shadow-lg transition hover:scale-105 disabled:opacity-40"
                    >
                      {isSending ? (
                        <FaCircleNotch className="h-4 w-4 animate-spin" />
                      ) : cooldown > 0 ? (
                        `Resend (${cooldown})`
                      ) : codeSent ? (
                        "Resend"
                      ) : (
                        "Send Code"
                      )}
                    </button>
                  )}
                </div>

                {emailError && (
                  <p className="text-red-600 text-sm mt-1">{emailError}</p>
                )}
              </>
            ) : (
              <p className="p-3 bg-gray-50 rounded-md">{email}</p>
            )}
          </div>

          {/* ─── verification input ─── */}
          {isEditing && email !== origEmail && codeSent && (
            <>
              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    maxLength={6}
                    placeholder="6-digit code"
                    className={`w-full rounded-md border p-3 text-base focus:ring focus:ring-[color:var(--accent-dark)] outline-none ${
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

                <button
                  type="button"
                  onClick={verifyCode}
                  disabled={code.length !== 6 || codeVerified}
                  className="w-28 h-11 flex items-center justify-center rounded-lg bg-gradient-to-r from-[color:var(--accent-dark)] to-[color:var(--accent-light)] text-white text-sm shadow-lg transition hover:scale-105 disabled:opacity-40"
                >
                  Verify
                </button>
              </div>

              {codeError && !codeVerified && (
                <p className="-mt-2 text-red-600 text-sm">Invalid code</p>
              )}
              {codeVerified && (
                <p className="-mt-2 text-green-600 text-sm">
                  Verification successful ✓
                </p>
              )}
            </>
          )}

          {/* ─── password change ─── */}
          {isEditing && (
            <>
              <div className="pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="text-sm text-[color:var(--accent-dark)] hover:underline"
                >
                  {showChangePassword
                    ? "Cancel Password Change"
                    : "Change Password"}
                </button>
              </div>

              {showChangePassword && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-3 outline-none focus:ring focus:ring-[color:var(--accent-dark)]"
                    />
                  </div>

                  {/* new password */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-3 pr-10 outline-none focus:ring focus:ring-[color:var(--accent-dark)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-9 text-gray-400"
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>

                    {/* rules */}
                    <div className="mt-2 text-xs space-y-1">
                      <p
                        className={
                          hasUppercase ? "text-green-600" : "text-gray-500"
                        }
                      >
                        {hasUppercase ? "✓" : "○"} Uppercase letter
                      </p>
                      <p
                        className={
                          hasNumber ? "text-green-600" : "text-gray-500"
                        }
                      >
                        {hasNumber ? "✓" : "○"} Number
                      </p>
                      <p
                        className={
                          hasSymbol ? "text-green-600" : "text-gray-500"
                        }
                      >
                        {hasSymbol ? "✓" : "○"} Symbol
                      </p>
                      <p
                        className={
                          hasMinLength ? "text-green-600" : "text-gray-500"
                        }
                      >
                        {hasMinLength ? "✓" : "○"} ≥ 8 characters
                      </p>
                    </div>

                    {/* strength bar */}
                    {newPassword.length > 0 && (
                      <div className="mt-3 h-2 w-full bg-gray-200 rounded">
                        <div
                          className={`h-full rounded ${strengthColor}`}
                          style={{ width: strengthWidth }}
                        />
                      </div>
                    )}
                  </div>

                  {/* confirm */}
                  <div className="relative md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-md border border-gray-300 p-3 pr-10 outline-none focus:ring focus:ring-[color:var(--accent-dark)]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-9 text-gray-400"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ─── action buttons ─── */}
          {isEditing && (
            <div className="flex items-center space-x-4 pt-4 border-t">
              <motion.button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-md bg-[color:var(--accent-dark)] px-6 py-2 text-white shadow-sm hover:bg-[color:var(--accent-light)] transition disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isSubmitting ? (
                  <FaCircleNotch className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <FaSave /> Save Changes
                  </>
                )}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setShowChangePassword(false);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setEmail(origEmail);
                  setCodeSent(false);
                  setCodeVerified(false);
                  setEmailError(null);
                }}
                className="flex items-center gap-2 rounded-md bg-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-300 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaTimes /> Cancel
              </motion.button>
            </div>
          )}
        </form>
      </section>
    </div>
  );
};

export default EditProfile;
