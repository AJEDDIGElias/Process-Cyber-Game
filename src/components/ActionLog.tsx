import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HistoryEntry } from '../types';

const TYPE_STYLES = {
  action: { dot: 'bg-cyber-cyan', text: 'text-slate-300' },
  event:  { dot: 'bg-cyber-red',  text: 'text-red-300' },
  system: { dot: 'bg-slate-500',  text: 'text-slate-500' },
  score:  { dot: 'bg-cyber-green', text: 'text-cyber-green' },
};

const RECENT_COUNT = 4;

function Entry({ entry, idx, muted = false }: { entry: HistoryEntry; idx: number; muted?: boolean }) {
  const s = TYPE_STYLES[entry.type];
  return (
    <div className={`flex gap-2 items-start py-0.5 ${muted ? 'opacity-45' : ''}`}>
      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      <div>
        <span className="text-[9px] text-slate-600 font-mono">T{entry.tour} </span>
        <span className={`text-[10px] leading-snug ${s.text}`}>{entry.message}</span>
      </div>
    </div>
  );
}

export default function ActionLog({ entries, tour }: { entries: HistoryEntry[]; tour: number }) {
  const olderRef = useRef<HTMLDivElement>(null);

  // Keep the older section scrolled to its bottom (closest to the separator)
  useEffect(() => {
    if (olderRef.current) {
      olderRef.current.scrollTop = olderRef.current.scrollHeight;
    }
  }, [entries.length]);

  const splitAt = Math.max(0, entries.length - RECENT_COUNT);
  const older = entries.slice(0, splitAt);          // oldest → shown in scrollable area
  const recent = entries.slice(splitAt);             // last 4 → always visible

  return (
    <div className="flex flex-col h-full bg-cyber-surface border border-cyber-border rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-cyber-border bg-cyber-panel flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse" />
        <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">Journal</p>
        <span className="ml-auto text-[10px] font-mono text-slate-500">Tour {tour}</span>
      </div>

      {/* Older entries — scrollable, muted */}
      <div ref={olderRef} className="flex-1 overflow-y-auto px-3 pt-2 pb-1 space-y-0.5 scrollbar-thin min-h-0">
        {older.map((entry, i) => (
          <Entry key={i} entry={entry} idx={i} muted />
        ))}
        {older.length === 0 && (
          <p className="text-[9px] text-slate-700 italic text-center pt-4">Historique vide</p>
        )}
      </div>

      {/* Separator */}
      {older.length > 0 && (
        <div className="mx-3 flex items-center gap-2 flex-shrink-0">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyber-border/50 to-transparent" />
          <span className="text-[8px] text-slate-600 font-mono uppercase tracking-widest">récent</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyber-border/50 to-transparent" />
        </div>
      )}

      {/* Recent entries — always visible, animated */}
      <div className="flex-shrink-0 px-3 pt-1 pb-2 space-y-0.5 bg-cyber-bg/20">
        <AnimatePresence initial={false}>
          {recent.map((entry, i) => {
            const s = TYPE_STYLES[entry.type];
            return (
              <motion.div
                key={splitAt + i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-2 items-start py-0.5"
              >
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                <div>
                  <span className="text-[9px] text-slate-600 font-mono">T{entry.tour} </span>
                  <span className={`text-[10px] leading-snug ${s.text}`}>{entry.message}</span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
}
