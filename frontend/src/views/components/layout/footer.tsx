// src/views/components/layout/footer.tsx

import React from "react";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaBalanceScale,
} from "react-icons/fa";

export default function Footer() {
  return (
    /* 
      1) Background #F5F5F5 and text #2C2C4A to match the old footer style.
      2) No wave at the top: wave-related code removed.
      3) Reduced top padding from pt-16 to pt-8 to eliminate large whitespace.
    */
    <footer className="bg-[#F5F5F5] text-[#2C2C4A] mt-auto overflow-hidden">
      {/* Footer content container */}
      <div className="pt-8 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Brand / Tagline / CTA */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FaBalanceScale className="text-2xl" />
              <span className="text-2xl font-bold">LDA</span>
            </div>
            <p className="text-sm leading-relaxed">
              Streamlining Legal Document Analysis with AI bridging innovation
              and expertise for more efficient legal workflows.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
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
          <div className="space-y-4">
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

          {/* Column 4: Follow Us / Social Icons */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold inline-block border-b-2 border-[#C17829] pb-1">
              Follow Us
            </h3>
            <p className="text-sm leading-relaxed">
              Stay connected on our social channels to get the latest updates
              and insights.
            </p>
            <div className="flex space-x-4 text-xl">
              <a
                href="https://facebook.com"
                aria-label="Facebook"
                className="hover:text-[#C17829] transition-colors"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://twitter.com"
                aria-label="Twitter"
                className="hover:text-[#C17829] transition-colors"
              >
                <FaTwitter />
              </a>
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                className="hover:text-[#C17829] transition-colors"
              >
                <FaInstagram />
              </a>
              <a
                href="https://linkedin.com"
                aria-label="LinkedIn"
                className="hover:text-[#C17829] transition-colors"
              >
                <FaLinkedinIn />
              </a>
            </div>
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
