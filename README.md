# Simulateur IR Maroc 2027–2031

Version actuelle : **1.3.0** — voir [CHANGELOG.md](CHANGELOG.md).

Application web installable (PWA) qui calcule l'**impôt sur le revenu** et le **salaire net** avec le barème actuel puis pour chaque année de la réforme **2027 → 2031** prévue par le projet de loi de finances 2027 (PLF n° 60.26 du 23 octobre 2026).

**En ligne :** https://milyasse.github.io/simulateur-ir-maroc/

- **Salarié du privé** : à partir du brut mensuel (CNSS 4,48 % plafonnée, AMO 2,26 %, CIMR facultative, frais professionnels).
- **Fonctionnaire** : à partir des retenues du bulletin (CMR, AMO, mutuelles, F.O.S.). Avec l'IR du bulletin, le revenu net imposable est retrouvé exactement, indemnités exonérées comprises.
- **Revenu imposable** : saisie directe du revenu net imposable mensuel.
- Charges de famille (500 DH/an par personne, 6 au plus).
- IR et net par mois ou par an, gain par rapport à aujourd'hui et à l'année précédente, gain cumulé sur 5 ans.
- Détail du calcul tranche par tranche et barème comparé, avec votre tranche mise en évidence.
- Lien de partage, saisie mémorisée sur l'appareil, fonctionne hors ligne. Aucune donnée envoyée.

> Le PLF n'est pas encore voté et peut être amendé. Simulation indicative.

## Barèmes (taux par tranche annuelle de revenu net imposable)

| Tranche (DH/an) | Actuel | 2027 | 2028 | 2029 | 2030 | 2031 |
|---|---|---|---|---|---|---|
| 0 → 40 000 | 0 | 0 | 0 | 0 | 0 | 0 |
| 40 001 → 60 000 | 10 % | 0 | 0 | 0 | 0 | 0 |
| 60 001 → 80 000 | 20 % | 10 % | 10 % | 10 % | 10 % | 10 % |
| 80 001 → 100 000 | 30 % | 20 % | 10 % | 10 % | 10 % | 10 % |
| 100 001 → 130 000 | 34 % | 34 % | 25 % | 10 % | 10 % | 10 % |
| 130 001 → 150 000 | 34 % | 34 % | 25 % | 20 % | 10 % | 10 % |
| 150 001 → 180 000 | 34 % | 34 % | 25 % | 20 % | 20 % | 20 % |
| 180 001 → 200 000 | 37 % | 37 % | 25 % | 20 % | 20 % | 20 % |
| 200 001 → 500 000 | 37 % | 37 % | 37 % | 35 % | 30 % | 20 % |
| > 500 000 | 37 % | 37 % | 37 % | 35 % | 30 % | 30 % |

Les barèmes sont dans [`src/shared/bareme.ts`](src/shared/bareme.ts). Les tests ([`tests/ir.test.ts`](tests/ir.test.ts)) vérifient au centime les 32 lignes du tableau « Gain additionnel à chaque nouvelle année » du PLF.

## Architecture

Site statique (Vite + React + Tailwind), publié sur **GitHub Pages** par GitHub Actions à chaque push sur `main` : tests des calculs, build, déploiement. Pas de serveur, pas de base de données, aucune clé secrète.

```
src/shared/bareme.ts   barèmes, IR tranche par tranche, inversion IR → RNI
src/shared/paie.ts     du brut au revenu imposable, simulation année par année
src/components/        formulaire, synthèse, graphique, tableaux, détail
tests/ir.test.ts       contrôle contre le tableau du PLF et cas réels
```

## Démarrer en local

Prérequis : Node.js ≥ 22.6.

```bash
npm install
npm test          # tests des calculs (sans dépendance)
npm run dev       # http://localhost:5173
npm run build     # dist/
```

## Mise en ligne

Dans le dépôt GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions** (une seule fois). Chaque push sur `main` republie l'application.
