// src/components/common/ChatbotWidget.tsx
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

// Use the same accent everywhere
const ACCENT = "#C17829";

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus the input when chat opens
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Close chat when clicking outside
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const tgt = e.target as HTMLElement;
      if (
        isOpen &&
        !tgt.closest(".chatbot-container") &&
        !tgt.closest(".chatbot-toggle")
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isOpen]);

  const toggleChat = () => setIsOpen((o) => !o);

  const sendMessage = () => {
    if (!inputValue.trim()) return;

    // add user message
    const userMsg: Message = {
      id: messages.length + 1,
      text: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((m) => [...m, userMsg]);
    setInputValue("");
    setIsTyping(true);

    // simulate bot reply
    setTimeout(() => {
      let reply =
        "I appreciate your question. May I connect you with a specialist?";
      const txt = userMsg.text.toLowerCase();
      if (txt.includes("hello") || txt.includes("hi")) {
        reply = "Hello! How can I assist you with your legal documents today?";
      }
      const botMsg: Message = {
        id: messages.length + 2,
        text: reply,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((m) => [...m, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        className="chatbot-toggle fixed bottom-6 right-6 p-4 rounded-full shadow-lg z-50 flex items-center justify-center"
        style={{ backgroundColor: ACCENT, color: "#fff" }}
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
            className="chatbot-container fixed bottom-20 right-6 w-80 sm:w-96 bg-white rounded-lg shadow-xl z-50 flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "400px" }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div
              className="p-3 flex items-center justify-between text-white"
              style={{ backgroundColor: ACCENT }}
            >
              <div className="flex items-center gap-2">
                <FaRobot className="text-xl" />
                <h3 className="font-medium">LDA Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`mb-4 flex ${
                    m.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      m.sender === "user"
                        ? "text-white"
                        : "bg-white border border-gray-200 text-gray-800"
                    }`}
                    style={{
                      backgroundColor: m.sender === "user" ? ACCENT : undefined,
                    }}
                  >
                    <p className="text-sm">{m.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        m.sender === "user" ? "text-white/70" : "text-gray-500"
                      }`}
                    >
                      {formatTime(m.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-[80%]">
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 bg-gray-400 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.8,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
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
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Type your message..."
                  className="flex-1 py-2 px-3 border rounded-l-lg focus:outline-none"
                  style={{ borderColor: ACCENT }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputValue.trim()}
                  aria-label="Send message"
                  className="p-2 rounded-r-lg text-white transition-colors"
                  style={{
                    backgroundColor: inputValue.trim() ? ACCENT : "#ccc",
                  }}
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
