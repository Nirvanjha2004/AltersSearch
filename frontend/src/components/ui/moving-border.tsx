"use client";
import React from "react";
import { cn } from "../../lib/cn";

interface MovingBorderProps {
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
}

export function MovingBorder({
  children,
  className,
  type = "button",
  disabled,
  onClick,
}: MovingBorderProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative inline-flex h-10 w-full items-center justify-center overflow-hidden rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-6 font-medium text-white transition-all duration-300",
        "hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}
