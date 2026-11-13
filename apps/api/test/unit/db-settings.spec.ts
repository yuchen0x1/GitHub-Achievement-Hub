import {
  assertExternalPgliteReuse,
  resolveDbSettings,
} from '../../src/config/db-settings';

describe('PGlite isolation settings', () => {
  it('refuses to attach to an occupied port unless external reuse is explicit', () => {
    expect(() => assertExternalPgliteReuse(55432, true, false)).toThrow(
      /为避免连接到其他项目的数据库/,
    );
    expect(assertExternalPgliteReuse(55432, true, true)).toBe(true);
    expect(assertExternalPgliteReuse(55432, false, false)).toBe(false);
  });

  it('does not enable external reuse by default', () => {
    const previous = process.env.PGLITE_REUSE_EXTERNAL;
    delete process.env.PGLITE_REUSE_EXTERNAL;
    try {
      expect(resolveDbSettings().reuseExternalPglite).toBe(false);
    } finally {
      if (previous === undefined) delete process.env.PGLITE_REUSE_EXTERNAL;
      else process.env.PGLITE_REUSE_EXTERNAL = previous;
    }
  });
});
