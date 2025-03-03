import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary"; // Primary or secondary variant
}

export function Button({
  children,
  className,
  variant = "primary", // Default to primary
  ...props
}: ButtonProps) {
  // Primary: #C17829 background with black text
  // Secondary: white/transparent with #C17829 border and text
  const baseStyles =
    "px-4 py-2 rounded font-medium transition-colors duration-200";

  const variantStyles = {
    primary:
      "bg-[#C17829] hover:bg-[#ad6823] text-black border border-[#C17829]",
    secondary:
      "bg-transparent border border-[#C17829] text-[#C17829] hover:bg-[#C17829] hover:text-black",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className || ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
