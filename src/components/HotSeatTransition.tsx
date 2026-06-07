import { motion } from 'framer-motion';

type Props = {
  nextPlayerName: string;
  tour: number;
  onConfirm: () => void;
};

export default function HotSeatTransition({ nextPlayerName, tour, onConfirm }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{ background: 'rgba(0,5,15,0.97)', backdropFilter: 'blur(12px)' }}
    >
      {/* Animated scan line */}
      <motion.div
        className="absolute inset-x-0 h-0.5 pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)' }}
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.1 }}
        className="text-center px-12 py-10 rounded-3xl border border-cyber-cyan/25 max-w-sm w-full mx-4"
        style={{ background: 'rgba(0,15,30,0.95)', boxShadow: '0 0 80px rgba(0,212,255,0.1)' }}
      >
        {/* Shield icon */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-5xl mb-5"
        >
          🔒
        </motion.div>

        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Tour {tour}</p>
        <h2 className="text-2xl font-bold text-cyber-cyan mb-1">Passez le clavier</h2>
        <p className="text-slate-400 text-sm mb-2">à</p>
        <motion.p
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="text-xl font-bold text-white mb-6"
        >
          {nextPlayerName}
        </motion.p>

        <p className="text-[10px] text-slate-600 mb-6">
          L'écran est masqué pour protéger votre main.
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onConfirm}
          className="px-8 py-3 rounded-xl font-bold text-cyber-bg text-sm w-full"
          style={{ background: 'linear-gradient(135deg, #00d4ff, #3b82f6)', boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}
        >
          ▶ Prêt — Afficher mon tour
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
