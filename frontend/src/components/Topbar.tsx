"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Menu, MessageSquare, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { getInitials } from "../lib/tokenUtils";
import { cn } from "../lib/cn";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TopbarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

// ---------------------------------------------------------------------------
// BETA Badge
// ---------------------------------------------------------------------------

function BetaBadge() {
  return (
    <span className="rounded-full border border-[var(--glow-accent)]/30 bg-[var(--accent)]/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--glow-accent)]">
      beta
    </span>
  );
}

// ---------------------------------------------------------------------------
// Topbar
// ---------------------------------------------------------------------------

export default function Topbar({ onToggleSidebar, sidebarOpen }: TopbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push("/login");
  };

  const handleToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex h-14 items-center justify-between px-4",
        "border-b border-[var(--border)] backdrop-blur-[12px]",
        "bg-[var(--bg-base)]/80"
      )}
      style={{ height: "56px" }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Left side                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-3">
        {/* Hamburger — visible below 960 px */}
        <motion.button
          type="button"
          aria-label="Toggle sidebar"
          aria-expanded={sidebarOpen}
          onClick={onToggleSidebar}
          whileTap={{ scale: 0.93 }}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md",
            "border border-[var(--border)] bg-transparent text-[var(--text-muted)]",
            "transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
            // Hide on desktop (≥ 960 px), show on mobile
            "flex lg:hidden"
          )}
          style={{ display: undefined }} // let Tailwind responsive classes control visibility
        >
          <Menu size={16} aria-hidden="true" />
        </motion.button>

        {/* Brand */}
        <motion.span
          className="text-sm font-semibold tracking-tight text-[var(--text-primary)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          AltersSearch
        </motion.span>

        <BetaBadge />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Right side                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-2">
        {/* Give feedback */}
        <motion.button
          type="button"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            "inline-flex h-8 items-center gap-2 rounded-md px-3",
            "border border-[var(--border)] bg-transparent text-sm text-[var(--text-muted)]",
            "transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--text-primary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          )}
        >
          <MessageSquare size={13} aria-hidden="true" />
          <span className="hidden sm:inline">Give feedback</span>
        </motion.button>

        {/* Theme toggle */}
        <motion.button
          type="button"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          onClick={handleToggleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.93 }}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md",
            "border border-[var(--border)] bg-transparent text-[var(--text-muted)]",
            "transition-colors hover:border-[var(--accent)]/50 hover:text-[var(--text-primary)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          )}
        >
          {theme === "dark" ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />}
        </motion.button>

        {/* Auth controls */}
        {user ? (
          /* Authenticated: avatar + dropdown */
          <div className="relative">
            <motion.button
              type="button"
              aria-label="User menu"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              onClick={() => setDropdownOpen((prev) => !prev)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full",
                "border border-[var(--border)] bg-[var(--card-bg)] text-xs font-medium text-[var(--text-primary)]",
                "transition-colors hover:border-[var(--accent)]/60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              )}
            >
              {getInitials(user.email)}
            </motion.button>

          {/* Backdrop — rendered outside AnimatePresence so it unmounts immediately */}
            {dropdownOpen && (
              <div
                className="fixed inset-0 z-10"
                aria-hidden="true"
                data-testid="dropdown-backdrop"
                onClick={() => setDropdownOpen(false)}
              />
            )}

            {dropdownOpen && (
              /* Dropdown menu — no AnimatePresence so it unmounts synchronously on close */
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                className={cn(
                  "absolute right-0 z-20 mt-1 min-w-[140px] rounded-lg py-1",
                  "border border-[var(--border)] bg-[var(--card-bg)] shadow-lg"
                )}
                role="menu"
                aria-label="User menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2 text-left text-sm",
                    "text-[var(--text-primary)] transition-colors",
                    "hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                  )}
                >
                  <LogOut size={13} aria-hidden="true" />
                  Log out
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          /* Unauthenticated: Sign in link */
          <Link
            href="/login"
            className={cn(
              "inline-flex h-8 items-center rounded-md px-3 text-sm font-medium",
              "text-[var(--text-primary)] transition-colors hover:text-[var(--accent)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            )}
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
