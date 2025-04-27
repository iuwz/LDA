import React, { useState, FC, useRef, useEffect } from "react";
import { FaBalanceScale } from "react-icons/fa";

interface Message {
  role: "user" | "bot";
  content: string;
}

const ChatWithLDA: FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "user",
      content: "How are you?",
    },
    {
      role: "bot",
      content:
        "As a large language model, I don’t have feelings like humans do. However, I'm functioning well and ready to assist you.",
    },
  ]);

  const [inputValue, setInputValue] = useState("");

  /**
   * 1) Create a ref for the chat window container.
   *    We'll scroll it into view when messages update.
   */
  const chatWindowRef = useRef<HTMLDivElement>(null);

  /**
   * 2) This effect runs whenever `messages` changes.
   *    It scrolls the chat window to the bottom.
   */
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  // Placeholder for bot logic:
  const fetchBotResponse = async (userMessage: string): Promise<string> => {
    return `You said: "${userMessage}". (Simulated LDA response.)`;
  };

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    // Add user's message
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInputValue("");

    // Add bot reply
    const botReply = await fetchBotResponse(trimmed);
    setMessages((prev) => [...prev, { role: "bot", content: botReply }]);
  };

  return (
    <div
      className="flex flex-col w-full max-w-4xl mx-auto h-screen p-4"
      style={{ backgroundColor: "#F9F9F9" }}
    >
      {/* HEADER */}
      <div className="py-2 mb-2">
        <h1
          className="text-xl font-bold text-center"
          style={{ color: "#1F2940" }}
        >
          Chat with LDA
        </h1>
      </div>

      {/* CHAT WINDOW (with ref) */}
      <div
        ref={chatWindowRef}
        className="flex-1 overflow-y-auto mb-4 space-y-2"
      >
        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`flex w-full px-2 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {/* Show the scale icon to the left of the bot's messages */}
              {!isUser && (
                <div className="mr-2 self-center">
                  <FaBalanceScale className="text-2xl text-[#2C2C4A]" />
                </div>
              )}
              <div
                className={`rounded-xl px-3 py-2 max-w-xl ${
                  isUser ? "text-white" : "text-[#1F2940]"
                }`}
                style={{
                  backgroundColor: isUser ? "#C78307" : "#E4E7EB",
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT AREA */}
      <div className="flex items-center space-x-2">
        <input
          className="flex-1 border rounded-md px-3 py-2 outline-none"
          style={{ borderColor: "#1F2940" }}
          placeholder="Ask LDA..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button
          className="text-white px-4 py-2 rounded-md hover:opacity-90"
          style={{ backgroundColor: "#C78307" }}
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatWithLDA;
