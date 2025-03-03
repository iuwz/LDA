import React from "react";
import { motion } from "framer-motion";
import { FaUserTie, FaLightbulb, FaHandshake, FaGlobe } from "react-icons/fa";

// Import local assets (adjust paths as needed)
import aboutHero from "../../../assets/images/about-hero.jpeg";
import ourStoryImage from "../../../assets/images/our-story.jpeg";
import teamPlaceholder from "../../../assets/images/icon.jpg";

// Sample team data using local asset for the avatar
const teamMembers = [
  {
    name: "Alice Johnson",
    role: "CEO & Co-Founder",
    bio: "A visionary leader with a passion for transforming legal tech.",
    avatarUrl: teamPlaceholder,
    link: "#",
  },
  {
    name: "Brian Smith",
    role: "CTO & Co-Founder",
    bio: "Innovative mind driving our AI technology to new heights.",
    avatarUrl: teamPlaceholder,
    link: "#",
  },
  {
    name: "Clara Lee",
    role: "Head of Legal Innovation",
    bio: "Bringing legal expertise and creativity to our solutions.",
    avatarUrl: teamPlaceholder,
    link: "#",
  },
  // Add additional team members as needed
];

export default function About() {
  return (
    <main className="bg-white min-h-screen flex flex-col font-sans">
      {/* HERO SECTION */}
      <section className="relative w-full h-[70vh] bg-gradient-to-r from-[#f7ede1] to-white overflow-hidden">
        {/* Animated Floating Shapes in Hero */}
        <motion.div
          className="absolute w-[200px] h-[200px] bg-[#C17829] rounded-full opacity-30 top-[-50px] left-[-50px] z-0"
          animate={{ x: [0, 10, 0], y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[300px] h-[300px] bg-[#2C2C4A] rounded-full opacity-10 bottom-[-100px] right-[-100px] z-0"
          animate={{ x: [0, -10, 0], y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="max-w-7xl mx-auto h-full px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
            {/* Left Side: Text */}
            <motion.div
              className="text-center md:text-left max-w-prose mx-auto"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.h1
                className="font-serif text-5xl sm:text-6xl font-bold text-[#2C2C4A] mb-4"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                About Us
              </motion.h1>
              <motion.p
                className="text-gray-800 text-lg leading-loose mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                We are committed to reshaping the legal landscape with advanced
                AI-driven solutions that empower legal professionals worldwide.
              </motion.p>
              <motion.a
                href="#our-story"
                className="inline-block px-6 py-3 bg-[#C17829] text-white rounded-full font-semibold text-lg shadow-md hover:bg-[#ad6823] hover:shadow-lg transition-all active:bg-[#A66F24] hover:scale-[1.01]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                Our Journey →
              </motion.a>
            </motion.div>

            {/* Right Side: Image */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            >
              <motion.img
                src={aboutHero}
                alt="About Us Hero"
                className="rounded-xl shadow-lg max-w-sm md:max-w-md"
                // Soft continuous zoom animation
                animate={{ scale: [1, 1.02, 1] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* OUR STORY SECTION with Background Image Overlay */}
      <section id="our-story" className="relative py-20 px-4 bg-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${ourStoryImage})` }}
        />
        <div className="relative max-w-7xl mx-auto text-center">
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#C17829] mb-6">
            Our Story
          </h2>
          <p className="text-gray-800 text-lg leading-loose max-w-prose mx-auto mb-8">
            Founded on the belief that legal processes can be reimagined through
            technology, our team of experts merged legal expertise with
            cutting-edge AI. Our mission is to simplify legal workflows, reduce
            risk, and empower professionals with precision tools.
          </p>
          {/* Optional: Insert a carousel here to showcase milestones */}
        </div>
      </section>

      {/* OUR MISSION SECTION */}
      <section
        id="our-mission"
        className="relative py-20 px-4 bg-[#f7ede1] overflow-hidden"
      >
        {/* Animated Floating Shapes for Mission Section */}
        <motion.div
          className="absolute w-[200px] h-[200px] bg-[#C17829] rounded-full opacity-30 top-[-50px] left-[-50px] z-0"
          animate={{ x: [0, 10, 0], y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[300px] h-[300px] bg-[#2C2C4A] rounded-full opacity-10 bottom-[-100px] right-[-100px] z-0"
          animate={{ x: [0, -10, 0], y: [0, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative max-w-7xl mx-auto text-center">
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#C17829] mb-8">
            Our Mission
          </h2>
          <p className="text-gray-800 text-lg leading-loose max-w-prose mx-auto mb-12">
            To empower legal professionals with innovative AI tools that
            streamline processes and enhance the accuracy of legal analyses,
            fostering a transparent and efficient legal ecosystem.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div
              className="p-8 bg-white rounded-md shadow-lg transition-transform duration-300 hover:scale-105"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <FaLightbulb className="mx-auto text-3xl text-[#C17829] mb-4" />
              <h3 className="font-serif text-xl font-semibold text-[#C17829] mb-2">
                Innovation
              </h3>
              <p className="text-base text-gray-800">
                Pushing the boundaries of legal technology.
              </p>
            </motion.div>
            <motion.div
              className="p-8 bg-white rounded-md shadow-lg transition-transform duration-300 hover:scale-105"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <FaHandshake className="mx-auto text-3xl text-[#C17829] mb-4" />
              <h3 className="font-serif text-xl font-semibold text-[#C17829] mb-2">
                Integrity
              </h3>
              <p className="text-base text-gray-800">
                Upholding ethical and transparent practices.
              </p>
            </motion.div>
            <motion.div
              className="p-8 bg-white rounded-md shadow-lg transition-transform duration-300 hover:scale-105"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <FaGlobe className="mx-auto text-3xl text-[#C17829] mb-4" />
              <h3 className="font-serif text-xl font-semibold text-[#C17829] mb-2">
                Global Reach
              </h3>
              <p className="text-base text-gray-800">
                Connecting expertise from around the world.
              </p>
            </motion.div>
            <motion.div
              className="p-8 bg-white rounded-md shadow-lg transition-transform duration-300 hover:scale-105"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <FaUserTie className="mx-auto text-3xl text-[#C17829] mb-4" />
              <h3 className="font-serif text-xl font-semibold text-[#C17829] mb-2">
                Expertise
              </h3>
              <p className="text-base text-gray-800">
                Led by industry veterans in law and tech.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* OUR TEAM SECTION */}
      <section id="our-team" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-[#C17829] mb-8">
            Our Team
          </h2>
          <p className="text-gray-800 text-lg leading-loose max-w-prose mx-auto mb-12">
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
              <a href={member.link} key={i} className="block">
                <motion.div
                  className="relative group bg-gradient-to-r from-white to-[#f7f1e9] shadow-lg transition-all duration-300 rounded-xl p-6 hover:-translate-y-1 hover:shadow-xl"
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
                  <h3 className="font-serif text-xl font-bold text-[#2C2C4A] mb-1 text-center">
                    {member.name}
                  </h3>
                  <p className="text-sm text-gray-800 mb-2 text-center">
                    {member.role}
                  </p>
                  <p className="text-sm text-gray-800 italic text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    "{member.bio}"
                  </p>
                </motion.div>
              </a>
            ))}
          </motion.div>
          {/* Contact Us CTA under the team section */}
          <div className="mt-12">
            <a
              href="/contact"
              className="inline-block bg-[#C17829] text-white px-8 py-3 rounded-full font-semibold text-lg shadow-md hover:bg-[#ad6823] hover:shadow-lg transition-all active:bg-[#A66F24] hover:scale-[1.01]"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
