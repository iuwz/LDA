import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function Button({ children, className, ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded border-2 border-yellow-600 text-white bg-yellow-600 hover:bg-yellow-700 hover:text-white transition duration-300 font-semibold ${className}`}
      style={{ color: "white" }}
      {...props}
    >
      {children}
    </button>
  );
}
