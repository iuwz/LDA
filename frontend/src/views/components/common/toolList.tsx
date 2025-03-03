import { FileText, Edit, ListChecks, ShieldCheck, Languages } from "lucide-react";
import React from "react";

const tools = [
  { icon: FileText, label: "Analyze Document", link: "/analyze" },
  { icon: Edit, label: "Rephrasing Tool", link: "/rephrase" },
  { icon: ListChecks, label: "Compliance Checker", link: "/compliance" },
  { icon: ShieldCheck, label: "Risk Assessment", link: "/risk" },
  { icon: Languages, label: "Translation Tool", link: "/translate" },
];

export default function ToolList() {
  return (
    <div className="flex flex-col space-y-3">
      {tools.map(({ icon: Icon, label, link }, index) => (
        <button
          key={index}
          onClick={() => console.log(`Navigating to: ${link}`)}
          className="flex items-center gap-3 p-3 w-full bg-[#f7ede1] border border-[#e0d3c2] rounded-md shadow-sm 
                     hover:bg-[#e8d9c5] transition-colors cursor-pointer"
        >
          <Icon className="w-5 h-5 text-gray-700" />
          <span className="text-gray-800 text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
