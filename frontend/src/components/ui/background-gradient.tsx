"use client";
import React from "react";
import { cn } from "../../lib/cn";

interface BackgroundGradientProps {
  children: React.ReactNode;
  className?: string;
}

export function BackgroundGradient({ children, className }: BackgroundGradientProps) {
  return (
    <div className={cn("group relative rounded-xl p-[1px]", className)}>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--accent)] via-[var(--glow-accent)] to-[var(--accent)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative z-10 rounded-xl bg-[var(--card-bg)]">{children}</div>
    </div>
  );
}
