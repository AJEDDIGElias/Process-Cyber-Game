import { motion } from 'framer-motion';

type Props = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  color?: string;
};

export default function AttackTrajectory({ from, to, color = '#ff3b3b' }: Props) {
  const d = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;

  // Midpoint for the spark burst
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  return (
    <svg
      className="fixed inset-0 pointer-events-none z-[500]"
      style={{ width: '100vw', height: '100vh', overflow: 'visible' }}
    >
      <defs>
        <filter id="glow-trajectory" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main beam line */}
      <motion.path
        d={d}
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        strokeLinecap="round"
        filter="url(#glow-trajectory)"
        initial={{ pathLength: 0, opacity: 1 }}
        animate={{ pathLength: 1, opacity: [1, 1, 0] }}
        transition={{ duration: 0.42, ease: 'easeOut', opacity: { times: [0, 0.65, 1] } }}
      />

      {/* Thin inner white core */}
      <motion.path
        d={d}
        stroke="white"
        strokeWidth={0.8}
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.9 }}
        animate={{ pathLength: 1, opacity: [0.9, 0.5, 0] }}
        transition={{ duration: 0.42, ease: 'easeOut', opacity: { times: [0, 0.6, 1] } }}
      />

      {/* Impact ring at target */}
      <motion.circle
        cx={to.x}
        cy={to.y}
        r={4}
        fill="none"
        stroke={color}
        strokeWidth={2}
        filter="url(#glow-trajectory)"
        initial={{ r: 4, opacity: 1 }}
        animate={{ r: 38, opacity: [1, 0.7, 0] }}
        transition={{ duration: 0.45, delay: 0.3, ease: 'easeOut' }}
      />

      {/* Second smaller ring */}
      <motion.circle
        cx={to.x}
        cy={to.y}
        r={4}
        fill="none"
        stroke="white"
        strokeWidth={1}
        initial={{ r: 4, opacity: 0.7 }}
        animate={{ r: 20, opacity: [0.7, 0.3, 0] }}
        transition={{ duration: 0.35, delay: 0.3, ease: 'easeOut' }}
      />

      {/* Spark at midpoint */}
      <motion.circle
        cx={midX}
        cy={midY}
        r={3}
        fill={color}
        filter="url(#glow-trajectory)"
        initial={{ r: 3, opacity: 0 }}
        animate={{ r: [3, 8, 0], opacity: [0, 0.9, 0] }}
        transition={{ duration: 0.25, delay: 0.18 }}
      />
    </svg>
  );
}
