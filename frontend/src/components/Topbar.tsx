import { motion } from "framer-motion";

type TopbarProps = {
  onToggleMobileNav: () => void;
};

export default function Topbar({ onToggleMobileNav }: TopbarProps) {
  return (
    <header className="topbar border-b border-white/10 bg-black/70 px-4 backdrop-blur-xl">
      <div className="topbar-left">
        <motion.button className="icon-button mobile-only" aria-label="Open navigation" onClick={onToggleMobileNav} whileTap={{ scale: 0.95 }}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </motion.button>
        <motion.span className="text-sm font-semibold tracking-tight text-zinc-100" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          AltersSearch
        </motion.span>
        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-violet-300">beta</span>
      </div>

      <div className="topbar-right">
        <motion.button className="ghost-button border border-white/10 bg-white/[0.02]" type="button" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
          <span className="feedback-text">Give feedback</span>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M8 16h8M8 12h8M8 8h8M4 5.2V20l3.6-2.5H20V5.2c0-.66-.54-1.2-1.2-1.2H5.2C4.54 4 4 4.54 4 5.2Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
        <motion.button className="avatar border border-white/15 bg-gradient-to-b from-zinc-800 to-zinc-900" aria-label="User menu" type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>NJ</motion.button>
      </div>
    </header>
  );
}
