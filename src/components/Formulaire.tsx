import { useState } from 'react';
import { propositionDepuisNet, type Mode } from '../shared/paie.ts';
import type { Champ, Saisie } from '../state.ts';
import { fmt, parseMontant, versSaisie } from '../shared/format.ts';

const MODES: { id: Mode; titre: string; sous: string }[] = [
  { id: 'prive', titre: 'Salarié du privé', sous: 'CNSS, AMO, CIMR' },
  { id: 'public', titre: 'Fonctionnaire', sous: 'Bulletin : CMR, AMO, mutuelles' },
  { id: 'rni', titre: 'Revenu imposable', sous: 'RNI déjà connu' },
];

interface Props {
  saisie: Saisie;
  onMode: (m: Mode) => void;
  onChamp: (c: Champ, v: string) => void;
  onRemplir: (v: Partial<Record<Champ, string>>) => void;
}

type Statut = 'obligatoire' | 'facultatif';

function Badge({ statut }: { statut: Statut }) {
  return statut === 'obligatoire' ? (
    <span className="ml-1.5 rounded-full bg-[#fdecea] px-1.5 py-px align-middle text-[10px] font-extrabold uppercase tracking-wide text-[#b42318]">
      Obligatoire
    </span>
  ) : (
    <span className="ml-1.5 rounded-full bg-navy-50 px-1.5 py-px align-middle text-[10px] font-bold uppercase tracking-wide text-muted">
      Facultatif
    </span>
  );
}

export function Formulaire({ saisie, onMode, onChamp, onRemplir }: Props) {
  const { mode, valeurs } = saisie;
  const [net, setNet] = useState('');
  const [propose, setPropose] = useState<{ mode: Mode; net: number } | null>(null);

  function proposer() {
    const n = parseMontant(net);
    const p = propositionDepuisNet(n, { mode, personnes: Number(valeurs.personnes) || 0, cimrTaux: parseMontant(valeurs.cimrTaux) });
    if (!p) return;
    onRemplir(
      mode === 'public'
        ? { brut: versSaisie(p.brut), cmr: versSaisie(p.cmr), amo: versSaisie(p.amo), mutuelles: versSaisie(p.mutuelles), autres: '', irBulletin: '' }
        : { brut: versSaisie(p.brut) },
    );
    setPropose({ mode, net: n });
  }

  const blocNet = mode !== 'rni' && (
    <details className="group rounded-xl border border-dashed border-navy-600/50 bg-navy-50/50 p-3" open={!!net || undefined}>
      <summary className="cursor-pointer list-none text-[12.5px] font-bold text-navy-800">
        <span className="inline-flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" className="transition-transform group-open:rotate-90" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
          Vous ne connaissez que votre salaire net ?
        </span>
      </summary>
      <form
        className="mt-2.5 flex items-end gap-2"
        onSubmit={(ev) => {
          ev.preventDefault();
          proposer();
        }}
      >
        <label className="block flex-1">
          <span className="mb-1 block text-[12px] font-semibold">Salaire net mensuel</span>
          <span className="relative block">
            <input className="field num pr-12" inputMode="decimal" autoComplete="off" placeholder="ex. 22 900" value={net} onChange={(e) => setNet(e.target.value)} name="net" />
            <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-bold text-muted">DH</span>
          </span>
        </label>
        <button type="submit" disabled={!(parseMontant(net) > 0)} className="rounded-xl bg-navy-800 px-3.5 py-2.5 text-[13px] font-extrabold text-white disabled:opacity-40">
          Proposer
        </button>
      </form>
      <p className="mt-2 text-[11.5px] leading-snug text-muted">
        {mode === 'public'
          ? 'Remplit le brut et des retenues estimées (CMR ≈ 6,3 % du brut, AMO 2,5 % plafonnée à 400 DH, mutuelles ≈ 1 %). Corrigez-les avec votre bulletin.'
          : 'Remplit le brut qui donne ce net (CNSS, AMO, CIMR saisie, frais professionnels et IR actuels).'}
      </p>
    </details>
  );

  const bandeau = propose && propose.mode === mode && (
    <p className="rounded-xl bg-gain-50 px-3 py-2.5 text-[12.5px] leading-snug text-gain-700 ring-1 ring-gain-100">
      <b>Montants proposés</b> pour un net de {fmt(propose.net)} DH{mode === 'public' ? ' : estimations à vérifier sur votre bulletin.' : '.'}
    </p>
  );
  const irRempli = parseMontant(valeurs.irBulletin) > 0;
  const champ = (
    c: Champ,
    label: string,
    opts: { aide?: string; suffixe?: string; placeholder?: string; grand?: boolean; statut?: Statut } = {},
  ) => (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between gap-2 text-[13px] font-semibold text-ink">
        <span>
          {label}
          {opts.statut && <Badge statut={opts.statut} />}
        </span>
        {opts.aide && <span className="text-right text-[11.5px] font-medium text-muted">{opts.aide}</span>}
      </span>
      <span className="relative block">
        <input
          className={`field num pr-12 ${opts.grand ? 'py-3 text-xl font-extrabold' : ''}`}
          inputMode="decimal"
          autoComplete="off"
          placeholder={opts.placeholder ?? '0'}
          value={valeurs[c]}
          onChange={(e) => onChamp(c, e.target.value)}
          name={c}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-bold text-muted">
          {opts.suffixe ?? 'DH'}
        </span>
      </span>
    </label>
  );

  const personnes = Math.min(6, Math.max(0, Math.floor(Number(valeurs.personnes) || 0)));

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="titre-saisie">
      <h2 id="titre-saisie" className="text-[15px] font-extrabold tracking-tight text-navy-900">Votre situation</h2>

      <div role="radiogroup" aria-label="Type de revenu" className="mt-3 grid grid-cols-3 gap-1.5 rounded-xl bg-navy-50 p-1">
        {MODES.map((m) => {
          const actif = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={actif}
              onClick={() => onMode(m.id)}
              className={`rounded-lg px-1.5 py-2 text-center transition-all ${
                actif ? 'bg-white text-navy-900 shadow-[0_1px_3px_rgba(8,42,82,.18)]' : 'text-muted hover:text-navy-800'
              }`}
            >
              <span className="block text-[12.5px] font-extrabold leading-tight">{m.titre}</span>
              <span className="mt-0.5 hidden text-[10.5px] font-medium leading-tight text-muted sm:block">{m.sous}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-3.5">
        {blocNet}
        {bandeau}
        {mode === 'prive' && (
          <>
            {champ('brut', 'Salaire brut mensuel', { placeholder: '32 000', grand: true, statut: 'obligatoire' })}
            {champ('cimrTaux', 'Retraite complémentaire CIMR', { suffixe: '%', placeholder: '0', aide: 'taux salarial', statut: 'facultatif' })}
          </>
        )}

        {mode === 'rni' &&
          champ('rni', 'Revenu net imposable mensuel', { placeholder: '28 000', grand: true, aide: 'après cotisations et frais pro.', statut: 'obligatoire' })}

        {mode === 'public' && (
          <>
            {champ('irBulletin', 'Impôt sur le revenu du bulletin', {
              placeholder: 'ex. 10 318,38',
              grand: true,
              statut: irRempli || !parseMontant(valeurs.brut) ? 'obligatoire' : 'facultatif',
            })}
            <p className="-mt-1.5 text-[11.5px] leading-snug text-muted">
              {irRempli
                ? 'Suffit à calculer votre impôt et vos gains 2027 → 2031, au plus juste (indemnités exonérées comprises).'
                : 'Recommandé : suffit à calculer votre impôt et vos gains. À défaut, remplissez le brut et les retenues ci-dessous.'}
            </p>

            <fieldset className="rounded-xl border border-line p-3">
              <legend className="px-1 text-[12px] font-bold text-navy-900">
                {irRempli ? 'Pour afficher le net à payer' : 'Ou, à défaut : brut et retenues'}
                {irRempli ? <Badge statut="facultatif" /> : parseMontant(valeurs.brut) > 0 ? <Badge statut="obligatoire" /> : null}
              </legend>
              <p className="mb-3 text-[11.5px] leading-snug text-muted">
                {irRempli
                  ? 'Ces montants ne changent pas l’impôt : ils servent seulement à calculer le net à payer. Recopiez-les de votre bulletin.'
                  : 'L’impôt est alors estimé à partir du brut et des retenues déductibles (CMR, AMO, mutuelles).'}
              </p>
              <div className="space-y-3">
                {champ('brut', 'Salaire brut mensuel', { placeholder: '41 933,69' })}
                <div className="grid grid-cols-2 gap-3">
                  {champ('cmr', 'Retraite CMR')}
                  {champ('amo', 'AMO')}
                  {champ('mutuelles', 'Mutuelles', { aide: 'total' })}
                  {champ('autres', 'F.O.S. et autres', { aide: 'non déductibles' })}
                </div>
              </div>
            </fieldset>
          </>
        )}

        <div>
          <span className="mb-1.5 flex items-baseline justify-between text-[13px] font-semibold">
            <span>
              Personnes à charge
              <Badge statut="facultatif" />
            </span>
            <span className="text-right text-[11.5px] font-medium text-muted">−500 DH d’IR/an chacune, 6 max.</span>
          </span>
          <div className="grid grid-cols-7 gap-1" role="radiogroup" aria-label="Personnes à charge">
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={personnes === n}
                onClick={() => onChamp('personnes', String(n))}
                className={`num rounded-lg border py-2 text-sm font-bold transition-colors ${
                  personnes === n ? 'border-navy-800 bg-navy-800 text-white' : 'border-line bg-white text-ink hover:border-navy-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
