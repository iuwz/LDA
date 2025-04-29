// src/views/pages/Contact/contact.tsx
import React from "react";
import { motion } from "framer-motion";
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";

export default function Contact() {
  return (
    <main className="bg-white font-sans">
      {/* HERO */}
      <section
        className="
          relative w-full
          h-[40vh] sm:h-[55vh] md:h-[65vh] lg:h-[75vh]
          bg-gradient-to-r from-accent-light to-white
          flex items-center justify-center overflow-hidden
        "
      >
        <motion.div
          className="absolute rounded-full opacity-30 bg-accent-dark w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 top-[-12px] left-[-12px]"
          animate={{ x: [0, 8, 0], y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full opacity-10 bg-brand-dark w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bottom-[-16px] right-[-16px]"
          animate={{ x: [0, -8, 0], y: [0, -8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative z-10 px-4 text-center">
          <motion.h1
            className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-brand-dark font-bold mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Get in Touch
          </motion.h1>
          <motion.p
            className="text-gray-700 text-sm sm:text-base md:text-lg max-w-md mx-auto mb-6 leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Whether you have questions, feedback, or need support, drop us a
            message and we’ll reply within 24 hours.
          </motion.p>
          <motion.a
            href="#contact-form"
            className="inline-block bg-accent-dark text-white px-5 py-3 sm:px-6 sm:py-4 rounded-full font-semibold text-sm sm:text-base shadow-md hover:bg-[#ad6823] transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Contact Form ↓
          </motion.a>
        </div>
      </section>

      {/* wave divider */}
      <div className="overflow-hidden leading-[0]">
        <svg
          className="-mt-1 w-full h-12"
          viewBox="0 0 1440 54"
          preserveAspectRatio="none"
        >
          <path d="M0,22L1440,54L1440,0L0,0Z" fill="white" />
        </svg>
      </div>

      {/* INFO + FORM */}
      <section
        id="contact-form"
        className="px-4 sm:px-6 lg:px-8 py-12 max-w-6xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
          {/* FORM */}
          <motion.div
            className="bg-white p-6 sm:p-8 rounded-xl shadow-lg"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="font-serif text-2xl sm:text-3xl text-brand-dark font-semibold mb-6">
              Send Us a Message
            </h3>
            <form className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <label className="block">
                  <span className="text-gray-800 font-medium">Name</span>
                  <input
                    type="text"
                    placeholder="Your name"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-accent-dark focus:ring-accent-dark/30 outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-gray-800 font-medium">Email</span>
                  <input
                    type="email"
                    placeholder="Your email"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-accent-dark focus:ring-accent-dark/30 outline-none"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-gray-800 font-medium">Subject</span>
                <input
                  type="text"
                  placeholder="Subject"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 shadow-sm focus:border-accent-dark focus:ring-accent-dark/30 outline-none"
                />
              </label>

              <label className="block">
                <span className="text-gray-800 font-medium">Message</span>
                <textarea
                  rows={4}
                  placeholder="Your message…"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-3 shadow-sm focus:border-accent-dark focus:ring-accent-dark/30 outline-none"
                />
              </label>

              <div className="text-center">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-accent-dark text-white px-6 py-3 rounded-full font-semibold text-base shadow-md hover:bg-[#ad6823] transition-all"
                >
                  Send Message 📩
                </button>
              </div>
            </form>
          </motion.div>

          {/* INFO PANEL */}
          <motion.div
            className="
              space-y-5
              text-center md:text-left
              mx-auto md:mx-0
            "
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="font-serif text-xl sm:text-2xl text-accent-dark font-bold mb-2">
              Reach Us Directly
            </h3>
            <p className="text-gray-600 text-sm sm:text-base mb-4 max-w-prose mx-auto md:mx-0">
              We’re available Monday–Friday, 9 AM–6 PM. Feel free to call,
              email, or visit us.
            </p>
            <ul className="space-y-3">
              {[
                {
                  Icon: FaPhoneAlt,
                  label: "Phone",
                  link: "tel:+123456789",
                  value: "+1 (234) 567-89",
                },
                {
                  Icon: FaEnvelope,
                  label: "Email",
                  link: "mailto:support@lda.com",
                  value: "support@lda.com",
                },
                {
                  Icon: FaMapMarkerAlt,
                  label: "Office",
                  link: "",
                  value: "123 Legal Lane\nLawtown, LT 45678",
                },
              ].map(({ Icon, label, link, value }, i) => (
                <li
                  key={i}
                  className="flex flex-col items-center md:items-start gap-2"
                >
                  <Icon className="text-accent-dark text-xl" />
                  <p className="font-medium text-gray-800 text-sm">{label}</p>
                  {link ? (
                    <a
                      href={link}
                      className="text-gray-600 text-sm hover:text-accent-dark transition whitespace-pre-wrap text-center md:text-left"
                    >
                      {value}
                    </a>
                  ) : (
                    <p className="text-gray-600 text-sm whitespace-pre-wrap text-center md:text-left">
                      {value}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
