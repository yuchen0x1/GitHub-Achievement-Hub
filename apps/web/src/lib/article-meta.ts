/** 文章分类（12 类）—— 与后端 ArticleCategory 枚举一一对应 */
export const ARTICLE_CATEGORY_META: Record<
  string,
  { label: string; labelEn: string; color: string; description: string }
> = {
  GETTING_STARTED: {
    label: '新手入门',
    labelEn: 'Getting Started',
    color: '#3fb950',
    description: '第一次使用 GitHub，从注册到第一个仓库的完整路径。',
  },
  GIT_BASICS: {
    label: 'Git 基础',
    labelEn: 'Git Basics',
    color: '#58a6ff',
    description: '提交、分支、合并与远程协作的核心概念。',
  },
  REPOSITORY: {
    label: '仓库管理',
    labelEn: 'Repository',
    color: '#a371f7',
    description: '仓库设置、可见性、主题与个人资料展示。',
  },
  ISSUES: {
    label: 'Issues',
    labelEn: 'Issues',
    color: '#d29922',
    description: '提交、认领与关闭 Issue 的规范做法。',
  },
  PULL_REQUESTS: {
    label: 'Pull Requests',
    labelEn: 'Pull Requests',
    color: '#f85149',
    description: '从 fork 到合并，PR 的完整生命周期与评审礼仪。',
  },
  DISCUSSIONS: {
    label: 'Discussions',
    labelEn: 'Discussions',
    color: '#db61a2',
    description: '仓库 Discussions 与 GitHub Community Discussions 的区别。',
  },
  ACTIONS: {
    label: 'Actions',
    labelEn: 'Actions',
    color: '#2f81f7',
    description: '用 CI 自动化构建、测试与发布流程。',
  },
  OPEN_SOURCE: {
    label: '开源贡献',
    labelEn: 'Open Source',
    color: '#3fb950',
    description: '找到合适的项目，完成第一次被合并的贡献。',
  },
  SPONSORS: {
    label: 'Sponsors',
    labelEn: 'Sponsors',
    color: '#ea4aaa',
    description: 'GitHub Sponsors 机制与开源维护者支持。',
  },
  ACHIEVEMENT_TIPS: {
    label: '成就技巧',
    labelEn: 'Achievement Tips',
    color: '#e3b341',
    description: '用真实、可持续的方式积累贡献，让勋章自然到手。',
  },
  TIER_PROGRESSION: {
    label: '等级进阶',
    labelEn: 'Tier Progression',
    color: '#c0c6d1',
    description: 'Default → Bronze → Silver → Gold 的进阶节奏与门槛说明。',
  },
  TROUBLESHOOTING: {
    label: '异常排查',
    labelEn: 'Troubleshooting',
    color: '#8b949e',
    description: '勋章未出现、同步失败、贡献设置异常的处理办法。',
  },
};

export const ARTICLE_CATEGORY_ORDER = Object.keys(ARTICLE_CATEGORY_META);

export function articleCategoryMeta(category: string) {
  return (
    ARTICLE_CATEGORY_META[category] ?? {
      label: '攻略',
      labelEn: 'Guide',
      color: 'var(--color-accent)',
      description: '',
    }
  );
}
