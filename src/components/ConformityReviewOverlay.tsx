import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConformityResult } from '../types';

type Props = {
  review: { nom: string; result: ConformityResult } | null;
  onConfirm: () => void;
};

const RESULT_CONFIG: Record<ConformityResult, {
  label: string;
  sub: string;
  textColor: string;
  borderColor: string;
  bgColor: string;
  shadowColor: string;
}> = {
  GO: {
    label: 'GO',
    sub: 'Projet validé — déploiement autorisé',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/50',
    bgColor: 'bg-emerald-950/70',
    shadowColor: '0 0 60px rgba(52,211,153,0.45)',
  },
  'NO GO': {
    label: 'NO GO',
    sub: 'Projet rejeté — niveau de risque inacceptable',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/50',
    bgColor: 'bg-red-950/70',
    shadowColor: '0 0 60px rgba(248,113,113,0.45)',
  },
  GO_RESERVES: {
    label: 'GO avec Réserves',
    sub: 'Validé sous conditions — preuves incomplètes',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/50',
    bgColor: 'bg-amber-950/70',
    shadowColor: '0 0 60px rgba(251,191,36,0.35)',
  },
};

const CHECKS = [
  { label: 'Vérification des étapes de déploiement', delay: 0.1 },
  { label: 'Évaluation du niveau de risque résiduel', delay: 0.45 },
  { label: 'Contrôle des preuves et attestations', delay: 0.85 },
  { label: 'Validation conformité réglementaire', delay: 1.25 },
];

const STRIPE_COLOR: Record<ConformityResult, string> = {
  GO: 'bg-emerald-400',
  'NO GO': 'bg-red-400',
  GO_RESERVES: 'bg-amber-400',
};

export default function ConformityReviewOverlay({ review, onConfirm }: Props) {
  const [phase, setPhase] = useState<'scanning' | 'result'>('scanning');

  useEffect(() => {
    if (!review) { setPhase('scanning'); return; }
    setPhase('scanning');
    const t1 = setTimeout(() => setPhase('result'), 2200);
    const t2 = setTimeout(onConfirm, 3900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [review]); // eslint-disable-line react-hooks/exhaustive-deps

  const cfg = review ? RESULT_CONFIG[review.result] : null;

  return (
    <AnimatePresence>
      {review && (
        <motion.div
          key="conformity-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(4,8,18,0.90)', backdropFilter: 'blur(8px)' }}
        >
          {/* CRT scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-25"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,212,255,0.06) 4px)' }}
          />

          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="relative w-[440px] rounded-3xl border border-cyber-border bg-cyber-surface/96 overflow-hidden"
          >
            {/* Color stripe top */}
            {review && (
              <div className={`absolute top-0 left-0 right-0 h-0.5 ${STRIPE_COLOR[review.result]}`} />
            )}

            {/* Header */}
            <div className="px-8 pt-7 pb-5 text-center border-b border-cyber-border/40">
              <div className="flex items-center justify-center gap-1.5 mb-2">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-cyber-cyan"
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.9, delay: i * 0.3, repeat: Infinity }}
                  />
                ))}
                <p className="text-[10px] uppercase tracking-[0.22em] text-cyber-cyan font-mono mx-2">
                  Revue de Conformité
                </p>
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i + 3}
                    className="w-1.5 h-1.5 rounded-full bg-cyber-cyan"
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.9, delay: (2 - i) * 0.3, repeat: Infinity }}
                  />
                ))}
              </div>
              <h2 className="text-white font-bold text-base leading-tight">{review.nom}</h2>
            </div>

            {/* Body */}
            <div className="px-8 py-7 min-h-[210px] flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">

                {/* Phase 1: Scanning */}
                {phase === 'scanning' && (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="w-full space-y-5"
                  >
                    {/* Spinning rings */}
                    <div className="relative w-16 h-16 mx-auto">
                      <motion.div
                        className="absolute inset-0 rounded-full border-2"
                        style={{ borderColor: 'rgba(0,212,255,0.12)', borderTopColor: 'rgba(0,212,255,0.95)' }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.3, repeat: Infinity, ease: 'linear' }}
                      />
                      <motion.div
                        className="absolute inset-[5px] rounded-full border"
                        style={{ borderColor: 'rgba(59,130,246,0.12)', borderBottomColor: 'rgba(59,130,246,0.75)' }}
                        animate={{ rotate: -360 }}
                        transition={{ duration: 2.1, repeat: Infinity, ease: 'linear' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-base">🔍</div>
                    </div>

                    {/* Check items */}
                    <div className="space-y-2.5">
                      {CHECKS.map(({ label, delay }) => (
                        <motion.div
                          key={label}
                          initial={{ opacity: 0, x: -14 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay, duration: 0.3 }}
                          className="flex items-center gap-2.5"
                        >
                          <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-cyber-cyan flex-shrink-0"
                            animate={{ opacity: [1, 0.25, 1] }}
                            transition={{ duration: 0.7, repeat: Infinity, delay }}
                          />
                          <span className="text-[10px] text-slate-400 font-mono">{label}</span>
                        </motion.div>
                      ))}
                    </div>

                    <motion.p
                      className="text-center text-[10px] text-cyber-cyan font-mono"
                      animate={{ opacity: [1, 0.35, 1] }}
                      transition={{ duration: 1.1, repeat: Infinity }}
                    >
                      Analyse en cours...
                    </motion.p>
                  </motion.div>
                )}

                {/* Phase 2: Result */}
                {phase === 'result' && cfg && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, scale: 0.82 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, type: 'spring', stiffness: 200 }}
                    className={`w-full rounded-2xl border p-7 text-center ${cfg.bgColor} ${cfg.borderColor}`}
                    style={{ boxShadow: cfg.shadowColor }}
                  >
                    <motion.div
                      initial={{ scale: 0.55, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.08, type: 'spring', stiffness: 280, damping: 18 }}
                      className={`text-4xl font-black tracking-wide mb-2 font-mono ${cfg.textColor}`}
                    >
                      {cfg.label}
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.22 }}
                      className="text-[11px] text-slate-400 leading-snug"
                    >
                      {cfg.sub}
                    </motion.p>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
