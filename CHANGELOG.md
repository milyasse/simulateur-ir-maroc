# Journal des versions

## 1.3.0 — 24 octobre 2026

- « Vous ne connaissez que votre salaire net ? » : propose le brut (privé, calcul inverse exact) ou le brut et des retenues estimées (fonctionnaire), à corriger avec le bulletin.
- Règles du calcul référencées au Code général des impôts (art. 59, 73, 74).

## 1.2.0 — 24 octobre 2026

- Champs obligatoires et facultatifs signalés dans chaque mode.
- Fonctionnaire : l'IR du bulletin passe en premier et suffit au calcul ; brut et retenues regroupés, facultatifs (net à payer seulement) quand l'IR est renseigné, obligatoires sinon.
- Sans salaire brut, le net à payer n'est plus affiché au lieu d'un montant faux.

## 1.1.0 — 24 octobre 2026

- Compteur anonyme des visites et des simulations (Google Sheets via Apps Script, voir `apps-script/`). Aucun montant n'est envoyé.
- Tableau de bord séparé, non lié depuis l'application et protégé par clé : `/tableau-de-bord/`.

## 1.0.0 — 24 octobre 2026

- Première version : simulation de l'IR mensuel et annuel pour le barème actuel et chaque année de la réforme 2027 → 2031 (PLF 2027, n° 60.26).
- Trois modes : salarié du privé (CNSS, AMO, CIMR), fonctionnaire (retenues du bulletin, RNI retrouvé à partir de l'IR du bulletin), revenu net imposable saisi directement.
- Charges de famille, gain par rapport au barème actuel et à l'année précédente, gain cumulé sur 5 ans.
- Détail du calcul (du brut au revenu imposable, puis tranche par tranche) et barème comparé.
- Lien de partage, mémorisation de la saisie, application installable (PWA), fonctionne hors ligne.
