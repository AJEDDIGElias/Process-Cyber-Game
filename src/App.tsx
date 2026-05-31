import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from './store';
import type { ProjetCard, AtoutCard, PreuveCard, Card } from './types';
import PhaseBar from './components/PhaseBar';
import EventBanner from './components/EventBanner';
import ProjectCard from './components/ProjectCard';
import HandCard from './components/HandCard';
import ActionLog from './components/ActionLog';
import RulesModal from './components/RulesModal';
import WinnerOverlay from './components/WinnerOverlay';
import ProjectDraftModal from './components/ProjectDraftModal';
import ConformityReviewOverlay from './components/ConformityReviewOverlay';
import { computeAIAction } from './ai';

export default function App() {
  const game = useGameStore();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [atoutTargetId, setAtoutTargetId] = useState<string | null>(null);

  const activePlayer = game.joueurs[game.currentPlayer];
  const opponent = game.joueurs[(game.currentPlayer + 1) % 2];
  const selectedCard = activePlayer.main.find(c => c.id === selectedCardId);
  const reviewPending = game.pendingConformityReview !== null;
  const canAct = (game.phase === 'main' || game.phase === 'secondary') && !activePlayer.isAI && !reviewPending;
  const isAITurn = !game.winner && activePlayer.isAI === true && !reviewPending;

  // ── Atout with animation ───────────────────────────────────────
  const playAtoutWithAnim = (cardId: string, targetId?: string) => {
    game.playAtout(cardId, targetId);
    if (targetId) {
      setAtoutTargetId(targetId);
      setTimeout(() => setAtoutTargetId(null), 1200);
    }
  };

  // ── Drag & Drop ────────────────────────────────────────────────
  const handleDragStart = (card: Card) => (e: React.DragEvent) => {
    e.dataTransfer.setData('cardId', card.id);
    setDragCardId(card.id);
  };

  const handleDragEnd = () => {
    setDragCardId(null);
    setDropTargetId(null);
  };

  const handleDragOver = (projetId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    setDropTargetId(projetId);
  };

  const handleDrop = (projet: ProjetCard) => (e: React.DragEvent) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId') || dragCardId;
    if (!cardId) return;
    const card = activePlayer.main.find(c => c.id === cardId);
    if (!card) return;
    if (card.type === 'Preuve') game.attachProof(cardId, projet.id);
    else if (card.type === 'Atout') playAtoutWithAnim(cardId, projet.id);
    setDragCardId(null);
    setDropTargetId(null);
    setSelectedCardId(null);
  };

  // ── Click to play ──────────────────────────────────────────────
  const handleProjectClick = (projet: ProjetCard, isOpponent: boolean) => {
    if (!canAct) return;
    if (selectedCard) {
      // Play selected card on this project
      if (selectedCard.type === 'Preuve' && !isOpponent) {
        game.attachProof(selectedCard.id, projet.id);
        setSelectedCardId(null);
      } else if (selectedCard.type === 'Atout') {
        playAtoutWithAnim(selectedCard.id, projet.id);
        setSelectedCardId(null);
      }
    } else if (!isOpponent) {
      setSelectedProjectId(prev => prev === projet.id ? null : projet.id);
    }
  };

  const handleCardClick = (card: Card) => {
    if (!canAct) return;
    if (card.type === 'Atout' || card.type === 'Preuve') {
      setSelectedCardId(prev => prev === card.id ? null : card.id);
    }
  };

  // ── Actions ────────────────────────────────────────────────────
  const handleAdvanceProject = () => {
    if (!selectedProjectId || !canAct) return;
    const isBonus = game.phase === 'secondary';
    game.advanceProject(selectedProjectId, isBonus);
    setSelectedProjectId(null);
  };

  const handleDrawPhase = () => {
    if (game.phase === 'draw') game.drawPhase();
  };

  const handleEndTurn = () => {
    game.endTurn();
    setSelectedCardId(null);
    setSelectedProjectId(null);
  };

  const handleSkipToResolution = () => {
    if (game.phase === 'secondary') handleEndTurn();
  };

  // ── AI turn automation ─────────────────────────────────────────
  useEffect(() => {
    if (!isAITurn) return;

    const action = computeAIAction(game);
    if (action.type === 'idle') return;

    const delay = action.type === 'draw' ? 700
      : action.type === 'endTurn' ? 500
      : 950;

    const timer = setTimeout(() => {
      switch (action.type) {
        case 'draw':          game.drawPhase(); break;
        case 'selectDraft':   game.selectDraftProject(action.projetId); break;
        case 'advanceProject': game.advanceProject(action.projetId, action.asBonus); break;
        case 'attachProof':   game.attachProof(action.cardId, action.projetId); break;
        case 'playAtout':
          playAtoutWithAnim(action.cardId, action.targetProjetId);
          break;
        case 'endTurn':
          game.endTurn();
          setSelectedCardId(null);
          setSelectedProjectId(null);
          break;
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [
    isAITurn,
    game.phase,
    game.currentPlayer,
    game.projectDraftOptions,
    game.winner,
    activePlayer.turnActions.mainActionDone,
    activePlayer.turnActions.secondaryActionDone,
    activePlayer.turnActions.atoutJoue,
    activePlayer.turnActions.preuveJouee,
    activePlayer.turnActions.projetAvance,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const phaseLabel: Record<string, string> = {
    draw: game.projectDraftOptions ? 'Choisissez votre projet' : 'Cliquez pour piocher',
    main: 'Choisissez votre action principale',
    secondary: 'Action bonus disponible',
    resolution: 'Phase de résolution',
    end: 'Fin du tour',
  };

  const deckStats = [
    { label: 'Projets', count: game.pileProjet.length, color: 'text-cyber-blue', bg: 'border-cyber-blue/40' },
    { label: 'Preuves', count: game.pilePreuve.length, color: 'text-cyber-green', bg: 'border-cyber-green/40' },
    { label: 'Atouts', count: game.pileAtout.length, color: 'text-cyber-red', bg: 'border-cyber-red/40' },
    { label: 'Événements', count: game.pileEvenement.length, color: 'text-cyber-purple', bg: 'border-cyber-purple/40' },
  ];

  return (
    <div className="h-screen bg-cyber-bg text-white overflow-hidden flex flex-col" style={{
      backgroundImage: 'radial-gradient(ellipse at top, rgba(0,212,255,0.06) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(59,130,246,0.04) 0%, transparent 50%)',
    }}>
      {/* ── Grid lines background ─────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      {/* ── Top bar ───────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center gap-3 px-4 pt-3 pb-2 border-b border-cyber-border/40">
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 rounded-lg bg-cyber-cyan/20 border border-cyber-cyan/40 flex items-center justify-center text-xs">🛡</div>
          <span className="font-bold text-cyber-cyan text-sm tracking-wider">PROCESS CYBER</span>
        </div>

        <div className="flex-1">
          <PhaseBar phase={game.phase} tour={game.tour} maxTours={game.maxTours} />
        </div>

        <div className="flex items-center gap-2">
          <EventBanner event={game.activeEvent} />
          <button
            onClick={() => setShowRules(true)}
            className="px-3 py-2 text-xs rounded-xl border border-cyber-border hover:border-cyber-cyan text-slate-400 hover:text-cyber-cyan transition-colors bg-cyber-surface"
          >
            📘 Règles
          </button>
          <button
            onClick={game.newGame}
            className="px-3 py-2 text-xs rounded-xl border border-cyber-border hover:border-cyber-red text-slate-400 hover:text-cyber-red transition-colors bg-cyber-surface"
          >
            ↺ Reset
          </button>
        </div>
      </header>

      {/* ── Main 3-column layout ──────────────────────────────── */}
      <div className="relative z-10 flex flex-1 overflow-hidden gap-0">

        {/* ── LEFT COLUMN — decks + action log ─────────────────── */}
        <div className="flex flex-col gap-3 w-48 flex-shrink-0 p-3 border-r border-cyber-border/30 overflow-hidden">
          {/* Deck piles */}
          <div className="grid grid-cols-2 gap-2">
            {deckStats.map(d => (
              <div key={d.label} className={`rounded-xl border ${d.bg} bg-cyber-surface px-2 py-2 text-center`}>
                <p className={`text-lg font-bold font-mono ${d.color}`}>{d.count}</p>
                <p className="text-[9px] text-slate-500">{d.label}</p>
              </div>
            ))}
          </div>

          {/* Action log */}
          <div className="flex-1 min-h-0">
            <ActionLog entries={game.historique} tour={game.tour} />
          </div>
        </div>

        {/* ── CENTER COLUMN — game board ─────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* ── OPPONENT AREA (top) ─────────────────────────── */}
          <div className="border-b border-cyber-border/20 px-4 py-3 bg-gradient-to-b from-red-950/10 to-transparent">
            {/* Opponent header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-red-900/40 border border-cyber-red/30 flex items-center justify-center text-sm">
                {opponent.id === 1 ? '👤' : '🤖'}
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Adversaire</p>
                <p className="font-bold text-white text-sm">{opponent.nom}</p>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <div className="text-center">
                  <p className="text-xs font-bold text-cyber-red font-mono">{opponent.score}</p>
                  <p className="text-[9px] text-slate-500">pts</p>
                </div>
                {/* Opponent hand back-cards */}
                <div className="flex gap-1">
                  {opponent.main.map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-6 h-9 rounded-md bg-gradient-to-b from-red-900/50 to-red-950/80 border border-cyber-red/20"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Opponent projects */}
            <div className="flex gap-3 justify-center flex-wrap">
              {opponent.projets.length === 0 && (
                <p className="text-slate-600 text-xs italic py-4">Aucun projet actif</p>
              )}
              {opponent.projets.map(projet => (
                <div key={projet.id} className="w-44"
                  onDragOver={handleDragOver(projet.id)}
                  onDragLeave={() => setDropTargetId(null)}
                  onDrop={handleDrop(projet) as any}
                >
                  <ProjectCard
                    projet={projet}
                    isOpponent
                    isDropTarget={dropTargetId === projet.id}
                    animationHint={atoutTargetId === projet.id ? 'atout' : undefined}
                    onClick={() => handleProjectClick(projet, true)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── CENTER DIVIDER — action bar ─────────────────── */}
          <div className="flex items-center gap-3 px-4 py-2 bg-cyber-surface/50 border-b border-cyber-border/20">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyber-border to-transparent" />

            {/* Phase instruction */}
            <motion.p
              key={game.phase}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-slate-400 px-3"
            >
              {phaseLabel[game.phase]}
            </motion.p>

            {/* Action buttons */}
            <div className="flex gap-2">
              {isAITurn && (
                <motion.div
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-cyber-purple/10 border border-cyber-purple/30 text-cyber-purple"
                >
                  <span>🤖</span>
                  <span>Ordinateur réfléchit…</span>
                </motion.div>
              )}

              {game.phase === 'draw' && !isAITurn && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDrawPhase}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyber-cyan/20 to-cyber-blue/20 border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/30 transition-all animate-glow-pulse"
                >
                  🃏 Piocher
                </motion.button>
              )}

              {canAct && selectedProjectId && (
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAdvanceProject}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyber-blue/30 to-cyber-purple/30 border border-cyber-blue/50 text-blue-300 hover:bg-cyber-blue/40 transition-all"
                >
                  ⚡ Avancer projet
                </motion.button>
              )}

              {game.phase === 'secondary' && !isAITurn && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSkipToResolution}
                  className="px-4 py-1.5 text-xs rounded-xl border border-slate-600/50 text-slate-500 hover:text-slate-300 hover:border-slate-500 transition-all"
                >
                  Passer le bonus
                </motion.button>
              )}

              {(game.phase === 'resolution' || game.phase === 'secondary') && !isAITurn && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEndTurn}
                  className="px-5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyber-orange to-amber-500 text-cyber-bg shadow-lg hover:brightness-110 transition-all"
                >
                  ▶ Fin de tour
                </motion.button>
              )}
            </div>

            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyber-border to-transparent" />
          </div>

          {/* ── ACTIVE PLAYER BOARD (bottom-center) ─────────── */}
          <div className="flex-1 flex flex-col px-4 py-3 bg-gradient-to-t from-cyber-cyan/5 to-transparent overflow-hidden">
            {/* Player header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-cyber-cyan/20 border border-cyber-cyan/30 flex items-center justify-center text-sm">
                {isAITurn ? '🤖' : '👤'}
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Joueur actif</p>
                <p className="font-bold text-white text-sm">{activePlayer.nom}</p>
              </div>
              <div className="flex items-center gap-4 ml-auto text-center">
                <div>
                  <p className="text-sm font-bold text-cyber-cyan font-mono">{activePlayer.score}</p>
                  <p className="text-[9px] text-slate-500">points</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-300 font-mono">{activePlayer.projets.length}/3</p>
                  <p className="text-[9px] text-slate-500">projets</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-300 font-mono">{activePlayer.main.length}/5</p>
                  <p className="text-[9px] text-slate-500">main</p>
                </div>
              </div>
            </div>

            {/* Active player projects */}
            <div className="flex gap-3 justify-center flex-wrap">
              {activePlayer.projets.filter(p => p.status === 'En cours' || p.status === 'Bloqué').length === 0 && !game.projectDraftOptions && (
                <p className="text-slate-600 text-xs italic py-4">
                  {game.phase === 'draw' ? 'Cliquez sur Piocher pour choisir un nouveau projet' : 'Aucun projet actif'}
                </p>
              )}
              {activePlayer.projets.map(projet => (
                <div key={projet.id} className="w-44"
                  onDragOver={handleDragOver(projet.id)}
                  onDragLeave={() => setDropTargetId(null)}
                  onDrop={handleDrop(projet) as any}
                >
                  <ProjectCard
                    projet={projet}
                    isSelected={selectedProjectId === projet.id}
                    isDropTarget={dropTargetId === projet.id}
                    animationHint={atoutTargetId === projet.id ? 'atout' : undefined}
                    onClick={() => handleProjectClick(projet, false)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── HAND AREA ─────────────────────────────────── */}
          <div className="border-t border-cyber-border/30 bg-cyber-bg/80 backdrop-blur px-4 pb-3 pt-2">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-600">Cartes en main</p>
              {selectedCard && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] text-cyber-cyan"
                >
                  → {selectedCard.nom} sélectionné — cliquez sur un projet pour jouer
                </motion.p>
              )}
              <div className="ml-auto flex gap-2">
                {selectedCardId && (
                  <button
                    onClick={() => setSelectedCardId(null)}
                    className="text-[10px] px-2 py-0.5 rounded border border-slate-600 text-slate-500 hover:text-white transition-colors"
                  >
                    ✕ Désélectionner
                  </button>
                )}
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {activePlayer.main.length === 0 && (
                  <p className="text-slate-600 text-xs italic py-3">Piochez des cartes pour commencer</p>
                )}
                {activePlayer.main.map(card => (
                  <HandCard
                    key={card.id}
                    card={card}
                    isSelected={selectedCardId === card.id}
                    isPlayable={canAct}
                    onClick={() => handleCardClick(card)}
                    onDragStart={handleDragStart(card)}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── RIGHT COLUMN — scores & quick info ───────────────── */}
        <div className="w-44 flex-shrink-0 flex flex-col gap-3 p-3 border-l border-cyber-border/30">
          {/* Scores */}
          <div className="rounded-2xl border border-cyber-border bg-cyber-surface p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Scores</p>
            {game.joueurs.map(p => (
              <div key={p.id} className={`flex items-center justify-between mb-2 p-2 rounded-xl ${p.id === activePlayer.id ? 'bg-cyber-cyan/10 border border-cyber-cyan/20' : 'bg-cyber-bg'}`}>
                <div>
                  <p className="text-[10px] text-slate-400">{p.nom}</p>
                  <p className={`text-lg font-bold font-mono ${p.id === activePlayer.id ? 'text-cyber-cyan' : 'text-slate-400'}`}>{p.score}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-600">{p.projets.filter(pr => pr.status === 'Terminé').length} terminés</p>
                  <p className="text-[9px] text-slate-600">{p.projets.length} actifs</p>
                </div>
              </div>
            ))}
          </div>

          {/* Prochain événement */}
          <div className="rounded-2xl border border-cyber-border bg-cyber-surface p-3">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Prochain événement</p>
            <div className="flex items-center gap-1.5">
              <motion.div
                className="w-2 h-2 rounded-full bg-cyber-purple"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <p className="text-xs font-mono text-cyber-purple">
                {4 - ((game.tour - 1) % 4)} tour{4 - ((game.tour - 1) % 4) > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Selected card info */}
          <AnimatePresence>
            {selectedCard && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="rounded-2xl border border-cyber-cyan/30 bg-cyber-cyan/5 p-3"
              >
                <p className="text-[9px] uppercase tracking-widest text-cyber-cyan mb-1">Carte sélectionnée</p>
                <p className="text-xs font-bold text-white">{selectedCard.nom}</p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {'description' in selectedCard ? (selectedCard as AtoutCard).description : 'Attachez à un projet'}
                </p>
                <button
                  onClick={() => {
                    if (selectedCard.type === 'Atout') playAtoutWithAnim(selectedCard.id);
                    setSelectedCardId(null);
                  }}
                  className="mt-2 w-full py-1.5 text-[10px] font-bold rounded-lg bg-cyber-cyan/20 text-cyber-cyan hover:bg-cyber-cyan/30 transition-colors border border-cyber-cyan/30"
                >
                  Jouer sans cible
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Turn actions status */}
          <div className="rounded-2xl border border-cyber-border bg-cyber-surface p-3 mt-auto">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Ce tour</p>
            {[
              { label: 'Action principale', done: activePlayer.turnActions.mainActionDone },
              { label: 'Action bonus', done: activePlayer.turnActions.secondaryActionDone },
              { label: 'Preuve jouée', done: activePlayer.turnActions.preuveJouee },
              { label: 'Atout joué', done: activePlayer.turnActions.atoutJoue },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.done ? 'bg-cyber-green' : 'bg-slate-700'}`} />
                <span className={`text-[9px] ${item.done ? 'text-slate-500 line-through' : 'text-slate-400'}`}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────── */}
      <RulesModal open={showRules} onClose={() => setShowRules(false)} />
      {game.winner && <WinnerOverlay message={game.winner} onNewGame={game.newGame} />}
      <ConformityReviewOverlay
        review={game.pendingConformityReview}
        onConfirm={game.confirmReview}
      />
      <AnimatePresence>
        {game.projectDraftOptions && !isAITurn && (
          <ProjectDraftModal
            options={game.projectDraftOptions}
            playerName={activePlayer.nom}
            onSelect={game.selectDraftProject}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
