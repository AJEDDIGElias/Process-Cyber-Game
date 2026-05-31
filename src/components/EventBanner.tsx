import { motion, AnimatePresence } from 'framer-motion';
import type { EvenementCard } from '../types';

const severityStyles = {
  low: { border: 'border-blue-500/60', bg: 'bg-blue-500/10', text: 'text-blue-400', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.4)]', icon: 'ℹ️' },
  medium: { border: 'border-cyber-orange/60', bg: 'bg-cyber-orange/10', text: 'text-cyber-orange', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.4)]', icon: '⚠️' },
  high: { border: 'border-cyber-red/60', bg: 'bg-cyber-red/10', text: 'text-cyber-red', glow: 'shadow-[0_0_20px_rgba(255,59,59,0.5)]', icon: '🚨' },
};

export default function EventBanner({ event }: { event: EvenementCard | null }) {
  return (
    <AnimatePresence>
      {event && (
        <motion.div
          key={event.id}
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={[
            'flex items-center gap-3 px-5 py-3 rounded-2xl border',
            severityStyles[event.severity].border,
            severityStyles[event.severity].bg,
            severityStyles[event.severity].glow,
          ].join(' ')}
        >
          <motion.span
            className="text-xl"
            animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
          >
            {severityStyles[event.severity].icon}
          </motion.span>
          <div>
            <p className={`text-xs uppercase tracking-widest ${severityStyles[event.severity].text}`}>Événement actif</p>
            <p className="font-bold text-white text-sm">{event.nom}</p>
            <p className="text-slate-400 text-xs">{event.description}</p>
          </div>
          {event.severity === 'high' && (
            <motion.div
              className="ml-auto w-2 h-2 rounded-full bg-cyber-red"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </motion.div>
      )}
      {!event && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl border border-cyber-border/30 bg-cyber-surface/50">
          <span className="text-slate-600">🌐</span>
          <p className="text-slate-600 text-sm">Aucun événement actif</p>
        </div>
      )}
    </AnimatePresence>
  );
}
