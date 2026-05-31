import type { ProjetCard, PreuveCard, AtoutCard, EvenementCard, ChefProjet } from './types';

export const projetDeck: ProjetCard[] = [
  {
    id: 'p1', type: 'Projet', nom: 'Migration Office 365',
    criticite: 'S2',
    etapes: ['Expression du besoin', 'Analyse de risque', 'Architecture', 'Tests', 'Validation'],
    preuvesRequises: ['Matrice de flux', 'Durcissement', 'Remontée des logs'],
    valeur: 3, currentStep: 0, preuvesAttachees: [],
    status: 'En cours', blockedTurns: 0, riskLevel: 20, maxRisk: 80,
  },
  {
    id: 'p2', type: 'Projet', nom: 'Déploiement VPN',
    criticite: 'S1',
    etapes: ['Expression du besoin', 'Analyse simplifiée', 'Validation'],
    preuvesRequises: ['PACS OK', 'Durcissement'],
    valeur: 2, currentStep: 0, preuvesAttachees: [],
    status: 'En cours', blockedTurns: 0, riskLevel: 15, maxRisk: 70,
  },
  {
    id: 'p3', type: 'Projet', nom: 'Refonte SI Interne',
    criticite: 'S3',
    etapes: ['Expression du besoin', 'Analyse de risque', 'Architecture', 'Homologation', 'Tests sécurité', 'Validation RSSI'],
    preuvesRequises: ['Matrice de flux', 'DAG OK', 'Remontée des logs', 'Validation RSSI'],
    valeur: 6, currentStep: 0, preuvesAttachees: [],
    status: 'En cours', blockedTurns: 0, riskLevel: 40, maxRisk: 70,
  },
  {
    id: 'p4', type: 'Projet', nom: 'Modernisation Passerelle',
    criticite: 'S0',
    etapes: ['Expression du besoin', 'Validation'],
    preuvesRequises: ['DIT OK'],
    valeur: 1, currentStep: 0, preuvesAttachees: [],
    status: 'En cours', blockedTurns: 0, riskLevel: 5, maxRisk: 90,
  },
  {
    id: 'p5', type: 'Projet', nom: 'Zero Trust Network',
    criticite: 'S3',
    etapes: ['Audit initial', 'Design architecture', 'Pilote', 'Déploiement', 'Validation RSSI', 'Homologation'],
    preuvesRequises: ['Architecture validée', 'Tests sécurité', 'Validation RSSI', 'Remontée des logs'],
    valeur: 7, currentStep: 0, preuvesAttachees: [],
    status: 'En cours', blockedTurns: 0, riskLevel: 50, maxRisk: 65,
  },
  {
    id: 'p6', type: 'Projet', nom: 'SIEM Integration',
    criticite: 'S2',
    etapes: ['Expression du besoin', 'Spécifications', 'Intégration', 'Tests', 'Go-Live'],
    preuvesRequises: ['Remontée des logs', 'Architecture validée', 'Tests sécurité'],
    valeur: 4, currentStep: 0, preuvesAttachees: [],
    status: 'En cours', blockedTurns: 0, riskLevel: 25, maxRisk: 75,
  },
  {
    id: 'p7', type: 'Projet', nom: 'Mise à jour Pare-feu',
    criticite: 'S1',
    etapes: ['Analyse', 'Planification', 'Déploiement'],
    preuvesRequises: ['Matrice de flux', 'Durcissement'],
    valeur: 2, currentStep: 0, preuvesAttachees: [],
    status: 'En cours', blockedTurns: 0, riskLevel: 10, maxRisk: 80,
  },
  {
    id: 'p8', type: 'Projet', nom: 'Conformité ISO 27001',
    criticite: 'S3',
    etapes: ['Gap analysis', 'Plan de traitement', 'Implémentation', 'Audit interne', 'Audit externe', 'Certification'],
    preuvesRequises: ['Documentation', 'Tests sécurité', 'Validation RSSI', 'Architecture validée'],
    valeur: 8, currentStep: 0, preuvesAttachees: [],
    status: 'En cours', blockedTurns: 0, riskLevel: 30, maxRisk: 60,
  },
];

export const preuveDeck: PreuveCard[] = [
  { id: 'v1', type: 'Preuve', nom: 'Matrice de flux', icon: '🔀' },
  { id: 'v2', type: 'Preuve', nom: 'DAG OK', icon: '📊' },
  { id: 'v3', type: 'Preuve', nom: 'DIT OK', icon: '✅' },
  { id: 'v4', type: 'Preuve', nom: 'PACS OK', icon: '🔐' },
  { id: 'v5', type: 'Preuve', nom: 'Durcissement', icon: '🛡️' },
  { id: 'v6', type: 'Preuve', nom: 'Remontée des logs', icon: '📋' },
  { id: 'v7', type: 'Preuve', nom: 'Architecture validée', icon: '🏗️' },
  { id: 'v8', type: 'Preuve', nom: 'Tests sécurité', icon: '🧪' },
  { id: 'v9', type: 'Preuve', nom: 'Documentation', icon: '📄' },
  { id: 'v10', type: 'Preuve', nom: 'Validation RSSI', icon: '👁️' },
];

export const atoutDeck: AtoutCard[] = [
  // ─── Anciens atouts (3 exemplaires chacun par défaut) ───────────────────────
  { id: 'a1', type: 'Atout', subtype: 'bonus',    nom: 'Expert Sécurité',     description: "Ignore une condition de progression sur votre projet.", effet: 'ignoreCondition' },
  { id: 'a2', type: 'Atout', subtype: 'bonus',    nom: 'Double Pioche',       description: 'Pioche 2 cartes Preuve supplémentaires.',               effet: 'doublePioche' },
  { id: 'a3', type: 'Atout', subtype: 'bonus',    nom: 'Bouclier RSSI',       description: "Immunise un projet contre les atouts adverses ce tour.", effet: 'immunite' },
  { id: 'a4', type: 'Atout', subtype: 'malus',    nom: 'Audit Surprise',      description: "Retire une preuve d'un projet adverse.",                 effet: 'retirePreuve' },
  { id: 'a5', type: 'Atout', subtype: 'malus',    nom: 'Dette Technique',     description: 'Bloque un projet adverse pendant 2 tours.',              effet: 'bloque' },
  { id: 'a6', type: 'Atout', subtype: 'politique', nom: 'Plan de Continuité', description: 'Réduit le niveau de risque de 30 points sur un projet.', effet: 'reduceRisk' },
  { id: 'a7', type: 'Atout', subtype: 'politique', nom: 'Directive ANSSI',    description: 'Ignore une condition de progression sur un projet.',      effet: 'ignoreCondition' },

  // ─── BONUS (1 exemplaire chacun) ────────────────────────────────────────────
  { id: 'b1',  type: 'Atout', subtype: 'bonus', exemplaires: 1, nom: 'Escalade RSSI',            description: 'Avancez de 2 étapes sur un projet.',                                      effet: 'avance2' },
  { id: 'b2',  type: 'Atout', subtype: 'bonus', exemplaires: 1, nom: 'Support exceptionnel',     description: 'Avancez 1 étape sur deux projets différents.',                             effet: 'avanceDeux' },
  { id: 'b3',  type: 'Atout', subtype: 'bonus', exemplaires: 1, nom: 'Renfort temporaire',       description: 'Piochez 1 carte preuve ou atout supplémentaire.',                          effet: 'piocheBonus' },
  { id: 'b4',  type: 'Atout', subtype: 'bonus', exemplaires: 1, nom: 'Priorité COMEX',           description: 'Immunisez un projet pendant 1 tour.',                                      effet: 'immunite' },
  { id: 'b5',  type: 'Atout', subtype: 'bonus', exemplaires: 1, nom: 'Process Cyber ignoré',     description: 'Avancez directement à la dernière étape du projet.',                       effet: 'finalise' },
  { id: 'b6',  type: 'Atout', subtype: 'bonus', exemplaires: 1, nom: 'Recette validée en avance',description: 'Avancez deux étapes d\'un coup.',                                         effet: 'avance2' },
  { id: 'b7',  type: 'Atout', subtype: 'bonus', exemplaires: 1, nom: 'Ingé SSI expérimenté',     description: 'Tous vos projets actifs avancent d\'une étape.',                           effet: 'avanceTous' },
  { id: 'b8',  type: 'Atout', subtype: 'bonus', exemplaires: 1, nom: 'Journée sans réunion',     description: 'Jouez deux cartes ce tour.',                                               effet: 'doubleCarte' },
  { id: 'b9',  type: 'Atout', subtype: 'bonus', exemplaires: 1, nom: 'Planning tenu',            description: 'Annulez l\'événement global en cours.',                                    effet: 'annuleEvent' },
  { id: 'b10', type: 'Atout', subtype: 'bonus', exemplaires: 1, nom: 'Validation surprise',      description: 'Finalisez immédiatement toutes les étapes d\'un projet.',                  effet: 'finalise' },
  { id: 'b11', type: 'Atout', subtype: 'bonus', exemplaires: 1, nom: 'Feu vert express',         description: 'Passez la Revue de conformité sans vérification GO/NO GO.',               effet: 'finalise' },
  { id: 'b12', type: 'Atout', subtype: 'bonus', exemplaires: 1, nom: 'François pète des genoux', description: 'Immunise un projet contre tous les malus ce tour.',                        effet: 'immunite' },
  { id: 'b13', type: 'Atout', subtype: 'bonus', exemplaires: 1, nom: "Soutien de l'architecte SSI", description: 'Ignorez une revue intermédiaire (avance sans condition).',              effet: 'ignoreCondition' },
  { id: 'b14', type: 'Atout', subtype: 'bonus', exemplaires: 1, nom: 'Conformité hors séance',   description: 'Permet de relancer un projet en NO GO.',                                   effet: 'retirage' },
  { id: 'b15', type: 'Atout', subtype: 'bonus', exemplaires: 1, nom: 'Bonne humeur générale',    description: 'Tous les joueurs avancent leur projet principal d\'une étape.',             effet: 'avanceTousJoueurs' },

  // ─── MALUS (1 exemplaire chacun) ────────────────────────────────────────────
  { id: 'm1',  type: 'Atout', subtype: 'malus', exemplaires: 1, nom: 'Réunion interminable',    description: 'Empêche un adversaire de faire avancer un projet ce tour.',                 effet: 'bloque' },
  { id: 'm2',  type: 'Atout', subtype: 'malus', exemplaires: 1, nom: 'Modification de périmètre',description: "Un projet adverse recule d'une étape.",                                    effet: 'recule' },
  { id: 'm3',  type: 'Atout', subtype: 'malus', exemplaires: 1, nom: 'Licence CISCAT KO',       description: 'Bloque la progression adverse ce tour.',                                    effet: 'bloque' },
  { id: 'm4',  type: 'Atout', subtype: 'malus', exemplaires: 1, nom: 'NO GO Jean-François',     description: 'Force un NO GO sur un projet adverse.',                                     effet: 'noGo' },
  { id: 'm5',  type: 'Atout', subtype: 'malus', exemplaires: 1, nom: "Bug sur la prod'",         description: "Un adversaire perd une étape sur son projet le plus avancé.",               effet: 'recule' },
  { id: 'm6',  type: 'Atout', subtype: 'malus', exemplaires: 1, nom: 'Retard fournisseur',      description: 'Bloque tous les avancements adverses ce tour.',                             effet: 'bloque' },
  { id: 'm7',  type: 'Atout', subtype: 'malus', exemplaires: 1, nom: 'Ragequit de CdP',         description: "Un projet adverse recule d'une étape.",                                     effet: 'recule' },
  { id: 'm8',  type: 'Atout', subtype: 'malus', exemplaires: 1, nom: 'Coupure réseau',          description: "L'adversaire ciblé ne peut pas piocher son prochain tour.",                 effet: 'sauteTour' },
  { id: 'm9',  type: 'Atout', subtype: 'malus', exemplaires: 1, nom: 'Problème Tixeo',          description: 'Un adversaire se défausse d\'une carte atout.',                             effet: 'defausseAtout' },
  { id: 'm10', type: 'Atout', subtype: 'malus', exemplaires: 1, nom: "Plus d'appel de charges", description: 'Impossible de finaliser un projet ce tour (bloque le projet le plus avancé).', effet: 'bloque' },
  { id: 'm11', type: 'Atout', subtype: 'malus', exemplaires: 1, nom: 'Ticket Jira perdu',       description: 'Recule automatiquement la dernière étape franchie.',                        effet: 'recule' },
  { id: 'm12', type: 'Atout', subtype: 'malus', exemplaires: 1, nom: 'ARGO Compliance',         description: "Tous les joueurs reculent d'une étape sur leur meilleur projet.",            effet: 'reculeTous' },
  { id: 'm13', type: 'Atout', subtype: 'malus', exemplaires: 1, nom: 'Décision en attente',     description: "L'adversaire ciblé passe son prochain tour.",                               effet: 'sauteTour' },
  { id: 'm14', type: 'Atout', subtype: 'malus', exemplaires: 1, nom: 'Procédure floue',         description: "Un projet adverse recule d'une étape au hasard.",                           effet: 'recule' },
  { id: 'm15', type: 'Atout', subtype: 'malus', exemplaires: 1, nom: 'Retard volontaire',       description: "Un adversaire ne peut pas avancer ce tour.",                                effet: 'bloque' },

  // ─── BLUFF (1 exemplaire chacun) ────────────────────────────────────────────
  { id: 'bl1',  type: 'Atout', subtype: 'bluff', exemplaires: 1, nom: 'Ticket Jira fantôme',       description: 'Bloque un projet adverse (activation surprise).',              effet: 'bloque' },
  { id: 'bl2',  type: 'Atout', subtype: 'bluff', exemplaires: 1, nom: 'Phase pilote non documentée',description: "Retire une preuve d'un projet adverse.",                        effet: 'retirePreuve' },
  { id: 'bl3',  type: 'Atout', subtype: 'bluff', exemplaires: 1, nom: 'Cadeau du RSSI ?',           description: 'Annule le prochain malus joué contre vous.',                   effet: 'annuleMalus' },
  { id: 'bl4',  type: 'Atout', subtype: 'bluff', exemplaires: 1, nom: 'Fausse relance',             description: "Un adversaire se défausse d'une carte atout.",                  effet: 'defausseAtout' },
  { id: 'bl5',  type: 'Atout', subtype: 'bluff', exemplaires: 1, nom: "T'as pensé à …",             description: 'Pioche 2 preuves supplémentaires en bluffant l\'adversaire.',   effet: 'doublePioche' },
  { id: 'bl6',  type: 'Atout', subtype: 'bluff', exemplaires: 1, nom: 'Chef de projet fantôme',     description: "Bloque un projet adverse ce tour.",                             effet: 'bloque' },
  { id: 'bl7',  type: 'Atout', subtype: 'bluff', exemplaires: 1, nom: 'Tension inter-équipes',      description: "Bloque tous les projets adverses ce tour.",                    effet: 'bloque' },
  { id: 'bl8',  type: 'Atout', subtype: 'bluff', exemplaires: 1, nom: 'Fausse rumeur de GO',        description: 'Tente un GO forcé sur un projet adverse (50/50).',             effet: 'goAleatoire' },
  { id: 'bl9',  type: 'Atout', subtype: 'bluff', exemplaires: 1, nom: 'Erreur de périmètre',        description: "Un projet adverse recule d'une étape.",                        effet: 'recule' },
  { id: 'bl10', type: 'Atout', subtype: 'bluff', exemplaires: 1, nom: 'Documentation vide',         description: "Un projet adverse recule d'une étape.",                        effet: 'recule' },

  // ─── POLITIQUE (1 exemplaire chacun) ────────────────────────────────────────
  { id: 'po1',  type: 'Atout', subtype: 'politique', exemplaires: 1, nom: 'Escalade N+2',           description: 'Annule le prochain atout négatif joué contre vous.',           effet: 'annuleMalus' },
  { id: 'po2',  type: 'Atout', subtype: 'politique', exemplaires: 1, nom: 'Échange SameTime',       description: 'Échangez une carte atout aléatoire avec l\'adversaire.',        effet: 'echangeAtout' },
  { id: 'po3',  type: 'Atout', subtype: 'politique', exemplaires: 1, nom: 'Accord politique',       description: 'Protège contre tout malus ce tour.',                            effet: 'annuleMalus' },
  { id: 'po4',  type: 'Atout', subtype: 'politique', exemplaires: 1, nom: 'Catégorisation express', description: 'Tous les projets S0/S1 avancent d\'une étape.',                 effet: 'avancePetits' },
  { id: 'po5',  type: 'Atout', subtype: 'politique', exemplaires: 1, nom: "Changement d'objectif",  description: "Tous les projets S3 reculent d'une étape.",                    effet: 'reculeGrands' },
  { id: 'po6',  type: 'Atout', subtype: 'politique', exemplaires: 1, nom: 'Recette du bled',        description: "Un adversaire ne peut pas jouer d'atout son prochain tour.",   effet: 'bloque' },
  { id: 'po7',  type: 'Atout', subtype: 'politique', exemplaires: 1, nom: 'Pause café',             description: 'Pioche 2 preuves supplémentaires.',                            effet: 'doublePioche' },
  { id: 'po8',  type: 'Atout', subtype: 'politique', exemplaires: 1, nom: 'Validation exceptionnelle',description: 'Finalisez immédiatement toutes les étapes d\'un projet.',   effet: 'finalise' },
  { id: 'po9',  type: 'Atout', subtype: 'politique', exemplaires: 1, nom: 'Copie Erwan Copie Caroline',description: 'Annule un malus affectant un de vos projets.',             effet: 'annuleMalus' },
  { id: 'po10', type: 'Atout', subtype: 'politique', exemplaires: 1, nom: 'Réserve PACS',           description: 'Jouez 2 cartes d\'un coup ce tour.',                           effet: 'doubleCarte' },

  // ─── RISQUE (1 exemplaire chacun) ───────────────────────────────────────────
  { id: 'ri1', type: 'Atout', subtype: 'risque', exemplaires: 1, nom: 'Tentative GO anticipé',   description: 'Tentez le GO immédiatement (50% succès, 50% NO GO).',           effet: 'goAleatoire' },
  { id: 'ri2', type: 'Atout', subtype: 'risque', exemplaires: 1, nom: 'Forçage de jalon',        description: 'Avancez de 2 étapes avec un risque accru (+25).',               effet: 'avanceRisque' },
  { id: 'ri3', type: 'Atout', subtype: 'risque', exemplaires: 1, nom: 'Confiance SSI',           description: 'Avancez de 2 étapes mais le risque augmente fortement.',        effet: 'avanceRisque' },
  { id: 'ri4', type: 'Atout', subtype: 'risque', exemplaires: 1, nom: 'Livraison avant recette', description: 'Finalisez immédiatement (30% GO / 70% NO GO).',                 effet: 'finalisAleatoire' },
  { id: 'ri5', type: 'Atout', subtype: 'risque', exemplaires: 1, nom: 'Recatégorisation',        description: 'Transformez un projet S2 en S1 (seuil de risque augmenté).',    effet: 'recategorise' },
  { id: 'ri6', type: 'Atout', subtype: 'risque', exemplaires: 1, nom: 'Choix PMO',               description: 'Avancez de 2 étapes sur un projet au choix.',                   effet: 'avance2' },
  { id: 'ri7', type: 'Atout', subtype: 'risque', exemplaires: 1, nom: 'Raccourci dangereux',     description: 'Avancez de 2 étapes avec risque accru (+20).',                   effet: 'avanceRisque' },
  { id: 'ri8', type: 'Atout', subtype: 'risque', exemplaires: 1, nom: 'Compression des délais',  description: 'Un projet avance de 3 étapes mais le risque augmente de 20.',   effet: 'rushSansPreuve' },

  // ─── RÉACTION (1 exemplaire chacun) ─────────────────────────────────────────
  { id: 're1', type: 'Atout', subtype: 'reaction', exemplaires: 1, nom: 'Management par IA',         description: 'Renvoie un atout adverse à son expéditeur (annule le dernier malus).', effet: 'annuleMalus' },
  { id: 're2', type: 'Atout', subtype: 'reaction', exemplaires: 1, nom: 'Major sur le dos',          description: 'Si ciblé 2 fois ce tour, annule un effet négatif.',                    effet: 'annuleMalus' },
  { id: 're3', type: 'Atout', subtype: 'reaction', exemplaires: 1, nom: 'Présentation du process',   description: "L'adversaire subit sa propre carte (annule un malus).",                 effet: 'annuleMalus' },
  { id: 're4', type: 'Atout', subtype: 'reaction', exemplaires: 1, nom: 'Manuf haute tension',       description: 'Jouez une carte gratuite si vous subissez un malus.',                   effet: 'piocheBonus' },
  { id: 're5', type: 'Atout', subtype: 'reaction', exemplaires: 1, nom: 'Erwan continue de marcher', description: 'Annule l\'effet d\'une carte bluff ou risque adverse.',                  effet: 'annuleMalus' },
  { id: 're6', type: 'Atout', subtype: 'reaction', exemplaires: 1, nom: 'Réserve porté par le RUN',  description: 'Avancez quand un malus tente de vous bloquer.',                         effet: 'annuleMalus' },
  { id: 're7', type: 'Atout', subtype: 'reaction', exemplaires: 1, nom: "Bandits de l'International",description: 'Annule l\'effet d\'un événement global.',                               effet: 'annuleEvent' },
];

export const evenementDeck: EvenementCard[] = [
  { id: 'e1', type: 'Événement', nom: 'Incident Sécurité Majeur',  description: 'Tous les projets S2/S3 gagnent +20 de risque.', effet: 'increaseRisk', severity: 'high' },
  { id: 'e2', type: 'Événement', nom: 'Audit ANSSI Surprise',      description: 'Tous les projets S2/S3 nécessitent une preuve supplémentaire.', effet: 'preuveSup', severity: 'high' },
  { id: 'e3', type: 'Événement', nom: 'Crise Infrastructure',      description: 'Le joueur actif perd son action secondaire ce tour.', effet: 'perdTour', severity: 'medium' },
  { id: 'e4', type: 'Événement', nom: 'Gel Budgétaire',            description: 'Impossible de démarrer un nouveau projet pendant 2 tours.', effet: 'gelBudget', severity: 'medium' },
  { id: 'e5', type: 'Événement', nom: 'Fuite de Données',          description: 'Tous les projets gagnent +15 de risque.', effet: 'increaseRisk', severity: 'high' },
  { id: 'e6', type: 'Événement', nom: 'Audit Interne',             description: 'Chaque joueur doit vérifier ses preuves (risque -10 si OK).', effet: 'verifProjet', severity: 'low' },
];

export const chefsDeProjets: ChefProjet[] = [
  { id: 'c1', nom: 'Chef Agile',  description: '+1 action bonus par tour', bonus: 'flexAction' },
  { id: 'c2', nom: 'Chef Strict', description: 'Bonus conformité +2 pts',  bonus: 'conformiteBonus' },
  { id: 'c3', nom: 'Chef Chaos',  description: 'Peut jouer 2 atouts / tour', bonus: 'doubleAtout' },
];

export function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export function cloneProjet(p: ProjetCard): ProjetCard {
  return { ...p, currentStep: 0, preuvesAttachees: [], status: 'En cours', blockedTurns: 0, riskLevel: p.riskLevel };
}

export function buildPreuvePile(): PreuveCard[] {
  return shuffle(
    Array.from({ length: 3 }, () => preuveDeck).flat().map((c, i) => ({ ...c, id: `${c.id}-${i}` }))
  );
}

export function buildAtoutPile(): AtoutCard[] {
  return shuffle(
    atoutDeck.flatMap((c, i) => {
      const copies = c.exemplaires ?? 3;
      return Array.from({ length: copies }, (_, j) => ({ ...c, id: `${c.id}-${i}-${j}` }));
    })
  );
}
