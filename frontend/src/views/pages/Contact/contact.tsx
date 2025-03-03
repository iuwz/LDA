// src/views/pages/Contact/contact.tsx

import React from "react";
import { motion } from "framer-motion";

export default function Contact() {
  return (
    <main className="bg-white min-h-screen flex flex-col font-sans">
      {/* HERO SECTION */}
      <section
        className="
          relative w-full h-[40vh] flex items-center justify-center
          bg-gradient-to-r from-[#f7ede1] to-white
          overflow-hidden
        "
      >
        {/* Animated Floating Shapes (Faster) */}
        <motion.div
          className="absolute w-[120px] h-[120px] bg-[#C17829] rounded-full opacity-30 top-[-20px] left-[-20px] z-0"
          animate={{ x: [0, 10, 0], y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[150px] h-[150px] bg-[#2C2C4A] rounded-full opacity-10 bottom-[-40px] right-[-40px] z-0"
          animate={{ x: [0, -10, 0], y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-xl mx-auto px-4 relative z-10 text-center">
          <motion.h1
            className="font-serif text-3xl sm:text-4xl font-bold text-[#2C2C4A] mb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Get in Touch
          </motion.h1>
          <motion.p
            className="text-gray-800 text-base sm:text-lg mb-6 leading-relaxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            We’re here to help! Whether you have questions, feedback, or need
            support, drop us a message.
          </motion.p>
          <motion.a
            href="#contact-form"
            className="
              inline-block bg-[#C17829] text-white px-5 py-2
              rounded-full font-medium hover:bg-[#ad6823]
              transition-all
            "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Go to Contact Form
          </motion.a>
        </div>
      </section>

      {/* CONTACT FORM SECTION */}
      <section id="contact-form" className="py-16 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#C17829] mb-6 text-center">
            Send Us a Message
          </h2>

          {/* Card Container for the form */}
          <div className="bg-white shadow-md rounded-lg p-8 mb-16">
            <form className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-gray-800 font-medium mb-1"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="
                    w-full border border-gray-300 rounded-lg h-12 px-4
                    focus:outline-none focus:border-[#C17829]
                    shadow-sm
                  "
                  placeholder="Your name"
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-gray-800 font-medium mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="
                    w-full border border-gray-300 rounded-lg h-12 px-4
                    focus:outline-none focus:border-[#C17829]
                    shadow-sm
                  "
                  placeholder="Your email"
                />
              </div>
              <div>
                <label
                  htmlFor="subject"
                  className="block text-gray-800 font-medium mb-1"
                >
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  className="
                    w-full border border-gray-300 rounded-lg h-12 px-4
                    focus:outline-none focus:border-[#C17829]
                    shadow-sm
                  "
                  placeholder="Subject"
                />
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-gray-800 font-medium mb-1"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="
                    w-full border border-gray-300 rounded-lg px-4 py-3
                    focus:outline-none focus:border-[#C17829]
                    shadow-sm
                  "
                  placeholder="Your message"
                ></textarea>
              </div>
              <div className="text-center mt-8">
                <button
                  type="submit"
                  className="
                    bg-[#C17829] text-white px-6 py-3 rounded-full
                    font-semibold text-lg
                    inline-flex items-center gap-2
                    hover:bg-[#ad6823] transition-all
                    hover:shadow-lg
                  "
                >
                  Send Message
                  <span role="img" aria-label="envelope">
                    📩
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
