# Compteur de visites et de simulations (Google Sheets)

L'application envoie seulement deux types d'événements, sans aucun montant :
`visite` (une par session de navigation) et `simulation` (une par calcul distinct),
avec un identifiant aléatoire du navigateur pour compter les visiteurs uniques.
Chaque événement devient une ligne de l'onglet **Journal** de la feuille.

## Installation (une seule fois)

1. Créez une feuille Google Sheets (par exemple « Simulateur IR — statistiques »).
2. Menu **Extensions → Apps Script**. Remplacez le contenu de `Code.gs` par [`Code.gs`](Code.gs).
3. Remplacez `REMPLACER_PAR_VOTRE_CLE` par une clé secrète, puis enregistrez.
4. **Déployer → Nouveau déploiement** → type **Application Web** :
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
   Autorisez l'accès demandé (votre propre feuille).
5. Copiez l'**URL de l'application Web** (`https://script.google.com/macros/s/…/exec`) et collez-la dans
   `src/config.ts` et dans `public/tableau-de-bord/index.html` (constante `STATS_URL`).

## Tableau de bord

Page séparée, non liée depuis l'application et non indexée :
`https://milyasse.github.io/simulateur-ir-maroc/tableau-de-bord/#cle=<votre clé>`

La clé est mémorisée sur l'appareil puis retirée de la barre d'adresse. Sans la clé, le script ne renvoie aucune statistique.

Après une modification de `Code.gs`, refaites **Déployer → Gérer les déploiements → Modifier → Nouvelle version** (l'URL ne change pas).
