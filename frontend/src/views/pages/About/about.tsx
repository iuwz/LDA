// src/views/pages/About/About.tsx
import React from "react";
import { motion } from "framer-motion";
import {
  FaUserTie,
  FaLightbulb,
  FaHandshake,
  FaGlobe,
  FaLinkedinIn,
} from "react-icons/fa";

import aboutHero from "../../../assets/images/about-hero.jpeg";
import Mazen from "../../../assets/images/mazen.jpg";
import Rayan from "../../../assets/images/rayan.jpg";
import Abdulaziz from "../../../assets/images/azoz.jpg";
import Ibrahim from "../../../assets/images/ibra.jpg";

import { BubbleGenerator } from "../Home/home";

const teamMembers = [
  {
    name: "Mazen Alkhodairi",
    role: "Software Engineer",
    bio: "Passionate about building seamless user experiences and integrating AI.",
    avatarUrl: Mazen,
    linkedin: "https://www.linkedin.com/in/mazen-alkhodairi/",
  },
  {
    name: "Abdulaziz Alali",
    role: "Backend Engineer",
    bio: "Focuses on scalable cloud infrastructure and robust APIs.",
    avatarUrl: Abdulaziz,
    linkedin: "https://www.linkedin.com/in/abdulaziz-f-alali/",
  },
  {
    name: "Ibrahim Alfayez",
    role: "AI Engineer",
    bio: "Turns complex problems into elegant machine-learning solutions.",
    avatarUrl: Ibrahim,
    linkedin: "https://www.linkedin.com/in/ibrahimalfayez29/",
  },
  {
    name: "Rayan Alghamdi",
    role: "Front-end Developer",
    bio: "Crafts accessible, high-performance interfaces with modern frameworks.",
    avatarUrl: Rayan,
    linkedin: "https://www.linkedin.com/in/rayan-alghamdi04/",
  },
];

const values = [
  {
    icon: FaLightbulb,
    title: "Innovation",
    desc: "Committed to innovation in everything we do.",
  },
  {
    icon: FaHandshake,
    title: "Integrity",
    desc: "Committed to integrity in everything we do.",
  },
  {
    icon: FaGlobe,
    title: "Global Reach",
    desc: "Committed to global reach in everything we do.",
  },
  {
    icon: FaUserTie,
    title: "Expertise",
    desc: "Committed to expertise in everything we do.",
  },
];

export default function About() {
  return (
    <main className="font-sans text-gray-800">
      {/* HERO (clean — no bubbles) */}
      <section className="relative w-full h-[60vh] sm:h-[70vh] overflow-hidden flex items-center justify-center">
        <img
          src={aboutHero}
          alt="About"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#2C2C4A]/80 to-[#2C2C4A]/20" />
        <motion.div
          className="relative z-10 max-w-3xl text-center px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl text-white font-bold mb-4">
            About&nbsp;Us
          </h1>
          <p className="text-gray-200 text-base sm:text-lg md:text-xl mb-6 leading-relaxed">
            We’re reshaping the legal landscape with AI solutions that empower
            professionals worldwide.
          </p>
          <a
            href="#our-story"
            className="inline-block px-8 py-3 bg-[#C17829] hover:bg-[#a4621e] text-white rounded-full font-semibold shadow-lg transition"
          >
            Our Journey →
          </a>
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
        id="our-story"
        className="bg-white px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20"
      >
        <motion.div
          className="max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#C17829] mb-4">
            Our Story
          </h2>
          <p className="text-base sm:text-lg leading-relaxed">
            Founded on the belief that legal processes can be reimagined through
            technology, our team merged legal expertise with cutting-edge AI.
            Today, we simplify workflows, mitigate risks, and empower legal
            professionals around the globe.
          </p>
        </motion.div>
      </section>

      <section className="relative bg-[#f7ede1] px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 overflow-hidden">
        <BubbleGenerator />
        <motion.div
          className="max-w-7xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#C17829] mb-4">
            Our Mission
          </h2>
          <p className="text-base sm:text-lg leading-relaxed max-w-prose mx-auto mb-12">
            To empower legal professionals with AI tools that streamline
            processes and enhance accuracy—fostering a transparent, efficient
            legal ecosystem.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {values.map(({ icon: Icon, title, desc }, idx) => (
              <motion.div
                key={idx}
                className="relative bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C17829] to-[#2C2C4A]" />
                <div className="flex justify-center mb-4">
                  <Icon className="text-3xl text-[#C17829]" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-[#2C2C4A] text-center">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 text-center mt-2">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="bg-white px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <motion.div
          className="max-w-7xl mx-auto text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#C17829] mb-4">
            Our Team
          </h2>
          <p className="text-base sm:text-lg leading-relaxed max-w-prose mx-auto">
            Meet the passionate individuals driving innovation at LDA.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {teamMembers.map((m, i) => (
            <motion.div
              key={i}
              className="group bg-white rounded-lg p-6 shadow-lg hover:shadow-2xl transition"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="flex flex-col items-center">
                <img
                  src={m.avatarUrl}
                  alt={m.name}
                  className="w-24 h-24 rounded-full mb-4 object-cover"
                />
                <h3 className="font-serif text-xl text-[#2C2C4A] font-semibold mb-1 text-center">
                  {m.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2 text-center">
                  {m.role}
                </p>
                <p className="text-gray-700 text-xs italic text-center mb-4">
                  “{m.bio}”
                </p>
                <a
                  href={m.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-8 h-8 rounded-full border border-[#2C2C4A] text-[#2C2C4A] hover:bg-[#C17829] hover:text-white transition-colors"
                >
                  <FaLinkedinIn />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}
