import type { Simulation } from '../shared/paie.ts';
import { fmt, fmt0, fmtGain, fmtPct } from '../shared/format.ts';

/** Les chiffres clés : IR aujourd'hui → IR 2031, gain mensuel, gain cumulé. */
export function Synthese({ sim }: { sim: Simulation }) {
  const actuel = sim.lignes[0];
  const fin = sim.lignes[sim.lignes.length - 1];
  const baisse = actuel.irMensuel > 0 ? fin.gainVsActuel / actuel.irMensuel : 0;
  const net = sim.base.avecNet;

  return (
    <section className="card overflow-hidden" aria-label="Résultat">
      <div className="hero-bg px-4 pb-5 pt-4 text-white sm:px-6 sm:pt-5">
        <p className="text-[12px] font-semibold uppercase tracking-[.12em] text-white/60">Impôt sur le revenu mensuel</p>
        <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
          <div>
            <p className="text-[11px] font-semibold text-white/60">Aujourd’hui</p>
            <p className="num text-[22px] font-bold text-white/75 line-through decoration-white/40 decoration-2">{fmt(actuel.irMensuel)}</p>
          </div>
          <svg width="28" height="20" viewBox="0 0 28 20" className="mb-2 text-white/50" aria-hidden="true">
            <path d="M2 10h22m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-[11px] font-semibold text-white/60">En 2031</p>
            <p className="num text-[34px] font-extrabold leading-none tracking-tight sm:text-[40px]">
              {fmt(fin.irMensuel)} <span className="text-base font-bold text-white/70">DH</span>
            </p>
          </div>
        </div>
        {baisse > 0.0001 && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[12px] font-bold text-[#9ef0c8] ring-1 ring-white/15">
            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1v9m0 0L2.5 6.5M6 10l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {fmtPct(baisse)} d’impôt en moins à terme
          </p>
        )}
      </div>

      <dl className="grid grid-cols-2 divide-x divide-line border-t border-line sm:grid-cols-3">
        <div className="px-4 py-3.5 sm:px-5">
          <dt className="text-[11.5px] font-semibold text-muted">{net ? 'Net en plus / mois (2031)' : 'IR en moins / mois (2031)'}</dt>
          <dd className="num mt-0.5 text-[19px] font-extrabold text-gain-700">{fmtGain(fin.gainVsActuel)}</dd>
        </div>
        <div className="px-4 py-3.5 sm:px-5">
          <dt className="text-[11.5px] font-semibold text-muted">Gain cumulé 2027 → 2031</dt>
          <dd className="num mt-0.5 text-[19px] font-extrabold text-gain-700">{sim.gainCumule >= 0.5 ? '+' : ''}{fmt0(sim.gainCumule)} <span className="text-xs font-bold text-muted">DH</span></dd>
        </div>
        <div className="col-span-2 border-t border-line px-4 py-3.5 sm:col-span-1 sm:border-t-0 sm:px-5">
          <dt className="text-[11.5px] font-semibold text-muted">Revenu net imposable</dt>
          <dd className="num mt-0.5 text-[19px] font-extrabold text-navy-900">
            {fmt(sim.base.rni)} <span className="text-xs font-bold text-muted">/ mois · {fmt0(sim.base.rni * 12)} / an</span>
          </dd>
        </div>
      </dl>
    </section>
  );
}
