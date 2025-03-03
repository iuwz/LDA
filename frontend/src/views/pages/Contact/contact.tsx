// src/views/pages/Contact/contact.tsx

import React from "react";
import { motion } from "framer-motion";

export default function Contact() {
  return (
    <main className="bg-white min-h-screen flex flex-col">
      {/* Compact Hero Section with Content */}
      <section className="relative w-full h-[40vh] flex items-center justify-center bg-gradient-to-r from-[#f7ede1] to-white overflow-hidden">
        {/* Animated Floating Shapes */}
        <motion.div
          className="absolute w-[120px] h-[120px] bg-[#C17829] rounded-full opacity-30 top-[-20px] left-[-20px] z-0"
          animate={{ x: [0, 10, 0], y: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[150px] h-[150px] bg-[#2C2C4A] rounded-full opacity-10 bottom-[-40px] right-[-40px] z-0"
          animate={{ x: [0, -10, 0], y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-xl mx-auto px-4 relative z-10 text-center">
          <motion.h1
            className="text-3xl sm:text-4xl font-bold text-[#2C2C4A] mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Get in Touch
          </motion.h1>
          <motion.p
            className="text-gray-700 text-base sm:text-lg mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            We’re here to help! Whether you have questions, feedback, or need
            support, drop us a message.
          </motion.p>
          <motion.a
            href="#contact-form"
            className="inline-block bg-[#C17829] text-white px-4 py-2 rounded-full font-medium hover:bg-[#ad6823] transition-colors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Go to Contact Form
          </motion.a>
        </div>
      </section>

      {/* CONTACT FORM SECTION */}
      <section id="contact-form" className="py-8 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#C17829] mb-4 text-center">
            Send Us a Message
          </h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-gray-700 font-medium">
                Name
              </label>
              <input
                type="text"
                id="name"
                className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:border-[#C17829]"
                placeholder="Your name"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block text-gray-700 font-medium"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:border-[#C17829]"
                placeholder="Your email"
              />
            </div>
            <div>
              <label
                htmlFor="subject"
                className="block text-gray-700 font-medium"
              >
                Subject
              </label>
              <input
                type="text"
                id="subject"
                className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:border-[#C17829]"
                placeholder="Subject"
              />
            </div>
            <div>
              <label
                htmlFor="message"
                className="block text-gray-700 font-medium"
              >
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                className="w-full border border-gray-300 rounded px-3 py-2 mt-1 focus:outline-none focus:border-[#C17829]"
                placeholder="Your message"
              ></textarea>
            </div>
            <div className="text-center">
              <button
                type="submit"
                className="bg-[#C17829] text-white px-5 py-2 rounded-full font-semibold hover:bg-[#ad6823] transition-colors"
              >
                Send Message
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
