// Saisie de l'utilisateur : gardée sous forme de texte (virgule française acceptée),
// mémorisée dans le navigateur et partageable par lien (paramètres d'URL).

import type { Entrees, Mode } from './shared/paie.ts';
import { parseMontant } from './shared/format.ts';

export type Champ = 'brut' | 'personnes' | 'cimrTaux' | 'cmr' | 'amo' | 'mutuelles' | 'autres' | 'irBulletin' | 'rni';

export interface Saisie {
  mode: Mode;
  valeurs: Record<Champ, string>;
}

export const CHAMPS: Champ[] = ['brut', 'personnes', 'cimrTaux', 'cmr', 'amo', 'mutuelles', 'autres', 'irBulletin', 'rni'];

export const SAISIE_DEFAUT: Saisie = {
  mode: 'prive',
  valeurs: { brut: '15000', personnes: '0', cimrTaux: '', cmr: '', amo: '', mutuelles: '', autres: '', irBulletin: '', rni: '12000' },
};

const CLE = 'simulateur-ir-maroc:saisie:v1';
const MODES: Mode[] = ['prive', 'public', 'rni'];

export function versEntrees(s: Saisie): Entrees {
  const v = (c: Champ) => parseMontant(s.valeurs[c]);
  return {
    mode: s.mode,
    brut: v('brut'),
    personnes: Math.min(6, Math.max(0, Math.floor(v('personnes')))),
    cimrTaux: v('cimrTaux'),
    cmr: v('cmr'),
    amo: v('amo'),
    mutuelles: v('mutuelles'),
    autres: v('autres'),
    irBulletin: v('irBulletin'),
    rni: v('rni'),
  };
}

function depuisParams(p: URLSearchParams): Saisie | null {
  const mode = p.get('mode') as Mode | null;
  if (!mode || !MODES.includes(mode)) return null;
  const valeurs = { ...SAISIE_DEFAUT.valeurs };
  for (const c of CHAMPS) valeurs[c] = p.get(c) ?? (c === 'personnes' ? '0' : '');
  return { mode, valeurs };
}

export function chargerSaisie(): Saisie {
  try {
    const url = depuisParams(new URLSearchParams(location.search));
    if (url) return url;
  } catch { /* URL illisible : on ignore */ }
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) {
      const s = JSON.parse(brut) as Saisie;
      if (MODES.includes(s.mode)) return { mode: s.mode, valeurs: { ...SAISIE_DEFAUT.valeurs, ...s.valeurs } };
    }
  } catch { /* stockage indisponible */ }
  return SAISIE_DEFAUT;
}

export function memoriserSaisie(s: Saisie): void {
  try { localStorage.setItem(CLE, JSON.stringify(s)); } catch { /* navigation privée */ }
}

/** Champs utiles pour un mode donné (pour un lien de partage court). */
export const CHAMPS_PAR_MODE: Record<Mode, Champ[]> = {
  prive: ['brut', 'cimrTaux', 'personnes'],
  public: ['brut', 'cmr', 'amo', 'mutuelles', 'autres', 'irBulletin', 'personnes'],
  rni: ['rni', 'personnes'],
};

export function lienPartage(s: Saisie): string {
  const p = new URLSearchParams({ mode: s.mode });
  for (const c of CHAMPS_PAR_MODE[s.mode]) if (s.valeurs[c] && s.valeurs[c] !== '0') p.set(c, s.valeurs[c]);
  return `${location.origin}${location.pathname}?${p.toString()}`;
}
