import { create } from 'zustand';
import type { GameState, Player, ProjetCard, PreuveCard, AtoutCard, TurnActions, HistoryEntry, ConformityResult } from './types';
import { shuffle, cloneProjet, buildPreuvePile, buildAtoutPile, projetDeck, evenementDeck } from './data';

const emptyActions = (): TurnActions => ({
  mainActionDone: false,
  secondaryActionDone: false,
  preuveJouee: false,
  atoutJoue: false,
  projetAvance: false,
});

function drawCards<T>(pile: T[], n = 1): { drawn: T[]; remaining: T[] } {
  return { drawn: pile.slice(0, n), remaining: pile.slice(n) };
}

function makeInitialState(): GameState {
  const allProjets = shuffle(projetDeck.map(cloneProjet));
  const pilePreuve = buildPreuvePile();
  const pileAtout = buildAtoutPile();
  const pileEvenement = shuffle(evenementDeck.map(e => ({ ...e })));

  const players: Player[] = [
    { id: 1, nom: 'Joueur 1', score: 0, main: [], projets: [], turnActions: emptyActions(), skippedTurns: 0 },
    { id: 2, nom: 'Ordinateur', score: 0, main: [], projets: [], turnActions: emptyActions(), skippedTurns: 0, isAI: true },
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
    historique: [{ tour: 0, message: 'Partie lancée — Joueur 1, choisissez votre premier projet !', type: 'system' }],
    activeEvent: null,
    winner: null,
    animatingEvent: false,
    projectDraftOptions: draftOptions.length > 0 ? draftOptions : null,
    pendingConformityReview: null,
  };
}

function addLog(state: GameState, message: string, type: HistoryEntry['type'] = 'action') {
  state.historique.push({ tour: state.tour, message, type });
}

function checkWinner(state: GameState): string | null {
  for (const p of state.joueurs) {
    if (p.score >= 10) return `${p.nom} gagne avec ${p.score} points !`;
    const s3Completed = p.projets.filter(pr => pr.criticite === 'S3' && pr.status === 'Terminé').length;
    if (s3Completed >= 3) return `${p.nom} remporte la victoire — 3 projets S3 complétés !`;
  }
  const bothIdle = state.joueurs.every(p =>
    p.projets.every(pr => pr.status === 'Terminé' || pr.status === 'NO GO')
  );
  if (state.tour > state.maxTours || (state.pileProjet.length === 0 && bothIdle && !state.projectDraftOptions)) {
    const best = state.joueurs.reduce((a, b) => b.score > a.score ? b : a);
    return `${best.nom} gagne avec ${best.score} points (fin de partie) !`;
  }
  return null;
}

function tryCompleteProjet(projet: ProjetCard, player: Player, state: GameState) {
  const allSteps = projet.currentStep >= projet.etapes.length;
  const allProofs = projet.preuvesRequises.every(r => projet.preuvesAttachees.includes(r));
  if (allSteps && allProofs) {
    projet.status = 'Terminé';
    player.score += projet.valeur;
    addLog(state, `${player.nom} termine "${projet.nom}" (+${projet.valeur} pts) !`, 'score');
  }
}

function checkForReview(projet: ProjetCard, state: GameState) {
  if (projet.currentStep < projet.etapes.length) return;
  if (projet.status !== 'En cours') return;
  if (state.pendingConformityReview) return;

  const highRisk = projet.riskLevel >= projet.maxRisk;
  const allProofs = projet.preuvesRequises.length === 0 ||
    projet.preuvesRequises.every(r => projet.preuvesAttachees.includes(r));

  const result: ConformityResult = highRisk ? 'NO GO' : allProofs ? 'GO' : 'GO_RESERVES';
  state.pendingConformityReview = { projetId: projet.id, nom: projet.nom, result };
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

type GameStore = GameState & {
  drawPhase: () => void;
  selectDraftProject: (projetId: string) => void;
  advanceProject: (projetId: string, asBonus?: boolean) => void;
  attachProof: (cardId: string, projetId: string) => void;
  playAtout: (cardId: string, targetProjetId?: string) => void;
  endTurn: () => void;
  discardCard: (cardId: string) => void;
  confirmReview: () => void;
  newGame: () => void;
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

    if (state.pileAtout.length && player.main.length < 5) {
      const { drawn, remaining } = drawCards(state.pileAtout, 1);
      player.main.push(...drawn);
      state.pileAtout = remaining;
    }
    if (state.pilePreuve.length && player.main.length < 5) {
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

    if (state.pileAtout.length && player.main.length < 5) {
      const { drawn, remaining } = drawCards(state.pileAtout, 1);
      player.main.push(...drawn);
      state.pileAtout = remaining;
    }
    if (state.pilePreuve.length && player.main.length < 5) {
      const { drawn, remaining } = drawCards(state.pilePreuve, 1);
      player.main.push(...drawn);
      state.pilePreuve = remaining;
    }

    addLog(state, `${player.nom} démarre le projet "${chosen.nom}".`, 'system');
    state.phase = 'main';
    set(state);
  },

  advanceProject(projetId, asBonus = false) {
    const s = get();
    const state = { ...s, joueurs: s.joueurs.map(j => ({ ...j, projets: j.projets.map(p => ({ ...p })), main: [...j.main] })) };
    const player = state.joueurs[state.currentPlayer];
    const projet = player.projets.find(p => p.id === projetId);
    if (!projet) return;

    if (!asBonus && state.phase !== 'main') return;
    if (asBonus && state.phase !== 'secondary') return;
    if (player.turnActions.projetAvance) return;
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
      addLog(state, `"${projet.nom}" atteint le seuil de risque — NO GO automatique !`, 'event');
    } else {
      addLog(state, `${player.nom} avance "${projet.nom}" → étape ${projet.currentStep}/${projet.etapes.length}.`, 'action');
    }

    player.turnActions = { ...player.turnActions, projetAvance: true };
    if (!asBonus) {
      player.turnActions.mainActionDone = true;
      state.phase = 'secondary';
    } else {
      player.turnActions.secondaryActionDone = true;
      state.phase = 'resolution';
    }

    state.winner = checkWinner(state);
    set(state);
  },

  attachProof(cardId, projetId) {
    const s = get();
    if (s.phase !== 'main' && s.phase !== 'secondary') return;
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
    addLog(state, `${player.nom} attache "${card.nom}" à "${projet.nom}".`, 'action');
    tryCompleteProjet(projet, player, state);

    player.turnActions = { ...player.turnActions, preuveJouee: true };
    if (state.phase === 'main') {
      player.turnActions.mainActionDone = true;
      state.phase = 'secondary';
    } else {
      player.turnActions.secondaryActionDone = true;
      state.phase = 'resolution';
    }

    state.winner = checkWinner(state);
    set(state);
  },

  playAtout(cardId, targetProjetId) {
    const s = get();
    if (s.phase !== 'main' && s.phase !== 'secondary') return;
    const state = { ...s, joueurs: s.joueurs.map(j => ({ ...j, projets: j.projets.map(p => ({ ...p })), main: [...j.main] })) };
    const player = state.joueurs[state.currentPlayer];
    const opponent = state.joueurs[(state.currentPlayer + 1) % 2];

    if (player.turnActions.atoutJoue) {
      addLog(state, 'Déjà 1 atout joué ce tour.', 'system');
      set(state); return;
    }

    const cardIdx = player.main.findIndex(c => c.id === cardId);
    if (cardIdx < 0) return;
    const atout = player.main[cardIdx] as AtoutCard;

    const targetProjet = targetProjetId
      ? (player.projets.find(p => p.id === targetProjetId) || opponent.projets.find(p => p.id === targetProjetId))
      : undefined;

    switch (atout.effet) {

      // ── Effets existants ───────────────────────────────────────────────────
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
        addLog(state, `${player.nom} joue "${atout.nom}" → retire "${removed}" de "${proj.nom}".`, 'action');
        break;
      }
      case 'noGo': {
        const proj = targetProjet || opponent.projets.find(p => p.status === 'En cours');
        if (!proj) { addLog(state, 'Aucun projet adverse.', 'system'); set(state); return; }
        proj.status = 'NO GO';
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
      case 'immunite':
        addLog(state, `${player.nom} joue "${atout.nom}" → bouclier actif ce tour.`, 'action');
        break;
      case 'doublePioche': {
        const space = 5 - player.main.length - 1; // -1 because we remove the played card
        if (space > 0 && state.pilePreuve.length) {
          const { drawn, remaining } = drawCards(state.pilePreuve, Math.min(2, space));
          player.main.push(...drawn);
          state.pilePreuve = remaining;
        }
        addLog(state, `${player.nom} pioche 2 preuves supplémentaires.`, 'action');
        break;
      }

      // ── Nouveaux effets ────────────────────────────────────────────────────
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
        const space = 5 - player.main.length - 1;
        if (space > 0) {
          if (state.pilePreuve.length) {
            const { drawn, remaining } = drawCards(state.pilePreuve, 1);
            player.main.push(...drawn);
            state.pilePreuve = remaining;
            addLog(state, `${player.nom} pioche 1 preuve supplémentaire.`, 'action');
          } else if (state.pileAtout.length) {
            const { drawn, remaining } = drawCards(state.pileAtout, 1);
            player.main.push(...drawn);
            state.pileAtout = remaining;
            addLog(state, `${player.nom} pioche 1 atout supplémentaire.`, 'action');
          }
        } else {
          addLog(state, 'Main pleine.', 'system');
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
        const proj = targetProjet || player.projets.find(p => p.status === 'En cours');
        if (!proj) { addLog(state, 'Aucun projet cible.', 'system'); set(state); return; }
        if (Math.random() < 0.5) {
          proj.currentStep = proj.etapes.length;
          proj.status = 'Terminé';
          player.score += proj.valeur;
          addLog(state, `${player.nom} tente le GO anticipé — SUCCÈS ! "${proj.nom}" (+${proj.valeur} pts, 50%)`, 'score');
        } else {
          proj.status = 'NO GO';
          addLog(state, `${player.nom} tente le GO anticipé — ÉCHEC ! "${proj.nom}" (50%)`, 'event');
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
        addLog(state, `${player.nom} joue "${atout.nom}" — action bonus débloquée ce tour.`, 'action');
        break;
      case 'annuleMalus':
        addLog(state, `${player.nom} joue "${atout.nom}" — protection activée, prochain malus annulé.`, 'action');
        break;
    }

    player.main.splice(cardIdx, 1);
    player.turnActions = { ...player.turnActions, atoutJoue: true };
    if (state.phase === 'main') {
      player.turnActions.mainActionDone = true;
      state.phase = 'secondary';
    } else {
      player.turnActions.secondaryActionDone = true;
      state.phase = 'resolution';
    }

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
        mainActionDone: true,
        secondaryActionDone: true,
        preuveJouee: true,
        atoutJoue: true,
        projetAvance: true,
      };
      addLog(state, `${state.joueurs[nextPlayer].nom} passe son tour (effet en cours) !`, 'event');
    } else {
      state.phase = 'draw';
      state.joueurs[nextPlayer].turnActions = emptyActions();
      addLog(state, `Tour ${state.tour} — ${state.joueurs[nextPlayer].nom} joue.`, 'system');
    }

    state.winner = checkWinner(state);
    set(state);
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
        foundPlayer.score += foundProjet.valeur;
        addLog(state, `"${review.nom}" — GO ! Projet validé (+${foundProjet.valeur} pts).`, 'score');
      } else if (review.result === 'GO_RESERVES') {
        const pts = Math.max(1, Math.floor(foundProjet.valeur / 2));
        foundProjet.status = 'Terminé';
        foundPlayer.score += pts;
        addLog(state, `"${review.nom}" — GO avec Réserves (+${pts} pts, preuves incomplètes).`, 'score');
      } else {
        foundProjet.status = 'NO GO';
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

  newGame() {
    set(makeInitialState());
  },
}));
