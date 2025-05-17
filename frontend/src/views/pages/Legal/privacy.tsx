// src/views/pages/Legal/privacy.tsx
import React from "react";

/* ───────── Privacy content ───────── */
const SECTIONS = [
  {
    title: "1. Introduction",
    text: `This Privacy Policy explains how Legal Document Analyzer (“LDA”, “we”, “our”)
collects, uses, and protects the information you provide when you visit our site
or use any LDA service.`,
  },
  {
    title: "2. Information We Collect",
    text: `We gather only the data needed to deliver our services: account details
(name, email), documents you upload, and basic usage metrics
(time stamps, feature usage).`,
  },
  {
    title: "3. Document Privacy & AI Processing",
    text: `Uploaded documents are stored encrypted at rest. They are processed solely
to perform the chosen task (risk assessment, compliance check, rephrasing,
translation, chatbot response). We never use your documents to train AI models
and never share their content with third parties beyond the secure inference
call.`,
  },
  {
    title: "4. How We Use Your Information",
    text: `Your data enables authentication, document processing, customer support,
and system security. We do not sell or rent personal data.`,
  },
  {
    title: "5. Data Retention",
    text: `Documents and related reports stay in your account until you delete them
or ninety (90) days after you close the account. System logs are stored for
twelve (12) months for audit and security purposes.`,
  },
  {
    title: "6. Sharing & Disclosure",
    text: `Information is shared only with essential service providers (cloud
storage, email). All providers are bound by contracts to maintain equal or
stronger security and confidentiality standards.`,
  },
  {
    title: "7. Cookies & Tracking",
    text: `LDA uses first-party cookies for session management and security. We do
not use advertising or cross-site tracking cookies.`,
  },
  {
    title: "8. Your Rights",
    text: `You may access, download, correct, or delete your personal data at any
time through your account settings or by contacting us at the e-mail below.`,
  },
  {
    title: "9. Policy Updates",
    text: `We may update this Policy to reflect new features or legal changes.
Material updates will be announced in-app at least seven (7) days before they
take effect.`,
  },
  {
    title: "10. Contact Us",
    text: `Questions? E-mail us at privacy@lda-legal.com — we reply within 48 hours.`,
  },
];

/* ───────── Privacy Policy page ───────── */
export default function PrivacyPolicy() {
  return (
    <main className="bg-white font-sans text-gray-800">
      {/* top accent bar */}
      <div className="w-full h-1 bg-gradient-to-r from-[#C17829] to-[#2C2C4A]" />

      <section className="px-4 sm:px-6 lg:px-8 py-12 max-w-4xl mx-auto">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#C17829] mb-8">
          Privacy Policy
        </h1>

        {SECTIONS.map(({ title, text }) => (
          <div key={title} className="mb-8">
            <h2 className="font-serif text-xl font-semibold text-[#2C2C4A] mb-2">
              {title}
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {text}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
