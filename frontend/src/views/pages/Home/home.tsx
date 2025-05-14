import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FaBalanceScale,
  FaRobot,
  FaClipboardCheck,
  FaPenFancy,
  FaBrain,
  FaShieldAlt,
  FaUsers,
  FaExpand,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

import ahmed from "../../../assets/images/ahmed.jpg";
import shalfan from "../../../assets/images/shalfan.jpg";
import saud from "../../../assets/images/saud.jpg";
import sae from "../../../assets/images/sae.jpg";

const SERVICES = [
  {
    icon: FaBalanceScale,
    title: "Advanced Document Analysis",
    description:
      "AI-driven compliance checks, risk assessment, and rephrasing in one place.",
    bullets: [
      "Automated scanning for legal breaches",
      "Instant rephrasing suggestions",
      "In-depth risk scoring",
    ],
    link: "/dashboard",
  },
  {
    icon: FaRobot,
    title: "AI-Powered Legal Chatbot",
    description:
      "On-demand legal guidance and quick references to relevant statutes or precedents.",
    bullets: [
      "24/7 availability",
      "Context-aware Q&A",
      "Seamless platform integration",
    ],
    link: "/dashboard",
  },
  {
    icon: FaClipboardCheck,
    title: "Compliance Checker",
    description:
      "Keep up with evolving regulations effortlessly, reduce non-compliance risks.",
    bullets: [
      "Real-time standards updates",
      "Industry-specific checks",
      "Detailed compliance reports",
    ],
    link: "/dashboard",
  },
  {
    icon: FaPenFancy,
    title: "Risk & Rephrasing Tools",
    description:
      "Polish your documents, removing ambiguity and pre-empting pitfalls.",
    bullets: [
      "Automated language refinement",
      "Customizable risk thresholds",
      "Change-tracking for collaboration",
    ],
    link: "/dashboard",
  },
];

function ServicesSection() {
  return (
    <section id="services" className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto text-center mb-8">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#C17829] mb-6">
          Our Services
        </h2>
        <p className="text-gray-800 text-lg max-w-2xl mx-auto mb-8">
          Discover the features that set us apart in delivering modern,
          AI-driven solutions for your legal workflow.
        </p>
      </div>

      <motion.div
        className="max-w-7xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.2 } },
        }}
      >
        {SERVICES.map((service, i) => {
          const Icon = service.icon;
          return (
            <motion.a
              key={i}
              href={service.link}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative bg-white rounded-2xl p-8 shadow-md transition transform hover:shadow-xl hover:-translate-y-1 overflow-hidden"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C17829] to-[#2C2C4A]" />
              <div className="flex justify-center mb-3">
                <Icon className="text-4xl text-[#C17829]" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#2C2C4A] mb-2 text-center">
                {service.title}
              </h3>
              <p className="text-gray-800 text-sm text-center mb-3 leading-relaxed">
                {service.description}
              </p>
              <ul className="list-disc list-inside text-left text-gray-600 text-sm space-y-1">
                {service.bullets.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </motion.a>
          );
        })}
      </motion.div>
    </section>
  );
}

export const BubbleGenerator = () => {
  const bubbles = Array.from({ length: 40 }).map((_, i) => {
    const size = Math.random() * 120 + 30;
    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const opacity = Math.random() * 0.15 + 0.02;
    const animDuration = Math.random() * 12 + 8;
    const delay = Math.random() * 2;
    const color =
      i % 2 === 0
        ? "from-[#C17829]/30 to-[#C17829]/5"
        : "from-[#2C2C4A]/30 to-[#2C2C4A]/5";
    const moveRange = Math.random() * 50 + 30;

    return {
      id: i,
      size,
      top,
      left,
      opacity,
      animDuration,
      delay,
      color,
      moveRange,
    };
  });

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {bubbles.map((b) => (
        <motion.div
          key={b.id}
          className={`absolute rounded-full bg-gradient-to-r ${b.color}`}
          style={{
            width: b.size,
            height: b.size,
            top: `${b.top}%`,
            left: `${b.left}%`,
            opacity: b.opacity,
          }}
          animate={{
            x: [0, Math.random() < 0.5 ? -b.moveRange : b.moveRange, 0],
            y: [0, Math.random() < 0.5 ? -b.moveRange : b.moveRange, 0],
          }}
          transition={{
            duration: b.animDuration,
            delay: b.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

const whyFeatures = [
  {
    icon: FaBrain,
    title: "AI-Powered",
    text: "Advanced NLP algorithms deliver rapid, precise legal analysis.",
  },
  {
    icon: FaShieldAlt,
    title: "Secure & Reliable",
    text: "Industry-standard encryption keeps your data safe.",
  },
  {
    icon: FaUsers,
    title: "User-Centric",
    text: "Intuitive design that streamlines legal workflows for all.",
  },
  {
    icon: FaExpand,
    title: "Scalable & Flexible",
    text: "Easily integrates with your existing systems.",
  },
];

function WhyChooseUs() {
  return (
    <section className="relative bg-[#f7ede1] py-12 px-4 overflow-hidden">
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

      <div className="relative z-10 max-w-7xl mx-auto text-center">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#C17829] mb-6">
          Why Choose LDA?
        </h2>
        <p className="text-gray-800 text-base sm:text-lg leading-relaxed mb-12 max-w-2xl mx-auto">
          We combine cutting-edge AI with deep legal insights to streamline
          document analysis, ensuring both{" "}
          <span className="text-[#C17829] font-semibold">speed</span> and{" "}
          <span className="text-[#C17829] font-semibold">accuracy</span>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {whyFeatures.map((f, i) => (
            <motion.div
              key={i}
              className="relative bg-white rounded-2xl p-8 shadow-sm transition transform hover:shadow-lg hover:-translate-y-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C17829] to-[#2C2C4A]" />
              <div className="flex items-center justify-center mb-4">
                <f.icon className="text-3xl text-[#C17829]" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-[#2C2C4A] mb-2">
                {f.title}
              </h3>
              <p className="text-gray-700 text-sm">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    name: "Ahmed Alfaifi",
    role: "Software Engineer",
    quote:
      "LDA's AI tools have revolutionized our review process, saving us countless hours.",
    avatarUrl: ahmed,
  },
  {
    name: "Abdulaziz Alsaeed",
    role: "UX Designer",
    quote:
      "The compliance checker is unbelievably quick, it can catch issues almost immediately!",
    avatarUrl: sae,
  },
  {
    name: "Saud Albarkheel",
    role: "Software Engineer",
    quote:
      "The risk assessment feature helped me in identifying pitfalls before they became real issues.",
    avatarUrl: saud,
  },
  {
    name: "Abdulaziz Alshalfan",
    role: "Software Engineer",
    quote:
      "I appreciate how user-friendly the interface is; no steep learning curve for me.",
    avatarUrl: shalfan,
  },
];

function Testimonials() {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(3);

  useEffect(() => {
    function update() {
      const w = window.innerWidth;
      if (w >= 1024) setPerPage(3);
      else if (w >= 640) setPerPage(2);
      else setPerPage(1);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const totalPages = Math.ceil(TESTIMONIALS.length / perPage);
  const start = page * perPage;
  const visible = TESTIMONIALS.slice(start, start + perPage);

  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-7xl mx-auto text-center mb-8">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#C17829] mb-6">
          Our Clients
        </h2>
        <p className="text-gray-800 text-lg max-w-2xl mx-auto mb-8">
          Hear what our satisfied clients have to say about their experience
          with LDA.
        </p>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 overflow-visible">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="absolute -left-8 lg:-left-12 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white bg-opacity-70 text-[#C17829] hover:bg-opacity-100 transition disabled:opacity-50"
        >
          <FaChevronLeft />
        </button>
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page === totalPages - 1}
          className="absolute -right-8 lg:-right-12 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-white bg-opacity-70 text-[#C17829] hover:bg-opacity-100 transition disabled:opacity-50"
        >
          <FaChevronRight />
        </button>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((t, i) => (
            <motion.div
              key={i}
              className="relative bg-gray-50 rounded-2xl p-8 shadow-sm transition transform hover:shadow-lg hover:-translate-y-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C17829] to-[#2C2C4A]" />
              <div className="flex items-center mb-4">
                <img
                  src={t.avatarUrl}
                  alt={t.name}
                  className="w-12 h-12 rounded-full mr-3"
                />
                <div>
                  <p className="font-semibold text-[#2C2C4A]">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
              <p className="text-gray-700 italic leading-relaxed">
                "{t.quote}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="bg-white min-h-screen flex flex-col">
      <section className="relative w-full h-[70vh] flex items-center bg-gradient-to-r from-[#f7ede1] to-white overflow-hidden">
        <BubbleGenerator />
        <motion.div
          className="absolute w-[300px] h-[300px] bg-[#C17829] rounded-full opacity-20 top-[-100px] left-[-100px] z-0"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-[400px] h-[400px] bg-[#2C2C4A] rounded-full opacity-10 bottom-[-150px] right-[-150px] z-0"
          animate={{ x: [0, -40, 0], y: [0, -40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="max-w-7xl mx-auto px-4 relative z-10 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="font-serif text-5xl sm:text-6xl font-extrabold text-[#2C2C4A] mb-6 leading-tight"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Empowering Legal Precision
            <br className="hidden sm:block" />
            <span className="block mt-6 text-[#C17829]">with AI</span>
          </motion.h1>
          <motion.p
            className="text-gray-700 text-lg sm:text-xl mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Leveraging advanced AI tools to enhance accuracy and efficiency in
            legal document analysis.
          </motion.p>
          <motion.a
            href="#services"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("services")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-[#C17829] to-[#E3A063] text-white rounded-full font-semibold text-lg shadow-lg transition transform hover:scale-105"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Explore Services →
          </motion.a>
        </motion.div>
      </section>

      <ServicesSection />
      <WhyChooseUs />
      <Testimonials />
    </main>
  );
}
