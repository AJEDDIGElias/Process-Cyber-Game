import { create } from 'zustand';
import type { GameState, Player, ProjetCard, PreuveCard, AtoutCard, TurnActions, HistoryEntry, ConformityResult, GameSetupConfig, GameStats } from './types';
import { shuffle, cloneProjet, buildPreuvePile, buildAtoutPile, projetDeck, evenementDeck, preuveDeck, chefsDeProjets } from './data';
import { computeAIReactionDecision } from './ai';

const emptyActions = (): TurnActions => ({
  mainActionDone: false,
  secondaryActionDone: false,
  preuveJouee: false,
  atoutJoue: false,
  projetAvance: false,
  atoutsJoues: 0,
});

function drawCards<T>(pile: T[], n = 1): { drawn: T[]; remaining: T[] } {
  return { drawn: pile.slice(0, n), remaining: pile.slice(n) };
}

function makeInitialState(config?: GameSetupConfig): GameState {
  const allProjets = shuffle(projetDeck.map(cloneProjet));
  const pilePreuve = buildPreuvePile();
  const pileEvenement = shuffle(evenementDeck.map(e => ({ ...e })));

  const mode = config?.mode ?? 'vs_ai';
  const difficulty = config?.difficulty ?? 'medium';
  const p1Name = config?.player1Name ?? 'Joueur 1';
  const p2Name = config?.player2Name ?? (mode === 'hotseat' ? 'Joueur 2' : 'Ordinateur');

  // Build atout pile, removing any cards selected for custom decks
  const selectedIds = new Set([
    ...(config?.customAtoutsP1 ?? []).map(c => c.id),
    ...(config?.customAtoutsP2 ?? []).map(c => c.id),
  ]);
  const fullAtoutPile = buildAtoutPile().filter(c => !selectedIds.has(c.id));
  const pileAtout = fullAtoutPile;

  const shuffledChefs = shuffle([...chefsDeProjets]);
  const players: Player[] = [
    {
      id: 1,
      nom: p1Name,
      score: 0,
      main: config?.customAtoutsP1 ? [...config.customAtoutsP1] : [],
      projets: [],
      turnActions: emptyActions(),
      skippedTurns: 0,
      chef: shuffledChefs[0],
      totalAtoutsJoues: 0,
      totalPreuvesJouees: 0,
      projetsGO: 0,
      projetsNoGo: 0,
    },
    {
      id: 2,
      nom: p2Name,
      score: 0,
      main: config?.customAtoutsP2 ? [...config.customAtoutsP2] : [],
      projets: [],
      turnActions: emptyActions(),
      skippedTurns: 0,
      isAI: mode === 'vs_ai',
      chef: shuffledChefs[1],
      totalAtoutsJoues: 0,
      totalPreuvesJouees: 0,
      projetsGO: 0,
      projetsNoGo: 0,
    },
  ];

  const offerCount = Math.min(3, allProjets.length);
  const draftOptions = allProjets.slice(0, offerCount);
  const pileProjet = allProjets.slice(offerCount);

  return {
    joueurs: players,
    currentPlayer: 0,
    tour: 1,
    maxTours: 20,
    phase: 'draw',
    pileProjet,
    pilePreuve,
    pileAtout,
    pileEvenement,
    historique: [{ tour: 0, message: `Partie lancée — ${p1Name}, choisissez votre premier projet !`, type: 'system' }],
    activeEvent: null,
    winner: null,
    animatingEvent: false,
    projectDraftOptions: draftOptions.length > 0 ? draftOptions : null,
    pendingConformityReview: null,
    pendingCriticalDecision: null,
    pendingReactionWindow: null,
    defaussePreuve: [],
    pendingProofSelection: null,
    gameMode: mode,
    aiDifficulty: difficulty,
    gameStats: null,
    hotSeatTransitionPending: false,
    startTime: Date.now(),
  };
}

function addLog(state: GameState, message: string, type: HistoryEntry['type'] = 'action') {
  state.historique.push({ tour: state.tour, message, type });
}

function recycleProofs(projet: ProjetCard, state: GameState) {
  for (const nom of projet.preuvesAttachees) {
    const base = preuveDeck.find(p => p.nom === nom);
    if (base) state.defaussePreuve.push({ ...base, id: `${base.id}-r${Math.random().toString(36).slice(2, 7)}` });
  }
  projet.preuvesAttachees = [];
}

function reshufflePreuveIfNeeded(state: GameState) {
  if (state.pilePreuve.length === 0 && state.defaussePreuve.length > 0) {
    state.pilePreuve = shuffle([...state.defaussePreuve]);
    state.defaussePreuve = [];
    addLog(state, '♻ Défausse de preuves remélangée dans la pioche.', 'system');
  }
}

function buildGameStats(state: GameState, winner: string): GameStats {
  return {
    startTime: state.startTime,
    endTime: Date.now(),
    totalTurns: state.tour,
    scores: state.joueurs.map(p => ({
      nom: p.nom,
      score: p.score,
      projetsGO: p.projetsGO,
      projetsNoGo: p.projetsNoGo,
      atoutsJoues: p.totalAtoutsJoues,
      preuvesJouees: p.totalPreuvesJouees,
    })),
  };
}

function checkWinner(state: GameState): string | null {
  for (const p of state.joueurs) {
    if (p.score >= 10) {
      const msg = `${p.nom} gagne avec ${p.score} points !`;
      if (!state.gameStats) state.gameStats = buildGameStats(state, msg);
      return msg;
    }
    const s3Completed = p.projets.filter(pr => pr.criticite === 'S3' && pr.status === 'Terminé').length;
    if (s3Completed >= 3) {
      const msg = `${p.nom} remporte la victoire — 3 projets S3 complétés !`;
      if (!state.gameStats) state.gameStats = buildGameStats(state, msg);
      return msg;
    }
  }
  const bothIdle = state.joueurs.every(p =>
    p.projets.every(pr => pr.status === 'Terminé' || pr.status === 'NO GO')
  );
  if (state.tour > state.maxTours || (state.pileProjet.length === 0 && bothIdle && !state.projectDraftOptions)) {
    const best = state.joueurs.reduce((a, b) => b.score > a.score ? b : a);
    const msg = `${best.nom} gagne avec ${best.score} points (fin de partie) !`;
    if (!state.gameStats) state.gameStats = buildGameStats(state, msg);
    return msg;
  }
  return null;
}

function getMaxAP(player: Player, tour: number): number {
  return (player.chef?.id === 'c1' && tour % 2 === 0) ? 3 : 2;
}


function tryCompleteProjet(projet: ProjetCard, _player: Player, state: GameState) {
  if (projet.currentStep >= projet.etapes.length && projet.status === 'En cours') {
    checkForReview(projet, state);
  }
}

function checkForReview(projet: ProjetCard, state: GameState) {
  if (projet.currentStep < projet.etapes.length) return;
  if (projet.status !== 'En cours') return;
  if (state.pendingConformityReview) return;

  const highRisk = projet.riskLevel >= projet.maxRisk;
  const allProofs = projet.preuvesRequises.length === 0 ||
    projet.preuvesRequises.every(r => projet.preuvesAttachees.includes(r));

  const result: ConformityResult = allProofs ? 'GO' : highRisk ? 'NO GO' : 'GO_RESERVES';
  state.pendingConformityReview = { projetId: projet.id, nom: projet.nom, result, valeur: projet.valeur };
}

function advanceProjet(projet: ProjetCard, steps: number, riskPerStep: number, player: Player, state: GameState) {
  let advanced = 0;
  while (advanced < steps && projet.currentStep < projet.etapes.length) {
    projet.currentStep++;
    projet.riskLevel = Math.min(projet.riskLevel + riskPerStep, 100);
    advanced++;
  }
  if (projet.riskLevel >= projet.maxRisk) {
    projet.status = 'NO GO';
    addLog(state, `"${projet.nom}" — NO GO automatique !`, 'event');
  } else if (advanced > 0) {
    tryCompleteProjet(projet, player, state);
  }
  return advanced;
}

function applyOffensiveEffect(
  effet: string,
  atoutNom: string,
  attacker: Player,
  victim: Player,
  targetProjet: ProjetCard | undefined,
  state: GameState
): void {
  switch (effet) {
    case 'noGo': {
      const proj = targetProjet || victim.projets.find(p => p.status === 'En cours');
      if (!proj) break;
      proj.status = 'NO GO';
      recycleProofs(proj, state);
      addLog(state, `${attacker.nom} impose NO GO sur "${proj.nom}" !`, 'event');
      break;
    }
    case 'bloque': {
      const proj = targetProjet || victim.projets.find(p => p.status === 'En cours');
      if (!proj) break;
      proj.blockedTurns = 2; proj.status = 'Bloqué';
      addLog(state, `${attacker.nom} joue "${atoutNom}" → "${proj.nom}" bloqué 2 tours.`, 'action');
      break;
    }
    case 'blocueCeTour': {
      const proj = targetProjet || victim.projets.find(p => p.status === 'En cours');
      if (!proj) break;
      proj.blockedTurns = 1; proj.status = 'Bloqué';
      addLog(state, `${attacker.nom} joue "${atoutNom}" → "${proj.nom}" bloqué ce tour.`, 'action');
      break;
    }
    case 'bloqueTous': {
      const cibles = victim.projets.filter(p => p.status === 'En cours');
      for (const proj of cibles) { proj.blockedTurns = 1; proj.status = 'Bloqué'; }
      addLog(state, `${attacker.nom} joue "${atoutNom}" → tous les projets de ${victim.nom} bloqués !`, 'event');
      break;
    }
    case 'recule': {
      const proj = targetProjet || victim.projets
        .filter(p => p.status === 'En cours' && p.currentStep > 0)
        .sort((a, b) => b.currentStep - a.currentStep)[0];
      if (!proj || proj.currentStep <= 0) break;
      proj.currentStep = Math.max(0, proj.currentStep - 1);
      addLog(state, `${attacker.nom} joue "${atoutNom}" → "${proj.nom}" recule d'une étape.`, 'action');
      break;
    }
    case 'sauteTour':
      victim.skippedTurns = Math.min((victim.skippedTurns || 0) + 1, 2);
      addLog(state, `${attacker.nom} joue "${atoutNom}" → ${victim.nom} perd son prochain tour !`, 'event');
      break;
    case 'defausseAtout': {
      const atouts = victim.main.filter(c => c.type === 'Atout');
      if (!atouts.length) break;
      const toRemove = atouts[Math.floor(Math.random() * atouts.length)];
      victim.main = victim.main.filter(c => c.id !== toRemove.id);
      addLog(state, `${attacker.nom} joue "${atoutNom}" → ${victim.nom} perd "${toRemove.nom}".`, 'action');
      break;
    }
    case 'retirePreuve': {
      const proj = targetProjet || victim.projets[0];
      if (!proj || !proj.preuvesAttachees.length) break;
      const removed = proj.preuvesAttachees.pop();
      proj.riskLevel = Math.min(proj.riskLevel + 15, 100);
      if (removed) {
        const base = preuveDeck.find(p => p.nom === removed);
        if (base) state.defaussePreuve.push({ ...base, id: `${base.id}-r${Math.random().toString(36).slice(2, 7)}` });
      }
      addLog(state, `${attacker.nom} joue "${atoutNom}" → retire "${removed}" de "${proj.nom}".`, 'action');
      break;
    }
    case 'reculeTous':
      for (const p of state.joueurs) {
        const proj = p.projets
          .filter(pr => pr.status === 'En cours' && pr.currentStep > 0)
          .sort((a, b) => b.currentStep - a.currentStep)[0];
        if (proj) proj.currentStep = Math.max(0, proj.currentStep - 1);
      }
      addLog(state, `${attacker.nom} joue "${atoutNom}" → tous reculent d'une étape !`, 'event');
      break;
    case 'reculeGrands':
      for (const p of state.joueurs) {
        for (const proj of p.projets) {
          if (proj.criticite === 'S3' && proj.status === 'En cours' && proj.currentStep > 0)
            proj.currentStep = Math.max(0, proj.currentStep - 1);
        }
      }
      addLog(state, `${attacker.nom} joue "${atoutNom}" → tous les projets S3 reculent.`, 'event');
      break;
  }
}

// Apply AI reaction card effect (mirrors playReactionCard logic)
function applyAIReactionEffect(
  reactionCard: AtoutCard,
  victim: Player,
  attacker: Player,
  pw: { atoutEffet: string; atoutNom: string; targetProjetId?: string },
  state: GameState
) {
  addLog(state, `⚡ CARTE PIÈGE ! ${victim.nom} active "${reactionCard.nom}" — l'attaque "${pw.atoutNom}" est annulée !`, 'event');
  switch (reactionCard.effet) {
    case 'immunite':
      victim.immuniteActive = true;
      addLog(state, `${victim.nom} → bouclier actif jusqu'au prochain tour.`, 'action');
      break;
    case 'annuleMalus': {
      victim.annuleMalusProtected = true;
      const targetProjet = pw.targetProjetId
        ? attacker.projets.find(p => p.id === pw.targetProjetId) || undefined
        : undefined;
      applyOffensiveEffect(pw.atoutEffet, pw.atoutNom, victim, attacker, targetProjet, state);
      addLog(state, `🔄 L'attaque est renvoyée à ${attacker.nom} !`, 'event');
      break;
    }
    case 'retirage': {
      const noGoProj = victim.projets.find(p => p.status === 'NO GO');
      if (noGoProj) {
        noGoProj.status = 'En cours';
        noGoProj.riskLevel = Math.max(0, noGoProj.riskLevel - 20);
        addLog(state, `${victim.nom} → "${noGoProj.nom}" relancé.`, 'action');
      }
      break;
    }
    case 'annuleEvent':
      state.activeEvent = null;
      state.animatingEvent = false;
      addLog(state, `${victim.nom} → événement global annulé !`, 'action');
      break;
    case 'reduceRisk': {
      const riskyProj = [...victim.projets].sort((a, b) => b.riskLevel - a.riskLevel)[0];
      if (riskyProj) riskyProj.riskLevel = Math.max(0, riskyProj.riskLevel - 30);
      addLog(state, `${victim.nom} → risque réduit sur son projet le plus exposé.`, 'action');
      break;
    }
    default:
      break;
  }
}

type GameStore = GameState & {
  drawPhase: () => void;
  selectDraftProject: (projetId: string) => void;
  advanceProject: (projetId: string) => void;
  skipToSecondary: () => void;
  attachProof: (cardId: string, projetId: string) => void;
  playAtout: (cardId: string, targetProjetId?: string) => void;
  playReactionCard: (cardId: string) => void;
  passReaction: () => void;
  endTurn: () => void;
  confirmHotSeat: () => void;
  discardCard: (cardId: string) => void;
  confirmReview: () => void;
  selectProofFromPool: (cardId: string) => void;
  skipProofSelection: () => void;
  newGame: (config?: GameSetupConfig) => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...makeInitialState(),

  drawPhase() {
    const s = get();
    if (s.phase !== 'draw') return;
    if (s.projectDraftOptions !== null) return;

    const state = { ...s, joueurs: s.joueurs.map(j => ({ ...j, projets: j.projets.map(p => ({ ...p })), main: [...j.main] })) };
    const player = state.joueurs[state.currentPlayer];

    const hasActiveProject = player.projets.some(p => p.status === 'En cours' || p.status === 'Bloqué');
    if (!hasActiveProject && state.pileProjet.length > 0) {
      const offerCount = Math.min(3, state.pileProjet.length);
      const { drawn, remaining } = drawCards(state.pileProjet, offerCount);
      state.projectDraftOptions = drawn;
      state.pileProjet = remaining;
      addLog(state, `${player.nom} choisit un nouveau projet.`, 'system');
      set(state);
      return;
    }

    player.immuniteActive = false;
    for (let i = 0; i < 2 && state.pileAtout.length > 0 && player.main.length < 10; i++) {
      const { drawn, remaining } = drawCards(state.pileAtout, 1);
      player.main.push(...drawn);
      state.pileAtout = remaining;
    }
    reshufflePreuveIfNeeded(state);
    if (state.pilePreuve.length && player.main.length < 10) {
      const { drawn, remaining } = drawCards(state.pilePreuve, 1);
      player.main.push(...drawn);
      state.pilePreuve = remaining;
    }

    addLog(state, `${player.nom} pioche ses cartes.`, 'system');
    state.phase = 'main';
    set(state);
  },

  selectDraftProject(projetId: string) {
    const s = get();
    const draftOptions = s.projectDraftOptions;
    if (!draftOptions) return;

    const state = { ...s, joueurs: s.joueurs.map(j => ({ ...j, projets: j.projets.map(p => ({ ...p })), main: [...j.main] })) };
    const player = state.joueurs[state.currentPlayer];

    const chosen = draftOptions.find(p => p.id === projetId);
    if (!chosen) return;

    player.projets.push({ ...chosen });
    const unchosen = draftOptions.filter(p => p.id !== projetId);
    state.pileProjet = [...state.pileProjet, ...unchosen];
    state.projectDraftOptions = null;

    player.immuniteActive = false;
    for (let i = 0; i < 2 && state.pileAtout.length > 0 && player.main.length < 10; i++) {
      const { drawn, remaining } = drawCards(state.pileAtout, 1);
      player.main.push(...drawn);
      state.pileAtout = remaining;
    }
    reshufflePreuveIfNeeded(state);
    if (state.pilePreuve.length && player.main.length < 10) {
      const { drawn, remaining } = drawCards(state.pilePreuve, 1);
      player.main.push(...drawn);
      state.pilePreuve = remaining;
    }

    addLog(state, `${player.nom} démarre le projet "${chosen.nom}".`, 'system');
    state.phase = 'main';
    set(state);
  },

  skipToSecondary() {
    // Phases main/secondary fusionnées — conservé pour compatibilité IA
  },

  advanceProject(projetId) {
    const s = get();
    const state = { ...s, joueurs: s.joueurs.map(j => ({ ...j, projets: j.projets.map(p => ({ ...p })), main: [...j.main] })) };
    const player = state.joueurs[state.currentPlayer];
    const projet = player.projets.find(p => p.id === projetId);
    if (!projet) return;

    if (state.phase !== 'main') return;
    if (player.turnActions.projetAvance) return;

    const advMaxAP = getMaxAP(player, state.tour);
    const advApUsed = player.turnActions.atoutsJoues;
    if (advApUsed >= advMaxAP) {
      addLog(state, 'Plus d\'AP disponibles ce tour.', 'system');
      set(state); return;
    }

    if (projet.status !== 'En cours' || projet.blockedTurns > 0) {
      addLog(state, `"${projet.nom}" est bloqué ou non disponible.`, 'system');
      set(state); return;
    }
    if (projet.currentStep >= projet.etapes.length) {
      addLog(state, `"${projet.nom}" est déjà à la dernière étape.`, 'system');
      set(state); return;
    }

    projet.currentStep += 1;
    projet.riskLevel = Math.min(projet.riskLevel + 8, 100);

    if (projet.currentStep >= projet.etapes.length) {
      addLog(state, `${player.nom} avance "${projet.nom}" → étape finale, revue en cours...`, 'action');
      checkForReview(projet, state);
    } else if (projet.riskLevel >= projet.maxRisk) {
      projet.status = 'NO GO';
      recycleProofs(projet, state);
      addLog(state, `"${projet.nom}" atteint le seuil de risque — NO GO automatique !`, 'event');
    } else {
      addLog(state, `${player.nom} avance "${projet.nom}" → étape ${projet.currentStep}/${projet.etapes.length}.`, 'action');
    }

    player.turnActions = { ...player.turnActions, projetAvance: true, mainActionDone: true };

    state.winner = checkWinner(state);
    set(state);
  },

  attachProof(cardId, projetId) {
    const s = get();
    if (s.phase !== 'main') return;
    const state = { ...s, joueurs: s.joueurs.map(j => ({ ...j, projets: j.projets.map(p => ({ ...p })), main: [...j.main] })) };
    const player = state.joueurs[state.currentPlayer];

    if (player.turnActions.preuveJouee) {
      addLog(state, 'Déjà 1 preuve jouée ce tour.', 'system');
      set(state); return;
    }

    const cardIdx = player.main.findIndex(c => c.id === cardId);
    if (cardIdx < 0) return;
    const card = player.main[cardIdx] as PreuveCard;
    const projet = player.projets.find(p => p.id === projetId);
    if (!projet || projet.status !== 'En cours') return;
    if (projet.preuvesAttachees.includes(card.nom)) {
      addLog(state, `Preuve "${card.nom}" déjà attachée à "${projet.nom}".`, 'system');
      set(state); return;
    }

    projet.preuvesAttachees.push(card.nom);
    projet.riskLevel = Math.max(0, projet.riskLevel - 10);
    player.main.splice(cardIdx, 1);
    player.totalPreuvesJouees += 1;
    addLog(state, `${player.nom} attache "${card.nom}" à "${projet.nom}".`, 'action');

    if (projet.currentStep >= projet.etapes.length) {
      checkForReview(projet, state);
    }

    player.turnActions = { ...player.turnActions, preuveJouee: true };

    state.winner = checkWinner(state);
    set(state);
  },

  playAtout(cardId, targetProjetId) {
    const s = get();
    if (s.phase !== 'main') return;
    const state = { ...s, joueurs: s.joueurs.map(j => ({ ...j, projets: j.projets.map(p => ({ ...p })), main: [...j.main] })) };
    const player = state.joueurs[state.currentPlayer];
    const opponent = state.joueurs[(state.currentPlayer + 1) % 2];

    const atMaxAP = getMaxAP(player, state.tour);
    const atApUsed = (player.turnActions.projetAvance ? 1 : 0) + player.turnActions.atoutsJoues;
    const multiAtoutAllowed = player.chef?.id === 'c3' || (player.chef?.id === 'c1' && state.tour % 2 === 0);

    if (atApUsed >= atMaxAP) {
      addLog(state, 'Plus d\'AP disponibles ce tour.', 'system');
      set(state); return;
    }
    if (!multiAtoutAllowed && player.turnActions.atoutJoue) {
      addLog(state, 'Déjà 1 atout joué ce tour.', 'system');
      set(state); return;
    }

    const cardIdx = player.main.findIndex(c => c.id === cardId);
    if (cardIdx < 0) return;
    const atout = player.main[cardIdx] as AtoutCard;

    const targetProjet = targetProjetId
      ? (player.projets.find(p => p.id === targetProjetId) || opponent.projets.find(p => p.id === targetProjetId))
      : undefined;

    const offensiveEffects: string[] = ['bloque', 'blocueCeTour', 'bloqueTous', 'noGo', 'recule', 'sauteTour', 'defausseAtout', 'retirePreuve', 'reculeTous', 'reculeGrands'];
    if (offensiveEffects.includes(atout.effet)) {
      const consumeAtoutAP = () => {
        const nc = player.turnActions.atoutsJoues + 1;
        player.turnActions = { ...player.turnActions, atoutJoue: true, atoutsJoues: nc };
      };
      const consumeAndReturn = () => {
        player.main.splice(cardIdx, 1);
        player.totalAtoutsJoues += 1;
        consumeAtoutAP();
        state.winner = checkWinner(state);
        set(state);
      };
      if (opponent.immuniteActive) {
        opponent.immuniteActive = false;
        addLog(state, `${opponent.nom} est immunisé — l'effet de "${atout.nom}" est annulé !`, 'event');
        consumeAndReturn(); return;
      }
      if (opponent.annuleMalusProtected) {
        opponent.annuleMalusProtected = false;
        addLog(state, `${opponent.nom} annule le malus "${atout.nom}" !`, 'event');
        consumeAndReturn(); return;
      }
      // Human victim with reaction cards → open reaction window
      const victimReactions = opponent.main.filter(c => c.type === 'Atout' && (c as AtoutCard).subtype === 'reaction') as AtoutCard[];
      if (!opponent.isAI && victimReactions.length > 0) {
        player.main.splice(cardIdx, 1);
        player.totalAtoutsJoues += 1;
        consumeAtoutAP();
        state.pendingReactionWindow = {
          victimIdx: (state.currentPlayer + 1) % 2,
          attackerIdx: state.currentPlayer,
          atoutNom: atout.nom,
          atoutEffet: atout.effet,
          targetProjetId,
        };
        addLog(state, `${player.nom} joue "${atout.nom}" — fenêtre de réaction ouverte !`, 'action');
        state.winner = checkWinner(state);
        set(state);
        return;
      }
      // AI victim: decide whether to react based on difficulty
      if (opponent.isAI && victimReactions.length > 0) {
        const reactionCard = computeAIReactionDecision(state.aiDifficulty, atout.effet, victimReactions);
        if (reactionCard) {
          player.main.splice(cardIdx, 1);
          player.totalAtoutsJoues += 1;
          consumeAtoutAP();
          opponent.main = opponent.main.filter(c => c.id !== reactionCard.id);
          applyAIReactionEffect(reactionCard, opponent, player, {
            atoutEffet: atout.effet,
            atoutNom: atout.nom,
            targetProjetId,
          }, state);
          state.winner = checkWinner(state);
          set(state);
          return;
        }
      }
    }

    let extraAtoutAllowed = false;

    switch (atout.effet) {
      case 'avance': {
        const proj = targetProjet || player.projets.find(p => p.status === 'En cours');
        if (!proj) { addLog(state, 'Aucun projet cible.', 'system'); set(state); return; }
        const n = advanceProjet(proj, 1, 5, player, state);
        if (n > 0) addLog(state, `${player.nom} joue "${atout.nom}" → "${proj.nom}" avance.`, 'action');
        break;
      }
      case 'retirePreuve': {
        const proj = targetProjet || opponent.projets[0];
        if (!proj || !proj.preuvesAttachees.length) { addLog(state, 'Aucune preuve à retirer.', 'system'); set(state); return; }
        const removed = proj.preuvesAttachees.pop();
        proj.riskLevel = Math.min(proj.riskLevel + 15, 100);
        if (removed) {
          const base = preuveDeck.find(p => p.nom === removed);
          if (base) state.defaussePreuve.push({ ...base, id: `${base.id}-r${Math.random().toString(36).slice(2, 7)}` });
        }
        addLog(state, `${player.nom} joue "${atout.nom}" → retire "${removed}" de "${proj.nom}".`, 'action');
        break;
      }
      case 'noGo': {
        const proj = targetProjet || opponent.projets.find(p => p.status === 'En cours');
        if (!proj) { addLog(state, 'Aucun projet adverse.', 'system'); set(state); return; }
        proj.status = 'NO GO';
        recycleProofs(proj, state);
        addLog(state, `${player.nom} impose NO GO sur "${proj.nom}" !`, 'event');
        break;
      }
      case 'bloque': {
        const proj = targetProjet || opponent.projets.find(p => p.status === 'En cours');
        if (!proj) { addLog(state, 'Aucun projet adverse.', 'system'); set(state); return; }
        proj.blockedTurns = 2;
        proj.status = 'Bloqué';
        addLog(state, `${player.nom} joue "${atout.nom}" → "${proj.nom}" bloqué 2 tours.`, 'action');
        break;
      }
      case 'ignoreCondition': {
        const proj = targetProjet || player.projets.find(p => p.status === 'En cours');
        if (!proj) { addLog(state, 'Aucun projet actif.', 'system'); set(state); return; }
        if (proj.currentStep < proj.etapes.length) {
          proj.currentStep += 1;
          addLog(state, `${player.nom} joue "${atout.nom}" → ignore une condition sur "${proj.nom}".`, 'action');
          checkForReview(proj, state);
        }
        break;
      }
      case 'reduceRisk': {
        const proj = targetProjet || player.projets.sort((a, b) => b.riskLevel - a.riskLevel)[0];
        if (!proj) { addLog(state, 'Aucun projet.', 'system'); set(state); return; }
        proj.riskLevel = Math.max(0, proj.riskLevel - 30);
        addLog(state, `${player.nom} réduit le risque de "${proj.nom}" de 30 pts.`, 'action');
        break;
      }
      case 'doublePioche': {
        const space = 10 - player.main.length;
        if (space <= 0) { addLog(state, `${player.nom} joue "${atout.nom}" — main pleine.`, 'system'); break; }
        const dpPool = [...state.pilePreuve, ...state.defaussePreuve];
        if (!dpPool.length) { addLog(state, `${player.nom} joue "${atout.nom}" — aucune preuve disponible.`, 'system'); break; }
        state.pilePreuve = [];
        state.defaussePreuve = [];
        state.pendingProofSelection = { available: dpPool, count: Math.min(2, space) };
        addLog(state, `${player.nom} joue "${atout.nom}" — choisissez jusqu'à ${Math.min(2, space)} preuve(s).`, 'action');
        break;
      }
      case 'avance2': {
        const proj = targetProjet || player.projets.find(p => p.status === 'En cours');
        if (!proj) { addLog(state, 'Aucun projet cible.', 'system'); set(state); return; }
        const n = advanceProjet(proj, 2, 8, player, state);
        addLog(state, `${player.nom} joue "${atout.nom}" → "${proj.nom}" avance de ${n} étape(s).`, 'action');
        break;
      }
      case 'avance3':
      case 'rushSansPreuve': {
        const proj = targetProjet || player.projets.find(p => p.status === 'En cours');
        if (!proj) { addLog(state, 'Aucun projet cible.', 'system'); set(state); return; }
        const n = advanceProjet(proj, 3, 20, player, state);
        addLog(state, `${player.nom} joue "${atout.nom}" → compression de délais (+${n} étapes, risque accru).`, 'action');
        break;
      }
      case 'avanceRisque': {
        const proj = targetProjet || player.projets.find(p => p.status === 'En cours');
        if (!proj) { addLog(state, 'Aucun projet cible.', 'system'); set(state); return; }
        const n = advanceProjet(proj, 2, 25, player, state);
        addLog(state, `${player.nom} joue "${atout.nom}" → "${proj.nom}" avance de ${n} étape(s) (risque +${n * 25}).`, 'action');
        break;
      }
      case 'avanceDeux': {
        const actifs = player.projets.filter(p => p.status === 'En cours' && p.currentStep < p.etapes.length);
        if (!actifs.length) { addLog(state, 'Aucun projet actif.', 'system'); set(state); return; }
        const targets = actifs.slice(0, 2);
        for (const proj of targets) advanceProjet(proj, 1, 8, player, state);
        addLog(state, `${player.nom} joue "${atout.nom}" → ${targets.length} projet(s) avancent.`, 'action');
        break;
      }
      case 'avanceTous': {
        const actifs = player.projets.filter(p => p.status === 'En cours' && p.currentStep < p.etapes.length);
        for (const proj of actifs) advanceProjet(proj, 1, 5, player, state);
        addLog(state, `${player.nom} joue "${atout.nom}" → tous ses projets avancent.`, 'action');
        break;
      }
      case 'avanceTousJoueurs': {
        for (const p of state.joueurs) {
          const proj = p.projets.find(pr => pr.status === 'En cours' && pr.currentStep < pr.etapes.length);
          if (proj) advanceProjet(proj, 1, 5, p, state);
        }
        addLog(state, `${player.nom} joue "${atout.nom}" → bonne humeur générale, tout le monde avance !`, 'action');
        break;
      }
      case 'avancePetits': {
        for (const p of state.joueurs) {
          for (const proj of p.projets) {
            if ((proj.criticite === 'S0' || proj.criticite === 'S1') && proj.status === 'En cours' && proj.currentStep < proj.etapes.length) {
              advanceProjet(proj, 1, 3, p, state);
            }
          }
        }
        addLog(state, `${player.nom} joue "${atout.nom}" → tous les projets S0/S1 avancent.`, 'action');
        break;
      }
      case 'finalise': {
        const proj = targetProjet || player.projets.find(p => p.status === 'En cours');
        if (!proj) { addLog(state, 'Aucun projet cible.', 'system'); set(state); return; }
        proj.currentStep = proj.etapes.length;
        addLog(state, `${player.nom} joue "${atout.nom}" → "${proj.nom}" atteint la dernière étape.`, 'action');
        checkForReview(proj, state);
        break;
      }
      case 'piocheBonus': {
        const space = 10 - player.main.length;
        if (space <= 0) { addLog(state, 'Main pleine.', 'system'); break; }
        reshufflePreuveIfNeeded(state);
        const pbPool = [...state.pilePreuve, ...state.defaussePreuve];
        if (pbPool.length) {
          state.pilePreuve = [];
          state.defaussePreuve = [];
          state.pendingProofSelection = { available: pbPool, count: 1 };
          addLog(state, `${player.nom} joue "${atout.nom}" — choisissez une preuve.`, 'action');
        } else if (state.pileAtout.length) {
          const { drawn, remaining } = drawCards(state.pileAtout, 1);
          player.main.push(...drawn);
          state.pileAtout = remaining;
          addLog(state, `${player.nom} pioche 1 atout supplémentaire.`, 'action');
        } else {
          addLog(state, `${player.nom} joue "${atout.nom}" — piles vides.`, 'system');
        }
        break;
      }
      case 'annuleEvent': {
        state.activeEvent = null;
        state.animatingEvent = false;
        addLog(state, `${player.nom} joue "${atout.nom}" → événement global annulé !`, 'action');
        break;
      }
      case 'retirage': {
        const proj = targetProjet || player.projets.find(p => p.status === 'NO GO');
        if (!proj || proj.status !== 'NO GO') { addLog(state, 'Aucun projet en NO GO.', 'system'); set(state); return; }
        proj.status = 'En cours';
        proj.riskLevel = Math.max(0, proj.riskLevel - 20);
        addLog(state, `${player.nom} joue "${atout.nom}" → "${proj.nom}" relancé (NO GO annulé).`, 'action');
        break;
      }
      case 'recule': {
        const proj = targetProjet || opponent.projets.filter(p => p.status === 'En cours' && p.currentStep > 0).sort((a, b) => b.currentStep - a.currentStep)[0];
        if (!proj || proj.currentStep <= 0) { addLog(state, 'Aucun projet cible avec étapes.', 'system'); set(state); return; }
        proj.currentStep = Math.max(0, proj.currentStep - 1);
        addLog(state, `${player.nom} joue "${atout.nom}" → "${proj.nom}" recule d'une étape.`, 'action');
        break;
      }
      case 'reculeTous': {
        for (const p of state.joueurs) {
          const proj = p.projets.filter(pr => pr.status === 'En cours' && pr.currentStep > 0).sort((a, b) => b.currentStep - a.currentStep)[0];
          if (proj) proj.currentStep = Math.max(0, proj.currentStep - 1);
        }
        addLog(state, `${player.nom} joue "${atout.nom}" → tous reculent d'une étape !`, 'event');
        break;
      }
      case 'reculeGrands': {
        for (const p of state.joueurs) {
          for (const proj of p.projets) {
            if (proj.criticite === 'S3' && proj.status === 'En cours' && proj.currentStep > 0) {
              proj.currentStep = Math.max(0, proj.currentStep - 1);
            }
          }
        }
        addLog(state, `${player.nom} joue "${atout.nom}" → tous les projets S3 reculent.`, 'event');
        break;
      }
      case 'defausseAtout': {
        const atouts = opponent.main.filter(c => c.type === 'Atout');
        if (!atouts.length) { addLog(state, "L'adversaire n'a pas d'atout en main.", 'system'); set(state); return; }
        const toRemove = atouts[Math.floor(Math.random() * atouts.length)];
        opponent.main = opponent.main.filter(c => c.id !== toRemove.id);
        addLog(state, `${player.nom} joue "${atout.nom}" → ${opponent.nom} perd "${toRemove.nom}".`, 'action');
        break;
      }
      case 'sauteTour': {
        opponent.skippedTurns = Math.min((opponent.skippedTurns || 0) + 1, 2);
        addLog(state, `${player.nom} joue "${atout.nom}" → ${opponent.nom} perd son prochain tour !`, 'event');
        break;
      }
      case 'echangeAtout': {
        const myAtouts = player.main.filter(c => c.type === 'Atout' && c.id !== cardId);
        const oppAtouts = opponent.main.filter(c => c.type === 'Atout');
        if (!myAtouts.length || !oppAtouts.length) { addLog(state, 'Échange impossible (main insuffisante).', 'system'); set(state); return; }
        const myCard = myAtouts[Math.floor(Math.random() * myAtouts.length)];
        const oppCard = oppAtouts[Math.floor(Math.random() * oppAtouts.length)];
        player.main = player.main.filter(c => c.id !== myCard.id);
        opponent.main = opponent.main.filter(c => c.id !== oppCard.id);
        player.main.push(oppCard);
        opponent.main.push(myCard);
        addLog(state, `${player.nom} échange "${myCard.nom}" contre "${oppCard.nom}" avec ${opponent.nom}.`, 'action');
        break;
      }
      case 'goAleatoire': {
        const isOffensiveBluff = atout.subtype === 'bluff';
        const proj = targetProjet || (isOffensiveBluff
          ? opponent.projets.find(p => p.status === 'En cours')
          : player.projets.find(p => p.status === 'En cours'));
        if (!proj) { addLog(state, 'Aucun projet cible.', 'system'); set(state); return; }
        if (isOffensiveBluff) {
          if (Math.random() < 0.5) {
            proj.status = 'NO GO';
            addLog(state, `${player.nom} piège "${proj.nom}" — NO GO forcé ! (50%)`, 'event');
          } else {
            const ownProj = player.projets.find(p => p.status === 'En cours');
            if (ownProj) {
              ownProj.status = 'NO GO';
              addLog(state, `Le bluff de ${player.nom} se retourne contre lui — "${ownProj.nom}" NO GO ! (50%)`, 'event');
            } else {
              addLog(state, `Le bluff de ${player.nom} échoue — rien ne se passe. (50%)`, 'system');
            }
          }
        } else {
          if (Math.random() < 0.5) {
            proj.currentStep = proj.etapes.length;
            proj.status = 'Terminé';
            player.score += proj.valeur;
            addLog(state, `${player.nom} tente le GO anticipé — SUCCÈS ! "${proj.nom}" (+${proj.valeur} pts, 50%)`, 'score');
          } else {
            proj.status = 'NO GO';
            addLog(state, `${player.nom} tente le GO anticipé — ÉCHEC ! "${proj.nom}" (50%)`, 'event');
          }
        }
        break;
      }
      case 'finalisAleatoire': {
        const proj = targetProjet || player.projets.find(p => p.status === 'En cours');
        if (!proj) { addLog(state, 'Aucun projet cible.', 'system'); set(state); return; }
        if (Math.random() < 0.3) {
          proj.currentStep = proj.etapes.length;
          proj.status = 'Terminé';
          player.score += proj.valeur;
          addLog(state, `Livraison forcée "${proj.nom}" — GO ! (+${proj.valeur} pts, 30%)`, 'score');
        } else {
          proj.status = 'NO GO';
          addLog(state, `Livraison forcée "${proj.nom}" — NO GO ! (70%)`, 'event');
        }
        break;
      }
      case 'recategorise': {
        const proj = targetProjet || player.projets.find(p => p.criticite === 'S2' && p.status === 'En cours');
        if (!proj || proj.criticite !== 'S2') { addLog(state, 'Aucun projet S2 à recatégoriser.', 'system'); set(state); return; }
        proj.criticite = 'S1';
        proj.maxRisk = Math.max(proj.maxRisk, 75);
        addLog(state, `${player.nom} recatégorise "${proj.nom}" : S2 → S1 (seuil de risque augmenté).`, 'action');
        break;
      }
      case 'doubleCarte':
        extraAtoutAllowed = true;
        addLog(state, `${player.nom} joue "${atout.nom}" — un atout supplémentaire peut être joué ce tour !`, 'action');
        break;
      case 'annuleMalus':
        player.annuleMalusProtected = true;
        addLog(state, `${player.nom} joue "${atout.nom}" — protection activée, prochain malus annulé.`, 'action');
        break;
      case 'immunite':
        player.immuniteActive = true;
        addLog(state, `${player.nom} joue "${atout.nom}" → bouclier actif jusqu'au prochain tour.`, 'action');
        break;
      case 'blocueCeTour': {
        const proj = targetProjet || opponent.projets.find(p => p.status === 'En cours');
        if (!proj) { addLog(state, 'Aucun projet adverse.', 'system'); set(state); return; }
        proj.blockedTurns = 1;
        proj.status = 'Bloqué';
        addLog(state, `${player.nom} joue "${atout.nom}" → "${proj.nom}" bloqué ce tour.`, 'action');
        break;
      }
      case 'bloqueTous': {
        const cibles = opponent.projets.filter(p => p.status === 'En cours');
        if (!cibles.length) { addLog(state, 'Aucun projet adverse actif.', 'system'); set(state); return; }
        for (const proj of cibles) { proj.blockedTurns = 1; proj.status = 'Bloqué'; }
        addLog(state, `${player.nom} joue "${atout.nom}" → tous les projets adverses sont bloqués ce tour !`, 'event');
        break;
      }
    }

    player.main.splice(cardIdx, 1);
    player.totalAtoutsJoues += 1;

    if (extraAtoutAllowed && !multiAtoutAllowed) {
      player.turnActions = { ...player.turnActions, atoutJoue: false };
    } else if (!extraAtoutAllowed) {
      const newCount = player.turnActions.atoutsJoues + 1;
      player.turnActions = { ...player.turnActions, atoutJoue: true, atoutsJoues: newCount };
    }

    state.winner = checkWinner(state);
    set(state);
  },

  playReactionCard(cardId) {
    const s = get();
    if (!s.pendingReactionWindow) return;
    const pw = s.pendingReactionWindow;
    const state = { ...s, joueurs: s.joueurs.map(j => ({ ...j, projets: j.projets.map(p => ({ ...p })), main: [...j.main] })) };

    const victim = state.joueurs[pw.victimIdx];
    const attacker = state.joueurs[pw.attackerIdx];

    const cardIdx = victim.main.findIndex(c => c.id === cardId);
    if (cardIdx < 0) return;
    const reactionCard = victim.main[cardIdx] as AtoutCard;
    victim.main.splice(cardIdx, 1);

    addLog(state, `⚡ CARTE PIÈGE ! ${victim.nom} active "${reactionCard.nom}" — l'attaque "${pw.atoutNom}" est annulée !`, 'event');

    switch (reactionCard.effet) {
      case 'immunite':
        victim.immuniteActive = true;
        addLog(state, `${victim.nom} → bouclier actif jusqu'au prochain tour.`, 'action');
        break;
      case 'annuleMalus': {
        victim.annuleMalusProtected = true;
        const targetProjet = pw.targetProjetId
          ? attacker.projets.find(p => p.id === pw.targetProjetId) || undefined
          : undefined;
        applyOffensiveEffect(pw.atoutEffet, pw.atoutNom, victim, attacker, targetProjet, state);
        addLog(state, `🔄 L'attaque est renvoyée à ${attacker.nom} !`, 'event');
        break;
      }
      case 'retirage': {
        const noGoProj = victim.projets.find(p => p.status === 'NO GO');
        if (noGoProj) {
          noGoProj.status = 'En cours';
          noGoProj.riskLevel = Math.max(0, noGoProj.riskLevel - 20);
          addLog(state, `${victim.nom} → "${noGoProj.nom}" relancé.`, 'action');
        }
        break;
      }
      case 'annuleEvent':
        state.activeEvent = null;
        state.animatingEvent = false;
        addLog(state, `${victim.nom} → événement global annulé !`, 'action');
        break;
      case 'reduceRisk': {
        const riskyProj = [...victim.projets].sort((a, b) => b.riskLevel - a.riskLevel)[0];
        if (riskyProj) { riskyProj.riskLevel = Math.max(0, riskyProj.riskLevel - 30); }
        addLog(state, `${victim.nom} → risque réduit sur son projet le plus exposé.`, 'action');
        break;
      }
      default:
        break;
    }

    state.pendingReactionWindow = null;
    state.winner = checkWinner(state);
    set(state);
  },

  passReaction() {
    const s = get();
    if (!s.pendingReactionWindow) return;
    const pw = s.pendingReactionWindow;
    const state = { ...s, joueurs: s.joueurs.map(j => ({ ...j, projets: j.projets.map(p => ({ ...p })), main: [...j.main] })) };

    const attacker = state.joueurs[pw.attackerIdx];
    const victim = state.joueurs[pw.victimIdx];
    const targetProjet = pw.targetProjetId
      ? (attacker.projets.find(p => p.id === pw.targetProjetId) || victim.projets.find(p => p.id === pw.targetProjetId))
      : undefined;

    addLog(state, `${victim.nom} laisse passer l'attaque "${pw.atoutNom}".`, 'system');
    applyOffensiveEffect(pw.atoutEffet, pw.atoutNom, attacker, victim, targetProjet, state);

    state.pendingReactionWindow = null;
    state.winner = checkWinner(state);
    set(state);
  },

  endTurn() {
    const s = get();
    const state = { ...s, joueurs: s.joueurs.map(j => ({ ...j, projets: j.projets.map(p => ({ ...p })), main: [...j.main] })) };

    for (const p of state.joueurs) {
      for (const proj of p.projets) {
        if (proj.blockedTurns > 0) {
          proj.blockedTurns -= 1;
          if (proj.blockedTurns === 0 && proj.status === 'Bloqué') proj.status = 'En cours';
        }
      }
    }

    if (state.tour % 4 === 0 && state.pileEvenement.length) {
      const [ev, ...rest] = state.pileEvenement;
      state.activeEvent = ev;
      state.pileEvenement = rest;
      state.animatingEvent = true;
      addLog(state, `ÉVÉNEMENT: ${ev.nom} — ${ev.description}`, 'event');

      if (ev.effet === 'increaseRisk') {
        for (const p of state.joueurs) {
          for (const proj of p.projets) {
            const bonus = proj.criticite === 'S3' || proj.criticite === 'S2' ? 20 : 10;
            proj.riskLevel = Math.min(proj.riskLevel + bonus, 100);
            if (proj.riskLevel >= proj.maxRisk && proj.status === 'En cours') {
              proj.status = 'NO GO';
              addLog(state, `"${proj.nom}" passe en NO GO à cause de l'événement.`, 'event');
            }
          }
        }
      }
      if (ev.effet === 'preuveSup') {
        for (const p of state.joueurs) {
          for (const proj of p.projets) {
            if ((proj.criticite === 'S2' || proj.criticite === 'S3') && !proj.preuvesRequises.includes('Audit ANSSI')) {
              proj.preuvesRequises.push('Audit ANSSI');
            }
          }
        }
      }
    }

    const nextPlayer = (state.currentPlayer + 1) % 2;
    state.currentPlayer = nextPlayer;
    state.tour += 1;

    if (state.joueurs[nextPlayer].skippedTurns > 0) {
      state.joueurs[nextPlayer].skippedTurns--;
      state.phase = 'resolution';
      state.joueurs[nextPlayer].turnActions = {
        mainActionDone: true, secondaryActionDone: true,
        preuveJouee: true, atoutJoue: true, projetAvance: true, atoutsJoues: 0,
      };
      addLog(state, `${state.joueurs[nextPlayer].nom} passe son tour (effet en cours) !`, 'event');
    } else {
      state.phase = 'draw';
      state.joueurs[nextPlayer].turnActions = emptyActions();
      addLog(state, `Tour ${state.tour} — ${state.joueurs[nextPlayer].nom} joue.`, 'system');
    }

    // In hotseat mode, show transition screen before revealing next player's board
    if (state.gameMode === 'hotseat' && !state.joueurs[nextPlayer].isAI) {
      state.hotSeatTransitionPending = true;
    }

    state.winner = checkWinner(state);
    set(state);
  },

  confirmHotSeat() {
    set(s => ({ ...s, hotSeatTransitionPending: false }));
  },

  confirmReview() {
    const s = get();
    if (!s.pendingConformityReview) return;
    const state = { ...s, joueurs: s.joueurs.map(j => ({ ...j, projets: j.projets.map(p => ({ ...p })), main: [...j.main] })) };
    const review = state.pendingConformityReview!;

    let foundPlayer: Player | null = null;
    let foundProjet: ProjetCard | null = null;
    for (const p of state.joueurs) {
      const proj = p.projets.find(pr => pr.id === review.projetId);
      if (proj) { foundPlayer = p; foundProjet = proj; break; }
    }

    if (foundProjet && foundPlayer) {
      if (review.result === 'GO') {
        foundProjet.status = 'Terminé';
        let pts = foundProjet.valeur;
        const bonuses: string[] = [];
        if (foundPlayer.chef?.id === 'c2') { pts += 2; bonuses.push('Chef Strict +2'); }
foundPlayer.score += pts;
        foundPlayer.projetsGO += 1;
        recycleProofs(foundProjet, state);
        const bonusStr = bonuses.length ? ` [${bonuses.join(', ')}]` : '';
        addLog(state, `"${review.nom}" — GO ! Projet validé (+${pts} pts)${bonusStr}.`, 'score');
      } else if (review.result === 'GO_RESERVES') {
        const pts = Math.max(1, Math.floor(foundProjet.valeur / 2));
        foundProjet.status = 'Terminé';
        foundPlayer.score += pts;
        foundPlayer.projetsGO += 1;
        recycleProofs(foundProjet, state);
        addLog(state, `"${review.nom}" — GO avec Réserves (+${pts} pts, preuves incomplètes).`, 'score');
      } else {
        foundProjet.status = 'NO GO';
        foundPlayer.projetsNoGo += 1;
        recycleProofs(foundProjet, state);
        addLog(state, `"${review.nom}" — NO GO ! Projet rejeté par la revue.`, 'event');
      }
    }

    state.pendingConformityReview = null;
    state.winner = checkWinner(state);
    set(state);
  },

  discardCard(cardId) {
    const s = get();
    const state = { ...s, joueurs: s.joueurs.map(j => ({ ...j, main: [...j.main] })) };
    const player = state.joueurs[state.currentPlayer];
    const idx = player.main.findIndex(c => c.id === cardId);
    if (idx < 0) return;
    const card = player.main[idx];
    player.main.splice(idx, 1);
    addLog(state, `${player.nom} se défausse de "${card.nom}".`, 'action');
    set(state);
  },

  selectProofFromPool(cardId) {
    const s = get();
    if (!s.pendingProofSelection) return;
    const sel = s.pendingProofSelection;
    const state = { ...s, joueurs: s.joueurs.map(j => ({ ...j, main: [...j.main] })) };
    const player = state.joueurs[state.currentPlayer];

    const cardIdx = sel.available.findIndex(c => c.id === cardId);
    if (cardIdx < 0) return;

    const card = sel.available[cardIdx];
    if (player.main.length >= 10) {
      addLog(state, 'Main pleine — preuve non ajoutée.', 'system');
      set(state); return;
    }

    player.main.push(card);
    addLog(state, `${player.nom} choisit "${card.nom}".`, 'action');

    const remaining = sel.available.filter((_, i) => i !== cardIdx);
    const countLeft = sel.count - 1;

    if (countLeft <= 0 || remaining.length === 0) {
      state.pilePreuve = shuffle(remaining);
      state.pendingProofSelection = null;
    } else {
      state.pendingProofSelection = { available: remaining, count: countLeft };
    }

    set(state);
  },

  skipProofSelection() {
    const s = get();
    if (!s.pendingProofSelection) return;
    const state = { ...s };
    state.pilePreuve = shuffle(s.pendingProofSelection.available);
    state.pendingProofSelection = null;
    set(state);
  },

  newGame(config?: GameSetupConfig) {
    set(makeInitialState(config));
  },
}));
