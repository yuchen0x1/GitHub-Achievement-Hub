/**
 * 与后端 `slugify` 保持一致的 slug 生成规则，
 * 保证 Markdown 标题的锚点 id 与后端返回的 TOC 完全对应。
 */
export function slugify(input: string): string {
  return (
    input
      .trim()
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled'
  );
}

/** 从 Markdown 文本估算阅读时间（分钟），与后端规则一致 */
export function estimateReadingTime(content: string): number {
  const text = content.replace(/```[\s\S]*?```/g, '').replace(/[#>*`_\-\[\]()!]/g, '');
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const latin = (text.match(/[a-zA-Z0-9]+/g) ?? []).length;
  const minutes = cjk / 350 + latin / 200;
  return Math.max(1, Math.round(minutes));
}
