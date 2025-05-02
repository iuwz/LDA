// src/views/pages/Dashboard/DashboardHome.tsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFileAlt,
  FaClipboardCheck,
  FaShieldAlt,
  FaLanguage,
  FaRobot,
  FaArrowRight,
  FaCloudUploadAlt,
  FaDownload,
  FaTrashAlt,
  FaTimes,
} from "react-icons/fa";
import Banner from "../../components/common/Banner";
import ToolList, { ToolCard } from "../../components/common/toolList";
import { Button } from "../../components/common/button";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
const toDate = (id: string) =>
  new Date(parseInt(id.substring(0, 8), 16) * 1000).toLocaleString();

/* ─── Types ─── */
interface Doc {
  _id: string;
  filename: string;
  owner_id: string;
  file_id: string;
}

/* ─── Dashboard tools ─── */
const tools: ToolCard[] = [
  {
    icon: FaRobot,
    title: "Chatbot",
    desc: "Ask legal‑doc questions.",
    link: "/dashboard/chatbot",
  },
  {
    icon: FaFileAlt,
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
];

/* ─── Single‑button uploader with “×” clear option ─── */
function InlineUpload({ onDone }: { onDone: () => Promise<void> }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const click = () => (!file ? fileRef.current?.click() : upload());

  const clearFile = () => setFile(null);

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

      await onDone(); // wait until the parent refreshes the list
      setFile(null);
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
        onClick={click}
        disabled={busy}
        className="w-40 h-9 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
      >
        {busy ? "Uploading…" : file ? "Upload" : "Choose File"}
      </Button>
      {file && !busy && (
        <span className="flex items-center gap-1 text-sm text-gray-700 truncate max-w-xs">
          {file.name}
          <button
            onClick={clearFile}
            className="ml-1 text-gray-500 hover:text-gray-800"
            title="Remove file"
          >
            <FaTimes />
          </button>
        </span>
      )}
    </div>
  );
}

/* ─── Main component ─── */
export default function DashboardHome() {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pendingDel, setPendingDel] = useState<Doc | null>(null);

  /* async fetch docs (returns Promise so InlineUpload can await) */
  const refresh = async () => {
    try {
      const r = await fetch(`${API_BASE}/documents`, {
        credentials: "include",
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.detail ?? "Could not load documents");
      setDocs(data);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  /* delete */
  const confirmDelete = async () => {
    if (!pendingDel) return;
    try {
      await fetch(`${API_BASE}/documents/${pendingDel._id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setDocs((p) => p.filter((d) => d._id !== pendingDel._id));
    } catch {
      alert("Delete failed");
    } finally {
      setPendingDel(null);
    }
  };

  /* row */
  const Row = ({ d, i }: { d: Doc; i: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.02 }}
      className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 rounded-lg border px-5 py-3 bg-white hover:bg-gray-50"
    >
      <FaCloudUploadAlt className="text-indigo-600" />
      <div className="truncate">
        <p className="font-medium text-gray-800 truncate">{d.filename}</p>
        <p className="text-xs text-gray-500">{toDate(d._id)}</p>
      </div>

      <Button
        size="xs"
        variant="outline"
        className="w-24 h-9 flex items-center justify-center gap-1"
      >
        <a
          href={`${API_BASE}/documents/download/${d._id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1"
        >
          <FaDownload /> Download
        </a>
      </Button>

      <Button
        size="xs"
        variant="outline"
        className="w-24 h-9 flex items-center justify-center gap-1 border-red-500
                   text-red-500 hover:bg-red-500 hover:text-white"
        onClick={() => setPendingDel(d)}
      >
        <FaTrashAlt /> Remove
      </Button>
    </motion.div>
  );

  const recent = docs
    .slice()
    .sort((a, b) => (a._id < b._id ? 1 : -1))
    .slice(0, 5);

  return (
    <>
      <div className="space-y-14 p-6 max-w-6xl mx-auto">
        <Banner />

        {/* tools */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Your tools</h2>
          <ToolList
            tools={tools}
            hoverIdx={hoverIdx}
            setHoverIdx={setHoverIdx}
          />
        </section>

        {/* uploads */}
        <section className="rounded-2xl bg-white shadow border p-8 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-xl font-semibold">Recent uploads</h3>
            <InlineUpload onDone={refresh} />
          </div>

          {loading ? (
            <p className="text-gray-600">Loading…</p>
          ) : err ? (
            <p className="text-red-600">{err}</p>
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
            <a
              href="/dashboard/uploads"
              className="self-end text-sm text-indigo-600 flex items-center gap-1 hover:underline"
            >
              View all <FaArrowRight size={12} />
            </a>
          )}
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
                  Delete&nbsp;
                  <span className="font-medium">{pendingDel.filename}</span>?
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => setPendingDel(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    className="bg-red-600 text-white hover:bg-red-700"
                    onClick={confirmDelete}
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
