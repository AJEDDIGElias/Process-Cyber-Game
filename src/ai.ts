import type { GameState, AtoutCard, PreuveCard } from './types';

export type AIAction =
  | { type: 'draw' }
  | { type: 'selectDraft'; projetId: string }
  | { type: 'advanceProject'; projetId: string; asBonus: boolean }
  | { type: 'attachProof'; cardId: string; projetId: string }
  | { type: 'playAtout'; cardId: string; targetProjetId?: string }
  | { type: 'endTurn' }
  | { type: 'idle' };

export function computeAIAction(state: GameState): AIAction {
  if (state.pendingConformityReview) return { type: 'idle' };

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
  if (state.phase !== 'main' && state.phase !== 'secondary') return { type: 'idle' };

  const isBonus = state.phase === 'secondary';

  if (!isBonus && ai.turnActions.mainActionDone) return { type: 'idle' };
  if (isBonus && ai.turnActions.secondaryActionDone) return { type: 'endTurn' };

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

  // ── Atout play ──────────────────────────────────────────────────────────
  if (!ai.turnActions.atoutJoue && atouts.length > 0) {

    // 1. Finalise own best project immediately
    if (myBest) {
      const finalise = atouts.find(a => a.effet === 'finalise');
      if (finalise) return { type: 'playAtout', cardId: finalise.id, targetProjetId: myBest.id };
    }

    // 2. Attack opponent if they're ≥60% through their best project
    if (oppThreat && oppThreat.currentStep / oppThreat.etapes.length >= 0.6) {
      const offensiveEffects = ['noGo', 'bloque', 'sauteTour', 'defausseAtout', 'recule', 'reculeTous'];
      const offAtout = atouts.find(a => offensiveEffects.includes(a.effet));
      if (offAtout) return { type: 'playAtout', cardId: offAtout.id, targetProjetId: oppThreat.id };
    }

    // 3. Reduce risk if a project is in danger (>65%)
    const riskyProj = [...myActive].sort((a, b) => b.riskLevel - a.riskLevel)[0];
    if (riskyProj && riskyProj.riskLevel > 65) {
      const reduceRisk = atouts.find(a => a.effet === 'reduceRisk');
      if (reduceRisk) return { type: 'playAtout', cardId: reduceRisk.id, targetProjetId: riskyProj.id };
    }

    // 4. Advance boost on best project
    if (myBest) {
      const boostEffects = ['avance2', 'avance3', 'avanceTous', 'avanceDeux', 'avance', 'ignoreCondition'];
      const boost = atouts.find(a => boostEffects.includes(a.effet));
      if (boost) return { type: 'playAtout', cardId: boost.id, targetProjetId: myBest.id };
    }

    // 5. Recover a NO GO project
    const noGoProj = ai.projets.find(p => p.status === 'NO GO');
    if (noGoProj) {
      const retirage = atouts.find(a => a.effet === 'retirage');
      if (retirage) return { type: 'playAtout', cardId: retirage.id, targetProjetId: noGoProj.id };
    }
  }

  // ── Attach proof ──────────────────────────────────────────────────────
  if (!ai.turnActions.preuveJouee && preuves.length > 0) {
    for (const proj of myActive) {
      for (const preuve of preuves) {
        if (proj.preuvesRequises.includes(preuve.nom) && !proj.preuvesAttachees.includes(preuve.nom)) {
          return { type: 'attachProof', cardId: preuve.id, projetId: proj.id };
        }
      }
    }
  }

  // ── Advance project ───────────────────────────────────────────────────
  if (!ai.turnActions.projetAvance && myBest) {
    return { type: 'advanceProject', projetId: myBest.id, asBonus: isBonus };
  }

  return { type: 'endTurn' };
}
