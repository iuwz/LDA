// src/views/components/layout/footer.tsx
import React from "react";
import {
  FaBalanceScale,
} from "react-icons/fa";

export default function Footer() {
  return (
    /* 
      1) Background #F5F5F5 and text #2C2C4A to match the old footer style.
      2) “Follow Us” section removed.
      3) Grid now 1 / 2 / 3 columns (lg) and items are centered.
    */
    <footer className="bg-[#F5F5F5] text-[#2C2C4A] mt-auto overflow-hidden">
      {/* Footer content container */}
      <div className="pt-8 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {/* Column 1: Brand / Tagline */}
          <div className="space-y-4 text-center sm:text-left">
            <div className="flex justify-center sm:justify-start items-center space-x-2">
              <FaBalanceScale className="text-2xl" />
              <span className="text-2xl font-bold">LDA</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Streamlining Legal Document Analysis with AI — bridging innovation
              and expertise for more efficient legal workflows.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4 text-center sm:text-left">
            <h3 className="text-lg font-semibold inline-block border-b-2 border-[#C17829] pb-1">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/" className="hover:text-[#C17829] transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a
                  href="/services"
                  className="hover:text-[#C17829] transition-colors"
                >
                  Services
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="hover:text-[#C17829] transition-colors"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-4 text-center sm:text-left">
            <h3 className="text-lg font-semibold inline-block border-b-2 border-[#C17829] pb-1">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/privacy"
                  className="hover:text-[#C17829] transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="hover:text-[#C17829] transition-colors"
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Thin horizontal line & copyright */}
        <hr className="border-t border-gray-300 mt-8 mb-4" />
        <div className="text-center text-xs">
          © 2025 LDA. All rights reserved.
        </div>
      </div>
    </footer>
  );
}