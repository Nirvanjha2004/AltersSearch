"use client";
import React, { useState } from "react";
import { cn } from "../../lib/cn";

interface HoverEffectProps {
  children: React.ReactNode;
  className?: string;
}

export function HoverEffect({ children, className }: HoverEffectProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={cn("group relative rounded-xl", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <span className="absolute inset-0 h-full w-full rounded-xl bg-[var(--accent)]/10 block" />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
