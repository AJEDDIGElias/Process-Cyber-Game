# 🛡️ Process Cyber — Règles du Jeu

### Guide complet v1.0

---

## 📌 Présentation

**Process Cyber** est un jeu de gestion de projets à thème cybersécurité opposant deux joueurs (ou un joueur contre une IA).

Chaque joueur incarne un chef de projet chargé de :

- faire avancer des projets de sécurité
- gérer les risques
- jouer des cartes stratégiques (atouts)
- respecter des contraintes de conformité

Les projets vont de **S0 (simples audits)** à **S3 (infrastructures critiques)**.  
Chaque projet doit être mené avec prudence : risque, preuves et timing sont essentiels.

---

## 🎯 Objectifs — Conditions de victoire

La partie se termine dès qu'une condition est remplie :

- 🏆 **Score** : atteindre 10 points ou plus
- 🔥 **Domination** : terminer 3 projets S3
- 📦 **Fin de pile** : plus de projets disponibles et projets terminés/NO GO
- ⏳ **Tours max** : après 20 tours, le joueur avec le plus de points gagne

➡️ En cas d’égalité, la partie continue jusqu’à départage.

---

## 🧱 Mise en place

Avant la partie :

- Chaque joueur choisit 1 projet parmi 3 cartes proposées (draft initial)
- Piles disponibles :
  - 📁 Projets
  - 📁 Preuves
  - 📁 Atouts
  - 📁 Événements (tous les 4 tours)

❗ Aucune main de départ n’est donnée.

---

## 🔁 Structure d’un tour

Chaque tour comporte 4 phases :

---

### 🟦 Phase 1 — Pioche (Draw)

Le joueur :

- Pioche 1 Atout (si main < 5)
- Pioche 1 Preuve (si main < 5)

S’il n’a aucun projet actif :

- choix obligatoire entre 3 projets (draft)

---

### 🟨 Phase 2 — Action principale

Le joueur effectue **UNE action principale** :

- Avancer un projet (1 étape)
- Jouer une Preuve
- Jouer un Atout

📌 Limites :

- 1 preuve jouée par tour
- 1 atout joué par tour

---

### 🟧 Phase 3 — Action bonus (optionnelle)

Une action supplémentaire possible :

- Avancer un projet
- Jouer une carte

Ou passer.

---

### 🟥 Phase 4 — Résolution

- Application des effets en cours
- Décrément des blocages
- Déclenchement événement mondial (tous les 4 tours)

---

## 📁 Cartes Projet

Un projet représente une mission cybersécurité.

### Attributs :

- Criticité : S0 → S3
- Étapes : progression métier
- Valeur : points de victoire
- Risque : 0–100%
- Seuil max : limite de sécurité
- Preuves requises

### Statuts :

- En cours
- Bloqué
- NO GO ❌
- GO ✔
- GO avec réserves ⚠️
- Terminé 🏁

📌 Limite : 3 projets actifs max

---

## 🚀 Avancement d’un projet

- +1 étape par action
- +8 risque par avancée

⚠️ Si le risque dépasse le seuil → NO GO immédiat

📌 Fin de projet :
→ déclenche une revue de conformité

---

## 📄 Cartes Preuve

Représentent la conformité :

- Audit
- Architecture
- Tests
- PIA
- Certifications

### Effets :

- -10 risque
- attachée à un projet
- 1 preuve max par projet

📌 Toutes les preuves requises = GO complet

---

## 🧾 Revue de conformité

Déclenchée à la fin d’un projet.

| Condition                      | Résultat                      |
| ------------------------------ | ----------------------------- |
| Risque ≥ seuil                 | ❌ NO GO                      |
| Risque OK + preuves complètes  | ✔ GO (plein score)            |
| Risque OK + preuves manquantes | ⚠ GO avec réserves (½ points) |

⛔ Bloque les joueurs pendant la résolution

---

## 🎴 Cartes Atout

Cartes à effet unique (1 par tour max).

---

### ⚔️ Offensifs

- noGo : annule un projet
- bloque : bloque 2 tours
- sauteTour : fait perdre un tour
- defausseAtout : retire une carte adverse
- recule : recule un projet
- retirePreuve : supprime une preuve adverse

---

### 🛡️ Défensifs / soutien

- avance / avance2 / avance3
- reduceRisk (-30)
- immunite
- annuleEvent
- doublePioche
- piocheBonus
- finalise (rush projet)
- recategorise (S2 → S1)

---

### 🎲 Aléatoires

- goAleatoire (50/50)
- finalisAleatoire (30/70)
- rushSansPreuve

---

## 🌍 Événements mondiaux

Tous les 4 tours :

- increaseRisk
- preuveSup
- perdTour
- verifProjet
- gelBudget

📌 Peuvent impacter tous les joueurs

---

## ⚠️ Système de risque

- Avancement : +8
- Preuve : -10
- reduceRisk : -30
- événements : +10 à +20

### Seuils :

- S0 : 90%
- S1 : 80%
- S2 : 70%
- S3 : 60%

❌ Dépassement = NO GO

---

## 🤖 Intelligence Artificielle

L’IA joue automatiquement selon ces priorités :

1. Finaliser projet
2. Attaquer projet avancé adverse
3. Réduire risque élevé
4. Booster projet principal
5. Relancer NO GO
6. Poser preuves
7. Avancer projet
8. Passer

---

## 🧠 Mécaniques avancées

### 🔒 Blocage

- empêche l’avancement pendant 2 tours

### ⏭️ Saute-tour

- adversaire perd un tour

### 🔄 Échange d’atout

- échange aléatoire entre joueurs

### 🔧 Recategorisation

- S2 → S1 (plus facile mais moins rentable)

### 🧾 Retrait de preuve

- augmente le risque adverse

---

## 🖱️ Interface

- Drag & drop des cartes
- Surbrillance des cibles
- Plateau type Hearthstone :
  - joueur en bas
  - adversaire en haut
  - projets au centre

---

## 📜 Journal d’actions

Types :

- action (cyan)
- event (rouge)
- system (gris)
- score (vert)

---

## 🎮 Contrôles

- clic projet : sélection
- drag card → projet : jouer carte
- bouton "Fin de tour"
- bouton "Piocher"
- bouton "Règles"

---

## 🧩 Conseils

- gérez le risque avant tout
- ne rush pas les S3 sans preuves
- anticipez les événements
- bloquez les projets adverses avancés

---

## 🏁 Bonne partie — Joueur 1
