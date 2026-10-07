import React from "react";
import Link from "next/link";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  href?: string;
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  href,
  external = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  // Base button: min-height 48px, fully rounded pill, crisp luxury styling, no text wrapping
  const baseClasses =
    "group inline-flex items-center justify-center font-medium rounded-full transition-[transform,box-shadow,background-color,border-color,color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none min-h-[48px] whitespace-nowrap cursor-pointer";

  const sizeClasses = {
    sm: "px-5 sm:px-6 py-2 text-xs uppercase tracking-wider",
    md: "px-7 py-3 text-sm tracking-wide",
    lg: "px-9 py-3.5 text-base tracking-wide",
  };

  const variantClasses = {
    // Primary: Solid orange pill with black text
    primary:
      "btn-sheen text-black border border-[#FFB073]/60 bg-[linear-gradient(180deg,#FFB073_0%,#FF7315_55%,#DC4C00_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_6px_20px_-10px_rgba(255,115,21,0.45)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_28px_-10px_rgba(255,115,21,0.55)] hover:-translate-y-0.5 active:translate-y-0 font-semibold",
    // Secondary: 1px orange outline with orange text
    secondary:
      "btn-sheen bg-white/[0.02] backdrop-blur-sm text-gold border border-gold/50 hover:border-gold hover:bg-gold-soft hover:-translate-y-0.5 active:translate-y-0",
    // Outline: subtle black-line border
    outline:
      "bg-transparent text-text border border-black-line hover:border-gold hover:text-gold active:translate-y-0.5",
  };

  const combinedClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  if (href) {
    if (external) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={combinedClasses}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={combinedClasses}>
        {children}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} {...props}>
      {children}
    </button>
  );
}
