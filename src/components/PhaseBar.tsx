import React from 'react';
import { motion } from 'framer-motion';
import type { TurnPhase } from '../types';

const PHASES: { key: TurnPhase; label: string; icon: string }[] = [
  { key: 'draw', label: 'Pioche', icon: '🃏' },
  { key: 'main', label: 'Action', icon: '⚔️' },
  { key: 'secondary', label: 'Bonus', icon: '⚡' },
  { key: 'resolution', label: 'Résolution', icon: '🔄' },
];

const phaseOrder: TurnPhase[] = ['draw', 'main', 'secondary', 'resolution', 'end'];

export default function PhaseBar({ phase, tour, maxTours }: { phase: TurnPhase; tour: number; maxTours: number }) {
  const phaseIdx = phaseOrder.indexOf(phase);

  return (
    <div className="flex items-center gap-3 bg-cyber-surface border border-cyber-border rounded-2xl px-5 py-3">
      <div className="text-center min-w-[80px]">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Tour</p>
        <p className="text-xl font-bold text-cyber-cyan font-mono">{tour}<span className="text-slate-500 text-sm">/{maxTours}</span></p>
      </div>

      <div className="w-px h-8 bg-cyber-border" />

      <div className="flex items-center gap-2 flex-1">
        {PHASES.map((p, i) => {
          const done = i < phaseIdx;
          const active = p.key === phase;
          return (
            <React.Fragment key={p.key}>
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  className={[
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm border transition-all',
                    active ? 'border-cyber-cyan bg-cyber-cyan/20 shadow-[0_0_12px_rgba(0,212,255,0.5)]' : '',
                    done ? 'border-green-500/50 bg-green-500/10 text-green-400' : '',
                    !active && !done ? 'border-cyber-border bg-cyber-bg text-slate-600' : '',
                  ].join(' ')}
                  animate={active ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {done ? '✓' : p.icon}
                </motion.div>
                <span className={`text-[9px] uppercase tracking-wide ${active ? 'text-cyber-cyan' : done ? 'text-green-500' : 'text-slate-600'}`}>
                  {p.label}
                </span>
              </div>
              {i < PHASES.length - 1 && (
                <div className={`flex-1 h-px ${done ? 'bg-green-500/40' : 'bg-cyber-border'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="w-px h-8 bg-cyber-border" />

      <div className="w-28">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Progression</p>
        <div className="h-2 bg-cyber-bg rounded-full overflow-hidden border border-cyber-border">
          <motion.div
            className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-blue"
            animate={{ width: `${(tour / maxTours) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}
