import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Card, AtoutCard, PreuveCard, AtoutSubtype } from '../types';

type ArtConfig = {
  border: string;
  glow: string;
  badge: string;
  icon: string;
  art: { from: string; to: string; accent: string };
};

const ATOUT_CONFIG: Record<AtoutSubtype, ArtConfig> = {
  bonus:     { border: 'border-cyan-400/60',   glow: 'shadow-[0_0_28px_rgba(0,212,255,0.55)]',   badge: 'bg-cyan-900/60 text-cyan-300',     icon: '⭐', art: { from: '#081c28', to: '#020a10', accent: '#00d4ff' } },
  malus:     { border: 'border-red-500/60',    glow: 'shadow-[0_0_28px_rgba(255,59,59,0.55)]',   badge: 'bg-red-900/60 text-red-300',       icon: '💣', art: { from: '#1c0808', to: '#0a0202', accent: '#ff3b3b' } },
  bluff:     { border: 'border-orange-500/60', glow: 'shadow-[0_0_28px_rgba(249,115,22,0.55)]',  badge: 'bg-orange-900/60 text-orange-300', icon: '🃏', art: { from: '#1c1008', to: '#0a0602', accent: '#f97316' } },
  politique: { border: 'border-yellow-400/60', glow: 'shadow-[0_0_28px_rgba(250,204,21,0.45)]',  badge: 'bg-yellow-900/60 text-yellow-300', icon: '🏛️', art: { from: '#1c1808', to: '#0a0a02', accent: '#facc15' } },
  risque:    { border: 'border-purple-500/60', glow: 'shadow-[0_0_28px_rgba(139,92,246,0.55)]',  badge: 'bg-purple-900/60 text-purple-300', icon: '⚠️', art: { from: '#100818', to: '#05020a', accent: '#8b5cf6' } },
  reaction:  { border: 'border-gray-500/60',   glow: 'shadow-[0_0_28px_rgba(100,116,139,0.6)]', badge: 'bg-gray-900/60 text-gray-300',      icon: '⚡', art: { from: '#0d0d0d', to: '#050505', accent: '#6b7280' } },
};

const PREUVE_CONFIG: ArtConfig = {
  border: 'border-emerald-400/50',
  glow: 'shadow-[0_0_28px_rgba(0,255,136,0.4)]',
  badge: 'bg-emerald-900/60 text-emerald-300',
  icon: '📋',
  art: { from: '#081c10', to: '#020a06', accent: '#00ff88' },
};

type Props = {
  card: Card;
  isSelected: boolean;
  isPlayable?: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDrag?: (e: React.DragEvent) => void;
  onZoom?: (card: Card) => void;
};

export default function HandCard({ card, isSelected, isPlayable = true, onClick, onDoubleClick, onDragStart, onDragEnd, onDrag, onZoom }: Props) {
  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isAtout = card.type === 'Atout';
  const isPreuve = card.type === 'Preuve';
  const atout = isAtout ? (card as AtoutCard) : null;
  const preuve = isPreuve ? (card as PreuveCard) : null;

  const cfg = isAtout && atout ? ATOUT_CONFIG[atout.subtype] : PREUVE_CONFIG;
  const cardImage = ((card as any).image as string | undefined) || undefined;
  const icon = isAtout && atout ? cfg.icon : (preuve?.icon ?? '📋');
  const isExpanded = hovered && isPlayable;
  const isActive = isSelected || isExpanded;

  const handleDragStart = (e: React.DragEvent) => { setIsDragging(true); onDragStart(e); };
  const handleDragEnd = () => { setIsDragging(false); onDragEnd(); };

  return (
    // Outer wrapper: fixed 126×174 slot in flex layout; carries HTML5 drag events
    <motion.div
      layout
      initial={{ opacity: 0, y: 60, scale: 0.75 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.7 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {...({ draggable: isPlayable, onDragStart: handleDragStart, onDragEnd: handleDragEnd, onDrag } as any)}
      data-card-id={card.id}
      onContextMenu={(e: React.MouseEvent) => { e.preventDefault(); onZoom?.(card); }}
      className="relative flex-shrink-0"
      style={{ width: 126, height: 174 }}
    >
      {/* Inner card: expands on hover, absolutely positioned so layout is preserved */}
      <motion.div
        animate={{
          opacity: isPlayable ? 1 : 0.4,
          y: isSelected ? -22 : isExpanded ? -16 : 0,
          scale: isSelected ? 1.07 : 1,
        }}
        initial={false}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={isPlayable ? onClick : undefined}
        onDoubleClick={isPlayable ? onDoubleClick : undefined}
        role="button"
        tabIndex={isPlayable ? 0 : -1}
        onKeyDown={(e) => { if (isPlayable && (e.key === 'Enter' || e.key === ' ')) onClick(); }}
        className={[
          'absolute bottom-0 left-0 flex flex-col rounded-2xl border cursor-pointer select-none overflow-hidden',
          cfg.border,
          isActive ? cfg.glow : '',
          !isPlayable ? 'cursor-not-allowed' : '',
        ].join(' ')}
        style={{
          background: `linear-gradient(170deg, ${cfg.art.from} 0%, ${cfg.art.to} 100%)`,
          height: 174,
          zIndex: isActive ? 50 : 1,
        }}
      >
        {/* ── Type badge + icon ─────────────────────────── */}
        <div className="flex items-center justify-between px-2 pt-2 pb-1 z-10 flex-shrink-0">
          <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md ${cfg.badge}`}>
            {isAtout ? atout!.subtype : 'Preuve'}
          </span>
          <span className="text-[13px] leading-none">{icon}</span>
        </div>

        {/* ── Illustration ──────────────────────────────── */}
        <div
          className="relative mx-2 rounded-xl overflow-hidden flex-1"
          style={{
            border: `1px solid ${cfg.art.accent}33`,
            background: `radial-gradient(ellipse at 50% 30%, ${cfg.art.from}cc, ${cfg.art.to})`,
          }}
        >
          {isDragging ? (
            <div className="w-full h-full flex items-center justify-center relative">
              <motion.span
                className="text-4xl relative z-10 drop-shadow-lg"
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}
              >
                {icon}
              </motion.span>
            </div>
          ) : cardImage ? (
            <img src={cardImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center relative">
              {/* Dot pattern background */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `radial-gradient(circle, ${cfg.art.accent} 1px, transparent 1px)`,
                  backgroundSize: '10px 10px',
                }}
              />
              {/* Center icon */}
              <motion.span
                className="text-4xl relative z-10 drop-shadow-lg"
                animate={isActive ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                transition={{ duration: 0.7, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
              >
                {icon}
              </motion.span>
              {/* Corner frame lines */}
              {[
                'top-1.5 left-1.5 border-t border-l',
                'top-1.5 right-1.5 border-t border-r',
                'bottom-1.5 left-1.5 border-b border-l',
                'bottom-1.5 right-1.5 border-b border-r',
              ].map((cls, i) => (
                <div
                  key={i}
                  className={`absolute w-3 h-3 opacity-50 ${cls}`}
                  style={{ borderColor: cfg.art.accent }}
                />
              ))}
            </div>
          )}
          {/* Gradient fade at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 h-5 pointer-events-none"
            style={{ background: `linear-gradient(to top, ${cfg.art.to}, transparent)` }}
          />
        </div>

        {/* ── Nameplate ─────────────────────────────────── */}
        <div className="px-2 pt-1.5 pb-2 flex-shrink-0">
          {/* Decorative separator */}
          <div
            className="h-px mb-1.5 opacity-40"
            style={{ background: `linear-gradient(90deg, transparent, ${cfg.art.accent}, transparent)` }}
          />
          <h3 className="text-white text-[10px] font-bold leading-tight text-center truncate">{card.nom}</h3>

          {/* Description: hidden normally, revealed on expand */}
          {isAtout && atout && (
            <motion.p
              className="text-slate-300 leading-snug text-center mt-0.5 overflow-hidden text-[10px]"
              animate={{ maxHeight: isExpanded ? 80 : 0, opacity: isExpanded ? 1 : 0 }}
              initial={false}
              transition={{ duration: 0.18 }}
            >
              {atout.description}
            </motion.p>
          )}
          {isPreuve && (
            <p className="text-[8px] text-slate-500 text-center mt-0.5">Preuve de conformité</p>
          )}

          {/* Double-click hint when expanded */}
          {isExpanded && isAtout && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[7px] text-slate-600 text-center mt-1"
              style={{ color: cfg.art.accent + '99' }}
            >
              double-clic → jouer sans cible
            </motion.p>
          )}
        </div>

        {/* ── Shimmer on hover ──────────────────────────── */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              key="shimmer"
              className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)',
                }}
                initial={{ x: '-150%' }}
                animate={{ x: '250%' }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Selected pulse ring ───────────────────────── */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              key="ring"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl border-2 border-white/50 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
