/** 生成 URL 友好的 slug（支持中文时保留字母数字，其余转连字符） */
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

/** 从 Markdown 文本估算阅读时间（分钟），按中英文混合字数计算 */
export function estimateReadingTime(content: string): number {
  const text = content.replace(/```[\s\S]*?```/g, '').replace(/[#>*`_\-\[\]()!]/g, '');
  const cjk = (text.match(/[\u4e00-\u9fa5]/g) ?? []).length;
  const latin = (text.match(/[a-zA-Z0-9]+/g) ?? []).length;
  const minutes = cjk / 350 + latin / 200;
  return Math.max(1, Math.round(minutes));
}

/** 生成文章目录（基于 Markdown 标题） */
export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function extractToc(markdown: string): TocItem[] {
  const items: TocItem[] = [];
  const re = /^(#{2,4})\s+(.+)$/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown)) !== null) {
    const text = match[2].replace(/[*_`]/g, '').trim();
    const id = slugify(text);
    items.push({ id, text, level: match[1].length });
  }
  return items;
}

/** 截断文本 */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}
