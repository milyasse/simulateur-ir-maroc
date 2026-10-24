/**
 * Compteur du Simulateur IR Maroc — script Google Apps Script lié à une feuille Google Sheets.
 *
 * - doPost : l'application envoie {type: "visite" | "simulation", v: <identifiant anonyme du navigateur>}.
 *            Une ligne est ajoutée dans l'onglet « Journal » : date, type, visiteur. Aucun montant n'est reçu.
 * - doGet  : le tableau de bord lit les totaux et la série par jour, avec la clé ci-dessous.
 *
 * Installation : voir apps-script/README.md.
 */

// Clé du tableau de bord : à remplacer par une valeur secrète (la même que dans le lien du tableau de bord).
const CLE = 'REMPLACER_PAR_VOTRE_CLE';
const FEUILLE = 'Journal';
const FUSEAU = 'Africa/Casablanca';

function feuille_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(FEUILLE);
  if (!sh) {
    sh = ss.insertSheet(FEUILLE);
    sh.appendRow(['Date', 'Type', 'Visiteur']);
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
  }
  return sh;
}

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const type = d.type === 'simulation' || d.type === 'visite' ? d.type : null;
    const visiteur = String(d.v || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 32);
    if (type && visiteur) {
      const verrou = LockService.getScriptLock();
      verrou.waitLock(10000);
      try {
        feuille_().appendRow([new Date(), type, visiteur]);
      } finally {
        verrou.releaseLock();
      }
    }
  } catch (err) {
    // requête invalide : ignorée
  }
  return ContentService.createTextOutput('ok');
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.cle !== CLE) return json_({ erreur: 'Clé invalide' });

  const lignes = feuille_().getDataRange().getValues().slice(1);
  const jours = {};
  const tousVisiteurs = {};
  const visiteursSimulation = {};
  let visites = 0;
  let simulations = 0;
  let premiere = null;
  let derniere = null;

  lignes.forEach(function (l) {
    const date = l[0] instanceof Date ? l[0] : new Date(l[0]);
    if (isNaN(date)) return;
    const type = l[1];
    const v = String(l[2]);
    const j = Utilities.formatDate(date, FUSEAU, 'yyyy-MM-dd');
    if (!jours[j]) jours[j] = { visites: 0, simulations: 0, visiteurs: {} };
    jours[j].visiteurs[v] = true;
    tousVisiteurs[v] = true;
    if (type === 'visite') { visites++; jours[j].visites++; }
    if (type === 'simulation') { simulations++; jours[j].simulations++; visiteursSimulation[v] = true; }
    if (!premiere || date < premiere) premiere = date;
    if (!derniere || date > derniere) derniere = date;
  });

  const parJour = Object.keys(jours).sort().map(function (j) {
    return { jour: j, visites: jours[j].visites, simulations: jours[j].simulations, visiteurs: Object.keys(jours[j].visiteurs).length };
  });

  return json_({
    misAJour: new Date().toISOString(),
    premiere: premiere ? premiere.toISOString() : null,
    derniere: derniere ? derniere.toISOString() : null,
    totaux: {
      visiteurs: Object.keys(tousVisiteurs).length,
      visites: visites,
      simulations: simulations,
      visiteursAyantSimule: Object.keys(visiteursSimulation).length,
    },
    parJour: parJour,
  });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
