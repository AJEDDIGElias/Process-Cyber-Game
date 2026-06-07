import { motion } from 'framer-motion';
import type { Card, AtoutCard, PreuveCard, AtoutSubtype } from '../types';

type ArtConfig = {
  border: string;
  glow: string;
  badge: string;
  icon: string;
  art: { from: string; to: string; accent: string };
};

const ATOUT_CONFIG: Record<AtoutSubtype, ArtConfig> = {
  bonus:     { border: 'border-cyan-400/60',    glow: '0 0 48px rgba(0,212,255,0.75)',    badge: 'bg-cyan-900/60 text-cyan-300',      icon: '⭐', art: { from: '#081c28', to: '#020a10', accent: '#00d4ff' } },
  malus:     { border: 'border-red-500/60',     glow: '0 0 48px rgba(255,59,59,0.75)',    badge: 'bg-red-900/60 text-red-300',        icon: '💣', art: { from: '#1c0808', to: '#0a0202', accent: '#ff3b3b' } },
  bluff:     { border: 'border-orange-500/60',  glow: '0 0 48px rgba(249,115,22,0.75)',   badge: 'bg-orange-900/60 text-orange-300',  icon: '🃏', art: { from: '#1c1008', to: '#0a0602', accent: '#f97316' } },
  politique: { border: 'border-yellow-400/60',  glow: '0 0 48px rgba(250,204,21,0.65)',   badge: 'bg-yellow-900/60 text-yellow-300',  icon: '🏛️', art: { from: '#1c1808', to: '#0a0a02', accent: '#facc15' } },
  risque:    { border: 'border-purple-500/60',  glow: '0 0 48px rgba(139,92,246,0.75)',   badge: 'bg-purple-900/60 text-purple-300',  icon: '⚠️', art: { from: '#100818', to: '#05020a', accent: '#8b5cf6' } },
  reaction:  { border: 'border-emerald-400/60', glow: '0 0 48px rgba(0,255,136,0.65)',    badge: 'bg-emerald-900/60 text-emerald-300', icon: '⚡', art: { from: '#081c10', to: '#020a06', accent: '#00ff88' } },
};

const PREUVE_CONFIG: ArtConfig = {
  border: 'border-emerald-400/50',
  glow: '0 0 48px rgba(0,255,136,0.55)',
  badge: 'bg-emerald-900/60 text-emerald-300',
  icon: '📋',
  art: { from: '#081c10', to: '#020a06', accent: '#00ff88' },
};

const CARD_W = 126;
const CARD_H = 174;

type Props = {
  card: Card;
  x: number;
  y: number;
};

export default function DragGhost({ card, x, y }: Props) {
  const isAtout = card.type === 'Atout';
  const atout = isAtout ? (card as AtoutCard) : null;
  const preuve = !isAtout ? (card as PreuveCard) : null;
  const cfg = isAtout && atout ? ATOUT_CONFIG[atout.subtype] : PREUVE_CONFIG;
  const icon = isAtout ? cfg.icon : (preuve?.icon ?? '📋');
  const cardImage = (card as any).image as string | undefined;

  return (
    <motion.div
      className="fixed pointer-events-none z-[9999]"
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ duration: 0.12 }}
      style={{
        left: x - CARD_W / 2,
        top: y - CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
      }}
    >
      {/* Card body */}
      <div
        className={`w-full h-full flex flex-col rounded-2xl border ${cfg.border} overflow-hidden`}
        style={{
          background: `linear-gradient(170deg, ${cfg.art.from} 0%, ${cfg.art.to} 100%)`,
          boxShadow: cfg.glow,
          transform: 'rotate(-7deg) scale(1.08)',
          transformOrigin: 'center center',
          opacity: 0.92,
        }}
      >
        {/* Badge + icon */}
        <div className="flex items-center justify-between px-2 pt-2 pb-1 flex-shrink-0">
          <span className={`text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md ${cfg.badge}`}>
            {isAtout ? atout!.subtype : 'Preuve'}
          </span>
          <span className="text-[13px] leading-none">{icon}</span>
        </div>

        {/* Illustration */}
        <div
          className="relative mx-2 rounded-xl overflow-hidden flex-1"
          style={{
            border: `1px solid ${cfg.art.accent}33`,
            background: `radial-gradient(ellipse at 50% 30%, ${cfg.art.from}cc, ${cfg.art.to})`,
          }}
        >
          {cardImage ? (
            <img src={cardImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center relative">
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `radial-gradient(circle, ${cfg.art.accent} 1px, transparent 1px)`,
                  backgroundSize: '10px 10px',
                }}
              />
              <span className="text-4xl relative z-10 drop-shadow-lg">{icon}</span>
              {['top-1.5 left-1.5 border-t border-l', 'top-1.5 right-1.5 border-t border-r',
                'bottom-1.5 left-1.5 border-b border-l', 'bottom-1.5 right-1.5 border-b border-r'].map((cls, i) => (
                <div key={i} className={`absolute w-3 h-3 opacity-50 ${cls}`} style={{ borderColor: cfg.art.accent }} />
              ))}
            </div>
          )}
          <div
            className="absolute bottom-0 left-0 right-0 h-5"
            style={{ background: `linear-gradient(to top, ${cfg.art.to}, transparent)` }}
          />
        </div>

        {/* Nameplate */}
        <div className="px-2 pt-1.5 pb-2 flex-shrink-0">
          <div className="h-px mb-1.5 opacity-40"
            style={{ background: `linear-gradient(90deg, transparent, ${cfg.art.accent}, transparent)` }} />
          <h3 className="text-white text-[10px] font-bold leading-tight text-center truncate">{card.nom}</h3>
        </div>
      </div>

      {/* Drag trail shimmer */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
        style={{ transform: 'rotate(-7deg) scale(1.08)', transformOrigin: 'center center' }}
        animate={{ opacity: [0.6, 0.2, 0.6] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="absolute inset-0 rounded-2xl"
          style={{ boxShadow: `inset 0 0 20px ${cfg.art.accent}40` }}
        />
      </motion.div>
    </motion.div>
  );
}
