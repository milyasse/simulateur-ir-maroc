import { ANNEES, type Annee, impotBrutAnnuel, reductionFamilleAnnuelle } from '../shared/bareme.ts';
import type { Entrees, Simulation } from '../shared/paie.ts';
import { fmt, fmtPct, fmtPlafond } from '../shared/format.ts';

interface Props {
  sim: Simulation;
  entrees: Entrees;
  annee: string;
  onAnnee: (a: string) => void;
}

export function DetailCalcul({ sim, entrees, annee, onAnnee }: Props) {
  const { base } = sim;
  const a: Annee = annee === 'actuel' ? 'actuel' : (Number(annee) as Annee);
  const { total, detail } = impotBrutAnnuel(base.rni * 12, a);
  const reduc = Math.min(total, reductionFamilleAnnuelle(entrees.personnes));
  const ligne = sim.lignes.find((l) => String(l.annee) === annee)!;

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="titre-detail">
      <h2 id="titre-detail" className="text-[15px] font-extrabold tracking-tight text-navy-900">Détail du calcul</h2>

      {base.avecNet && (
        <>
          <h3 className="mt-3 text-[12px] font-bold uppercase tracking-wide text-muted">1. Du brut au revenu imposable</h3>
          <dl className="num mt-2 text-[13.5px]">
            <Ligne label="Salaire brut" valeur={fmt(entrees.brut)} fort />
            {base.lignes.map((l) => (
              <Ligne
                key={l.libelle}
                label={l.libelle}
                note={l.note}
                valeur={l.deductible ? `−${fmt(l.montant)}` : `(${fmt(l.montant)})`}
                attenue={!l.deductible}
              />
            ))}
            <Ligne
              label={base.source === 'bulletin' ? 'Revenu net imposable (retrouvé avec l’IR du bulletin)' : 'Revenu net imposable'}
              valeur={fmt(base.rni)}
              fort
              total
            />
          </dl>
          {base.source === 'bulletin' && base.rniCalcule !== undefined && Math.abs(base.rniCalcule - base.rni) > 1 && (
            <p className="mt-2 rounded-lg bg-warn-50 px-3 py-2 text-[12px] leading-snug text-warn-700">
              À partir du seul brut, on obtiendrait {fmt(base.rniCalcule)} DH. L’écart ({fmt(base.rniCalcule - base.rni)} DH) vient
              d’éléments exonérés ou déduits par l’administration (allocations familiales, indemnités…). Le calcul utilise le
              montant cohérent avec votre bulletin.
            </p>
          )}
          <h3 className="mt-5 text-[12px] font-bold uppercase tracking-wide text-muted">2. Impôt tranche par tranche</h3>
        </>
      )}

      <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Année du barème">
        {ANNEES.map((y) => {
          const id = String(y);
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={id === annee}
              onClick={() => onAnnee(id)}
              className={`rounded-full px-3 py-1 text-[12.5px] font-bold transition-colors ${
                id === annee ? 'bg-navy-800 text-white' : 'bg-navy-50 text-navy-800 hover:bg-navy-100'
              }`}
            >
              {y === 'actuel' ? 'Actuel' : y}
            </button>
          );
        })}
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="num w-full min-w-[320px] text-[12.5px]">
          <thead>
            <tr className="border-b border-line text-[10.5px] font-bold uppercase tracking-wide text-muted">
              <th scope="col" className="py-1.5 text-left">Tranche annuelle</th>
              <th scope="col" className="py-1.5 text-right">Taux</th>
              <th scope="col" className="py-1.5 text-right">Base</th>
              <th scope="col" className="py-1.5 text-right">Impôt/an</th>
            </tr>
          </thead>
          <tbody>
            {detail.map((d) => (
              <tr key={d.bas} className={`border-b border-line/60 ${d.base > 0 ? '' : 'text-muted/60'}`}>
                <td className="py-1.5 pr-2 text-left font-semibold">
                  {fmtPlafond(d.bas)} → {fmtPlafond(d.haut)}
                </td>
                <td className="py-1.5 text-right font-bold">{d.taux === 0 ? 'Exonéré' : fmtPct(d.taux)}</td>
                <td className="py-1.5 text-right">{fmt(d.base)}</td>
                <td className="py-1.5 text-right font-bold">{fmt(d.impot)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="num mt-2 text-[13.5px]">
        <Ligne label="Impôt brut annuel" valeur={fmt(total)} />
        {reduc > 0 && <Ligne label={`Charges de famille (${entrees.personnes} × 500 DH)`} valeur={`−${fmt(reduc)}`} />}
        {base.source === 'bulletin' && annee === 'actuel' ? (
          <Ligne label="IR annuel (bulletin × 12)" valeur={fmt(ligne.irAnnuel)} fort total />
        ) : (
          <Ligne label="IR annuel" valeur={fmt(ligne.irAnnuel)} fort total />
        )}
        <Ligne label="IR mensuel" valeur={fmt(ligne.irMensuel)} fort />
        <Ligne label="Taux marginal · taux moyen" valeur={`${fmtPct(ligne.tauxMarginal)} · ${fmtPct(ligne.tauxMoyen, 1)}`} />
      </dl>
    </section>
  );
}

function Ligne({ label, valeur, note, fort, total, attenue }: { label: string; valeur: string; note?: string; fort?: boolean; total?: boolean; attenue?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 ${total ? 'mt-1 border-t border-navy-100 pt-2' : ''} ${attenue ? 'text-muted' : ''}`}>
      <dt className={`${fort ? 'font-bold text-navy-900' : 'font-medium'}`}>
        {label}
        {note && <span className="block text-[11px] font-medium text-muted">{note}</span>}
      </dt>
      <dd className={`shrink-0 text-right ${fort ? 'font-extrabold text-navy-900' : 'font-semibold'}`}>{valeur}</dd>
    </div>
  );
}
