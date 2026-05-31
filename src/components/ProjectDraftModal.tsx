import { motion, AnimatePresence } from 'framer-motion';
import type { ProjetCard } from '../types';

const CRIT_STYLE: Record<string, { color: string; border: string; glow: string; badge: string }> = {
  S3: { color: 'text-purple-400', border: 'border-purple-500/50', glow: 'shadow-[0_0_30px_rgba(139,92,246,0.35)]', badge: 'bg-purple-900/40 text-purple-400' },
  S2: { color: 'text-cyber-red',  border: 'border-cyber-red/50',  glow: 'shadow-[0_0_30px_rgba(255,59,59,0.3)]',   badge: 'bg-red-900/40 text-cyber-red' },
  S1: { color: 'text-cyber-yellow', border: 'border-yellow-500/50', glow: 'shadow-[0_0_30px_rgba(250,204,21,0.3)]', badge: 'bg-yellow-900/40 text-cyber-yellow' },
  S0: { color: 'text-slate-400', border: 'border-slate-600/50', glow: '', badge: 'bg-slate-800/60 text-slate-400' },
};

type Props = {
  options: ProjetCard[];
  playerName: string;
  onSelect: (id: string) => void;
};

export default function ProjectDraftModal({ options, playerName, onSelect }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/88 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.92, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 24, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-4xl px-6 py-10 text-center"
      >
        {/* Header */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-[11px] uppercase tracking-widest text-cyber-cyan mb-2"
        >
          Sélection de projet
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-2xl font-bold text-white mb-1"
        >
          {playerName}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 text-sm mb-10"
        >
          Choisissez le projet que vous allez mener à bien
        </motion.p>

        {/* Project cards */}
        <div className="flex gap-4 justify-center flex-wrap">
          {options.map((projet, i) => {
            const s = CRIT_STYLE[projet.criticite] ?? CRIT_STYLE.S0;
            return (
              <motion.div
                key={projet.id}
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.1, type: 'spring', stiffness: 260, damping: 22 }}
                whileHover={{ scale: 1.04, y: -8 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelect(projet.id)}
                className={[
                  'w-60 text-left p-5 rounded-2xl border cursor-pointer',
                  'bg-gradient-to-b from-cyber-panel to-cyber-bg',
                  'transition-all duration-150',
                  s.border, s.glow,
                  'hover:brightness-110',
                ].join(' ')}
              >
                {/* Criticité badge + valeur */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${s.badge}`}>
                    {projet.criticite}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300">{projet.valeur} pts</span>
                </div>

                {/* Name */}
                <h3 className={`font-bold text-sm mb-3 leading-snug ${s.color}`}>{projet.nom}</h3>

                {/* Progress slots */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[9px] uppercase tracking-widest text-slate-500">Étapes</p>
                    <p className="text-[9px] font-mono text-slate-400">{projet.etapes.length}</p>
                  </div>
                  <div className="flex gap-1">
                    {projet.etapes.map((_, idx) => (
                      <div key={idx} className="flex-1 h-1.5 rounded-full bg-slate-700/80" />
                    ))}
                  </div>
                </div>

                {/* Required proofs */}
                <div className="mb-3">
                  <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-1.5">Preuves requises</p>
                  <div className="flex flex-wrap gap-1">
                    {projet.preuvesRequises.map(pr => (
                      <span key={pr} className="text-[8px] px-1.5 py-0.5 rounded bg-cyber-bg border border-cyber-border/60 text-slate-400">
                        {pr}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Risk */}
                <div className="pt-3 border-t border-cyber-border/30 flex items-center justify-between mb-4">
                  <p className="text-[9px] text-slate-500">Risque initial</p>
                  <p className={`text-[10px] font-mono font-bold ${projet.riskLevel >= 40 ? 'text-cyber-red' : 'text-cyber-green'}`}>
                    {projet.riskLevel} / {projet.maxRisk}
                  </p>
                </div>

                {/* CTA */}
                <div className="py-2 text-center text-[10px] font-bold text-cyber-cyan bg-cyber-cyan/10 rounded-xl border border-cyber-cyan/25 hover:bg-cyber-cyan/20 transition-colors">
                  Choisir ce projet →
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
