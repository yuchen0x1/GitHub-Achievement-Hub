export function oauthOriginKey(url: URL): string {
  // URL.origin is "null" for custom app schemes as well as javascript:, data:, etc.
  // Preserve the exact scheme + authority so unrelated opaque URLs cannot match.
  return url.origin === 'null' ? `${url.protocol}//${url.host}` : url.origin;
}

export function sanitizeRedirect(input: string | undefined | null): string {
  if (!input) return '/';
  const value = input.trim();
  if (!value.startsWith('/')) return '/';
  if (value.startsWith('//') || value.startsWith('/\\')) return '/';
  if (/^\/[\\]/.test(value)) return '/';
  // Reject control characters and newlines to prevent header injection.
  if (/[\r\n\0]/.test(value)) return '/';
  return value;
}
