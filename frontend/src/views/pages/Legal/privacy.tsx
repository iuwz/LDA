/* ────────────────────────────────────────────────────────────────
   src/views/pages/Legal/privacy.tsx

   RELEASE 1-c • 2025-05-17
   ‣ Hero removed — page now opens directly on the policy content.
────────────────────────────────────────────────────────────────── */

import React from "react";
import { motion } from "framer-motion";
import {
  FaShieldAlt,
  FaFileAlt,
  FaLock,
  FaUserSecret,
  FaSyncAlt,
  FaShareAlt,
  FaCookieBite,
  FaRegEdit,
  FaInfoCircle,
  FaEnvelope,
} from "react-icons/fa";

/* ───────────────────────── Policy sections ───────────────────────── */
const SECTIONS = [
  {
    icon: FaInfoCircle,
    title: "1. Introduction",
    text: `This Privacy Policy explains how Legal Document Analyzer ("LDA", "we", "our") collects, uses, and protects information you share with us when you visit the site or use any LDA service.`,
  },
  {
    icon: FaFileAlt,
    title: "2. Information We Collect",
    text: `We collect the data you provide during account creation (name, email, password), documents you upload, and usage metrics (time stamps, feature usage) to improve service quality.`,
  },
  {
    icon: FaShieldAlt,
    title: "3. Document Privacy & AI Processing",
    text: `Uploaded documents are stored encrypted at rest and are processed only to generate the requested analysis (risk, compliance, rephrasing, translation, chatbot). We never use your content to train our AI models, and no document data is logged or re-shared with the OpenAI service beyond the secure, ephemeral inference call.`,
  },
  {
    icon: FaLock,
    title: "4. How We Use Your Information",
    text: `Your data is used solely to authenticate you, perform the selected document-analysis task, provide customer support, and maintain system security. We do not sell or rent personal data.`,
  },
  {
    icon: FaSyncAlt,
    title: "5. Data Retention",
    text: `Documents and generated reports remain in your account until you delete them or for 90 days after account closure, whichever comes first. Transactional logs are retained for 12 months for audit purposes.`,
  },
  {
    icon: FaShareAlt,
    title: "6. Sharing & Disclosure",
    text: `We share information only with trusted sub-processors essential to operate LDA (cloud storage, email service). All sub-processors are contractually bound to equal or stronger confidentiality and security obligations.`,
  },
  {
    icon: FaCookieBite,
    title: "7. Cookies & Tracking",
    text: `LDA uses first-party cookies for session management and security (e.g., CSRF tokens). No third-party advertising or cross-site tracking cookies are employed.`,
  },
  {
    icon: FaUserSecret,
    title: "8. Your Rights",
    text: `You may access, download, correct, or delete your personal data at any time through your account settings. Contact us to exercise additional rights under applicable data-protection laws.`,
  },
  {
    icon: FaRegEdit,
    title: "9. Policy Updates",
    text: `We may update this Privacy Policy to reflect new features or legal requirements. Material changes will be announced in-app at least 7 days before they take effect.`,
  },
  {
    icon: FaEnvelope,
    title: "10. Contact Us",
    text: `Questions about privacy? Email us at privacy@lda-legal.com and we’ll respond within 48 hours.`,
  },
];

/* ───────────────────────── Privacy Policy page ───────────────────────── */
export default function PrivacyPolicy() {
  return (
    <main className="font-sans text-gray-800 bg-white">
      {/* gradient accent bar */}
      <div className="w-full h-1 bg-gradient-to-r from-[#C17829] to-[#2C2C4A]" />

      {/* policy body */}
      <section
        id="policy"
        className="bg-[#f7ede1] px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20"
      >
        <motion.div
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#C17829] mb-8 text-center">
            Privacy Policy
          </h1>

          {SECTIONS.map(({ icon: Icon, title, text }, i) => (
            <motion.div
              key={title}
              className="relative bg-white rounded-2xl p-6 sm:p-8 shadow-md mb-8 last:mb-0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C17829] to-[#2C2C4A]" />
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
