import type { GameState, AtoutCard, PreuveCard, AIDifficulty } from './types';

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

// Returns the reaction card the AI should play (or null to pass)
export function computeAIReactionDecision(
  difficulty: AIDifficulty,
  attackEffect: string,
  reactionCards: AtoutCard[]
): AtoutCard | null {
  if (reactionCards.length === 0) return null;

  const reactChance: Record<AIDifficulty, number> = {
    easy: 0.10,
    medium: 0.40,
    hard: 0.72,
    expert: 0.92,
  };

  if (Math.random() > reactChance[difficulty]) return null;

  if (difficulty === 'expert' || difficulty === 'hard') {
    // Prefer redirect (annuleMalus) against hard offensive attacks
    const redirect = reactionCards.find(c => c.effet === 'annuleMalus');
    if (redirect && ['noGo', 'bloque', 'bloqueTous', 'sauteTour'].includes(attackEffect)) return redirect;
    const shield = reactionCards.find(c => c.effet === 'immunite');
    if (shield) return shield;
  }

  return reactionCards[0];
}

export function computeAIAction(state: GameState, difficulty: AIDifficulty = 'medium'): AIAction {
  if (state.pendingConformityReview) return { type: 'idle' };

  // ── Sélection stratégique de preuves ─────────────────────────────────────
  if (state.pendingProofSelection) {
    const sel = state.pendingProofSelection;
    const ai = state.joueurs[state.currentPlayer];
    const myActive = ai.projets.filter(p => p.status === 'En cours');
    for (const proj of myActive) {
      for (const needed of proj.preuvesRequises) {
        if (!proj.preuvesAttachees.includes(needed)) {
          const match = sel.available.find(c => c.nom === needed);
          if (match) return { type: 'selectProof', cardId: match.id };
        }
      }
    }
    if (sel.available.length > 0 && ai.main.length < 10) {
      return { type: 'selectProof', cardId: sel.available[0].id };
    }
    return { type: 'skipProofSelection' };
  }

  const ai = state.joueurs[state.currentPlayer];
  const opponent = state.joueurs[(state.currentPlayer + 1) % 2];

  // Draft: pick best value-per-step
  if (state.projectDraftOptions && state.projectDraftOptions.length > 0) {
    if (difficulty === 'easy') {
      // Easy picks randomly
      const idx = Math.floor(Math.random() * state.projectDraftOptions.length);
      return { type: 'selectDraft', projetId: state.projectDraftOptions[idx].id };
    }
    const best = [...state.projectDraftOptions].sort(
      (a, b) => b.valeur / b.etapes.length - a.valeur / a.etapes.length
    )[0];
    return { type: 'selectDraft', projetId: best.id };
  }

  if (state.phase === 'draw') return { type: 'draw' };
  if (state.phase === 'resolution' || state.phase === 'end') return { type: 'endTurn' };
  if (state.phase !== 'main') return { type: 'idle' };

  // Easy: 25% chance to end turn early (simulates poor play)
  if (difficulty === 'easy' && Math.random() < 0.25) return { type: 'endTurn' };

  const maxAP = (ai.chef?.id === 'c1' && state.tour % 2 === 0) ? 3 : 2;
  const apUsed = (ai.turnActions.projetAvance ? 1 : 0) + ai.turnActions.atoutsJoues;
  const multiAtoutAllowed = ai.chef?.id === 'c3' || (ai.chef?.id === 'c1' && state.tour % 2 === 0);
  const canPlayAtout = apUsed < maxAP && (!ai.turnActions.atoutJoue || multiAtoutAllowed);

  if (apUsed >= maxAP && ai.turnActions.preuveJouee) return { type: 'endTurn' };

  const atouts = ai.main.filter(c => c.type === 'Atout') as AtoutCard[];
  const preuves = ai.main.filter(c => c.type === 'Preuve') as PreuveCard[];
  const myActive = ai.projets.filter(p => p.status === 'En cours' && p.blockedTurns === 0);
  const oppActive = opponent.projets.filter(p => p.status === 'En cours');

  // Threat threshold varies by difficulty
  const threatThreshold = difficulty === 'easy' ? 0.88
    : difficulty === 'medium' ? 0.60
    : difficulty === 'hard' ? 0.50
    : 0.38; // expert

  const oppThreat = oppActive.length > 0
    ? [...oppActive].sort((a, b) =>
        b.currentStep / b.etapes.length - a.currentStep / a.etapes.length)[0]
    : null;

  const myBest = myActive
    .filter(p => p.currentStep < p.etapes.length)
    .sort((a, b) => b.currentStep - a.currentStep)[0] ?? null;

  // ── 1. Atout (1 AP) ──────────────────────────────────────────────────────
  if (canPlayAtout && atouts.length > 0) {

    // Expert/Hard: finalise is top priority
    if ((difficulty === 'expert' || difficulty === 'hard') && myBest) {
      const finalise = atouts.find(a => a.effet === 'finalise');
      if (finalise) return { type: 'playAtout', cardId: finalise.id, targetProjetId: myBest.id };
    }

    // Medium/Easy: finalise only when close
    if ((difficulty === 'medium') && myBest && myBest.currentStep >= myBest.etapes.length - 1) {
      const finalise = atouts.find(a => a.effet === 'finalise');
      if (finalise) return { type: 'playAtout', cardId: finalise.id, targetProjetId: myBest.id };
    }

    // Offense: attack threatening opponent project
    if (oppThreat && oppThreat.currentStep / oppThreat.etapes.length >= threatThreshold) {
      const offensiveEffects = ['noGo', 'bloque', 'sauteTour', 'defausseAtout', 'recule', 'reculeTous'];
      const offAtout = atouts.find(a => offensiveEffects.includes(a.effet));
      if (offAtout) return { type: 'playAtout', cardId: offAtout.id, targetProjetId: oppThreat.id };
    }

    // Risk management: Easy ignores risk, others manage it
    if (difficulty !== 'easy') {
      const riskThreshold = difficulty === 'expert' ? 55 : difficulty === 'hard' ? 60 : 65;
      const riskyProj = [...myActive].sort((a, b) => b.riskLevel - a.riskLevel)[0];
      if (riskyProj && riskyProj.riskLevel > riskThreshold) {
        const reduceRisk = atouts.find(a => a.effet === 'reduceRisk');
        if (reduceRisk) return { type: 'playAtout', cardId: reduceRisk.id, targetProjetId: riskyProj.id };
      }
    }

    // Boost own project (easy skips risky atouts)
    if (myBest) {
      const safeBoosts = ['avance2', 'avance3', 'avanceTous', 'avanceDeux', 'avance', 'ignoreCondition'];
      const riskyBoosts = ['avanceRisque', 'rushSansPreuve'];
      const boostPool = difficulty === 'easy' ? safeBoosts : [...safeBoosts, ...riskyBoosts];
      const boost = atouts.find(a => boostPool.includes(a.effet));
      if (boost) return { type: 'playAtout', cardId: boost.id, targetProjetId: myBest.id };
    }

    // Rescue NO GO project
    const noGoProj = ai.projets.find(p => p.status === 'NO GO');
    if (noGoProj) {
      const retirage = atouts.find(a => a.effet === 'retirage');
      if (retirage) return { type: 'playAtout', cardId: retirage.id, targetProjetId: noGoProj.id };
    }

    // Expert only: preemptive shield
    if (difficulty === 'expert') {
      const shield = atouts.find(a => a.effet === 'immunite' || a.effet === 'annuleMalus');
      if (shield && oppActive.length > 0) return { type: 'playAtout', cardId: shield.id };
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
