import { describe, expect, it } from 'vitest';
import { fullCite, shortCite } from '@/lib/citation';
import { toRoman } from '@/lib/roman';
import { seededOrder } from '@/lib/shuffle';
import { formatTime } from '@/store/player';

describe('citations', () => {
  it('formats short and full citations', () => {
    expect(shortCite('LG-8')).toBe('LG §8');
    expect(fullCite('LG-8', { promulgated: '1964-11-21' }, 'nl')).toBe('LG §8 (Tweede Vaticaans Concilie, 1964)');
    expect(fullCite('DH-2', { promulgated: '1965-12-07' }, 'en')).toBe('DH §2 (Second Vatican Council, 1965)');
  });
});

describe('roman numerals', () => {
  it('renders the Council years', () => {
    expect(toRoman(1962)).toBe('MCMLXII');
    expect(toRoman(1965)).toBe('MCMLXV');
    expect(toRoman(4)).toBe('IV');
  });
});

describe('seededOrder', () => {
  it('is a stable permutation', () => {
    const a = seededOrder('church-lg-0', 3);
    expect(a).toEqual(seededOrder('church-lg-0', 3));
    expect([...a].sort()).toEqual([0, 1, 2]);
  });
  it('spreads correct answers across positions', () => {
    const positions = new Set(Array.from({ length: 30 }, (_, i) => seededOrder(`q-${i}`, 3).indexOf(1)));
    expect(positions.size).toBe(3);
  });
});

describe('formatTime', () => {
  it('formats seconds as m:ss', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(192.4)).toBe('3:12');
  });
});
