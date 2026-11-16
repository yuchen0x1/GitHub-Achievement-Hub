import { boundedPositiveInt } from '../../src/common/utils/number.util';

describe('boundedPositiveInt', () => {
  it('keeps valid integer values within the configured maximum', () => {
    expect(boundedPositiveInt('12', 20, 50)).toBe(12);
    expect(boundedPositiveInt('999', 20, 50)).toBe(50);
  });

  it.each(['', '0', '-1', '1.5', 'nope', undefined, null])(
    'falls back for invalid value %p',
    (value) => {
      expect(boundedPositiveInt(value, 20, 50)).toBe(20);
    },
  );
});
