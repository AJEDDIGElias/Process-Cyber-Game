import { motion } from 'framer-motion';
import type { GameStats } from '../types';

type Props = {
  message: string;
  stats: GameStats | null;
  onNewGame: () => void;
};

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 bg-cyber-bg rounded-full overflow-hidden border border-cyber-border/30">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  );
}

export default function GameStatsOverlay({ message, stats, onNewGame }: Props) {
  const duration = stats ? stats.endTime - stats.startTime : 0;
  const totalTurns = stats?.totalTurns ?? 0;
  const scores = stats?.scores ?? [];

  const maxScore = Math.max(...scores.map(s => s.score), 1);
  const maxAtouts = Math.max(...scores.map(s => s.atoutsJoues), 1);
  const maxPreuves = Math.max(...scores.map(s => s.preuvesJouees), 1);
  const maxGO = Math.max(...scores.map(s => s.projetsGO), 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20, delay: 0.1 }}
        className="w-full max-w-md mx-4 rounded-3xl border border-cyber-cyan/30 overflow-hidden"
        style={{ background: 'rgba(8,12,28,0.98)', boxShadow: '0 0 80px rgba(0,212,255,0.2)' }}
      >
        {/* Header */}
        <div className="text-center px-8 pt-8 pb-5 border-b border-cyber-border/20">
          <motion.div
            animate={{ rotate: [0, -5, 5, -5, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-5xl mb-3"
          >
            🏆
          </motion.div>
          <h2 className="text-2xl font-bold text-cyber-cyan mb-2">Fin de partie !</h2>
          <p className="text-slate-300 text-sm">{message}</p>

          {/* Particles */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-cyber-cyan"
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{ opacity: [0, 1, 0], x: Math.cos((i / 6) * Math.PI * 2) * 140, y: Math.sin((i / 6) * Math.PI * 2) * 140 }}
              transition={{ duration: 1.5, delay: 0.4, repeat: Infinity, repeatDelay: 2 }}
              style={{ left: '50%', top: '20%' }}
            />
          ))}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-0 border-b border-cyber-border/20">
          <div className="text-center px-4 py-3 border-r border-cyber-border/20">
            <p className="text-lg font-bold font-mono text-cyber-cyan">{totalTurns}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Tours joués</p>
          </div>
          <div className="text-center px-4 py-3">
            <p className="text-lg font-bold font-mono text-cyber-cyan">{formatDuration(duration)}</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest">Durée</p>
          </div>
        </div>

        {/* Per-player stats */}
        {stats && (
          <div className="px-6 py-5 space-y-5">
            {scores.map((ps, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm">{idx === 0 ? '👤' : '🤖'}</span>
                  <p className="font-bold text-white text-sm flex-1">{ps.nom}</p>
                  <span className="text-cyber-cyan font-mono font-bold text-lg">{ps.score} pts</span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                      <span>Score</span>
                      <span>{ps.score} pts</span>
                    </div>
                    <StatBar value={ps.score} max={maxScore} color="#00d4ff" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                      <span>Atouts joués</span>
                      <span>{ps.atoutsJoues}</span>
                    </div>
                    <StatBar value={ps.atoutsJoues} max={maxAtouts} color="#f97316" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[9px] text-slate-500 mb-1">
                      <span>Preuves jouées</span>
                      <span>{ps.preuvesJouees}</span>
                    </div>
                    <StatBar value={ps.preuvesJouees} max={maxPreuves} color="#22c55e" />
                  </div>

                  <div className="flex gap-3 pt-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyber-green flex-shrink-0" />
                      <span className="text-[9px] text-slate-500">{ps.projetsGO} GO</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyber-red flex-shrink-0" />
                      <span className="text-[9px] text-slate-500">{ps.projetsNoGo} NO GO</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="px-6 pb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewGame}
            className="w-full py-3 rounded-xl font-bold text-cyber-bg text-sm"
            style={{ background: 'linear-gradient(135deg, #00d4ff, #3b82f6)' }}
          >
            ↺ Nouvelle partie
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
