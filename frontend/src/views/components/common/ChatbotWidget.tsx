import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaRobot, FaPaperPlane, FaTimes } from "react-icons/fa";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: 1,
    text: "Hello! I'm your LDA assistant. How can I help you with your legal document needs today?",
    sender: "bot",
    timestamp: new Date(),
  },
];

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        isOpen &&
        !target.closest(".chatbot-container") &&
        !target.closest(".chatbot-toggle")
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      sendMessage();
    }
  };

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate bot response after a delay
    setTimeout(() => {
      // Sample bot responses based on user input
      let botResponse = "";
      const userText = inputValue.toLowerCase();

      if (
        userText.includes("hello") ||
        userText.includes("hi") ||
        userText.includes("hey")
      ) {
        botResponse =
          "Hello! How can I assist you with your legal documents today?";
      } else if (
        userText.includes("services") ||
        userText.includes("what do you offer")
      ) {
        botResponse =
          "We offer AI-powered document analysis, compliance checking, risk assessment, and rephrasing tools. Would you like to know more about any specific service?";
      } else if (
        userText.includes("compliance") ||
        userText.includes("check")
      ) {
        botResponse =
          "Our compliance checker helps you stay up-to-date with evolving regulations. It provides real-time standards updates and industry-specific checks.";
      } else if (
        userText.includes("price") ||
        userText.includes("cost") ||
        userText.includes("pricing")
      ) {
        botResponse =
          "We offer several pricing tiers to meet your needs. For detailed pricing information, please visit our pricing page or contact our sales team.";
      } else if (userText.includes("contact") || userText.includes("support")) {
        botResponse =
          "You can reach our support team at support@lda.com or visit our contact page to fill out a support request.";
      } else if (userText.includes("thank")) {
        botResponse =
          "You're welcome! Is there anything else I can help you with?";
      } else if (userText.includes("bye") || userText.includes("goodbye")) {
        botResponse =
          "Thank you for chatting with us! Feel free to return if you have more questions.";
      } else {
        botResponse =
          "I appreciate your question. For more specific assistance, would you like me to connect you with one of our specialists?";
      }

      const botMessageObj: Message = {
        id: messages.length + 2,
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessageObj]);
      setIsTyping(false);
    }, 1500);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      {/* Chatbot Icon */}
      <motion.button
        className="chatbot-toggle fixed bottom-6 right-6 bg-[#C17829] text-white p-4 rounded-full shadow-lg z-50 flex items-center justify-center hover:bg-[#ad6823] transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleChat}
        aria-label="Open chat assistant"
      >
        <FaRobot className="text-xl" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="chatbot-container fixed bottom-20 right-6 w-80 sm:w-96 bg-white rounded-lg shadow-xl z-50 overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "400px" }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Chat Header */}
            <div className="bg-[#2C2C4A] text-white p-3 flex items-center justify-between">
              <div className="flex items-center">
                <FaRobot className="text-xl mr-2" />
                <h3 className="font-medium">LDA Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-300 transition-colors"
                aria-label="Close chat"
              >
                <FaTimes />
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === "user"
                        ? "bg-[#C17829] text-white"
                        : "bg-white border border-gray-200 text-gray-800"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === "user"
                          ? "text-white/70"
                          : "text-gray-500"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-[80%]">
                    <div className="flex space-x-1">
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.8,
                          delay: 0,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.8,
                          delay: 0.2,
                        }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-gray-400 rounded-full"
                        animate={{ y: [0, -5, 0] }}
                        transition={{
                          repeat: Infinity,
                          duration: 0.8,
                          delay: 0.4,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <div className="flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 py-2 px-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-[#C17829] focus:border-[#C17829]"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim()}
                  className={`p-2 ${
                    inputValue.trim()
                      ? "bg-[#C17829] hover:bg-[#ad6823]"
                      : "bg-gray-300 cursor-not-allowed"
                  } text-white rounded-r-lg transition-colors`}
                  aria-label="Send message"
                >
                  <FaPaperPlane />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Powered by LDA AI Assistant
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotWidget;
