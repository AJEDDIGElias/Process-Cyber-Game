import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from './store';
import type { ProjetCard, AtoutCard, PreuveCard, Card, TurnPhase, GameSetupConfig } from './types';
import PhaseBar from './components/PhaseBar';
import PhaseBanner from './components/PhaseBanner';
import EventBanner from './components/EventBanner';
import ProjectCard from './components/ProjectCard';
import HandCard from './components/HandCard';
import ActionLog from './components/ActionLog';
import RulesModal from './components/RulesModal';
import GameStatsOverlay from './components/GameStatsOverlay';
import ProjectDraftModal from './components/ProjectDraftModal';
import ConformityReviewOverlay from './components/ConformityReviewOverlay';
import CardPlayAnimation from './components/CardPlayAnimation';
import ReactionWindow from './components/ReactionWindow';
import ProofSelectionModal from './components/ProofSelectionModal';
import GameSetupScreen from './components/GameSetupScreen';
import DeckBuildingModal from './components/DeckBuildingModal';
import HotSeatTransition from './components/HotSeatTransition';
import TutorialOverlay from './components/TutorialOverlay';
import DragGhost from './components/DragGhost';
import CardZoomModal from './components/CardZoomModal';
import CardLibraryModal from './components/CardLibraryModal';
import AttackTrajectory from './components/AttackTrajectory';
import { computeAIAction } from './ai';

export default function App() {
  const game = useGameStore();

  // ── Setup / meta state ─────────────────────────────────────────
  const [showSetup, setShowSetup] = useState(true);
  const [showDeckBuilding, setShowDeckBuilding] = useState(false);
  const [pendingConfig, setPendingConfig] = useState<GameSetupConfig | null>(null);
  const [tutorialActive, setTutorialActive] = useState(false);

  // ── Game UI state ──────────────────────────────────────────────
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [dragCardId, setDragCardId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  // B2 — end turn confirmation
  const [showEndTurnConfirm, setShowEndTurnConfirm] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  // B3 — card zoom
  const [zoomedCard, setZoomedCard] = useState<Card | null>(null);
  // B4 — attack trajectory
  const [attackTrajectory, setAttackTrajectory] = useState<{ from: { x: number; y: number }; to: { x: number; y: number }; color: string } | null>(null);
  // B7 — hand filter
  const [handFilter, setHandFilter] = useState<'all' | 'Atout' | 'Preuve'>('all');
  const [handSubFilter, setHandSubFilter] = useState<string>('all');
  const [boardHovered, setBoardHovered] = useState(false);
  const [atoutTargetId, setAtoutTargetId] = useState<string | null>(null);
  const [playingCard, setPlayingCard] = useState<Card | null>(null);
  const [bannerPhase, setBannerPhase] = useState<TurnPhase | null>(null);

  const activePlayer = game.joueurs[game.currentPlayer];
  const opponent = game.joueurs[(game.currentPlayer + 1) % 2];
  const selectedCard = activePlayer.main.find(c => c.id === selectedCardId);
  const reviewPending = game.pendingConformityReview !== null;
  const reactionPending = game.pendingReactionWindow !== null;
  const proofSelectionPending = game.pendingProofSelection !== null;
  const canAct = game.phase === 'main' && !activePlayer.isAI && !reviewPending && !reactionPending && !proofSelectionPending;

  const activeProjectNeeds = activePlayer.projets
    .filter(p => p.status === 'En cours')
    .flatMap(p => p.preuvesRequises.filter(r => !p.preuvesAttachees.includes(r)));

  const isAITurn = !game.winner && activePlayer.isAI === true && !reviewPending && !reactionPending;

  // ── Setup handlers ─────────────────────────────────────────────
  const handleSetupStart = (config: GameSetupConfig) => {
    if (config.customAtoutsP1 !== undefined) {
      // Deck building phase: customAtoutsP1 is [] (sentinel), will be filled after draft
      setPendingConfig(config);
      setShowDeckBuilding(true);
    } else {
      game.newGame(config);
      setShowSetup(false);
    }
  };

  const handleStartTutorial = () => {
    game.newGame({ mode: 'vs_ai', difficulty: 'easy', player1Name: 'Joueur 1', player2Name: 'Ordinateur' });
    setShowSetup(false);
    setTutorialActive(true);
  };

  const handleDeckBuildingComplete = (p1Cards: AtoutCard[], p2Cards: AtoutCard[]) => {
    if (pendingConfig) {
      game.newGame({ ...pendingConfig, customAtoutsP1: p1Cards, customAtoutsP2: p2Cards });
      setPendingConfig(null);
    }
    setShowDeckBuilding(false);
    setShowSetup(false);
  };

  const handleDeckBuildingSkip = () => {
    if (pendingConfig) {
      game.newGame({ ...pendingConfig, customAtoutsP1: undefined, customAtoutsP2: undefined });
      setPendingConfig(null);
    }
    setShowDeckBuilding(false);
    setShowSetup(false);
  };

  const handleNewGame = () => {
    setShowSetup(true);
    setTutorialActive(false);
    setSelectedCardId(null);
    setSelectedProjectId(null);
  };

  // ── Hearthstone-style play animation ──────────────────────────
  const triggerPlayAnim = (cardId: string) => {
    const card = activePlayer.main.find(c => c.id === cardId);
    if (card) {
      setPlayingCard(card);
      setTimeout(() => setPlayingCard(null), 780);
    }
  };

  // ── Atout with animation ───────────────────────────────────────
  const ATOUT_TRAJ_COLORS: Record<string, string> = {
    bonus: '#00d4ff', malus: '#ff3b3b', bluff: '#f97316',
    politique: '#facc15', risque: '#8b5cf6', reaction: '#00ff88',
  };

  const playAtoutWithAnim = (cardId: string, targetId?: string) => {
    // B4 — capture DOM positions BEFORE state changes
    if (targetId) {
      const cardEl = document.querySelector(`[data-card-id="${cardId}"]`);
      const projEl = document.querySelector(`[data-project-id="${targetId}"]`);
      if (cardEl && projEl) {
        const cr = cardEl.getBoundingClientRect();
        const pr = projEl.getBoundingClientRect();
        const card = activePlayer.main.find(c => c.id === cardId);
        const color = card?.type === 'Atout'
          ? (ATOUT_TRAJ_COLORS[(card as any).subtype] ?? '#00d4ff')
          : '#00d4ff';
        setAttackTrajectory({
          from: { x: cr.left + cr.width / 2, y: cr.top + cr.height / 2 },
          to:   { x: pr.left + pr.width / 2, y: pr.top  + pr.height / 2 },
          color,
        });
        setTimeout(() => setAttackTrajectory(null), 900);
      }
    }
    triggerPlayAnim(cardId);
    game.playAtout(cardId, targetId);
    if (targetId) {
      setAtoutTargetId(targetId);
      setTimeout(() => setAtoutTargetId(null), 1200);
    }
  };

  // ── Drag & Drop ────────────────────────────────────────────────
  const handleDragStart = (card: Card) => (e: React.DragEvent) => {
    if (!canAct) { e.preventDefault(); return; }
    e.dataTransfer.setData('cardId', card.id);
    setDragCardId(card.id);
    setDragPosition({ x: e.clientX, y: e.clientY });
    // Hide the browser's default drag ghost
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDrag = (e: React.DragEvent) => {
    // clientX/clientY are 0 when cursor leaves the window — ignore those frames
    if (e.clientX === 0 && e.clientY === 0) return;
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = () => {
    setDragCardId(null);
    setDropTargetId(null);
    setDragPosition(null);
  };

  const handleDragOver = (projetId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    setDropTargetId(projetId);
  };

  const handleDrop = (projet: ProjetCard) => (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!canAct) return;
    const cardId = e.dataTransfer.getData('cardId') || dragCardId;
    if (!cardId) return;
    const card = activePlayer.main.find(c => c.id === cardId);
    if (!card) return;
    if (card.type === 'Preuve') { triggerPlayAnim(cardId); game.attachProof(cardId, projet.id); }
    else if (card.type === 'Atout') playAtoutWithAnim(cardId, projet.id);
    setDragCardId(null); setDropTargetId(null); setSelectedCardId(null);
  };

  // ── Click to play ──────────────────────────────────────────────
  const handleProjectClick = (projet: ProjetCard, isOpponent: boolean) => {
    if (!canAct) return;
    if (selectedCard) {
      if (selectedCard.type === 'Preuve' && !isOpponent) {
        triggerPlayAnim(selectedCard.id);
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

  const handleCardDoubleClick = (card: Card) => {
    if (!canAct) return;
    if (card.type === 'Atout') { playAtoutWithAnim(card.id); setSelectedCardId(null); }
  };

  const handleDragOverBoard = (e: React.DragEvent) => {
    if (!canAct || !dragCardId) return;
    const card = activePlayer.main.find(c => c.id === dragCardId);
    if (card?.type !== 'Atout') return;
    e.preventDefault();
  };

  const handleDropVoid = (e: React.DragEvent) => {
    if (!canAct) return;
    if (dropTargetId) return;
    const cardId = e.dataTransfer.getData('cardId') || dragCardId;
    if (!cardId) return;
    const card = activePlayer.main.find(c => c.id === cardId);
    if (!card || card.type !== 'Atout') return;
    e.preventDefault();
    playAtoutWithAnim(cardId);
    setDragCardId(null); setSelectedCardId(null);
  };

  // ── Actions ────────────────────────────────────────────────────
  const handleAdvanceProject = () => {
    if (!selectedProjectId || !canAct) return;
    game.advanceProject(selectedProjectId);
    setSelectedProjectId(null);
  };

  const handleDrawPhase = () => { if (game.phase === 'draw') game.drawPhase(); };

  // B6 — compute drop target type based on dragged card + project ownership
  const getDropTargetType = (projectPlayerId: number): 'friendly' | 'hostile' | null => {
    if (!dragCardId) return null;
    const card = activePlayer.main.find(c => c.id === dragCardId);
    if (!card) return null;
    const isMyProject = projectPlayerId === activePlayer.id;
    if (card.type === 'Preuve') return isMyProject ? 'friendly' : null;
    return isMyProject ? 'friendly' : 'hostile';
  };

  const confirmEndTurn = () => {
    setShowEndTurnConfirm(false);
    game.endTurn();
    setSelectedCardId(null);
    setSelectedProjectId(null);
  };

  const handleEndTurn = () => {
    // B2 — show confirmation if AP remain
    if (apLeft > 0 && game.phase === 'main') {
      setShowEndTurnConfirm(true);
      return;
    }
    game.endTurn();
    setSelectedCardId(null);
    setSelectedProjectId(null);
  };

  // ── Phase banner trigger ───────────────────────────────────────
  useEffect(() => {
    if (game.phase === 'end' || game.winner) return;
    setBannerPhase(game.phase);
    const t = setTimeout(() => setBannerPhase(null), 1700);
    return () => clearTimeout(t);
  }, [game.phase, game.currentPlayer]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── AI turn automation ─────────────────────────────────────────
  useEffect(() => {
    if (!isAITurn) return;

    const action = computeAIAction(game, game.aiDifficulty);
    if (action.type === 'idle') return;

    const delay = action.type === 'draw' ? 700
      : action.type === 'endTurn' ? 500
      : 950;

    const timer = setTimeout(() => {
      switch (action.type) {
        case 'draw':          game.drawPhase(); break;
        case 'selectDraft':   game.selectDraftProject(action.projetId); break;
        case 'advanceProject':     game.advanceProject(action.projetId); break;
        case 'selectProof':        game.selectProofFromPool(action.cardId); break;
        case 'skipProofSelection': game.skipProofSelection(); break;
        case 'attachProof':   game.attachProof(action.cardId, action.projetId); break;
        case 'playAtout':     playAtoutWithAnim(action.cardId, action.targetProjetId); break;
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
    game.pendingProofSelection,
    game.winner,
    activePlayer.turnActions.mainActionDone,
    activePlayer.turnActions.atoutJoue,
    activePlayer.turnActions.preuveJouee,
    activePlayer.turnActions.projetAvance,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const maxAP = activePlayer.chef?.id === 'c1' && game.tour % 2 === 0 ? 3 : 2;
  const apUsed = (activePlayer.turnActions.projetAvance ? 1 : 0) + activePlayer.turnActions.atoutsJoues;
  const apLeft = Math.max(0, maxAP - apUsed);

  const phaseLabel: Record<string, string> = {
    draw: game.projectDraftOptions ? 'Choisissez votre projet' : 'Cliquez pour piocher',
    main: `Phase Principale — ${apLeft}/${maxAP} AP disponible${apLeft !== 1 ? 's' : ''}`,
    resolution: 'Phase de résolution',
    end: 'Fin du tour',
  };

  const deckStats = [
    { label: 'Projets',     count: game.pileProjet.length,    color: 'text-cyber-blue',   bg: 'border-cyber-blue/40' },
    { label: 'Preuves',     count: game.pilePreuve.length,    color: 'text-cyber-green',  bg: 'border-cyber-green/40' },
    { label: 'Atouts',      count: game.pileAtout.length,     color: 'text-cyber-red',    bg: 'border-cyber-red/40' },
    { label: 'Événements',  count: game.pileEvenement.length, color: 'text-cyber-purple', bg: 'border-cyber-purple/40' },
  ];

  // ── Show setup / deck building screens ────────────────────────
  if (showSetup && !showDeckBuilding) {
    return (
      <>
        <GameSetupScreen onStart={handleSetupStart} onStartTutorial={handleStartTutorial} />
      </>
    );
  }

  if (showDeckBuilding && pendingConfig) {
    return (
      <DeckBuildingModal
        mode={pendingConfig.mode}
        player1Name={pendingConfig.player1Name}
        player2Name={pendingConfig.player2Name}
        onComplete={handleDeckBuildingComplete}
        onSkip={handleDeckBuildingSkip}
      />
    );
  }

  // ── Main game board ────────────────────────────────────────────
  return (
    <div className="h-screen bg-cyber-bg text-white overflow-hidden flex flex-col" style={{
      backgroundImage: 'radial-gradient(ellipse at top, rgba(0,212,255,0.06) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(59,130,246,0.04) 0%, transparent 50%)',
    }}>
      {/* Grid lines background */}
      <div className="fixed inset-0 pointer-events-none opacity-30"
        style={{ backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      {/* Top bar */}
      <header className="relative z-10 flex items-center gap-3 px-4 pt-3 pb-2 border-b border-cyber-border/40">
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 rounded-lg bg-cyber-cyan/20 border border-cyber-cyan/40 flex items-center justify-center text-xs">🛡</div>
          <span className="font-bold text-cyber-cyan text-sm tracking-wider">PROCESS CYBER</span>
        </div>

        {/* Difficulty badge */}
        {game.gameMode === 'vs_ai' && (
          <div className="px-2 py-0.5 rounded border border-cyber-border text-[9px] text-slate-500 font-mono uppercase tracking-widest">
            {game.aiDifficulty}
          </div>
        )}
        {game.gameMode === 'hotseat' && (
          <div className="px-2 py-0.5 rounded border border-cyber-purple/40 text-[9px] text-cyber-purple font-mono uppercase tracking-widest">
            2 joueurs
          </div>
        )}

        <div className="flex-1">
          <PhaseBar phase={game.phase} tour={game.tour} maxTours={game.maxTours} />
        </div>

        <div className="flex items-center gap-2">
          <EventBanner event={game.activeEvent} />
          <button
            onClick={() => setShowLibrary(true)}
            className="px-3 py-2 text-xs rounded-xl border border-cyber-border hover:border-cyber-purple text-slate-400 hover:text-cyber-purple transition-colors bg-cyber-surface"
          >
            📚 Cartes
          </button>
          <button
            onClick={() => setShowRules(true)}
            className="px-3 py-2 text-xs rounded-xl border border-cyber-border hover:border-cyber-cyan text-slate-400 hover:text-cyber-cyan transition-colors bg-cyber-surface"
          >
            📘 Règles
          </button>
          <button
            onClick={() => setTutorialActive(v => !v)}
            className={`px-3 py-2 text-xs rounded-xl border transition-colors bg-cyber-surface ${tutorialActive ? 'border-cyber-green/50 text-cyber-green' : 'border-cyber-border text-slate-400 hover:border-cyber-green/40 hover:text-cyber-green'}`}
          >
            📖 Tuto
          </button>
          <button
            onClick={handleNewGame}
            className="px-3 py-2 text-xs rounded-xl border border-cyber-border hover:border-cyber-red text-slate-400 hover:text-cyber-red transition-colors bg-cyber-surface"
          >
            ↺ Menu
          </button>
        </div>
      </header>

      {/* Main 3-column layout */}
      <div className="relative z-10 flex flex-1 overflow-hidden gap-0">

        {/* LEFT COLUMN — decks + action log */}
        <div className="flex flex-col gap-3 w-48 flex-shrink-0 p-3 border-r border-cyber-border/30 overflow-hidden">
          <div className="grid grid-cols-2 gap-2">
            {deckStats.map(d => (
              <div key={d.label} className={`rounded-xl border ${d.bg} bg-cyber-surface px-2 py-2 text-center`}>
                <p className={`text-lg font-bold font-mono ${d.color}`}>{d.count}</p>
                <p className="text-[9px] text-slate-500">{d.label}</p>
              </div>
            ))}
          </div>
          <div className="flex-1 min-h-0">
            <ActionLog entries={game.historique} tour={game.tour} />
          </div>
        </div>

        {/* CENTER COLUMN — game board */}
        <div className="flex-1 flex flex-col">

          {/* OPPONENT AREA (top) */}
          <div className="border-b border-cyber-border/20 px-4 py-3 bg-gradient-to-b from-red-950/10 to-transparent" onMouseEnter={() => setBoardHovered(true)} onMouseLeave={() => setBoardHovered(false)}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-red-900/40 border border-cyber-red/30 flex items-center justify-center text-sm">
                {opponent.isAI ? '🤖' : '👤'}
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
            <div className="flex gap-3 justify-center flex-wrap">
              {opponent.projets.length === 0 && (
                <p className="text-slate-600 text-xs italic py-4">Aucun projet actif</p>
              )}
              {opponent.projets.map(projet => (
                <div key={projet.id} className="w-80" data-project-id={projet.id}
                  onDragOver={handleDragOver(projet.id)}
                  onDragLeave={() => setDropTargetId(null)}
                  onDrop={handleDrop(projet) as any}
                >
                  <ProjectCard
                    projet={projet}
                    isOpponent
                    isShielded={!!(opponent.immuniteActive || opponent.annuleMalusProtected)}
                    isDropTarget={dropTargetId === projet.id}
                    dropTargetType={dropTargetId === projet.id ? getDropTargetType(opponent.id) : null}
                    animationHint={atoutTargetId === projet.id ? 'atout' : undefined}
                    onClick={() => handleProjectClick(projet, true)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* CENTER DIVIDER — action bar */}
          <div className="flex items-center gap-3 px-4 py-2 bg-cyber-surface/50 border-b border-cyber-border/20">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyber-border to-transparent" />
            <div className="flex items-center gap-2 px-3">
              <motion.p
                key={game.phase + apUsed}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-slate-400"
              >
                {phaseLabel[game.phase]}
              </motion.p>
              {game.phase === 'main' && !isAITurn && (
                <div className="flex items-center gap-1">
                  {Array.from({ length: maxAP }, (_, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: i < apUsed ? 0.25 : 1 }}
                      className={`w-2 h-2 rounded-full ${i < apUsed ? 'bg-slate-600' : 'bg-cyber-cyan'}`}
                      style={{ boxShadow: i < apUsed ? 'none' : '0 0 6px rgba(0,212,255,0.8)' }}
                    />
                  ))}
                </div>
              )}
            </div>
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
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleDrawPhase}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyber-cyan/20 to-cyber-blue/20 border border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/30 transition-all animate-glow-pulse"
                >
                  🃏 Piocher
                </motion.button>
              )}
              {canAct && selectedProjectId && (
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleAdvanceProject}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyber-blue/30 to-cyber-purple/30 border border-cyber-blue/50 text-blue-300 hover:bg-cyber-blue/40 transition-all"
                >
                  ⚡ Avancer projet
                </motion.button>
              )}
              {(game.phase === 'main' || game.phase === 'resolution') && !isAITurn && !proofSelectionPending && (
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleEndTurn}
                  className="px-5 py-1.5 text-xs font-bold rounded-xl bg-gradient-to-r from-cyber-orange to-amber-500 text-cyber-bg shadow-lg hover:brightness-110 transition-all"
                >
                  ▶ Fin de tour
                </motion.button>
              )}
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-cyber-border to-transparent" />
          </div>

          {/* ACTIVE PLAYER BOARD */}
          <div
            className="flex-1 flex flex-col px-4 py-3 bg-gradient-to-t from-cyber-cyan/5 to-transparent overflow-hidden"
            onDragOver={handleDragOverBoard}
            onDrop={handleDropVoid}
            onMouseEnter={() => setBoardHovered(true)}
            onMouseLeave={() => setBoardHovered(false)}
          >
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
                  <p className="text-sm font-bold text-slate-300 font-mono">{activePlayer.main.length}/10</p>
                  <p className="text-[9px] text-slate-500">main</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              {activePlayer.projets.filter(p => p.status === 'En cours' || p.status === 'Bloqué').length === 0 && !game.projectDraftOptions && (
                <p className="text-slate-600 text-xs italic py-4">
                  {game.phase === 'draw' ? 'Cliquez sur Piocher pour choisir un nouveau projet' : 'Aucun projet actif'}
                </p>
              )}
              {activePlayer.projets.map(projet => (
                <div key={projet.id} className="w-80" data-project-id={projet.id}
                  onDragOver={handleDragOver(projet.id)}
                  onDragLeave={() => setDropTargetId(null)}
                  onDrop={handleDrop(projet) as any}
                >
                  <ProjectCard
                    projet={projet}
                    isSelected={selectedProjectId === projet.id}
                    isShielded={!!(activePlayer.immuniteActive || activePlayer.annuleMalusProtected)}
                    isMainPhaseActive={canAct}
                    isDropTarget={dropTargetId === projet.id}
                    dropTargetType={dropTargetId === projet.id ? getDropTargetType(activePlayer.id) : null}
                    animationHint={atoutTargetId === projet.id ? 'atout' : undefined}
                    onClick={() => handleProjectClick(projet, false)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* HAND AREA */}
          <motion.div
            className="border-t border-cyber-border/30 bg-cyber-bg/80 backdrop-blur px-4 pb-3 pt-2"
            animate={{ scale: boardHovered ? 0.72 : 1, y: boardHovered ? 28 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ transformOrigin: 'bottom center' }}
            onMouseEnter={() => setBoardHovered(false)}
            onMouseLeave={() => setBoardHovered(true)}
          >
            {/* B7 — Header row with filters */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <p className="text-[10px] uppercase tracking-widest text-slate-600 flex-shrink-0">Main</p>

              {/* Filter chips */}
              {(['all', 'Atout', 'Preuve'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => { setHandFilter(f); setHandSubFilter('all'); }}
                  className={`text-[9px] px-2 py-0.5 rounded-full border transition-all ${
                    handFilter === f
                      ? 'border-cyber-cyan/60 bg-cyber-cyan/15 text-cyber-cyan'
                      : 'border-slate-700/50 text-slate-600 hover:text-slate-400 hover:border-slate-600'
                  }`}
                >
                  {f === 'all' ? 'Tous' : f === 'Atout' ? 'Atouts' : 'Preuves'}
                </button>
              ))}

              {/* Sub-filters when Atout selected */}
              <AnimatePresence>
                {handFilter === 'Atout' && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center gap-1 overflow-hidden"
                  >
                    <span className="text-slate-700 text-[9px] mx-1">|</span>
                    {['all', 'bonus', 'malus', 'bluff', 'politique', 'risque', 'reaction'].map(sub => {
                      const LABELS: Record<string, string> = { all: 'Tous', bonus: 'Bonus', malus: 'Malus', bluff: 'Bluff', politique: 'Pol.', risque: 'Risque', reaction: 'Réac.' };
                      const COLORS: Record<string, string> = { bonus: 'cyber-cyan', malus: 'cyber-red', bluff: 'cyber-orange', politique: 'yellow-400', risque: 'cyber-purple', reaction: 'cyber-green' };
                      const isActive = handSubFilter === sub;
                      const col = sub !== 'all' ? COLORS[sub] : '';
                      return (
                        <button
                          key={sub}
                          onClick={() => setHandSubFilter(sub)}
                          className={`text-[9px] px-1.5 py-0.5 rounded-full border transition-all whitespace-nowrap ${
                            isActive
                              ? col ? `border-${col}/60 bg-${col}/15 text-${col}` : 'border-cyber-cyan/60 bg-cyber-cyan/15 text-cyber-cyan'
                              : 'border-slate-700/50 text-slate-600 hover:text-slate-400'
                          }`}
                        >
                          {LABELS[sub]}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

              {selectedCard && (
                <motion.p
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] text-cyber-cyan"
                >
                  → {selectedCard.nom} sélectionné
                </motion.p>
              )}
              <div className="ml-auto flex gap-2">
                {selectedCardId && (
                  <button
                    onClick={() => setSelectedCardId(null)}
                    className="text-[10px] px-2 py-0.5 rounded border border-slate-600 text-slate-500 hover:text-white transition-colors"
                  >
                    ✕ Désel.
                  </button>
                )}
              </div>
            </div>

            {/* B7 — Filtered hand */}
            <AnimatePresence mode="popLayout">
              <div className="flex gap-2 pb-1">
                {activePlayer.main.length === 0 && (
                  <p className="text-slate-600 text-xs italic py-3">Piochez des cartes pour commencer</p>
                )}
                {activePlayer.main
                  .filter(card => {
                    if (handFilter === 'Atout' && card.type !== 'Atout') return false;
                    if (handFilter === 'Preuve' && card.type !== 'Preuve') return false;
                    if (handFilter === 'Atout' && handSubFilter !== 'all' && card.type === 'Atout') {
                      if ((card as AtoutCard).subtype !== handSubFilter) return false;
                    }
                    return true;
                  })
                  .map(card => (
                    <HandCard
                      key={card.id}
                      card={card}
                      isSelected={selectedCardId === card.id}
                      isPlayable={canAct}
                      onClick={() => handleCardClick(card)}
                      onDoubleClick={() => handleCardDoubleClick(card)}
                      onDragStart={handleDragStart(card)}
                      onDragEnd={handleDragEnd}
                      onDrag={handleDrag}
                      onZoom={setZoomedCard}
                    />
                  ))}
              </div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* RIGHT COLUMN — scores & info */}
        <div className="w-44 flex-shrink-0 flex flex-col gap-3 p-3 border-l border-cyber-border/30">
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

          <AnimatePresence>
            {selectedCard && (
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                className="rounded-2xl border border-cyber-cyan/30 bg-cyber-cyan/5 p-3"
              >
                <p className="text-[9px] uppercase tracking-widest text-cyber-cyan mb-1">Carte sélectionnée</p>
                <p className="text-sm font-bold text-white leading-tight">{selectedCard.nom}</p>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  {'description' in selectedCard
                    ? (selectedCard as AtoutCard).description
                    : 'Preuve de conformité — attachez à un projet pour réduire son risque.'}
                </p>
                {canAct && selectedCard.type === 'Atout' && (
                  <p className="text-[9px] text-slate-600 mt-2 font-mono">
                    double-clic ou glisser dans le vide pour jouer sans cible
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {activePlayer.chef && (
            <div className="rounded-2xl border border-cyber-purple/40 bg-cyber-purple/5 p-3">
              <p className="text-[10px] uppercase tracking-widest text-cyber-purple mb-2">Chef de Projet</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyber-purple/15 border border-cyber-purple/30 flex items-center justify-center text-sm flex-shrink-0">
                  {activePlayer.chef.id === 'c1' ? '⚡' : activePlayer.chef.id === 'c2' ? '📋' : '💥'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{activePlayer.chef.nom}</p>
                  <p className="text-[9px] text-cyber-purple font-mono leading-tight">
                    {activePlayer.chef.id === 'c1' ? `Tour pair : +1 AP${game.tour % 2 === 0 ? ' ✓ ACTIF' : ''}` :
                     activePlayer.chef.id === 'c2' ? '+2 pts sur GO' :
                     'Atouts illimités (1 AP)'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-cyber-border bg-cyber-surface p-3 mt-auto">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">Ce tour</p>
            {[
              { label: 'Projet avancé', sub: '1 AP', done: activePlayer.turnActions.projetAvance },
              { label: 'Atout joué', sub: '1 AP', done: activePlayer.turnActions.atoutJoue },
              { label: 'Preuve attachée', sub: 'gratuit', done: activePlayer.turnActions.preuveJouee },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2 mb-1.5">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.done ? 'bg-cyber-green' : 'bg-slate-700'}`} />
                <span className={`text-[9px] flex-1 ${item.done ? 'text-slate-500 line-through' : 'text-slate-400'}`}>{item.label}</span>
                <span className="text-[8px] text-slate-600 font-mono">{item.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Proof selection modal ─────────────────────────────── */}
      {!activePlayer.isAI && (
        <ProofSelectionModal
          selection={game.pendingProofSelection}
          activeProjectNeeds={activeProjectNeeds}
          onSelect={game.selectProofFromPool}
          onSkip={game.skipProofSelection}
        />
      )}

      {/* ── Reaction window ───────────────────────────────────── */}
      <ReactionWindow
        window={game.pendingReactionWindow}
        joueurs={game.joueurs}
        onPlayReaction={game.playReactionCard}
        onPass={game.passReaction}
      />

      {/* ── Hot-seat transition overlay ───────────────────────── */}
      <AnimatePresence>
        {game.hotSeatTransitionPending && !game.winner && (
          <HotSeatTransition
            nextPlayerName={activePlayer.nom}
            tour={game.tour}
            onConfirm={game.confirmHotSeat}
          />
        )}
      </AnimatePresence>

      {/* ── Phase banner ──────────────────────────────────────── */}
      <PhaseBanner phase={bannerPhase} />

      {/* ── Card play animation ───────────────────────────────── */}
      <CardPlayAnimation card={playingCard} />

      {/* ── Modals ───────────────────────────────────────────── */}
      <RulesModal open={showRules} onClose={() => setShowRules(false)} />

      {/* Game stats / winner overlay */}
      {game.winner && (
        <GameStatsOverlay
          message={game.winner}
          stats={game.gameStats}
          onNewGame={handleNewGame}
        />
      )}

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

      {/* ── Tutorial overlay ──────────────────────────────────── */}
      <AnimatePresence>
        {tutorialActive && (
          <TutorialOverlay
            phase={game.phase}
            tour={game.tour}
            onClose={() => setTutorialActive(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Drag ghost card (follows cursor) ──────────────────── */}
      <AnimatePresence>
        {dragCardId && dragPosition && (() => {
          const card = activePlayer.main.find(c => c.id === dragCardId);
          return card ? <DragGhost card={card} x={dragPosition.x} y={dragPosition.y} /> : null;
        })()}
      </AnimatePresence>

      {/* ── B4 Attack trajectory ──────────────────────────────── */}
      <AnimatePresence>
        {attackTrajectory && (
          <AttackTrajectory
            from={attackTrajectory.from}
            to={attackTrajectory.to}
            color={attackTrajectory.color}
          />
        )}
      </AnimatePresence>

      {/* ── B3 Card zoom modal ────────────────────────────────── */}
      <AnimatePresence>
        {zoomedCard && (
          <CardZoomModal card={zoomedCard} onClose={() => setZoomedCard(null)} />
        )}
      </AnimatePresence>

      {/* ── Card library modal ────────────────────────────────── */}
      <AnimatePresence>
        {showLibrary && (
          <CardLibraryModal onClose={() => setShowLibrary(false)} />
        )}
      </AnimatePresence>

      {/* ── B2 End-turn confirmation ──────────────────────────── */}
      <AnimatePresence>
        {showEndTurnConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[700] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowEndTurnConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="rounded-2xl border border-cyber-orange/40 bg-cyber-panel px-6 py-5 max-w-xs w-full mx-4 text-center"
              style={{ boxShadow: '0 0 40px rgba(249,115,22,0.2)' }}
            >
              <div className="text-3xl mb-2">⚡</div>
              <h3 className="font-bold text-white text-sm mb-1">AP inutilisés</h3>
              <p className="text-slate-400 text-xs mb-4">
                Il vous reste encore <span className="text-cyber-orange font-bold">{apLeft} AP</span>. Terminer le tour quand même ?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEndTurnConfirm(false)}
                  className="flex-1 py-2 text-xs rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
                >
                  Continuer à jouer
                </button>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={confirmEndTurn}
                  className="flex-1 py-2 text-xs font-bold rounded-xl text-cyber-bg"
                  style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}
                >
                  Terminer le tour
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
