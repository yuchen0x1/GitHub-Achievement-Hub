/**
 * 勋章分类 —— 对应需求中的 A~G 七类。
 * 与后台「分类管理」一一对应，可动态调整。
 */
export interface CategorySeed {
  slug: string;
  nameEn: string;
  nameZh: string;
  descriptionEn: string;
  descriptionZh: string;
  icon: string;
  colorHex: string;
  sortOrder: number;
}

export const CATEGORIES: CategorySeed[] = [
  {
    slug: 'currently-obtainable',
    nameEn: 'Currently Obtainable',
    nameZh: '当前可获取勋章',
    descriptionEn:
      'Achievements you can unlock right now through normal GitHub activity.',
    descriptionZh:
      '通过正常的 GitHub 活动即可解锁的勋章，通常只需要创建 PR、提交 Issue、回答问题等常规操作。',
    icon: 'Sparkles',
    colorHex: '#3fb950',
    sortOrder: 1,
  },
  {
    slug: 'tiered',
    nameEn: 'Tiered Achievements',
    nameZh: '等级型勋章',
    descriptionEn:
      'Achievements that progress through Default → Bronze → Silver → Gold as your count grows.',
    descriptionZh:
      '随着累计数量增长依次解锁 Default → Bronze → Silver → Gold 四个等级的勋章。',
    icon: 'TrendingUp',
    colorHex: '#58a6ff',
    sortOrder: 2,
  },
  {
    slug: 'single-level',
    nameEn: 'Single-level Achievements',
    nameZh: '单等级勋章',
    descriptionEn: 'Achievements that are either unlocked or not — no tier progression.',
    descriptionZh: '只有「已获得 / 未获得」两种状态，不存在等级阶梯的勋章。',
    icon: 'Award',
    colorHex: '#a371f7',
    sortOrder: 3,
  },
  {
    slug: 'limited',
    nameEn: 'Limited-time Achievements',
    nameZh: '历史限定勋章',
    descriptionEn:
      'Achievements that were only available during a specific event or window.',
    descriptionZh:
      '仅在特定活动期间或满足特定条件时才发放的纪念性勋章，现已无法获得。',
    icon: 'CalendarClock',
    colorHex: '#d29922',
    sortOrder: 4,
  },
  {
    slug: 'discontinued',
    nameEn: 'Discontinued Achievements',
    nameZh: '已停止发放勋章',
    descriptionEn:
      'Achievements GitHub has stopped awarding. Existing badges remain on profiles.',
    descriptionZh:
      'GitHub 已停止发放此类勋章，但已获得的徽章仍会保留在个人资料页上。',
    icon: 'Ban',
    colorHex: '#8b949e',
    sortOrder: 5,
  },
  {
    slug: 'experimental',
    nameEn: 'Experimental / Unclear',
    nameZh: '测试中或状态不明',
    descriptionEn:
      'Achievements whose current availability cannot be confirmed from public sources.',
    descriptionZh:
      '当前是否仍可获取无法从公开来源确认的勋章，本站会明确标注「状态待核实」。',
    icon: 'HelpCircle',
    colorHex: '#f85149',
    sortOrder: 6,
  },
  {
    slug: 'special',
    nameEn: 'Special / Internal',
    nameZh: '特殊身份与内部专属',
    descriptionEn:
      'Program badges and internal-only achievements for staff or special programs.',
    descriptionZh:
      '属于项目计划徽章或仅对 GitHub 内部人员、特定项目成员开放的特殊身份标识。',
    icon: 'ShieldCheck',
    colorHex: '#39c5cf',
    sortOrder: 7,
  },
];
