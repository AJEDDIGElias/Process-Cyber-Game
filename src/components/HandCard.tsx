import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Card, AtoutCard, PreuveCard, AtoutSubtype } from '../types';

const ATOUT_SUBTYPE_STYLES: Record<AtoutSubtype, { border: string; glow: string; badge: string; icon: string }> = {
  bonus:     { border: 'border-cyber-cyan/60',   glow: 'shadow-[0_0_20px_rgba(0,212,255,0.4)]',   badge: 'bg-cyber-cyan/20 text-cyber-cyan',     icon: '⭐' },
  malus:     { border: 'border-cyber-red/60',    glow: 'shadow-[0_0_20px_rgba(255,59,59,0.4)]',   badge: 'bg-cyber-red/20 text-cyber-red',        icon: '💣' },
  bluff:     { border: 'border-orange-500/60',   glow: 'shadow-[0_0_20px_rgba(249,115,22,0.4)]',  badge: 'bg-orange-900/30 text-orange-400',      icon: '🃏' },
  politique: { border: 'border-cyber-yellow/60', glow: 'shadow-[0_0_20px_rgba(250,204,21,0.3)]',  badge: 'bg-cyber-yellow/20 text-cyber-yellow',  icon: '🏛️' },
  risque:    { border: 'border-cyber-purple/60', glow: 'shadow-[0_0_20px_rgba(139,92,246,0.4)]',  badge: 'bg-cyber-purple/20 text-cyber-purple',  icon: '⚠️' },
  reaction:  { border: 'border-cyber-green/60',  glow: 'shadow-[0_0_20px_rgba(0,255,136,0.35)]',  badge: 'bg-cyber-green/20 text-cyber-green',    icon: '⚡' },
};

const PREUVE_STYLE = {
  border: 'border-cyber-green/50',
  glow: 'shadow-[0_0_20px_rgba(0,255,136,0.3)]',
  badge: 'bg-cyber-green/20 text-cyber-green',
};

type Props = {
  card: Card;
  isSelected: boolean;
  isPlayable?: boolean;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
};

export default function HandCard({ card, isSelected, isPlayable = true, onClick, onDragStart, onDragEnd }: Props) {
  const [hovered, setHovered] = useState(false);
  const isAtout = card.type === 'Atout';
  const isPreuve = card.type === 'Preuve';
  const atout = isAtout ? (card as AtoutCard) : null;
  const preuve = isPreuve ? (card as PreuveCard) : null;

  const style = isAtout && atout ? ATOUT_SUBTYPE_STYLES[atout.subtype] : PREUVE_STYLE;

  return (
    // Outer wrapper handles HTML5 drag events (no Framer Motion drag)
    <div
      draggable={isPlayable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'inline-block', flexShrink: 0 }}
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 40, scale: 0.85 }}
        animate={{
          opacity: 1,
          y: isSelected ? -16 : hovered && isPlayable ? -12 : 0,
          scale: hovered && isPlayable ? 1.05 : 1,
        }}
        exit={{ opacity: 0, y: 30, scale: 0.8 }}
        transition={{ duration: 0.15 }}
        onClick={isPlayable ? onClick : undefined}
        role="button"
        tabIndex={isPlayable ? 0 : -1}
        onKeyDown={(e) => { if (isPlayable && (e.key === 'Enter' || e.key === ' ')) onClick(); }}
        className={[
          'relative flex flex-col gap-1.5 p-3 rounded-2xl border text-left cursor-pointer',
          'bg-gradient-to-b from-cyber-panel to-cyber-bg',
          'min-w-[120px] max-w-[140px]',
          style.border,
          isSelected || hovered ? style.glow : '',
          !isPlayable ? 'opacity-40 cursor-not-allowed' : '',
        ].join(' ')}
      >
        {/* Top type badge */}
        <div className="flex items-center justify-between">
          <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${style.badge}`}>
            {isAtout ? 'Atout' : 'Preuve'}
          </span>
          {isAtout && atout && <span className="text-base leading-none">{ATOUT_SUBTYPE_STYLES[atout.subtype].icon}</span>}
          {isPreuve && preuve && <span className="text-base leading-none">{preuve.icon}</span>}
        </div>

        {/* Card name */}
        <h3 className="text-white text-[11px] font-semibold leading-tight">{card.nom}</h3>

        {/* Description */}
        {isAtout && atout && (
          <p className="text-[9px] text-slate-400 leading-snug flex-1">{atout.description}</p>
        )}
        {isPreuve && (
          <p className="text-[9px] text-slate-400">Preuve de conformité</p>
        )}

        {/* Selected glow ring */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              key="selected-ring"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl border-2 border-white/40 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
