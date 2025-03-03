// src/views/pages/About/about.tsx

import React from "react";
import { motion } from "framer-motion";
import { FaUserTie, FaLightbulb, FaHandshake, FaGlobe } from "react-icons/fa";

// Import local assets (adjust paths as needed)
import aboutHero from "../../../assets/images/law.png";
import ourStoryImage from "../../../assets/images/law.png";
import teamPlaceholder from "../../../assets/images/1.jpg";

// Sample team data using local asset for the avatar
const teamMembers = [
  {
    name: "Alice Johnson",
    role: "CEO & Co-Founder",
    bio: "A visionary leader with a passion for transforming legal tech.",
    avatarUrl: teamPlaceholder,
  },
  {
    name: "Brian Smith",
    role: "CTO & Co-Founder",
    bio: "Innovative mind driving our AI technology to new heights.",
    avatarUrl: teamPlaceholder,
  },
  {
    name: "Clara Lee",
    role: "Head of Legal Innovation",
    bio: "Bringing legal expertise and creativity to our solutions.",
    avatarUrl: teamPlaceholder,
  },
  // Add additional team members as needed
];

export default function About() {
  return (
    <main className="bg-white min-h-screen flex flex-col">
      {/* HERO SECTION WITH TRANSITIONS & SHAPES */}
      <section className="relative w-full h-[70vh] flex items-center bg-gradient-to-r from-[#f7ede1] to-white overflow-hidden">
        {/* Floating shapes */}
        <div className="absolute w-[200px] h-[200px] bg-[#C17829] rounded-full opacity-30 top-[-50px] left-[-50px] z-0" />
        <div className="absolute w-[300px] h-[300px] bg-[#2C2C4A] rounded-full opacity-10 bottom-[-100px] right-[-100px] z-0" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center px-4 relative z-10">
          {/* Left Side: Text with Motion */}
          <motion.div
            className="w-full md:w-1/2 text-center md:text-left"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.h1
              className="text-4xl sm:text-5xl font-bold text-[#2C2C4A] mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              About Us
            </motion.h1>
            <motion.p
              className="text-gray-700 text-base sm:text-lg mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              We are committed to reshaping the legal landscape with advanced
              AI-driven solutions that empower legal professionals worldwide.
            </motion.p>
            <motion.a
              href="#our-story"
              className="inline-block px-6 py-3 bg-[#C17829] text-white rounded-full font-semibold hover:bg-[#ad6823] active:bg-[#A66F24] transition-colors"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Our Journey →
            </motion.a>
          </motion.div>
          {/* Right Side: Image with Motion */}
          <motion.div
            className="w-full md:w-1/2 mt-8 md:mt-0 flex justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
          >
            <img
              src={aboutHero}
              alt="About Us Hero"
              className="rounded-xl shadow-lg"
            />
          </motion.div>
        </div>
      </section>

      {/* OUR STORY SECTION */}
      <section id="our-story" className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#C17829] mb-6 text-center">
            Our Story
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <p className="text-gray-700 text-lg leading-relaxed">
                Founded on the belief that legal processes can be reimagined
                through technology, our team of experts merged legal expertise
                with cutting‐edge AI. Our mission is to simplify legal
                workflows, reduce risk, and empower professionals with precision
                tools.
              </p>
              <p className="mt-4 text-gray-700 text-lg leading-relaxed">
                Over the years, we have evolved from a small startup to a
                trusted partner for legal professionals worldwide, continuously
                pushing the boundaries of innovation.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <img
                src={ourStoryImage}
                alt="Our Story"
                className="rounded-xl shadow-lg"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* OUR MISSION SECTION WITH SHAPES */}
      <section
        id="our-mission"
        className="relative py-12 px-4 bg-[#f7ede1] overflow-hidden"
      >
        {/* Floating shapes for Our Mission */}
        <div className="absolute w-[200px] h-[200px] bg-[#C17829] rounded-full opacity-30 top-[-50px] left-[-50px] z-0" />
        <div className="absolute w-[300px] h-[300px] bg-[#2C2C4A] rounded-full opacity-10 bottom-[-100px] right-[-100px] z-0" />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#C17829] mb-6">
            Our Mission
          </h2>
          <p className="text-gray-800 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            To empower legal professionals with innovative AI tools that
            streamline processes and enhance the accuracy of legal analyses,
            fostering a transparent and efficient legal ecosystem.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <motion.div
              className="p-6 bg-white rounded-md shadow transition-transform duration-300 hover:scale-105"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <FaLightbulb className="mx-auto text-2xl text-[#C17829] mb-2" />
              <h3 className="text-lg font-semibold text-[#C17829] mb-1">
                Innovation
              </h3>
              <p className="text-sm text-gray-600">
                Pushing the boundaries of legal technology.
              </p>
            </motion.div>
            <motion.div
              className="p-6 bg-white rounded-md shadow transition-transform duration-300 hover:scale-105"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <FaHandshake className="mx-auto text-2xl text-[#C17829] mb-2" />
              <h3 className="text-lg font-semibold text-[#C17829] mb-1">
                Integrity
              </h3>
              <p className="text-sm text-gray-600">
                Upholding ethical and transparent practices.
              </p>
            </motion.div>
            <motion.div
              className="p-6 bg-white rounded-md shadow transition-transform duration-300 hover:scale-105"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <FaGlobe className="mx-auto text-2xl text-[#C17829] mb-2" />
              <h3 className="text-lg font-semibold text-[#C17829] mb-1">
                Global Reach
              </h3>
              <p className="text-sm text-gray-600">
                Connecting expertise from around the world.
              </p>
            </motion.div>
            <motion.div
              className="p-6 bg-white rounded-md shadow transition-transform duration-300 hover:scale-105"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <FaUserTie className="mx-auto text-2xl text-[#C17829] mb-2" />
              <h3 className="text-lg font-semibold text-[#C17829] mb-1">
                Expertise
              </h3>
              <p className="text-sm text-gray-600">
                Led by industry veterans in law and tech.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* OUR TEAM SECTION */}
      <section id="our-team" className="py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#C17829] mb-6">
            Our Team
          </h2>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            Meet the passionate individuals behind our innovative solutions.
          </p>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.2 } },
            }}
          >
            {teamMembers.map((member, i) => (
              <motion.div
                key={i}
                className="bg-gradient-to-r from-white to-[#f7f1e9] shadow-lg transition-shadow duration-300 rounded-xl p-6"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <img
                  src={member.avatarUrl}
                  alt={`${member.name} avatar`}
                  className="w-16 h-16 rounded-full mx-auto mb-4 object-cover border border-[#C17829]/50"
                />
                <h3 className="text-xl font-bold text-[#2C2C4A] mb-1 text-center">
                  {member.name}
                </h3>
                <p className="text-sm text-gray-500 mb-2 text-center">
                  {member.role}
                </p>
                <p className="text-sm text-gray-700 italic text-center">
                  “{member.bio}”
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </main>
  );
}
