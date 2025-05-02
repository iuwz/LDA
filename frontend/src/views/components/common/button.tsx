import React from "react";

type Size = "xs" | "sm" | "md" | "lg";
type Variant = "primary" | "secondary" | "outline";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: Size;
  variant?: Variant;
  className?: string;
}

const sizeStyles: Record<Size, string> = {
  xs: "px-2.5 py-1 text-xs",
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-[#C17829] text-black hover:bg-[#ad6823] disabled:opacity-60 disabled:cursor-not-allowed",
  secondary:
    "bg-transparent border border-[#C17829] text-[#C17829] hover:bg-[#C17829] hover:text-black disabled:opacity-60 disabled:cursor-not-allowed",
  outline:
    "border border-[color:var(--accent-dark)] text-[color:var(--accent-dark)] hover:bg-[color:var(--accent-dark)] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed",
};

export function Button({
  children,
  size = "md",
  variant = "primary",
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      className={`rounded font-medium transition-colors duration-200 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
