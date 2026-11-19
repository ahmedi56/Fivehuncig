import { featureOn } from './features';

describe('feature switches', () => {
  it('are on in development and off in release unless the build says otherwise', () => {
    expect(featureOn(undefined, true)).toBe(true);
    expect(featureOn(undefined, false)).toBe(false);
    expect(featureOn('', false)).toBe(false);
    expect(featureOn('1', false)).toBe(true);
    expect(featureOn('0', true)).toBe(false);
    expect(featureOn('yes', false)).toBe(false);
  });
});
