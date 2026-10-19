import { describe, expect, it } from 'vitest';
import { chunks, isMale, rankVoices, speakable, voiceLabel } from '@/lib/speech';

const v = (name: string, lang: string, localService = true) => ({ name, lang, voiceURI: name, localService });

describe('voice ranking', () => {
  const voices = [
    v('Google Nederlands', 'nl-NL', false),
    v('Microsoft Frank - Dutch (Netherlands)', 'nl-NL'),
    v('Microsoft Maarten Online (Natural) - Dutch (Netherlands)', 'nl-NL', false),
    v('Microsoft Colette Online (Natural) - Dutch (Netherlands)', 'nl-NL', false),
    v('Xander', 'nl-NL'),
    v('Ellen', 'nl-BE'),
    v('Daniel', 'en-GB'),
    v('Bad News', 'en-US'),
  ];

  it('puts the best male voice first', () => {
    const nl = rankVoices(voices, 'nl');
    expect(nl[0]!.voice.name).toContain('Maarten');
    expect(nl[0]!.male).toBe(true);
    expect(nl[0]!.online).toBe(true);
    expect(nl.filter((r) => r.male).map((r) => voiceLabel(r.voice.name))).toEqual(['Maarten', 'Xander', 'Frank']);
  });

  it('prefers a male desktop voice over a female natural one', () => {
    const nl = rankVoices(voices, 'nl');
    expect(nl.findIndex((r) => r.voice.name.includes('Frank'))).toBeLessThan(nl.findIndex((r) => r.voice.name.includes('Colette')));
  });

  it('keeps to the language and drops novelty voices', () => {
    const en = rankVoices(voices, 'en');
    expect(en.map((r) => r.voice.name)).toEqual(['Daniel']);
  });

  it('does not take "female" for "male"', () => {
    expect(isMale('Google UK English Female')).toBe(false);
    expect(isMale('Google UK English Male')).toBe(true);
  });
});

describe('speakable text', () => {
  const titles = { LG: 'Lumen Gentium', SC: 'Sacrosanctum Concilium' };
  it('expands citations, popes and councils', () => {
    expect(speakable('Zie LG §8 en SC §36–40.', 'nl', titles)).toBe('Zie Lumen Gentium, paragraaf 8 en Sacrosanctum Concilium, paragrafen 36 tot 40.');
    expect(speakable('Pius XII en Johannes XXIII riepen Vaticanum II niet samen.', 'nl')).toBe('Pius de twaalfde en Johannes de drieëntwintigste riepen Vaticanum twee niet samen.');
    expect(speakable('Paul VI closed Vatican II in 1965, cf. LG §1.', 'en', titles)).toBe('Paul the sixth closed Vatican two in 1965, compare Lumen Gentium, paragraph 1.');
  });
  it('removes emphasis marks and writes out abbreviations', () => {
    expect(speakable('Het *subsistit in*, bv. in 1962–1965', 'nl')).toBe('Het subsistit in, bijvoorbeeld in 1962 tot 1965');
  });
});

describe('chunks', () => {
  it('cuts long text at sentence ends', () => {
    const text = 'Een korte zin. '.repeat(40).trim();
    const out = chunks(text, 100);
    expect(out.every((c) => c.length <= 100)).toBe(true);
    expect(out.join(' ')).toBe(text);
  });
});
