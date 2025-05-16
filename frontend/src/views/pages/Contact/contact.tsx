// src/views/pages/Contact/Contact.tsx
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BubbleGenerator } from "../Home/home";
import { sendContactMessage } from "../../../api";
import { FaSpinner, FaCheckCircle, FaTimes } from "react-icons/fa";

export default function Contact() {
  /* ───────── state ───────── */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);

  /* bring user back to the form after success */
  useEffect(() => {
    if (sent) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [sent]);

  /* ───────── handlers ───────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
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

  const ready = name && email && subject && message;

  const resetForm = () => {
    setSent(false);
    setError(null);
    /* a tiny delay so the collapse animation feels natural */
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  /* ───────── reusable gradient-border wrapper ───────── */
  const GradientBorder: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <div className="p-[2px] rounded-lg bg-gradient-to-r from-[#C17829] to-[#E3A063]">
      {children}
    </div>
  );

  return (
    <main className="bg-white font-sans">
      {/* ───────────────── Hero ───────────────── */}
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
            message and we’ll reply within&nbsp;24&nbsp;hours.
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

      {/* ───────────────── Form Section ───────────────── */}
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

          <AnimatePresence mode="wait">
            {sent ? (
              /* ───────── Success card ───────── */
              <motion.div
                key="success"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex flex-col items-center text-center space-y-4"
              >
                <FaCheckCircle className="text-green-500 text-5xl" />
                <p className="text-green-700 text-lg font-medium">
                  Thank you! Your message has been sent.
                </p>
                <button
                  onClick={resetForm}
                  className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-full font-semibold text-lg shadow-lg transition transform hover:scale-105"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              /* ───────── Form ───────── */
              <motion.form
                key="form"
                ref={formRef}
                onSubmit={handleSubmit}
                className="space-y-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <label className="block">
                    <span className="text-gray-800 font-medium">Name</span>
                    <GradientBorder>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full px-4 py-3 rounded-lg bg-white text-base focus:outline-none focus:ring-2 focus:ring-transparent"
                        required
                      />
                    </GradientBorder>
                  </label>

                  <label className="block">
                    <span className="text-gray-800 font-medium">Email</span>
                    <GradientBorder>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Your email"
                        className="w-full px-4 py-3 rounded-lg bg-white text-base focus:outline-none focus:ring-2 focus:ring-transparent"
                        required
                      />
                    </GradientBorder>
                  </label>
                </div>

                <label className="block">
                  <span className="text-gray-800 font-medium">Subject</span>
                  <GradientBorder>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Subject"
                      className="w-full px-4 py-3 rounded-lg bg-white text-base focus:outline-none focus:ring-2 focus:ring-transparent"
                      required
                    />
                  </GradientBorder>
                </label>

                <label className="block">
                  <span className="text-gray-800 font-medium">Message</span>
                  <GradientBorder>
                    <textarea
                      rows={4}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Your message…"
                      className="w-full px-4 py-3 rounded-lg bg-white text-base focus:outline-none focus:ring-2 focus:ring-transparent"
                      required
                    />
                  </GradientBorder>
                </label>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      key="error"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="relative rounded border border-red-300 bg-red-100 px-4 py-3 text-sm text-red-700"
                    >
                      {error}
                      <button
                        onClick={() => setError(null)}
                        type="button"
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                        aria-label="Dismiss error"
                      >
                        <FaTimes />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="text-center">
                  <button
                    type="submit"
                    disabled={!ready || sending}
                    className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-full font-semibold text-lg shadow-lg transition transform hover:scale-105 disabled:opacity-50"
                  >
                    {sending && <FaSpinner className="animate-spin mr-2" />}
                    Send Message 📩
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </main>
  );
}
