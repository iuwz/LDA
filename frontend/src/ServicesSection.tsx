import React from 'react';
import {
  FaBalanceScale,
  FaRobot,
  FaClipboardCheck,
  FaPenFancy
} from 'react-icons/fa';

const ServicesSection: React.FC = () => {
  return (
    <section className="bg-white py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Card 1 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm
                          transform transition-transform duration-300 
                          hover:scale-105">
            <div className="flex justify-center mb-4">
              <FaBalanceScale className="text-3xl text-[#C17829]" />
            </div>
            <h3 className="text-xl font-bold text-[#2C2C4A] mb-2 text-center">
              Advanced Document Analysis
            </h3>
            <p className="text-gray-700 text-sm text-center">
              Utilize AI-driven technology for precise document assessments, 
              including compliance and risk checks tailored to legal standards.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm
                          transform transition-transform duration-300 
                          hover:scale-105">
            <div className="flex justify-center mb-4">
              <FaRobot className="text-3xl text-[#C17829]" />
            </div>
            <h3 className="text-xl font-bold text-[#2C2C4A] mb-2 text-center">
              AI-Powered Legal Chatbot
            </h3>
            <p className="text-gray-700 text-sm text-center">
              Get instant answers to your legal questions with our intelligent chatbot, 
              designed to provide quick, accurate insights and guide you through 
              complex legal matters.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm
                          transform transition-transform duration-300 
                          hover:scale-105">
            <div className="flex justify-center mb-4">
              <FaClipboardCheck className="text-3xl text-[#C17829]" />
            </div>
            <h3 className="text-xl font-bold text-[#2C2C4A] mb-2 text-center">
              AI-Powered Compliance Checker
            </h3>
            <p className="text-gray-700 text-sm text-center">
              Verify documents against current legal standards, identifying any 
              compliance issues to minimize legal risks.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm
                          transform transition-transform duration-300 
                          hover:scale-105">
            <div className="flex justify-center mb-4">
              <FaPenFancy className="text-3xl text-[#C17829]" />
            </div>
            <h3 className="text-xl font-bold text-[#2C2C4A] mb-2 text-center">
              Risk and Rephrasing Tools
            </h3>
            <p className="text-gray-700 text-sm text-center">
              Assess potential legal risks and enhance document clarity with 
              intelligent rephrasing suggestions for more precise communication.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
