"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  LayoutDashboard,
  MessageSquare,
  Code2,
  Settings,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { getInitials } from "../lib/tokenUtils";
import { cn } from "../lib/cn";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

interface IconSidebarProps {
  activeItem?: string;
  onItemClick?: (id: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip wrapper
// ─────────────────────────────────────────────────────────────────────────────

function TooltipBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.93 }}
      className={cn("sidebar-icon-btn", active && "active")}
    >
      {icon}
      <span className="sidebar-tooltip">{label}</span>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IconSidebar
// ─────────────────────────────────────────────────────────────────────────────

export default function IconSidebar({
  activeItem = "search",
  onItemClick,
}: IconSidebarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    router.push("/login");
  };

  const navItems: NavItem[] = [
    {
      id: "dashboard",
      icon: <LayoutDashboard size={17} />,
      label: "Dashboard",
    },
    {
      id: "search",
      icon: <Search size={17} />,
      label: "Search",
    },
    {
      id: "chat",
      icon: <MessageSquare size={17} />,
      label: "Chat",
    },
    {
      id: "code",
      icon: <Code2 size={17} />,
      label: "Code",
    },
  ];

  return (
    <nav className="icon-sidebar" aria-label="Main navigation">
      {/* Top section */}
      <div className="icon-sidebar-top">
        {/* Logo mark */}
        <div className="sidebar-logo" aria-label="AltersSearch">
          A
        </div>

        {/* Nav items */}
        <div className="flex flex-col items-center gap-1 mt-2">
          {navItems.map((item) => (
            <TooltipBtn
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeItem === item.id}
              onClick={() => onItemClick?.(item.id)}
            />
          ))}
        </div>
      </div>

      {/* Bottom section */}
      <div className="icon-sidebar-bottom">
        <TooltipBtn
          icon={<Settings size={17} />}
          label="Settings"
        />

        {/* User avatar / logout */}
        {user ? (
          <div className="relative">
            <motion.button
              type="button"
              aria-label="User menu"
              aria-expanded={showUserMenu}
              aria-haspopup="true"
              onClick={() => setShowUserMenu((p) => !p)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.93 }}
              className="sidebar-avatar"
            >
              {getInitials(user.email)}
            </motion.button>

            {/* Backdrop */}
            {showUserMenu && (
              <div
                className="fixed inset-0 z-10"
                aria-hidden="true"
                onClick={() => setShowUserMenu(false)}
              />
            )}

            {/* Dropdown */}
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, x: -4 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.12 }}
                className="absolute bottom-0 left-[calc(100%+10px)] z-20 min-w-[160px] rounded-lg py-1 shadow-lg"
                style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                }}
                role="menu"
              >
                <div className="px-3 py-2 border-b border-[var(--border)]">
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[140px]">
                    {user.email}
                  </p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <LogOut size={13} aria-hidden="true" />
                  Sign out
                </button>
              </motion.div>
            )}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
