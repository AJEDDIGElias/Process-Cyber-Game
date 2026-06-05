import { motion, AnimatePresence } from 'framer-motion';
import type { TurnPhase } from '../types';

type PhaseCfg = { label: string; hint: string; color: string; glow: string; icon: string };

const CFG: Partial<Record<TurnPhase, PhaseCfg>> = {
  draw: {
    label: 'PHASE DE PIOCHE',
    hint: 'Piochez vos cartes pour ce tour',
    color: '#00d4ff',
    glow: 'rgba(0,212,255,0.45)',
    icon: '🃏',
  },
  main: {
    label: 'PHASE PRINCIPALE',
    hint: 'Avancez votre projet ou jouez un Atout',
    color: '#f97316',
    glow: 'rgba(249,115,22,0.45)',
    icon: '⚔️',
  },
  resolution: {
    label: 'RÉSOLUTION',
    hint: 'Clôture et passage au prochain tour',
    color: '#22c55e',
    glow: 'rgba(34,197,94,0.40)',
    icon: '🔄',
  },
};

export default function PhaseBanner({ phase }: { phase: TurnPhase | null }) {
  const cfg = phase ? CFG[phase] : null;

  return (
    <AnimatePresence>
      {phase && cfg && (
        <motion.div
          key={phase}
          className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* Dark band expands from center */}
          <motion.div
            className="absolute w-full"
            style={{
              height: 88,
              background: 'rgba(4, 7, 14, 0.93)',
              borderTop: `1px solid ${cfg.color}60`,
              borderBottom: `1px solid ${cfg.color}60`,
            }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
          />

          {/* Lateral glow wings */}
          <motion.div
            className="absolute w-full"
            style={{
              height: 130,
              background: `linear-gradient(90deg,
                transparent 2%,
                ${cfg.glow.replace('0.45)', '0.04)')} 18%,
                ${cfg.glow.replace('0.45)', '0.14)')} 50%,
                ${cfg.glow.replace('0.45)', '0.04)')} 82%,
                transparent 98%)`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.32, delay: 0.1 }}
          />

          {/* Scanlines texture */}
          <div
            className="absolute w-full pointer-events-none"
            style={{
              height: 88,
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.22) 2px, rgba(0,0,0,0.22) 3px)',
            }}
          />

          {/* Content row */}
          <motion.div
            className="relative z-10 flex items-center gap-5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.22, delay: 0.13 }}
          >
            {/* Left decorative line — grows right-to-left from center */}
            <motion.div
              style={{
                width: 150,
                height: 1,
                background: `linear-gradient(90deg, transparent, ${cfg.color})`,
                transformOrigin: '100% 50%',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.32, delay: 0.2 }}
            />

            {/* Phase text */}
            <div className="text-center select-none">
              <div className="flex items-center justify-center gap-2.5 mb-1.5">
                <span className="text-[22px] leading-none">{cfg.icon}</span>
                <h2
                  className="font-black tracking-[0.22em] text-[21px] leading-none uppercase"
                  style={{
                    color: cfg.color,
                    textShadow: `0 0 14px ${cfg.glow}, 0 0 30px ${cfg.glow}`,
                  }}
                >
                  {cfg.label}
                </h2>
              </div>
              <p
                className="text-[10px] tracking-[0.18em] uppercase"
                style={{ color: cfg.color.replace('ff', 'aa'), opacity: 0.75 }}
              >
                {cfg.hint}
              </p>
            </div>

            {/* Right decorative line — grows left-to-right from center */}
            <motion.div
              style={{
                width: 150,
                height: 1,
                background: `linear-gradient(90deg, ${cfg.color}, transparent)`,
                transformOrigin: '0% 50%',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.32, delay: 0.2 }}
            />
          </motion.div>

          {/* Bottom edge glow streak */}
          <motion.div
            className="absolute w-full"
            style={{
              height: 2,
              top: '50%',
              transform: 'translateY(44px)',
              background: `linear-gradient(90deg, transparent 10%, ${cfg.glow.replace('0.45)', '0.6)')} 50%, transparent 90%)`,
              filter: 'blur(1px)',
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.28, delay: 0.15 }}
          />
          <motion.div
            className="absolute w-full"
            style={{
              height: 2,
              top: '50%',
              transform: 'translateY(-44px)',
              background: `linear-gradient(90deg, transparent 10%, ${cfg.glow.replace('0.45)', '0.6)')} 50%, transparent 90%)`,
              filter: 'blur(1px)',
            }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.28, delay: 0.15 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
