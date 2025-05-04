import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaPencilAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";

const isValidEmail = (val: string) => /.+@.+\..+/.test(val.trim());
const passwordCriteria = (password: string) => ({
  hasUppercase: /[A-Z]/.test(password),
  hasNumber: /\d/.test(password),
  hasSymbol: /[^A-Za-z0-9]/.test(password),
  hasMinLength: password.length >= 8,
});

const EditProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/auth/me`,
      {
        credentials: "include",
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load profile");
        return res.json();
      })
      .then((data) => {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setEmail(data.email || "");
      })
      .catch((err) => setErrorMessage(err.message));
  }, []);

  const { hasUppercase, hasNumber, hasSymbol, hasMinLength } =
    passwordCriteria(newPassword);
  const isPasswordValid =
    hasUppercase && hasNumber && hasSymbol && hasMinLength;
  const isFormValid =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    isValidEmail(email) &&
    (!showChangePassword ||
      (currentPassword.trim() !== "" &&
        isPasswordValid &&
        newPassword === confirmPassword));

  const metRulesCount = [
    hasUppercase,
    hasNumber,
    hasSymbol,
    hasMinLength,
  ].filter(Boolean).length;
  const strengthWidth = `${(metRulesCount / 4) * 100}%`;
  const strengthColor = isPasswordValid ? "bg-green-500" : "bg-yellow-400";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!firstName.trim() || !lastName.trim() || !isValidEmail(email)) {
      setErrorMessage("Please fill in all fields with valid values.");
      return;
    }
    if (showChangePassword) {
      if (!currentPassword) {
        setErrorMessage("Please enter your current password.");
        return;
      }
      if (!isPasswordValid) {
        setErrorMessage(
          "New password must be at least 8 characters and include uppercase, number, and symbol."
        );
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMessage("New passwords do not match.");
        return;
      }
    }
    setIsSubmitting(true);
    try {
      const body: any = { first_name: firstName, last_name: lastName, email };
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

  return (
    <div className="space-y-8">
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
      <section className="relative rounded-xl border bg-white shadow-sm p-6">
        <button
          onClick={() => {
            setIsEditing(!isEditing);
            setErrorMessage(null);
            setSuccessMessage(null);
            setShowChangePassword(false);
          }}
          className="absolute top-4 right-4 text-[color:var(--accent-dark)] hover:text-[color:var(--accent-light)]"
        >
          <FaPencilAlt size={18} />
        </button>
        <form onSubmit={handleSubmit} className="space-y-6">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-3 focus:ring focus:ring-[color:var(--accent-dark)] outline-none"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-md">{email}</p>
            )}
          </div>
          {isEditing && (
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
          )}
          {isEditing && showChangePassword && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-3 focus:ring focus:ring-[color:var(--accent-dark)] outline-none"
                />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-3 pr-10 focus:ring focus:ring-[color:var(--accent-dark)] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-9 text-gray-400"
                >
                  {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
                <div className="mt-2 text-xs space-y-1">
                  <p
                    className={
                      hasUppercase ? "text-green-600" : "text-gray-500"
                    }
                  >
                    {hasUppercase ? "✓" : "○"} Uppercase letter
                  </p>
                  <p className={hasNumber ? "text-green-600" : "text-gray-500"}>
                    {hasNumber ? "✓" : "○"} Number
                  </p>
                  <p className={hasSymbol ? "text-green-600" : "text-gray-500"}>
                    {hasSymbol ? "✓" : "○"} Symbol
                  </p>
                  <p
                    className={
                      hasMinLength ? "text-green-600" : "text-gray-500"
                    }
                  >
                    {hasMinLength ? "✓" : "○"} At least 8 characters
                  </p>
                </div>
                {newPassword.length > 0 && (
                  <div className="mt-3 h-2 w-full bg-gray-200 rounded">
                    <div
                      className={`h-full rounded ${strengthColor}`}
                      style={{ width: strengthWidth }}
                    />
                  </div>
                )}
              </div>
              <div className="relative md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-3 pr-10 focus:ring focus:ring-[color:var(--accent-dark)] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-gray-400"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          )}
          {isEditing && (
            <div className="flex items-center space-x-4 pt-4 border-t">
              <motion.button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="flex items-center gap-2 rounded-md bg-[color:var(--accent-dark)] px-6 py-2 text-white shadow-sm hover:bg-[color:var(--accent-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaSave /> Save Changes
              </motion.button>
              <motion.button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setShowChangePassword(false);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="flex items-center gap-2 rounded-md bg-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-300 transition-colors"
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
