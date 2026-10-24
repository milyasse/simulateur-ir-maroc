// Barèmes annuels de l'impôt sur le revenu (IR) au Maroc : barème en vigueur
// et trajectoire 2027 → 2031 du projet de loi de finances (PLF 2027, n° 60.26).
// Chaque tranche : [plafond annuel en DH (Infinity pour la dernière), taux].
// Le revenu est taxé tranche par tranche (chaque partie au taux de sa ligne).

export type Annee = 'actuel' | 2027 | 2028 | 2029 | 2030 | 2031;

export interface Tranche {
  plafond: number;
  taux: number;
}

export const ANNEES: Annee[] = ['actuel', 2027, 2028, 2029, 2030, 2031];
export const ANNEES_REFORME: Exclude<Annee, 'actuel'>[] = [2027, 2028, 2029, 2030, 2031];

const t = (plafond: number, taux: number): Tranche => ({ plafond, taux });

export const BAREMES: Record<Annee, Tranche[]> = {
  actuel: [t(40_000, 0), t(60_000, 0.1), t(80_000, 0.2), t(100_000, 0.3), t(180_000, 0.34), t(Infinity, 0.37)],
  2027: [t(60_000, 0), t(80_000, 0.1), t(100_000, 0.2), t(180_000, 0.34), t(Infinity, 0.37)],
  2028: [t(60_000, 0), t(100_000, 0.1), t(200_000, 0.25), t(Infinity, 0.37)],
  2029: [t(60_000, 0), t(130_000, 0.1), t(200_000, 0.2), t(Infinity, 0.35)],
  2030: [t(60_000, 0), t(150_000, 0.1), t(200_000, 0.2), t(Infinity, 0.3)],
  2031: [t(60_000, 0), t(150_000, 0.1), t(500_000, 0.2), t(Infinity, 0.3)],
};

/** Lignes du tableau de présentation (tranches communes à tous les barèmes). */
export const LIGNES_TABLEAU: [number, number][] = [
  [0, 40_000], [40_000, 60_000], [60_000, 80_000], [80_000, 100_000], [100_000, 130_000],
  [130_000, 150_000], [150_000, 180_000], [180_000, 200_000], [200_000, 500_000], [500_000, Infinity],
];

/** Taux appliqué à un revenu annuel situé strictement dans ]bas ; haut]. */
export function tauxPour(annee: Annee, revenuAnnuel: number): number {
  for (const tr of BAREMES[annee]) if (revenuAnnuel <= tr.plafond) return tr.taux;
  return 0;
}

/** Réduction pour charges de famille : 500 DH par personne et par an, plafonnée à 3 000 DH (6 personnes). */
export const REDUCTION_PAR_PERSONNE = 500;
export const PERSONNES_MAX = 6;

export function reductionFamilleAnnuelle(personnes: number): number {
  const n = Math.max(0, Math.min(PERSONNES_MAX, Math.floor(personnes || 0)));
  return n * REDUCTION_PAR_PERSONNE;
}

export interface DetailTranche {
  bas: number;
  haut: number;
  taux: number;
  base: number;
  impot: number;
}

/** Impôt brut annuel (avant réduction pour charges de famille), avec le détail tranche par tranche. */
export function impotBrutAnnuel(revenuAnnuel: number, annee: Annee): { total: number; detail: DetailTranche[] } {
  const rni = Math.max(0, revenuAnnuel);
  let bas = 0;
  let total = 0;
  const detail: DetailTranche[] = [];
  for (const tr of BAREMES[annee]) {
    const base = Math.max(0, Math.min(rni, tr.plafond) - bas);
    const impot = base * tr.taux;
    detail.push({ bas, haut: tr.plafond, taux: tr.taux, base, impot });
    total += impot;
    bas = tr.plafond;
    if (rni <= tr.plafond) break;
  }
  return { total, detail };
}

/** IR annuel net de la réduction pour charges de famille (jamais négatif). */
export function irAnnuel(revenuAnnuel: number, annee: Annee, personnes = 0): number {
  return Math.max(0, impotBrutAnnuel(revenuAnnuel, annee).total - reductionFamilleAnnuelle(personnes));
}

/** IR mensuel pour un revenu net imposable mensuel. */
export function irMensuel(rniMensuel: number, annee: Annee, personnes = 0): number {
  return irAnnuel(rniMensuel * 12, annee, personnes) / 12;
}

/**
 * Retrouve le revenu net imposable mensuel à partir d'un IR mensuel connu (bulletin de paie),
 * selon le barème en vigueur. L'IR est croissant avec le revenu : recherche par dichotomie.
 */
export function rniDepuisIr(irMensuelConnu: number, personnes = 0, annee: Annee = 'actuel'): number {
  if (!(irMensuelConnu > 0)) return 0;
  let lo = 0;
  let hi = 10_000;
  while (irMensuel(hi, annee, personnes) < irMensuelConnu) hi *= 2;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (irMensuel(mid, annee, personnes) < irMensuelConnu) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}
