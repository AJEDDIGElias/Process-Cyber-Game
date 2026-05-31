import { motion } from 'framer-motion';

function riskColor(level: number, maxRisk: number) {
  const pct = level / maxRisk;
  if (pct < 0.4) return { bar: 'from-cyber-green to-emerald-400', text: 'text-cyber-green', label: 'Faible' };
  if (pct < 0.7) return { bar: 'from-cyber-orange to-amber-400', text: 'text-cyber-orange', label: 'Modéré' };
  return { bar: 'from-cyber-red to-rose-400', text: 'text-cyber-red', label: 'Critique' };
}

export default function RiskMeter({ level, maxRisk, compact = false }: { level: number; maxRisk: number; compact?: boolean }) {
  const pct = Math.min((level / maxRisk) * 100, 100);
  const color = riskColor(level, maxRisk);
  const isHigh = pct >= 80;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="flex-1 h-1.5 bg-cyber-bg rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${color.bar}`}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
        <span className={`text-[9px] font-mono ${color.text}`}>{level}%</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] uppercase tracking-widest text-slate-500">Risque</span>
        <div className="flex items-center gap-1">
          {isHigh && (
            <motion.span
              className="text-[9px] text-cyber-red"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              ⚠
            </motion.span>
          )}
          <span className={`text-[10px] font-mono font-bold ${color.text}`}>{level}/{maxRisk}</span>
        </div>
      </div>
      <div className="h-2 bg-cyber-bg rounded-full overflow-hidden border border-cyber-border/50">
        <motion.div
          className={`h-full bg-gradient-to-r ${color.bar}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
      <p className={`text-[9px] mt-0.5 ${color.text}`}>{color.label}</p>
    </div>
  );
}
