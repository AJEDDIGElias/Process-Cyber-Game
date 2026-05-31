import { motion } from 'framer-motion';

export default function WinnerOverlay({ message, onNewGame }: { message: string; onNewGame: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
        className="text-center max-w-md px-8 py-12 rounded-3xl border border-cyber-cyan/40 bg-cyber-panel shadow-[0_0_60px_rgba(0,212,255,0.3)]"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, -5, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-6xl mb-4"
        >
          🏆
        </motion.div>
        <h2 className="text-3xl font-bold text-cyber-cyan mb-3">Victoire !</h2>
        <p className="text-slate-300 text-lg mb-8">{message}</p>

        {/* Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-cyber-cyan"
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              x: (Math.cos((i / 6) * Math.PI * 2) * 150),
              y: (Math.sin((i / 6) * Math.PI * 2) * 150),
            }}
            transition={{ duration: 1.5, delay: 0.5, repeat: Infinity, repeatDelay: 2 }}
            style={{ left: '50%', top: '30%', translateX: '-50%', translateY: '-50%' }}
          />
        ))}

        <button
          onClick={onNewGame}
          className="px-8 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-blue text-cyber-bg font-bold rounded-xl hover:scale-105 transition-transform"
        >
          Nouvelle partie
        </button>
      </motion.div>
    </motion.div>
  );
}
