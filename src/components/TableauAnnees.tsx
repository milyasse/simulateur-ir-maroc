import { useState } from 'react';
import type { Simulation } from '../shared/paie.ts';
import { fmt, fmtGain, fmtPct } from '../shared/format.ts';

type Periode = 'mois' | 'an';

export function TableauAnnees({ sim, annee, onAnnee }: { sim: Simulation; annee: string; onAnnee: (a: string) => void }) {
  const [periode, setPeriode] = useState<Periode>('mois');
  const k = periode === 'mois' ? 1 : 12;
  const net = sim.base.avecNet;

  return (
    <section className="card overflow-hidden" aria-labelledby="titre-tableau">
      <div className="flex items-center justify-between gap-2 px-4 pt-4 sm:px-5">
        <h2 id="titre-tableau" className="text-[15px] font-extrabold tracking-tight text-navy-900">Année par année</h2>
        <div className="flex rounded-lg bg-navy-50 p-0.5 text-[12px] font-bold" role="radiogroup" aria-label="Période">
          {(['mois', 'an'] as Periode[]).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={periode === p}
              onClick={() => setPeriode(p)}
              className={`rounded-md px-2.5 py-1 ${periode === p ? 'bg-white text-navy-900 shadow-sm' : 'text-muted'}`}
            >
              {p === 'mois' ? 'Par mois' : 'Par an'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="num w-full min-w-[340px] text-right text-[13px]">
          <thead>
            <tr className="border-y border-line bg-navy-50/60 text-[11px] font-bold uppercase tracking-wide text-muted">
              <th scope="col" className="py-2 pl-4 text-left sm:pl-5">Année</th>
              <th scope="col" className="px-2 py-2">IR</th>
              {net && <th scope="col" className="px-2 py-2">Net à payer</th>}
              <th scope="col" className="px-2 py-2">Gain vs actuel</th>
              <th scope="col" className="hidden py-2 pr-5 pl-2 sm:table-cell">vs année préc.</th>
            </tr>
          </thead>
          <tbody>
            {sim.lignes.map((l) => {
              const id = String(l.annee);
              const choisi = id === annee;
              return (
                <tr
                  key={id}
                  onClick={() => onAnnee(id)}
                  className={`cursor-pointer border-b border-line/70 transition-colors last:border-b-0 ${choisi ? 'bg-navy-50' : 'hover:bg-bg'}`}
                  aria-selected={choisi}
                >
                  <th scope="row" className="py-2.5 pl-4 text-left sm:pl-5">
                    <span className={`inline-flex items-center gap-1.5 font-extrabold ${choisi ? 'text-navy-800' : 'text-ink'}`}>
                      {choisi && <span className="h-1.5 w-1.5 rounded-full bg-navy-700" aria-hidden="true" />}
                      {l.annee === 'actuel' ? 'Actuel' : l.annee}
                    </span>
                    <span className="block text-[10.5px] font-semibold text-muted">taux moyen {fmtPct(l.tauxMoyen, 1)}</span>
                  </th>
                  <td className="px-2 py-2.5 font-semibold">{fmt(l.irMensuel * k)}</td>
                  {net && <td className="px-2 py-2.5 font-bold text-navy-900">{fmt(l.netMensuel * k)}</td>}
                  <td className={`px-2 py-2.5 font-extrabold ${l.gainVsActuel > 0.004 ? 'text-gain-700' : 'text-muted'}`}>
                    {l.annee === 'actuel' ? '—' : fmtGain(l.gainVsActuel * k)}
                  </td>
                  <td className="hidden py-2.5 pr-5 pl-2 font-semibold text-gain-700 sm:table-cell">
                    {l.annee === 'actuel' ? '—' : fmtGain(l.gainVsPrecedente * k)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-navy-100 bg-gain-50">
              <th scope="row" colSpan={net ? 3 : 2} className="py-3 pl-4 text-left text-[12.5px] font-bold text-gain-700 sm:pl-5">
                Gain cumulé sur 5 ans (2027 → 2031)
              </th>
              <td className="px-2 py-3 text-[14px] font-extrabold text-gain-700">{fmtGain(sim.gainCumule)}</td>
              <td className="hidden sm:table-cell" />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="px-4 py-2.5 text-[11.5px] text-muted sm:px-5">Touchez une année pour voir le calcul tranche par tranche.</p>
    </section>
  );
}
