import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GameMode, AIDifficulty, GameSetupConfig, AtoutCard } from '../types';
import CardLibraryModal from './CardLibraryModal';

type Props = {
  onStart: (config: GameSetupConfig) => void;
  onStartTutorial: () => void;
};

const DIFFICULTY_INFO: Record<AIDifficulty, { label: string; color: string; desc: string; icon: string }> = {
  easy:   { label: 'Facile',  color: 'text-green-400',  icon: '🟢', desc: 'IA passive, erreurs fréquentes. Idéal pour découvrir.' },
  medium: { label: 'Moyen',   color: 'text-cyber-cyan', icon: '🔵', desc: 'IA équilibrée, stratégie standard.' },
  hard:   { label: 'Difficile', color: 'text-cyber-orange', icon: '🟠', desc: 'IA agressive, attaque tôt et gère bien le risque.' },
  expert: { label: 'Expert',  color: 'text-cyber-red',  icon: '🔴', desc: 'IA optimale, réagit aux attaques et finalise vite.' },
};

export default function GameSetupScreen({ onStart, onStartTutorial }: Props) {
  const [mode, setMode] = useState<GameMode>('vs_ai');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium');
  const [p1Name, setP1Name] = useState('Joueur 1');
  const [p2Name, setP2Name] = useState('Joueur 2');
  const [deckBuilding, setDeckBuilding] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const handleStart = () => {
    onStart({
      mode,
      difficulty,
      player1Name: p1Name.trim() || 'Joueur 1',
      player2Name: mode === 'hotseat' ? (p2Name.trim() || 'Joueur 2') : 'Ordinateur',
    });
  };

  const handleStartWithDeckBuilding = () => {
    onStart({
      mode,
      difficulty,
      player1Name: p1Name.trim() || 'Joueur 1',
      player2Name: mode === 'hotseat' ? (p2Name.trim() || 'Joueur 2') : 'Ordinateur',
      customAtoutsP1: [],
      customAtoutsP2: [],
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, rgba(0,20,40,0.98) 0%, rgba(0,5,15,1) 100%)',
        backgroundImage: 'radial-gradient(ellipse at center, rgba(0,20,40,0.98) 0%, rgba(0,5,15,1) 100%), linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
        backgroundSize: 'cover, 40px 40px, 40px 40px',
      }}
    >
      {/* Animated background glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.08) 0%, transparent 60%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-lg mx-4"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl mb-3"
          >
            🛡
          </motion.div>
          <h1 className="text-3xl font-bold text-cyber-cyan tracking-widest mb-1">PROCESS CYBER</h1>
          <p className="text-slate-500 text-sm tracking-widest uppercase">Jeu de cartes cybersécurité</p>
        </div>

        <div className="rounded-2xl border border-cyber-border bg-cyber-panel p-6 shadow-[0_0_60px_rgba(0,212,255,0.12)]">

          {/* Mode selection */}
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Mode de jeu</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { v: 'vs_ai', label: 'Contre l\'IA', icon: '🤖', desc: 'Joueur vs Ordinateur' },
                { v: 'hotseat', label: '2 Joueurs', icon: '👥', desc: 'Même écran, à tour de rôle' },
              ] as const).map(({ v, label, icon, desc }) => (
                <motion.button
                  key={v}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMode(v)}
                  className={[
                    'p-4 rounded-xl border text-left transition-all',
                    mode === v
                      ? 'border-cyber-cyan/60 bg-cyber-cyan/10 shadow-[0_0_20px_rgba(0,212,255,0.15)]'
                      : 'border-cyber-border bg-cyber-surface hover:border-cyber-border/80',
                  ].join(' ')}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{icon}</span>
                    <span className={`font-bold text-sm ${mode === v ? 'text-cyber-cyan' : 'text-white'}`}>{label}</span>
                    {mode === v && <span className="ml-auto text-[8px] px-1.5 py-0.5 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30">ACTIF</span>}
                  </div>
                  <p className="text-[10px] text-slate-500">{desc}</p>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Player names */}
          <div className="mb-6">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Noms des joueurs</p>
            <div className={`grid gap-3 ${mode === 'hotseat' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <div>
                <label className="text-[9px] text-slate-600 uppercase tracking-widest mb-1 block">Joueur 1</label>
                <input
                  type="text"
                  value={p1Name}
                  onChange={e => setP1Name(e.target.value)}
                  maxLength={20}
                  className="w-full px-3 py-2 rounded-xl bg-cyber-bg border border-cyber-border text-white text-sm focus:border-cyber-cyan focus:outline-none transition-colors"
                  placeholder="Joueur 1"
                />
              </div>
              {mode === 'hotseat' && (
                <div>
                  <label className="text-[9px] text-slate-600 uppercase tracking-widest mb-1 block">Joueur 2</label>
                  <input
                    type="text"
                    value={p2Name}
                    onChange={e => setP2Name(e.target.value)}
                    maxLength={20}
                    className="w-full px-3 py-2 rounded-xl bg-cyber-bg border border-cyber-border text-white text-sm focus:border-cyber-cyan focus:outline-none transition-colors"
                    placeholder="Joueur 2"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Difficulty (only vs AI) */}
          <AnimatePresence>
            {mode === 'vs_ai' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 overflow-hidden"
              >
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Difficulté de l'IA</p>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.keys(DIFFICULTY_INFO) as AIDifficulty[]).map(d => {
                    const info = DIFFICULTY_INFO[d];
                    return (
                      <motion.button
                        key={d}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => setDifficulty(d)}
                        className={[
                          'p-2 rounded-xl border text-center transition-all',
                          difficulty === d
                            ? 'border-cyber-cyan/50 bg-cyber-cyan/10'
                            : 'border-cyber-border bg-cyber-surface hover:border-cyber-border/80',
                        ].join(' ')}
                      >
                        <div className="text-lg mb-1">{info.icon}</div>
                        <p className={`text-[10px] font-bold ${difficulty === d ? info.color : 'text-slate-400'}`}>
                          {info.label}
                        </p>
                      </motion.button>
                    );
                  })}
                </div>
                {difficulty && (
                  <motion.p
                    key={difficulty}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`text-[10px] mt-2 ${DIFFICULTY_INFO[difficulty].color}`}
                  >
                    {DIFFICULTY_INFO[difficulty].icon} {DIFFICULTY_INFO[difficulty].desc}
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Deck building toggle */}
          <div className="mb-6">
            <button
              onClick={() => setDeckBuilding(!deckBuilding)}
              className={[
                'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                deckBuilding
                  ? 'border-cyber-purple/50 bg-cyber-purple/10'
                  : 'border-cyber-border bg-cyber-surface hover:border-cyber-border/70',
              ].join(' ')}
            >
              <span className="text-xl">🎴</span>
              <div className="flex-1">
                <p className={`text-sm font-bold ${deckBuilding ? 'text-cyber-purple' : 'text-white'}`}>
                  Construction de deck
                </p>
                <p className="text-[10px] text-slate-500">Choisissez vos atouts de départ avant la partie</p>
              </div>
              <div className={[
                'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                deckBuilding ? 'border-cyber-purple bg-cyber-purple' : 'border-slate-600',
              ].join(' ')}>
                {deckBuilding && <span className="text-[8px] text-white font-bold">✓</span>}
              </div>
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={deckBuilding ? handleStartWithDeckBuilding : handleStart}
              className="w-full py-3 rounded-xl font-bold text-cyber-bg text-sm tracking-wider"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #3b82f6)' }}
            >
              {deckBuilding ? '🎴 Construire le deck →' : '▶ Lancer la partie'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStartTutorial}
              className="w-full py-2.5 rounded-xl border border-cyber-green/40 text-cyber-green text-sm hover:bg-cyber-green/10 transition-all"
            >
              📖 Tutoriel interactif
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowLibrary(true)}
              className="w-full py-2.5 rounded-xl border border-cyber-purple/40 text-cyber-purple text-sm hover:bg-cyber-purple/10 transition-all"
            >
              📚 Liste des cartes
            </motion.button>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-700 mt-4">
          Objectif : 10 points • Max 20 tours • 2 AP par tour
        </p>
      </motion.div>

      <AnimatePresence>
        {showLibrary && (
          <CardLibraryModal onClose={() => setShowLibrary(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
