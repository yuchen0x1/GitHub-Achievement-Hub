import {
  estimateReadingTime,
  extractToc,
  slugify,
  truncate,
} from '../../src/common/utils/text.util';

describe('slugify', () => {
  it('把英文名称转为小写连字符 slug', () => {
    expect(slugify('Pull Shark')).toBe('pull-shark');
  });

  it('保留中文字符，并把空格转换为连字符，首尾无连字符', () => {
    const slug = slugify('银河大脑 Galaxy Brain');
    expect(slug).toBe('银河大脑-galaxy-brain');
    // 双重保障：含中文、含连字符、首尾不是连字符
    expect(slug).toMatch(/[\u4e00-\u9fa5]/);
    expect(slug).toContain('-');
    expect(slug.startsWith('-')).toBe(false);
    expect(slug.endsWith('-')).toBe(false);
  });

  it('去除引号并合并连续分隔符', () => {
    expect(slugify("  Don't   Panic!  ")).toBe('dont-panic');
  });

  it('空字符串回退为 untitled', () => {
    expect(slugify('')).toBe('untitled');
  });

  it('仅由符号组成的字符串同样回退为 untitled', () => {
    expect(slugify('!!!???')).toBe('untitled');
  });
});

describe('estimateReadingTime', () => {
  it('空内容至少返回 1 分钟', () => {
    expect(estimateReadingTime('')).toBe(1);
  });

  it('纯代码块不计入阅读时间', () => {
    const markdown = ['```ts', 'const a = 1;'.repeat(200), '```'].join('\n');
    expect(estimateReadingTime(markdown)).toBe(1);
  });

  it('较长中文正文的估算随字数增加', () => {
    const chinese = '中'.repeat(1400); // 1400 / 350 = 4 分钟
    expect(estimateReadingTime(chinese)).toBe(4);
  });

  it('中英混排结果为正整数', () => {
    const value = estimateReadingTime('# 标题\n\nSome English text here.\n\n中文段落内容。');
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(1);
  });
});

describe('extractToc', () => {
  const markdown = [
    '# 一级标题不应进入目录',
    '',
    '## 快速开始',
    '',
    '正文段落',
    '',
    '### Getting Started',
    '',
    '更多正文',
    '',
    '#### **深入** `Git`',
    '',
    '##### 五级标题不进入目录',
  ].join('\n');

  it('只提取 ## / ### / #### 级别的标题', () => {
    const toc = extractToc(markdown);

    expect(toc).toHaveLength(3);
    expect(toc.map((item) => item.level)).toEqual([2, 3, 4]);
  });

  it('文本与 id 均正确（去除语法标记并 slugify）', () => {
    const toc = extractToc(markdown);

    expect(toc[0]).toEqual({ id: '快速开始', text: '快速开始', level: 2 });
    expect(toc[1]).toEqual({ id: 'getting-started', text: 'Getting Started', level: 3 });
    expect(toc[2]).toEqual({ id: '深入-git', text: '深入 Git', level: 4 });
  });

  it('没有标题时返回空数组', () => {
    expect(extractToc('只是一段普通文本\n\n没有标题')).toEqual([]);
  });
});

describe('truncate', () => {
  it('长度小于上限时原样返回', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('长度恰好等于上限时原样返回（边界）', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('超长时截断并追加省略号', () => {
    expect(truncate('hello world', 5)).toBe('hello…');
  });

  it('空字符串返回空字符串', () => {
    expect(truncate('', 0)).toBe('');
  });

  it('上限为 0 的非空文本只返回省略号', () => {
    expect(truncate('abc', 0)).toBe('…');
  });

  it('中文按字符截断', () => {
    expect(truncate('中文内容很长', 2)).toBe('中文…');
  });
});
