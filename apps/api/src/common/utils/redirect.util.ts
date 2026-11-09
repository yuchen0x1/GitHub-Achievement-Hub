/**
 * 开放重定向防护。
 * 只允许站内相对路径，禁止协议相对地址（//evil.com）与绝对 URL。
 */
export function sanitizeRedirect(input: string | undefined | null): string {
  if (!input) return '/';
  const value = input.trim();
  if (!value.startsWith('/')) return '/';
  if (value.startsWith('//') || value.startsWith('/\\')) return '/';
  if (/^\/[\\]/.test(value)) return '/';
  // 拒绝包含控制字符或换行的地址（防止 header 注入）
  if (/[\r\n\0]/.test(value)) return '/';
  return value;
}
