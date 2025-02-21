import { useState, useRef } from "react";
import ToolList from "./toolList";
import UploadedFiles from "./uploadedFiles";
import FileUpload from "./FileUpload";
import React from "react";

export default function Dashboard() {
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null); // Ref for file input

  // Handle file uploads
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles([...files, ...Array.from(event.target.files)]);
      event.target.value = ""; // Reset input so same file can be uploaded again
    }
  };

  // Handle file deletion
  const handleDelete = (indexToDelete: number) => {
    setFiles(files.filter((_, index) => index !== indexToDelete));
  };

  // Discard all files
  const handleDiscardAll = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset file input after discard
    }
  };

  return (
    <div className="bg-white p-16 min-h-screen flex justify-center">
      {/* Wrapper for content */}
      <div className="flex max-w-6xl w-full">
        {/* Left: Tool List */}
        <div className="w-1/4 mr-12">
          <ToolList />
        </div>

        {/* Right: Uploaded Files Section */}
        <div className="flex-1 flex flex-col items-center">
          {/* Dynamic Heading */}
          <h2 className="text-3xl font-semibold text-gray-800 mb-8">
            {files.length > 0 ? "Uploaded Files" : "Upload Your File"}
          </h2>

          {/* File Upload Component */}
          <FileUpload onFileUpload={handleFileUpload} />

          {/* Display Uploaded Files */}
          <UploadedFiles files={files} onDelete={handleDelete} />

          {/* Buttons: Discard */}
          <button
            onClick={handleDiscardAll}
            className="mt-6 bg-[#C17829] text-white px-8 py-3 rounded-lg hover:bg-[#ad6823] transition-colors"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
