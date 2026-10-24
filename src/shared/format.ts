const dh2 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dh0 = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** 12 345,67 */
export const fmt = (n: number) => dh2.format(Math.abs(n) < 0.005 ? 0 : n);
/** 12 346 */
export const fmt0 = (n: number) => dh0.format(n);
/** +1 234,56 (signe explicite pour les gains) */
export const fmtGain = (n: number) => (n > 0.004 ? '+' : '') + fmt(n);
/** 37 % ou 2,26 % */
export const fmtPct = (taux: number, decimales = 0) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).format(taux * 100) + ' %';

/** Montant annuel de tranche : « 40 000 », « ∞ » */
export const fmtPlafond = (n: number) => (Number.isFinite(n) ? fmt0(n) : '∞');

/** Accepte « 41 933,69 », « 41933.69 », « 41.933,69 ». */
export function parseMontant(s: string): number {
  let t = s.replace(/[\s  ]/g, '').replace(/dh$/i, '');
  if (!t) return 0;
  const virgule = t.lastIndexOf(',');
  const point = t.lastIndexOf('.');
  if (virgule > -1 && point > -1) {
    // le dernier séparateur est le séparateur décimal
    t = virgule > point ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  } else if (virgule > -1) {
    t = t.replace(',', '.');
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

/** Affichage d'une valeur saisie (garde la virgule française). */
export const versSaisie = (n: number) => (n ? String(Math.round(n * 100) / 100).replace('.', ',') : '');
