"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  PanelLeftClose,
  PanelLeftOpen,
  SquarePen,
  LogOut,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import { getInitials } from "../lib/tokenUtils";
import { cn } from "../lib/cn";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ChatItem {
  id: string;
  title: string;
}

interface SidebarProps {
  chats: ChatItem[];
  activeChatId?: string;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip (shown in collapsed mode)
// ─────────────────────────────────────────────────────────────────────────────

function Tooltip({ label }: { label: string }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50",
        "whitespace-nowrap rounded-md px-2.5 py-1.5",
        "bg-[var(--bg-elevated)] border border-[var(--border)]",
        "text-xs font-medium text-[var(--text-primary)]",
        "shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      )}
    >
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SidebarItem — used for "New Chat" and "Chats" nav rows
// ─────────────────────────────────────────────────────────────────────────────

function SidebarNavItem({
  icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2",
        "text-sm font-medium transition-all duration-150 cursor-pointer",
        "border border-transparent",
        active
          ? "bg-[var(--accent-soft)] border-[rgba(255,120,73,0.2)] text-[var(--accent)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
        collapsed && "justify-center px-2"
      )}
    >
      {/* Active indicator bar */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-[var(--accent)]" />
      )}

      <span className="flex-shrink-0">{icon}</span>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {collapsed && <Tooltip label={label} />}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ChatListItem
// ─────────────────────────────────────────────────────────────────────────────

function ChatListItem({
  chat,
  active,
  collapsed,
  onClick,
}: {
  chat: ChatItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: collapsed ? 0 : 2 }}
      className={cn(
        "group relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2",
        "text-left text-sm transition-all duration-150 cursor-pointer border border-transparent",
        active
          ? "bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
        collapsed && "justify-center px-2"
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-[var(--accent)]" />
      )}

      <Clock
        size={13}
        className={cn(
          "flex-shrink-0 transition-colors",
          active ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
        )}
        aria-hidden="true"
      />

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden whitespace-nowrap text-ellipsis min-w-0 flex-1"
          >
            <span className="block truncate">{chat.title}</span>
          </motion.span>
        )}
      </AnimatePresence>

      {collapsed && <Tooltip label={chat.title} />}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UserProfileSection
// ─────────────────────────────────────────────────────────────────────────────

function UserProfileSection({
  collapsed,
  onLogout,
}: {
  collapsed: boolean;
  onLogout: () => void;
}) {
  const { user } = useAuth();
  const initials = user ? getInitials(user.email) : "?";
  const displayName = user
    ? (user.email.split("@")[0] ?? user.email)
        .split(/[._-]/)[0]
        ?.replace(/^./, (c) => c.toUpperCase()) ?? user.email
    : "User";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-2.5 py-2",
        "border border-transparent hover:bg-[var(--bg-elevated)] transition-colors",
        collapsed && "justify-center px-2"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex-shrink-0 flex items-center justify-center rounded-full",
          "w-7 h-7 text-[11px] font-semibold",
          "bg-[var(--accent-soft)] border border-[rgba(255,120,73,0.3)] text-[var(--accent)]"
        )}
        aria-hidden="true"
      >
        {initials}
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 items-center justify-between overflow-hidden min-w-0"
          >
            <span className="truncate text-sm font-medium text-[var(--text-primary)]">
              {displayName}
            </span>
            <motion.button
              type="button"
              aria-label="Sign out"
              onClick={onLogout}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.93 }}
              className={cn(
                "ml-2 flex-shrink-0 flex items-center justify-center",
                "w-6 h-6 rounded-md text-[var(--text-muted)]",
                "hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-colors"
              )}
            >
              <LogOut size={13} aria-hidden="true" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed: show logout tooltip */}
      {collapsed && (
        <span className="sr-only">{displayName}</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar (main export)
// ─────────────────────────────────────────────────────────────────────────────

export default function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  collapsed,
  onCollapsedChange,
}: SidebarProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const EXPANDED_W = 240;
  const COLLAPSED_W = 64;

  return (
    <motion.aside
      animate={{ width: collapsed ? COLLAPSED_W : EXPANDED_W }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "fixed top-0 left-0 h-screen z-50 flex flex-col",
        "bg-[var(--bg-surface)] border-r border-[var(--border)]",
        "overflow-hidden select-none"
      )}
      aria-label="Main navigation"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center h-14 px-3 flex-shrink-0",
          "border-b border-[var(--border)]",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {/* Logo */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2.5 overflow-hidden"
            >
              <div
                className={cn(
                  "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center",
                  "bg-[var(--accent)] text-white text-xs font-bold",
                  "shadow-[0_0_12px_rgba(255,120,73,0.3)]"
                )}
                aria-hidden="true"
              >
                A
              </div>
              <span className="text-sm font-semibold text-[var(--text-primary)] tracking-tight whitespace-nowrap">
                AltersSearch
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse toggle */}
        <motion.button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={() => onCollapsedChange(!collapsed)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          className={cn(
            "group relative flex-shrink-0 flex items-center justify-center",
            "w-7 h-7 rounded-md text-[var(--text-muted)]",
            "hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-colors"
          )}
        >
          {collapsed ? (
            <PanelLeftOpen size={15} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={15} aria-hidden="true" />
          )}
          {collapsed && <Tooltip label="Expand sidebar" />}
        </motion.button>
      </div>

      {/* ── Main nav ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 px-2 pt-3 flex-shrink-0">
        {/* New Chat */}
        <SidebarNavItem
          icon={<SquarePen size={15} aria-hidden="true" />}
          label="New Chat"
          collapsed={collapsed}
          onClick={onNewChat}
        />
      </div>

      {/* ── Divider ─────────────────────────────────────────────────────── */}
      <div className="mx-3 my-2 h-px bg-[var(--border)] flex-shrink-0" />

      {/* ── Chat list ───────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex-1 overflow-y-auto px-2 pb-2",
          "scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent"
        )}
      >
        {chats.length === 0 ? (
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-2.5 py-2 text-xs text-[var(--text-muted)]"
              >
                No chats yet
              </motion.p>
            )}
          </AnimatePresence>
        ) : (
          <div className="flex flex-col gap-0.5">
            {chats.map((chat) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                active={chat.id === activeChatId}
                collapsed={collapsed}
                onClick={() => onSelectChat(chat.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer / User ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-[var(--border)] px-2 py-3">
        <UserProfileSection collapsed={collapsed} onLogout={handleLogout} />
      </div>
    </motion.aside>
  );
}
