// src/views/pages/Dashboard/DashboardChatbot.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  chat as askGPT,
  listChatHistory,
  getChatSession,
  ChatMessage,
  ChatSessionSummary,
  deleteChatSession,
} from "../../../api";
import {
  FaRobot,
  FaPaperPlane,
  FaRegLightbulb,
  FaPlus,
  FaHistory,
  FaRegTrashAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface Message extends ChatMessage {
  id: number;
}
interface Chat extends ChatSessionSummary {
  messages: Message[];
}

const DashboardChatbot: React.FC = () => {
  const [input, setInput] = useState("");
  const [isTyping, setTyping] = useState(false);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [chats, setChats] = useState<Chat[]>([]);
  const [active, setActive] = useState<Chat | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fmtTime = (t: string) =>
    new Date(t).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Riyadh",
    });

  const fmtDate = (t: string) => {
    const msgLocal = new Date(
      new Date(t).toLocaleString("en-US", { timeZone: "Asia/Riyadh" })
    );
    const nowLocal = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" })
    );
    const yestLocal = new Date(nowLocal);
    yestLocal.setDate(nowLocal.getDate() - 1);

    if (msgLocal.toDateString() === nowLocal.toDateString()) return "Today";
    if (msgLocal.toDateString() === yestLocal.toDateString())
      return "Yesterday";
    return msgLocal.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      timeZone: "Asia/Riyadh",
    });
  };

  useEffect(() => {
    (async () => {
      const history = await listChatHistory();
      const mapped: Chat[] = history.map((h) => ({ ...h, messages: [] }));
      setChats(mapped);
      if (mapped.length) loadSession(mapped[0].id);
      else createDraft();
    })();
  }, []);

  const loadSession = async (sid: string) => {
    const summary = chats.find((c) => c.id === sid);
    if (!summary) return;
    const res = await getChatSession(sid);
    const msgs: Message[] = res.messages.map((m, i) => ({ ...m, id: i + 1 }));
    const chat = { ...summary, messages: msgs };
    setActive(chat);
    setChats((prev) => prev.map((c) => (c.id === chat.id ? chat : c)));
    setView("chat");
  };

  const createDraft = () => {
    const now = new Date().toISOString();
    const draft: Chat = {
      id: `draft-${Date.now()}`,
      title: "New Conversation",
      preview: "",
      created_at: now,
      updated_at: now,
      messages: [
        {
          id: 1,
          sender: "bot",
          text: "Hello – I’m your LDA assistant. How can I help?",
          timestamp: now,
        },
      ],
    };
    setChats((prev) => [draft, ...prev]);
    setActive(draft);
    setView("chat");
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages]);

  useEffect(() => {
    if (view === "chat") inputRef.current?.focus();
  }, [view]);

  const send = async () => {
    if (!input.trim() || !active) return;
    const now = new Date().toISOString();
    const userMsg: Message = {
      id: active.messages.length + 1,
      sender: "user",
      text: input.trim(),
      timestamp: now,
    };
    const optimistic = { ...active, messages: [...active.messages, userMsg] };
    setActive(optimistic);
    setChats((prev) =>
      prev.map((c) => (c.id === optimistic.id ? optimistic : c))
    );
    setInput("");
    setTyping(true);

    try {
      const res = await askGPT({
        query: userMsg.text,
        session_id: active.id.startsWith("draft-") ? undefined : active.id,
      });

      const botMsg: Message = {
        id: optimistic.messages.length + 1,
        sender: "bot",
        text: res.bot_response,
        timestamp: new Date().toISOString(),
      };

      const updated: Chat = {
        ...optimistic,
        id: res.session_id,
        title:
          optimistic.title === "New Conversation"
            ? userMsg.text.slice(0, 50)
            : optimistic.title,
        preview: botMsg.text.slice(0, 60) + "...",
        updated_at: botMsg.timestamp,
        messages: [...optimistic.messages, botMsg],
      };

      setChats((prev) => {
        const filtered = prev.filter(
          (c) => c.id !== optimistic.id && c.id !== updated.id
        );
        return [updated, ...filtered];
      });
      setActive(updated);
    } catch (e: any) {
      const botMsg: Message = {
        id: optimistic.messages.length + 1,
        sender: "bot",
        text: `⚠️ ${e.message || "Server error"}`,
        timestamp: new Date().toISOString(),
      };
      const fallback = {
        ...optimistic,
        messages: [...optimistic.messages, botMsg],
      };
      setActive(fallback);
      setChats((prev) =>
        prev.map((c) => (c.id === fallback.id ? fallback : c))
      );
    } finally {
      setTyping(false);
    }
  };

  const removeChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id.startsWith("draft-")) {
      try {
        await deleteChatSession(id);
      } catch (err) {
        console.error("Could not delete chat session:", err);
      }
    }
    setChats((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (active?.id === id) {
        if (remaining.length) loadSession(remaining[0].id);
        else createDraft();
      }
      return remaining;
    });
  };

  useEffect(() => {
    (async () => {
      const history = await listChatHistory();
      const mapped: Chat[] = history.map((h) => ({ ...h, messages: [] }));
      setChats(mapped);
      createDraft();
    })();
  }, []);

  const msgs = active?.messages ?? [];
  const prompts = [
    "How do I structure a privacy policy?",
    "What clauses belong in an NDA?",
    "Explain 'consideration' in contract law.",
    "Key elements of a valid contract?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-[#F8F9FA] rounded-lg shadow-md overflow-hidden font-sans">
      <div className="bg-[color:var(--accent-dark)] text-white p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FaRobot className="text-2xl" />
          <h1 className="text-xl font-semibold">LDA Assistant</h1>
        </div>
        <div className="flex space-x-1">
          {(["chat", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setView(t)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                view === t
                  ? "bg-white text-[color:var(--accent-dark)] border border-[color:var(--accent-dark)]"
                  : "bg-[color:var(--accent-dark)] text-white hover:bg-[color:var(--accent-light)]"
              }`}
            >
              {t === "chat" ? "Chat" : "History"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {view === "chat" ? (
            <motion.div
              key="chat"
              className="flex-1 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-gray-50">
                {msgs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <FaRegLightbulb className="text-4xl text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                      How can I assist you today?
                    </h3>
                    <p className="text-gray-500 text-center max-w-md mb-6">
                      Ask any questions about legal documents, contract terms or
                      compliance requirements.
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
                            m.sender === "user"
                              ? "text-white/70"
                              : "text-gray-500"
                          }`}
                        >
                          {fmtTime(m.timestamp)}
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

                <div ref={scrollRef} />
              </div>

              {msgs.length < 2 && (
                <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Suggested:</p>
                  <div className="flex flex-wrap gap-2">
                    {prompts.map((p, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setInput(p);
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

              <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Type your message..."
                    className="w-full sm:flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[color:var(--accent-dark)] focus:border-[color:var(--accent-dark)]"
                  />
                  <motion.button
                    onClick={send}
                    disabled={!input.trim() || isTyping}
                    className={`flex items-center justify-center gap-2 rounded-md w-full sm:w-11 h-10 sm:h-11 text-white transition-colors ${
                      !input.trim() || isTyping
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[rgb(193,120,41)] hover:bg-[rgb(173,108,37)]"
                    }`}
                    whileHover={{ scale: !input.trim() || isTyping ? 1 : 1.05 }}
                    whileTap={{ scale: !input.trim() || isTyping ? 1 : 0.95 }}
                  >
                    <FaPaperPlane size={18} />
                  </motion.button>
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
              <div className="p-3 sm:p-4 bg-gray-50 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Your Conversations
                </h2>
                <motion.button
                  onClick={createDraft}
                  className="flex items-center space-x-1 text-sm font-medium px-3 py-1 rounded-md shadow-sm transition-colors bg-[rgb(193,120,41)] hover:bg-[rgb(173,108,37)] text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaPlus size={12} />
                  <span>New Chat</span>
                </motion.button>
              </div>

              <div className="p-3 sm:p-4 flex-1 overflow-y-auto space-y-2">
                {chats.length === 0 ? (
                  <div className="text-center py-12">
                    <FaHistory className="mx-auto text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-500">No history yet</p>
                    <motion.button
                      onClick={createDraft}
                      className="mt-4 text-sm underline text-[rgb(193,120,41)]"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Start a conversation
                    </motion.button>
                  </div>
                ) : (
                  chats.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => loadSession(c.id)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        active?.id === c.id
                          ? "border-2 border-[color:var(--accent-dark)]"
                          : "border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-800">{c.title}</h3>
                        <div className="flex items-center space-x-1">
                          <span className="text-xs text-gray-500">
                            {fmtDate(c.updated_at)}
                          </span>
                          <button
                            onClick={(e) => removeChat(c.id, e)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <FaRegTrashAlt size={14} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-1">
                        {c.preview}
                      </p>
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
