import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AtoutCard, GameMode } from '../types';
import { buildAtoutPile, shuffle } from '../data';

type Props = {
  mode: GameMode;
  player1Name: string;
  player2Name: string;
  onComplete: (customAtoutsP1: AtoutCard[], customAtoutsP2: AtoutCard[]) => void;
  onSkip: () => void;
};

const MAX_PICKS = 4;

const SUBTYPE_COLORS: Record<string, string> = {
  bonus:    'border-cyber-cyan/40 bg-cyber-cyan/5 text-cyber-cyan',
  malus:    'border-cyber-red/40 bg-cyber-red/5 text-cyber-red',
  bluff:    'border-cyber-purple/40 bg-cyber-purple/5 text-cyber-purple',
  politique:'border-yellow-500/40 bg-yellow-500/5 text-yellow-400',
  risque:   'border-cyber-orange/40 bg-cyber-orange/5 text-cyber-orange',
  reaction: 'border-green-500/40 bg-green-500/5 text-green-400',
};

const SUBTYPE_LABELS: Record<string, string> = {
  bonus: 'Bonus',
  malus: 'Offensive',
  bluff: 'Bluff',
  politique: 'Politique',
  risque: 'Risque',
  reaction: 'Réaction',
};

export default function DeckBuildingModal({ mode, player1Name, player2Name, onComplete, onSkip }: Props) {
  const [pool] = useState<AtoutCard[]>(() => {
    const all = shuffle(buildAtoutPile());
    // Show first 16 for pick pool
    return all.slice(0, 16);
  });

  const [phase, setPhase] = useState<1 | 2>(1);
  const [selectedP1, setSelectedP1] = useState<Set<string>>(new Set());
  const [selectedP2, setSelectedP2] = useState<Set<string>>(new Set());

  const currentPlayer = phase === 1 ? player1Name : player2Name;
  const selected = phase === 1 ? selectedP1 : selectedP2;
  const setSelected = phase === 1 ? setSelectedP1 : setSelectedP2;
  const picksLeft = MAX_PICKS - selected.size;

  // In vs_ai mode, only player 1 picks
  const isLastPhase = mode === 'vs_ai' || phase === 2;

  const toggleCard = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else if (next.size < MAX_PICKS) {
      next.add(id);
    }
    setSelected(next);
  };

  const handleNext = () => {
    if (mode === 'vs_ai' || phase === 2) {
      const p1Cards = pool.filter(c => selectedP1.has(c.id));
      const p2Cards = mode === 'hotseat' ? pool.filter(c => selectedP2.has(c.id)) : [];
      onComplete(p1Cards, p2Cards);
    } else {
      setPhase(2);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="rounded-t-2xl border-t border-x border-cyber-purple/40 bg-cyber-panel px-6 py-4 flex items-center gap-4">
          <div className="text-2xl">🎴</div>
          <div className="flex-1">
            <h2 className="font-bold text-white text-lg">Construction de Deck</h2>
            <p className="text-[11px] text-slate-500">
              <span className="text-cyber-purple font-bold">{currentPlayer}</span>
              {' — '}Choisissez jusqu'à {MAX_PICKS} atouts pour démarrer la partie avec en main
            </p>
          </div>

          {/* Progress */}
          {mode === 'hotseat' && (
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${phase >= 1 ? 'border-cyber-cyan bg-cyber-cyan/20 text-cyber-cyan' : 'border-slate-600 text-slate-600'}`}>1</div>
              <div className="w-6 h-px bg-slate-600" />
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${phase >= 2 ? 'border-cyber-cyan bg-cyber-cyan/20 text-cyber-cyan' : 'border-slate-600 text-slate-600'}`}>2</div>
            </div>
          )}

          <div className="text-right">
            <p className="text-[9px] text-slate-500 mb-1">Sélection</p>
            <p className="text-lg font-bold font-mono text-cyber-purple">{selected.size}/{MAX_PICKS}</p>
          </div>
        </div>

        {/* Card grid */}
        <div className="flex-1 overflow-y-auto border-x border-cyber-purple/40 bg-cyber-bg/95 px-6 py-4 min-h-0">
          <div className="grid grid-cols-4 gap-3">
            {pool.map(card => {
              const isSelected = selected.has(card.id);
              const isDisabled = !isSelected && selected.size >= MAX_PICKS;
              const colorClass = SUBTYPE_COLORS[card.subtype] ?? 'border-slate-600/40 text-slate-400';

              return (
                <AnimatePresence key={card.id}>
                  <motion.button
                    whileHover={!isDisabled ? { y: -4, scale: 1.02 } : {}}
                    whileTap={!isDisabled ? { scale: 0.97 } : {}}
                    onClick={() => toggleCard(card.id)}
                    disabled={isDisabled}
                    className={[
                      'relative rounded-xl border p-3 text-left transition-all text-xs',
                      isSelected
                        ? 'border-cyber-purple/70 bg-cyber-purple/15 shadow-[0_0_16px_rgba(168,85,247,0.3)]'
                        : isDisabled
                        ? 'border-slate-700/40 bg-slate-900/40 opacity-40 cursor-not-allowed'
                        : `${colorClass} hover:opacity-90`,
                    ].join(' ')}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyber-purple flex items-center justify-center"
                      >
                        <span className="text-[8px] text-white font-bold">✓</span>
                      </motion.div>
                    )}

                    <div className="text-[8px] uppercase tracking-widest mb-1.5 font-bold opacity-70">
                      {SUBTYPE_LABELS[card.subtype] ?? card.subtype}
                    </div>
                    <p className="font-bold text-white text-[11px] leading-tight mb-1">{card.nom}</p>
                    <p className="text-[9px] text-slate-400 leading-snug line-clamp-3">{card.description}</p>
                  </motion.button>
                </AnimatePresence>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="rounded-b-2xl border-b border-x border-cyber-purple/40 bg-cyber-panel px-6 py-4 flex items-center gap-4">
          <p className="text-[10px] text-slate-600 flex-1">
            {picksLeft > 0
              ? `${picksLeft} choix restant${picksLeft > 1 ? 's' : ''} — cliquez pour sélectionner`
              : 'Sélection complète — vous pouvez confirmer'}
          </p>
          <button
            onClick={onSkip}
            className="px-4 py-2 text-xs rounded-xl border border-slate-600/50 text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-all"
          >
            Ignorer
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            className="px-6 py-2 text-xs font-bold rounded-xl text-white"
            style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}
          >
            {isLastPhase ? '▶ Lancer la partie' : `Suivant — ${player2Name} →`}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
