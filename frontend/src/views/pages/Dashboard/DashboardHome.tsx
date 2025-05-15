// src/views/pages/Dashboard/DashboardHome.tsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  FaRobot,
  FaEdit,
  FaShieldAlt,
  FaClipboardCheck,
  FaLanguage,
  FaCloudUploadAlt,
  FaDownload,
  FaTrash,
  FaTimes,
  FaArrowRight,
} from "react-icons/fa";
import Banner from "../../components/common/Banner";
import ToolList, { ToolCard } from "../../components/common/toolList";
import { Button } from "../../components/common/button";
import { BubbleGenerator } from "../Home/home";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const toDate = (id: string) =>
  new Date(parseInt(id.substring(0, 8), 16) * 1000).toLocaleString();

interface Doc {
  _id: string;
  filename: string;
  owner_id: string;
  file_id: string;
}

const tools: ToolCard[] = [
  {
    icon: FaEdit,
    title: "Rephrasing",
    desc: "Improve clarity & tone.",
    link: "/dashboard/rephrasing",
  },
  {
    icon: FaShieldAlt,
    title: "Risk Assessment",
    desc: "Spot legal issues fast.",
    link: "/dashboard/risk-assessment",
  },
  {
    icon: FaClipboardCheck,
    title: "Compliance",
    desc: "Verify standards.",
    link: "/dashboard/compliance",
  },
  {
    icon: FaLanguage,
    title: "Translation",
    desc: "Translate accurately.",
    link: "/dashboard/translation",
  },
  {
    icon: FaRobot,
    title: "Chatbot",
    desc: "Ask legal-doc questions.",
    link: "/dashboard/chatbot",
  },
];

export default function DashboardHome() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pendingDel, setPendingDel] = useState<Doc | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ───────────── fetch uploads ───────────── */
  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/documents`, {
        credentials: "include",
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail ?? "Could not load documents");
      setDocs(data);
      setErr(null);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  /* ───────────── delete flow ───────────── */
  const confirmDelete = async () => {
    if (!pendingDel) return;
    setIsDeleting(true);
    try {
      await fetch(`${API_BASE}/documents/${pendingDel._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setDocs((prev) => prev.filter((d) => d._id !== pendingDel._id));
    } catch {
      alert("Delete failed");
    } finally {
      setPendingDel(null);
      setIsDeleting(false);
    }
  };

  /* ───────────── row component ───────────── */
  const Row = ({ d, i }: { d: Doc; i: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.02 }}
      className="
        grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto]
        items-center gap-2 sm:gap-4
        rounded-lg border px-4 py-3
        bg-white hover:bg-gray-50
      "
    >
      <div className="flex items-center">
        <FaCloudUploadAlt className="text-indigo-600" />
      </div>

      <div className="truncate">
        <p className="font-medium text-gray-800 truncate">{d.filename}</p>
        <p className="text-xs text-gray-500">{toDate(d._id)}</p>
      </div>

      <a
        href={`${API_BASE}/documents/download/${d._id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="
          flex items-center justify-center gap-1
          rounded-md px-3 py-1
          text-sm text-[#c17829] hover:bg-[#a66224]/10
          w-full sm:w-auto
        "
      >
        <FaDownload /> Download
      </a>

      <button
        disabled={isDeleting}
        onClick={() => setPendingDel(d)}
        className="
          flex items-center justify-center gap-1
          text-sm text-red-600 hover:text-red-800
          disabled:opacity-50 w-full sm:w-auto
        "
      >
        <FaTrash /> Remove
      </button>
    </motion.div>
  );

  const recent = docs
    .slice()
    .sort((a, b) => (a._id < b._id ? 1 : -1))
    .slice(0, 5);

  /* ════════════════════════════════════════════════════════════ */
  return (
    <>
      <div className="space-y-14 p-6 max-w-6xl mx-auto">
        <Banner />

        {/* tools */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Your tools</h2>
          <ToolList tools={tools} />
        </section>

        {/* uploads with bubbles */}
        <section className="relative rounded-2xl overflow-hidden bg-white shadow border p-8">
          <div className="absolute inset-0 pointer-events-none">
            <BubbleGenerator />
            <BubbleGenerator />
          </div>

          <div className="relative z-10 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h3 className="text-xl font-semibold">Recent uploads</h3>
              <InlineUpload onDone={refresh} />
            </div>

            {loading && docs.length === 0 ? (
              <p className="text-gray-600">Loading documents…</p>
            ) : err ? (
              <p className="text-red-600 py-4">
                Error: {err}.{" "}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={refresh}
                  className="text-[#C17829] hover:underline"
                >
                  Try again
                </Button>
              </p>
            ) : docs.length === 0 ? (
              <p className="text-gray-600">No documents uploaded yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {recent.map((d, i) => (
                  <Row key={d._id} d={d} i={i} />
                ))}
              </div>
            )}

            {docs.length > 5 && (
              <div className="self-end">
                <Link
                  to="/dashboard/uploads"
                  className="inline-flex items-center gap-1 text-[#C17829] hover:underline rounded-md font-medium"
                >
                  View all <FaArrowRight size={12} />
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* delete modal */}
      <AnimatePresence>
        {pendingDel && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setPendingDel(null)}
            />
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
                <h4 className="text-lg font-semibold">Remove document</h4>
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete{" "}
                  <span className="font-medium">{pendingDel.filename}</span>?
                  This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingDel(null)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ───────────────────────── inline upload ───────────────────────── */
function InlineUpload({ onDone }: { onDone: () => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const click = () => (!file ? fileRef.current?.click() : upload());
  const clearFile = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        credentials: "include",
        body: form,
      });
      if (!res.ok) {
        const { detail = "Upload failed" } = await res.json().catch(() => ({}));
        throw new Error(detail);
      }
      await onDone();
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      alert(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />
      <Button
        size="sm"
        variant="primary"
        onClick={click}
        disabled={busy}
        className="w-full sm:w-48 h-9 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
      >
        {busy ? "Uploading…" : file ? "Upload" : "Choose File to upload"}
      </Button>
      {file && !busy && (
        <span className="flex items-center gap-1 text-sm text-gray-700 truncate max-w-xs">
          {file.name}
          <Button
            size="xs"
            variant="outline"
            onClick={clearFile}
            className="ml-1 px-1"
            title="Remove file"
            aria-label="Remove selected file"
          >
            <FaTimes />
          </Button>
        </span>
      )}
    </div>
  );
}
