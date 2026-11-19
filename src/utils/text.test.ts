import { contentDirection, lowerFirst } from './text';

describe('lowerFirst', () => {
  it('lowercases ordinary starts but keeps "I" and acronyms', () => {
    expect(lowerFirst('Walk for 2 minutes.')).toBe('walk for 2 minutes');
    expect(lowerFirst('I drink coffee')).toBe('I drink coffee');
    expect(lowerFirst("I'm stressed")).toBe("I'm stressed");
    expect(lowerFirst('NHS call')).toBe('NHS call');
  });
});

describe('contentDirection', () => {
  it('follows the first letter with a direction', () => {
    expect(contentDirection('٣ أيام بدون تدخين')).toBe('rtl');
    expect(contentDirection('3 days, نور')).toBe('ltr');
    expect(contentDirection('🎉 12 — שלום')).toBe('rtl');
    expect(contentDirection('🎉 12')).toBeUndefined();
  });
});
