import { oauthOriginKey, sanitizeRedirect } from '../../src/common/utils/redirect.util';

describe('sanitizeRedirect', () => {
  it('allows safe in-app paths', () => {
    expect(sanitizeRedirect('/collection')).toBe('/collection');
    expect(sanitizeRedirect('/search?q=badge')).toBe('/search?q=badge');
  });

  it.each([null, undefined, '', 'https://example.com', '//example.com', '/\\\\example.com'])(
    'falls back to the site root for unsafe paths (%s)',
    (input) => {
      expect(sanitizeRedirect(input)).toBe('/');
    },
  );
});

describe('oauthOriginKey', () => {
  it('preserves an allowlisted custom app scheme and authority', () => {
    expect(oauthOriginKey(new URL('capacitor://localhost/callback'))).toBe(
      'capacitor://localhost',
    );
    expect(oauthOriginKey(new URL('tauri://localhost/callback'))).toBe(
      'tauri://localhost',
    );
  });

  it('does not collapse unrelated opaque URL schemes to the same null origin', () => {
    expect(oauthOriginKey(new URL('javascript:alert(1)'))).toBe('javascript://');
    expect(oauthOriginKey(new URL('data:text/html,hello'))).toBe('data://');
    expect(oauthOriginKey(new URL('javascript:alert(1)'))).not.toBe(
      oauthOriginKey(new URL('capacitor://localhost/callback')),
    );
  });

  it('uses the standard origin for web URLs', () => {
    expect(oauthOriginKey(new URL('https://example.com/callback'))).toBe(
      'https://example.com',
    );
  });
});
