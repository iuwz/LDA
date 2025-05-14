// frontend/src/views/components/common/Banner.tsx
import React, { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import { BubbleGenerator } from "../../pages/Home/home";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

const Banner: React.FC = () => {
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data) => setFirstName(data.first_name || "User"))
      .catch(() => setFirstName("User"));
  }, []);

  if (firstName === null) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="absolute inset-0 pointer-events-none">
        <BubbleGenerator />
        <BubbleGenerator />
      </div>

      <div className="relative z-10 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-[#2C2C4A] flex items-center justify-center">
            <FaUser className="text-xl sm:text-2xl text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#2C2C4A] leading-tight">
              Welcome, {firstName}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Your lawyer is ready for you
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;
