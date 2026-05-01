"use client";
import React from "react";
import { cn } from "../../lib/cn";

interface ShimmerButtonProps {
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
  "aria-busy"?: boolean | "true" | "false";
}

export function ShimmerButton({
  children,
  className,
  type = "button",
  disabled,
  onClick,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative inline-flex h-10 w-full items-center justify-center overflow-hidden rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-6 font-medium text-white transition-all duration-300",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer-slide_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        "hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] hover:brightness-110",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
