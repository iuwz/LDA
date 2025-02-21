import { FileText, Trash } from "lucide-react";

interface UploadedFilesProps {
  files: File[];
  onDelete: (index: number) => void; // Function to delete files
}

export default function UploadedFiles({ files, onDelete }: UploadedFilesProps) {
  return (
    <div className="flex gap-6">
      {files.length > 0 ? (
        files.map((file, index) => (
          <div
            key={index}
            className="flex flex-col items-center p-4 bg-[#f7ede1] rounded-md shadow-md w-32 relative"
          >
            <FileText size={40} className="text-gray-700" />
            <p className="text-gray-700 mt-2 text-sm">{file.name}</p>
            {/* Delete Button */}
            <button
              onClick={() => onDelete(index)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600 transition"
            >
              <Trash size={16} />
            </button>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No files uploaded</p>
      )}
    </div>
  );
}
