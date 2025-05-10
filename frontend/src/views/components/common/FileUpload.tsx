import React, { useState } from "react";
import { Button } from "./button";
import { motion, AnimatePresence } from "framer-motion";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

interface FileUploadProps {
  /** Called with the new document’s ID after a successful upload */
  onUploaded: (docId: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploaded }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: "POST",
        credentials: "include", // send auth cookie / JWT
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.detail ?? "Upload failed");

      onUploaded(data.doc_id);
      setFile(null);
    } catch (err: any) {
      setError(err.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <input
        type="file"
        onChange={handleChange}
        className="block w-full text-sm text-gray-900
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-md file:border-0
                   file:text-sm file:font-semibold
                   file:bg-indigo-50 file:text-indigo-700
                   hover:file:bg-indigo-100"
      />

      <Button onClick={handleUpload} disabled={loading || !file}>
        {loading ? "Uploading…" : "Upload"}
      </Button>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm text-red-600"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
