import type { Simulation } from '../shared/paie.ts';
import { fmt0 } from '../shared/format.ts';

/**
 * Une colonne par année : la partie pleine est l'IR mensuel de l'année,
 * la partie hachurée verte est ce qui reste dans votre poche par rapport à aujourd'hui.
 */
export function Graphique({ sim }: { sim: Simulation }) {
  const max = Math.max(...sim.lignes.map((l) => l.irMensuel), 1);
  const H = 168;

  return (
    <section className="card p-4 sm:p-5" aria-labelledby="titre-graph">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="titre-graph" className="text-[15px] font-extrabold tracking-tight text-navy-900">Évolution de l’IR mensuel</h2>
        <div className="flex items-center gap-3 text-[11.5px] font-semibold text-muted">
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-navy-700" />IR payé</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm border border-gain-600 bg-gain-100" />Économie</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-6 items-end gap-2 sm:gap-3" role="img"
        aria-label={sim.lignes.map((l) => `${l.annee === 'actuel' ? 'Actuel' : l.annee} : ${fmt0(l.irMensuel)} DH`).join(', ')}>
        {sim.lignes.map((l, i) => {
          const hIr = (l.irMensuel / max) * H;
          const hGain = (Math.max(0, l.gainVsActuel) / max) * H;
          return (
            <div key={String(l.annee)} className="flex flex-col items-center">
              <span className={`num mb-1 text-[10.5px] font-extrabold sm:text-[11.5px] ${i === 0 ? 'text-muted' : 'text-gain-700'}`}>
                {i === 0 ? ' ' : l.gainVsActuel > 0.5 ? `−${fmt0(l.gainVsActuel)}` : '0'}
              </span>
              <div className="flex w-full max-w-[56px] flex-col justify-end" style={{ height: H }}>
                {hGain > 0.5 && (
                  <div
                    className="bar w-full rounded-t-md border border-b-0 border-dashed border-gain-600"
                    style={{
                      height: hGain,
                      animationDelay: `${i * 60 + 200}ms`,
                      background: 'repeating-linear-gradient(135deg, #d6f2e4 0 5px, #ecf9f2 5px 10px)',
                    }}
                  />
                )}
                <div
                  className={`bar w-full ${hGain > 0.5 ? '' : 'rounded-t-md'} ${i === 0 ? 'bg-navy-900' : 'bg-navy-700'}`}
                  style={{ height: Math.max(hIr, 2), animationDelay: `${i * 60}ms` }}
                />
              </div>
              <span className="num mt-1.5 text-[11px] font-bold text-ink sm:text-xs">{fmt0(l.irMensuel)}</span>
              <span className={`text-[10.5px] font-semibold ${i === 0 ? 'text-navy-800' : 'text-muted'}`}>
                {l.annee === 'actuel' ? 'Actuel' : l.annee}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
