import React from 'react';

const WelcomeSection: React.FC = () => {
  return (
    <section className="bg-white text-center py-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Main headline */}
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Empowering Legal Precision with AI
        </h1>

        {/* Subheading / description */}
        <p className="text-gray-700 text-lg mb-8">
          Leveraging advanced AI tools to enhance accuracy and efficiency 
          in legal document analysis. Our solutions support legal professionals 
          by streamlining compliance, risk assessment, and language clarity.
        </p>

        {/* Animated call-to-action button */}
        <a
          href="#services"
          className="
            relative inline-flex items-center justify-center
            px-6 py-3 overflow-hidden font-semibold text-white
            bg-[#C17829] rounded-md shadow-md group
            transform transition-all duration-300 ease-in-out
            hover:scale-105 hover:rotate-1
          "
        >
          {/* Expanding color-fill layer (green) */}
          <span
            className="
              absolute inset-0 w-0 bg-[#10A37F]
              transition-all duration-500 ease-out
              group-hover:w-full
            "
          />
          {/* Text stays on top */}
          <span className="relative z-10 group-hover:text-white">
            SERVICES &rarr;
          </span>
        </a>
      </div>
    </section>
  );
};

export default WelcomeSection;
