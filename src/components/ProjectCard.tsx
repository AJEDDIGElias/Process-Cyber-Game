import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProjetCard } from '../types';
import RiskMeter from './RiskMeter';

const CRIT_STYLES: Record<string, { border: string; badge: string; glow: string; label: string }> = {
  S0: { border: 'border-slate-500/50', badge: 'bg-slate-500/20 text-slate-400', glow: '', label: 'Simple' },
  S1: { border: 'border-cyber-yellow/50', badge: 'bg-cyber-yellow/15 text-cyber-yellow', glow: 'hover:shadow-[0_0_20px_rgba(250,204,21,0.2)]', label: 'Standard' },
  S2: { border: 'border-cyber-red/50', badge: 'bg-cyber-red/15 text-cyber-red', glow: 'hover:shadow-[0_0_20px_rgba(255,59,59,0.2)]', label: 'Complexe' },
  S3: { border: 'border-cyber-purple/50', badge: 'bg-cyber-purple/15 text-cyber-purple', glow: 'hover:shadow-[0_0_25px_rgba(139,92,246,0.3)]', label: 'Critique' },
};

const STATUS_BADGE: Record<string, string> = {
  'En cours': 'bg-blue-500/20 text-blue-400',
  'GO': 'bg-emerald-500/20 text-emerald-400',
  'NO GO': 'bg-cyber-red/20 text-cyber-red',
  'Terminé': 'bg-cyber-green/20 text-cyber-green',
  'Bloqué': 'bg-cyber-orange/20 text-cyber-orange',
};

type Props = {
  projet: ProjetCard;
  isSelected?: boolean;
  isOpponent?: boolean;
  isDropTarget?: boolean;
  dropTargetType?: 'friendly' | 'hostile' | null;
  isShielded?: boolean;
  isMainPhaseActive?: boolean;
  animationHint?: 'atout';
  onClick?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
};

type FlashType = 'advance' | 'setback' | 'proof' | 'atout';

export default function ProjectCard({ projet, isSelected, isOpponent, isDropTarget, dropTargetType, isShielded, isMainPhaseActive, animationHint, onClick, onDragOver, onDrop, onDragLeave }: Props) {
  const crit = CRIT_STYLES[projet.criticite];
  const isTermine = projet.status === 'Terminé';
  const isNoGo = projet.status === 'NO GO';
  const isBloque = projet.status === 'Bloqué';
  const stepPct = projet.etapes.length > 0 ? (projet.currentStep / projet.etapes.length) * 100 : 0;
  const currentStepName = projet.etapes[projet.currentStep] ?? 'Complété';

  const prevStep = useRef(projet.currentStep);
  const prevProofsCount = useRef(projet.preuvesAttachees.length);
  const [flash, setFlash] = useState<FlashType | null>(null);
  const flashKey = useRef(0);

  const triggerFlash = (type: FlashType) => {
    flashKey.current += 1;
    setFlash(type);
  };

  useEffect(() => {
    if (projet.currentStep > prevStep.current) triggerFlash('advance');
    else if (projet.currentStep < prevStep.current) triggerFlash('setback');
    prevStep.current = projet.currentStep;
  }, [projet.currentStep]);

  useEffect(() => {
    if (projet.preuvesAttachees.length > prevProofsCount.current) triggerFlash('proof');
    prevProofsCount.current = projet.preuvesAttachees.length;
  }, [projet.preuvesAttachees.length]);

  useEffect(() => {
    if (animationHint === 'atout') triggerFlash('atout');
  }, [animationHint]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={!isOpponent ? { y: -4, transition: { duration: 0.15 } } : {}}
      onClick={onClick}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      className={[
        'relative rounded-2xl border overflow-hidden cursor-pointer select-none transition-all duration-200',
        'bg-gradient-to-b from-cyber-panel to-cyber-bg',
        crit.border,
        crit.glow,
        isSelected ? 'ring-2 ring-cyber-cyan shadow-[0_0_20px_rgba(0,212,255,0.3)]' : '',
        isDropTarget && dropTargetType === 'hostile' ? 'ring-2 ring-cyber-red shadow-[0_0_24px_rgba(255,59,59,0.55)] scale-105' : '',
        isDropTarget && dropTargetType !== 'hostile' ? 'ring-2 ring-cyber-green shadow-[0_0_24px_rgba(0,255,136,0.5)] scale-105' : '',
        isTermine ? 'opacity-60 saturate-50' : '',
        isNoGo ? 'border-cyber-red/80' : '',
        isBloque ? 'border-cyber-red/60 hover:shadow-[0_0_22px_rgba(255,59,59,0.45)]' : '',
        isShielded && !isBloque ? 'hover:shadow-[0_0_22px_rgba(250,204,21,0.5)] hover:border-cyber-yellow/60' : '',
        isOpponent ? 'opacity-80' : '',
      ].join(' ')}
    >
      {/* ── Drop target overlay ───────────────────────────────── */}
      <AnimatePresence>
        {isDropTarget && (
          <motion.div
            key="drop-overlay"
            className="absolute inset-0 rounded-2xl pointer-events-none z-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: dropTargetType === 'hostile'
                ? 'radial-gradient(ellipse at center, rgba(255,59,59,0.18) 0%, transparent 70%)'
                : 'radial-gradient(ellipse at center, rgba(0,255,136,0.15) 0%, transparent 70%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Main phase pulsing white ring ─────────────────────── */}
      {isMainPhaseActive && !isBloque && !isTermine && !isNoGo && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none z-5"
          animate={{
            boxShadow: [
              '0 0 0 1px rgba(255,255,255,0.15), 0 0 6px rgba(255,255,255,0)',
              '0 0 0 2px rgba(255,255,255,0.65), 0 0 18px rgba(255,255,255,0.25)',
              '0 0 0 1px rgba(255,255,255,0.15), 0 0 6px rgba(255,255,255,0)',
            ],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* ── Status badges top-left ─────────────────────────── */}
      <AnimatePresence>
        {(isShielded || isBloque) && (
          <motion.div
            className="absolute top-2 left-2 z-20 flex items-center gap-1"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.2 }}
          >
            {isShielded && (
              <motion.div
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] cursor-default"
                style={{ background: 'rgba(250,204,21,0.18)', border: '1px solid rgba(250,204,21,0.65)' }}
                animate={{ boxShadow: ['0 0 4px rgba(250,204,21,0.4)', '0 0 10px rgba(250,204,21,0.7)', '0 0 4px rgba(250,204,21,0.4)'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                title="Joueur protégé — prochain malus annulé"
              >
                🛡
              </motion.div>
            )}
            {isBloque && (
              <motion.div
                className="flex items-center gap-0.5 px-1.5 h-5 rounded-full text-[8px] font-bold cursor-default"
                style={{ background: 'rgba(255,59,59,0.18)', border: '1px solid rgba(255,59,59,0.65)', color: '#ff3b3b' }}
                animate={{ boxShadow: ['0 0 4px rgba(255,59,59,0.4)', '0 0 10px rgba(255,59,59,0.7)', '0 0 4px rgba(255,59,59,0.4)'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                title={`Projet bloqué — ${projet.blockedTurns} tour(s) restant(s)`}
              >
                🔒 <span>{projet.blockedTurns}T</span>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Criticité indicator stripe */}
      <div className={`absolute top-0 left-4 right-4 h-0.5 rounded-b-full ${
        projet.criticite === 'S3' ? 'bg-cyber-purple' :
        projet.criticite === 'S2' ? 'bg-cyber-red' :
        projet.criticite === 'S1' ? 'bg-cyber-yellow' : 'bg-slate-500'
      }`} />

      {/* ── Flash overlays ────────────────────────────────────────── */}
      <AnimatePresence>
        {flash === 'advance' && (
          <>
            {/* Cyan radial glow */}
            <motion.div
              key={`adv-bg-${flashKey.current}`}
              className="absolute inset-0 rounded-2xl pointer-events-none z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.45, 0] }}
              transition={{ duration: 0.75, times: [0, 0.25, 1] }}
              onAnimationComplete={() => setFlash(null)}
              style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(0,212,255,0.45), transparent 70%)' }}
            />
            {/* Progress bar bright sweep */}
            <motion.div
              key={`adv-sweep-${flashKey.current}`}
              className="absolute left-3 right-3 h-1.5 rounded-full pointer-events-none z-20"
              style={{ top: 'auto', bottom: '62px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.9), transparent)' }}
              initial={{ scaleX: 0, opacity: 1 }}
              animate={{ scaleX: 1, opacity: 0 }}
              transition={{ duration: 0.55 }}
            />
            {/* Floating +1 */}
            <motion.div
              key={`adv-float-${flashKey.current}`}
              className="absolute left-1/2 -translate-x-1/2 text-cyber-cyan font-bold text-base pointer-events-none z-30 drop-shadow-[0_0_6px_rgba(0,212,255,0.9)]"
              style={{ top: '30%' }}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -28 }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
            >
              +1
            </motion.div>
          </>
        )}

        {flash === 'setback' && (
          <>
            {/* Red radial glow */}
            <motion.div
              key={`setback-bg-${flashKey.current}`}
              className="absolute inset-0 rounded-2xl pointer-events-none z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0] }}
              transition={{ duration: 0.75, times: [0, 0.25, 1] }}
              onAnimationComplete={() => setFlash(null)}
              style={{ background: 'radial-gradient(ellipse at 50% 60%, rgba(255,59,59,0.55), transparent 70%)' }}
            />
            {/* Floating -1 */}
            <motion.div
              key={`setback-float-${flashKey.current}`}
              className="absolute left-1/2 -translate-x-1/2 font-bold text-base pointer-events-none z-30"
              style={{ top: '30%', color: '#ff3b3b', filter: 'drop-shadow(0 0 6px rgba(255,59,59,0.9))' }}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -28 }}
              transition={{ duration: 0.75, ease: 'easeOut' }}
            >
              -1
            </motion.div>
          </>
        )}

        {flash === 'proof' && (
          <>
            {/* Green scan line sweeping top → bottom */}
            <motion.div
              key={`proof-scan-${flashKey.current}`}
              className="absolute left-0 right-0 h-px pointer-events-none z-20"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.9) 40%, transparent)', boxShadow: '0 0 8px rgba(0,255,136,0.7)' }}
              initial={{ top: '0%', opacity: 1 }}
              animate={{ top: '100%', opacity: 0.4 }}
              transition={{ duration: 0.55, ease: 'easeIn' }}
              onAnimationComplete={() => setFlash(null)}
            />
            {/* Subtle green wash */}
            <motion.div
              key={`proof-bg-${flashKey.current}`}
              className="absolute inset-0 rounded-2xl pointer-events-none z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.25, 0] }}
              transition={{ duration: 0.7, times: [0, 0.3, 1] }}
              style={{ background: 'rgba(0,255,136,0.12)' }}
            />
            {/* ✓ badge float */}
            <motion.div
              key={`proof-badge-${flashKey.current}`}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-green font-bold text-sm pointer-events-none z-30 drop-shadow-[0_0_5px_rgba(0,255,136,0.8)]"
              initial={{ opacity: 1, scale: 0.5 }}
              animate={{ opacity: 0, scale: 1.4, y: -16 }}
              transition={{ duration: 0.65 }}
            >
              ✓
            </motion.div>
          </>
        )}

        {flash === 'atout' && (
          <>
            {/* Purple burst */}
            <motion.div
              key={`atout-burst-${flashKey.current}`}
              className="absolute inset-0 rounded-2xl pointer-events-none z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 0.55, 0], scale: [0.8, 1.05, 1] }}
              transition={{ duration: 0.7, times: [0, 0.3, 1] }}
              onAnimationComplete={() => setFlash(null)}
              style={{ background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.6), rgba(249,115,22,0.2) 55%, transparent 75%)' }}
            />
            {/* Lightning icon */}
            <motion.div
              key={`atout-icon-${flashKey.current}`}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl pointer-events-none z-30"
              initial={{ opacity: 1, scale: 0.6, rotate: -15 }}
              animate={{ opacity: 0, scale: 1.3, rotate: 10 }}
              transition={{ duration: 0.65 }}
            >
              ⚡
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Horizontal layout: image left | info right ───────── */}
      <div className="flex" style={{ minHeight: 200 }}>

        {/* Left: image — 38% */}
        <div className="flex-shrink-0 relative self-stretch" style={{ width: '38%', minHeight: 200 }}>
          <img
            src={projet.image ?? '/images/VPN_deployment.png'}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to right, transparent 65%, rgba(10,14,20,0.75))' }}
          />
        </div>

        {/* Right: info — 62% */}
        <div className="flex-shrink-0 p-3 flex flex-col gap-1.5 min-w-0" style={{ width: '62%' }}>

          {/* Badges + name + value */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 mb-1 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${crit.badge}`}>
                  {projet.criticite}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded ${STATUS_BADGE[projet.status] || 'bg-slate-500/20 text-slate-400'}`}>
                  {projet.status}
                </span>
              </div>
              <h3 className="text-white text-sm font-semibold leading-tight">{projet.nom}</h3>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] text-slate-500">Valeur</p>
              <p className="text-cyber-cyan font-bold text-base font-mono">{projet.valeur}pt</p>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span className="truncate max-w-[70%]">{currentStepName}</span>
              <span className="font-mono">{projet.currentStep}/{projet.etapes.length}</span>
            </div>
            <div className="h-2 bg-cyber-bg rounded-full overflow-hidden border border-cyber-border/40">
              <motion.div
                className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-blue"
                animate={{ width: `${stepPct}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Risk Meter */}
          {!isOpponent && <RiskMeter level={projet.riskLevel} maxRisk={projet.maxRisk} />}

          {/* Proofs (own projects) */}
          {!isOpponent && projet.preuvesRequises.length > 0 && (
            <div>
              <p className="text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">Preuves</p>
              <div className={projet.preuvesRequises.length >= 3 ? 'grid grid-cols-2 gap-0.5' : 'space-y-0.5'}>
                {projet.preuvesRequises.map((p) => {
                  const attached = projet.preuvesAttachees.includes(p);
                  return (
                    <div
                      key={p}
                      className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border leading-tight ${
                        attached
                          ? 'bg-cyber-green/10 text-cyber-green border-cyber-green/30'
                          : 'bg-transparent text-slate-500 border-slate-700/50'
                      }`}
                    >
                      <span className="flex-shrink-0">{attached ? '✓' : '○'}</span>
                      <span className="truncate">{p}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Proofs (opponent projects) */}
          {isOpponent && projet.preuvesRequises.length > 0 && (
            <div>
              <p className="text-[9px] text-slate-700 uppercase tracking-widest mb-0.5">Preuves</p>
              <div className={projet.preuvesRequises.length >= 3 ? 'grid grid-cols-2 gap-0.5' : 'space-y-0.5'}>
                {projet.preuvesRequises.map((p) => {
                  const attached = projet.preuvesAttachees.includes(p);
                  return (
                    <div
                      key={p}
                      className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border leading-tight ${
                        attached
                          ? 'bg-red-900/20 text-red-400 border-cyber-red/25'
                          : 'bg-transparent text-slate-600 border-slate-700/40'
                      }`}
                    >
                      <span className="flex-shrink-0">{attached ? '✓' : '○'}</span>
                      <span className="truncate">{p}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Blocked overlay */}
      {(isNoGo || isBloque) && (
        <motion.div
          className="absolute inset-0 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center">
            <p className="text-2xl">{isNoGo ? '🚫' : '🔒'}</p>
            <p className={`text-xs font-bold ${isNoGo ? 'text-cyber-red' : 'text-cyber-orange'}`}>
              {isNoGo ? 'NO GO' : `Bloqué ${projet.blockedTurns}t`}
            </p>
          </div>
        </motion.div>
      )}

      {/* Completed overlay */}
      {isTermine && (
        <div className="absolute top-2 right-2">
          <span className="text-lg">✅</span>
        </div>
      )}
    </motion.div>
  );
}
