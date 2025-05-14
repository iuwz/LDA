// frontend/src/views/components/common/Banner.tsx
import React, { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import { BubbleGenerator } from "../../pages/Home/home"; // adjust the path if Home/home is located elsewhere

// Base URL for your FastAPI backend
const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

interface UserMe {
  first_name?: string;
}

const Banner: React.FC = () => {
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/auth/me`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Not authenticated");
        return res.json();
      })
      .then((data: UserMe) => setFirstName(data.first_name || "User"))
      .catch(() => setFirstName("User"));
  }, []);

  if (firstName === null) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-white shadow-sm">
      {/* animated bubbles identical to About > Mission section */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-y-0 left-0 w-1/2">
          <BubbleGenerator />
        </div>
        <div className="absolute inset-y-0 right-0 w-1/2">
          <BubbleGenerator />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-[color:var(--brand-dark)] flex items-center justify-center">
            <FaUser className="text-xl sm:text-2xl text-white" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[color:var(--brand-dark)] leading-tight">
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
