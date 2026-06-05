import { motion, AnimatePresence } from 'framer-motion';
import type { PreuveCard } from '../types';

type Props = {
  selection: { available: PreuveCard[]; count: number } | null;
  activeProjectNeeds: string[]; // noms des preuves requises par les projets actifs
  onSelect: (cardId: string) => void;
  onSkip: () => void;
};

export default function ProofSelectionModal({ selection, activeProjectNeeds, onSelect, onSkip }: Props) {
  if (!selection) return null;

  // Déduplique par nom pour l'affichage, compte les exemplaires
  const grouped = selection.available.reduce<Record<string, { cards: PreuveCard[]; needed: boolean }>>((acc, c) => {
    if (!acc[c.nom]) acc[c.nom] = { cards: [], needed: activeProjectNeeds.includes(c.nom) };
    acc[c.nom].cards.push(c);
    return acc;
  }, {});

  // Trie : preuves nécessaires d'abord
  const entries = Object.entries(grouped).sort(([, a], [, b]) => (b.needed ? 1 : 0) - (a.needed ? 1 : 0));

  return (
    <AnimatePresence>
      {selection && (
        <motion.div
          key="proof-selection"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-40 flex items-center justify-center"
          style={{ background: 'rgba(2,5,12,0.88)', backdropFilter: 'blur(12px)' }}
        >
          {/* Scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,212,255,0.04) 4px)' }}
          />

          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 12 }}
            transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
            className="relative w-[640px] max-h-[80vh] rounded-3xl border border-cyber-cyan/40 overflow-hidden flex flex-col"
            style={{ background: 'rgba(4,10,24,0.98)', boxShadow: '0 0 60px rgba(0,212,255,0.2)' }}
          >
            {/* Top stripe */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-cyber-cyan" />

            {/* Header */}
            <div className="px-7 pt-6 pb-4 border-b border-cyber-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-cyber-cyan font-mono mb-1">
                    Sélection stratégique de preuves
                  </p>
                  <h2 className="text-white font-bold text-base">
                    Choisissez{' '}
                    <span className="text-cyber-cyan font-mono">{selection.count}</span>
                    {' '}preuve{selection.count > 1 ? 's' : ''}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {[0, 1].slice(0, selection.count).map(i => (
                    <motion.div
                      key={i}
                      className="w-3 h-3 rounded-full bg-cyber-cyan"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 0.9, delay: i * 0.3, repeat: Infinity }}
                      style={{ boxShadow: '0 0 8px rgba(0,212,255,0.8)' }}
                    />
                  ))}
                </div>
              </div>
              {activeProjectNeeds.length > 0 && (
                <p className="text-[10px] text-slate-500 mt-2 font-mono">
                  Vos projets ont besoin de :{' '}
                  <span className="text-cyber-green">
                    {[...new Set(activeProjectNeeds)].join(' · ')}
                  </span>
                </p>
              )}
            </div>

            {/* Proof grid */}
            <div className="flex-1 overflow-y-auto px-7 py-5">
              {entries.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">Aucune preuve disponible</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {entries.map(([nom, { cards, needed }]) => {
                    const card = cards[0]; // représentant
                    return (
                      <motion.button
                        key={nom}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onSelect(card.id)}
                        className={[
                          'relative flex items-center gap-3 p-3 rounded-2xl border text-left transition-all',
                          needed
                            ? 'border-cyber-green/60 bg-cyber-green/8 hover:bg-cyber-green/15 hover:border-cyber-green'
                            : 'border-cyber-border/50 bg-cyber-surface hover:border-cyber-cyan/50 hover:bg-cyber-cyan/5',
                        ].join(' ')}
                        style={{
                          boxShadow: needed ? '0 0 16px rgba(0,255,136,0.12)' : 'none',
                        }}
                      >
                        {/* Needed indicator */}
                        {needed && (
                          <div
                            className="absolute top-2 right-2 text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                            style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88' }}
                          >
                            requise
                          </div>
                        )}

                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                          style={{
                            background: needed ? 'rgba(0,255,136,0.12)' : 'rgba(0,212,255,0.08)',
                            border: `1px solid ${needed ? 'rgba(0,255,136,0.3)' : 'rgba(0,212,255,0.2)'}`,
                          }}
                        >
                          {card.icon}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-bold leading-tight truncate ${needed ? 'text-cyber-green' : 'text-white'}`}>
                            {nom}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {cards.length} exemplaire{cards.length > 1 ? 's' : ''} disponible{cards.length > 1 ? 's' : ''}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-7 pb-6 pt-3 border-t border-cyber-border/30 flex items-center justify-between">
              <p className="text-[10px] text-slate-600 font-mono">
                {selection.available.length} preuve{selection.available.length !== 1 ? 's' : ''} dans le pool · les non-choisies retournent dans la pioche
              </p>
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={onSkip}
                className="px-4 py-2 text-xs rounded-xl border border-slate-600/50 text-slate-400 hover:text-white hover:border-slate-400 transition-all"
              >
                Passer le reste
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
