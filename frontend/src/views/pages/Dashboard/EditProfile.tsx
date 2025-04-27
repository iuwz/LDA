// src/views/pages/Dashboard/EditProfile.tsx

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

const EditProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);

  // Basic info
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [phone, setPhone] = useState("");

  // Password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Preview profile pic
  useEffect(() => {
    if (!profilePic) return setPreviewUrl(null);
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(profilePic);
  }, [profilePic]);

  const handlePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditing) return;
    const file = e.target.files?.[0] ?? null;
    setProfilePic(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    setErrorMessage(null);
    if (password && password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((res) => setTimeout(res, 1500));
      setSuccessMessage("Profile updated successfully!");
      setIsEditing(false);
    } catch {
      setErrorMessage("Failed to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
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

      {/* Alerts */}
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

      {/* Form/View Section with pencil inside */}
      <section className="relative rounded-xl border bg-white shadow-sm p-6">
        {/* Pencil Button */}
        <button
          onClick={() => setIsEditing((v) => !v)}
          className="absolute top-4 right-4 text-[color:var(--accent-dark)] hover:text-[color:var(--accent-light)]"
          aria-label={isEditing ? "Cancel editing" : "Edit profile"}
        >
          <FaPencilAlt size={18} />
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-gray-100">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <FaUser className="h-full w-full text-gray-300 p-4" />
              )}
            </div>
            {isEditing && (
              <label className="cursor-pointer text-sm text-[color:var(--accent-dark)] hover:underline">
                Change Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePicChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name
            </label>
            {isEditing ? (
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 p-3 focus:ring focus:ring-[color:var(--accent-dark)] outline-none"
              />
            ) : (
              <p className="p-3 bg-gray-50 rounded-md">{name}</p>
            )}
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address
              </label>
              {isEditing ? (
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-3 focus:ring focus:ring-[color:var(--accent-dark)] outline-none"
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-md">{email}</p>
              )}
            </div>
            {/* Phone */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Phone Number
              </label>
              {isEditing ? (
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(123) 456-7890"
                  className="w-full rounded-md border border-gray-300 p-3 focus:ring focus:ring-[color:var(--accent-dark)] outline-none"
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded-md">{phone || "—"}</p>
              )}
            </div>
          </div>

          {/* Password Fields (edit only) */}
          {isEditing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  New Password
                </label>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-3 pr-10 focus:ring focus:ring-[color:var(--accent-dark)] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-9 text-gray-400"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div className="relative">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-gray-300 p-3 pr-10 focus:ring focus:ring-[color:var(--accent-dark)] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-9 text-gray-400"
                >
                  {showConfirm ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex items-center space-x-4 pt-4 border-t">
              <motion.button
                type="submit"
                className="flex items-center gap-2 rounded-md bg-[color:var(--accent-dark)] px-6 py-2 text-white shadow-sm hover:bg-[color:var(--accent-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaSave /> Save Changes
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setIsEditing(false)}
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
