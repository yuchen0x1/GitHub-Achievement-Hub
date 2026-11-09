export interface FaqSeed {
  slug: string;
  question: string;
  questionZh: string;
  answer: string;
  answerZh: string;
  category: string;
  sortOrder: number;
}

/**
 * 常见问题。
 * 所有答案均基于 GitHub 官方文档的公开表述 + 社区实测经验，
 * 明确区分「官方说明」与「社区观察」。
 */
export const FAQS: FaqSeed[] = [
  {
    slug: 'what-are-github-achievements',
    question: 'What are GitHub Profile Achievements?',
    questionZh: '什么是 GitHub 个人资料成就（Achievements）？',
    answer:
      'Achievements are small badges that GitHub awards automatically for specific actions on the platform. ' +
      'They appear in the sidebar of your profile, and hovering over one shows a short description plus links ' +
      'to the contributing events. GitHub describes this feature as being in public preview and subject to change, ' +
      'so the set of achievements and their rules may evolve at any time. ' +
      'Source: GitHub Docs — Profile reference (Earning Achievements).',
    answerZh:
      '成就是 GitHub 针对你在平台上的特定行为自动授予的小徽章，会显示在个人资料页侧边栏。' +
      '悬停徽章可以看到简短的说明以及指向贡献事件的链接。GitHub 官方将该功能标注为「公开预览（public preview）阶段，随时可能变更」，' +
      '因此成就的种类与规则都可能随时调整。' +
      '来源：GitHub 官方文档 — Profile reference（Earning Achievements）。',
    category: 'basics',
    sortOrder: 1,
  },
  {
    slug: 'where-do-achievements-show',
    question: 'Where do achievements appear on my profile?',
    questionZh: '勋章会显示在个人资料的什么位置？',
    answer:
      'Achievements appear as small badges in the sidebar of your profile. Hovering or clicking a badge opens a ' +
      'detailed view that hints at how it was earned, including links to the contributing events. Those event links ' +
      'are only visible to users who already have access to the repository or organization involved.',
    answerZh:
      '成就以小徽章的形式出现在个人资料页的侧边栏。悬停或点击徽章会打开一个详情视图，' +
      '提示该成就是如何获得的，并附带指向贡献事件的链接。' +
      '这些事件链接仅对已经拥有相关仓库或组织访问权限的用户可见。',
    category: 'basics',
    sortOrder: 2,
  },
  {
    slug: 'how-to-view-own-achievements',
    question: 'How can I see which achievements I already own?',
    questionZh: '怎样查看自己已经拥有的勋章？',
    answer:
      'Open your own profile page and look at the achievements section in the sidebar. ' +
      'This site also provides a "My Collection" area where you can manually record the achievements you have, ' +
      'your tier level and the date you obtained them — useful because GitHub does not expose a public API for ' +
      'reading a user\'s full achievement list or tier levels.',
    answerZh:
      '打开你自己的个人资料页，查看侧边栏中的成就区域即可。' +
      '本站还提供「我的收藏馆」，可以手动记录你已获得的勋章、当前等级和获得日期 —— ' +
      '这一点尤其有用，因为 GitHub 并未提供用于读取用户完整成就列表与等级的公开 API。',
    category: 'basics',
    sortOrder: 3,
  },
  {
    slug: 'can-i-see-others-achievements',
    question: 'Can this site tell me whether another person owns a specific achievement?',
    questionZh: '本站能查出别人是否拥有某枚具体勋章吗？',
    answer:
      'No — and we will not pretend otherwise. The GitHub REST API does not expose the full Profile Achievements ' +
      'list for a user, nor the tier levels. The public lookup on this site therefore only marks badges that the API ' +
      'actually returned as "obtained". Everything else is explicitly shown as "data unavailable" rather than ' +
      '"not obtained", because the two are very different things.',
    answerZh:
      '不能，我们也不会假装可以。GitHub REST API 并不公开用户的完整成就列表，也不公开等级信息。' +
      '因此本站的公开查询只会把 API 确实返回的徽章标记为「已获得」，' +
      '其余一律显示为「数据不可用」而不是「未获得」—— 这两者有本质区别。',
    category: 'api',
    sortOrder: 4,
  },
  {
    slug: 'why-not-awarded',
    question: 'I did the action but no achievement appeared. Why?',
    questionZh: '我已经完成了操作，为什么没有出现勋章？',
    answer:
      'The most common causes are: (1) private contributions are excluded by default — GitHub lets you opt in ' +
      'or opt out of counting private contributions, and you can also turn Achievements off entirely in your ' +
      'contribution settings; (2) the action happened before the achievement was enabled for your account; ' +
      '(3) the behaviour does not match the achievement rule exactly, e.g. the PR was not actually merged, or was ' +
      'closed rather than merged; (4) achievements are still in public preview and GitHub changes the rules ' +
      'without notice. Check your contribution settings first.',
    answerZh:
      '常见原因有：(1) 默认不计入私有贡献 —— GitHub 允许你在贡献设置中选择是否计入私有贡献，也可以完全关闭成就功能；' +
      '(2) 行为发生在你的账号启用该成就之前；' +
      '(3) 行为没有精确匹配成就规则，例如 PR 并未被合并、或是被关闭而非合并；' +
      '(4) 成就功能仍处于公开预览阶段，GitHub 可能在不提前通知的情况下调整规则。' +
      '建议优先检查你的贡献设置。',
    category: 'troubleshooting',
    sortOrder: 5,
  },
  {
    slug: 'how-long-to-appear',
    question: 'How long does it take for an achievement to appear?',
    questionZh: '勋章多久会出现？',
    answer:
      'GitHub does not publish an official processing time. In community observation the badge is usually visible ' +
      'shortly after the triggering event, but caching and the public-preview nature of the feature mean it can ' +
      'take longer in some cases. If a badge never appears, re-check the contributing event link on the badge ' +
      '(when present) to confirm the action registered at all.',
    answerZh:
      'GitHub 官方并未公布处理时长。根据社区观察，徽章通常在触发事件后不久出现，' +
      '但由于缓存机制与该功能仍处于公开预览阶段，个别情况下可能需要更长时间。' +
      '如果徽章始终没有出现，可以在徽章上悬停查看贡献事件链接，确认该行为是否被记录。',
    category: 'troubleshooting',
    sortOrder: 6,
  },
  {
    slug: 'do-private-repos-count',
    question: 'Do contributions from private repositories count?',
    questionZh: '私有仓库的贡献是否计算？',
    answer:
      'By default, private contributions do not count towards Achievements. GitHub provides a setting to make ' +
      'private contributions count (and to change how they are displayed), and also a setting to turn Achievements ' +
      'off entirely. See GitHub Docs — "Setting your preferences for private contributions".',
    answerZh:
      '默认情况下，私有贡献不会计入成就。GitHub 提供了设置项可以开启私有贡献计入（并调整其展示方式），' +
      '同时也提供完全关闭成就功能的选项。参见 GitHub 官方文档「设置私有贡献偏好」。',
    category: 'rules',
    sortOrder: 7,
  },
  {
    slug: 'do-my-own-repos-count',
    question: 'Do contributions to my own repository count?',
    questionZh: '自己的仓库是否可以获得勋章？',
    answer:
      'For most achievements the action is what matters, not who owns the repository — a pull request you open and ' +
      'merge in your own repository still counts as a merged pull request. However, some achievements are explicitly ' +
      'defined around collaboration with other people (for example co-authored commits), and those require a ' +
      'genuinely different co-author. The exact behaviour for each achievement is documented on its detail page, ' +
      'together with the credibility grade of that information.',
    answerZh:
      '对大多数成就而言，关键在于行为本身，而不是仓库属于谁 —— 你在自己仓库中发起并合并的 PR，' +
      '仍然算作一次已合并的拉取请求。' +
      '但部分成就明确围绕「与他人协作」定义（例如共同署名的提交），这类成就需要真实存在的另一位共同作者。' +
      '每一枚成就详情页都记录了具体行为与该信息的可信度等级。',
    category: 'rules',
    sortOrder: 8,
  },
  {
    slug: 'are-thresholds-official',
    question: 'Are the tier thresholds published by GitHub?',
    questionZh: '等级门槛是 GitHub 官方公布的吗？',
    answer:
      'No. GitHub\'s current documentation describes the Achievements feature and its public-preview status, but it ' +
      'does not publish a table of per-achievement tier thresholds. The thresholds documented on this site come from ' +
      'consistent community reporting and are graded accordingly — each tier on this site carries its own credibility ' +
      'grade so you can see exactly how well-supported it is. Anything we could not corroborate is marked as ' +
      'uncertain rather than presented as fact.',
    answerZh:
      '不是。GitHub 目前的文档介绍了成就功能本身及其公开预览状态，但没有公布各成就等级门槛的对照表。' +
      '本站记录的门槛来自多个社区来源的一致报告，并据此标注可信度 —— 每个等级都单独标注了可信度等级，' +
      '便于你判断该数据的支撑程度。无法交叉验证的信息会被明确标记为「状态待核实」，而不会当作事实呈现。',
    category: 'trust',
    sortOrder: 9,
  },
  {
    slug: 'can-achievements-be-disabled',
    question: 'Can I turn achievements off?',
    questionZh: '可以关闭成就功能吗？',
    answer:
      'Yes. GitHub provides contribution settings where you can control whether private contributions count and ' +
      'whether achievements are displayed at all.',
    answerZh:
      '可以。GitHub 在贡献设置中提供了控制开关，可以决定私有贡献是否计入，以及是否展示成就。',
    category: 'basics',
    sortOrder: 10,
  },
  {
    slug: 'how-to-contribute-to-oss',
    question: 'Where can I find beginner-friendly open source issues?',
    questionZh: '在哪里可以找到适合新手参与的开源项目？',
    answer:
      'Look for repositories that label issues with "good first issue" or "help wanted", and check whether the project ' +
      'has a CONTRIBUTING.md file. Many projects also list newcomer tasks in their README. ' +
      'Sites that aggregate these labels exist as well — pick one whose entries you can verify by opening the issue ' +
      'page itself before starting.',
    answerZh:
      '可以寻找打了「good first issue」或「help wanted」标签的仓库，并确认项目是否有 CONTRIBUTING.md 文件；' +
      '很多项目也会在 README 中列出新人任务。也有聚合这些标签的第三方站点，' +
      '选择时请以「点进去能核对该 issue 页面确实存在」为准。',
    category: 'contributing',
    sortOrder: 11,
  },
  {
    slug: 'is-there-a-time-limit',
    question: 'Is there a time limit on earning achievements?',
    questionZh: '获取成就有时间限制吗？',
    answer:
      'For the currently obtainable achievements, no fixed time limit has been officially published. ' +
      'Limited-time achievements (such as event badges from past campaigns) had a fixed window and can no longer ' +
      'be earned — those are catalogued separately on this site with the status "discontinued".',
    answerZh:
      '对于当前可获取的成就，官方并未公布任何固定的时间限制。' +
      '而限定类成就（例如往期活动的纪念徽章）有明确的时间窗口，现已无法获得，' +
      '本站将它们单独归类并标注为「已停止发放」。',
    category: 'rules',
    sortOrder: 12,
  },
];
