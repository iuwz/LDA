/* ────────────────────────────────────────────────────────────────
   src/views/pages/Legal/terms.tsx

   RELEASE 1-b • 2025-05-17
   ‣ Added animated Bubble background (double density) behind the content,
     matching the “hero” effect on the Home page but with more bubbles.
────────────────────────────────────────────────────────────────── */

import React from "react";
import { motion } from "framer-motion";
import {
  FaInfoCircle,
  FaCheck,
  FaUserShield,
  FaBan,
  FaCopyright,
  FaFileAlt,
  FaSyncAlt,
  FaExclamationTriangle,
  FaShieldAlt,
  FaGavel,
  FaEnvelope,
} from "react-icons/fa";
import { BubbleGenerator } from "../Home/home"; // reuse component

/* ───────────────────────── Terms sections ───────────────────────── */
const SECTIONS = [
  {
    icon: FaInfoCircle,
    title: "1. Introduction",
    text: `These Terms of Service (“Terms”) govern your access to and use of the Legal Document Analyzer (“LDA”, “we”, “our”) website and services. By creating an account or using any LDA feature, you agree to be bound by these Terms.`,
  },
  {
    icon: FaCheck,
    title: "2. Acceptance of Terms",
    text: `You must be at least 18 years old and have the legal capacity to enter into a binding contract to use LDA. If you do not agree with any part of these Terms, you must not use the service.`,
  },
  {
    icon: FaUserShield,
    title: "3. User Responsibilities",
    text: `You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must ensure that any documents you upload do not violate applicable laws or third-party rights.`,
  },
  {
    icon: FaBan,
    title: "4. Prohibited Activities",
    text: `You agree not to (a) attempt to reverse-engineer or disrupt the platform, (b) upload malicious code, (c) use LDA to generate or distribute unlawful content, or (d) resell access to the service without our prior written consent.`,
  },
  {
    icon: FaCopyright,
    title: "5. Intellectual Property",
    text: `All platform code, designs, and trademarks are the exclusive property of LDA. Using the service does not grant you any right or license to reproduce or otherwise exploit our intellectual property without permission.`,
  },
  {
    icon: FaFileAlt,
    title: "6. Document Content Ownership",
    text: `You retain full ownership of the documents you upload and the outputs generated for you. By uploading, you grant LDA a limited license to process the documents solely to provide the requested services.`,
  },
  {
    icon: FaSyncAlt,
    title: "7. Service Availability & Changes",
    text: `We aim for 99 % uptime but make no absolute guarantee. LDA may add, modify, or discontinue features at any time. Material changes will be announced in-app or via e-mail at least 7 days in advance whenever feasible.`,
  },
  {
    icon: FaExclamationTriangle,
    title: "8. Limitation of Liability",
    text: `To the maximum extent permitted by law, LDA shall not be liable for any indirect, incidental, or consequential damages arising from your use of, or inability to use, the service—even if advised of the possibility of such damages.`,
  },
  {
    icon: FaShieldAlt,
    title: "9. Indemnification",
    text: `You agree to indemnify and hold harmless LDA, its affiliates, and employees from any claim or demand arising out of your misuse of the service, violation of these Terms, or infringement of any third-party rights.`,
  },
  {
    icon: FaGavel,
    title: "10. Governing Law & Dispute Resolution",
    text: `These Terms are governed by the laws of Saudi Arabia. Any dispute shall be resolved exclusively in the courts of Riyadh, unless otherwise required by mandatory law.`,
  },
  {
    icon: FaEnvelope,
    title: "11. Contact Us",
    text: `Questions about these Terms? E-mail us at legaldocumentanalyzer@gmail.com — we respond within 48 hours.`,
  },
];

/* ───────────────────────── Terms of Service page ───────────────────────── */
export default function TermsOfService() {
  return (
    <main className="font-sans text-gray-800 bg-white">
      <section
        id="terms"
        className="relative bg-[#f7ede1] px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 overflow-hidden"
      >
        {/* double bubble layers for higher density */}
        <BubbleGenerator />
        <BubbleGenerator />

        <motion.div
          className="relative z-10 max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#C17829] mb-8 text-center">
            Terms of Service
          </h1>

          {SECTIONS.map(({ icon: Icon, title, text }, i) => (
            <motion.div
              key={title}
              className="relative bg-white rounded-2xl overflow-hidden p-6 sm:p-8 shadow-md mb-8 last:mb-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r from-[#C17829] to-[#2C2C4A]" />
              <div className="flex items-start">
                <Icon className="text-2xl text-[#C17829] mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#2C2C4A] mb-2">
                    {title}
                  </h2>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                    {text}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
