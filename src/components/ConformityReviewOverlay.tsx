import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ConformityResult } from '../types';

type Props = {
  review: { nom: string; result: ConformityResult; valeur: number } | null;
  onConfirm: () => void;
};

const CFG: Record<ConformityResult, {
  label: string;
  sub: string;
  textColor: string;
  borderColor: string;
  glowBg: string;
  shadowColor: string;
  stripe: string;
  bgTint: string;
}> = {
  GO: {
    label: 'GO',
    sub: 'Projet validé — déploiement autorisé',
    textColor: 'text-emerald-400',
    borderColor: 'rgba(52,211,153,0.5)',
    glowBg: 'rgba(52,211,153,0.15)',
    shadowColor: 'rgba(52,211,153,0.8)',
    stripe: 'bg-emerald-400',
    bgTint: 'rgba(4,28,16,0.97)',
  },
  'NO GO': {
    label: 'NO GO',
    sub: 'Projet rejeté — niveau de risque inacceptable',
    textColor: 'text-red-400',
    borderColor: 'rgba(248,113,113,0.5)',
    glowBg: 'rgba(248,113,113,0.15)',
    shadowColor: 'rgba(248,113,113,0.8)',
    stripe: 'bg-red-400',
    bgTint: 'rgba(28,4,4,0.97)',
  },
  GO_RESERVES: {
    label: 'GO RÉSERVES',
    sub: 'Validé sous conditions — preuves incomplètes',
    textColor: 'text-amber-400',
    borderColor: 'rgba(251,191,36,0.5)',
    glowBg: 'rgba(251,191,36,0.15)',
    shadowColor: 'rgba(251,191,36,0.8)',
    stripe: 'bg-amber-400',
    bgTint: 'rgba(28,22,4,0.97)',
  },
};

const CHECKS = [
  { label: 'Inventaire des composants système', delay: 0.0 },
  { label: 'Vérification des étapes de déploiement', delay: 0.13 },
  { label: 'Évaluation du niveau de risque résiduel', delay: 0.27 },
  { label: 'Contrôle des preuves et attestations', delay: 0.42 },
  { label: 'Validation conformité réglementaire NIS2', delay: 0.57 },
  { label: 'Signature numérique RSSI & CISO', delay: 0.72 },
];

export default function ConformityReviewOverlay({ review, onConfirm }: Props) {
  const [phase, setPhase] = useState<'scanning' | 'result'>('scanning');

  useEffect(() => {
    if (!review) { setPhase('scanning'); return; }
    setPhase('scanning');
    const t1 = setTimeout(() => setPhase('result'), 1300);
    const t2 = setTimeout(onConfirm, 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [review]); // eslint-disable-line react-hooks/exhaustive-deps

  const cfg = review ? CFG[review.result] : null;
  const pts = review
    ? review.result === 'GO' ? review.valeur
    : review.result === 'GO_RESERVES' ? Math.max(1, Math.floor(review.valeur / 2))
    : 0
    : 0;

  return (
    <AnimatePresence>
      {review && cfg && (
        <motion.div
          key="conformity-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(2,5,12,0.93)', backdropFilter: 'blur(14px)' }}
        >
          {/* CRT scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,212,255,0.05) 4px)' }}
          />

          {/* Result phase: radial glow + horizontal beam */}
          <AnimatePresence>
            {phase === 'result' && (
              <>
                <motion.div
                  key="result-glow"
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  style={{ background: `radial-gradient(ellipse at 50% 50%, ${cfg.glowBg.replace('0.15', '0.25')} 0%, ${cfg.glowBg} 30%, transparent 70%)` }}
                />
                <motion.div
                  key="result-beam"
                  className="absolute w-full pointer-events-none"
                  style={{
                    height: 2,
                    top: '50%',
                    background: `linear-gradient(90deg, transparent 5%, ${cfg.shadowColor.replace('0.8', '0.3')} 50%, transparent 95%)`,
                    filter: 'blur(3px)',
                  }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                />
              </>
            )}
          </AnimatePresence>

          {/* Main panel */}
          <motion.div
            initial={{ scale: 0.84, opacity: 0, y: 32 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 12 }}
            transition={{ duration: 0.42, ease: [0.2, 0, 0, 1] }}
            className="relative w-[560px] rounded-3xl border overflow-hidden"
            style={{
              borderColor: phase === 'result' ? cfg.borderColor : 'rgba(30,50,80,0.7)',
              background: phase === 'result' ? cfg.bgTint : 'rgba(6,12,26,0.98)',
              boxShadow: phase === 'result'
                ? `0 0 90px ${cfg.shadowColor.replace('0.8', '0.3')}, 0 0 200px ${cfg.shadowColor.replace('0.8', '0.12')}`
                : '0 0 40px rgba(0,0,0,0.6)',
              transition: 'background 0.65s, box-shadow 0.65s, border-color 0.65s',
            }}
          >
            {/* Top stripe */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${cfg.stripe}`} />

            {/* Header */}
            <div className="px-8 pt-6 pb-4 text-center border-b" style={{ borderColor: 'rgba(30,50,80,0.45)' }}>
              <div className="flex items-center justify-center gap-1.5 mb-2">
                {[0, 1, 2].map(i => (
                  <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-cyber-cyan"
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.9, delay: i * 0.3, repeat: Infinity }}
                  />
                ))}
                <span className="text-[10px] uppercase tracking-[0.22em] text-cyber-cyan font-mono mx-2">
                  Revue de Conformité Cyber
                </span>
                {[0, 1, 2].map(i => (
                  <motion.span key={i + 3} className="w-1.5 h-1.5 rounded-full bg-cyber-cyan"
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.9, delay: (2 - i) * 0.3, repeat: Infinity }}
                  />
                ))}
              </div>
              <h2 className="text-white font-bold text-base font-mono tracking-wide">{review.nom}</h2>
            </div>

            {/* Body */}
            <div className="px-8 py-7 min-h-[290px] flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">

                {/* ── SCANNING PHASE ─────────────────────────────────── */}
                {phase === 'scanning' && (
                  <motion.div
                    key="scanning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.22 }}
                    className="w-full space-y-5"
                  >
                    {/* Triple spinner */}
                    <div className="relative w-20 h-20 mx-auto">
                      <motion.div className="absolute inset-0 rounded-full border-2"
                        style={{ borderColor: 'rgba(0,212,255,0.08)', borderTopColor: 'rgba(0,212,255,0.95)' }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                      />
                      <motion.div className="absolute inset-[6px] rounded-full border"
                        style={{ borderColor: 'rgba(59,130,246,0.08)', borderRightColor: 'rgba(59,130,246,0.85)' }}
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.85, repeat: Infinity, ease: 'linear' }}
                      />
                      <motion.div className="absolute inset-[12px] rounded-full border"
                        style={{ borderColor: 'rgba(168,85,247,0.08)', borderBottomColor: 'rgba(168,85,247,0.75)' }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2.6, repeat: Infinity, ease: 'linear' }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-lg">🔍</div>
                    </div>

                    {/* Check items */}
                    <div className="space-y-2">
                      {CHECKS.map(({ label, delay }) => (
                        <motion.div key={label}
                          initial={{ opacity: 0, x: -18 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay, duration: 0.28 }}
                          className="flex items-center gap-2.5"
                        >
                          <motion.div className="w-1.5 h-1.5 rounded-full bg-cyber-cyan flex-shrink-0"
                            animate={{ opacity: [1, 0.2, 1] }}
                            transition={{ duration: 0.65, repeat: Infinity, delay }}
                          />
                          <span className="text-[10px] text-slate-400 font-mono">{label}</span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div className="h-1 bg-cyber-bg rounded-full overflow-hidden border border-cyber-border/30">
                      <motion.div
                        className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-blue"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 1.1, ease: 'easeInOut' }}
                      />
                    </div>

                    <motion.p
                      className="text-center text-[10px] text-cyber-cyan font-mono"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.1, repeat: Infinity }}
                    >
                      Analyse en cours...
                    </motion.p>
                  </motion.div>
                )}

                {/* ── RESULT PHASE ───────────────────────────────────── */}
                {phase === 'result' && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="w-full text-center"
                  >
                    {/* HUGE verdict */}
                    <motion.div
                      initial={{ scale: 0.25, opacity: 0, y: 40 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 18, delay: 0.08 }}
                    >
                      <h1
                        className={`font-black tracking-widest font-mono leading-none ${cfg.textColor} ${
                          review.result === 'GO_RESERVES' ? 'text-5xl' : 'text-7xl'
                        }`}
                        style={{
                          textShadow: `0 0 28px ${cfg.shadowColor}, 0 0 60px ${cfg.shadowColor.replace('0.8', '0.4')}, 0 0 100px ${cfg.shadowColor.replace('0.8', '0.15')}`,
                        }}
                      >
                        {cfg.label}
                      </h1>
                    </motion.div>

                    {/* Points */}
                    <motion.p
                      className={`text-3xl font-bold font-mono mt-4 ${cfg.textColor}`}
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 20, delay: 0.38 }}
                      style={{ textShadow: `0 0 18px ${cfg.shadowColor.replace('0.8', '0.5')}` }}
                    >
                      {review.result !== 'NO GO' ? `+${pts} pts` : '— 0 pts —'}
                    </motion.p>

                    {/* Sub */}
                    <motion.p
                      className="text-[11px] text-slate-400 mt-3 leading-relaxed"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.58 }}
                    >
                      {cfg.sub}
                    </motion.p>

                    {/* Auto-close dots */}
                    <motion.div
                      className="flex items-center justify-center gap-1 mt-5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.85 }}
                    >
                      {[0, 1, 2, 3, 4].map(i => (
                        <motion.div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${cfg.stripe}`}
                          animate={{ opacity: [1, 0.15, 1] }}
                          transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.11 }}
                        />
                      ))}
                      <span className="text-[9px] text-slate-600 ml-2 font-mono">fermeture auto</span>
                    </motion.div>
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
