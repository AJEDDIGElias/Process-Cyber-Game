import type { GameState, AtoutCard, PreuveCard } from './types';

export type AIAction =
  | { type: 'draw' }
  | { type: 'selectDraft'; projetId: string }
  | { type: 'advanceProject'; projetId: string }
  | { type: 'attachProof'; cardId: string; projetId: string }
  | { type: 'playAtout'; cardId: string; targetProjetId?: string }
  | { type: 'selectProof'; cardId: string }
  | { type: 'skipProofSelection' }
  | { type: 'endTurn' }
  | { type: 'idle' };

export function computeAIAction(state: GameState): AIAction {
  if (state.pendingConformityReview) return { type: 'idle' };

  // ── Sélection stratégique de preuves ─────────────────────────────────────
  if (state.pendingProofSelection) {
    const sel = state.pendingProofSelection;
    const ai = state.joueurs[state.currentPlayer];
    const myActive = ai.projets.filter(p => p.status === 'En cours');
    // Cherche une preuve nécessaire à un projet actif
    for (const proj of myActive) {
      for (const needed of proj.preuvesRequises) {
        if (!proj.preuvesAttachees.includes(needed)) {
          const match = sel.available.find(c => c.nom === needed);
          if (match) return { type: 'selectProof', cardId: match.id };
        }
      }
    }
    // Sinon, pioche la première disponible si la main n'est pas pleine
    if (sel.available.length > 0 && ai.main.length < 10) {
      return { type: 'selectProof', cardId: sel.available[0].id };
    }
    return { type: 'skipProofSelection' };
  }

  const ai = state.joueurs[state.currentPlayer];
  const opponent = state.joueurs[(state.currentPlayer + 1) % 2];

  // Draft: pick the project with the best value-per-step ratio
  if (state.projectDraftOptions && state.projectDraftOptions.length > 0) {
    const best = [...state.projectDraftOptions].sort(
      (a, b) => b.valeur / b.etapes.length - a.valeur / a.etapes.length
    )[0];
    return { type: 'selectDraft', projetId: best.id };
  }

  if (state.phase === 'draw') return { type: 'draw' };
  if (state.phase === 'resolution' || state.phase === 'end') return { type: 'endTurn' };
  if (state.phase !== 'main') return { type: 'idle' };

  // Chef-aware AP tracking
  const maxAP = (ai.chef?.id === 'c1' && state.tour % 2 === 0) ? 3 : 2;
  const apUsed = (ai.turnActions.projetAvance ? 1 : 0) + ai.turnActions.atoutsJoues;
  const multiAtoutAllowed = ai.chef?.id === 'c3' || (ai.chef?.id === 'c1' && state.tour % 2 === 0);
  const canPlayAtout = apUsed < maxAP && (!ai.turnActions.atoutJoue || multiAtoutAllowed);

  // All AP spent and proof played → end turn
  if (apUsed >= maxAP && ai.turnActions.preuveJouee) {
    return { type: 'endTurn' };
  }

  const atouts = ai.main.filter(c => c.type === 'Atout') as AtoutCard[];
  const preuves = ai.main.filter(c => c.type === 'Preuve') as PreuveCard[];
  const myActive = ai.projets.filter(p => p.status === 'En cours' && p.blockedTurns === 0);
  const oppActive = opponent.projets.filter(p => p.status === 'En cours');

  const oppThreat = oppActive.length > 0
    ? [...oppActive].sort((a, b) =>
        b.currentStep / b.etapes.length - a.currentStep / a.etapes.length)[0]
    : null;

  const myBest = myActive
    .filter(p => p.currentStep < p.etapes.length)
    .sort((a, b) => b.currentStep - a.currentStep)[0] ?? null;

  // ── 1. Atout (1 AP) ──────────────────────────────────────────────────────
  if (canPlayAtout && atouts.length > 0) {

    if (myBest) {
      const finalise = atouts.find(a => a.effet === 'finalise');
      if (finalise) return { type: 'playAtout', cardId: finalise.id, targetProjetId: myBest.id };
    }

    if (oppThreat && oppThreat.currentStep / oppThreat.etapes.length >= 0.6) {
      const offensiveEffects = ['noGo', 'bloque', 'sauteTour', 'defausseAtout', 'recule', 'reculeTous'];
      const offAtout = atouts.find(a => offensiveEffects.includes(a.effet));
      if (offAtout) return { type: 'playAtout', cardId: offAtout.id, targetProjetId: oppThreat.id };
    }

    const riskyProj = [...myActive].sort((a, b) => b.riskLevel - a.riskLevel)[0];
    if (riskyProj && riskyProj.riskLevel > 65) {
      const reduceRisk = atouts.find(a => a.effet === 'reduceRisk');
      if (reduceRisk) return { type: 'playAtout', cardId: reduceRisk.id, targetProjetId: riskyProj.id };
    }

    if (myBest) {
      const boostEffects = ['avance2', 'avance3', 'avanceTous', 'avanceDeux', 'avance', 'ignoreCondition'];
      const boost = atouts.find(a => boostEffects.includes(a.effet));
      if (boost) return { type: 'playAtout', cardId: boost.id, targetProjetId: myBest.id };
    }

    const noGoProj = ai.projets.find(p => p.status === 'NO GO');
    if (noGoProj) {
      const retirage = atouts.find(a => a.effet === 'retirage');
      if (retirage) return { type: 'playAtout', cardId: retirage.id, targetProjetId: noGoProj.id };
    }
  }

  // ── 2. Avancer un projet (1 AP) ───────────────────────────────────────────
  const canAdvance = !ai.turnActions.projetAvance && apUsed < maxAP;
  if (canAdvance && myBest) {
    return { type: 'advanceProject', projetId: myBest.id };
  }

  // ── 3. Attacher une preuve (gratuit) ──────────────────────────────────────
  if (!ai.turnActions.preuveJouee && preuves.length > 0) {
    for (const proj of myActive) {
      for (const preuve of preuves) {
        if (proj.preuvesRequises.includes(preuve.nom) && !proj.preuvesAttachees.includes(preuve.nom)) {
          return { type: 'attachProof', cardId: preuve.id, projetId: proj.id };
        }
      }
    }
  }

  return { type: 'endTurn' };
}
