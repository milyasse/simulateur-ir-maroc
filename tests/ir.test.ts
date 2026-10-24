import { test } from 'node:test';
import assert from 'node:assert/strict';
import { irMensuel, rniDepuisIr, ANNEES_REFORME, type Annee } from '../src/shared/bareme.ts';
import { simuler, type Entrees } from '../src/shared/paie.ts';

const r2 = (n: number) => Math.round(n * 100) / 100;

// Tableau « 5. Gain additionnel à chaque nouvelle année » (PLF n° 60.26, 23 octobre 2026) :
// RNI mensuel → gains 2027 vs 26, 2028 vs 27, 2029 vs 28, 2030 vs 29, 2031 vs 30.
const TABLEAU_5: [number, number[]][] = [
  [3000, [0, 0, 0, 0, 0]],
  [3333.33, [0, 0, 0, 0, 0]],
  [4000, [66.67, 0, 0, 0, 0]],
  [4500, [116.67, 0, 0, 0, 0]],
  [5000, [166.67, 0, 0, 0, 0]],
  [5500, [216.67, 0, 0, 0, 0]],
  [6000, [266.67, 0, 0, 0, 0]],
  [6500, [316.67, 0, 0, 0, 0]],
  [7000, [366.67, 33.33, 0, 0, 0]],
  [7500, [416.67, 83.33, 0, 0, 0]],
  [8000, [466.67, 133.33, 0, 0, 0]],
  [8500, [500, 181.67, 25, 0, 0]],
  [9000, [500, 226.67, 100, 0, 0]],
  [9500, [500, 271.67, 175, 0, 0]],
  [10000, [500, 316.67, 250, 0, 0]],
  [11000, [500, 406.67, 383.33, 16.67, 0]],
  [12000, [500, 496.67, 433.33, 116.67, 0]],
  [12500, [500, 541.67, 458.33, 166.67, 0]],
  [13000, [500, 586.67, 483.33, 166.67, 0]],
  [14000, [500, 676.67, 533.33, 166.67, 0]],
  [15000, [500, 766.67, 583.33, 166.67, 0]],
  [16000, [500, 886.67, 633.33, 166.67, 0]],
  [17000, [500, 966.67, 673.33, 183.33, 33.33]],
  [18000, [500, 966.67, 693.33, 233.33, 133.33]],
  [20000, [500, 966.67, 733.33, 333.33, 333.33]],
  [22000, [500, 966.67, 773.33, 433.33, 533.33]],
  [25000, [500, 966.67, 833.33, 583.33, 833.33]],
  [30000, [500, 966.67, 933.33, 833.33, 1333.33]],
  [35000, [500, 966.67, 1033.33, 1083.33, 1833.33]],
  [40000, [500, 966.67, 1133.33, 1333.33, 2333.33]],
  [41666.67, [500, 966.67, 1166.67, 1416.67, 2500]],
  [50000, [500, 966.67, 1333.33, 1833.33, 2500]],
];

test('reproduit le tableau 5 du PLF (gain additionnel à chaque nouvelle année)', () => {
  for (const [rni, attendus] of TABLEAU_5) {
    let prec: Annee = 'actuel';
    ANNEES_REFORME.forEach((annee, i) => {
      const gain = r2(irMensuel(rni, prec) - irMensuel(rni, annee));
      assert.ok(Math.abs(gain - attendus[i]) <= 0.011, `RNI ${rni}, ${annee} : ${gain} ≠ ${attendus[i]}`);
      prec = annee;
    });
  }
});

const base: Entrees = { mode: 'prive', brut: 0, personnes: 0, cimrTaux: 0, cmr: 0, amo: 0, mutuelles: 0, autres: 0, irBulletin: 0, rni: 0 };

test('salarié du privé, brut 32 000 DH', () => {
  const s = simuler({ ...base, brut: 32_000 });
  assert.equal(r2(s.base.rni), 28_091.33);
  assert.deepEqual(s.lignes.map((l) => r2(l.irMensuel)), [8110.46, 7610.46, 6643.79, 5748.63, 5010.73, 3868.27]);
  assert.equal(r2(s.lignes[0].netMensuel), 22_897.54);
  assert.equal(r2(s.lignes[5].netMensuel), 27_139.73);
});

test('fonctionnaire : RNI retrouvé à partir de l’IR du bulletin', () => {
  const s = simuler({ ...base, mode: 'public', brut: 41_933.69, cmr: 2628.33, amo: 400, mutuelles: 180, autres: 30, irBulletin: 10_318.38 });
  assert.equal(s.base.source, 'bulletin');
  assert.equal(r2(s.base.rni), 34_058.68);
  assert.deepEqual(s.lignes.map((l) => r2(l.irMensuel)), [10318.38, 9818.38, 8851.71, 7837.21, 6800.94, 5061.74]);
  assert.equal(r2(s.lignes[0].netMensuel), 28_376.98);
  assert.equal(r2(s.lignes[5].netMensuel), 33_633.62);
});

test('charges de famille : 500 DH/an par personne, 6 au plus, IR jamais négatif', () => {
  assert.equal(r2(irMensuel(10_000, 'actuel', 0) - irMensuel(10_000, 'actuel', 2)), 83.33);
  assert.equal(r2(irMensuel(10_000, 'actuel', 6)), r2(irMensuel(10_000, 'actuel', 9)));
  assert.equal(irMensuel(4_000, 2027, 3), 0);
});

test('l’inversion IR → RNI est cohérente', () => {
  for (const rni of [4_000, 9_999, 17_500, 60_000]) {
    for (const p of [0, 3]) if (irMensuel(rni, "actuel", p) > 0) assert.ok(Math.abs(rniDepuisIr(irMensuel(rni, 'actuel', p), p) - rni) < 0.01);
  }
});
