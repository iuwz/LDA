import { FileText } from "lucide-react";
import React from "react";

interface FileUploadProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function FileUpload({ onFileUpload }: FileUploadProps) {
  return (
    <div className="flex flex-col items-center justify-center bg-white p-4">
      {/* Drag & Drop Box (Reduced Height) */}
      <label
        className="flex flex-col items-center justify-center w-72 h-32 border border-dashed border-gray-400 rounded-md bg-[#f7ede1] cursor-pointer hover:border-gray-500 transition p-3"
      >
        <FileText size={40} className="text-gray-500 mb-2" />
        <p className="text-gray-700 text-sm text-center">
          Drag & drop or choose a file.
        </p>
        <p className="text-gray-600 text-xs">PDF, DOC supported</p>
        <input type="file" className="hidden" multiple onChange={onFileUpload} />
      </label>
    </div>
  );
}
