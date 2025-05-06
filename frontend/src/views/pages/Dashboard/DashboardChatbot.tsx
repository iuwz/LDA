// src/views/pages/Dashboard/DashboardChatbot.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  FaRobot,
  FaPaperPlane,
  FaRegLightbulb,
  FaPlus,
  FaHistory,
  FaRegTrashAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}
interface Chat {
  id: number;
  title: string;
  preview: string;
  date: Date;
  messages: Message[];
}

const DashboardChatbot: React.FC = () => {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");
  const [conversations, setConversations] = useState<Chat[]>([
    {
      id: 1,
      title: "Contract Review Question",
      preview: "Help with force majeure clauses",
      date: new Date(Date.now() - 3600 * 1000 * 24),
      messages: [
        {
          id: 1,
          text: "Hello! I'm your LDA assistant. How can I help you with your legal documents today?",
          sender: "bot",
          timestamp: new Date(Date.now() - 3600 * 1000 * 24),
        },
        {
          id: 2,
          text: "I need help with force majeure clauses in my contract. Can you provide guidance?",
          sender: "user",
          timestamp: new Date(Date.now() - 3600 * 1000 * 24),
        },
        {
          id: 3,
          text: "Certainly! Force majeure clauses address unforeseen events that prevent parties from fulfilling contractual obligations. Here are some key considerations: 1) Define specific events, 2) Specify trigger impact, 3) Include notification requirements, 4) Outline consequences. Would you like a sample clause?",
          sender: "bot",
          timestamp: new Date(Date.now() - 3600 * 1000 * 24),
        },
      ],
    },
    {
      id: 2,
      title: "Privacy Policy Questions",
      preview: "GDPR compliance requirements",
      date: new Date(Date.now() - 3600 * 1000 * 72),
      messages: [],
    },
  ]);

  // allow activeChat to be null briefly
  const [activeChat, setActiveChat] = useState<Chat | null>(conversations[0] || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestedPrompts = [
    "How do I structure a privacy policy?",
    "What should I include in a non-disclosure agreement?",
    "Can you explain 'consideration' in contract law?",
    "What are the key elements of a valid contract?",
  ];

  // scroll to bottom when messages change
  useEffect(() => {
    if (activeChat?.messages) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChat?.messages]);

  // focus input on chat tab
  useEffect(() => {
    if (activeTab === "chat") inputRef.current?.focus();
  }, [activeTab]);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const formatDate = (date: Date) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === now.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  // helper to update both activeChat and conversations array
  const updateActiveChat = (messages: Message[]) => {
    if (!activeChat) return;
    const updated: Chat = {
      ...activeChat,
      messages,
      preview: messages[messages.length - 1]?.text.slice(0, 40) + "...",
    };
    setActiveChat(updated);
    setConversations((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  const sendMessage = () => {
    if (!inputValue.trim() || !activeChat) return;

    const userMsg: Message = {
      id: activeChat.messages.length + 1,
      text: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    };
    const withUser = [...activeChat.messages, userMsg];
    updateActiveChat(withUser);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      let botText = "Could you give me more details?";
      const txt = userMsg.text.toLowerCase();
      if (txt.includes("privacy")) {
        botText =
          "A privacy policy should cover: data collected, purpose, storage, sharing, rights, and contact info.";
      } else if (txt.includes("contract")) {
        botText =
          "Key contract elements: offer & acceptance, consideration, intent, capacity, legality.";
      }
      const botMsg: Message = {
        id: withUser.length + 1,
        text: botText,
        sender: "bot",
        timestamp: new Date(),
      };
      updateActiveChat([...withUser, botMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const startNewChat = () => {
    const fresh: Chat = {
      id: Date.now(),
      title: "New Conversation",
      preview: "No messages yet",
      date: new Date(),
      messages: [
        {
          id: 1,
          text: "Hello! I'm your LDA assistant. How can I help?",
          sender: "bot",
          timestamp: new Date(),
        },
      ],
    };
    setConversations((prev) => [fresh, ...prev]);
    setActiveChat(fresh);
    setActiveTab("chat");
  };

  const deleteChat = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = conversations.filter((c) => c.id !== id);
    setConversations(filtered);
    if (activeChat?.id === id) {
      filtered.length ? setActiveChat(filtered[0]) : startNewChat();
    }
  };

  // temporarily fallback to empty array if no activeChat
  const msgs = activeChat?.messages || [];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-[#F8F9FA] rounded-lg shadow-md overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-[color:var(--accent-dark)] text-white p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FaRobot className="text-2xl" />
          <h1 className="text-xl font-semibold">Legal Assistant</h1>
        </div>
        <div className="flex space-x-1">
          {(["chat", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                activeTab === tab
                  ? "bg-white text-[color:var(--accent-dark)] border border-[color:var(--accent-dark)]"
                  : "bg-[color:var(--accent-dark)] text-white hover:bg-[color:var(--accent-light)]"
              }`}
            >
              {tab === "chat" ? "Chat" : "History"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === "chat" ? (
            <motion.div
              key="chat"
              className="flex-1 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Messages */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-gray-50">
                {msgs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FaRegLightbulb className="text-4xl text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      How can I assist you today?
                    </h3>
                    <p className="text-gray-500 text-center max-w-md mb-6">
                      Ask any questions about legal documents, contract terms,
                      or compliance requirements.
                    </p>
                  </div>
                ) : (
                  msgs.map((m) => (
                    <div
                      key={m.id}
                      className={`mb-4 flex ${
                        m.sender === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          m.sender === "user"
                            ? "bg-[color:var(--accent-dark)] text-white"
                            : "bg-white border border-[#DDD0C8] text-[#3E2723]"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            m.sender === "user" ? "text-white/70" : "text-gray-500"
                          }`}
                        >
                          {formatTime(m.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}

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

              {/* Suggestions */}
              {msgs.length < 2 && (
                <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedPrompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInputValue(p);
                          inputRef.current?.focus();
                        }}
                        className="bg-white text-gray-700 text-sm px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type your message..."
                    className="w-full sm:flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--accent-dark)] focus:border-[color:var(--accent-dark)]"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    className={`w-full sm:w-11 h-10 sm:h-11 flex-shrink-0 flex items-center justify-center text-white rounded-lg transition-colors ${
                      inputValue.trim() && !isTyping
                        ? "bg-[color:var(--accent-dark)] hover:bg-[color:var(--accent-light)]"
                        : "bg-gray-300 cursor-not-allowed"
                    }`}
                  >
                    <FaPaperPlane size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="history"
              className="flex-1 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* History List */}
              <div className="p-3 sm:p-4 bg-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Your Conversations</h2>
                <button
                  onClick={startNewChat}
                  className="flex items-center space-x-1 text-sm font-medium px-3 py-1 rounded-md bg-[color:var(--accent-dark)] text-white hover:bg-[color:var(--accent-light)]"
                >
                  <FaPlus size={12} />
                  <span>New Chat</span>
                </button>
              </div>

              <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-2">
                {conversations.length === 0 ? (
                  <div className="text-center py-12">
                    <FaHistory className="mx-auto text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-500">No conversation history yet</p>
                    <button
                      onClick={startNewChat}
                      className="mt-4 text-[color:var(--accent-dark)] underline hover:text-[color:var(--accent-light)]"
                    >
                      Start a new conversation
                    </button>
                  </div>
                ) : (
                  conversations.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => {
                        setActiveChat(chat);
                        setActiveTab("chat");
                      }}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        activeChat?.id === chat.id
                          ? "border-2 border-[color:var(--accent-dark)]"
                          : "border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-800">{chat.title}</h3>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">{formatDate(chat.date)}</span>
                          <button
                            onClick={(e) => deleteChat(chat.id, e)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <FaRegTrashAlt size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">{chat.preview}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardChatbot;
