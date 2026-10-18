/** 1965 → 'MCMLXV'. Used for dates in the Roman style of conciliar editions. */
export function toRoman(n: number): string {
  const map: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'],
    [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let out = '';
  for (const [v, s] of map) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out;
}

const WEEKDAYS = ['Dominica', 'Feria II', 'Feria III', 'Feria IV', 'Feria V', 'Feria VI', 'Sabbato'];
const MONTHS_GEN = ['Ianuarii', 'Februarii', 'Martii', 'Aprilis', 'Maii', 'Iunii', 'Iulii', 'Augusti', 'Septembris', 'Octobris', 'Novembris', 'Decembris'];

/**
 * Date in the style of curial documents: "Dominica, die XVIII mensis Octobris, anno MMXXVI".
 * Weekdays follow ecclesiastical usage (Dominica, Feria II–VI, Sabbato).
 */
export function latinDate(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, die ${toRoman(d.getDate())} mensis ${MONTHS_GEN[d.getMonth()]}, anno ${toRoman(d.getFullYear())}`;
}
