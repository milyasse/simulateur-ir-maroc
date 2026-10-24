// Du salaire brut au revenu net imposable (RNI), puis IR et net à payer pour chaque année.

import { ANNEES, type Annee, irMensuel, rniDepuisIr, tauxPour } from './bareme.ts';

export type Mode = 'prive' | 'public' | 'rni';

export interface Entrees {
  mode: Mode;
  /** Salaire brut mensuel (modes privé et fonctionnaire). */
  brut: number;
  /** Nombre de personnes à charge (0 à 6). */
  personnes: number;
  // --- Salarié du privé ---
  /** Taux salarial de retraite complémentaire CIMR, en % (0 si aucune). */
  cimrTaux: number;
  // --- Fonctionnaire (montants mensuels du bulletin) ---
  cmr: number;
  amo: number;
  mutuelles: number;
  /** Retenues non déductibles de l'IR (F.O.S., prêts, etc.). */
  autres: number;
  /** IR figurant sur le bulletin actuel (0 ou vide : calcul à partir du brut). */
  irBulletin: number;
  // --- Revenu net imposable saisi directement ---
  rni: number;
}

export const CNSS_TAUX = 0.0448;
export const CNSS_PLAFOND = 6_000;
export const AMO_TAUX = 0.0226;
/** Frais professionnels : 35 % si le brut imposable annuel ≤ 78 000 DH, sinon 25 % ; plafond 35 000 DH/an. */
export const FP_SEUIL_ANNUEL = 78_000;
export const FP_PLAFOND_ANNUEL = 35_000;

export interface LigneRetenue {
  libelle: string;
  montant: number;
  /** Déduite du brut pour calculer le revenu net imposable. */
  deductible: boolean;
  /** Prélevée sur le salaire (les frais professionnels ne le sont pas). */
  prelevee: boolean;
  note?: string;
}

export interface Base {
  /** Revenu net imposable mensuel. */
  rni: number;
  /** Retenues prélevées hors IR (s'ajoutent à l'IR pour passer du brut au net). */
  retenuesHorsIr: number;
  lignes: LigneRetenue[];
  /** D'où vient le RNI : calcul à partir du brut, IR du bulletin, ou saisie directe. */
  source: 'calcul' | 'bulletin' | 'saisie';
  /** Le net à payer peut être calculé (faux en mode « revenu imposable »). */
  avecNet: boolean;
  /** RNI recalculé à partir du brut, pour comparaison quand on part du bulletin. */
  rniCalcule?: number;
}

export function fraisProfessionnels(brutMensuel: number): { montant: number; taux: number } {
  const taux = brutMensuel * 12 <= FP_SEUIL_ANNUEL ? 0.35 : 0.25;
  return { montant: Math.min(brutMensuel * taux, FP_PLAFOND_ANNUEL / 12), taux };
}

const pos = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function calculerBase(e: Entrees): Base {
  if (e.mode === 'rni') {
    return { rni: pos(e.rni), retenuesHorsIr: 0, lignes: [], source: 'saisie', avecNet: false };
  }

  const brut = pos(e.brut);
  const fp = fraisProfessionnels(brut);
  const lignes: LigneRetenue[] = [];

  if (e.mode === 'prive') {
    const cnss = Math.min(brut, CNSS_PLAFOND) * CNSS_TAUX;
    const amo = brut * AMO_TAUX;
    const cimr = brut * (pos(e.cimrTaux) / 100);
    lignes.push({ libelle: 'CNSS', montant: cnss, deductible: true, prelevee: true, note: '4,48 % plafonnée à 6 000 DH' });
    lignes.push({ libelle: 'AMO', montant: amo, deductible: true, prelevee: true, note: '2,26 % du brut' });
    if (cimr > 0) lignes.push({ libelle: 'CIMR', montant: cimr, deductible: true, prelevee: true, note: `${fmtTaux(e.cimrTaux)} du brut` });
  } else {
    if (pos(e.cmr)) lignes.push({ libelle: 'Caisse marocaine des retraites', montant: pos(e.cmr), deductible: true, prelevee: true });
    if (pos(e.amo)) lignes.push({ libelle: 'Assurance maladie obligatoire', montant: pos(e.amo), deductible: true, prelevee: true });
    if (pos(e.mutuelles)) lignes.push({ libelle: 'Mutuelles', montant: pos(e.mutuelles), deductible: true, prelevee: true });
    if (pos(e.autres)) lignes.push({ libelle: 'Autres retenues (F.O.S., …)', montant: pos(e.autres), deductible: false, prelevee: true, note: 'non déductibles de l’IR' });
  }

  lignes.push({
    libelle: 'Frais professionnels',
    montant: fp.montant,
    deductible: true,
    prelevee: false,
    note: `${fp.taux === 0.35 ? '35' : '25'} %, plafonnés à 35 000 DH/an`,
  });

  const deductions = lignes.filter((l) => l.deductible).reduce((s, l) => s + l.montant, 0);
  const retenuesHorsIr = lignes.filter((l) => l.prelevee).reduce((s, l) => s + l.montant, 0);
  const rniCalcule = Math.max(0, brut - deductions);

  if (e.mode === 'public' && pos(e.irBulletin) > 0) {
    return {
      rni: rniDepuisIr(e.irBulletin, e.personnes),
      retenuesHorsIr,
      lignes,
      source: 'bulletin',
      avecNet: true,
      rniCalcule,
    };
  }
  return { rni: rniCalcule, retenuesHorsIr, lignes, source: 'calcul', avecNet: true };
}

export interface LigneAnnee {
  annee: Annee;
  irMensuel: number;
  irAnnuel: number;
  netMensuel: number;
  /** Gain mensuel par rapport au barème actuel. */
  gainVsActuel: number;
  /** Gain mensuel par rapport à l'année précédente (tableau « gain additionnel »). */
  gainVsPrecedente: number;
  /** Taux moyen d'imposition (IR / RNI). */
  tauxMoyen: number;
  /** Taux marginal (taux de la tranche du dernier dirham). */
  tauxMarginal: number;
}

export interface Simulation {
  base: Base;
  lignes: LigneAnnee[];
  /** Somme des gains vs barème actuel sur 2027 → 2031 (12 mois par an). */
  gainCumule: number;
  /** Gain annuel une fois la réforme complète (2031). */
  gainAnnuelFinal: number;
}

export function simuler(e: Entrees): Simulation {
  const base = calculerBase(e);
  const brut = pos(e.brut);
  const irActuel = base.source === 'bulletin' ? pos(e.irBulletin) : irMensuel(base.rni, 'actuel', e.personnes);
  let precedent = irActuel;
  const lignes: LigneAnnee[] = ANNEES.map((annee) => {
    const ir = annee === 'actuel' ? irActuel : irMensuel(base.rni, annee, e.personnes);
    const l: LigneAnnee = {
      annee,
      irMensuel: ir,
      irAnnuel: ir * 12,
      netMensuel: base.avecNet ? brut - base.retenuesHorsIr - ir : base.rni - ir,
      gainVsActuel: irActuel - ir,
      gainVsPrecedente: annee === 'actuel' ? 0 : precedent - ir,
      tauxMoyen: base.rni > 0 ? ir / base.rni : 0,
      tauxMarginal: tauxPour(annee, base.rni * 12),
    };
    precedent = ir;
    return l;
  });
  const gainCumule = lignes.slice(1).reduce((s, l) => s + l.gainVsActuel * 12, 0);
  return { base, lignes, gainCumule, gainAnnuelFinal: lignes[lignes.length - 1].gainVsActuel * 12 };
}

function fmtTaux(p: number): string {
  return `${String(Math.round(p * 100) / 100).replace('.', ',')} %`;
}
