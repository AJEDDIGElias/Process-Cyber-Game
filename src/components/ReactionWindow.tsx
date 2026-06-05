import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player, AtoutCard } from '../types';

type ReactionWindowData = {
  victimIdx: number;
  attackerIdx: number;
  atoutNom: string;
  atoutEffet: string;
  targetProjetId?: string;
};

type Props = {
  window: ReactionWindowData | null;
  joueurs: Player[];
  onPlayReaction: (cardId: string) => void;
  onPass: () => void;
};

const TIMER_MS = 8000;

const EFFECT_LABEL: Record<string, string> = {
  bloque: 'Bloque votre projet 2 tours',
  blocueCeTour: 'Bloque votre projet ce tour',
  bloqueTous: 'Bloque tous vos projets',
  noGo: 'Force un NO GO sur votre projet',
  recule: 'Recule votre projet d\'une étape',
  sauteTour: 'Vous fait passer votre prochain tour',
  defausseAtout: 'Vous fait défausser un Atout',
  retirePreuve: 'Retire une preuve de votre projet',
  reculeTous: 'Recule tous les projets d\'une étape',
  reculeGrands: 'Recule tous les projets S3',
};

const REACTION_BONUS: Record<string, string> = {
  annuleMalus: '+ Renvoi de l\'attaque à l\'adversaire',
  immunite: '+ Bouclier actif jusqu\'au prochain tour',
  retirage: '+ Relance un projet en NO GO',
  annuleEvent: '+ Annule l\'événement actif',
  reduceRisk: '+ Réduit le risque de votre projet exposé',
};

export default function ReactionWindow({ window: pw, joueurs, onPlayReaction, onPass }: Props) {
  const [timeLeft, setTimeLeft] = useState(TIMER_MS);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const passedRef = useRef(false);

  useEffect(() => {
    if (!pw) { passedRef.current = false; setTimeLeft(TIMER_MS); setSelectedCard(null); return; }
    passedRef.current = false;
    setTimeLeft(TIMER_MS);
    setSelectedCard(null);

    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 100) {
          if (!passedRef.current) { passedRef.current = true; onPass(); }
          return 0;
        }
        return t - 100;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [pw]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!pw) return null;

  const victim = joueurs[pw.victimIdx];
  const attacker = joueurs[pw.attackerIdx];
  const reactionCards = victim.main.filter(
    c => c.type === 'Atout' && (c as AtoutCard).subtype === 'reaction'
  ) as AtoutCard[];

  const timerPct = (timeLeft / TIMER_MS) * 100;
  const timerColor = timerPct > 50 ? '#22c55e' : timerPct > 25 ? '#f97316' : '#ff3b3b';

  const handlePlay = (cardId: string) => {
    passedRef.current = true;
    onPlayReaction(cardId);
  };

  const handlePass = () => {
    passedRef.current = true;
    onPass();
  };

  return (
    <AnimatePresence>
      <motion.div
        key="reaction-window"
        className="fixed inset-0 z-[200] flex items-end justify-center pb-4 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Dim background */}
        <motion.div
          className="absolute inset-0"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Panel — slides up from bottom */}
        <motion.div
          className="relative w-[680px] pointer-events-auto"
          initial={{ y: 160, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 160, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 28 }}
        >
          {/* Glowing top border */}
          <motion.div
            className="absolute -top-0.5 left-8 right-8 h-0.5 rounded-full"
            style={{ background: 'linear-gradient(90deg, transparent, #f97316, #ff3b3b, #f97316, transparent)' }}
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />

          <div
            className="rounded-2xl border border-cyber-red/50 overflow-hidden"
            style={{ background: 'rgba(10,6,20,0.97)', boxShadow: '0 -8px 60px rgba(255,59,59,0.25), 0 0 120px rgba(249,115,22,0.1)' }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-3 px-5 py-3 border-b border-cyber-red/30"
              style={{ background: 'rgba(255,59,59,0.08)' }}
            >
              {/* Trap card icon animation */}
              <motion.div
                className="text-xl"
                animate={{ rotate: [0, -8, 8, -4, 0], scale: [1, 1.15, 1] }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                🃏
              </motion.div>

              <div className="flex-1">
                <motion.p
                  className="text-[10px] uppercase tracking-[0.22em] font-mono font-bold"
                  style={{ color: '#ff3b3b' }}
                  animate={{ opacity: [1, 0.6, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                >
                  ⚡ CARTE PIÈGE — Fenêtre de réaction
                </motion.p>
                <p className="text-white font-bold text-sm mt-0.5">
                  <span className="text-cyber-red">{attacker.nom}</span>
                  {' '}joue{' '}
                  <span className="text-cyber-orange font-mono">"{pw.atoutNom}"</span>
                  {' '}contre vous
                </p>
                {EFFECT_LABEL[pw.atoutEffet] && (
                  <p className="text-[10px] text-slate-500 mt-0.5">→ {EFFECT_LABEL[pw.atoutEffet]}</p>
                )}
              </div>

              {/* Countdown */}
              <div className="text-right flex-shrink-0 w-20">
                <p className="text-[10px] text-slate-500 mb-1 font-mono">Temps restant</p>
                <div className="h-1.5 bg-cyber-bg rounded-full overflow-hidden border border-cyber-border/40">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: timerColor, width: `${timerPct}%`, transition: 'width 0.1s linear, background 0.3s' }}
                  />
                </div>
                <p className="text-[10px] font-mono mt-1" style={{ color: timerColor }}>
                  {(timeLeft / 1000).toFixed(1)}s
                </p>
              </div>
            </div>

            {/* Reaction cards */}
            <div className="px-5 py-4">
              <p className="text-[9px] uppercase tracking-widest text-slate-500 mb-3">
                Vos cartes Réaction ({reactionCards.length})
              </p>

              <div className="flex gap-3 flex-wrap">
                {reactionCards.map(card => (
                  <motion.button
                    key={card.id}
                    onClick={() => setSelectedCard(prev => prev === card.id ? null : card.id)}
                    whileHover={{ y: -6, scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={[
                      'relative rounded-xl border p-3 text-left transition-all cursor-pointer w-48',
                      selectedCard === card.id
                        ? 'border-cyber-yellow/70 bg-cyber-yellow/10 shadow-[0_0_18px_rgba(250,204,21,0.35)]'
                        : 'border-cyber-orange/40 bg-cyber-orange/5 hover:border-cyber-orange/70',
                    ].join(' ')}
                    style={{
                      boxShadow: selectedCard === card.id
                        ? '0 0 18px rgba(250,204,21,0.35)'
                        : undefined,
                    }}
                    animate={selectedCard === card.id ? {
                      boxShadow: ['0 0 10px rgba(250,204,21,0.3)', '0 0 22px rgba(250,204,21,0.6)', '0 0 10px rgba(250,204,21,0.3)'],
                    } : {}}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  >
                    {/* Trap card indicator */}
                    <div className="absolute top-1.5 right-1.5">
                      <span className="text-[8px] px-1 py-0.5 rounded font-bold bg-cyber-orange/20 text-cyber-orange border border-cyber-orange/30">
                        RÉACTION
                      </span>
                    </div>

                    <p className="text-white font-bold text-xs mb-1 pr-10 leading-tight">{card.nom}</p>
                    <p className="text-[9px] text-slate-400 leading-snug mb-2">{card.description}</p>

                    {REACTION_BONUS[card.effet] && (
                      <p className="text-[8px] font-bold" style={{ color: '#f97316' }}>
                        {REACTION_BONUS[card.effet]}
                      </p>
                    )}
                  </motion.button>
                ))}

                {reactionCards.length === 0 && (
                  <p className="text-slate-600 text-xs italic">Aucune carte Réaction en main.</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-cyber-border/30">
              <p className="text-[9px] text-slate-600 font-mono">
                {selectedCard ? 'Cliquez sur Activer pour jouer la carte sélectionnée' : 'Sélectionnez une carte Réaction ou laissez passer'}
              </p>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handlePass}
                  className="px-4 py-2 text-xs rounded-xl border border-slate-600/50 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all"
                >
                  Laisser passer →
                </motion.button>

                <AnimatePresence>
                  {selectedCard && (
                    <motion.button
                      key="activate-btn"
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePlay(selectedCard)}
                      className="px-5 py-2 text-xs font-bold rounded-xl text-cyber-bg"
                      style={{
                        background: 'linear-gradient(135deg, #f97316, #ff3b3b)',
                        boxShadow: '0 0 20px rgba(249,115,22,0.4)',
                      }}
                    >
                      ⚡ Activer la carte
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
