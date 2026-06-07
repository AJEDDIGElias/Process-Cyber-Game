import { motion, AnimatePresence } from 'framer-motion';
import type { Card, AtoutCard, PreuveCard, AtoutSubtype } from '../types';

type FxConfig = {
  glow: string;
  border: string;
  bgFrom: string;
  bgTo: string;
  icon: string;
};

const ATOUT_FX: Record<AtoutSubtype, FxConfig> = {
  bonus:     { glow: 'rgba(0,212,255,0.75)',   border: '#00d4ff', bgFrom: '#081c28', bgTo: '#020a10', icon: '⭐' },
  malus:     { glow: 'rgba(255,59,59,0.75)',   border: '#ff3b3b', bgFrom: '#1c0808', bgTo: '#0a0202', icon: '💣' },
  bluff:     { glow: 'rgba(249,115,22,0.75)',  border: '#f97316', bgFrom: '#1c1008', bgTo: '#0a0602', icon: '🃏' },
  politique: { glow: 'rgba(250,204,21,0.65)',  border: '#facc15', bgFrom: '#1c1808', bgTo: '#0a0a02', icon: '🏛️' },
  risque:    { glow: 'rgba(139,92,246,0.75)',  border: '#8b5cf6', bgFrom: '#100818', bgTo: '#05020a', icon: '⚠️' },
  reaction:  { glow: 'rgba(0,255,136,0.65)',   border: '#00ff88', bgFrom: '#081c10', bgTo: '#020a06', icon: '⚡' },
};

const PREUVE_FX: FxConfig = {
  glow: 'rgba(0,255,136,0.65)',
  border: '#00ff88',
  bgFrom: '#081c10',
  bgTo: '#020a06',
  icon: '📋',
};

/* Fixed spark positions for consistent animation */
const SPARKS = [
  { x: -95,  y: -75,  size: 6,  delay: 0.00 },
  { x:  90,  y: -92,  size: 4,  delay: 0.04 },
  { x: -115, y:  18,  size: 8,  delay: 0.08 },
  { x:  108, y:  28,  size: 5,  delay: 0.02 },
  { x: -58,  y: 108,  size: 4,  delay: 0.07 },
  { x:  68,  y:  98,  size: 7,  delay: 0.11 },
  { x:   6,  y: -128, size: 5,  delay: 0.05 },
  { x: -128, y: -18,  size: 4,  delay: 0.09 },
  { x:  138, y: -38,  size: 7,  delay: 0.03 },
  { x:  28,  y: 142,  size: 4,  delay: 0.10 },
  { x: -72,  y:  62,  size: 3,  delay: 0.06 },
  { x:  78,  y: -58,  size: 5,  delay: 0.01 },
  { x: -40,  y: -110, size: 4,  delay: 0.12 },
  { x:  50,  y:  120, size: 6,  delay: 0.13 },
];

type Props = {
  card: Card | null;
};

export default function CardPlayAnimation({ card }: Props) {
  const isAtout = card?.type === 'Atout';
  const isPreuve = card?.type === 'Preuve';
  const subtype = isAtout ? (card as AtoutCard).subtype : null;
  const fx = subtype ? ATOUT_FX[subtype] : PREUVE_FX;

  const displayIcon = isAtout
    ? fx.icon
    : isPreuve
      ? ((card as PreuveCard).icon ?? fx.icon)
      : fx.icon;

  const cardImage = ((card as any)?.image as string | undefined) ?? '/images/VPN_deployment.png';

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          key={card.id}
          className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {/* ── Backdrop dim ──────────────────────────────────── */}
          <motion.div
            className="absolute inset-0"
            initial={{ backgroundColor: 'rgba(0,0,0,0)' }}
            animate={{ backgroundColor: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.1)'] }}
            transition={{ duration: 0.75, times: [0, 0.3, 1] }}
          />

          {/* ── Outer glow pulse ──────────────────────────────── */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 360,
              height: 360,
              background: `radial-gradient(circle, ${fx.glow.replace('0.75)', '0.22)').replace('0.65)', '0.22)')}, transparent 65%)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2.0, 1.4], opacity: [0, 0.9, 0.5] }}
            exit={{ scale: 3.5, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />

          {/* ── Impact rings ──────────────────────────────────── */}
          {[0, 0.08, 0.18].map((delay, i) => (
            <motion.div
              key={`ring-${i}`}
              className="absolute rounded-full pointer-events-none"
              style={{ width: 90, height: 90, border: `2px solid ${fx.border}` }}
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: [0.4, 3.5], opacity: [0.9, 0] }}
              transition={{ duration: 0.65, delay, ease: 'easeOut' }}
            />
          ))}

          {/* ── The card ──────────────────────────────────────── */}
          <motion.div
            className="relative z-10"
            initial={{ scale: 0.15, y: 320, rotate: -14, opacity: 0 }}
            animate={{
              scale:   [0.15, 1.85, 1.65],
              y:       [320,  -18,   0],
              rotate:  [-14,   5,    0],
              opacity: [0,     1,    1],
            }}
            exit={{
              scale:   [1.65, 0.9,  0.2],
              y:       [0,   -110, -290],
              rotate:  [0,    -8,   18],
              opacity: [1,    0.8,   0],
            }}
            transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Card frame */}
            <div
              className="w-44 h-60 rounded-2xl border-2 overflow-hidden flex flex-col"
              style={{
                borderColor: fx.border,
                background: `linear-gradient(175deg, ${fx.bgFrom} 0%, ${fx.bgTo} 100%)`,
                boxShadow: [
                  `0 0 50px ${fx.glow}`,
                  `0 0 100px ${fx.glow.replace('0.75', '0.3').replace('0.65', '0.3')}`,
                  `inset 0 0 25px ${fx.glow.replace('0.75', '0.08').replace('0.65', '0.08')}`,
                ].join(', '),
              }}
            >
              {/* Illustration area */}
              <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                {cardImage ? (
                  <img src={cardImage} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: `radial-gradient(ellipse at 50% 40%, ${fx.glow.replace('0.75', '0.18').replace('0.65', '0.18')}, transparent 70%)`,
                    }}
                  >
                    <motion.span
                      className="text-6xl drop-shadow-2xl"
                      animate={{ scale: [1, 1.18, 1], rotate: [0, 6, -6, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {displayIcon}
                    </motion.span>
                  </div>
                )}

                {/* Shine sweep */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(120deg, transparent 25%, rgba(255,255,255,0.28) 50%, transparent 75%)',
                  }}
                  initial={{ x: '-180%' }}
                  animate={{ x: '280%' }}
                  transition={{ duration: 0.55, delay: 0.1 }}
                />
              </div>

              {/* Nameplate */}
              <div
                className="px-3 py-2.5 text-center flex-shrink-0"
                style={{
                  background: 'rgba(0,0,0,0.65)',
                  borderTop: `1px solid ${fx.border}55`,
                }}
              >
                <p className="text-white font-bold text-sm leading-tight tracking-wide">{card.nom}</p>
                {'description' in card && (
                  <p className="text-slate-300 text-[10px] mt-1 opacity-75 leading-snug line-clamp-2">
                    {(card as AtoutCard).description}
                  </p>
                )}
              </div>
            </div>

            {/* Outer glow frame on card itself */}
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              style={{
                boxShadow: `inset 0 0 20px ${fx.glow.replace('0.75', '0.35').replace('0.65', '0.35')}`,
              }}
            />
          </motion.div>

          {/* ── Spark particles ───────────────────────────────── */}
          {SPARKS.map((spark, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: spark.size,
                height: spark.size,
                background: fx.border,
                boxShadow: `0 0 ${spark.size * 3}px ${fx.glow}`,
              }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{
                x: [0, spark.x * 0.5, spark.x * 1.1],
                y: [0, spark.y * 0.5, spark.y * 1.1],
                scale: [0, 2.2, 0],
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 0.7, delay: spark.delay + 0.12, ease: 'easeOut' }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
