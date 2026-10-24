// Compteur anonyme : une « visite » par session de navigation, une « simulation » par
// calcul distinct fait par l'utilisateur. Seuls le type et un identifiant aléatoire du
// navigateur sont envoyés — jamais les montants saisis.

import { STATS_URL } from '../config.ts';

const CLE_ID = 'simulateur-ir-maroc:visiteur';
const CLE_VISITE = 'simulateur-ir-maroc:visite';
const CLE_SIMS = 'simulateur-ir-maroc:simulations';

function actif(): boolean {
  return Boolean(STATS_URL) && /\.github\.io$/.test(location.hostname);
}

function idVisiteur(): string {
  try {
    let id = localStorage.getItem(CLE_ID);
    if (!id) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(CLE_ID, id);
    }
    return id;
  } catch {
    return 'anonyme';
  }
}

function envoyer(type: 'visite' | 'simulation'): void {
  if (!actif()) return;
  const corps = JSON.stringify({ type, v: idVisiteur() });
  // text/plain + no-cors : requête simple, sans pré-vérification CORS
  fetch(STATS_URL, { method: 'POST', mode: 'no-cors', keepalive: true, headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: corps }).catch(() => {});
}

export function compterVisite(): void {
  try {
    if (sessionStorage.getItem(CLE_VISITE)) return;
    sessionStorage.setItem(CLE_VISITE, '1');
  } catch { /* stockage indisponible : on compte quand même */ }
  envoyer('visite');
}

/** Compte une simulation si cette saisie n'a pas déjà été comptée pendant la session. */
export function compterSimulation(empreinte: string): void {
  try {
    const vues: string[] = JSON.parse(sessionStorage.getItem(CLE_SIMS) || '[]');
    if (vues.includes(empreinte)) return;
    vues.push(empreinte);
    sessionStorage.setItem(CLE_SIMS, JSON.stringify(vues.slice(-50)));
  } catch { /* stockage indisponible */ }
  envoyer('simulation');
}
