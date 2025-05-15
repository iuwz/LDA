// src/views/pages/Contact/Contact.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { BubbleGenerator } from "../Home/home";
import { sendContactMessage } from "../../../api"; // ← new helper
import { FaSpinner } from "react-icons/fa";

export default function Contact() {
  /* ───────── state ───────── */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ───────── handlers ───────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await sendContactMessage({ name, email, subject, message });
      setSent(true);
      /* clear fields */
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err: any) {
      setError(err.message ?? "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="bg-white font-sans">
      {/* ───────────────── hero ───────────────── */}
      <section className="relative w-full h-[70vh] flex items-center bg-gradient-to-r from-[#f7ede1] to-white overflow-hidden">
        <BubbleGenerator />

        <motion.div
          className="max-w-7xl mx-auto px-4 relative z-10 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="font-serif text-4xl sm:text-5xl md:text-6xl text-brand-dark font-bold mb-4"
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
            message and we’ll reply within 24&nbsp;hours.
          </motion.p>

          <motion.a
            href="#contact-form"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("contact-form")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-full font-semibold text-lg shadow-lg transition transform hover:scale-105"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Contact Form ↓
          </motion.a>
        </motion.div>
      </section>

      <div className="overflow-hidden leading-[0]">
        <svg
          className="-mt-1 w-full h-12"
          viewBox="0 0 1440 54"
          preserveAspectRatio="none"
        >
          <path d="M0,22L1440,54L1440,0L0,0Z" fill="white" />
        </svg>
      </div>

      {/* ───────────────── form ───────────────── */}
      <section
        id="contact-form"
        className="px-4 sm:px-6 lg:px-8 py-12 max-w-3xl mx-auto"
      >
        <motion.div
          className="bg-white p-6 sm:p-8 rounded-xl shadow-lg"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="font-serif text-2xl sm:text-3xl text-brand-dark font-semibold mb-6">
            Send Us a Message
          </h3>

          {sent ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-green-600 text-center font-medium"
            >
              Thank you! Your message has been sent.
            </motion.p>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <label className="block">
                  <span className="text-gray-800 font-medium">Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-[#C17829]"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-gray-800 font-medium">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-[#C17829]"
                    required
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-gray-800 font-medium">Subject</span>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-[#C17829]"
                  required
                />
              </label>

              <label className="block">
                <span className="text-gray-800 font-medium">Message</span>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your message…"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-[#C17829]"
                  required
                />
              </label>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </motion.p>
              )}

              <div className="text-center">
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-full font-semibold text-lg shadow-lg transition transform hover:scale-105 disabled:opacity-50"
                >
                  {sending && <FaSpinner className="animate-spin mr-2" />}
                  Send Message 📩
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </section>
    </main>
  );
}
