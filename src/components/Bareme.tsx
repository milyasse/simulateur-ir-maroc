import { ANNEES, LIGNES_TABLEAU, tauxPour } from '../shared/bareme.ts';
import { fmt0, fmtPct, fmtPlafond } from '../shared/format.ts';

// Teinte selon le taux, du plus clair (exonéré) au plus foncé (37 %), comme le tableau du PLF.
function teinte(taux: number): { bg: string; fg: string } {
  if (taux === 0) return { bg: '#f1f4f8', fg: '#6b7a8d' };
  const k = Math.min(1, taux / 0.37);
  const l = 94 - k * 62; // luminosité 94 % → 32 %
  return { bg: `hsl(212 58% ${l}%)`, fg: l < 58 ? '#fff' : '#0b2a4f' };
}

export function Bareme({ rniAnnuel }: { rniAnnuel: number }) {
  return (
    <section className="card overflow-hidden" aria-labelledby="titre-bareme">
      <div className="px-4 pt-4 sm:px-5">
        <h2 id="titre-bareme" className="text-[15px] font-extrabold tracking-tight text-navy-900">Barème : actuel et PLF 2027 → 2031</h2>
        <p className="mt-1 text-[12px] text-muted">
          Taux appliqués au revenu net imposable, tranche par tranche. La ligne encadrée contient votre dernier dirham.
        </p>
      </div>
      <div className="mt-3 overflow-x-auto pb-1">
        <table className="num w-full min-w-[620px] border-separate border-spacing-[3px] px-2 text-[12px] sm:px-3">
          <thead>
            <tr className="text-[10.5px] font-bold uppercase tracking-wide text-muted">
              <th scope="col" className="sticky left-0 z-10 bg-card px-2 py-1.5 text-left">Tranche annuelle</th>
              <th scope="col" className="px-2 py-1.5 text-left">Mensuel</th>
              {ANNEES.map((a) => (
                <th key={String(a)} scope="col" className={`px-1 py-1.5 text-center ${a === 'actuel' ? 'text-navy-900' : ''}`}>
                  {a === 'actuel' ? 'Actuel' : a}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LIGNES_TABLEAU.map(([bas, haut]) => {
              const ici = rniAnnuel > bas && rniAnnuel <= haut;
              return (
                <tr key={bas}>
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 whitespace-nowrap rounded-lg px-2 py-2 text-left font-bold ${
                      ici ? 'bg-navy-800 text-white' : 'bg-bg text-ink'
                    }`}
                  >
                    {Number.isFinite(haut) ? `${fmt0(bas === 0 ? 0 : bas + 1)} → ${fmtPlafond(haut)}` : `> ${fmt0(bas)}`}
                  </th>
                  <td className={`whitespace-nowrap rounded-lg px-2 py-2 text-muted ${ici ? 'bg-navy-50 font-bold text-navy-800' : 'bg-bg'}`}>
                    {Number.isFinite(haut) ? `${fmt0(bas / 12)} → ${fmt0(haut / 12)}` : `> ${fmt0(bas / 12)}`}
                  </td>
                  {ANNEES.map((a) => {
                    const tx = tauxPour(a, Number.isFinite(haut) ? haut : bas + 1);
                    const c = teinte(tx);
                    return (
                      <td
                        key={String(a)}
                        className="rounded-lg px-1 py-2 text-center font-bold"
                        style={{ background: c.bg, color: c.fg, boxShadow: ici ? 'inset 0 0 0 2px #0a8a5c' : undefined }}
                      >
                        {tx === 0 ? 'Exonéré' : fmtPct(tx)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-4 pb-4 pt-2 text-[11.5px] text-muted sm:px-5">
        Source : PLF 2027 (projet de loi de finances n° 60.26 du 23 octobre 2026), pas encore voté et susceptible d’être amendé.
      </p>
    </section>
  );
}
