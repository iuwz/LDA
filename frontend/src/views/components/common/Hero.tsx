// src/components/common/Hero.tsx
import React from "react";
import { motion } from "framer-motion";

interface HeroProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  bgImage?: string;
}

const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  ctaText,
  ctaLink,
  bgImage,
}) => (
  <section
    className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[70vh] bg-center bg-cover bg-no-repeat"
    style={{ backgroundImage: bgImage ? `url(${bgImage})` : undefined }}
  >
    <div className="absolute inset-0 bg-black/50" />

    <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 sm:px-6 lg:px-8 text-center">
      <motion.h1
        className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white font-bold mb-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {title}
      </motion.h1>
      <motion.p
        className="text-white text-sm sm:text-base md:text-lg max-w-prose mb-5"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {subtitle}
      </motion.p>
      <motion.a
        href={ctaLink}
        className="inline-block bg-[#C17829] text-white px-5 py-3 sm:px-6 sm:py-4 rounded-full text-sm sm:text-base md:text-lg font-semibold shadow hover:bg-[#ad6823] transition-all"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        {ctaText}
      </motion.a>
    </div>
  </section>
);

export default Hero;
