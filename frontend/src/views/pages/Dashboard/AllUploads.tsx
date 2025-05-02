// src/views/pages/Dashboard/AllUploads.tsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCloudUploadAlt,
  FaDownload,
  FaTrashAlt,
  FaArrowLeft,
} from "react-icons/fa";
import { Button } from "../../components/common/button";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";
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
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => void fetchDocs(), []);

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
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.02 }}
      className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 rounded-lg border px-5 py-3 bg-white hover:bg-gray-50"
    >
      <FaCloudUploadAlt className="text-indigo-600" />
      <div className="truncate max-w-[260px]">
        <p className="font-medium text-gray-800 truncate">{d.filename}</p>
        <p className="text-xs text-gray-500">{toDate(d._id)}</p>
      </div>

      {/* download */}
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

      {/* remove */}
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

  return (
    <>
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        <a
          href="/dashboard"
          className="text-indigo-600 flex items-center gap-1 hover:underline"
        >
          <FaArrowLeft /> Back to dashboard
        </a>

        <h1 className="text-2xl font-semibold">All uploads</h1>

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
};

export default AllUploads;
