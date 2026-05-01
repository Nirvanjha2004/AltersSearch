"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/tokenUtils";

type TopbarProps = {
  onToggleMobileNav: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export default function Topbar({ onToggleMobileNav, theme, onToggleTheme }: TopbarProps) {
  const { isAuthenticated, user, logout } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    router.push("/login");
  };

  return (
    <header className="topbar px-4">
      <div className="topbar-left">
        <motion.button className="icon-button mobile-only" aria-label="Open navigation" onClick={onToggleMobileNav} whileTap={{ scale: 0.95 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </motion.button>
        <motion.span className="text-sm font-semibold tracking-tight text-[var(--text-primary)]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          AltersSearch
        </motion.span>
        <span className="rounded-full border border-[color:color-mix(in_srgb,var(--accent)_28%,transparent)] bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--accent)]">beta</span>
      </div>

      <div className="topbar-right">
        <motion.button className="ghost-button" type="button" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
          <span className="feedback-text">Give feedback</span>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M8 16h8M8 12h8M8 8h8M4 5.2V20l3.6-2.5H20V5.2c0-.66-.54-1.2-1.2-1.2H5.2C4.54 4 4 4.54 4 5.2Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
        <motion.button
          className="icon-button"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          type="button"
          onClick={onToggleTheme}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </motion.button>

        {isAuthenticated && user ? (
          <div className="relative">
            <motion.button
              className="avatar"
              aria-label="User menu"
              aria-expanded={dropdownOpen}
              aria-haspopup="true"
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
            >
              {getInitials(user.email)}
            </motion.button>

            {dropdownOpen && (
              <>
                {/* Backdrop to close dropdown when clicking outside */}
                <div
                  className="fixed inset-0 z-10"
                  aria-hidden="true"
                  onClick={() => setDropdownOpen(false)}
                />
                <div
                  className="absolute right-0 z-20 mt-1 min-w-[120px] rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg"
                  role="menu"
                  aria-label="User menu"
                >
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] focus:outline-none"
                    role="menuitem"
                    type="button"
                    onClick={handleLogout}
                  >
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="ghost-button text-sm font-medium text-[var(--text-primary)] hover:text-[var(--accent)]"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
