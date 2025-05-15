// src/views/pages/Dashboard/AllUploads.tsx
import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCloudUploadAlt,
  FaDownload,
  FaTrash,
  FaArrowLeft,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import { Button } from "../../components/common/button";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";
const toDate = (id: string) =>
  new Date(parseInt(id.substring(0, 8), 16) * 1000).toLocaleString();

interface Doc {
  _id: string;
  filename: string;
  owner_id: string;
  file_id: string;
}

const AllUploads: React.FC = () => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pendingDel, setPendingDel] = useState<Doc | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* fetch */
  const fetchDocs = async () => {
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
    void fetchDocs();
  }, []);

  /* delete */
  const confirmDelete = async () => {
    if (!pendingDel) return;
    setIsDeleting(true);
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
      setIsDeleting(false);
    }
  };

  /* row */
  const Row = ({ d, i }: { d: Doc; i: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.02 }}
      className="grid grid-cols-1 sm:grid-cols-[auto_1fr_auto_auto] items-center gap-2 sm:gap-4
                 rounded-lg border px-4 py-3 bg-white/90 hover:bg-gray-50/90"
    >
      <FaCloudUploadAlt className="text-indigo-600" />

      <div className="truncate">
        <p className="truncate font-medium text-gray-800">{d.filename}</p>
        <p className="text-xs text-gray-500">{toDate(d._id)}</p>
      </div>

      <a
        href={`${API_BASE}/documents/download/${d._id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-1 rounded-md px-3 py-1 text-sm
                   text-[#c17829] hover:bg-[#a66224]/10 sm:w-auto"
      >
        <FaDownload /> Download
      </a>

      <button
        onClick={() => setPendingDel(d)}
        disabled={isDeleting}
        className="flex w-full items-center justify-center gap-1 text-sm text-red-600 hover:text-red-800
                   disabled:opacity-50 sm:w-auto"
      >
        <FaTrash /> Remove
      </button>
    </motion.div>
  );

  /* ─────────────────────────── UI ─────────────────────────── */
  return (
    <>
      <div className="mx-auto max-w-4xl p-6">
        <section className="rounded-2xl border bg-white p-8 shadow space-y-6">
          <div className="flex flex-col gap-6">
            <a
              href="/dashboard"
              className="flex items-center gap-1 text-[#C17829] hover:underline"
            >
              <FaArrowLeft /> Back to dashboard
            </a>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-semibold">All uploads</h1>
              <InlineUpload onDone={fetchDocs} />
            </div>

            {loading ? (
              <p className="text-gray-600">Loading…</p>
            ) : err ? (
              <p className="text-red-600">{err}</p>
            ) : docs.length === 0 ? (
              <p className="text-gray-600">No documents uploaded yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {docs
                  .slice()
                  .sort((a, b) => (a._id < b._id ? 1 : -1))
                  .map((d, i) => (
                    <Row key={d._id} d={d} i={i} />
                  ))}
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
              className="fixed inset-0 z-40 bg-black/40"
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
              <div className="w-full max-w-sm space-y-4 rounded-xl bg-white p-6 shadow-xl">
                <h4 className="text-lg font-semibold text-[color:var(--brand-dark)]">
                  Delete Document
                </h4>
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete{" "}
                  <span className="font-medium">{pendingDel?.filename}</span>?
                  This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setPendingDel(null)}
                    disabled={isDeleting}
                    className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting && (
                      <FaSpinner className="mr-2 inline-block animate-spin" />
                    )}
                    {isDeleting ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AllUploads;

/* ───────── InlineUpload ───────── */
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
        className="h-9 w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 sm:w-48"
      >
        {busy ? "Uploading…" : file ? "Upload" : "Choose File to upload"}
      </Button>
      {file && !busy && (
        <span className="flex max-w-xs items-center gap-1 truncate text-sm text-gray-700">
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
