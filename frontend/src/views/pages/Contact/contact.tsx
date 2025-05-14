import React from "react";
import { motion } from "framer-motion";
import { BubbleGenerator } from "../Home/home";

export default function Contact() {
  return (
    <main className="bg-white font-sans">
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
            message and we’ll reply within 24 hours.
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

          <form className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <label className="block">
                <span className="text-gray-800 font-medium">Name</span>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-base focus:outline-none focus:border-transparent focus:shadow-none focus:ring-2 focus:ring-[#C17829]"
                />
              </label>

              <label className="block">
                <span className="text-gray-800 font-medium">Email</span>
                <input
                  type="email"
                  placeholder="Your email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-base focus:outline-none focus:border-transparent focus:shadow-none focus:ring-2 focus:ring-[#C17829]"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-gray-800 font-medium">Subject</span>
              <input
                type="text"
                placeholder="Subject"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-base focus:outline-none focus:border-transparent focus:shadow-none focus:ring-2 focus:ring-[#C17829]"
              />
            </label>

            <label className="block">
              <span className="text-gray-800 font-medium">Message</span>
              <textarea
                rows={4}
                placeholder="Your message…"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-base focus:outline-none focus:border-transparent focus:shadow-none focus:ring-2 focus:ring-[#C17829]"
              />
            </label>

            <div className="text-center">
              <button
                type="submit"
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-full font-semibold text-lg shadow-lg transition transform hover:scale-105"
              >
                Send Message 📩
              </button>
            </div>
          </form>
        </motion.div>
      </section>
    </main>
  );
}
