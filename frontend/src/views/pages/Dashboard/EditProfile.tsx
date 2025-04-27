// src/views/pages/Dashboard/EditProfile.tsx

import React, { useState } from "react";
import { FaUser, FaSave } from "react-icons/fa";
import { motion } from "framer-motion";

const EditProfile: React.FC = () => {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: send updated profile to your API
    console.log("Updating profile:", { name, email, password });
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
              Edit Profile
            </h1>
            <p className="text-gray-600">Update your profile information</p>
          </div>
        </div>
      </header>

      {/* Form */}
      <section className="rounded-xl border bg-white shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-3 focus:border-[color:var(--accent-dark)] focus:ring-1 focus:ring-[color:var(--accent-dark)] outline-none"
            />
          </div>

          {/* Email Address */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-3 focus:border-[color:var(--accent-dark)] focus:ring-1 focus:ring-[color:var(--accent-dark)] outline-none"
            />
          </div>

          {/* New Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-3 focus:border-[color:var(--accent-dark)] focus:ring-1 focus:ring-[color:var(--accent-dark)] outline-none"
            />
          </div>

          {/* Save Button */}
          <motion.button
            type="submit"
            className="flex items-center gap-2 rounded-md bg-[color:var(--accent-dark)] px-6 py-2 text-white shadow-sm hover:bg-[color:var(--accent-light)] transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaSave /> Save Changes
          </motion.button>
        </form>
      </section>
    </div>
  );
};

export default EditProfile;
