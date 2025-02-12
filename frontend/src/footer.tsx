import React from 'react';
import {
  FaBalanceScale,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#F5F5F5] text-[#2C2C4A]">
      {/* Upper section with logo, links, etc. */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Left Column: Brand + Social */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center space-x-2">
            <FaBalanceScale className="text-3xl text-[#2C2C4A]" />
            <span className="text-2xl font-bold text-[#C17829]">LDA</span>
          </div>
          <p className="text-sm">
            LDA: Empowering Precision and Efficiency in 
            Legal Document Analysis.
          </p>
          {/* Social icons */}
          <div className="flex space-x-4 text-xl mt-4">
            <a
              href="#"
              aria-label="Facebook"
              className="text-[#2C2C4A] hover:text-[#C17829] transition-colors"
            >
              <FaFacebookF />
            </a>
            <a
              href="#"
              aria-label="X (Twitter)"
              className="text-[#2C2C4A] hover:text-[#C17829] transition-colors"
            >
              <FaTwitter />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="text-[#2C2C4A] hover:text-[#C17829] transition-colors"
            >
              <FaInstagram />
            </a>
            <a
              href="#"
              aria-label="YouTube"
              className="text-[#2C2C4A] hover:text-[#C17829] transition-colors"
            >
              <FaYoutube />
            </a>
          </div>
        </div>

        {/* Quick Link Column */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold inline-block border-b-2 border-[#C17829] pb-1">
            Quick Link
          </h3>
          <ul className="space-y-2">
            <li>
              <a href="#" className="hover:text-[#C17829] transition-colors">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#C17829] transition-colors">
                About Us
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-[#C17829] transition-colors">
                Contact Us
              </a>
            </li>
          </ul>
        </div>

        {/* Services Column */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold inline-block border-b-2 border-[#C17829] pb-1">
            Services
          </h3>
          <ul className="space-y-2">
            <li>Advanced Document Analysis</li>
            <li>AI-Powered Legal Chatbot</li>
            <li>AI-Powered Compliance Checker</li>
            <li>Risk and Rephrasing Tools</li>
          </ul>
        </div>

        {/* Contact Us Column */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold inline-block border-b-2 border-[#C17829] pb-1">
            Contact Us
          </h3>
          <ul className="space-y-2">
            <li className="flex items-center space-x-2">
              <FaMapMarkerAlt className="text-[#C17829]" />
              <span>KLLG St. No.99, Pku City, ID 28289</span>
            </li>
            <li className="flex items-center space-x-2">
              <FaPhone className="text-[#C17829]" />
              <span>0761-8523-398</span>
            </li>
            <li className="flex items-center space-x-2">
              <FaEnvelope className="text-[#C17829]" />
              <span>hello@domainsite.com</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Horizontal gold line */}
      <hr className="border-t border-[#C17829] mx-auto w-11/12" />

      {/* Copyright */}
      <div className="text-center py-4 text-xs text-[#2C2C4A]">
        COPYRIGHT © 2024 <span className="text-[#C17829]">LDA</span>. ALL RIGHTS RESERVED.
      </div>
    </footer>
  );
};

export default Footer;
