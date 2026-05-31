export type Criticite = 'S0' | 'S1' | 'S2' | 'S3';
export type TurnPhase = 'draw' | 'main' | 'secondary' | 'resolution' | 'end';
export type AtoutSubtype = 'bonus' | 'malus' | 'bluff' | 'politique' | 'risque' | 'reaction';
export type HiddenTrait = 'hidden_risk' | 'point_bonus' | 'special_event';

export type ProjetCard = {
  id: string;
  type: 'Projet';
  nom: string;
  criticite: Criticite;
  etapes: string[];
  preuvesRequises: string[];
  valeur: number;
  currentStep: number;
  preuvesAttachees: string[];
  status: 'En cours' | 'GO' | 'NO GO' | 'Terminé' | 'Bloqué';
  blockedTurns: number;
  riskLevel: number;
  maxRisk: number;
  hiddenTrait?: HiddenTrait;
  hiddenTraitRevealed?: boolean;
  criticalDecisionMade?: boolean;
  specialEventTriggered?: boolean;
};

export type PreuveCard = {
  id: string;
  type: 'Preuve';
  nom: string;
  icon: string;
};

export type AtoutEffet =
  | 'avance' | 'retirePreuve' | 'noGo' | 'ignoreCondition' | 'bloque' | 'reduceRisk' | 'immunite' | 'doublePioche'
  | 'avance2' | 'avance3' | 'avanceDeux' | 'avanceTous' | 'avanceTousJoueurs' | 'avancePetits' | 'avanceRisque'
  | 'finalise' | 'piocheBonus' | 'annuleEvent' | 'retirage' | 'doubleCarte' | 'annuleMalus' | 'recategorise'
  | 'recule' | 'reculeTous' | 'reculeGrands'
  | 'defausseAtout' | 'sauteTour' | 'echangeAtout'
  | 'goAleatoire' | 'finalisAleatoire' | 'rushSansPreuve';

export type AtoutCard = {
  id: string;
  type: 'Atout';
  subtype: AtoutSubtype;
  nom: string;
  description: string;
  effet: AtoutEffet;
  exemplaires?: number;
  isFaceDown?: boolean;
};

export type EvenementCard = {
  id: string;
  type: 'Événement';
  nom: string;
  description: string;
  effet: 'preuveSup' | 'perdTour' | 'verifProjet' | 'gelBudget' | 'increaseRisk';
  severity: 'low' | 'medium' | 'high';
};

export type ChefProjet = {
  id: string;
  nom: string;
  description: string;
  bonus: string;
};

export type Card = ProjetCard | PreuveCard | AtoutCard | EvenementCard;

export type TurnActions = {
  mainActionDone: boolean;
  secondaryActionDone: boolean;
  preuveJouee: boolean;
  atoutJoue: boolean;
  projetAvance: boolean;
};

export type Player = {
  id: number;
  nom: string;
  score: number;
  main: Card[];
  projets: ProjetCard[];
  chef?: ChefProjet;
  turnActions: TurnActions;
  skippedTurns: number;
  isAI?: boolean;
};

export type ConformityResult = 'GO' | 'NO GO' | 'GO_RESERVES';

export type GameState = {
  joueurs: Player[];
  currentPlayer: number;
  tour: number;
  maxTours: number;
  phase: TurnPhase;
  pileProjet: ProjetCard[];
  pilePreuve: PreuveCard[];
  pileAtout: AtoutCard[];
  pileEvenement: EvenementCard[];
  historique: HistoryEntry[];
  activeEvent: EvenementCard | null;
  winner: string | null;
  animatingEvent: boolean;
  projectDraftOptions: ProjetCard[] | null;
  pendingConformityReview: {
    projetId: string;
    nom: string;
    result: ConformityResult;
  } | null;
  pendingCriticalDecision: {
    projetId: string;
    nom: string;
    playerIndex: number;
  } | null;
};

export type HistoryEntry = {
  tour: number;
  message: string;
  type: 'action' | 'event' | 'system' | 'score';
};
