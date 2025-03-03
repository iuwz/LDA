import React, { useRef, useEffect } from "react";
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

// Import PNG assets for team/testimonial photos (adjust paths/file names as needed)
import team1 from "../../../assets/images/icon.jpg";
import team2 from "../../../assets/images/icon.jpg";
import team3 from "../../../assets/images/icon.jpg";
import team4 from "../../../assets/images/icon.jpg";
import team5 from "../../../assets/images/icon.jpg";
import team6 from "../../../assets/images/icon.jpg";

/* ---------------------------
   1) SERVICES DATA & COMPONENT
----------------------------*/

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
              whileHover={{ scale: 1.1, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="block bg-white rounded-xl p-6 shadow-sm border border-gray-200 transition-all hover:shadow-xl hover:border-[#C17829]"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
            >
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
                {service.bullets.map((bullet, idx) => (
                  <li key={idx} dangerouslySetInnerHTML={{ __html: bullet }} />
                ))}
              </ul>
            </motion.a>
          );
        })}
      </motion.div>
    </section>
  );
}

/* ---------------------------
   BUBBLE GENERATOR COMPONENT
----------------------------*/

const BubbleGenerator = () => {
  // Generate random bubbles with varied properties
  const bubbles = Array.from({ length: 40 }).map((_, i) => {
    // Create different sizes for bubbles
    const size = Math.random() * 120 + 30; // 30px to 150px

    // Random positions
    const top = Math.random() * 100;
    const left = Math.random() * 100;

    // Random opacity
    const opacity = Math.random() * 0.25 + 0.05; // 0.05 to 0.3

    // Random animation durations (some faster, some slower)
    const animDuration = Math.random() * 8 + 4; // 4 to 12 seconds

    // Random animation delay
    const delay = Math.random() * 2;

    // Alternate between the two colors
    const color =
      i % 2 === 0
        ? "from-[#C17829]/30 to-[#C17829]/5"
        : "from-[#2C2C4A]/30 to-[#2C2C4A]/5";

    // Random movement range (some move more, some less)
    const moveRange = Math.random() * 50 + 30; // 30px to 80px

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
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className={`absolute rounded-full bg-gradient-to-r ${bubble.color}`}
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            top: `${bubble.top}%`,
            left: `${bubble.left}%`,
            opacity: bubble.opacity,
            zIndex: 0,
          }}
          animate={{
            x: [
              0,
              Math.random() < 0.5 ? -bubble.moveRange : bubble.moveRange,
              0,
            ],
            y: [
              0,
              Math.random() < 0.5 ? -bubble.moveRange : bubble.moveRange,
              0,
            ],
            scale: [1, Math.random() * 0.4 + 0.8, 1],
          }}
          transition={{
            duration: bubble.animDuration,
            delay: bubble.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

/* ---------------------------
   2) WHY CHOOSE US COMPONENT
----------------------------*/

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

const testimonialCards = [
  {
    name: "Adam Wilson",
    role: "Senior Lawyer, West Law Group",
    quote:
      "LDA's AI tools have revolutionized our review process, saving us countless hours.",
    avatarUrl: team1,
  },
  {
    name: "Sarah Ahmed",
    role: "Compliance Officer, FinReg Solutions",
    quote:
      "The compliance checker is unbelievably quick—we catch issues almost immediately now!",
    avatarUrl: team2,
  },
  {
    name: "David Chen",
    role: "Attorney, Chen & Associates",
    quote:
      "The risk assessment feature helped us identify pitfalls before they became real issues.",
    avatarUrl: team3,
  },
  {
    name: "Emily Ross",
    role: "Partner, Ross Legal",
    quote:
      "I appreciate how user-friendly the interface is; no steep learning curve for my team.",
    avatarUrl: team4,
  },
  {
    name: "Michael Scott",
    role: "Manager, Dundie Law Firm",
    quote:
      "We integrated the chatbot and saw immediate improvements in client responsiveness!",
    avatarUrl: team5,
  },
  {
    name: "Olivia Zhang",
    role: "Paralegal, Allied Global",
    quote:
      "The document rephrasing feature is a lifesaver—saves me hours of tedious manual edits.",
    avatarUrl: team6,
  },
];

function WhyChooseUs() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  function scrollLeft() {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  }
  function scrollRight() {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollBy({ left: 300, behavior: "smooth" });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative bg-[#f7ede1] py-12 px-4 overflow-hidden">
      {/* Floating shapes for Why Choose Us using your provided animation */}
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

      <div className="relative z-10 max-w-7xl mx-auto">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#C17829] mb-6 text-center">
          Why Choose LDA?
        </h2>
        <p className="text-gray-800 text-base sm:text-lg md:text-xl max-w-2xl mx-auto text-center mb-8 leading-relaxed">
          We combine cutting-edge AI with deep legal insights to streamline
          document analysis, ensuring both{" "}
          <span className="text-[#C17829] font-semibold">speed</span> and{" "}
          <span className="text-[#C17829] font-semibold">accuracy</span>. Join
          us on a path to more efficient, transparent, and innovative legal
          workflows.
        </p>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.2 } },
          }}
        >
          {whyFeatures.map((feat, i) => (
            <motion.div
              key={i}
              className="p-6 bg-white rounded-md shadow-md transition-all duration-300 hover:shadow-xl group relative overflow-hidden"
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
              whileHover={{
                y: -8,
                transition: { duration: 0.3 },
              }}
            >
              {/* Animated background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#C17829]/5 to-[#2C2C4A]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Icon with animation */}
              <div className="flex items-center justify-center mb-4 relative">
                <motion.div
                  className="p-3 rounded-full bg-[#C17829]/10 flex items-center justify-center"
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <feat.icon className="text-2xl text-[#C17829]" />
                </motion.div>

                {/* Decorative ring that appears on hover */}
                <div className="absolute w-12 h-12 border-2 border-[#C17829]/20 rounded-full scale-0 group-hover:scale-110 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
              </div>

              {/* Title with animation */}
              <h3 className="font-serif text-lg font-semibold text-[#2C2C4A] text-center mb-2 group-hover:text-[#C17829] transition-colors duration-300">
                {feat.title}
              </h3>

              {/* Text that slides up on hover */}
              <p className="text-sm text-gray-700 text-center transform group-hover:translate-y-1 transition-transform duration-300">
                {feat.text}
              </p>

              {/* Hidden line that appears on hover */}
              <div className="w-0 h-0.5 bg-[#C17829] mx-auto mt-3 group-hover:w-16 transition-all duration-300 opacity-0 group-hover:opacity-100" />
            </motion.div>
          ))}
        </motion.div>

        {/* Call-to-Action Button */}
      </div>

      {/* Testimonials Section */}
      <div className="relative z-10 max-w-7xl mx-auto text-center mb-4 mt-12">
        <h3 className="text-2xl sm:text-3xl font-semibold text-[#2C2C4A]">
          What Our Clients Say
        </h3>
        <p className="text-gray-800 max-w-md mx-auto leading-relaxed">
          Trusted by legal professionals worldwide
        </p>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-[#C17829] text-white p-2 rounded-full shadow-md hover:bg-[#ad6823] hover:shadow-lg transition-all active:bg-[#A66F24] hover:scale-[1.01]"
          aria-label="Scroll Left"
        >
          <FaChevronLeft />
        </button>
        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-[#C17829] text-white p-2 rounded-full shadow-md hover:bg-[#ad6823] hover:shadow-lg transition-all active:bg-[#A66F24] hover:scale-[1.01]"
          aria-label="Scroll Right"
        >
          <FaChevronRight />
        </button>

        <div
          ref={scrollContainerRef}
          className="overflow-x-auto no-scrollbar flex gap-6 snap-x snap-mandatory scroll-smooth px-4 pb-4 pt-2"
        >
          {testimonialCards.map((t, idx) => (
            <motion.div
              key={idx}
              className="snap-center min-w-[300px] max-w-xs bg-gradient-to-r from-white to-[#f7f1e9] shadow-lg hover:shadow-2xl transition-shadow duration-300 rounded-xl p-6 flex flex-col"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: idx * 0.1 }}
            >
              <div className="flex items-center mb-3">
                <motion.img
                  src={t.avatarUrl}
                  alt={`${t.name} avatar`}
                  className="w-12 h-12 rounded-full mr-3 object-cover border border-[#C17829]/50"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
                <div>
                  <p className="text-sm font-semibold text-[#2C2C4A]">
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
              <p className="flex-1 text-sm text-gray-800 italic leading-relaxed">
                "{t.quote}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------
   3) THE HOME COMPONENT
----------------------------*/

export default function Home() {
  return (
    <main className="bg-white min-h-screen flex flex-col">
      {/* HERO SECTION with Many Bubbles */}
      <section className="relative w-full h-[70vh] flex items-center bg-gradient-to-r from-[#f7ede1] to-white overflow-hidden">
        {/* Background bubbles */}
        <BubbleGenerator />

        {/* Keep the original larger animated shapes for consistent effect */}
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
            className="text-5xl sm:text-6xl font-extrabold text-[#2C2C4A] mb-6 leading-tight"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Empowering Legal Precision <br className="hidden sm:block" />
            <span className="text-[#C17829]">with AI</span>
          </motion.h1>
          <motion.p
            className="text-gray-700 text-lg sm:text-xl mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Leveraging advanced AI tools to enhance accuracy and efficiency in
            legal document analysis. Streamline compliance checks, risk
            assessment, and rephrasing, all in one place.
          </motion.p>
          <motion.a
            href="#services"
            className="inline-block px-6 py-3 bg-[#C17829] text-white rounded-full font-semibold text-lg shadow-md hover:bg-[#ad6823] hover:shadow-lg transition-all active:bg-[#A66F24] hover:scale-[1.01]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            Explore Services →
          </motion.a>
        </motion.div>
      </section>

      {/* SERVICES SECTION */}
      <ServicesSection />

      {/* WHY CHOOSE US SECTION */}
      <WhyChooseUs />
    </main>
  );
}
