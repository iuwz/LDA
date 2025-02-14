import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function Button({ children, className, ...props }: ButtonProps) {
  return (
    <button
      className={`px-6 py-2 rounded-full border-2 border-white text-white bg-transparent hover:bg-white hover:text-yellow-600 transition duration-300 font-semibold ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
