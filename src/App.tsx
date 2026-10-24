import { useEffect, useMemo, useRef, useState } from 'react';
import { Formulaire } from './components/Formulaire.tsx';
import { Synthese } from './components/Synthese.tsx';
import { Graphique } from './components/Graphique.tsx';
import { TableauAnnees } from './components/TableauAnnees.tsx';
import { DetailCalcul } from './components/DetailCalcul.tsx';
import { Bareme } from './components/Bareme.tsx';
import { simuler } from './shared/paie.ts';
import { CHAMPS_PAR_MODE, chargerSaisie, lienPartage, memoriserSaisie, versEntrees, type Saisie } from './state.ts';
import { compterSimulation, compterVisite } from './services/stats.ts';

declare const __APP_VERSION__: string;
declare const __BUILD_SHA__: string;

export default function App() {
  const [saisie, setSaisie] = useState<Saisie>(chargerSaisie);
  const [annee, setAnnee] = useState('2031');
  const [copie, setCopie] = useState(false);

  const entrees = useMemo(() => versEntrees(saisie), [saisie]);
  const sim = useMemo(() => simuler(entrees), [entrees]);

  useEffect(() => {
    memoriserSaisie(saisie);
    // l'URL reste propre après ouverture d'un lien partagé
    if (location.search) history.replaceState(null, '', location.pathname);
  }, [saisie]);

  // Compteur anonyme : une visite par session ; une simulation quand l'utilisateur a modifié
  // la saisie et que le résultat est resté stable 2,5 s (pas à chaque frappe).
  const modifie = useRef(false);
  useEffect(() => { compterVisite(); }, []);
  useEffect(() => {
    if (!modifie.current || sim.base.rni <= 0) return;
    const empreinte = [saisie.mode, ...CHAMPS_PAR_MODE[saisie.mode].map((c) => versEntrees(saisie)[c])].join('|');
    const t = setTimeout(() => compterSimulation(empreinte), 2500);
    return () => clearTimeout(t);
  }, [saisie, sim.base.rni]);
  const modifier = (f: (s: Saisie) => Saisie) => {
    modifie.current = true;
    setSaisie(f);
  };

  const choisirAnnee = (a: string) => {
    setAnnee(a);
  };

  async function partager() {
    const url = lienPartage(saisie);
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ title: 'Simulateur IR Maroc 2027–2031', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopie(true);
      setTimeout(() => setCopie(false), 2200);
    } catch { /* partage annulé */ }
  }

  const vide = sim.base.rni <= 0;

  return (
    <div className="min-h-dvh">
      <header className="hero-bg text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pb-14 pt-[max(16px,env(safe-area-inset-top))] sm:px-6 sm:pb-16">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL}icons/favicon.svg`} width="40" height="40" alt="" className="rounded-xl shadow-lg" />
            <div>
              <h1 className="text-[18px] font-extrabold leading-tight tracking-tight sm:text-xl">Simulateur IR Maroc</h1>
              <p className="text-[12px] font-medium text-white/65">Réforme 2027 → 2031 · PLF n° 60.26</p>
            </div>
          </div>
          <button
            type="button"
            onClick={partager}
            className="no-print inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3.5 py-2 text-[12.5px] font-bold ring-1 ring-white/20 transition hover:bg-white/20"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
            </svg>
            {copie ? 'Lien copié' : 'Partager'}
          </button>
        </div>
      </header>

      <main className="mx-auto -mt-10 grid max-w-6xl gap-4 px-4 pb-10 sm:px-6 lg:grid-cols-[minmax(320px,380px)_1fr] lg:items-start lg:gap-5">
        <div className="space-y-4 lg:sticky lg:top-4">
          <Formulaire
            saisie={saisie}
            onMode={(mode) => modifier((s) => ({ ...s, mode }))}
            onChamp={(c, v) => modifier((s) => ({ ...s, valeurs: { ...s.valeurs, [c]: v } }))}
            onRemplir={(v) => modifier((s) => ({ ...s, valeurs: { ...s.valeurs, ...v } }))}
          />
          <Hypotheses />
        </div>

        <div className="min-w-0 space-y-4">
          {vide ? (
            <section className="card p-6 text-center text-[14px] text-muted">
              Remplissez les champs marqués « Obligatoire » pour voir l’impact de la réforme année par année.
            </section>
          ) : (
            <>
              <Synthese sim={sim} />
              <Graphique sim={sim} />
              <TableauAnnees sim={sim} annee={annee} onAnnee={choisirAnnee} />
              <DetailCalcul sim={sim} entrees={entrees} annee={annee} onAnnee={choisirAnnee} />
            </>
          )}
          <Bareme rniAnnuel={sim.base.rni * 12} />
        </div>
      </main>

      <footer className="border-t border-line bg-white/60">
        <div className="mx-auto max-w-6xl px-4 py-5 text-[11.5px] leading-relaxed text-muted sm:px-6">
          <p>
            Simulation indicative fondée sur le projet de loi de finances 2027 (n° 60.26, 23 octobre 2026), non encore voté.
            Ne remplace pas un bulletin de paie ni l’avis de la DGI. Tout est calculé sur votre appareil : vos montants ne sont jamais envoyés. Seul un compteur anonyme des visites et des simulations est tenu.
          </p>
          <p className="mt-1.5">
            Version {__APP_VERSION__} · {__BUILD_SHA__} ·{' '}
            <a className="font-semibold text-navy-700 underline-offset-2 hover:underline" href="https://github.com/milyasse/simulateur-ir-maroc">
              Code source
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function Hypotheses() {
  return (
    <details className="card group p-4 text-[12.5px] leading-relaxed text-muted sm:p-5">
      <summary className="cursor-pointer list-none text-[13px] font-bold text-navy-900">
        <span className="inline-flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="transition-transform group-open:rotate-90" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
          Règles et hypothèses du calcul
        </span>
      </summary>
      <ul className="mt-2.5 list-disc space-y-1.5 pl-5">
        <li><b className="text-ink">Privé :</b> CNSS 4,48 % plafonnée à 6 000 DH de salaire (268,80 DH), AMO 2,26 % du brut, CIMR au taux saisi.</li>
        <li><b className="text-ink">Frais professionnels (CGI, art. 59) :</b> 35 % si le brut annuel ne dépasse pas 78 000 DH, sinon 25 % ; plafond 35 000 DH par an (2 916,67 DH/mois).</li>
        <li><b className="text-ink">Barème actuel (CGI, art. 73) :</b> exonéré jusqu’à 40 000 DH/an, puis 10, 20, 30, 34 et 37 %. Barèmes 2027 → 2031 : PLF n° 60.26.</li>
        <li><b className="text-ink">Fonctionnaire :</b> CMR, AMO et mutuelles sont déductibles ; F.O.S. et autres retenues ne le sont pas. Avec l’IR du bulletin, le revenu imposable est retrouvé à partir du barème actuel.</li>
        <li><b className="text-ink">Salaire net seul :</b> le brut est retrouvé par le calcul inverse. Pour un fonctionnaire, les retenues sont estimées (CMR 14 % de la part soumise à retenue, ≈ 45 % du brut ; AMO 2,5 % plafonnée à 400 DH ; mutuelles ≈ 1 %) : remplacez-les par celles du bulletin.</li>
        <li><b className="text-ink">Charges de famille (CGI, art. 74) :</b> 500 DH d’IR en moins par personne et par an, 3 000 DH au plus.</li>
        <li>Le revenu imposable est supposé stable de 2026 à 2031 (pas d’augmentation ni d’avancement).</li>
      </ul>
    </details>
  );
}
