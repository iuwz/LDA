import React, { useState, useRef, useEffect } from "react";
import {
  FaRobot,
  FaPaperPlane,
  FaRegLightbulb,
  FaSearch,
  FaPlus,
  FaRegQuestionCircle,
  FaHistory,
  FaRegTrashAlt,
  FaEllipsisH,
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

const DashboardChatbot = () => {
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "history">("chat");
  const [conversations, setConversations] = useState<Chat[]>([
    {
      id: 1,
      title: "Contract Review Question",
      preview: "Help with force majeure clauses",
      date: new Date(Date.now() - 3600000 * 24),
      messages: [
        {
          id: 1,
          text: "Hello! I'm your LDA assistant. How can I help you with your legal documents today?",
          sender: "bot",
          timestamp: new Date(Date.now() - 3600000 * 24),
        },
        {
          id: 2,
          text: "I need help with force majeure clauses in my contract. Can you provide guidance?",
          sender: "user",
          timestamp: new Date(Date.now() - 3600000 * 24),
        },
        {
          id: 3,
          text: "Certainly! Force majeure clauses address unforeseen events that prevent parties from fulfilling contractual obligations. Here are some key considerations: 1) Define specific events (natural disasters, pandemics, etc.), 2) Specify the impact required to trigger the clause, 3) Include notification requirements, 4) Outline consequences (suspension, termination, etc.). Would you like a sample clause or more specific advice?",
          sender: "bot",
          timestamp: new Date(Date.now() - 3600000 * 24),
        },
      ],
    },
    {
      id: 2,
      title: "Privacy Policy Questions",
      preview: "GDPR compliance requirements",
      date: new Date(Date.now() - 3600000 * 72),
      messages: [],
    },
  ]);

  const [activeChat, setActiveChat] = useState<Chat>(conversations[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Suggested prompts
  const suggestedPrompts = [
    "How do I structure a privacy policy?",
    "What should I include in a non-disclosure agreement?",
    "Can you explain 'consideration' in contract law?",
    "What are the key elements of a valid contract?",
  ];

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat.messages]);

  // Focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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
      id: activeChat.messages.length + 1,
      text: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    const updatedMessages = [...activeChat.messages, userMessage];
    updateActiveChat(updatedMessages);

    setInputValue("");
    setIsTyping(true);

    // Simulate bot response after a delay
    setTimeout(() => {
      // Generate a relevant response based on the query
      let botResponse = "";
      const userText = inputValue.toLowerCase();

      if (userText.includes("privacy policy") || userText.includes("gdpr")) {
        botResponse =
          "A privacy policy should include: 1) Types of data collected, 2) Purpose of collection, 3) Data storage practices, 4) Third-party sharing, 5) User rights, and 6) Contact information. For GDPR compliance, you'll also need explicit consent mechanisms, data breach notification procedures, and right to be forgotten provisions. Would you like more specific guidance on any of these areas?";
      } else if (
        userText.includes("contract") ||
        userText.includes("agreement")
      ) {
        botResponse =
          "For a legally binding contract, ensure you have: 1) Offer and acceptance, 2) Consideration (something of value exchanged), 3) Intention to create legal relations, 4) Capacity of parties, and 5) Legality of purpose. I recommend clearly defining all terms, responsibilities, payment details, termination conditions, and dispute resolution procedures. Would you like assistance with any specific section?";
      } else if (
        userText.includes("non-disclosure") ||
        userText.includes("nda") ||
        userText.includes("confidentiality")
      ) {
        botResponse =
          "A strong NDA should define: 1) What constitutes confidential information, 2) Exclusions from confidential information, 3) Obligations of the receiving party, 4) Time period of confidentiality, 5) Permitted disclosures (e.g., to employees or legal counsel), and 6) Remedies for breach. Consider whether you need a mutual or one-way NDA based on information flow. Would you like a template or more specific guidance?";
      } else {
        botResponse =
          "Thank you for your question. I'd be happy to help with that. To provide the most accurate assistance, could you provide any additional details or context about your specific situation? This will help me tailor my response to your needs.";
      }

      const botMessageObj: Message = {
        id: updatedMessages.length + 1,
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      updateActiveChat([...updatedMessages, botMessageObj]);
      setIsTyping(false);
    }, 1500);
  };

  // Update the active chat and its corresponding entry in conversations
  const updateActiveChat = (messages: Message[]) => {
    const updatedChat = {
      ...activeChat,
      messages: messages,
      preview:
        messages[messages.length - 1]?.text.substring(0, 40) + "..." ||
        activeChat.preview,
    };

    setActiveChat(updatedChat);

    setConversations((prevConversations) =>
      prevConversations.map((chat) =>
        chat.id === activeChat.id ? updatedChat : chat
      )
    );
  };

  const startNewChat = () => {
    const newChat: Chat = {
      id: Date.now(),
      title: "New Conversation",
      preview: "No messages yet",
      date: new Date(),
      messages: [
        {
          id: 1,
          text: "Hello! I'm your LDA assistant. How can I help you with your legal documents today?",
          sender: "bot",
          timestamp: new Date(),
        },
      ],
    };

    setConversations((prev) => [newChat, ...prev]);
    setActiveChat(newChat);
    setActiveTab("chat");
  };

  const selectChat = (chat: Chat) => {
    setActiveChat(chat);
    setActiveTab("chat");
  };

  const deleteChat = (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation();

    setConversations((prev) => prev.filter((chat) => chat.id !== chatId));

    // If we deleted the active chat, set a new active chat
    if (activeChat.id === chatId) {
      if (conversations.length > 1) {
        const newActiveChat =
          conversations.find((chat) => chat.id !== chatId) || conversations[0];
        setActiveChat(newActiveChat);
      } else {
        startNewChat();
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    }
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputValue(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-[#F8F9FA] rounded-lg shadow-md overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-[#C18241] text-white p-4 flex items-center justify-between font-sans">

        <div className="flex items-center">
          <FaRobot className="text-2xl mr-2" />
          <h1 className="text-xl font-semibold">Legal Assistant</h1>
        </div>
        <div className="flex space-x-1">
  <button
    onClick={() => setActiveTab("chat")}
    className={`px-3 py-1 rounded-md text-sm font-medium ${
      activeTab === "chat"
        ? "bg-white text-[#C18241] border border-[#C18241]"
        : "bg-[#C18241] text-white hover:bg-[#A96C34]"
    }`}
  >
    Chat
  </button>
  <button
    onClick={() => setActiveTab("history")}
    className={`px-3 py-1 rounded-md text-sm font-medium ${
      activeTab === "history"
        ? "bg-white text-[#C18241] border border-[#C18241]"
        : "bg-[#C18241] text-white hover:bg-[#A96C34]"
    }`}
  >
    History
  </button>
</div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
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
              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {activeChat.messages.length === 0 ? (
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
                  activeChat.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`mb-4 flex ${
                        message.sender === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender === "user"
                            ? "bg-[#C18241] text-white"
                            : "bg-white border border-[#DDD0C8] text-[#3E2723]"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.text}
                        </p>
                        <p
  className={`text-xs mt-1 ${
    message.sender === "user"
      ? "text-white"
      : "text-gray-500"
  }`}
>
  {formatTime(message.timestamp)}
</p>
                      </div>
                    </div>
                  ))
                )}

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

              {/* Suggested Prompts */}
              {activeChat.messages.length < 2 && (
                <div className="p-3 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">
                    Suggested questions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedPrompts.map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestedPrompt(prompt)}
                        className="bg-white text-gray-700 text-sm px-3 py-1 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                    className="flex-1 py-2 px-3 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-1 focus:ring-[#C18241] focus:border-[#C18241]"
                  />
                  <button
  onClick={sendMessage}
  disabled={!inputValue.trim() || isTyping}
  className={`h-11 w-11 flex items-center justify-center ${
    inputValue.trim() && !isTyping
      ? "bg-[#C18241] hover:bg-[#A96C34]"
      : "bg-gray-300 cursor-not-allowed"
  } text-white rounded-r-lg transition-colors`}
  aria-label="Send message"
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
              {/* Conversation History */}
              <div className="p-4 bg-gray-50 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Your Conversations
                  </h2>
                  <button
  onClick={startNewChat}
  className="flex items-center space-x-1 text-sm font-medium px-3 py-1 rounded-md transition-colors
    bg-[#C18241] text-white hover:bg-[#A96C34] active:bg-white active:text-[#C18241] active:border active:border-[#C18241]"
>
  <FaPlus size={12} />
  <span>New Chat</span>
</button>
                </div>

                {conversations.length === 0 ? (
                  <div className="text-center py-12">
                    <FaHistory className="mx-auto text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-500">No conversation history yet</p>
                    <button
                      onClick={startNewChat}
                      className="mt-4 text-purple-600 underline hover:text-purple-800"
                    >
                      Start a new conversation
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {conversations.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => selectChat(chat)}
                        className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors ${
                          activeChat.id === chat.id
                            ? "border-2 border-[#C18241]"
                            : "border border-gray-200"
                        }`}
                      >
                        <div className="flex justify-between">
                          <h3 className="font-medium text-gray-800">
                            {chat.title}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500">
                              {formatDate(chat.date)}
                            </span>
                            <button
                              onClick={(e) => deleteChat(chat.id, e)}
                              className="p-1 text-gray-400 hover:text-red-500"
                              aria-label="Delete conversation"
                            >
                              <FaRegTrashAlt size={14} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {chat.preview}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t border-gray-200 p-3 text-center">
        <p className="text-xs text-gray-500">
          This AI assistant is designed to provide general information and
          guidance.
          <br />
          For specific legal advice, please consult with a qualified legal
          professional.
        </p>
      </div>
    </div>
  );
};

export default DashboardChatbot;
