import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Card, AtoutCard, PreuveCard, ProjetCard, EvenementCard, AtoutSubtype } from '../types';
import { projetDeck, preuveDeck, atoutDeck, evenementDeck } from '../data';
import CardZoomModal from './CardZoomModal';

// ── Mini card color configs ────────────────────────────────────────────────────

type MiniCfg = { border: string; accent: string; bg: string; icon: string };

const ATOUT_MINI: Record<AtoutSubtype, MiniCfg> = {
  bonus:     { border: '#00d4ff', accent: '#00d4ff', bg: '#081c28', icon: '⭐' },
  malus:     { border: '#ff3b3b', accent: '#ff3b3b', bg: '#1c0808', icon: '💣' },
  bluff:     { border: '#f97316', accent: '#f97316', bg: '#1c1008', icon: '🃏' },
  politique: { border: '#facc15', accent: '#facc15', bg: '#1c1808', icon: '🏛️' },
  risque:    { border: '#8b5cf6', accent: '#8b5cf6', bg: '#100818', icon: '⚠️' },
  reaction:  { border: '#6b7280', accent: '#6b7280', bg: '#0d0d0d', icon: '⚡' },
};

const CRIT_MINI: Record<string, MiniCfg> = {
  S0: { border: '#64748b', accent: '#64748b', bg: '#0d1017', icon: '📁' },
  S1: { border: '#22c55e', accent: '#22c55e', bg: '#081c0e', icon: '📁' },
  S2: { border: '#eab308', accent: '#eab308', bg: '#1c1808', icon: '📁' },
  S3: { border: '#ef4444', accent: '#ef4444', bg: '#1c0808', icon: '📁' },
};

const SEV_MINI: Record<string, MiniCfg> = {
  low:    { border: '#22c55e', accent: '#22c55e', bg: '#081c0e', icon: '📢' },
  medium: { border: '#eab308', accent: '#eab308', bg: '#1c1808', icon: '⚡' },
  high:   { border: '#ef4444', accent: '#ef4444', bg: '#1c0808', icon: '🔥' },
};

function getMiniCfg(card: Card): MiniCfg {
  if (card.type === 'Atout')     return ATOUT_MINI[(card as AtoutCard).subtype];
  if (card.type === 'Preuve')    return { border: '#00ff88', accent: '#00ff88', bg: '#081c10', icon: (card as PreuveCard).icon };
  if (card.type === 'Projet')    return CRIT_MINI[(card as ProjetCard).criticite] ?? CRIT_MINI.S0;
  if (card.type === 'Événement') return SEV_MINI[(card as EvenementCard).severity] ?? SEV_MINI.medium;
  return { border: '#6b7280', accent: '#6b7280', bg: '#0d0d0d', icon: '?' };
}

// ── Mini card component ────────────────────────────────────────────────────────

function MiniCard({ card, onZoom }: { card: Card; onZoom: (c: Card) => void }) {
  const cfg = getMiniCfg(card);
  const image = ((card as any).image as string | undefined) || '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88 }}
      whileHover={{ y: -6, scale: 1.06 }}
      transition={{ type: 'spring', stiffness: 320, damping: 24 }}
      onClick={() => onZoom(card)}
      onContextMenu={e => { e.preventDefault(); onZoom(card); }}
      title={card.nom}
      className="relative flex flex-col rounded-2xl overflow-hidden cursor-pointer select-none flex-shrink-0"
      style={{
        width: 120,
        height: 168,
        border: `2px solid ${cfg.border}50`,
        background: `linear-gradient(170deg, ${cfg.bg} 0%, #050510 100%)`,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = `${cfg.border}cc`;
        el.style.boxShadow = `0 0 22px ${cfg.border}44`;
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = `${cfg.border}50`;
        el.style.boxShadow = 'none';
      }}
    >
      {/* Image zone */}
      <div
        className="flex-1 relative overflow-hidden mx-1.5 mt-1.5 rounded-xl"
        style={{ border: `1px solid ${cfg.accent}25`, background: `radial-gradient(ellipse at 50% 30%, ${cfg.bg}cc, #050510)` }}
      >
        {image ? (
          <img src={image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-15" style={{
              backgroundImage: `radial-gradient(circle, ${cfg.accent} 1px, transparent 1px)`,
              backgroundSize: '8px 8px',
            }} />
            <span className="text-3xl relative z-10 opacity-60">{cfg.icon}</span>
          </div>
        )}
        {/* Fade bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-4"
          style={{ background: 'linear-gradient(to top, #050510, transparent)' }} />
      </div>

      {/* Name */}
      <div className="px-2 pb-2 pt-1.5 flex-shrink-0">
        <div className="h-px mb-1 opacity-25"
          style={{ background: `linear-gradient(90deg, transparent, ${cfg.accent}, transparent)` }} />
        <p className="text-white text-[9px] font-bold text-center leading-tight line-clamp-2">{card.nom}</p>
      </div>
    </motion.div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'atout' | 'preuve' | 'projet' | 'evenement';
type AtoutFilter = 'all' | AtoutSubtype;

const ALL_CARDS: Card[] = [
  ...atoutDeck,
  ...preuveDeck,
  ...projetDeck,
  ...evenementDeck,
];

const ATOUT_COLORS: Record<string, string> = {
  bonus: '#00d4ff', malus: '#ff3b3b', bluff: '#f97316',
  politique: '#facc15', risque: '#8b5cf6', reaction: '#6b7280',
};

export default function CardLibraryModal({ onClose }: { onClose: () => void }) {
  const [typeFilter, setTypeFilter]   = useState<FilterType>('all');
  const [atoutFilter, setAtoutFilter] = useState<AtoutFilter>('all');
  const [zoomedCard, setZoomedCard]   = useState<Card | null>(null);

  const filtered = ALL_CARDS.filter(card => {
    if (typeFilter === 'atout'     && card.type !== 'Atout')      return false;
    if (typeFilter === 'preuve'    && card.type !== 'Preuve')     return false;
    if (typeFilter === 'projet'    && card.type !== 'Projet')     return false;
    if (typeFilter === 'evenement' && card.type !== 'Événement')  return false;
    if (typeFilter === 'atout' && atoutFilter !== 'all' && card.type === 'Atout') {
      if ((card as AtoutCard).subtype !== atoutFilter) return false;
    }
    return true;
  });

  const TYPE_TABS: { key: FilterType; label: string; count: number }[] = [
    { key: 'all',       label: 'Toutes',     count: ALL_CARDS.length },
    { key: 'atout',     label: 'Atouts',     count: ALL_CARDS.filter(c => c.type === 'Atout').length },
    { key: 'preuve',    label: 'Preuves',    count: ALL_CARDS.filter(c => c.type === 'Preuve').length },
    { key: 'projet',    label: 'Projets',    count: ALL_CARDS.filter(c => c.type === 'Projet').length },
    { key: 'evenement', label: 'Événements', count: ALL_CARDS.filter(c => c.type === 'Événement').length },
  ];

  const ATOUT_SUBS: { key: AtoutFilter; label: string }[] = [
    { key: 'all',       label: 'Tous' },
    { key: 'bonus',     label: 'Bonus' },
    { key: 'malus',     label: 'Malus' },
    { key: 'bluff',     label: 'Bluff' },
    { key: 'politique', label: 'Politique' },
    { key: 'risque',    label: 'Risque' },
    { key: 'reaction',  label: 'Réaction' },
  ];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[600] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        {/* Panel */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 24 }}
          animate={{ scale: 1,    opacity: 1, y: 0  }}
          exit={{ scale: 0.92,    opacity: 0, y: 24 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          className="relative flex flex-col rounded-3xl border border-cyber-border overflow-hidden"
          style={{
            width: 'min(94vw, 1120px)',
            height: 'min(90vh, 780px)',
            background: 'linear-gradient(160deg, #0d1117 0%, #080b10 100%)',
            boxShadow: '0 0 80px rgba(0,212,255,0.12), 0 40px 80px rgba(0,0,0,0.7)',
          }}
        >
          {/* ── Header ── */}
          <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-cyber-border/40 flex-shrink-0 flex-wrap gap-y-2">
            <div className="w-9 h-9 rounded-xl bg-cyber-cyan/15 border border-cyber-cyan/30 flex items-center justify-center text-lg flex-shrink-0">
              📚
            </div>
            <div className="mr-2 flex-shrink-0">
              <h2 className="font-black text-white text-base tracking-wide leading-tight">Liste des cartes</h2>
              <p className="text-slate-500 text-[10px]">{filtered.length} carte{filtered.length > 1 ? 's' : ''} · clic pour zoomer</p>
            </div>

            {/* Type tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {TYPE_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setTypeFilter(tab.key); setAtoutFilter('all'); }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: typeFilter === tab.key ? 'rgba(0,212,255,0.18)' : 'rgba(255,255,255,0.04)',
                    border:     typeFilter === tab.key ? '1px solid rgba(0,212,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    color:      typeFilter === tab.key ? '#00d4ff' : '#64748b',
                  }}
                >
                  {tab.label}
                  <span className="ml-1.5 text-[10px] font-mono opacity-50">{tab.count}</span>
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="ml-auto w-8 h-8 rounded-xl border border-slate-700/60 text-slate-500 hover:text-white hover:border-slate-500 transition-colors flex items-center justify-center text-sm flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* ── Atout subtype filters ── */}
          <AnimatePresence>
            {typeFilter === 'atout' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2 px-6 py-2.5 border-b border-cyber-border/20 overflow-hidden flex-shrink-0"
              >
                {ATOUT_SUBS.map(s => {
                  const col = s.key === 'all' ? '#00d4ff' : ATOUT_COLORS[s.key];
                  const active = atoutFilter === s.key;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setAtoutFilter(s.key)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all"
                      style={{
                        background: active ? `${col}22` : 'rgba(255,255,255,0.03)',
                        border:     active ? `1px solid ${col}70` : '1px solid rgba(255,255,255,0.06)',
                        color:      active ? col : '#64748b',
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Card grid ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1e293b transparent' }}>
            <AnimatePresence mode="popLayout">
              <motion.div layout className="flex flex-wrap gap-4">
                {filtered.map(card => (
                  <MiniCard key={card.id} card={card} onZoom={setZoomedCard} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* Zoom modal (on top of library) */}
      <AnimatePresence>
        {zoomedCard && (
          <CardZoomModal
            card={zoomedCard}
            onClose={() => setZoomedCard(null)}
            showIllustrationToggle
          />
        )}
      </AnimatePresence>
    </>
  );
}
