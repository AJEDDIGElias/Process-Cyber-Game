import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TurnPhase } from '../types';

export type TutorialStep = {
  id: string;
  title: string;
  content: string;
  highlight?: string;
  phase?: TurnPhase;
  icon?: string;
};

const STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Bienvenue dans Process Cyber !',
    icon: '🛡',
    content:
      'Vous êtes Chef de Projet Cybersécurité. Votre objectif : accumuler 10 points en complétant des projets avant votre adversaire.\n\nChaque partie se joue en tours. Vous disposez de 2 Points d\'Action (AP) par tour.',
  },
  {
    id: 'draft',
    title: 'Choisissez votre projet',
    icon: '📋',
    phase: 'draw',
    content:
      'Une fenêtre apparaît avec 3 projets. Choisissez celui qui correspond le mieux à votre stratégie.\n\n• S0/S1 = rapides mais peu de points\n• S2/S3 = plus lents mais très rentables\n\nCliquez sur "Choisir" pour démarrer un projet.',
    highlight: 'draft-modal',
  },
  {
    id: 'draw',
    title: 'Phase de Pioche',
    icon: '🃏',
    phase: 'draw',
    content:
      'Au début de chaque tour, cliquez sur "Piocher" pour recevoir 3 cartes : 2 Atouts et 1 Preuve.\n\nVotre main peut contenir jusqu\'à 10 cartes.',
    highlight: 'draw-button',
  },
  {
    id: 'main',
    title: 'Phase Principale — 2 AP disponibles',
    icon: '⚡',
    phase: 'main',
    content:
      'Avec vos 2 AP, vous pouvez :\n\n• Avancer un projet (1 AP) — sélectionnez un projet, puis cliquez "Avancer"\n• Jouer un Atout (1 AP) — glissez ou double-cliquez\n• Attacher une Preuve (gratuit) — glissez sur votre projet\n\nLes preuves réduisent le risque et permettent d\'obtenir un GO complet.',
    highlight: 'action-bar',
  },
  {
    id: 'risk',
    title: 'Gestion du Risque',
    icon: '⚠',
    phase: 'main',
    content:
      'Chaque avancée augmente le risque de votre projet. Si le risque dépasse le seuil maximum → NO GO automatique !\n\nPour réduire le risque :\n• Attachez des preuves (-10 risque chacune)\n• Jouez un atout "Réduction de risque" (-30)\n\nS3 ont un seuil de risque bas — soyez prudent !',
    highlight: 'risk-meter',
  },
  {
    id: 'conformity',
    title: 'Revue de Conformité',
    icon: '✅',
    phase: 'main',
    content:
      'Quand un projet atteint sa dernière étape, une Revue de Conformité est déclenchée :\n\n• Toutes les preuves attachées → GO (points complets)\n• Preuves manquantes + risque acceptable → GO avec Réserves (moitié des points)\n• Risque trop élevé + preuves manquantes → NO GO (0 points)',
    highlight: 'conformity-review',
  },
  {
    id: 'atouts',
    title: 'Cartes Atout',
    icon: '🃏',
    phase: 'main',
    content:
      'Les Atouts offensifs (rouge) ciblent les projets adverses.\nLes Atouts bonus (cyan) boostent vos propres projets.\nLes Cartes Réaction (vert) s\'activent quand vous êtes attaqué !\n\nDouble-cliquez ou glissez-déposez une carte sur un projet pour la jouer.',
    highlight: 'hand-area',
  },
  {
    id: 'events',
    title: 'Événements Globaux',
    icon: '🌐',
    phase: 'main',
    content:
      'Tous les 4 tours, un événement aléatoire affecte tous les joueurs. Ils peuvent augmenter les risques ou ajouter des preuves requises.\n\nRestez vigilant ! Certains Atouts permettent d\'annuler un événement.',
    highlight: 'event-banner',
  },
  {
    id: 'endturn',
    title: 'Terminer son tour',
    icon: '▶',
    phase: 'main',
    content:
      'Une fois vos actions effectuées, cliquez sur "Fin de tour" pour passer la main à l\'adversaire.\n\nConseil : jouez toujours vos 2 AP avant de finir votre tour !',
    highlight: 'end-turn-button',
  },
  {
    id: 'victory',
    title: 'Conditions de victoire',
    icon: '🏆',
    content:
      'La partie se termine quand :\n\n• Un joueur atteint 10 points\n• Un joueur complète 3 projets S3\n• La pile de projets est épuisée\n• Le tour 20 est atteint\n\nVous êtes maintenant prêt à jouer ! Bonne chance.',
  },
];

type Props = {
  phase: TurnPhase;
  tour: number;
  onClose: () => void;
};

export default function TutorialOverlay({ phase, tour, onClose }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  const [minimized, setMinimized] = useState(false);

  const step = STEPS[stepIdx];
  const isLast = stepIdx === STEPS.length - 1;

  const next = () => {
    if (isLast) onClose();
    else setStepIdx(i => i + 1);
  };
  const prev = () => setStepIdx(i => Math.max(0, i - 1));

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      className="fixed bottom-4 right-4 z-[400] w-72"
    >
      <AnimatePresence mode="wait">
        {minimized ? (
          <motion.button
            key="minimized"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setMinimized(false)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-cyber-green/40 text-left"
            style={{ background: 'rgba(8,20,40,0.97)' }}
          >
            <span className="text-xl">📖</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-cyber-green">Tutoriel</p>
              <p className="text-xs text-white truncate">{step.title}</p>
            </div>
            <span className="text-[9px] text-slate-600 font-mono">{stepIdx + 1}/{STEPS.length}</span>
          </motion.button>
        ) : (
          <motion.div
            key="expanded"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="rounded-2xl border border-cyber-green/35 overflow-hidden"
            style={{ background: 'rgba(6,18,36,0.98)', boxShadow: '0 0 40px rgba(34,197,94,0.1)' }}
          >
            {/* Header */}
            <div
              className="flex items-center gap-2 px-4 py-3 border-b border-cyber-border/20"
              style={{ background: 'rgba(34,197,94,0.06)' }}
            >
              <span className="text-base">{step.icon ?? '📖'}</span>
              <p className="text-[9px] uppercase tracking-widest text-cyber-green flex-1">
                Tutoriel — Étape {stepIdx + 1}/{STEPS.length}
              </p>
              <button
                onClick={() => setMinimized(true)}
                className="text-slate-600 hover:text-slate-400 text-xs px-1 transition-colors"
                title="Réduire"
              >
                _
              </button>
              <button
                onClick={onClose}
                className="text-slate-600 hover:text-cyber-red text-xs px-1 transition-colors"
                title="Fermer le tutoriel"
              >
                ✕
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-0.5 bg-cyber-bg">
              <motion.div
                className="h-full bg-cyber-green"
                animate={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Content */}
            <div className="px-4 py-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 className="font-bold text-white text-sm mb-2 leading-tight">{step.title}</h3>
                  <div className="text-[11px] text-slate-400 leading-relaxed whitespace-pre-line">
                    {step.content}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-2 px-4 pb-4">
              <button
                onClick={prev}
                disabled={stepIdx === 0}
                className="px-3 py-1.5 text-[10px] rounded-lg border border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Préc.
              </button>
              <div className="flex-1 flex justify-center gap-1">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStepIdx(i)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === stepIdx ? 'bg-cyber-green' : 'bg-slate-700 hover:bg-slate-500'}`}
                  />
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={next}
                className="px-4 py-1.5 text-[10px] font-bold rounded-lg text-white"
                style={{ background: isLast ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #00d4ff40, #3b82f640)', border: '1px solid rgba(0,212,255,0.3)' }}
              >
                {isLast ? '✓ Terminer' : 'Suiv. →'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
