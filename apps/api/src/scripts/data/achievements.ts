/**
 * GitHub Profile Achievements — 初始资料种子数据
 *
 * 数据来源与可信度说明：
 * - GitHub 官方文档 (docs.github.com/en/account-and-profile/reference/profile-reference)
 *   目前仅介绍「Earning Achievements」概念与公开预览状态，**未公开各成就的等级门槛对照表**。
 * - 因此本站所有等级门槛均标注为社区实测/多源一致（可信度 B / C），不会冒充官方数据。
 * - 徽章图片使用 GitHub 官方素材地址 github.githubassets.com/images/modules/profile/achievements/
 * - 官方文档明确说明 Mars 2020 Helicopter Contributor 活动已结束、徽章不再提供（可信度 A）。
 *
 * 维护方式：后台「勋章管理」可随时修改本文件写入的内容，无需改代码。
 */

export type SeedAvailability =
  | 'AVAILABLE'
  | 'TIERED'
  | 'LIMITED'
  | 'DISCONTINUED'
  | 'TESTING'
  | 'INTERNAL';

export type SeedTierLevel = 'DEFAULT' | 'BRONZE' | 'SILVER' | 'GOLD';
export type SeedCredibility = 'A' | 'B' | 'C' | 'D';
export type SeedSourceType =
  | 'OFFICIAL_DOC'
  | 'CHANGELOG'
  | 'OFFICIAL_DISCUSSION'
  | 'COMMUNITY'
  | 'COLLECTIVE_EVIDENCE';

export interface TierSeed {
  level: SeedTierLevel;
  threshold: number;
  labelEn: string;
  labelZh: string;
  descriptionEn: string;
  descriptionZh: string;
  credibility: SeedCredibility;
  sourceNote: string;
}

export interface RequirementSeed {
  title: string;
  titleZh: string;
  content: string;
  contentZh: string;
  steps: string[];
  codeExample?: string;
}

export interface GuideSeed {
  title: string;
  titleZh: string;
  content: string;
  contentZh: string;
  readingTime: number;
}

export interface SourceSeed {
  title: string;
  url: string;
  sourceType: SeedSourceType;
  credibility: SeedCredibility;
  status: 'ACTIVE' | 'DISPUTED' | 'OUTDATED' | 'ARCHIVED';
  verifiedAt: string;
  note?: string;
  isDisputed?: boolean;
}

export interface AchievementSeed {
  slug: string;
  nameEn: string;
  nameZh: string;
  summaryEn: string;
  summaryZh: string;
  descriptionEn: string;
  descriptionZh: string;
  backgroundEn: string;
  backgroundZh: string;
  conditionEn: string;
  conditionZh: string;
  imageUrl: string | null;
  imageHdUrl: string | null;
  difficulty: number;
  availability: SeedAvailability;
  isTiered: boolean;
  categorySlug: string;
  credibility: SeedCredibility;
  uncertain: boolean;
  uncertaintyNote?: string;
  popularity: number;
  verifiedAt: string;
  tiers: TierSeed[];
  requirements: RequirementSeed[];
  guides: GuideSeed[];
  sources: SourceSeed[];
}

const ASSET = 'https://github.githubassets.com/images/modules/profile/achievements';
const img = (slug: string, variant = 'default') => `${ASSET}/${slug}-${variant}.png`;

/** 统一核实时间 —— 本批数据的最后核实日期 */
const VERIFIED = '2026-11-08';

const OFFICIAL_PROFILE_DOC = {
  title: 'GitHub Docs — Profile reference (Earning Achievements)',
  url: 'https://docs.github.com/en/account-and-profile/reference/profile-reference',
  sourceType: 'OFFICIAL_DOC' as const,
  credibility: 'A' as const,
  status: 'ACTIVE' as const,
  verifiedAt: VERIFIED,
  note:
    '官方文档介绍了成就机制、公开预览状态与私有贡献可见性设置，但未公布各成就的等级门槛。',
};

const OFFICIAL_CONTRIBUTION_SETTINGS = {
  title: 'GitHub Docs — Setting your preferences for private contributions',
  url: 'https://docs.github.com/en/account-and-profile/how-tos/contribution-settings',
  sourceType: 'OFFICIAL_DOC' as const,
  credibility: 'A' as const,
  status: 'ACTIVE' as const,
  verifiedAt: VERIFIED,
  note: '官方说明：可以控制私有贡献是否计入以及是否展示成就。',
};

export const ACHIEVEMENTS: AchievementSeed[] = [
  // ==========================================================================
  // 1. Pull Shark
  // ==========================================================================
  {
    slug: 'pull-shark',
    nameEn: 'Pull Shark',
    nameZh: '拉取请求鲨鱼',
    summaryEn:
      'Awarded for merging pull requests. Progresses through four tiers as your merged PR count grows.',
    summaryZh:
      '因成功合并 Pull Request 而获得。随着合并数量的增加，可依次解锁 Default、Bronze、Silver、Gold 四个等级。',
    descriptionEn:
      'Pull Shark is the achievement most closely tied to the daily work of a collaborating developer. ' +
      'It recognises pull requests that were not merely opened but genuinely merged — that is, someone accepted your ' +
      'proposal and brought it into the codebase. Because it counts merges rather than raw commit volume, it rewards ' +
      'work that other people were willing to take responsibility for. ' +
      'It is also the achievement with the highest ceiling in the whole system: the Gold tier requires a four-digit ' +
      'number of merged pull requests, which in practice means years of sustained open-source contribution.',
    descriptionZh:
      'Pull Shark 是最贴近协作开发者日常工作的成就。它认定的不是「提交了多少代码」，' +
      '而是「有多少 Pull Request 真正被合并」—— 也就是你的提议被他人接受并合入了代码库。' +
      '正因如此，它奖励的是那些别人愿意为之负责的工作。' +
      '它同时也是整个成就体系中上限最高的一枚：Gold 等级需要四位数规模的已合并 PR，' +
      '在实践中意味着长期、持续的 open source 贡献。',
    backgroundEn:
      'Pull Shark shipped with the public beta of GitHub Profile Achievements announced in June 2022. ' +
      'The shark motif was chosen to fit the "hunting down and landing contributions" idea that GitHub used ' +
      'to describe the achievement family.',
    backgroundZh:
      'Pull Shark 与 2022 年 6 月 GitHub 个人资料成就公开预览一同发布。' +
      '鲨鱼这一意象对应了 GitHub 当时对整个成就系列「追逐并捕获贡献」的描述。',
    conditionEn:
      'Merge pull requests. Default requires 2 merged pull requests; higher tiers require 16, 128 and 1024. ' +
      'GitHub does not publish these thresholds officially — they are consistently reported by the community.',
    conditionZh:
      '成功合并 Pull Request。默认等级需要合并 2 个 PR，更高等级分别需要 16、128、1024 个。' +
      'GitHub 官方并未公布这些门槛数值，本页数据来自多个社区来源的一致实测报告。',
    imageUrl: img('pull-shark'),
    imageHdUrl: img('pull-shark', 'gold'),
    difficulty: 2,
    availability: 'TIERED',
    isTiered: true,
    categorySlug: 'tiered',
    credibility: 'C',
    uncertain: false,
    popularity: 98,
    verifiedAt: VERIFIED,
    tiers: [
      {
        level: 'DEFAULT',
        threshold: 2,
        labelEn: 'Default',
        labelZh: '默认等级',
        descriptionEn: '2 merged pull requests',
        descriptionZh: '合并 2 个 Pull Request',
        credibility: 'C',
        sourceNote:
          '社区一致实测（多个独立来源记录相同数值）。GitHub 官方文档未公布门槛数值。',
      },
      {
        level: 'BRONZE',
        threshold: 16,
        labelEn: 'Bronze',
        labelZh: '铜章',
        descriptionEn: '16 merged pull requests',
        descriptionZh: '合并 16 个 Pull Request',
        credibility: 'C',
        sourceNote: '社区一致实测。GitHub 官方文档未公布门槛数值。',
      },
      {
        level: 'SILVER',
        threshold: 128,
        labelEn: 'Silver',
        labelZh: '银章',
        descriptionEn: '128 merged pull requests',
        descriptionZh: '合并 128 个 Pull Request',
        credibility: 'C',
        sourceNote: '社区一致实测。GitHub 官方文档未公布门槛数值。',
      },
      {
        level: 'GOLD',
        threshold: 1024,
        labelEn: 'Gold',
        labelZh: '金章',
        descriptionEn: '1024 merged pull requests',
        descriptionZh: '合并 1024 个 Pull Request',
        credibility: 'C',
        sourceNote: '社区一致实测。GitHub 官方文档未公布门槛数值。',
      },
    ],
    requirements: [
      {
        title: 'Merge two pull requests',
        titleZh: '合并两个 Pull Request',
        content:
          'Two merged pull requests unlock the Default tier. A pull request counts as merged once its base branch ' +
          'actually contains the commits — opening and closing it is not enough.',
        contentZh:
          '合并 2 个 Pull Request 即可解锁默认等级。PR 必须真正被合入目标分支才算数 —— ' +
          '仅仅创建或关闭并不满足条件。',
        steps: [
          'Open a public repository with a README file so you can create your first branch.',
          'Create a branch, make a small meaningful change (for example fix a typo or add a line to the README).',
          'Open a Pull Request from that branch to the default branch.',
          'Merge the pull request yourself (or ask the maintainer to merge it).',
          'Repeat until two pull requests have been merged.',
          'Visit your profile and check the Achievements section in the sidebar.',
        ],
        codeExample: `git clone https://github.com/<your-name>/<your-repo>.git
cd <your-repo>
git checkout -b feature/first-contribution
# edit README.md
git add README.md
git commit -m "docs: improve installation section"
git push -u origin feature/first-contribution
# then open the Pull Request on GitHub`,
      },
      {
        title: 'Contributing to other open source projects',
        titleZh: '向其他开源项目贡献代码',
        content:
          'Merging pull requests in repositories you do not own is the most sustainable way to progress, and it is ' +
          'also what the achievement is really about. Look for issues labelled "good first issue" or "help wanted".',
        contentZh:
          '在自己不拥有的仓库中合并 PR 是最可持续的进阶方式，也更符合这枚成就的本意。' +
          '可以优先寻找带有 "good first issue" 或 "help wanted" 标签的 Issue。',
        steps: [
          'Search GitHub for issues labelled "good first issue" in projects you already use.',
          'Read CONTRIBUTING.md before writing any code — it defines the expected workflow.',
          'Comment on the issue to show intent, and wait for a maintainer response if the project requires it.',
          'Fork the repository and create a focused branch.',
          'Open a Pull Request that clearly explains what changed and why.',
          'Respond to review feedback until the maintainer merges it.',
        ],
      },
      {
        title: 'Public repositories only',
        titleZh: '仅公开仓库计入',
        content:
          'A widely reported behaviour is that merged pull requests in private repositories do not count towards ' +
          'this achievement. This has not been stated in GitHub\'s documentation, so treat it as community ' +
          'observation rather than a guaranteed rule — and verify against your own profile.',
        contentZh:
          '社区广泛报告的行为是：私有仓库中合并的 Pull Request 不会计入这枚成就。' +
          '由于 GitHub 官方文档并未明确说明，这一点应视为社区观察而非绝对规则，' +
          '建议结合自己的资料页实际结果进行核对。',
        steps: [
          'Compare your merged PR count in a public repository against your private ones.',
          'Use GitHub\'s own contribution settings to enable counting private contributions if that option exists for your account.',
          'Note any discrepancy in the "来源与核实" section of this page so other readers can cross-check.',
        ],
      },
    ],
    guides: [
      {
        title: 'What is a Pull Request and why does merging one matter?',
        titleZh: '什么是 Pull Request？为什么「合并」才算数？',
        readingTime: 6,
        content: `## 为什么 GitHub 要统计「已合并」而不是「已提交」

Pull Request（简称 PR）是 GitHub 的协作核心：它把「我想改这段代码」变成一份**可以被审查、被讨论、被接受或被拒绝的提案**。

提交（commit）是你本地的动作，只有你自己能看见。合并（merge）则意味着**另一个人（或你自己，在你有权限时）明确做出了接受的决定**。GitHub 把成就建立在 merge 上，是因为 merge 代表了「这份改动被认可了」这一更强的信号。

## PR 的完整生命周期

\`\`\`
fork → clone → branch → commit → push → open PR → review → merge
\`\`\`

1. **fork**：把别人的仓库复制到你名下（只对非你自己的仓库需要）。
2. **branch**：从默认分支切出工作分支，避免直接改动主分支。
3. **commit**：本地保存改动，写清楚提交信息。
4. **push**：把分支推到远端。
5. **open PR**：在 GitHub 上发起提案。
6. **review**：维护者或其他人审查，必要时留下评论。
7. **merge**：合并，PR 关闭，代码进入目标分支。

只有走到最后一步，这次贡献才会被计入成就。

## 新手最常犯的错误

- **只创建不合并**：PR 被关闭（close 而非 merge）不会计入。
- **把 PR 开到了错误的仓库**：向原仓库开 PR，而不是向自己的 fork 开。
- **在错误的分支上开发**：从过期的默认分支切出分支，导致大量冲突。
- **忽略 CI**：自动检查失败通常会阻塞合并请求。

## 怎么确认贡献被记录了

打开你自己的个人资料页，鼠标悬停在成就徽章上，GitHub 会显示一段简要说明以及**指向贡献事件的链接**。这些链接只会对拥有该仓库权限的人可见 —— 这也意味着：如果你在贡献时没有保持事件可见，徽章上可能看不到对应链接。`,
        contentZh: `## 为什么 GitHub 要统计「已合并」而不是「已提交」

Pull Request（简称 PR）是 GitHub 的协作核心：它把「我想改这段代码」变成一份**可以被审查、被讨论、被接受或被拒绝的提案**。

提交（commit）是你本地的动作，只有你自己能看见。合并（merge）则意味着**另一个人（或你自己，在你有权限时）明确做出了接受的决定**。GitHub 把成就建立在 merge 上，是因为 merge 代表了「这份改动被认可了」这一更强的信号。

## PR 的完整生命周期

\`\`\`
fork → clone → branch → commit → push → open PR → review → merge
\`\`\`

1. **fork**：把别人的仓库复制到你名下（只对非你自己的仓库需要）。
2. **branch**：从默认分支切出工作分支，避免直接改动主分支。
3. **commit**：本地保存改动，写清楚提交信息。
4. **push**：把分支推到远端。
5. **open PR**：在 GitHub 上发起提案。
6. **review**：维护者或其他人审查，必要时留下评论。
7. **merge**：合并，PR 关闭，代码进入目标分支。

只有走到最后一步，这次贡献才会被计入成就。

## 新手最常犯的错误

- **只创建不合并**：PR 被关闭（close 而非 merge）不会计入。
- **把 PR 开到了错误的仓库**：向原仓库开 PR，而不是向自己的 fork 开。
- **在错误的分支上开发**：从过期的默认分支切出分支，导致大量冲突。
- **忽略 CI**：自动检查失败通常会阻塞合并请求。

## 怎么确认贡献被记录了

打开你自己的个人资料页，鼠标悬停在成就徽章上，GitHub 会显示一段简要说明以及**指向贡献事件的链接**。这些链接只会对拥有该仓库权限的人可见 —— 这也意味着：如果你在贡献时没有保持事件可见，徽章上可能看不到对应链接。`,
      },
      {
        title: 'Finding beginner-friendly repositories and good first issues',
        titleZh: '寻找适合新手的项目与 good first issue',
        readingTime: 7,
        content: `## 筛选项目的实用信号

不要只看 star 数。一个适合贡献的开源项目通常具备以下特征：

- 有 \`CONTRIBUTING.md\`：说明贡献流程、代码风格、提交信息规范。
- 有 \`CODE_OF_CONDUCT.md\`：说明社区行为准则。
- 有 issue 模板（\`ISSUE_TEMPLATE/\`）：说明维护者希望怎样提问。
- 有 CI 配置（\`.github/workflows/\`）：说明项目在意质量。
- 最近有提交活动：项目还活着。

## 怎么找 good first issue

在 GitHub 搜索框里直接搜索：

\`\`\`
is:open is:issue label:"good first issue"
\`\`\`

加上语言与星标区间可以进一步收敛：

\`\`\`
is:open is:issue label:"good first issue" language:python stars:100..5000
\`\`\`

\`help wanted\` 标签同理，通常表示维护者明确希望有人来接手。

## 开 PR 之前要做的三件事

1. **先开 issue 沟通**：如果项目贡献指南要求，先留言说明你打算怎么改。
2. **同步最新代码**：从默认分支切分支，避免基于过期代码。
3. **只做一件事**：一个 PR 只解决一个问题，评审体验会好很多。

## 评审反馈怎么回

收到 review 意见时：

- 用 \`git commit --amend\` 修改后 \`git push --force-with-lease\`（自己的分支可以强推）。
- 逐条回复评论，说明做了什么。
- 对方要求重构时，先确认理解一致再动手。

> [!NOTE]
> 保持诚实与耐心。维护者没有回复不代表你的贡献被否��，很多时候只是他们很忙。一周后礼貌地 ping 一次是合理的。`,
        contentZh: `## 筛选项目的实用信号

不要只看 star 数。一个适合贡献的开源项目通常具备以下特征：

- 有 \`CONTRIBUTING.md\`：说明贡献流程、代码风格、提交信息规范。
- 有 \`CODE_OF_CONDUCT.md\`：说明社区行为准则。
- 有 issue 模板（\`ISSUE_TEMPLATE/\`）：说明维护者希望怎样提问。
- 有 CI 配置（\`.github/workflows/\`）：说明项目在意质量。
- 最近有提交活动：项目还活着。

## 怎么找 good first issue

在 GitHub 搜索框里直接搜索：

\`\`\`
is:open is:issue label:"good first issue"
\`\`\`

加上语言与星标区间可以进一步收敛：

\`\`\`
is:open is:issue label:"good first issue" language:python stars:100..5000
\`\`\`

\`help wanted\` 标签同理，通常表示维护者明确希望有人来接手。

## 开 PR 之前要做的三件事

1. **先开 issue 沟通**：如果项目贡献指南要求，先留言说明你打算怎么改。
2. **同步最新代码**：从默认分支切分支，避免基于过期代码。
3. **只做一件事**：一个 PR 只解决一个问题，评审体验会好很多。

## 评审反馈怎么回

收到 review 意见时：

- 用 \`git commit --amend\` 修改后 \`git push --force-with-lease\`（自己的分支可以强推）。
- 逐条回复评论，说明做了什么。
- 对方要求重构时，先确认理解一致再动手。

> [!NOTE]
> 保持诚实与耐心。维护者没有回复不代表你的贡献被否定，很多时候只是他们很忙。一周后礼貌地 ping 一次是合理的。`,
      },
    ],
    sources: [
      OFFICIAL_PROFILE_DOC,
      {
        title: 'GitHub Blog — Achievements public beta (2022-06-09)',
        url: 'https://github.blog/changelog/2022-06-09-achievements-public-beta/',
        sourceType: 'CHANGELOG',
        credibility: 'A',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '官方公告确认成就功能公开预览上线。',
      },
      {
        title: 'awesome-github-badges — GitHub Achievements 清单（社区维护）',
        url: 'https://github.com/ranjiGT/awesome-github-badges',
        sourceType: 'COLLECTIVE_EVIDENCE',
        credibility: 'B',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '社区维护的成就清单，明确指出 GitHub 并未公布全部等级门槛。',
      },
      {
        title: 'Dev.to — GitHub Achievements Explained: Every Badge, Tier',
        url: 'https://dev.to/6t9/github-achievements-explained-every-badge-tier-and-a-cli-to-track-your-progress-3a1d',
        sourceType: 'COMMUNITY',
        credibility: 'C',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '记录了 2 / 16 / 128 / 1024 的等级门槛，并自述为社区记录值。',
      },
    ],
  },

  // ==========================================================================
  // 2. YOLO
  // ==========================================================================
  {
    slug: 'yolo',
    nameEn: 'YOLO',
    nameZh: '无审查合并成就',
    summaryEn:
      'Awarded for merging a pull request that went through without a code review.',
    summaryZh:
      '在没有任何代码审查的情况下合并了一个 Pull Request 时获得。',
    descriptionEn:
      'YOLO marks a merge that happened without a code review. It exists as a statistical counter-example to ' +
      'Pull Shark: instead of rewarding well-reviewed collaboration, it records the cases where a change was ' +
      'merged directly. ' +
      'In practice it is overwhelmingly earned in personal repositories, where the owner has merge rights and ' +
      'no external reviewer is involved. ' +
      'This achievement should never be a goal in itself. Skipping review on a shared or production repository ' +
      'removes a real safety net. The badge is a byproduct of a workflow, never a reason to weaken one.',
    descriptionZh:
      'YOLO 记录的是一次「没有经过代码审查就被合并」的提交。' +
      '它与 Pull Shark 构成对照：Pull Shark 奖励经过评审的协作，YOLO 则记录了绕开评审直接合并的情形。' +
      '在实践中，它几乎都是在个人仓库中获得的 —— 仓库所有者本身拥有合并权限，且没有外部评审者参与。' +
      '这枚成就不应该被当作目标。为了拿徽章而在共享仓库或生产仓库里跳过评审，' +
      '等于亲手拆掉一道真实的安全防线。徽章只是某个工作流的副产品，永远不应当成为削弱工作流的理由。',
    backgroundEn:
      'YOLO shipped alongside the other achievements in the 2022 public beta. The name is a well-known acronym ' +
      '("You Only Live Once") and reflects the absence of the usual review step.',
    backgroundZh:
      'YOLO 与其他成就一同在 2022 年公开预览中发布。名称取自广为人知的缩写「You Only Live Once」，' +
      '指向的正是「缺少了常规评审这一步」。',
    conditionEn:
      'Merge a pull request that has not received a code review. GitHub does not publish further details on what ' +
      'counts as "a review" for this purpose.',
    conditionZh:
      '合并一个没有经过代码审查的 Pull Request。GitHub 官方未进一步说明在这一判定中「什么算作一次审查」。',
    imageUrl: img('yolo'),
    imageHdUrl: img('yolo'),
    difficulty: 1,
    availability: 'AVAILABLE',
    isTiered: false,
    categorySlug: 'single-level',
    credibility: 'C',
    uncertain: false,
    popularity: 90,
    verifiedAt: VERIFIED,
    tiers: [],
    requirements: [
      {
        title: 'Merge a pull request without a review',
        titleZh: '在没有评审的情况下合并一个 Pull Request',
        content:
          'Open a pull request on a repository where you have merge rights and merge it while it has no review. ' +
          'A review means a submitted review — an approving review is not required, but a review must exist.',
        contentZh:
          '在你拥有合并权限的仓库中发起一个 Pull Request，并在其没有任何 review 的情况下直接合并。' +
          '这里的「review」指提交过的评审记录 —— 不要求是 approve，但必须存在。',
        steps: [
          'Use a repository you own, or one where you have explicit merge permission.',
          'Create a branch with a small, harmless change.',
          'Open the pull request.',
          'Open the "Files changed" tab and confirm no review has been submitted.',
          'Merge the pull request using the merge button (do not enable "Require approval" rules on this repository).',
          'Check your profile for the YOLO badge.',
        ],
      },
      {
        title: 'What this achievement is NOT',
        titleZh: '这枚成就「不是」什么',
        content:
          'YOLO is not permission to bypass review. On shared, production or security-sensitive repositories, ' +
          'requiring review is a deliberate safety control — disabling it to farm a badge trades real protection ' +
          'for a cosmetic icon. Never ask a reviewer to skip review so that you can earn this badge.',
        contentZh:
          'YOLO 并不是「可以绕过评审」的通行证。在共享仓库、生产仓库或涉及安全的仓库中，' +
          '要求评审是一项有意的安全控制 —— 为了一个装饰性的图标而关闭它，是用真实的安全保障去换。' +
          '永远不要为了凑成就而请求评审者跳过审查。',
        steps: [
          'Keep branch protection and required reviews enabled on any repository other people rely on.',
          'Only self-review-free merges in personal/sandbox repositories.',
          'Treat YOLO as an incidental outcome of your own workflow, never as a target.',
        ],
      },
    ],
    guides: [
      {
        title: 'Review vs Approval and how GitHub distinguishes them',
        titleZh: 'Review 与 Approval 的区别，以及 GitHub 如何区分',
        readingTime: 6,
        content: `## 三种容易混淆的状态

在 GitHub 的 PR 界面里，下面三件事经常被混为一谈：

| 状态 | 含义 | 是否算作 "a review" |
| --- | --- | --- |
| **Comment** | 普通评论，不改变审批状态 | 视情况，多数情况下不算作 approve，但**会**在 review 记录中出现 |
| **Review** | 提交了一份正式的 review，可能是 Approve / Request changes / Comment | 是 |
| **Approval** | 至少一位有权限的维护者给出了 Approve | 是 approval（更强的条件） |

GitHub 在多个场景下会区分这三者：分支保护规则里的 "Require approvals" 用的是 **approval**；而"这次 PR 有没有被人看过"通常看的是 **review 是否存在**。

## 分支保护会怎样影响结果

仓库所有者可以在 \`Settings → Rules → Rulesets\` 中为默认分支添加规则：

- **Require a pull request before merging**
- **Require approvals**（可设置为 1、2 或更多）
- **Require review from Code Owners**
- **Dismiss stale approvals when new commits are pushed**
- **Require conversation to be resolved before merging**

这些规则一旦生效，合并按钮会在没有满足条件时直接被禁用 —— 这时你**无法**通过界面完成无审查合并。

## 为什么有些合并「看起来没审查」却没拿到成就

常见的几种情况：

1. 仓库要求 approval 但你没有等待，直接用管理员权限强制合并 —— 事件仍可能被记录，也可能因管理员绕过而不被计入。
2. PR 是通过 API 或 GitHub Desktop 合并的，路径不同导致事件类型不同。
3. 仓库有 \`Allow merge commits\` 关闭等策略限制。
4. 该 PR 在被合并前曾经有过一次 review，之后被 dismiss 了。

> [!TIP]
> 想确认自己是否获得：打开个人资料页悬停徽章，GitHub 会给出触发事件链接，链接指向的 PR 就是判定依据。`,
        contentZh: `## 三种容易混淆的状态

在 GitHub 的 PR 界面里，下面三件事经常被混为一谈：

| 状态 | 含义 | 是否算作 "a review" |
| --- | --- | --- |
| **Comment** | 普通评论，不改变审批状态 | 视情况，多数情况下不算作 approve，但**会**在 review 记录中出现 |
| **Review** | 提交了一份正式的 review，可能是 Approve / Request changes / Comment | 是 |
| **Approval** | 至少一位有权限的维护者给出了 Approve | 是 approval（更强的条件） |

GitHub 在多个场景下会区分这三者：分支保护规则里的 "Require approvals" 用的是 **approval**；而"这次 PR 有没有被人看过"通常看的是 **review 是否存在**。

## 分支保护会怎样影响结果

仓库所有者可以在 \`Settings → Rules → Rulesets\` 中为默认分支添加规则：

- **Require a pull request before merging**
- **Require approvals**（可设置为 1、2 或更多）
- **Require review from Code Owners**
- **Dismiss stale approvals when new commits are pushed**
- **Require conversation to be resolved before merging**

这些规则一旦生效，合并按钮会在没有满足条件时直接被禁用 —— 这时你**无法**通过界面完成无审查合并。

## 为什么有些合并「看起来没审查」却没拿到成就

常见的几种情况：

1. 仓库要求 approval 但你没有等待，直接用管理员权限强制合并 —— 事件仍可能被记录，也可能因管理员绕过而不被计入。
2. PR 是通过 API 或 GitHub Desktop 合并的，路径不同导致事件类型不同。
3. 仓库有 \`Allow merge commits\` 关闭等策略限制。
4. 该 PR 在被合并前曾经有过一次 review，之后被 dismiss 了。

> [!TIP]
> 想确认自己是否获得：打开个人资料页悬停徽章，GitHub 会给出触发事件链接，链接指向的 PR 就是判定依据。`,
      },
    ],
    sources: [
      OFFICIAL_PROFILE_DOC,
      {
        title: 'awesome-github-badges — GitHub Achievements 清单（社区维护）',
        url: 'https://github.com/ranjiGT/awesome-github-badges',
        sourceType: 'COLLECTIVE_EVIDENCE',
        credibility: 'B',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '记录 YOLO 为"在未经过代码评审的情况下合并自己的 PR"，可用状态。',
      },
      {
        title: 'GitHub Docs — About protected branches',
        url: 'https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches',
        sourceType: 'OFFICIAL_DOC',
        credibility: 'A',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '官方说明分支保护规则如何强制要求 review 与 approval。',
      },
    ],
  },

  // ==========================================================================
  // 3. Quickdraw
  // ==========================================================================
  {
    slug: 'quickdraw',
    nameEn: 'Quickdraw',
    nameZh: '快速解决成就',
    summaryEn:
      'Awarded for closing an issue or pull request within five minutes of opening it.',
    summaryZh:
      '在创建 Issue 或 Pull Request 后 5 分钟内将其关闭，即可获得。',
    descriptionEn:
      'Quickdraw rewards speed on the simplest possible task: open something, then close it almost immediately. ' +
      'The five-minute window is the entire rule. ' +
      'It sounds trivial, and it is — but it doubles as a useful sanity check that the achievement system is working ' +
      'for your account at all, and as a very low-cost first badge for new users. ' +
      'The achievement is also a well-known demonstration of why "speed" achievements exist at all: GitHub uses ' +
      'them as canaries for its own event-processing pipeline.',
    descriptionZh:
      'Quickdraw 奖励的是在最简单的任务上追求速度：创建一个问题，然后几乎立刻把它关掉。' +
      '全部规则就是 5 分钟这个时间窗口。' +
      '这听起来确实简单，但它有两个实际作用：一是作为「成就系统在你的账号上是否正常工作」的一次低成本自检；' +
      '二是让新用户几乎零成本地拿到第一枚徽章。' +
      '它同时也是理解「速度类成就为何存在」的经典样本 —— GitHub 用它们来验证自身事件处理链路的健康度。',
    backgroundEn:
      'Quickdraw was one of the original achievements from the 2022 public beta. The name references the ' +
      'Old West "quick draw" trope — drawing and firing a weapon in a single motion.',
    backgroundZh:
      'Quickdraw 是 2022 年公开预览首批成就之一。名称取自美国西部「快枪手」的典故 —— 拔枪与射击一气呵成。',
    conditionEn:
      'Close an issue or a pull request within 5 minutes of opening it. The window is measured from the moment the ' +
      'issue or PR is created to the moment it is closed.',
    conditionZh:
      '在创建 Issue 或 Pull Request 后 5 分钟内将其关闭。计时从 Issue / PR 创建的瞬间开始，到关闭的瞬间结束。',
    imageUrl: img('quickdraw'),
    imageHdUrl: img('quickdraw'),
    difficulty: 1,
    availability: 'AVAILABLE',
    isTiered: false,
    categorySlug: 'single-level',
    credibility: 'B',
    uncertain: false,
    popularity: 85,
    verifiedAt: VERIFIED,
    tiers: [],
    requirements: [
      {
        title: 'Open and close an issue within five minutes',
        titleZh: '在 5 分钟内创建并关闭一个 Issue',
        content:
          'Create an issue in any repository you can write to, then close it before five minutes have elapsed. ' +
          'The clock starts when the issue is actually created, not when you start drafting it.',
        contentZh:
          '在你有写权限的任意仓库中创建一个 Issue，然后在 5 分钟内把它关闭。' +
          '计时从 Issue 真正被创建的那一刻开始，而不是你开始写草稿的时候。',
        steps: [
          'Open the Issues tab of a repository you can write to.',
          'Click "New issue" and submit a short, honest description (e.g. "test issue for Quickdraw, closing immediately").',
          'Immediately click "Close issue" — the timing window is 5 minutes, so you have plenty of room.',
          'Check your profile for the Quickdraw badge.',
        ],
        codeExample: `# Using the GitHub CLI (faster and more reliable for timing)
gh issue create --repo <owner>/<repo> --title "Quickdraw test" --body "Closing this immediately."
gh issue close <issue-number> --repo <owner>/<repo>`,
      },
      {
        title: 'How the five-minute window is measured',
        titleZh: '5 分钟窗口是如何计算的',
        content:
          'The window runs from the creation timestamp to the close timestamp of the issue or pull request. ' +
          'GitHub does not publish the exact tolerance, so a close that lands right on the boundary may or may not ' +
          'register depending on clock skew and processing latency.',
        contentZh:
          '窗口从 Issue / PR 的创建时间戳算到关闭时间戳。' +
          'GitHub 未公布精确的容差范围，因此恰好卡在边界上的关闭操作，' +
          '是否会触发可能取决于时钟偏差与处理延迟。',
        steps: [
          'Keep the total time well under five minutes to avoid boundary uncertainty.',
          'Prefer creating the issue with a pre-written body so there is nothing to type.',
          'Do not delete the issue afterwards — GitHub treats deletion differently from closing.',
        ],
      },
    ],
    guides: [
      {
        title: 'Creating, closing and verifying an issue or pull request',
        titleZh: '创建、关闭与确认 Issue / Pull Request',
        readingTime: 5,
        content: `## 创建 Issue 的两种方式

**方式一：网页界面**

1. 进入仓库 → **Issues** 标签页 → 右上角 **New issue**。
2. 选择模板或直接写正文。
3. 点击 **Create issue**。

**方式二：GitHub CLI（更推荐做 Quickdraw）**

\`\`\`bash
gh issue create --repo owner/repo --title "Quickdraw test" --body "Closing immediately."
\`\`\`

CLI 的好处是：一条命令完成创建，省掉在浏览器里切换和输入的时间。

## 关闭 Issue

- 网页：打开 Issue → 右上角 **Close issue**。
- CLI：\`gh issue close <编号> --repo owner/repo\`
- 快捷键：在 Issue 页按 \`Ctrl\` + \`C\`（macOS 为 \`⌘\` + \`C\`）可快速关闭。

关闭时可以选择填写关闭原因（completed / not planned），这在真实项目里是很有价值的习惯。

## 关闭与删除的区别

| 操作 | 事件是否保留 | 说明 |
| --- | --- | --- |
| **Close** | 是 | Issue 保持可见，标记为 closed，计入成就判定 |
| **Delete** | 否 | Issue 及其内容被永久删除，通常无法作为成就证据 |

**永远使用 Close 而不是 Delete。**

## 为什么有时没有拿到成就

1. **超过 5 分钟**：窗口只有 5 分钟，来回切窗口很容易超时。
2. **用了 Delete**：事件被删除，不会被记录。
3. **在别人的私有仓库里操作**：私有贡献默认不计入成就。
4. **成就处理是异步的**：GitHub 会异步处理事件，稍等片刻再刷新资料页。
5. **账号未开启对应可见性设置**：在贡献设置中确认私有贡献与成就的开关状态。

## 怎么确认成功

打开 \`https://github.com/<你的用户名>\`，滚动到侧边栏的 **Achievements** 区域。悬停徽章会显示说明与触发事件链接。`,
        contentZh: `## 创建 Issue 的两种方式

**方式一：网页界面**

1. 进入仓库 → **Issues** 标签页 → 右上角 **New issue**。
2. 选择模板或直接写正文。
3. 点击 **Create issue**。

**方式二：GitHub CLI（更推荐做 Quickdraw）**

\`\`\`bash
gh issue create --repo owner/repo --title "Quickdraw test" --body "Closing immediately."
\`\`\`

CLI 的好处是：一条命令完成创建，省掉在浏览器里切换和输入的时间。

## 关闭 Issue

- 网页：打开 Issue → 右上角 **Close issue**。
- CLI：\`gh issue close <编号> --repo owner/repo\`
- 快捷键：在 Issue 页按 \`Ctrl\` + \`C\`（macOS 为 \`⌘\` + \`C\`）可快速关闭。

关闭时可以选择填写关闭原因（completed / not planned），这在真实项目里是很有价值的习惯。

## 关闭与删除的区别

| 操作 | 事件是否保留 | 说明 |
| --- | --- | --- |
| **Close** | 是 | Issue 保持可见，标记为 closed，计入成就判定 |
| **Delete** | 否 | Issue 及其内容被永久删除，通常无法作为成就证据 |

**永远使用 Close 而不是 Delete。**

## 为什么有时没有拿到成就

1. **超过 5 分钟**：窗口只有 5 分钟，来回切窗口很容易超时。
2. **用了 Delete**：事件被删除，不会被记录。
3. **在别人的私有仓库里操作**：私有贡献默认不计入成就。
4. **成就处理是异步的**：GitHub 会异步处理事件，稍等片刻再刷新资料页。
5. **账号未开启对应可见性设置**：在贡献设置中确认私有贡献与成就的开关状态。

## 怎么确认成功

打开 \`https://github.com/<你的用户名>\`，滚动到侧边栏的 **Achievements** 区域。悬停徽章会显示说明与触发事件链接。`,
      },
    ],
    sources: [
      OFFICIAL_PROFILE_DOC,
      {
        title: 'awesome-github-badges — GitHub Achievements 清单（社区维护）',
        url: 'https://github.com/ranjiGT/awesome-github-badges',
        sourceType: 'COLLECTIVE_EVIDENCE',
        credibility: 'B',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '记录 Quickdraw 条件为「在打开后 5 分钟内关闭 issue 或 PR」，状态可用。',
      },
      {
        title: 'GitHub Docs — Creating an issue',
        url: 'https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue',
        sourceType: 'OFFICIAL_DOC',
        credibility: 'A',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '官方 Issue 创建与关闭流程说明。',
      },
    ],
  },

  // ==========================================================================
  // 4. Starstruck
  // ==========================================================================
  {
    slug: 'starstruck',
    nameEn: 'Starstruck',
    nameZh: '星标成就',
    summaryEn:
      'Awarded for reaching star milestones on a repository you own, with four tiers up to 4096 stars.',
    summaryZh:
      '当你拥有的仓库的 Star 数量达到相应里程碑时获得，共四个等级，最高需要 4096 个 Star。',
    descriptionEn:
      'Starstruck rewards a repository you own for becoming well-known. Unlike Pull Shark, which measures your ' +
      'effort, Starstruck measures the response of other people: somebody looked at your work and decided it was ' +
      'worth bookmarking. ' +
      'That makes it the hardest achievement to engineer and the most meaningful when it arrives. ' +
      'Self-starring does not count, and there is no legitimate shortcut — the star has to come from a person who ' +
      'genuinely found the project. ' +
      'The practical route is unglamorous: build something genuinely useful, document it well, and keep it maintained.',
    descriptionZh:
      'Starstruck 奖励的是「你拥有的仓库变得广为人知」。' +
      '与衡量你努力的 Pull Shark 不同，Starstruck 衡量的是他人的回应：有人看到了你的工作，' +
      '认为它值得被收藏。' +
      '这让它成为最难「做出来」的成就，也是真正拿到时最有分量的成就。' +
      '自己给自己的仓库加 Star 不计入，也没有合法的捷径 —— Star 必须来自真正觉得这个项目有用的人。' +
      '实际的路径并不华丽：做出真正有用的东西，把文档写好，并持续维护下去。',
    backgroundEn:
      'Starstruck was part of the original 2022 achievements public beta. It is one of the only achievements where ' +
      'the outcome depends on factors entirely outside the owner\'s control.',
    backgroundZh:
      'Starstruck 是 2022 年首批公开预览成就之一。' +
      '它是极少数结果完全取决于所有者无法控制的外部因素的成就。',
    conditionEn:
      'Have a repository you own reach a star milestone. Reported thresholds are 16 (Default), 128 (Bronze), ' +
      '512 (Silver) and 4096 (Gold). GitHub does not publish these numbers officially.',
    conditionZh:
      '你拥有的仓库的 Star 数量达到相应里程碑。社区一致报告的门槛为 16（默认）、128（铜章）、512（银章）、' +
      '4096（金章）。GitHub 官方未公布这些数值。',
    imageUrl: img('starstruck'),
    imageHdUrl: img('starstruck', 'gold'),
    difficulty: 4,
    availability: 'TIERED',
    isTiered: true,
    categorySlug: 'tiered',
    credibility: 'C',
    uncertain: false,
    popularity: 95,
    verifiedAt: VERIFIED,
    tiers: [
      {
        level: 'DEFAULT',
        threshold: 16,
        labelEn: 'Default',
        labelZh: '默认等级',
        descriptionEn: '16 stars on a repository you own',
        descriptionZh: '你拥有的仓库获得 16 个 Star',
        credibility: 'C',
        sourceNote: '社区一致实测。GitHub 官方文档未公布门槛数值。',
      },
      {
        level: 'BRONZE',
        threshold: 128,
        labelEn: 'Bronze',
        labelZh: '铜章',
        descriptionEn: '128 stars on a repository you own',
        descriptionZh: '你拥有的仓库获得 128 个 Star',
        credibility: 'C',
        sourceNote: '社区一致实测。GitHub 官方文档未公布门槛数值。',
      },
      {
        level: 'SILVER',
        threshold: 512,
        labelEn: 'Silver',
        labelZh: '银章',
        descriptionEn: '512 stars on a repository you own',
        descriptionZh: '你拥有的仓库获得 512 个 Star',
        credibility: 'C',
        sourceNote: '社区一致实测。GitHub 官方文档未公布门槛数值。',
      },
      {
        level: 'GOLD',
        threshold: 4096,
        labelEn: 'Gold',
        labelZh: '金章',
        descriptionEn: '4096 stars on a repository you own',
        descriptionZh: '你拥有的仓库获得 4096 个 Star',
        credibility: 'C',
        sourceNote: '社区一致实测。GitHub 官方文档未公布门槛数值。',
      },
    ],
    requirements: [
      {
        title: 'Reach 16 stars on a repository you own',
        titleZh: '让你拥有的仓库获得 16 个 Star',
        content:
          'The repository must be owned by you. Forks of other projects do not count toward your own star total, ' +
          'and stars placed by the repository owner on their own repository are not counted either.',
        contentZh:
          '仓库必须由你拥有。Fork 他人项目所获得的 Star 不计入你自己的总数，' +
          '仓库所有者给自己仓库加的 Star 同样不计入。',
        steps: [
          'Publish a public repository containing something genuinely useful to at least a small audience.',
          'Write a README that explains what it does, why it exists, and how to use it in the first screen.',
          'Add a demo screenshot or short GIF, plus a license file.',
          'Publish to a relevant community (Hacker News, Reddit r/programming, a Discord, a newsletter) — only where the project is actually relevant.',
          'Answer issues and pull requests quickly and courteously; early adopters decide whether to stay.',
        ],
      },
      {
        title: 'Build a project worth starring',
        titleZh: '打造一个值得被 Star 的项目',
        content:
          'Stars follow perceived usefulness. The projects that accumulate stars share a few traits: a clear ' +
          'one-sentence description, working documentation, visible maintenance, and a narrow, well-solved problem.',
        contentZh:
          'Star 跟随的是「被感知到的实用价值」。' +
          '那些积累了大量 Star 的项目通常具备几个共同点：一句话就能说清楚、文档可用、维护状态可见、' +
          '解决的问题足够聚焦。',
        steps: [
          'Solve one narrow problem extremely well rather than many problems vaguely.',
          'Lead the README with the problem and the value, not with a feature list.',
          'Include a "Why?" section explaining the motivation.',
          'Keep the dependency count small and the install command short.',
          'Add CI badges, a CODE_OF_CONDUCT.md and a CONTRIBUTING.md.',
          'Tag a release — release pages rank in search and signal seriousness.',
        ],
      },
      {
        title: 'What is explicitly not allowed',
        titleZh: '明确不被允许的做法',
        content:
          'Buying stars, exchanging stars, using automated accounts, or organising star-for-star exchanges ' +
          'violates GitHub\'s terms and can get your account or repository restricted. ' +
          'This site will never provide such methods, and they do not work reliably in any case — ' +
          'GitHub actively detects and removes inorganic stars.',
        contentZh:
          '购买 Star、以 Star 换 Star、使用自动化账号或组织互相点赞刷 Star，' +
          '均违反 GitHub 服务条款，可能导致账号或仓库被限制。' +
          '本站不会提供任何此类方法，而且它们实际上并不可靠 —— ' +
          'GitHub 会主动检测并清理非真实的 Star。',
        steps: [
          'Grow the project organically and accept that growth is slow at first.',
          'Measure success by usage (issues, dependents, downloads) rather than star count alone.',
          'If your project genuinely does not need stars, do not chase this badge.',
        ],
      },
    ],
    guides: [
      {
        title: 'Writing a README that converts visitors into stargazers',
        titleZh: '写出能把访客变成 Star 用户的 README',
        readingTime: 8,
        content: `## README 是你的落地页

在 GitHub 上，一个仓库能否被 Star，很大程度上取决于访客在 **10 秒内** 是否明白三件事：

1. 这是做什么的？
2. 为什么我需要它？
3. 我怎么在 30 秒内用起来？

## 结构模板

\`\`\`markdown
# 项目名称

一句话说明它解决什么问题。

![Demo](./docs/demo.gif)

## 快速开始
npm install my-tool
npx my-tool --init

## 为什么需要它
- 痛点 A
- 痛点 B

## 文档
- [配置参考](./docs/config.md)
- [API 文档](./docs/api.md)

## 贡献
参见 [CONTRIBUTING.md](./CONTRIBUTING.md)

## License
MIT
\`\`\`

## 几个能显著提升转化率的细节

- **首屏放图**：截图或 GIF 比文字更有说服力。
- **一个命令能跑起来**：\`npx\` / \`pip install\` / \`go run\` 都可以，缩短首次体验路径。
- **写清楚「不适用场景」**：诚实地说明边界，反而增加信任。
- **放一个真实的使用场景**：让人能对号入座。
- **加版本标签（Release）**：有 Release 的仓库在搜索结果里权重更高，也说明项目在维护。

## 演示素材怎么准备

- 终端演示可以用 [asciinema](https://asciinema.org/) 或直接录屏转 GIF。
- 图片尽量控制体积，控制在 1MB 以内，避免拖慢页面。
- 截图里请把无关信息（书签栏、通知、其他标签）隐藏。

## 让项目被「对的人」看到

- **相关社区**：在真正相关的 Slack / Discord / 论坛里分享，而不是到处刷屏。
- **技术文章**：写一篇讲清楚「为什么这样设计」的长文，效果往往好于一次性的推广帖。
- **回答问题**：在 Stack Overflow、掘金、知乎等平台认真回答相关问题，并附上仓库链接。
- **让维护者受益**：很多项目是因为「它帮我省了时间」才被 Star 的。`,
        contentZh: `## README 是你的落地页

在 GitHub 上，一个仓库能否被 Star，很大程度上取决于访客在 **10 秒内** 是否明白三件事：

1. 这是做什么的？
2. 为什么我需要它？
3. 我怎么在 30 秒内用起来？

## 结构模板

\`\`\`markdown
# 项目名称

一句话说明它解决什么问题。

![Demo](./docs/demo.gif)

## 快速开始
npm install my-tool
npx my-tool --init

## 为什么需要它
- 痛点 A
- 痛点 B

## 文档
- [配置参考](./docs/config.md)
- [API 文档](./docs/api.md)

## 贡献
参见 [CONTRIBUTING.md](./CONTRIBUTING.md)

## License
MIT
\`\`\`

## 几个能显著提升转化率的细节

- **首屏放图**：截图或 GIF 比文字更有说服力。
- **一个命令能跑起来**：\`npx\` / \`pip install\` / \`go run\` 都可以，缩短首次体验路径。
- **写清楚「不适用场景」**：诚实地说明边界，反而增加信任。
- **放一个真实的使用场景**：让人能对号入座。
- **加版本标签（Release）**：有 Release 的仓库在搜索结果里权重更高，也说明项目在维护。

## 演示素材怎么准备

- 终端演示可以用 [asciinema](https://asciinema.org/) 或直接录屏转 GIF。
- 图片尽量控制体积，控制在 1MB 以内，避免拖慢页面。
- 截图里请把无关信息（书签栏、通知、其他标签）隐藏。

## 让项目被「对的人」看到

- **相关社区**：在真正相关的 Slack / Discord / 论坛里分享，而不是到处刷屏。
- **技术文章**：写一篇讲清楚「为什么这样设计」的长文，效果往往好于一次性的推广帖。
- **回答问题**：在 Stack Overflow、掘金、知乎等平台认真回答相关问题，并附上仓库链接。
- **让维护者受益**：很多项目是因为「它帮我省了时间」才被 Star 的。`,
      },
    ],
    sources: [
      OFFICIAL_PROFILE_DOC,
      {
        title: 'awesome-github-badges — GitHub Achievements 清单（社区维护）',
        url: 'https://github.com/ranjiGT/awesome-github-badges',
        sourceType: 'COLLECTIVE_EVIDENCE',
        credibility: 'B',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '记录 Starstruck 为「在仓库上获得 star，更高等级需要更多 star」，状态可用。',
      },
      {
        title: 'Dev.to — GitHub Achievements Explained（等级 16 / 128 / 512 / 4096）',
        url: 'https://dev.to/6t9/github-achievements-explained-every-badge-tier-and-a-cli-to-track-your-progress-3a1d',
        sourceType: 'COMMUNITY',
        credibility: 'C',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '记录了 16 / 128 / 512 / 4096 的门槛，并明确标注为社区记录值。',
      },
    ],
  },

  // ==========================================================================
  // 5. Pair Extraordinaire
  // ==========================================================================
  {
    slug: 'pair-extraordinaire',
    nameEn: 'Pair Extraordinaire',
    nameZh: '协作开发成就',
    summaryEn:
      'Awarded for co-authored commits that end up in a merged pull request, with four tiers up to 48.',
    summaryZh:
      '当带有共同署名（Co-authored-by）的提交进入被合并的 Pull Request 时获得，共四个等级，最高需要 48 次。',
    descriptionEn:
      'Pair Extraordinaire is the only achievement that explicitly requires working with another person. ' +
      'It counts commits that carry a \`Co-authored-by:\` trailer and that are part of a pull request which is later ' +
      'merged. ' +
      'This makes it the clearest signal of genuine collaboration in the whole set — you cannot obtain it alone, ' +
      'and you cannot obtain it with a throwaway account. ' +
      'Because the commit must be part of a merged pull request, the pull request workflow is part of the requirement, ' +
      'not just the commit metadata.',
    descriptionZh:
      'Pair Extraordinaire 是整个成就体系中唯一明确要求「与他人共同完成」的成就。' +
      '它统计的是带有 \`Co-authored-by:\` trailer、并且进入了最终被合并的 Pull Request 的提交。' +
      '这让它成为整套成就中最能体现真实协作的信号 —— 你无法独自拿到它，' +
      '也无法用一个随手注册的小号凑出来。' +
      '由于提交必须属于一个被合并的 PR，因此「走完 PR 流程」本身就是要求的一部分，' +
      '而不只是提交信息的格式问题。',
    backgroundEn:
      'Introduced with the 2022 achievements public beta, Pair Extraordinaire was aimed at highlighting ' +
      'collaborative development rather than individual output.',
    backgroundZh:
      'Pair Extraordinaire 与 2022 年成就公开预览一同推出，' +
      '其设计意图是突出协作式开发，而非个人产出。',
    conditionEn:
      'Have commits with a Co-authored-by trailer included in a merged pull request. Reported thresholds are ' +
      '1 (Default), 10 (Bronze), 24 (Silver) and 48 (Gold).',
    conditionZh:
      '带有 \`Co-authored-by:\` 共同署名的提交进入被合并的 Pull Request。' +
      '社区一致报告的门槛为 1（默认）、10（铜章）、24（银章）、48（金章）。',
    imageUrl: img('pair-extraordinaire'),
    imageHdUrl: img('pair-extraordinaire', 'gold'),
    difficulty: 3,
    availability: 'TIERED',
    isTiered: true,
    categorySlug: 'tiered',
    credibility: 'C',
    uncertain: false,
    popularity: 82,
    verifiedAt: VERIFIED,
    tiers: [
      {
        level: 'DEFAULT',
        threshold: 1,
        labelEn: 'Default',
        labelZh: '默认等级',
        descriptionEn: '1 co-authored commit in a merged pull request',
        descriptionZh: '1 个包含共同署名提交的被合并 PR',
        credibility: 'C',
        sourceNote: '社区一致实测。GitHub 官方文档未公布门槛数值。',
      },
      {
        level: 'BRONZE',
        threshold: 10,
        labelEn: 'Bronze',
        labelZh: '铜章',
        descriptionEn: '10 co-authored commits in merged pull requests',
        descriptionZh: '10 个包含共同署名提交的被合并 PR',
        credibility: 'C',
        sourceNote: '社区一致实测。GitHub 官方文档未公布门槛数值。',
      },
      {
        level: 'SILVER',
        threshold: 24,
        labelEn: 'Silver',
        labelZh: '银章',
        descriptionEn: '24 co-authored commits in merged pull requests',
        descriptionZh: '24 个包含共同署名提交的被合并 PR',
        credibility: 'C',
        sourceNote: '社区一致实测。GitHub 官方文档未公布门槛数值。',
      },
      {
        level: 'GOLD',
        threshold: 48,
        labelEn: 'Gold',
        labelZh: '金章',
        descriptionEn: '48 co-authored commits in merged pull requests',
        descriptionZh: '48 个包含共同署名提交的被合并 PR',
        credibility: 'C',
        sourceNote: '社区一致实测。GitHub 官方文档未公布门槛数值。',
      },
    ],
    requirements: [
      {
        title: 'Add a Co-authored-by trailer to your commit',
        titleZh: '在提交中加入 Co-authored-by 共同署名',
        content:
          'A trailer is a line at the end of the commit message in the form \`Key: value\`. ' +
          'GitHub recognises \`Co-authored-by:\` and renders the co-author on the commit and the PR. ' +
          'The value must be a real GitHub account (email or username) that can be resolved.',
        contentZh:
          'Trailer 是提交信息末尾形如 \`键: 值\` 的一行。' +
          'GitHub 会识别 \`Co-authored-by:\` 并在提交和 PR 页面渲染共同作者。' +
          '其中的值必须是一个真实可解析的 GitHub 账号（邮箱或用户名）。',
        steps: [
          'Make a change together with another developer.',
          'Commit with a message that ends with a blank line followed by the trailer, e.g. "Co-authored-by: octocat <octocat@github.com>".',
          'Push the branch and open a pull request.',
          'Confirm the co-author appears under the commit on the PR "Commits" tab.',
          'Have the pull request merged — the commit must be part of the merged result.',
        ],
        codeExample: `git commit -m "feat: add retry logic to the client

Handles transient network errors with exponential backoff.

Co-authored-by: octocat <octocat@github.com>"
# 多个共同作者时逐行添加：
# Co-authored-by: octocat <octocat@github.com>
# Co-authored-by: hubot <hubot@github.com>`,
      },
      {
        title: 'Verify the co-author was recognised',
        titleZh: '确认共同作者被正确识别',
        content:
          'If the co-author is not rendered, GitHub could not match the identity. This usually means the email ' +
          'is not attached to a GitHub account, or the trailer has a formatting problem.',
        contentZh:
          '如果共同作者没有显示出来，说明 GitHub 没能匹配到这个身份。' +
          '常见原因是邮箱没有绑定到 GitHub 账号，或者 trailer 格式有误。',
        steps: [
          'Open the pull request and switch to the "Commits" tab.',
          'Look for the "co-authored-by" attribution line under the commit.',
          'If missing, verify the email in the trailer is the one used on that GitHub profile.',
          'Verify the trailer is separated from the rest of the message by a blank line.',
          'Verify there is exactly one space after the colon and that the name and email are wrapped in angle brackets.',
        ],
      },
    ],
    guides: [
      {
        title: 'Co-authored-by explained, and other collaboration metadata',
        titleZh: 'Co-authored-by 详解，以及其他协作元数据',
        readingTime: 6,
        content: `## Trailer 是什么

Git 提交信息支持「trailer」结构：消息正文结束后，用空行分隔，再写若干 \`键: 值\` 的行。

\`\`\`
feat: add pagination to the list endpoint

Supports both cursor and page-number styles.

Co-authored-by: octocat <octocat@github.com>
Reviewed-by: alice <alice@example.com>
Refs: #482
\`\`\`

Git 与 GitHub 都能解析这种结构。GitHub 会特别识别 \`Co-authored-by\`，并把它渲染成提交页面上的头像与链接。

## 格式要求（容易踩坑的地方）

| 要求 | 正确 | 常见错误 |
| --- | --- | --- |
| trailer 前有空行 | ✅ 空行分隔 | ❌ 直接跟在正文后面 |
| 冒号后一个空格 | \`Co-authored-by: name\` | \`Co-authored-by:name\` |
| 邮箱用尖括号包裹 | \`<octocat@github.com>\` | \`octocat@github.com\`（可能被识别，但不符合规范） |
| 使用对方在 GitHub 上验证过的邮箱 | ✅ | ❌ 使用未验证的私人邮箱 |

## 为什么必须是合并后的 PR

这枚成就统计的是「进入被合并 PR 的共同署名提交」。这意味着：

1. 共同署名提交必须存在于某个 PR 的提交列表中。
2. 该 PR 必须被 **merge**（不是 close、不是 rebase 后丢弃）。
3. 如果后来用 rebase 压扁了历史、共同署名信息丢失了，就不再计入。

## 团队协作的正确姿势

- 共同作者只写**真正参与了这段代码**的人 —— 共同署名是一种署名，不是人情。
- 不要用小号给自己刷共同署名，这既无意义也可能被判定为滥用。
- 在 PR 描述里用 \`#author\` 或 \`@username\` 提及协作者是另一种更轻量的协作标记，与 trailer 作用不同。

## 相关命令

\`\`\`bash
# 查看某个提交的全部 trailer
git log -1 --format='%(trailers)'

# 按作者过滤
git log --author="octocat"
\`\`\``,
        contentZh: `## Trailer 是什么

Git 提交信息支持「trailer」结构：消息正文结束后，用空行分隔，再写若干 \`键: 值\` 的行。

\`\`\`
feat: add pagination to the list endpoint

Supports both cursor and page-number styles.

Co-authored-by: octocat <octocat@github.com>
Reviewed-by: alice <alice@example.com>
Refs: #482
\`\`\`

Git 与 GitHub 都能解析这种结构。GitHub 会特别识别 \`Co-authored-by\`，并把它渲染成提交页面上的头像与链接。

## 格式要求（容易踩坑的地方）

| 要求 | 正确 | 常见错误 |
| --- | --- | --- |
| trailer 前有空行 | ✅ 空行分隔 | ❌ 直接跟在正文后面 |
| 冒号后一个空格 | \`Co-authored-by: name\` | \`Co-authored-by:name\` |
| 邮箱用尖括号包裹 | \`<octocat@github.com>\` | \`octocat@github.com\`（可能被识别，但不符合规范） |
| 使用对方在 GitHub 上验证过的邮箱 | ✅ | ❌ 使用未验证的私人邮箱 |

## 为什么必须是合并后的 PR

这枚成就统计的是「进入被合并 PR 的共同署名提交」。这意味着：

1. 共同署名提交必须存在于某个 PR 的提交列表中。
2. 该 PR 必须被 **merge**（不是 close、不是 rebase 后丢弃）。
3. 如果后来用 rebase 压扁了历史、共同署名信息丢失了，就不再计入。

## 团队协作的正确姿势

- 共同作者只写**真正参与了这段代码**的人 —— 共同署名是一种署名，不是人情。
- 不要用小号给自己刷共同署名，这既无意义也可能被判定为滥用。
- 在 PR 描述里用 \`#author\` 或 \`@username\` 提及协作者是另一种更轻量的协作标记，与 trailer 作用不同。

## 相关命令

\`\`\`bash
# 查看某个提交的全部 trailer
git log -1 --format='%(trailers)'

# 按作者过滤
git log --author="octocat"
\`\`\``,
      },
    ],
    sources: [
      OFFICIAL_PROFILE_DOC,
      {
        title: 'awesome-github-badges — GitHub Achievements 清单（社区维护）',
        url: 'https://github.com/ranjiGT/awesome-github-badges',
        sourceType: 'COLLECTIVE_EVIDENCE',
        credibility: 'B',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '记录 Pair Extraordinaire 条件为「PR 中有共同作者且被合并」，状态可用。',
      },
      {
        title: 'GitHub Docs — Creating a commit with multiple authors',
        url: 'https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/creating-a-commit-with-multiple-authors',
        sourceType: 'OFFICIAL_DOC',
        credibility: 'A',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '官方说明 Co-authored-by trailer 的写法与显示效果。',
      },
    ],
  },

  // ==========================================================================
  // 6. Galaxy Brain
  // ==========================================================================
  {
    slug: 'galaxy-brain',
    nameEn: 'Galaxy Brain',
    nameZh: '银河大脑',
    summaryEn:
      'Awarded for having answers in GitHub Discussions marked as accepted, with four tiers up to 32.',
    summaryZh:
      '当你在 GitHub Discussions 中提供的回答被标记为「已采纳（Accepted Answer）」时获得，共四个等级，最高需要 32 个。',
    descriptionEn:
      'Galaxy Brain is the achievement for technical writing and problem solving in public. ' +
      'It requires that your answer in a repository\'s Discussions is marked as the accepted answer by the person ' +
      'who asked the question. ' +
      'The word "accepted" matters: an answer that helps but is never acknowledged does not count. ' +
      'It is also the achievement most affected by how Discussions are configured — a repository must have ' +
      'Discussions enabled, and the "Q&A" category must be in use for answers to be markable as accepted. ' +
      'Note that repository Discussions and the global GitHub Community Discussions are different things; ' +
      'only repository-level Discussions count for this achievement.',
    descriptionZh:
      'Galaxy Brain 奖励的是在公开场合进行技术表达与问题解决。' +
      '它要求你的回答在某个仓库的 Discussions 中，被提问者标记为「已采纳」。' +
      '「被采纳」这三个字很关键：一条有帮助但从未被确认的回答不计入。' +
      '同时它也是最依赖 Discussions 配置方式的一枚成就 —— 仓库必须启用 Discussions，' +
      '并且通常需要使用「Q&A」分类，回答才可能被标记为已采纳。' +
      '需要特别注意：仓库级的 Discussions 与 GitHub 全局 Community Discussions 是两回事，' +
      '只有仓库级 Discussions 才计入这枚成就。',
    backgroundEn:
      'Galaxy Brain was part of the original 2022 public beta. Its counting rules have been revised since then, ' +
      'which is why the exact thresholds carry a lower confidence grade than Pull Shark or Starstruck.',
    backgroundZh:
      'Galaxy Brain 是 2022 年首批公开预览成就之一。' +
      '它的计数规则此后经历过调整，因此其门槛数值的可信度等级低于 Pull Shark 与 Starstruck。',
    conditionEn:
      'Have an answer in a repository\'s GitHub Discussions accepted by the author of the question. ' +
      'Reported thresholds are 2 (Default), 8 (Bronze), 16 (Silver) and 32 (Gold). ' +
      'Counting behaviour around Discussions has changed over time, so verify against your own profile.',
    conditionZh:
      '你在某个仓库的 GitHub Discussions 中提供的回答被提问者采纳。' +
      '社区一致报告的门槛为 2（默认）、8（铜章）、16（银章）、32（金章）。' +
      'Discussions 相关的计数规则历史上曾发生变化，建议结合自己的资料页实际结果核对。',
    imageUrl: img('galaxy-brain'),
    imageHdUrl: img('galaxy-brain', 'gold'),
    difficulty: 3,
    availability: 'AVAILABLE',
    isTiered: true,
    categorySlug: 'tiered',
    credibility: 'C',
    uncertain: true,
    uncertaintyNote:
      'Discussions 相关的计数规则在 GitHub 侧曾多次调整（包括 2024 年前后 Community Discussions 不再展示成就的变化）。' +
      '门槛数值来自社区报告，请在你的资料页实际核对后再据此设定目标。',
    popularity: 80,
    verifiedAt: VERIFIED,
    tiers: [
      {
        level: 'DEFAULT',
        threshold: 2,
        labelEn: 'Default',
        labelZh: '默认等级',
        descriptionEn: '2 accepted answers in Discussions',
        descriptionZh: 'Discussions 中 2 个被采纳的回答',
        credibility: 'C',
        sourceNote:
          '社区一致实测。注意：网络上流传的部分攻略误写为 1，实际默认值应为 2。GitHub 官方未公布。',
      },
      {
        level: 'BRONZE',
        threshold: 8,
        labelEn: 'Bronze',
        labelZh: '铜章',
        descriptionEn: '8 accepted answers in Discussions',
        descriptionZh: 'Discussions 中 8 个被采纳的回答',
        credibility: 'C',
        sourceNote: '社区一致实测。GitHub 官方未公布门槛数值。',
      },
      {
        level: 'SILVER',
        threshold: 16,
        labelEn: 'Silver',
        labelZh: '银章',
        descriptionEn: '16 accepted answers in Discussions',
        descriptionZh: 'Discussions 中 16 个被采纳的回答',
        credibility: 'C',
        sourceNote: '社区一致实测。GitHub 官方未公布门槛数值。',
      },
      {
        level: 'GOLD',
        threshold: 32,
        labelEn: 'Gold',
        labelZh: '金章',
        descriptionEn: '32 accepted answers in Discussions',
        descriptionZh: 'Discussions 中 32 个被采纳的回答',
        credibility: 'C',
        sourceNote: '社区一致实测。GitHub 官方未公布门槛数值。',
      },
    ],
    requirements: [
      {
        title: 'Find a repository with Discussions enabled',
        titleZh: '寻找启用了 Discussions 的仓库',
        content:
          'A repository must have Discussions turned on in Settings → General → Features. ' +
          'For answers to be markable as accepted, the repository usually needs the "Q&A" discussion category in use.',
        contentZh:
          '仓库必须在 Settings → General → Features 中启用 Discussions。' +
          '要能标记「已采纳」，通常还需要仓库在使用 "Q&A" 讨论分类。',
        steps: [
          'Open a repository you know is active.',
          'Look for a "Discussions" tab next to Issues and Pull requests.',
          'If there is no Discussions tab, the feature is not enabled for that repository.',
          'Check whether a "Q&A" category exists — that is where accepted answers usually live.',
        ],
      },
      {
        title: 'Write an answer that gets accepted',
        titleZh: '写出被采纳的回答',
        content:
          'Accepted answers are chosen by the person who asked. What gets accepted is usually an answer that ' +
          'actually resolves the question, is easy to verify, and is presented clearly enough to reuse.',
        contentZh:
          '是否被采纳由提问者决定。被采纳的回答通常具备三个特点：真正解决了问题、结论易于验证、' +
          '表达清晰到可以被别人直接复用。',
        steps: [
          'Read the whole discussion thread before answering — the answer may already exist above.',
          'Answer the question that was asked, not a different question you find more interesting.',
          'Include a minimal, complete, runnable example.',
          'Explain why the solution works, and note version/environment assumptions.',
          'Mention alternatives or caveats where relevant.',
          'Ask the question author to mark your answer as the accepted answer if it solved their problem.',
        ],
        codeExample: `# 最小可复现示例
import httpx

def fetch_with_retry(url: str, retries: int = 3) -> httpx.Response:
    last_exc = None
    for attempt in range(retries):
        try:
            return httpx.get(url, timeout=10.0)
        except httpx.HTTPError as exc:
            last_exc = exc
    raise last_exc  # type: ignore[misc]`,
      },
      {
        title: 'Repository Discussions vs Community Discussions',
        titleZh: '仓库 Discussions 与 Community Discussions 的区别',
        content:
          'GitHub Community Discussions is the platform-wide forum hosted at github.com/discussions. ' +
          'Repository Discussions live inside a single repository and are enabled per repository. ' +
          'Achievements are tied to repository Discussions. ' +
          'Additionally, community reports indicate that achievements are no longer surfaced inside Community ' +
          'Discussions themselves, as a spam countermeasure.',
        contentZh:
          'GitHub Community Discussions 是托管在 github.com/discussions 的全站论坛；' +
          '而仓库 Discussions 位于单个仓库内部，需要仓库单独启用。' +
          '成就是与仓库级 Discussions 绑定的。' +
          '此外，社区报告显示：为反制垃圾信息，Community Discussions 内部已不再展示成就徽章。',
        steps: [
          'Verify the repository has its own Discussions tab with categories.',
          'Do not rely on the global github.com/discussions forum for this achievement.',
          'If your accepted answer is not counted, check the repository Discussions category configuration.',
        ],
      },
    ],
    guides: [
      {
        title: 'Turning a good answer into an accepted answer',
        titleZh: '把好回答变成「被采纳」的回答',
        readingTime: 7,
        content: `## 「被采纳」意味着什么

提问者可以把自己的问题标记为「已解决」，并指定某条回答为「已采纳回答」。这既是给回答者的反馈，也是社区的知识沉淀机制。

但要注意：**只有提问者能标记**。你无法自己给自己的回答点「采纳」。

## 一条高概率被采纳的回答的结构

1. **先给结论**：第一段直接说该怎么做。
2. **再给代码**：完整、可复制、可运行。
3. **然后解释原因**：为什么这样能解决，而不是仅仅碰巧有效。
4. **补充边界**：什么情况下不适用、版本要求是什么。
5. **必要时给替代方案**：并说明各自取舍。

\`\`\`markdown
简短结论（1 句话）

\`\`\`ts
// 最小可运行示例
\`\`\`

### 为什么这样能解决
原理说明（2-3 段）

### 注意事项
- 版本 / 环境要求
- 边界情况
\`\`\`

## 常见的「不被采纳」原因

- **回答了另一个问题**：答非所问是最常见的失败原因。
- **只有链接没有解释**：直接丢一个文档链接，提问者无法判断是否适用。
- **代码片段缺少上下文**：缺少 import、版本或输入输出说明。
- **与提问者环境不符**：没有确认版本、操作系统、依赖版本。
- **一次贴了超长日志**：关键信息被淹没。

## 提问者视角

如果你也在提问，记得：

- 用 Q&A 分类提问，而不是 General 或 Q&A 之外的分类。
- 描述清楚环境（版本、OS、复现步骤）。
- 得到解答后标记「已采纳」，这既是礼貌，也是让未来的人能找到答案。

## 如何找到适合回答的 Discussions

- 关注你技术栈相关的活跃仓库的 Discussions。
- 在仓库 Issues 里搜索 \`is:issue is:open "how do i"\` 之类的问题，认领后再到 Discussions 提问。
- 关注使用 \`answer\` / \`answered\` 标签的仓库。
- 留意 README 中提到 "Questions" 链接指向 Discussions 的项目。`,
        contentZh: `## 「被采纳」意味着什么

提问者可以把自己的问题标记为「已解决」，并指定某条回答为「已采纳回答」。这既是给回答者的反馈，也是社区的知识沉淀机制。

但要注意：**只有提问者能标记**。你无法自己给自己的回答点「采纳」。

## 一条高概率被采纳的回答的结构

1. **先给结论**：第一段直接说该怎么做。
2. **再给代码**：完整、可复制、可运行。
3. **然后解释原因**：为什么这样能解决，而不是仅仅碰巧有效。
4. **补充边界**：什么情况下不适用、版本要求是什么。
5. **必要时给替代方案**：并说明各自取舍。

\`\`\`markdown
简短结论（1 句话）

\`\`\`ts
// 最小可运行示例
\`\`\`

### 为什么这样能解决
原理说明（2-3 段）

### 注意事项
- 版本 / 环境要求
- 边界情况
\`\`\`

## 常见的「不被采纳」原因

- **回答了另一个问题**：答非所问是最常见的失败原因。
- **只有链接没有解释**：直接丢一个文档链接，提问者无法判断是否适用。
- **代码片段缺少上下文**：缺少 import、版本或输入输出说明。
- **与提问者环境不符**：没有确认版本、操作系统、依赖版本。
- **一次贴了超长日志**：关键信息被淹没。

## 提问者视角

如果你也在提问，记得：

- 用 Q&A 分类提问，而不是 General 或 Q&A 之外的分类。
- 描述清楚环境（版本、OS、复现步骤）。
- 得到解答后标记「已采纳」，这既是礼貌，也是让未来的人能找到答案。

## 如何找到适合回答的 Discussions

- 关注你技术栈相关的活跃仓库的 Discussions。
- 在仓库 Issues 里搜索 \`is:issue is:open "how do i"\` 之类的问题，认领后再到 Discussions 提问。
- 关注使用 \`answer\` / \`answered\` 标签的仓库。
- 留意 README 中提到 "Questions" 链接指向 Discussions 的项目。`,
      },
    ],
    sources: [
      OFFICIAL_PROFILE_DOC,
      {
        title: 'awesome-github-badges — GitHub Achievements 清单（社区维护）',
        url: 'https://github.com/ranjiGT/awesome-github-badges',
        sourceType: 'COLLECTIVE_EVIDENCE',
        credibility: 'B',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '记录 Galaxy Brain 条件为「在 Discussions 中有被采纳的回答」，状态可用。',
      },
      {
        title: 'GitHub Docs — About GitHub Discussions',
        url: 'https://docs.github.com/en/discussions/collaborating-with-your-community-using-discussions/about-discussions',
        sourceType: 'OFFICIAL_DOC',
        credibility: 'A',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '官方说明仓库 Discussions 的启用方式与 Q&A 分类。',
      },
      {
        title: 'Dev.to — GitHub Achievements Explained（默认等级为 2 的勘误）',
        url: 'https://dev.to/6t9/github-achievements-explained-every-badge-tier-and-a-cli-to-track-your-progress-3a1d',
        sourceType: 'COMMUNITY',
        credibility: 'C',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '指出部分攻略把 Galaxy Brain 的默认等级误写为 1，正确为 2。',
      },
    ],
  },

  // ==========================================================================
  // 7. Public Sponsor
  // ==========================================================================
  {
    slug: 'public-sponsor',
    nameEn: 'Public Sponsor',
    nameZh: '公开赞助成就',
    summaryEn:
      'Awarded for publicly sponsoring an open source maintainer or project through GitHub Sponsors.',
    summaryZh:
      '通过 GitHub Sponsors 以公开身份赞助开源维护者或项目时获得。',
    descriptionEn:
      'Public Sponsor recognises financial support for open source. The word "public" is the operative part: ' +
      'the sponsorship must not be private, because the achievement exists to make sponsorship visible and ' +
      'encourage others to do the same. ' +
      'Community reports indicate the badge is tied to an active sponsorship, so it may disappear if the ' +
      'sponsorship is cancelled or made private. ' +
      'Sponsoring costs real money. That is entirely voluntary, and this page exists to explain the mechanics — ' +
      'not to pressure anyone into spending.',
    descriptionZh:
      'Public Sponsor 认可的是对开源项目的资金支持。关键词是「公开」—— 赞助必须是公开的，' +
      '因为这枚成就的意义就在于让赞助行为可见，并鼓励更多人这样做。' +
      '社区报告表明，这枚徽章与「进行中的赞助」绑定，' +
      '因此若取消赞助或将其改为私密，徽章可能会消失。' +
      '赞助需要真实付费。这完全出于自愿；本页只解释机制，不鼓励任何人花钱。',
    backgroundEn:
      'Public Sponsor was introduced together with the expansion of GitHub Sponsors. It is one of the few ' +
      'achievements tied to a paid relationship rather than to code.',
    backgroundZh:
      'Public Sponsor 与 GitHub Sponsors 的扩展一同推出。' +
      '它是少数与「付费关系」而非与「代码」绑定的成就之一。',
    conditionEn:
      'Sponsor an open source maintainer or project via GitHub Sponsors with the sponsorship set to public. ' +
      'GitHub does not publish whether the sponsorship must be active at the moment of viewing.',
    conditionZh:
      '通过 GitHub Sponsors 以「公开」方式赞助开源维护者或项目。' +
      'GitHub 未公布在查看徽章时该赞助是否必须处于有效状态。',
    imageUrl: img('public-sponsor'),
    imageHdUrl: img('public-sponsor'),
    difficulty: 3,
    availability: 'AVAILABLE',
    isTiered: false,
    categorySlug: 'single-level',
    credibility: 'C',
    uncertain: true,
    uncertaintyNote:
      '社区报告指出该徽章与「有效赞助」状态绑定，取消赞助后可能消失。GitHub 官方未说明具体判定逻辑。',
    popularity: 70,
    verifiedAt: VERIFIED,
    tiers: [],
    requirements: [
      {
        title: 'Make a public sponsorship',
        titleZh: '进行一次公开赞助',
        content:
          'Sponsorship is only counted when it is public. A private sponsorship does not carry the badge. ' +
          'GitHub Sponsors bills the sponsor monthly (or annually), and there is no charge for a single payment.',
        contentZh:
          '只有公开的赞助才会计入。私密赞助不会获得徽章。' +
          'GitHub Sponsors 按月（或按年）向赞助者扣费，单次赞助本身不产生费用。',
        steps: [
          'Open a maintainer\'s or organisation\'s GitHub Sponsors page (github.com/sponsors/<username>).',
          'Choose a tier (many maintainers offer a free tier, which also counts as a sponsorship).',
          'Complete the payment details if the tier is paid.',
          'Before confirming, make sure "Private" is NOT selected — the sponsorship must be public.',
          'After confirming, visit your own profile and check the Achievements section.',
        ],
      },
      {
        title: 'Public vs private sponsorship',
        titleZh: '公开赞助与私密赞助的区别',
        content:
          'GitHub Sponsors lets you hide a sponsorship from public view. Public sponsors get listed on the ' +
          'sponsor\'s profile page (unless they choose to be listed anonymously, which still keeps the sponsorship ' +
          'public but hides the name). A private sponsorship is not listed at all and does not carry the badge.',
        contentZh:
          'GitHub Sponsors 允许你把赞助从公开视图中隐藏。' +
          '公开赞助者会出现在被赞助者的资料页上（除非选择匿名展示 —— 这仍然是公开赞助，只是隐藏姓名）。' +
          '私密赞助完全不会被列出，也不会获得徽章。',
        steps: [
          'On the checkout page, choose between "Public" and "Private".',
          'Public + listed = your name appears on the sponsor page.',
          'Public + anonymous = sponsorship is public but your name is not shown.',
          'Private = hidden entirely, and no badge.',
        ],
      },
    ],
    guides: [
      {
        title: 'What GitHub Sponsors is and how it works',
        titleZh: 'GitHub Sponsors 是什么，以及它如何运作',
        readingTime: 6,
        content: `## 概念

GitHub Sponsors 让开源维护者可以直接获得资金支持，平台负责处理收款、税务与合规。维护者可以设置多个档位，赞助者按月或按年支付。

## 常见问题

### 赞助需要多少钱？

取决于维护者设置的档位。**很多维护者提供免费档位（Free tier）**，这同样算作一次赞助，同样可以获得徽章。**任何金额都完全自愿**，包括 0 元档位。

### 为什么会扣款？

GitHub Sponsors 采用**定期扣款**模式（通常按月）。你是在授权一个持续性的赞助，而不是一次性付款。中途可以随时取消，取消后不会产生额外费用。

### 公开和私密有什么区别？

| 类型 | 是否出现在被赞助者资料页 | 是否获得 Public Sponsor 徽章 |
| --- | --- | --- |
| 公开（显示姓名） | 是 | 是 |
| 公开（匿名） | 否 | 是 |
| 私密 | 否 | 否 |

### 我能看到别人的赞助明细吗？

不能。公开赞助只会展示「某人在赞助」，不会展示金额，除非维护者自己额外公开。

### 赞助能退款吗？

订阅类赞助可以随时取消，取消后不再扣费。已经产生的周期按 GitHub Sponsors 的退款政策处理。

## 安全提示

- 付款信息由 GitHub 处理，本站不接触任何支付数据。
- 只在 \`github.com/sponsors/\` 官方页面操作，警惕任何声称「代付解锁成就」的第三方服务 —— 这类服务既不可信也可能违反 GitHub 条款。
- 不要因为「别人都赞助了」而产生压力。开源维护者的持续产出需要支持，但支持的形式与金额由你自行决定。`,
        contentZh: `## 概念

GitHub Sponsors 让开源维护者可以直接获得资金支持，平台负责处理收款、税务与合规。维护者可以设置多个档位，赞助者按月或按年支付。

## 常见问题

### 赞助需要多少钱？

取决于维护者设置的档位。**很多维护者提供免费档位（Free tier）**，这同样算作一次赞助，同样可以获得徽章。**任何金额都完全自愿**，包括 0 元档位。

### 为什么会扣款？

GitHub Sponsors 采用**定期扣款**模式（通常按月）。你是在授权一个持续性的赞助，而不是一次性付款。中途可以随时取消，取消后不会产生额外费用。

### 公开和私密有什么区别？

| 类型 | 是否出现在被赞助者资料页 | 是否获得 Public Sponsor 徽章 |
| --- | --- | --- |
| 公开（显示姓名） | 是 | 是 |
| 公开（匿名） | 否 | 是 |
| 私密 | 否 | 否 |

### 我能看到别人的赞助明细吗？

不能。公开赞助只会展示「某人在赞助」，不会展示金额，除非维护者自己额外公开。

### 赞助能退款吗？

订阅类赞助可以随时取消，取消后不再扣费。已经产生的周期按 GitHub Sponsors 的退款政策处理。

## 安全提示

- 付款信息由 GitHub 处理，本站不接触任何支付数据。
- 只在 \`github.com/sponsors/\` 官方页面操作，警惕任何声称「代付解锁成就」的第三方服务 —— 这类服务既不可信也可能违反 GitHub 条款。
- 不要因为「别人都赞助了」而产生压力。开源维护者的持续产出需要支持，但支持的形式与金额由你自行决定。`,
      },
    ],
    sources: [
      OFFICIAL_PROFILE_DOC,
      {
        title: 'GitHub Docs — About GitHub Sponsors',
        url: 'https://docs.github.com/en/sponsors/getting-started-with-github-sponsors/about-github-sponsors',
        sourceType: 'OFFICIAL_DOC',
        credibility: 'A',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '官方说明 Sponsors 的档位、扣款与公开/私密机制。',
      },
      {
        title: 'awesome-github-badges — GitHub Achievements 清单（社区维护）',
        url: 'https://github.com/ranjiGT/awesome-github-badges',
        sourceType: 'COLLECTIVE_EVIDENCE',
        credibility: 'B',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '记录 Public Sponsor 为「公开赞助开源维护者或项目」，并注明与赞助有效状态相关。',
      },
    ],
  },

  // ==========================================================================
  // 8. Arctic Code Vault Contributor
  // ==========================================================================
  {
    slug: 'arctic-code-vault-contributor',
    nameEn: 'Arctic Code Vault Contributor',
    nameZh: '北极代码库贡献者',
    summaryEn:
      'Historical badge for contributing code that was captured in GitHub\'s 2020 Arctic Code Vault snapshot.',
    summaryZh:
      '历史纪念徽章：向被 GitHub 收录进 2020 年「北极代码库（Arctic Code Vault）」快照的仓库提交过代码。',
    descriptionEn:
      'In February 2020, GitHub archived a snapshot of public repositories to Arctic World Archive in Svalbard, ' +
      'Norway, to preserve open source code for the long term. Contributors whose code was part of that snapshot ' +
      'received this badge. ' +
      'The program is closed — the vault was created from a fixed snapshot taken on 2020-02-02 — so the badge can ' +
      'no longer be earned by new contributions. ' +
      'It remains a meaningful marker of having contributed to the open source commons at scale during that window.',
    descriptionZh:
      '2020 年 2 月，GitHub 将当时公开仓库的快照存档到挪威斯瓦尔巴群岛的北极世界档案馆，' +
      '以长期保存开源代码。代码进入该快照的贡献者获得了这枚徽章。' +
      '该项目已经结束 —— 快照的生成时间是 2020-02-02 固定不变的 —— ' +
      '因此新贡献已无法再获得此徽章。' +
      '它仍然是有意义的标记，代表你在那个时间窗口内为开源生态的宏大保存计划贡献过代码。',
    backgroundEn:
      'The Arctic Code Vault programme ran in early 2020. GitHub created the vault from a repository snapshot ' +
      'dated 2020-02-02, and the vault was deposited in Svalbard in November 2022.',
    backgroundZh:
      '北极代码库项目于 2020 年初启动。GitHub 使用 2020-02-02 的仓库快照创建存档，' +
      '该存档于 2022 年 11 月正式存入斯瓦尔巴群岛。',
    conditionEn:
      'Have authored a commit for one of the repositories included in the 2020 GitHub Archive Program snapshot. ' +
      'This program has ended and the badge is no longer obtainable.',
    conditionZh:
      '曾向 2020 年 GitHub 存档计划快照所收录的仓库提交过代码。' +
      '该项目已经结束，徽章不再提供。',
    imageUrl: img('arctic-code-vault-contributor'),
    imageHdUrl: img('arctic-code-vault-contributor'),
    difficulty: 5,
    availability: 'LIMITED',
    isTiered: false,
    categorySlug: 'limited',
    credibility: 'B',
    uncertain: false,
    popularity: 45,
    verifiedAt: VERIFIED,
    tiers: [],
    requirements: [
      {
        title: 'Historical condition (no longer obtainable)',
        titleZh: '历史获取条件（已无法获得）',
        content:
          'The badge was awarded for authoring a commit in a public repository that was included in the ' +
          'GitHub Archive Program snapshot taken on 2020-02-02. Because the snapshot is fixed, no new activity ' +
          'can satisfy it.',
        contentZh:
          '该徽章授予那些在 2020-02-02 的 GitHub 存档计划快照所收录公开仓库中提交过代码的贡献者。' +
          '由于快照是固定的，新的活动无法满足这一条件。',
        steps: [
          'This achievement can no longer be earned — the eligibility window closed in 2020.',
          'If your profile already shows the badge, it was granted based on your pre-2020 contributions.',
          'For an equivalent modern contribution, the closest active achievements are Pull Shark and Pair Extraordinaire.',
        ],
      },
    ],
    guides: [
      {
        title: 'What the Arctic Code Vault was and why it mattered',
        titleZh: '北极代码库是什么，以及它为什么重要',
        readingTime: 5,
        content: `## 背景

软件开源，但开源项目随时可能消失：仓库被删除、组织解散、维护者停止维护。GitHub 在 2020 年发起「GitHub Archive Program」，
把当时所有公开仓库的完整历史快照存档到挪威斯瓦尔巴群岛的北极世界档案馆 —— 一个以「永久保存」为使命的设施。

快照生成时间：**2020-02-02**。

## 为什么它重要

- 它让「代码已经消失」这件事在物理层面变得可逆。
- 它迫使人们正视开源软件的保存成本 —— 基础设施、格式、长期可读性。
- 它成为业界讨论「数字遗产」与「开源可持续性」的重要案例。

## 现在的状态

- 存档已于 2022 年 11 月正式存入斯瓦尔巴群岛。
- 快照是**冻结**的，不会随 GitHub 现有仓库更新。
- 因此这枚徽章只属于 2020 年 2 月 2 日之前就参与开源的贡献者。

## 对今天的人意味着什么

如果你现在才开始贡献开源，不必因为拿不到这枚历史徽章而气馁。
今天同样有真实价值的成就是：

- **Pull Shark** —— 持续地让代码被合并。
- **Pair Extraordinaire** —— 与他人共同完成并被合并的提交。
- **Galaxy Brain** —— 在 Discussions 中给出被采纳的回答。
- **Starstruck** —— 让自己的项目真正被人使用。

这些都建立在当下的真实协作上，比一枚历史快照徽章更有持续性。`,
        contentZh: `## 背景

软件开源，但开源项目随时可能消失：仓库被删除、组织解散、维护者停止维护。GitHub 在 2020 年发起「GitHub Archive Program」，
把当时所有公开仓库的完整历史快照存档到挪威斯瓦尔巴群岛的北极世界档案馆 —— 一个以「永久保存」为使命的设施。

快照生成时间：**2020-02-02**。

## 为什么它重要

- 它让「代码已经消失」这件事在物理层面变得可逆。
- 它迫使人们正视开源软件的保存成本 —— 基础设施、格式、长期可读性。
- 它成为业界讨论「数字遗产」与「开源可持续性」的重要案例。

## 现在的状态

- 存档已于 2022 年 11 月正式存入斯瓦尔巴群岛。
- 快照是**冻结**的，不会随 GitHub 现有仓库更新。
- 因此这枚徽章只属于 2020 年 2 月 2 日之前就参与开源的贡献者。

## 对今天的人意味着什么

如果你现在才开始贡献开源，不必因为拿不到这枚历史徽章而气馁。
今天同样有真实价值的成就是：

- **Pull Shark** —— 持续地让代码被合并。
- **Pair Extraordinaire** —— 与他人共同完成并被合并的提交。
- **Galaxy Brain** —— 在 Discussions 中给出被采纳的回答。
- **Starstruck** —— 让自己的项目真正被人使用。

这些都建立在当下的真实协作上，比一枚历史快照徽章更有持续性。`,
      },
    ],
    sources: [
      {
        title: 'awesome-github-badges — GitHub Achievements 清单（社区维护）',
        url: 'https://github.com/ranjiGT/awesome-github-badges',
        sourceType: 'COLLECTIVE_EVIDENCE',
        credibility: 'B',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '明确标注为 Historical（历史）状态。',
      },
      {
        title: 'GitHub Docs — Profile reference（含 Mars 2020 存档仓库说明）',
        url: 'https://docs.github.com/en/account-and-profile/reference/profile-reference',
        sourceType: 'OFFICIAL_DOC',
        credibility: 'A',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '官方文档记录了同类历史存档成就的结束状态。',
      },
    ],
  },

  // ==========================================================================
  // 9. Mars 2020 Contributor
  // ==========================================================================
  {
    slug: 'mars-2020-contributor',
    nameEn: 'Mars 2020 Contributor',
    nameZh: '火星 2020 贡献者',
    summaryEn:
      'Historical badge for contributing code to a repository used by NASA\'s Mars 2020 helicopter mission.',
    summaryZh:
      '历史纪念徽章：向 NASA「火星 2020」火星直升机任务所使用的仓库提交过代码。',
    descriptionEn:
      'GitHub was among the companies that supported NASA\'s Mars 2020 mission, and the repositories used for ' +
      'the Ingenuity helicopter flight software were developed publicly on GitHub. ' +
      'Contributors to those qualifying repositories received this badge. ' +
      'GitHub\'s own documentation states plainly that this event has ended and the badge is no longer available.',
    descriptionZh:
      'GitHub 是支持 NASA「火星 2020」任务的公司之一，' +
      '而用于「机智号（Ingenuity）」直升机飞控软件的仓库正是在 GitHub 上公开开发的。' +
      '向这些符合条件的仓库提交过代码的贡献者获得了这枚徽章。' +
      'GitHub 官方文档明确写明：该项活动已经结束，徽章不再提供。',
    backgroundEn:
      'NASA flew the Ingenuity helicopter on Mars as part of the Mars 2020 mission. The flight software was ' +
      'developed openly on GitHub, and NASA/JPL published the list of qualifying repositories.',
    backgroundZh:
      'NASA 在「火星 2020」任务中成功 flew 了「机智号」火星直升机。' +
      '其飞控软件在 GitHub 上公开开发，NASA 喷气推进实验室随后公布了符合条件的仓库清单。',
    conditionEn:
      'Have authored a commit for one of the repositories listed as qualifying for the Mars 2020 Helicopter ' +
      'Contributor achievement. GitHub\'s documentation states that this event has ended and the badge is no ' +
      'longer available.',
    conditionZh:
      '曾向 GitHub 官方公布的「Mars 2020 Helicopter Contributor 合格仓库清单」中的某个仓库提交过代码。' +
      'GitHub 官方文档写明：该项活动已经结束，徽章不再提供。',
    imageUrl: img('mars-2020-contributor'),
    imageHdUrl: img('mars-2020-contributor'),
    difficulty: 5,
    availability: 'DISCONTINUED',
    isTiered: false,
    categorySlug: 'discontinued',
    credibility: 'A',
    uncertain: false,
    popularity: 42,
    verifiedAt: VERIFIED,
    tiers: [],
    requirements: [
      {
        title: 'Historical condition (officially ended)',
        titleZh: '历史获取条件（官方已确认结束）',
        content:
          'GitHub\'s documentation contains a dedicated section titled "List of qualifying repositories for Mars ' +
          '2020 Helicopter Contributor achievement", stating: "The Mars 2020 Helicopter Contributor achievement ' +
          'was given to those who had authored a commit for one of the repositories listed below. This event has ' +
          'now ended, and the badge is no longer available."',
        contentZh:
          'GitHub 官方文档中有专门的章节「List of qualifying repositories for Mars 2020 Helicopter Contributor ' +
          'achievement」，其中写明：「Mars 2020 Helicopter Contributor 成就授予那些向清单所列仓库提交过代码的人。' +
          '该项活动现已结束，徽章不再提供。」',
        steps: [
          'This achievement can no longer be earned — GitHub confirms the event has ended.',
          'Existing holders keep the badge permanently.',
          'For comparable modern work, see Pull Shark and Pair Extraordinaire.',
        ],
      },
    ],
    guides: [
      {
        title: 'Open source on Mars: the Mars 2020 story',
        titleZh: '火星上的开源：Mars 2020 的故事',
        readingTime: 4,
        content: `## 一段真实的历史

2021 年 4 月 19 日，NASA 的「机智号（Ingenuity）」火星直升机在火星表面完成了首次 powered flight。

这架直升机的飞控软件并不是闭源开发的 —— 它在 GitHub 上公开仓库中构建，NASA 喷气推进实验室（JPL）事后还专门公布了「哪些仓库算作火星任务的一部分」的清单。贡献到这些仓库里的人，就拿到了这枚徽章。

## 为什么这件事重要

它证明了开源协作模式可以支撑**国家级深空任务**级别的软件工程：

- 代码与构建过程完全公开，任何人都可以审查。
- 团队分布在不同机构与时区，靠 issue 与 PR 协作。
- 完整的历史被保留下来 —— 这本身就是最好的文档。

## 现在还能做什么

火星任务相关的仓库今天依然存在并接受贡献（NASA/JPL 的 F Prime、监理框架等）。虽然已无法获得这枚历史徽章，
但**为真实的航天软件贡献代码**，本身就是极高价值的经历。

### 参考

- GitHub 官方文档中的合格仓库清单章节
- NASA / JPL 的 F Prime 开源项目

> [!NOTE]
> 贡献前请先阅读仓库的 CONTRIBUTING.md 与行为准则。航天类项目通常对变更流程有严格要求。`,
        contentZh: `## 一段真实的历史

2021 年 4 月 19 日，NASA 的「机智号（Ingenuity）」火星直升机在火星表面完成了首次动力飞行。

这架直升机的飞控软件并不是闭源开发的 —— 它在 GitHub 上公开仓库中构建，NASA 喷气推进实验室（JPL）事后还专门公布了「哪些仓库算作火星任务的一部分」的清单。贡献到这些仓库里的人，就拿到了这枚徽章。

## 为什么这件事重要

它证明了开源协作模式可以支撑**国家级深空任务**级别的软件工程：

- 代码与构建过程完全公开，任何人都可以审查。
- 团队分布在不同机构与时区，靠 issue 与 PR 协作。
- 完整的历史被保留下来 —— 这本身就是最好的文档。

## 现在还能做什么

火星任务相关的仓库今天依然存在并接受贡献（NASA/JPL 的 F Prime、监理框架等）。虽然已无法获得这枚历史徽章，
但**为真实的航天软件贡献代码**，本身就是极高价值的经历。

### 参考

- GitHub 官方文档中的合格仓库清单章节
- NASA / JPL 的 F Prime 开源项目

> [!NOTE]
> 贡献前请先阅读仓库的 CONTRIBUTING.md 与行为准则。航天类项目通常对变更流程有严格要求。`,
      },
    ],
    sources: [
      {
        title:
          'GitHub Docs — List of qualifying repositories for Mars 2020 Helicopter Contributor achievement',
        url: 'https://docs.github.com/en/account-and-profile/reference/profile-reference#list-of-qualifying-repositories-for-mars-2020-helicopter-contributor-achievement',
        sourceType: 'OFFICIAL_DOC',
        credibility: 'A',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '官方明确写明「This event has now ended, and the badge is no longer available」。',
      },
      {
        title: 'awesome-github-badges — GitHub Achievements 清单（社区维护）',
        url: 'https://github.com/ranjiGT/awesome-github-badges',
        sourceType: 'COLLECTIVE_EVIDENCE',
        credibility: 'B',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '标注为 Historical 状态。',
      },
    ],
  },

  // ==========================================================================
  // 10. Heart On Your Sleeve
  // ==========================================================================
  {
    slug: 'heart-on-your-sleeve',
    nameEn: 'Heart On Your Sleeve',
    nameZh: '袖口爱心',
    summaryEn:
      'An experimental achievement that was accidentally enabled and then withdrawn by GitHub in 2026.',
    summaryZh:
      '一枚处于实验阶段的成就：2026 年曾被 GitHub 意外开启，随后又被撤回。',
    descriptionEn:
      'Heart On Your Sleeve has never had publicly documented criteria. ' +
      'Community reports in early 2026 described GitHub briefly enabling this achievement by mistake — it was part ' +
      'of an unreleased experimental rollout — and then withdrawing it days later after acknowledging a backend ' +
      'error. ' +
      'There is therefore currently no legitimate way to obtain it, and the published conditions you may find ' +
      'elsewhere are not reliable. ' +
      'This entry exists so that people searching for it can be told the truth rather than sent chasing a badge ' +
      'GitHub has switched off.',
    descriptionZh:
      'Heart On Your Sleeve 从未有过公开的获取条件说明。' +
      '2026 年初的社区报告显示，GitHub 曾意外启用这枚成就 —— 它属于一次尚未发布的实验性灰度 —— ' +
      '数日后又将其撤回，并确认这是一次后端错误。' +
      '因此目前没有任何合法途径可以获得它，' +
      '你在其他地方看到的「获取条件」并不可靠。' +
      '本站收录这一条目，是为了让搜索到它的人能看到事实，而不是去追逐一个 GitHub 已经关闭的徽章。',
    backgroundEn:
      'Public reports describe an accidental enablement of two long-dormant experimental achievements in early ' +
      '2026, followed by a rollback within days.',
    backgroundZh:
      '公开报告显示，2026 年初两枚长期处于「实验性、未发布」状态的成就被意外开启，' +
      '数日后 GitHub 确认错误并回滚。',
    conditionEn:
      'No publicly documented condition. GitHub confirmed in Community Discussions that the brief 2026 activation ' +
      'was a backend error and the achievement is switched off at the source.',
    conditionZh:
      '没有公开的获取条件。GitHub 在 Community Discussions 中确认，2026 年的短暂开启是一次后端错误，' +
      '该成就已在源头被关闭。',
    imageUrl: img('heart-on-your-sleeve'),
    imageHdUrl: img('heart-on-your-sleeve'),
    difficulty: 5,
    availability: 'DISCONTINUED',
    isTiered: false,
    categorySlug: 'discontinued',
    credibility: 'C',
    uncertain: true,
    uncertaintyNote:
      'GitHub 从未公开说明该成就的正式条件。本站仅记录"曾被意外开启后撤回"这一有公开报道的事实，' +
      '不提供任何获取方法，因为确实不存在。',
    popularity: 55,
    verifiedAt: VERIFIED,
    tiers: [],
    requirements: [
      {
        title: 'Currently unobtainable',
        titleZh: '当前无法获得',
        content:
          'There is no action that can trigger this badge while it is disabled. ' +
          'If a guide claims otherwise, it is either outdated or describing the accidental 2026 window.',
        contentZh:
          '在该成就被关闭的状态下，没有任何操作能够触发这枚徽章。' +
          '如果某份攻略声称可以，那要么已经过时，要么在描述 2026 年那次意外开启的窗口期。',
        steps: [
          'Check your own profile — if the badge appears, you already have it from the accidental window.',
          'Do not follow third-party "guaranteed unlock" services; they cannot deliver a badge that is switched off.',
          'Focus on currently obtainable achievements instead.',
        ],
      },
    ],
    guides: [
      {
        title: 'How a disabled achievement behaves, and what to do instead',
        titleZh: '被关闭的成就是什么表现，以及你该怎么做',
        readingTime: 4,
        content: `## 「没有徽章」不等于「你做错了什么」

GitHub 的成就系统是服务端判定的。当一枚成就被关闭时，**没有任何客户端行为可以触发它**。
你完成再多次相关操作也不会出现徽章，这不是你的问题。

## 怎么判断一枚成就是否真的可用

1. 打开你自己的资料页，看侧边栏的 Achievements 区域 —— 能看到说明与事件链接的是你账号当前可用的。
2. 查本站的「获取状态」字段与「来源与核实」区块。
3. 注意可信度等级：A 级代表 GitHub 官方明确说明；B/C 级是社区实测；D 级是未验证推测。

## 遇到「保证解锁」服务怎么办

凡是承诺「付费代解锁 GitHub 成就」的服务都应当避开：

- GitHub 的成就完全由服务端判定，第三方无法「代刷」。
- 这类服务往往要求交出账号密码或安装来历不明的脚本，风险极高。
- 购买账号、买 Star、买 Sponsorship 都违反 GitHub 服务条款。

## 替代目标

| 你的目标 | 现在可行的成就 |
| --- | --- |
| 证明代码被社区接受 | Pull Shark |
| 证明与他人协作 | Pair Extraordinaire |
| 证明技术表达能力 | Galaxy Brain |
| 证明项目影响力 | Starstruck |
| 支持开源 | Public Sponsor |`,
        contentZh: `## 「没有徽章」不等于「你做错了什么」

GitHub 的成就系统是服务端判定的。当一枚成就被关闭时，**没有任何客户端行为可以触发它**。
你完成再多次相关操作也不会出现徽章，这不是你的问题。

## 怎么判断一枚成就是否真的可用

1. 打开你自己的资料页，看侧边栏的 Achievements 区域 —— 能看到说明与事件链接的是你账号当前可用的。
2. 查本站的「获取状态」字段与「来源与核实」区块。
3. 注意可信度等级：A 级代表 GitHub 官方明确说明；B/C 级是社区实测；D 级是未验证推测。

## 遇到「保证解锁」服务怎么办

凡是承诺「付费代解锁 GitHub 成就」的服务都应当避开：

- GitHub 的成就完全由服务端判定，第三方无法「代刷」。
- 这类服务往往要求交出账号密码或安装来历不明的脚本，风险极高。
- 购买账号、买 Star、买 Sponsorship 都违反 GitHub 服务条款。

## 替代目标

| 你的目标 | 现在可行的成就 |
| --- | --- |
| 证明代码被社区接受 | Pull Shark |
| 证明与他人协作 | Pair Extraordinaire |
| 证明技术表达能力 | Galaxy Brain |
| 证明项目影响力 | Starstruck |
| 支持开源 | Public Sponsor |`,
      },
    ],
    sources: [
      {
        title: 'Dev.to — GitHub Quietly Broke 2 Achievement Badges in 2026',
        url: 'https://dev.to/sahil_akoliya_dev/github-quietly-broke-2-achievement-badges-in-2026-heres-what-actually-works-3a1d',
        sourceType: 'COMMUNITY',
        credibility: 'C',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '记录 2026 年 Heart On Your Sleeve 与 Open Sourcerer 被意外开启后撤回，GitHub 确认为后端错误。',
      },
      {
        title: 'awesome-github-badges — GitHub Achievements 清单（社区维护）',
        url: 'https://github.com/ranjiGT/awesome-github-badges',
        sourceType: 'COLLECTIVE_EVIDENCE',
        credibility: 'B',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '标注为「Availability may vary; check your profile」，并指出 GitHub 未公布条件。',
      },
    ],
  },

  // ==========================================================================
  // 11. Open Sourcerer
  // ==========================================================================
  {
    slug: 'open-sourcerer',
    nameEn: 'Open Sourcerer',
    nameZh: '开源贡献者',
    summaryEn:
      'An experimental achievement for contributing across public repositories; it was withdrawn in 2026.',
    summaryZh:
      '一枚面向公开仓库贡献的实验性成就，2026 年已被 GitHub 撤回。',
    descriptionEn:
      'Open Sourcerer was an unreleased experimental achievement whose suggested purpose was recognising ' +
      'contributions spread across multiple public repositories. ' +
      'Like Heart On Your Sleeve, it was briefly switched on by mistake in early 2026 and then withdrawn after ' +
      'GitHub confirmed a backend error. ' +
      'No reliable public criteria exist, and no legitimate acquisition path is currently available. ' +
      'It is listed here for completeness and transparency, with its status clearly marked.',
    descriptionZh:
      'Open Sourcerer 是一枚从未正式发布的实验性成就，' +
      '其预期用途是认可「分散在多个公开仓库中的贡献」。' +
      '与 Heart On Your Sleeve 一样，它在 2026 年初被意外开启，' +
      '随后在 GitHub 确认后端错误后被撤回。' +
      '目前不存在可靠的公开条件说明，也没有可用的合法获取路径。' +
      '本站收录它是为了信息完整与透明，并明确标注其状态。',
    backgroundEn:
      'Community reports describe Open Sourcerer as part of the same unreleased experimental rollout as ' +
      'Heart On Your Sleeve, with the same accidental enablement and rollback in 2026.',
    backgroundZh:
      '社区报告把 Open Sourcerer 描述为与 Heart On Your Sleeve 同属一次未发布的实验性灰度，' +
      '并在 2026 年经历了同样的意外开启与回滚。',
    conditionEn:
      'No publicly documented condition. The achievement is not currently obtainable.',
    conditionZh:
      '没有公开的获取条件。该成就目前无法获得。',
    imageUrl: img('open-sourcerer'),
    imageHdUrl: img('open-sourcerer'),
    difficulty: 4,
    availability: 'DISCONTINUED',
    isTiered: false,
    categorySlug: 'discontinued',
    credibility: 'C',
    uncertain: true,
    uncertaintyNote:
      '仅记录"曾在 2026 年被意外开启后撤回"这一有公开报道的事实，未收录任何未经证实的获取条件。',
    popularity: 50,
    verifiedAt: VERIFIED,
    tiers: [],
    requirements: [
      {
        title: 'Currently unobtainable',
        titleZh: '当前无法获得',
        content:
          'The achievement is switched off at the source. Contributions to public repositories are still exactly ' +
          'as valuable as ever — they simply do not produce this badge right now.',
        contentZh:
          '该成就已在源头关闭。向公开仓库贡献的价值依然如故 —— 只是目前不会产生这枚徽章。',
        steps: [
          'Do not chase this badge; there is no action that triggers it.',
          'Use Pull Shark to track real contribution progress instead.',
          'Report back to this site if you find a first-party GitHub announcement about its official launch.',
        ],
      },
    ],
    guides: [
      {
        title: 'Why "contribute across repositories" is a good idea anyway',
        titleZh: '为什么「在多个仓库贡献」本身依然是好建议',
        readingTime: 4,
        content: `## 成就关闭，实践依然有效

Open Sourcerer 被关闭，但这枚成就背后想鼓励的行为 —— 在多个公开仓库里持续贡献 —— 本身没有任何问题。

## 在多个仓库贡献的实际收益

1. **更广的技术视野**：不同项目的代码风格、构建系统、CI 流程各不相同。
2. **更大的可信度网络**：多个维护者对你的评价，比单一仓库里的一条 PR 更有说服力。
3. **更低的被"绑定"风险**：不会因为某一个项目停止维护而中断积累。
4. **更好的问题定位能力**：见过足够多的实现方式，你更容易判断一个新方案的取舍。

## 怎么开始

- 从你日常使用的工具开始：修文档、加测试、报 bug、回答 issue。
- 优先选择有 \`good first issue\` 标签且最近有活动的仓库。
- 一次只改一件事，PR 描述写清楚「改了什么、为什么」。
- 收到 review 意见认真回复，必要时接受 "drive-by" 的小幅修改。

## 用 Pull Shark 记录进度

本站的「我的成就进度」页面可以让你手动填写已合并 PR 数量，自动计算距离 Bronze / Silver / Gold 还差多少。
这是目前最可靠的进度追踪方式 —— 因为 GitHub 并不通过 API 暴露真实的成就状态。`,
        contentZh: `## 成就关闭，实践依然有效

Open Sourcerer 被关闭，但这枚成就背后想鼓励的行为 —— 在多个公开仓库里持续贡献 —— 本身没有任何问题。

## 在多个仓库贡献的实际收益

1. **更广的技术视野**：不同项目的代码风格、构建系统、CI 流程各不相同。
2. **更大的可信度网络**：多个维护者对你的评价，比单一仓库里的一条 PR 更有说服力。
3. **更低的被"绑定"风险**：不会因为某一个项目停止维护而中断积累。
4. **更好的问题定位能力**：见过足够多的实现方式，你更容易判断一个新方案的取舍。

## 怎么开始

- 从你日常使用的工具开始：修文档、加测试、报 bug、回答 issue。
- 优先选择有 \`good first issue\` 标签且最近有活动的仓库。
- 一次只改一件事，PR 描述写清楚「改了什么、为什么」。
- 收到 review 意见认真回复，必要时接受 "drive-by" 的小幅修改。

## 用 Pull Shark 记录进度

本站的「我的成就进度」页面可以让你手动填写已合并 PR 数量，自动计算距离 Bronze / Silver / Gold 还差多少。
这是目前最可靠的进度追踪方式 —— 因为 GitHub 并不通过 API 暴露真实的成就状态。`,
      },
    ],
    sources: [
      {
        title: 'Dev.to — GitHub Quietly Broke 2 Achievement Badges in 2026',
        url: 'https://dev.to/sahil_akoliya_dev/github-quietly-broke-2-achievement-badges-in-2026-heres-what-actually-works-3a1d',
        sourceType: 'COMMUNITY',
        credibility: 'C',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '记录 2026 年被意外开启后撤回，GitHub 确认为后端错误。',
      },
      {
        title: 'awesome-github-badges — GitHub Achievements 清单（社区维护）',
        url: 'https://github.com/ranjiGT/awesome-github-badges',
        sourceType: 'COLLECTIVE_EVIDENCE',
        credibility: 'B',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '记录为「向公开仓库贡献」，并注明可用性需以本人资料页为准。',
      },
    ],
  },

  // ==========================================================================
  // 12. Finishing Touch（状态待核实）
  // ==========================================================================
  {
    slug: 'finishing-touch',
    nameEn: 'Finishing Touch',
    nameZh: '收尾成就',
    summaryEn:
      'An achievement whose existence and conditions could not be confirmed from authoritative public sources.',
    summaryZh:
      '一枚无法从权威公开来源确认其存在与获取条件的成就，本站明确标注为「状态待核实」。',
    descriptionEn:
      'Finishing Touch appears in some community listings of GitHub profile achievements, but we were unable to ' +
      'find a first-party GitHub document, changelog entry, or reliable reproducible account that establishes what ' +
      'it is or how it is earned. ' +
      'Rather than invent plausible-looking conditions, this entry is published with an explicit "unverified" ' +
      'status. ' +
      'If you have a reproducible method, or a first-party source, please submit it through the feedback form — we ' +
      'will verify and update this page.',
    descriptionZh:
      'Finishing Touch 出现在部分社区整理的 GitHub 个人成就清单中，' +
      '但我们未能找到 GitHub 官方文档、官方公告或可复现的可靠记录来确认它究竟是什么、又如何获得。' +
      '与其编造看起来合理的获取条件，不如以明确的「未验证」状态收录这一条目。' +
      '如果你手上有可复现的方法或官方来源，欢迎通过反馈表单提交 —— 我们核实后会更新本页。',
    backgroundEn:
      'The origin of this listing could not be traced to a first-party source.',
    backgroundZh:
      '该条目的出处无法追溯到任何第一方来源。',
    conditionEn:
      'Unknown. No condition is published here because none could be verified. ' +
      'This entry deliberately contains no acquisition instructions.',
    conditionZh:
      '未知。本页不填写任何获取条件，因为没有一条能被核实。' +
      '本条目刻意不包含任何获取指引。',
    imageUrl: null,
    imageHdUrl: null,
    difficulty: 5,
    availability: 'TESTING',
    isTiered: false,
    categorySlug: 'experimental',
    credibility: 'D',
    uncertain: true,
    uncertaintyNote:
      '未能在 GitHub 官方文档、官方公告或可靠的可复现社区记录中确认这枚成就。' +
      '按本站的资料可信度体系，它被归为 D 级（尚未验证的推测）。' +
      '本站不会为它编造任何获取条件。',
    popularity: 20,
    verifiedAt: VERIFIED,
    tiers: [],
    requirements: [
      {
        title: 'No verified condition available',
        titleZh: '暂无可核实的获取条件',
        content:
          'Because no condition has been verified, this entry intentionally contains no instructions. ' +
          'Publishing an unverified how-to would be worse than publishing nothing.',
        contentZh:
          '由于没有任何一条条件得到核实，本条目刻意不包含操作指引。' +
          '发布未经证实的教程，比不发布更糟糕。',
        steps: [
          'Consult the "My Collection" area to record it manually if you already hold it.',
          'Submit a first-party source or a reproducible method via the feedback form.',
          'We will re-verify and update this page, including the credibility grade.',
        ],
      },
    ],
    guides: [
      {
        title: 'How this site handles unknown achievements',
        titleZh: '本站如何处理「状态未知」的成就',
        readingTime: 3,
        content: `## 我们的原则

一本可信的百科必须能区分三件事：

1. **官方明确说明的**（可信度 A）
2. **有可复现证据的社区实测**（可信度 B）
3. **多个可靠社区来源一致**（可信度 C）
4. **尚未验证的推测**（可信度 D）

Finishing Touch 目前属于第 4 类。

## 为什么不干脆不收录

因为用户搜索不到任何解释，比看到一个明确标注「状态待核实」的条目更让人困惑。
把不确定性显式表达出来，本身就是一种价值。

## 什么时候会升级

只要出现下列任一情况，我们会立即升级这条记录的可信度并补全内容：

- GitHub 官方文档或官方博客发布相关说明；
- GitHub 官方 Community Discussions 中有管理员层面的确认；
- 出现可复现的操作步骤，并被多个独立来源验证。

## 你可以参与

如果你手上有第一方来源或可复现的方法，请在「常见问题」页面底部的反馈表单中提交。
我们会核实后更新，并保留变更记录。`,
        contentZh: `## 我们的原则

一本可信的百科必须能区分三件事：

1. **官方明确说明的**（可信度 A）
2. **有可复现证据的社区实测**（可信度 B）
3. **多个可靠社区来源一致**（可信度 C）
4. **尚未验证的推测**（可信度 D）

Finishing Touch 目前属于第 4 类。

## 为什么不干脆不收录

因为用户搜索不到任何解释，比看到一个明确标注「状态待核实」的条目更让人困惑。
把不确定性显式表达出来，本身就是一种价值。

## 什么时候会升级

只要出现下列任一情况，我们会立即升级这条记录的可信度并补全内容：

- GitHub 官方文档或官方博客发布相关说明；
- GitHub 官方 Community Discussions 中有管理员层面的确认；
- 出现可复现的操作步骤，并被多个独立来源验证。

## 你可以参与

如果你手上有第一方来源或可复现的方法，请在「常见问题」页面底部的反馈表单中提交。
我们会核实后更新，并保留变更记录。`,
      },
    ],
    sources: [
      {
        title: 'awesome-github-badges — GitHub Achievements 清单（社区维护）',
        url: 'https://github.com/ranjiGT/awesome-github-badges',
        sourceType: 'COLLECTIVE_EVIDENCE',
        credibility: 'D',
        status: 'DISPUTED',
        verifiedAt: VERIFIED,
        note:
          '部分社区整理中出现过该名称，但缺乏可核实的第一方说明；本站据此将其归为 D 级并标注状态待核实。',
        isDisputed: true,
      },
    ],
  },

  // ==========================================================================
  // 13-17. 程序徽章（官方文档「Displaying badges on your profile」）
  // ==========================================================================
  {
    slug: 'security-bug-bounty-hunter',
    nameEn: 'Security Bug Bounty Hunter',
    nameZh: '安全漏洞赏金猎人',
    summaryEn:
      'A program badge for having helped GitHub find and fix security vulnerabilities.',
    summaryZh:
      '项目计划徽章：曾协助发现并修复安全漏洞的贡献者会获得该徽章。',
    descriptionEn:
      'GitHub lists this badge under "Displaying badges on your profile" rather than under "Earning Achievements". ' +
      'It is awarded to people who assisted with hunting down security vulnerabilities through the GitHub ' +
      'Security Bug Bounty program, which rewards valid, responsibly reported vulnerabilities.',
    descriptionZh:
      'GitHub 官方文档把该徽章列在「Displaying badges on your profile」章节，' +
      '而非「Earning Achievements」章节。' +
      '它授予的是通过 GitHub 安全漏洞赏金计划协助发现安全漏洞的贡献者 —— ' +
      '该计划对有效且负责任提交的安全漏洞给予奖励。',
    backgroundEn:
      'The GitHub Security Bug Bounty program has paid out for responsibly reported vulnerabilities for years, ' +
      'and the profile badge is a long-standing part of that program.',
    backgroundZh:
      'GitHub 安全漏洞赏金计划多年来一直为负责任提交的安全漏洞提供奖励，' +
      '资料页徽章是该计划长期以来的组成部分。',
    conditionEn:
      'Assist GitHub with identifying and resolving security vulnerabilities through the GitHub Security program. ' +
      'This is a program badge, not a public-preview profile achievement, and it is not obtainable by ordinary ' +
      'GitHub activity.',
    conditionZh:
      '通过 GitHub 安全计划协助发现并解决安全漏洞。' +
      '这属于项目计划徽章，而非公开预览阶段的个人成就，无法通过常规 GitHub 活动获得。',
    imageUrl: null,
    imageHdUrl: null,
    difficulty: 5,
    availability: 'INTERNAL',
    isTiered: false,
    categorySlug: 'special',
    credibility: 'A',
    uncertain: false,
    popularity: 25,
    verifiedAt: VERIFIED,
    tiers: [],
    requirements: [
      {
        title: 'Program badge (not a profile achievement)',
        titleZh: '项目计划徽章（非个人成就）',
        content:
          'The badge is granted by the GitHub Security team outside the achievements system. ' +
          'Participation requires following the program\'s responsible disclosure rules.',
        contentZh:
          '该徽章由 GitHub 安全团队在成就系统之外授予。' +
          '参与时必须遵守该计划负责任披露的规则。',
        steps: [
          'Review the GitHub Security Bug Bounty program scope and rules before reporting anything.',
          'Report vulnerabilities through the official private reporting channel only.',
          'Never disclose a vulnerability publicly before it is fixed.',
          'Do not run automated scanners against GitHub infrastructure without authorisation.',
        ],
      },
    ],
    guides: [
      {
        title: 'Responsible security disclosure on GitHub',
        titleZh: '在 GitHub 上负责任地披露安全问题',
        readingTime: 5,
        content: `## 为什么重要

负责任披露是开源生态的基础设施。它要求：

1. **私下报告**：不要在公开 issue 中描述可利用的漏洞。
2. **给维护者时间**：通常应有 90 天等待期（可依据项目政策调整）。
3. **不越权测试**：只测试你有权测试的系统，遵守服务条款。
4. **不造成破坏**：不要获取他人数据、不要持久化访问、不要做 DoS。

## 上报渠道

- **仓库级**：使用 GitHub 仓库的 "Report a vulnerability" 私密报告功能。
- **GitHub 平台漏洞**：使用 GitHub Security Bug Bounty 的官方报告渠道。

## 什么不算漏洞

大多数项目赏金计划会明确列出"不算漏洞"的情况，例如：

- 缺少安全标头（HSTS、CSP 等）却没有被明确列为有效类别。
- 版本信息泄露。
- 自我 XSS。
- 未被证明影响的理论推断。

## 现实建议

不要把赏金当作收入来源或竞赛来刷。有效漏洞极其罕见，误报报告会浪费维护者时间并可能影响你的账号信誉。
把它看作对社区的责任，而不是一种变现方式。`,
        contentZh: `## 为什么重要

负责任披露是开源生态的基础设施。它要求：

1. **私下报告**：不要在公开 issue 中描述可利用的漏洞。
2. **给维护者时间**：通常应有 90 天等待期（可依据项目政策调整）。
3. **不越权测试**：只测试你有权测试的系统，遵守服务条款。
4. **不造成破坏**：不要获取他人数据、不要持久化访问、不要做 DoS。

## 上报渠道

- **仓库级**：使用 GitHub 仓库的 "Report a vulnerability" 私密报告功能。
- **GitHub 平台漏洞**：使用 GitHub Security Bug Bounty 的官方报告渠道。

## 什么不算漏洞

大多数项目赏金计划会明确列出"不算漏洞"的情况，例如：

- 缺少安全标头（HSTS、CSP 等）却没有被明确列为有效类别。
- 版本信息泄露。
- 自我 XSS。
- 未被证明影响的理论推断。

## 现实建议

不要把赏金当作收入来源或竞赛来刷。有效漏洞极其罕见，误报报告会浪费维护者时间并可能影响你的账号信誉。
把它看作对社区的责任，而不是一种变现方式。`,
      },
    ],
    sources: [
      {
        title: 'GitHub Docs — Profile reference（Displaying badges on your profile）',
        url: 'https://docs.github.com/en/account-and-profile/reference/profile-reference#displaying-badges-on-your-profile',
        sourceType: 'OFFICIAL_DOC',
        credibility: 'A',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '官方文档表格中列出了该徽章及其说明。',
      },
      {
        title: 'GitHub Docs — GitHub Security Bug Bounty program',
        url: 'https://docs.github.com/en/security/for-researchers/security-bug-bounty-program',
        sourceType: 'OFFICIAL_DOC',
        credibility: 'A',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '官方赏金计划说明。',
      },
    ],
  },
  {
    slug: 'github-campus-expert',
    nameEn: 'GitHub Campus Expert',
    nameZh: 'GitHub 校园专家',
    summaryEn:
      'A program badge for Campus Experts who lead a local student community.',
    summaryZh:
      '项目计划徽章：带领本地学生社区的 GitHub Campus Expert 获得的标识。',
    descriptionEn:
      'The GitHub Campus Expert program supports student leaders who run community events and help other students ' +
      'learn to build on GitHub. Participants receive this badge on their profile.',
    descriptionZh:
      'GitHub Campus Expert 计划支持那些组织社区活动、帮助其他学生学习在 GitHub 上构建项目的学生领袖。' +
      '参与者会在资料页上获得这枚徽章。',
    backgroundEn:
      'The Campus Expert programme has been running for many years across universities worldwide.',
    backgroundZh:
      'Campus Expert 计划已在全球多所高校运行多年。',
    conditionEn:
      'Participate in the GitHub Campus Expert program. This is a program badge, not a profile achievement.',
    conditionZh:
      '参与 GitHub Campus Expert 计划。这属于项目计划徽章，而非个人成就。',
    imageUrl: null,
    imageHdUrl: null,
    difficulty: 5,
    availability: 'INTERNAL',
    isTiered: false,
    categorySlug: 'special',
    credibility: 'A',
    uncertain: false,
    popularity: 18,
    verifiedAt: VERIFIED,
    tiers: [],
    requirements: [
      {
        title: 'Program badge (not a profile achievement)',
        titleZh: '项目计划徽章（非个人成就）',
        content:
          'The badge is granted through the Campus Expert program application, not by performing GitHub actions.',
        contentZh:
          '该徽章通过 Campus Expert 计划申请授予，而非通过完成某些 GitHub 操作。',
        steps: [
          'Apply to the GitHub Campus Expert program through its official application.',
          'If accepted, complete the program onboarding activities.',
          'Run community events and support students in your region.',
          'The badge appears on your profile automatically.',
        ],
      },
    ],
    guides: [
      {
        title: 'What the Campus Expert program is',
        titleZh: 'Campus Expert 计划是什么',
        readingTime: 3,
        content: `## 计划定位

GitHub Campus Expert 面向学生社区领袖，为他们提供资源、培训与徽章认可，以支持在校学生群体。

## 核心工作

- 组织工作坊、hackathon 与入门活动。
- 辅导学生的第一个开源项目贡献。
- 维护校园社群，产出技术内容。

## 为什么这类徽章值得单独收录

GitHub 资料页上的徽章分两类：

1. **个人成就（Achievements）**：由服务端根据平台行为自动判定，任何人都可能获得。
2. **项目计划徽章（Program badges）**：由特定计划授予，通常有申请或资格门槛。

本站把两类分开收录，并明确标注，避免用户误以为通过日常使用 GitHub 就能获得它们。`,
        contentZh: `## 计划定位

GitHub Campus Expert 面向学生社区领袖，为他们提供资源、培训与徽章认可，以支持在校学生群体。

## 核心工作

- 组织工作坊、hackathon 与入门活动。
- 辅导学生的第一个开源项目贡献。
- 维护校园社群，产出技术内容。

## 为什么这类徽章值得单独收录

GitHub 资料页上的徽章分两类：

1. **个人成就（Achievements）**：由服务端根据平台行为自动判定，任何人都可能获得。
2. **项目计划徽章（Program badges）**：由特定计划授予，通常有申请或资格门槛。

本站把两类分开收录，并明确标注，避免用户误以为通过日常使用 GitHub 就能获得它们。`,
      },
    ],
    sources: [
      {
        title: 'GitHub Docs — Profile reference（Displaying badges on your profile）',
        url: 'https://docs.github.com/en/account-and-profile/reference/profile-reference#displaying-badges-on-your-profile',
        sourceType: 'OFFICIAL_DOC',
        credibility: 'A',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '官方文档表格中列出了该徽章及其说明。',
      },
    ],
  },
  {
    slug: 'security-advisory-credit',
    nameEn: 'Security Advisory Credit',
    nameZh: '安全公告贡献',
    summaryEn:
      'A program badge for having a security advisory accepted into the GitHub Advisory Database.',
    summaryZh:
      '项目计划徽章：提交的安全公告被 GitHub Advisory Database 收录后获得的标识。',
    descriptionEn:
      'When a security advisory you submitted is accepted into the GitHub Advisory Database, GitHub displays ' +
      'this badge on your profile. It recognises the work of researchers who file well-formed, verifiable advisories.',
    descriptionZh:
      '当你提交的安全公告被 GitHub Advisory Database 收录时，GitHub 会在你的资料页展示这枚徽章。' +
      '它认可的是那些提交格式规范、结论可验证的公告的研究者。',
    backgroundEn:
      'The GitHub Advisory Database aggregates security advisories from researchers and maintainers.',
    backgroundZh:
      'GitHub Advisory Database 汇集了来自研究者与维护者的安全公告。',
    conditionEn:
      'Have a security advisory you submitted accepted into the GitHub Advisory Database. ' +
      'This is a program badge, not a profile achievement.',
    conditionZh:
      '提交的安全公告被 GitHub Advisory Database 收录。这属于项目计划徽章，而非个人成就。',
    imageUrl: null,
    imageHdUrl: null,
    difficulty: 5,
    availability: 'INTERNAL',
    isTiered: false,
    categorySlug: 'special',
    credibility: 'A',
    uncertain: false,
    popularity: 15,
    verifiedAt: VERIFIED,
    tiers: [],
    requirements: [
      {
        title: 'Program badge (not a profile achievement)',
        titleZh: '项目计划徽章（非个人成就）',
        content:
          'Submit a security advisory through GitHub\'s private advisory flow and have it accepted into the ' +
          'public advisory database.',
        contentZh:
          '通过 GitHub 的私密公告流程提交安全公告，并被收录进公开公告数据库。',
        steps: [
          'Report the vulnerability privately to the maintainer using "Report a vulnerability".',
          'Coordinate a fix and a coordinated disclosure timeline.',
          'Once the advisory is accepted and published, the badge is added to your profile.',
        ],
      },
    ],
    guides: [
      {
        title: 'Submitting a security advisory',
        titleZh: '提交一份安全公告',
        readingTime: 4,
        content: `## 流程

1. **私密报告**：使用仓库的 "Report a vulnerability" 功能，描述影响与复现方式。
2. **协作修复**：与维护者确认影响范围与修复方案。
3. **协调披露**：确定公开时间，通常与补丁发布同步。
4. **收录**：公告被接受后进入 GitHub Advisory Database，你的资料页会出现该徽章。

## 写一份高质量的公告

公告被收录的概率，很大程度上取决于它是否**可验证、可复现、影响明确**：

\`\`\`markdown
### Summary
<一句话描述问题>

### Severity
CVSS v3.1: <向量>  (影响评分)

### Affected versions
- <package> < 受影响版本范围 >

### Steps to reproduce
1. ...
2. ...
3. ...

### Impact
<攻击者能做什么，为什么这很重要>

### Remediation
<修复方式，或建议的缓解措施>
\`\`\`

## 注意

- 不要在公开渠道提前披露尚未修复的漏洞。
- 不要进行超出授权范围的压力测试。
- 提交前确认该问题确实构成安全问题，而非功能缺陷。`,
        contentZh: `## 流程

1. **私密报告**：使用仓库的 "Report a vulnerability" 功能，描述影响与复现方式。
2. **协作修复**：与维护者确认影响范围与修复方案。
3. **协调披露**：确定公开时间，通常与补丁发布同步。
4. **收录**：公告被接受后进入 GitHub Advisory Database，你的资料页会出现该徽章。

## 写一份高质量的公告

公告被收录的概率，很大程度上取决于它是否**可验证、可复现、影响明确**：

\`\`\`markdown
### Summary
<一句话描述问题>

### Severity
CVSS v3.1: <向量>  (影响评分)

### Affected versions
- <package> < 受影响版本范围 >

### Steps to reproduce
1. ...
2. ...
3. ...

### Impact
<攻击者能做什么，为什么这很重要>

### Remediation
<修复方式，或建议的缓解措施>
\`\`\`

## 注意

- 不要在公开渠道提前披露尚未修复的漏洞。
- 不要进行超出授权范围的压力测试。
- 提交前确认该问题确实构成安全问题，而非功能缺陷。`,
      },
    ],
    sources: [
      {
        title: 'GitHub Docs — Profile reference（Displaying badges on your profile）',
        url: 'https://docs.github.com/en/account-and-profile/reference/profile-reference#displaying-badges-on-your-profile',
        sourceType: 'OFFICIAL_DOC',
        credibility: 'A',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '官方文档表格中列出了该徽章及其说明。',
      },
    ],
  },
  {
    slug: 'developer-program-member',
    nameEn: 'Developer Program Member',
    nameZh: '开发者计划成员',
    summaryEn:
      'A program badge for registered members of the GitHub Developer Program.',
    summaryZh:
      '项目计划徽章：已注册成为 GitHub 开发者计划成员的账号获得的标识。',
    descriptionEn:
      'GitHub lists this badge under "Displaying badges on your profile". It is granted to registered members of ' +
      'the GitHub Developer Program who are building an application with the GitHub API.',
    descriptionZh:
      'GitHub 官方文档把该徽章列在「Displaying badges on your profile」章节。' +
      '它授予已注册 GitHub 开发者计划、并使用 GitHub API 构建应用的成员。',
    backgroundEn:
      'The Developer Program supports developers building applications on the GitHub API.',
    backgroundZh:
      '开发者计划支持那些基于 GitHub API 构建应用的开发者。',
    conditionEn:
      'Register as a member of the GitHub Developer Program. This is a program badge, not a profile achievement.',
    conditionZh:
      '注册成为 GitHub 开发者计划成员。这属于项目计划徽章，而非个人成就。',
    imageUrl: null,
    imageHdUrl: null,
    difficulty: 5,
    availability: 'INTERNAL',
    isTiered: false,
    categorySlug: 'special',
    credibility: 'A',
    uncertain: false,
    popularity: 14,
    verifiedAt: VERIFIED,
    tiers: [],
    requirements: [
      {
        title: 'Program badge (not a profile achievement)',
        titleZh: '项目计划徽章（非个人成就）',
        content:
          'Registration through the GitHub Developer Program is what grants this badge.',
        contentZh:
          '通过 GitHub 开发者计划完成注册即可获得该徽章。',
        steps: [
          'Register for the GitHub Developer Program.',
          'Build and register an application that uses the GitHub API.',
          'The badge is displayed on your profile once registration is active.',
        ],
      },
    ],
    guides: [
      {
        title: 'GitHub Developer Program overview',
        titleZh: 'GitHub 开发者计划概览',
        readingTime: 3,
        content: `## 计划是什么

GitHub Developer Program 面向基于 GitHub API 构建应用的开发者，提供技术文档、论坛支持与产品动态。

## 谁适合加入

- 正在用 REST API 或 GraphQL API 构建集成的开发者。
- 需要了解 API 变更节奏与最佳实践的团队。
- 希望直接影响 GitHub API 演进方向的贡献者。

## 需要注意

- 这是一个**项目计划**，不是成就系统的一部分，无法通过日常使用获得。
- 加入计划意味着需要遵守 GitHub 的开发者条款与 API 使用规范。
- API 调用有速率限制，请遵守文档中的建议。

如果你只是偶尔查询公开资料，本站的公开查询功能已经足够，不需要为了一个徽章去注册任何计划。`,
        contentZh: `## 计划是什么

GitHub Developer Program 面向基于 GitHub API 构建应用的开发者，提供技术文档、论坛支持与产品动态。

## 谁适合加入

- 正在用 REST API 或 GraphQL API 构建集成的开发者。
- 需要了解 API 变更节奏与最佳实践的团队。
- 希望直接影响 GitHub API 演进方向的贡献者。

## 需要注意

- 这是一个**项目计划**，不是成就系统的一部分，无法通过日常使用获得。
- 加入计划意味着需要遵守 GitHub 的开发者条款与 API 使用规范。
- API 调用有速率限制，请遵守文档中的建议。

如果你只是偶尔查询公开资料，本站的公开查询功能已经足够，不需要为了一个徽章去注册任何计划。`,
      },
    ],
    sources: [
      {
        title: 'GitHub Docs — Profile reference（Displaying badges on your profile）',
        url: 'https://docs.github.com/en/account-and-profile/reference/profile-reference#displaying-badges-on-your-profile',
        sourceType: 'OFFICIAL_DOC',
        credibility: 'A',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '官方文档表格中列出了该徽章及其说明。',
      },
    ],
  },
  {
    slug: 'github-pro',
    nameEn: 'Pro',
    nameZh: 'GitHub Pro',
    summaryEn:
      'A plan badge shown on profiles of GitHub Pro subscribers.',
    summaryZh:
      '订阅了 GitHub Pro 的账号会在资料页上展示的计划徽章。',
    descriptionEn:
      'The Pro badge indicates an active GitHub Pro subscription. It reflects a paid plan rather than any ' +
      'achievement, and GitHub lists it under "Displaying badges on your profile".',
    descriptionZh:
      'Pro 徽章表示账号拥有有效的 GitHub Pro 订阅。它反映的是付费方案而非任何成就，' +
      'GitHub 官方把它列在「Displaying badges on your profile」章节。',
    backgroundEn:
      'GitHub Pro is a paid subscription that unlocks additional features for a personal account.',
    backgroundZh:
      'GitHub Pro 是为个人账号提供更多功能的付费订阅方案。',
    conditionEn:
      'Hold an active GitHub Pro subscription. This is a subscription badge, not a profile achievement, ' +
      'and it disappears when the subscription ends.',
    conditionZh:
      '拥有有效的 GitHub Pro 订阅。这属于订阅徽章而非个人成就，订阅结束后即不再显示。',
    imageUrl: null,
    imageHdUrl: null,
    difficulty: 5,
    availability: 'INTERNAL',
    isTiered: false,
    categorySlug: 'special',
    credibility: 'A',
    uncertain: false,
    popularity: 16,
    verifiedAt: VERIFIED,
    tiers: [],
    requirements: [
      {
        title: 'Subscription badge (not a profile achievement)',
        titleZh: '订阅徽章（非个人成就）',
        content:
          'The badge reflects a paid subscription and has no relationship to open-source activity.',
        contentZh:
          '该徽章反映的是付费订阅状态，与开源活动无关。',
        steps: [
          'Subscribe to GitHub Pro from your account billing settings.',
          'The badge is displayed automatically on your profile while the subscription is active.',
        ],
      },
    ],
    guides: [
      {
        title: 'GitHub Pro vs achievements: what actually matters',
        titleZh: 'GitHub Pro 与成就：真正有价值的其实是什么',
        readingTime: 3,
        content: `## 两者性质不同

| | GitHub Pro | 个人成就 |
| --- | --- | --- |
| 性质 | 付费订阅 | 服务端行为判定 |
| 成本 | 需要付费 | 免费 |
| 可迁移性 | 随订阅结束而消失 | 永久保留 |
| 对协作的意义 | 提供更多私有仓库等能力 | 记录真实的社区贡献 |

## 如果你在犹豫是否订阅

值得考虑订阅的情况：需要无限私有仓库、GitHub Codespaces 用量、Copilot 等功能。
如果只是想在自己的资料页上多一个标记，那通常不值得 —— 成就徽章更能说明真实贡献。

> [!NOTE]
> 本站不会因为「赞助成就」而推荐你购买任何东西。付费决策请基于你自己的实际需求。`,
        contentZh: `## 两者性质不同

| | GitHub Pro | 个人成就 |
| --- | --- | --- |
| 性质 | 付费订阅 | 服务端行为判定 |
| 成本 | 需要付费 | 免费 |
| 可迁移性 | 随订阅结束而消失 | 永久保留 |
| 对协作的意义 | 提供更多私有仓库等能力 | 记录真实的社区贡献 |

## 如果你在犹豫是否订阅

值得考虑订阅的情况：需要无限私有仓库、GitHub Codespaces 用量、Copilot 等功能。
如果只是想在自己的资料页上多一个标记，那通常不值得 —— 成就徽章更能说明真实贡献。

> [!NOTE]
> 本站不会因为「赞助成就」而推荐你购买任何东西。付费决策请基于你自己的实际需求。`,
      },
    ],
    sources: [
      {
        title: 'GitHub Docs — Profile reference（Displaying badges on your profile）',
        url: 'https://docs.github.com/en/account-and-profile/reference/profile-reference#displaying-badges-on-your-profile',
        sourceType: 'OFFICIAL_DOC',
        credibility: 'A',
        status: 'ACTIVE',
        verifiedAt: VERIFIED,
        note: '官方文档表格中列出了该徽章及其说明。',
      },
    ],
  },
];
