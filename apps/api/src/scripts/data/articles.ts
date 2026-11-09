/**
 * 知识库文章种子数据。
 * 每篇文章对应一个 category，站点在前端自动生成目录（基于 ## / ### 标题）。
 */
export interface ArticleSeed {
  slug: string;
  title: string;
  titleZh: string;
  category:
    | 'GETTING_STARTED'
    | 'GIT_BASICS'
    | 'REPOSITORY'
    | 'ISSUES'
    | 'PULL_REQUESTS'
    | 'DISCUSSIONS'
    | 'ACTIONS'
    | 'OPEN_SOURCE'
    | 'SPONSORS'
    | 'ACHIEVEMENT_TIPS'
    | 'TIER_PROGRESSION'
    | 'TROUBLESHOOTING';
  excerpt: string;
  excerptZh: string;
  contentMd: string;
  coverImage: string | null;
  tags: string[];
  featured: boolean;
  sortOrder: number;
}

export const ARTICLES: ArticleSeed[] = [
  {
    slug: 'github-getting-started',
    title: 'The Complete GitHub Getting Started Guide',
    titleZh: 'GitHub 新手入门完全指南',
    category: 'GETTING_STARTED',
    excerpt:
      'A step-by-step walkthrough for creating a GitHub account, setting up your profile, making your first commit, and opening your first pull request.',
    excerptZh:
      '从注册 GitHub 账号、完善个人主页，到完成第一次 commit 并提交第一个 pull request 的完整上手教程。',
    contentMd: `GitHub 是全球最大的代码托管平台，也是绝大多数开发者职业生涯的起点。无论你写的是课程作业、一个小工具，还是想给大型开源项目贡献代码，理解 GitHub 的运作方式都是绕不开的第一课。本文按「从零到第一次贡献」的顺序，带你走完一条完整路径。

## GitHub 是什么，为什么值得花一小时了解

GitHub 本质上是 Git 版本控制系统的云端托管服务，但它远不止「把代码放网上」这么简单。围绕仓库（repository），GitHub 提供了协作所需的一切基础设施：问题追踪（Issues）、代码评审（Pull Requests）、自动化流水线（Actions）、项目看板（Projects）、讨论区（Discussions）以及个人主页上的成就徽章（Achievements）。

理解这套体系的最大价值在于：它让你把自己的成长过程「记录下来」。你在 GitHub 上留下的每一次 issue、每一条 PR、每次代码评审，都会沉淀成一个可被他人看到、可被雇主看到、也可被未来的自己回看的成就轨迹。

## 第一步：注册账号并保护你的邮箱

打开 https://github.com/join 填写用户名、邮箱和密码即可完成注册。用户名的选择要慎重 —— 你的个人主页 URL、邮箱地址前缀、以及很多第三方服务的集成都会依赖它，一旦更改需要等待一段时间才能释放。

注册后第一件事是去 Settings → Emails 检查邮箱状态。GitHub 对主邮箱做验证，而贡献图（contribution graph）的数据正是基于这个邮箱关联到你的账号。

> [!NOTE]
> 在 Settings → Emails 里把一个二级邮箱设为 primary，可以让你的企业邮箱和公开活动解耦。这在公开仓库较多时非常有用，避免了把私人联系方式泄漏给不想联系的人。

同时建议开启两步验证（Settings → Password and authentication → Two-factor authentication）。这不是可选项 —— 你的账号一旦被劫持，攻击者可以直接推送到你有权限的所有仓库。

## 第二步：把个人主页填成「作品集」

GitHub 个人主页是公开的「名片」，也是成就徽章唯一的展示位置。第一次访问你的主页时，侧边栏的成就区域通常是空的，这就是所谓的「空白档案」状态。

完善主页的优先级如下：

### 头像与名称

上传头像并填写显示名称。显示名称可以不同于登录用户名，海外项目习惯用英文名，国内团队习惯用中文名或昵称。

### Bio 简介

一句话说明你是做什么的。例如「前端工程师，主要做 Vue 和可视化」「正在学习 Rust 的学生」。这一行会出现在你的所有 PR 里，是别人判断是否与你合作的快速依据。

### README 个人主页文件

你的用户名同名仓库中的 README.md 会渲染在主页顶部。推荐包含：一句话定位、常用技术栈徽章（badge）、当前在做的事情、以及一个联系方式。

### 邮箱与社交链接

Settings → Profile 可以添加 Twitter/X、LinkedIn、GitHub Sponsors 等链接。这些链接同样会出现在 PR 提交信息旁边。

## 第三步：找到适合你的第一个仓库

新手最容易犯的错误是「找一个看起来最厉害的项目然后被劝退」。更实际的策略是从小处开始。

### 筛选信号

判断一个仓库是否适合新手，可以看四个信号：

- **Issue 活跃度**：有没有标记了 \`good first issue\` 或 \`help wanted\` 的条目。
- **最近提交时间**：如果最近一次 commit 在一年前，说明维护者不活跃，你的 PR 很可能石沉大海。
- **贡献指南**：存在 \`CONTRIBUTING.md\` 说明项目欢迎什么样的贡献，以及提交规范。
- **许可证**：LICENSE 文件决定了你的贡献会以什么条款被使用。

### 搜索技巧

GitHub 搜索框支持丰富的限定语法：

\`\`\`bash
# 找最近一年仍在更新、带 good first issue 标签、语言是 Python 的仓库
is:issue is:open label:"good first issue" archived:false pushed:>2025-11-09 language:python
\`\`\`

## 第四步：在本地建立你的第一个 commit

准备好 Git 后，把仓库拉到本地。推荐用 SSH 而不是 HTTPS，因为 SSH 之后推送不需要反复输入密码。

\`\`\`bash
# 配置身份信息，只需设置一次
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
git config --global init.defaultBranch main

# 克隆仓库
git clone git@github.com:owner/repo.git
cd repo

# 创建一个分支，不要直接在 main 上改
git switch -c feature/hello-world

# 修改文件后查看状态
git status

# 暂存并提交
git add README.md
git commit -m "docs: clarify local setup steps"

# 推送到远端
git push -u origin feature/hello-world
\`\`\`

提交信息（commit message）的质量直接决定了这条提交在几个月后还能否被人读懂。推荐采用 Conventional Commits 风格：\`feat:\`、\`fix:\`、\`docs:\`、\`refactor:\`、\`test:\`、\`chore:\`，后面跟一个动词开头的祈使句描述。

## 第五步：发出你的第一个 Pull Request

推完分支后，GitHub 会提示你创建 PR。也可以手动走完整流程：

### 第一步：进入 PR 创建页

在仓库页面点 Pull requests → New pull request，选择你的 \`feature/hello-world\` 分支作为 compare 分支，目标分支通常是 \`main\`。

### 第二步：写好标题和描述

标题用祈使句描述「做了什么」，例如 \`Add clarify to local setup steps\`。描述部分建议包含：变更动机、具体改动点、如何验证。

### 第三步：关联 Issue

在描述中写上 \`Fixes #123\`，PR 合并后对应的 issue 会自动关闭。这是最干净的协作契约。

> [!NOTE]
> 不要用 \`Closes\`、\`Fixes\`、\`Resolves\` 之外的随意措辞（如 \`see issue 123\`）去尝试关闭 issue，GitHub 只识别固定的那几个关键词。

### 第四步：请求评审

在右侧 Reviewers 里添加维护者。如果仓库配置了分支保护（branch protection），CI 检查全绿之前无法合并。

## 第六步：认识你的成就徽章

当你完成第一次贡献后，回到个人主页，左侧会出现第一枚徽章。常见的早期徽章包括：

| 徽章 | 触发条件（社区观察） |
| --- | --- |
| Quickdraw | 成功合并第一个 Pull Request |
| Pull Shark | 累计合并一定数量的 Pull Request |
| YOLO | 提交 PR 后未经评审直接合并 |
| Pair Extraordinaire | 产生一次 co-authored 提交 |
| Starstruck | 创建仓库并获得一定数量的 star |

GitHub 官方把 Profile Achievements 标注为公开预览（public preview）功能，徽章的判定口径可能随时调整，因此上面这张表应当理解为社区观察，而非官方承诺。本站的「成就获取技巧」与「等级升级路线」两篇文章会对每个口径标注可信度等级。

## 第七步：把贡献变成长期习惯

完成一次贡献只是开始，真正的复利来自持续节奏。给新手的三条建议：

- **先提 issue 再写代码**。很多维护者会指出你方案里的问题，避免白干。
- **小步快跑**。一个 PR 只做一件事，比一个 PR 改 30 个文件更容易被合并，也更容易被 review。
- **留下痕迹**。issue、PR 评论、discussion 里的高质量发言，都会计入你的公开活动，并可能触发不同类型的徽章。

## 小结

第一个小时的目标不是成为专家，而是打通完整链路：注册账号 → 完善主页 → 找到仓库 → 本地提交 → 发起 PR → 看到徽章。链路一旦打通，剩下的都只是重复和深入。接下来的文章会逐一展开 Git 命令、仓库管理、Issue、Pull Request、Actions 与开源协作的细节。

## 参考资料

- [GitHub Docs — Hello World（官方快速上手）](https://docs.github.com/en/get-started/quickstart/hello-world)
- [GitHub Docs — Basic formatting and syntax on GitHub](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-formatting-and-syntax-on-github)
- [GitHub Docs — Setting your preferences for private contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings)
- [GitHub Docs — Profile reference](https://docs.github.com/en/account-and-profile/reference/profile-reference)`,
    coverImage: null,
    tags: ['入门', 'github', '新手教程', '账号设置', '第一次提交'],
    featured: true,
    sortOrder: 1,
  },
  {
    slug: 'git-basics-essentials',
    title: 'Git Essentials: A Quick Reference Handbook',
    titleZh: 'Git 基础操作速查手册',
    category: 'GIT_BASICS',
    excerpt:
      'A compact, practical reference for the Git commands you actually use every day: staging, committing, branching, merging, rebasing, and recovering from mistakes.',
    excerptZh:
      '日常真正用得上的 Git 命令速查：暂存与提交、分支与合并、变基、冲突处理以及误操作后的恢复方式。',
    contentMd: `Git 的命令很多，但日常工作中真正反复使用的只有二十来个。本文按「区域模型 → 日常循环 → 分支协作 → 撤销恢复」四段展开，把每条命令的使用场景、常见坑和替代方案放在一起，方便随时查阅。

## 先建立心智模型：三个区域

理解 Git 的关键在于分清三个区域。所有命令本质上只是在这三个区域之间搬运数据：

- **工作区（Working Directory）**：你正在编辑的文件。
- **暂存区（Staging Area / Index）**：下一次提交将要包含的快照。
- **本地仓库（Repository）**：已经提交过的历史。

还有第四个位置：\`.git\` 目录本身，以及 \`HEAD\` 这个指向当前分支的指针。理解「HEAD 是一个引用」这一点，很多原本神秘的问题会瞬间变简单 —— 比如 \`git reset --hard HEAD~1\` 就是把分支指针往回挪一格。

## 第一步：初始化与全局配置

### 配置身份

\`\`\`bash
git config --global user.name "Zhang San"
git config --global user.email "zhangsan@example.com"
git config --global init.defaultBranch main
git config --global pull.rebase true
git config --global core.autorlf input
\`\`\`

### 让 Git 学会配色与别名

\`\`\`bash
git config --global color.ui auto
git config --global alias.st status
git config --global alias.lg "log --oneline --graph --decorate --all"
git config --global alias.last "log -1 HEAD --stat"
\`\`\`

设好 \`lg\` 之后，看分支图会变成一条命令的事。

## 第二步：日常提交循环

### 常用状态查询

\`\`\`bash
git status              # 完整状态
git status -s           # 简短状态，最常用
git diff                # 工作区 vs 暂存区
git diff --staged       # 暂存区 vs 上一次提交
git diff main...HEAD    # 本分支相对 main 的全部改动
\`\`\`

### 暂存的颗粒度

\`git add .\` 会把整个目录的改动一次性塞进暂存区，这经常导致「本想只提交一行，结果提交了整个文件」。更精准的做法：

\`\`\`bash
git add -p                     # 交互式逐块选择，强烈推荐
git add path/to/file.ts
git add -u                     # 只暂存已跟踪文件的修改，不含新文件
\`\`\`

### 提交

\`\`\`bash
git commit -m "fix: handle empty response body"
git commit -a -m "..."        # 自动暂存所有已跟踪文件的修改
git commit --amend --no-edit  # 修改上一条提交的信息，不改内容
git commit --fixup abc1234    # 生成 fixup! 提交，方便后续 autosquash
\`\`\`

> [!NOTE]
> \`--amend\` 会重写历史。如果这条提交已经 push 到公共分支，amend 之后 force push 会让其他协作者的本地历史与远端分叉。已公开的提交请用 \`git revert\` 而不是 amend。

## 第三步：分支操作

\`\`\`bash
git branch                       # 列出本地分支
git branch -a                    # 包含远端分支
git branch -vv                   # 显示每个分支跟踪的远端分支
git switch -c feature/login      # 创建并切换
git switch -                      # 切回上一个分支
git push -u origin feature/login # 推送并建立跟踪关系
git fetch --all --prune          # 拉取远端引用并清理已删除分支
git branch -d feature/login      # 删除已合并分支
git branch -D feature/login      # 强制删除（未合并时）
\`\`\`

现代 Git 推荐用 \`git switch\` 切换分支、\`git restore\` 恢复文件，这两组命令比传统的 \`git checkout\` 语义更清晰。\`git checkout\` 至今仍可用，但在新脚本里建议避免，因为它同时承担了切换分支和恢复文件两种职责。

### 变基 vs 合并

\`merge\` 保留真实历史，生成一个合并提交；\`rebase\` 把你的提交「摘下来」重新接到目标分支末尾，历史是一条直线。

\`\`\`bash
# 把 feature 分支变基到最新 main 之上
git fetch origin
git rebase origin/main

# 解决冲突后继续
git add .
git rebase --continue

# 想放弃这次 rebase，回到操作前状态
git rebase --abort
\`\`\`

规则：**公共分支上的提交不要 rebase，只有你自己还没推送的提交才适合变基。**

## 第四步：撤销与恢复

这是 Git 最容易被误解的部分。不同命令对应不同后果，选择前先问自己：这个改动还在工作区吗？已经提交了吗？已经推送了吗？

### 丢弃工作区改动

\`\`\`bash
git restore file.txt            # 丢弃未暂存的修改
git restore --staged file.txt   # 从暂存区移除，但保留文件修改
\`\`\`

### 撤销提交

\`\`\`bash
git reset --soft HEAD~1   # 撤销提交，改动回到暂存区（最常用）
git reset --mixed HEAD~1  # 撤销提交，改动回到工作区
git reset --hard HEAD~1   # 撤销提交并丢弃改动（危险，慎用）
git revert <sha>          # 生成一条「反向提交」，适合已公开的历史
\`\`\`

### 找回「消失」的提交

只要提交过，Git 基本都能找回：

\`\`\`bash
git reflog                  # 列出 HEAD 的移动历史
git reset --hard abc1234    # 回到某个历史位置
\`\`\`

即使执行了 \`git reset --hard\`，提交对象通常仍留在 \`.git/objects\` 里，reflog 会告诉你它的哈希值。这是新手最该记住的救命命令。

### 误删分支

\`\`\`bash
git reflog                   # 找到该分支最后的提交
git branch recover <sha>     # 重建分支
\`\`\`

## 第五步：远程协作

\`\`\`bash
git remote -v                 # 查看远程地址
git remote set-url origin git@github.com:owner/repo.git
git fetch origin              # 只拉取，不改动工作区
git pull --rebase             # 拉取并变基，线性历史
git push                      # 推送已跟踪分支
git push --force-with-lease   # 更安全的强制推送
\`\`\`

> [!NOTE]
> 优先使用 \`--force-with-lease\` 而不是 \`--force\`。前者会在远端有你没有的新提交时拒绝执行，能避免覆盖同事刚推上去的工作。

## 第六步：处理合并冲突

冲突发生时，Git 会在文件中插入标记：

\`\`\`text
<<<<<<< HEAD
当前分支的内容
=======
要合并进来的内容
>>>>>>> feature/login
\`\`\`

处理流程：

1. 手动编辑文件，删掉标记，保留正确内容。
2. \`git add <file>\` 标记为已解决。
3. \`git commit\` 完成合并（或 \`git rebase --continue\`）。

如果想放弃本次合并，\`git merge --abort\`；想跳过这个 pull 的某个文件，\`git checkout --ours <file>\`（合并时保留当前分支版本）或 \`--theirs\`（保留被合并版本）。

## 第七步：编写 .gitignore

模板化起步，之后按需扩展：

\`\`\`gitignore
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
.idea/
.vscode/
coverage/
\`\`\`

已经提交过的文件不会被 \`.gitignore\` 追溯排除，需要显式从索引中移除：

\`\`\`bash
git rm --cached .env
git commit -m "chore: stop tracking .env"
\`\`\`

## 速查小结

高频命令不超过这些：\`status\`、\`diff\`、\`add -p\`、\`commit\`、\`log --oneline\`、\`switch\`、\`merge\`、\`rebase\`、\`pull --rebase\`、\`push\`、\`restore\`、\`reset\`、\`reflog\`。把它们练成肌肉记忆，剩下的都是查文档。

## 参考资料

- [GitHub Docs — Contributing to a project](https://docs.github.com/en/get-started/quickstart/hello-world)
- [GitHub Docs — About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
- [GitHub Docs — Basic formatting and syntax on GitHub](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-formatting-and-syntax-on-github)
- [GitHub Docs — Setting your preferences for private contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings)`,
    coverImage: null,
    tags: ['git', '命令速查', '分支', '变基', '撤销恢复'],
    featured: false,
    sortOrder: 2,
  },
  {
    slug: 'github-repository-management',
    title: 'GitHub Repository Management Best Practices',
    titleZh: 'GitHub 仓库管理最佳实践',
    category: 'REPOSITORY',
    excerpt:
      'How to set up, organize, protect, and maintain a GitHub repository so that other people can actually contribute to it without chaos.',
    excerptZh:
      '如何搭建、组织、保护并长期维护一个 GitHub 仓库，让其他人能够顺畅参与而不把项目搞乱。',
    contentMd: `一个仓库的「可维护性」在第一次 push 的那几分钟就决定了。本文按仓库生命周期的顺序，讲述从创建、初始化结构、分支保护到发布与归档的完整实践。

## 仓库的生命周期

仓库管理可以分为五个阶段：

1. **创建** —— 可见性、命名、许可证。
2. **初始化** —— 目录结构、必需文件、默认分支策略。
3. **保护** —— 分支保护规则、CODEOWNERS、必需状态检查。
4. **协作** —— Issue 模板、PR 模板、贡献指南。
5. **维护** —— Release、标签、归档、转移。

## 第一步：选择可见性与位置

### 公开还是私有

公开仓库适合作品集和开源项目；私有仓库适合商业代码。GitHub Free 账号现在支持无限个私有仓库，个人开发者已经不需要为「私有仓库数量」付费。

注意仓库一旦公开，其中的历史记录也会公开 —— 包括曾经删除的密钥文件。

### 个人仓库还是组织仓库

个人仓库（owner 是你的用户名）适合个人项目和快速试验。组织仓库提供成员权限管理、团队（Teams）、Sponsors 收款和更强的审计能力。

命名建议：

- 使用小写字母和连字符：\`my-awesome-project\`，不要用下划线或空格。
- 避免 \`test\`、\`demo\`、\`temp\` 这类临时名字 —— 它们会出现在搜索结果里很久。

## 第二步：初始化仓库结构

一个最小但完整的仓库应该包含：

\`\`\`bash
.
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── .gitignore
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/
│       └── ci.yml
└── src/
\`\`\`

### README.md

README 是仓库的门面，至少要回答：这是什么、为什么有用、怎么安装、怎么使用、怎么贡献、许可证是什么。

### LICENSE

没有许可证，法律上默认「保留所有权利」，别人不敢用你的代码。开源项目常用 MIT（宽松）、Apache-2.0（含专利授权）、GPL-3.0（copyleft）。选之前先想清楚是否希望衍生作品也必须开源。

### .gitignore

在创建仓库时就可以从模板选择，Python、Node、Rust、Java 等语言都有官方模板。

## 第三步：设置默认分支与分支保护

### 保护 main 分支

进入 Settings → Branches → Add rule，为 \`main\` 添加规则：

- 要求 PR 才能合并（Require a pull request before merging）
- 批准数量（Require approvals）：至少 1 人，团队项目建议 2 人
- 要求审查者是最新的（Require review from Code Owners）
- 要求对话已解决（Require conversation resolution before merging）
- 要求分支在合并前保持最新（Require branches to be up to date）
- 禁止 force push（Do not allow force pushes）
- 允许删除的分支：取消勾选

> [!NOTE]
> 分支保护是协作质量的根基，但它不是用来「卡住」贡献者的。正当的例外（比如紧急 hotfix）应该通过建立一条受控的发布分支来解决，而不是让维护者临时关闭保护规则。

### CODEOWNERS

在 \`.github/CODEOWNERS\` 中指定自动请求评审的人：

\`\`\`text
# 默认所有文件由核心团队评审
*                       @acme/core-team

# 前端目录由前端组负责
/src/frontend/          @acme/frontend-team

# CI 配置改动需要维护者本人确认
/.github/workflows/     @acme/maintainers
\`\`\`

CODEOWNERS 会自动为匹配的 PR 分配评审人，并在受保护分支上作为「必需审查」的依据。

## 第四步：提供 Issue 与 PR 模板

Issue 模板用 YAML 表单定义，好处是字段结构化、可以自动填充：

\`\`\`yaml
name: Bug 报告
description: 报告一个可复现的问题
title: "[Bug] "
labels: ["bug", "needs-triage"]
body:
  - type: markdown
    attributes:
      value: 感谢反馈！请尽量填写以下信息。
  - type: input
    id: version
    attributes:
      label: 发生问题的版本
      placeholder: "1.4.2 或 main 分支"
    validations:
      required: true
  - type: textarea
    id: repro
    attributes:
      label: 复现步骤
      placeholder: |
        1. 打开 ...
        2. 点击 ...
        3. 观察到 ...
    validations:
      required: true
  - type: textarea
    id: env
    attributes:
      label: 环境信息
      value: |
        - OS:
        - 浏览器:
        - 依赖版本:
\`\`\`

把文件放在 \`.github/ISSUE_TEMPLATE/\` 下，用户在新建 issue 时会看到模板选择页。模板还能通过 \`labels\` 字段自动打标签，省去维护者手工分类。

PR 模板（\`.github/PULL_REQUEST_TEMPLATE.md\`）则应要求填写：变更摘要、关联 issue、测试情况、截图或日志。

## 第五步：管理标签与里程碑

标签（labels）是 Issue 的分类体系。建议保持精简且有层次：

| 标签 | 含义 |
| --- | --- |
| \`bug\` / \`enhancement\` | 类型 |
| \`good first issue\` | 适合新手 |
| \`help wanted\` | 需要外部协助 |
| \`needs-triage\` | 等待分类 |
| \`documentation\` | 文档相关 |

里程碑（milestones）用来聚合一个版本或一个季度的 Issue，接近完成度看板的作用。维护者定期清理已完成的里程碑，Issue 列表会立刻清爽很多。

## 第六步：用 Release 管理版本

### 创建标签与 Release

\`\`\`bash
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
\`\`\`

然后在 GitHub 上进入 Releases → Draft a new release，选择已有标签，填写标题与变更说明，并上传构建产物（\`.deb\`、\`.zip\`、\`.jar\` 等）。

### 自动化发布

配合 Actions，可以在打标签时自动构建并发布：

\`\`\`yaml
on:
  push:
    tags: ["v*.*.*"]

jobs:
  release:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci && npm run build
      - uses: softprops/action-gh-release@v2
        with:
          files: dist/*.zip
\`\`\`

### 语义化版本

遵循 \`MAJOR.MINOR.PATCH\`：不兼容改动提升 MAJOR，新功能提升 MINOR，修复提升 PATCH。提前在 README 中写明版本策略，贡献者才能正确判断自己的改动该改哪一位。

## 第七步：处理 fork 与上游同步

当你的仓库是 fork 来的，需要定期同步上游：

\`\`\`bash
git remote add upstream https://github.com/original/repo.git
git fetch upstream
git switch main
git merge upstream/main
git push origin main
\`\`\`

长期方案是启用 GitHub 的 "Sync fork" 按钮，或配置 Actions 自动同步，避免每次手动 merge。

## 第八步：归档与转移

项目不再维护时，不要只是停止提交，而是**归档仓库**。Settings → General → Danger Zone → Archive repository。归档后仓库变成只读，issue 和 PR 仍可访问，历史不会丢失 —— 这比直接删除对贡献者和使用者都更友好。

如果项目要移交到别的组织或另一个人，用 Transfer 而不是新建仓库：

Settings → General → Danger Zone → Transfer → Change ownership。转移后原所有者会失去对 issue 的写入权限（除非仍保留在组织内），转移前应提前通知所有贡献者。

## 常见问题

**仓库应该用 main 还是 master？** 新仓库统一用 \`main\`。\`master\` 是历史遗留，没有技术优势。

**公开仓库需要 .gitignore 之外的保护吗？** 需要。开源项目应启用 Dependabot、Secret Scanning 和 Push Rules，避免把密钥提交到公开历史中。

**个人仓库适合用分支保护吗？** 适合，尤其是作为学习项目时，可以完整实践 PR 工作流。

**要不要 monorepo？** 团队规模较小时，monorepo 能显著降低工具链和 CI 配置成本；但要提前准备好独立的 CI 缓存、依赖管理与发布顺序，否则复杂度会迅速失控。

## 参考资料

- [GitHub Docs — About repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)
- [GitHub Docs — About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
- [GitHub Docs — Basic formatting and syntax on GitHub](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-formatting-and-syntax-on-github)
- [GitHub Docs — Contributing to a project](https://docs.github.com/en/get-started/quickstart/hello-world)`,
    coverImage: null,
    tags: ['仓库管理', '分支保护', 'codeowners', 'release', '最佳实践'],
    featured: false,
    sortOrder: 3,
  },
  {
    slug: 'github-issues-guide',
    title: 'GitHub Issues: A Practical Usage and Creation Guide',
    titleZh: 'GitHub Issue 使用与创建指南',
    category: 'ISSUES',
    excerpt:
      'How to write issues that maintainers actually want to act on, and how to organize them with labels, milestones, templates, and automation.',
    excerptZh:
      '如何写出维护者愿意真正处理的 issue，以及如何用标签、里程碑、模板和自动化把 Issue 组织起来。',
    contentMd: `Issue 是 GitHub 上最通用也最容易被滥用的功能。它既是缺陷追踪器，也是需求收集器、讨论起点和任务看板。写好一个 Issue，本质上是在做一件技术沟通的事：把分散、无序的反馈，整理成别人能复现、能判断、能排期的结构化信息。

## Issue 的真实定位

GitHub 官方把 Issue 定义为「用于追踪任务、缺陷、需求和其他事项」的地方。在实际项目中，Issue 常见的几种形态：

- **Bug 报告** —— 描述与预期不符的行为。
- **功能请求** —— 希望增加某种能力。
- **技术债** —— 已知但未修的问题。
- **提问** —— 使用上的疑问（不适合时可以转到 Discussions）。
- **任务追踪** —— 社区成员认领并完成的任务。

Issue 数量本身不是健康指标。一个 400 个 issue 且无人回应的仓库，其维护状态远差于一个 30 个 issue 但每周都有响应的仓库。

## 第一步：写出一个合格的 Bug 报告

### 结构模板

一个可被处理的 bug 报告至少包含四块：

1. **现象** —— 你观察到了什么。
2. **复现步骤** —— 怎样稳定触发。
3. **预期行为** —— 你认为应该发生什么。
4. **环境** —— 版本、操作系统、依赖、浏览器。

### 示例

\`\`\`markdown
## 现象

在 Node 18.20.2 下，读取空文件的配置时抛出未捕获异常，导致进程直接退出。

## 复现步骤

1. 创建一个 0 字节的 \`config.json\`
2. 执行 \`node src/cli.js --config config.json\`
3. 进程抛出 \`TypeError: Cannot read properties of undefined\` 并退出码 1

## 预期行为

空配置文件应被视为空对象并继续执行，或输出明确的错误提示。

## 环境

- Node: v18.20.2
- OS: macOS 14.5
- 版本: 2.3.1
\`\`\`

### 常见缺陷

- **缺少复现步骤**：维护者无法验证，等于没写。
- **把解决方案写进标题**：应该描述现象，而不是你猜的修法。
- **堆栈信息被截断**：请贴完整日志。
- **一次报告多个问题**：拆成多个 issue，否则无法独立追踪状态。

> [!NOTE]
> 提 issue 前先搜索已有列表。用 \`is:issue is:open\` 加关键词过滤，避免重复。重复 issue 会被关闭并合并，反而降低你的贡献质量信号。

## 第二步：用模板统一收集信息

在 \`.github/ISSUE_TEMPLATE/\` 目录下创建模板，或在仓库根目录放 \`ISSUE_TEMPLATE.md\`。

### 模板的两种形式

**Markdown 模板** —— 简单直接：

\`\`\`markdown
---
name: Bug 报告
about: 报告一个可复现的问题
title: "[Bug] "
labels: bug
assignees: ''
---

**现象描述**

**复现步骤**
1.
2.

**预期行为**

**环境信息**
- Node 版本:
- 操作系统:
\`\`\`

**YAML 表单模板** —— 结构化程度更高，推荐：

\`\`\`yaml
name: 功能请求
description: 提议一个新功能或改进
title: "[Feature] "
labels: ["enhancement", "needs-triage"]
body:
  - type: textarea
    id: problem
    attributes:
      label: 你遇到了什么问题？
      description: 描述使用场景，而不只是你想要的功能
    validations:
      required: true
  - type: textarea
    id: proposal
    attributes:
      label: 你期望的解决方案
    validations:
      required: false
  - type: textarea
    id: alternatives
    attributes:
      label: 你考虑过哪些替代方案？
    validations:
      required: false
\`\`\`

### 配置文件

仓库根目录的 \`.github/ISSUE_TEMPLATE/config.yml\` 可以调整行为：

\`\`\`yaml
blank_issues_enabled: false
contact_links:
  - name: 功能讨论
    url: https://github.com/owner/repo/discussions
    about: 新功能提议请先到 Discussions 讨论
  - name: 商业支持
    url: https://example.com/support
    about: 付费支持请走此渠道
\`\`\`

把功能讨论分流到 Discussions，可以大幅降低 issue 列表的噪音。

## 第三步：用标签构建分类体系

### 打好第一批标签

不要一上来就设计几十个标签。推荐的结构是「类型 + 状态 + 难度」三个维度，每个维度控制在三到五个取值。

类型：\`bug\`、\`enhancement\`、\`documentation\`、\`question\`、\`performance\`

状态：\`needs-triage\`、\`confirmed\`、\`in-progress\`、\`blocked\`

难度：\`good first issue\`、\`help wanted\`、\`complex\`

### 维护卫生

- 保持标签总数可管理，超过 30 个通常意味着该合并了。
- 定期删除再没人用的标签。
- 给新贡献者的标签加上简短说明，让其含义自解释。

### 自动打标签

用 Actions 可以根据内容自动分类：

\`\`\`yaml
name: Triage issues
on:
  issues:
    types: [opened]

jobs:
  label:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            const body = '\${{ github.event.issue.body }}'.toLowerCase();
            const labels = [];
            if (body.includes('traceback') || body.includes('stack trace')) labels.push('bug');
            if (body.includes('feature request') || body.includes('propose')) labels.push('enhancement');
            if (!labels.length) labels.push('needs-triage');
            await github.rest.issues.addLabels({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.issue.number,
              labels
            });
\`\`\`

## 第四步：用里程碑组织版本

里程碑把 issue 归到「1.3.0」「2026 Q1」这样的分组下。查看 Issues → Milestones 可以看到每个里程碑的完成比例。

实践建议：

- 一个里程碑对应一个可发布的版本。
- 版本发布后立刻关闭对应里程碑，把未完成项移回 Backlog。
- 把未完成且已过期的 issue 关闭并注明原因，比让它们无限期挂着更有价值。

## 第五步：让 Issue 与 PR 联动

在 PR 描述中使用关键词即可在合并时自动关闭 issue：

\`\`\`bash
# 单个 issue
Fixes #123

# 多个 issue
Fixes #123, fixes #124

# 同一仓库中的另一个 issue
Closes owner/repo#125

# 如果 PR 不合并就不该关闭，用 reference 形式
Refs #123
\`\`\`

GitHub 识别的关键词包括 \`close\`、\`closes\`、\`closed\`、\`fix\`、\`fixes\`、\`fixed\`、\`resolve\`、\`resolves\`、\`resolved\`，后面紧跟 \`#编号\`。

也可以在提交信息里使用，PR 合并后同样生效：

\`\`\`bash
git commit -m "fix: guard against empty config file

Fixes #123"
\`\`\`

> [!NOTE]
> Issue 被关闭后随时可以重新打开，但重新打开不会自动触发之前的订阅者通知以外的流程。想让问题重新进入视野，比关掉更重要。

## 第六步：搜索与批量操作

### 高效搜索语法

\`\`\`bash
is:issue is:open label:bug sort:created-asc
is:issue assignee:@me
is:issue no:assignee no:label
is:issue created:>2026-01-01..2026-06-30
author:@me mentions:@me
is:issue -label:"good first issue"
\`\`\`

### 批量管理

在 Issues 页面勾选多个 issue，可以批量添加标签、指派负责人、关闭或转为讨论。这个能力在清理积压时非常有用。

## 第七步：把讨论性内容转到 Discussions

并非所有 Issue 都该以 Issue 形式存在。当话题需要多方观点、没有明确完成标准、或涉及长期方案讨论时，Discussions 更合适。

在 issue 评论框下方点击「Convert to discussion」即可转换，原有评论和链接都会保留。转换前建议先在正文顶部说明理由。

## 常见问题

**Issue 提交后没动静怎么办？** 先确认没有重复 issue，再耐心等待。项目可能只有兼职维护者，或你的描述还缺少关键信息。可以尝试在 issue 中补充一个最小复现，或在 Discussions 中礼貌询问维护者的排期。

**怎么才能让我的 issue 被标记为 good first issue？** 这个标签由维护者设置。最有效的方式是：提交高质量的 bug 报告和文档改进 PR，先建立可信度。

**issue 会被自动关闭吗？** 当关联的 PR 被合并并包含关闭关键词时会。也可以手动 close，并写清原因（例如「已由 #456 修复」或「重复于 #789」）。

**可以给别人的仓库创建 issue 吗？** 可以，只要仓库开启了 issue 功能。但请遵守行为准则，不要滥发。

## 参考资料

- [GitHub Docs — About issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues)
- [GitHub Docs — Quickstart](https://docs.github.com/en/get-started/quickstart/hello-world)
- [GitHub Docs — Basic formatting and syntax on GitHub](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-formatting-and-syntax-on-github)
- [GitHub Docs — Setting your preferences for private contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings)`,
    coverImage: null,
    tags: ['issues', 'issue模板', '标签', '里程碑', '协作'],
    featured: false,
    sortOrder: 4,
  },
  {
    slug: 'github-pull-request-tutorial',
    title: 'The Complete Pull Request Tutorial',
    titleZh: 'Pull Request 完整教程',
    category: 'PULL_REQUESTS',
    excerpt:
      'A full walkthrough of the pull request lifecycle: preparing branches, writing a reviewable description, handling conflicts, responding to feedback, and cleaning up after merge.',
    excerptZh:
      '完整讲解 pull request 的全生命周期：准备分支、写好描述、处理冲突、响应评审意见，以及合并后的清理。',
    contentMd: `Pull Request（简称 PR）是 GitHub 协作模型的核心。一个 PR 不只是「提交代码」，它同时是一份变更提案、一份评审记录、一个持续集成的触发器，以及最终留在项目历史里的一块可追溯证据。这篇教程覆盖从准备分支到合并后的清理，以及中途最棘手的冲突处理与评审沟通。

## PR 与 Issue 的分工

理解 PR 的价值，先要理解它和 Issue 的分工：

- **Issue 记录「问题」** —— 需要有人解决什么。
- **PR 记录「解法」** —— 某个具体改动如何解决问题。

理想流程是：先开 Issue 讨论方案 → 认领任务 → 在分支上实现 → 提交 PR 并在描述中用 \`Fixes #123\` 关联 → 评审通过后合并 → Issue 自动关闭。

## PR 的两种形态

### 同仓库分支 PR

你直接拥有仓库写权限，在本地创建分支推送后发起 PR。这是团队内部最常见的形态。

### Fork PR

你无权直接推送，于是先把上游仓库 fork 到自己账号下，在 fork 上建分支、改动、推送，然后向上游发起 PR。开源社区贡献几乎都是这种形态。

流程上要注意：

1. fork 之前先确认上游是否要求签署 CLA（Contributor Agreement）。
2. 每次贡献前同步上游，避免 PR 携带大量无关变更。
3. 一个 PR 只解决一个 Issue，方便维护者拆分评审。

## 第一步：准备分支

\`\`\`bash
# 从最新的默认分支切出功能分支
git fetch origin
git switch main
git pull --rebase
git switch -c feature/issue-123-parser

# ...进行修改...

git add -A
git commit -m "feat(parser): support quoted values"
git push -u origin feature/issue-123-parser
\`\`\`

分支命名建议使用 \`feature/\`、\`fix/\`、\`docs/\`、\`refactor/\`、\`chore/\` 前缀加简短描述，审查者一眼就能判断改动性质。

> [!NOTE]
> 分支名会成为 PR 标题的默认值。\`feature/issue-123-parser\` 会生成同名标题，请在创建 PR 时手动改写成祈使句描述。

## 第二步：撰写高质量 PR

### 标题

用祈使句描述做了什么，避免 \`Update code\`、\`fix bug\` 这类无信息量的写法。

- 好：\`Add support for quoted values in config parser\`
- 好：\`Fix crash when config file is empty\`
- 差：\`changes\`、\`asdf\`、\`WIP\`

### 描述

建议包含以下小节：

\`\`\`markdown
## Summary

Closes #123

Adds support for single-quoted values in the INI parser and prevents a
TypeError when the config file is empty.

## Changes

- \`src/parser.js\`: add quote handling in \`parseValue()\`
- \`src/parser.js\`: return an empty object for empty input
- \`test/parser.test.js\`: add 4 test cases

## Motivation

The current parser throws on empty files, which happens when the tool
is run before the first-time setup wizard completes.

## Testing

- \`npm test\` (all 42 tests pass, 4 new)
- Manual: created an empty config and confirmed a clear error message
\`\`\`

### 关联 Issue

在描述正文里写 \`Closes #123\`。关键词必须紧跟 issue 编号，且 issue 必须属于 PR 的 base 分支所在的仓库。

## 第三步：请求评审并响应评审意见

### 指派评审人

在 PR 右侧的 Reviewers 中添加。若仓库配置了 CODEOWNERS，对应路径的 owner 会被自动添加为必需评审人。

### 三种评审类型

| 类型 | 含义 | 是否阻塞合并 |
| --- | --- | --- |
| Comment | 一般评论或建议 | 否 |
| Approve | 认可改动 | 是（受保护分支上） |
| Request changes | 请求修改 | 是，必须处理 |

### 回应评论的礼仪

- 对每条评论都给出回应，哪怕只是 \`Done, pushed in abc1234\`。
- 不要只写「已修复」而不给出 commit 链接。
- 有分歧时先解释你的理由，而不是直接忽略。
- 需要改动时直接推送到同一个分支，PR 会自动更新。

### 推动合并

如果评审长时间没有回应，可以在几天后礼貌地 @ 一次维护者。催办时保持就事论事，不要施加个人压力。

> [!NOTE]
> 不要请求评审者「跳过评审」，也不要以「我需要这个徽章」为由催促合并。PR 的价值来自代码质量，而不是某个徽章。绕过评审既损害项目安全，也会让你的贡献记录失去意义。

## 第四步：处理合并冲突

冲突通常来自目标分支在你开发期间发生了变化。GitHub 会直接在 PR 页面上标出冲突文件。

### 在网页上解决

GitHub 提供内置编辑器，可以逐块选择 ours / theirs 并标记为已解决。但对于复杂冲突，更推荐本地解决。

### 本地解决

\`\`\`bash
git fetch origin
git switch feature/issue-123-parser
git rebase origin/main
# 出现冲突后逐个文件处理
git add src/parser.js
git rebase --continue
# 如果情况变糟
git rebase --abort
\`\`\`

使用 rebase 而非 merge 来同步，PR 的历史会保持一条直线，评审者更容易逐个提交地阅读。

### 减少冲突的习惯

- 提交前先同步一次目标分支。
- 避免在同一个文件的不同区域做大改动。
- 频繁同步上游，让冲突范围保持可控。

## 第五步：合并之后

### 合并方式选择

- **Merge commit**：保留所有提交，生成一个合并提交。最保守。
- **Squash and merge**：把整个 PR 压成一个提交，历史最干净。多数项目偏好这种方式。
- **Rebase and merge**：把提交逐个重放到目标分支，不产生合并提交。适合提交数少的 PR。

### 清理分支

合并后点击 PR 页面上的 "Delete branch" 按钮，或本地删除：

\`\`\`bash
git switch main
git pull --rebase
git branch -d feature/issue-123-parser
git push origin --delete feature/issue-123-parser
\`\`\`

### 后续跟进

- 关注 CI 是否全绿。
- 如果 issue 仍未关闭，检查关闭关键词是否写在 PR 描述里（写在提交信息里也有效，但描述更可靠）。
- 发布说明里是否需要提及你的贡献，取决于项目惯例。

## 常见的 PR 问题

### CI 一直失败

点击失败的工作流查看具体日志。常见原因是本地依赖锁文件与 CI 不一致、Node 或 Python 版本不匹配、测试依赖外部服务。先在本地用同样的命令跑一遍。

### PR 长时间没有评审

不同项目的响应时间差异很大。可以：完善描述提高可读性、在 PR 内 @ 维护者、在 Discussions 询问，或直接维护项目的人在 issue 中提出。

### 被要求拆分成多个 PR

这是常见且合理的反馈。把改动拆成逻辑上独立的几块：先合并纯重构（不改行为），再合入功能，最后补测试。

### 第一次提 PR 紧张

开源项目欢迎新贡献者。提前在 issue 里打招呼、确认贡献方向，比直接投 PR 被拒要好得多。

## 参考资料

- [GitHub Docs — About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
- [GitHub Docs — Creating a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)
- [GitHub Docs — Basic formatting and syntax on GitHub](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-formatting-and-syntax-on-github)
- [GitHub Docs — GitHub Contributor Agreement](https://docs.github.com/en/site-policy/github-terms/github-contributor-agreement)`,
    coverImage: null,
    tags: ['pull request', '代码评审', '合并冲突', 'fork', '贡献流程'],
    featured: false,
    sortOrder: 5,
  },
  {
    slug: 'github-discussions-guide',
    title: 'A Practical Guide to GitHub Discussions',
    titleZh: 'GitHub Discussions 使用指南',
    category: 'DISCUSSIONS',
    excerpt:
      'When to use Discussions instead of Issues, how to structure a good thread, and how categories, Q&A and pinned answers make a community forum actually work.',
    excerptZh:
      '什么时候该用 Discussions 而不是 Issues、如何组织一篇高质量的讨论帖，以及分类、问答与置顶最佳答案如何让社区论坛真正运转。',
    contentMd: `Discussions 是 GitHub 为「开放式讨论」提供的原生场所。它和 Issues 的区别不在功能细节，而在心智模型：Issue 面向「可关闭的待办事项」，Discussion 面向「有来有往的观点交换」。

## Discussion 与 Issue 的边界

判断该用哪个，最实用的一条标准是：**这件事能不能被「完成」？**

- 能被完成（修一个 bug、实现一个功能、改进文档）→ Issue。
- 不能被完成，需要多方观点和方案权衡（架构选型、路线规划、API 设计）→ Discussions。

具体场景对照：

| 场景 | 推荐位置 |
| --- | --- |
| 报告崩溃、行为异常 | Issues |
| 提议新功能 | Discussions（可先达成共识再开 Issue） |
| 询问「怎么用这个功能」 | Discussions |
| 提交补丁 | Pull Requests |
| 公告破坏性变更 | Discussions + Releases 说明 |
| 讨论长期路线图 | Discussions |

很多成熟项目会做「前置流程」：功能提议必须先在 Discussions 里获得维护者的方向性认可，再开 Issue 分配实施。这能显著减少无效 Issue。

## 第一步：开启 Discussions

仓库所有者或组织管理员需要先启用该功能：

Settings → General → Features → Discussions → 勾选 Enable Discussions。

开启后，仓库导航栏会出现 Discussions 入口。

## 第二步：设计分类结构

分类（Category）是 Discussions 的顶层目录。好的分类结构应让新用户在三秒内找到该发到哪里。

### 常见分类

- **Q&A** —— 提问与回答。GitHub 支持把某个回答标记为「已接受的答案」，问题会显示绿色勾选。
- **Announcements** —— 公告。通常只允许组织成员或特定团队发帖。
- **Ideas** —— 想法与提案。
- **General** —— 兜底讨论。
- **Show and tell** —— 展示你的作品。
- **Help** —— 求助。

### 分类权限

在分类设置中可以指定谁能创建讨论、以及谁能回复：

- **Public**：所有登录用户可发帖与回复。
- **Members only**：只有组织成员可发帖。
- **Read-only**：仅维护者可发帖，但所有人可回复（适合 Announcements）。

合理搭配「Announcements 为 read-only + 其他分类为 public」是一个成熟社区的常见配置。

## 第三步：写一篇好讨论帖

### 结构模板

\`\`\`markdown
**背景**

我们当前的同步流程每次都全量拉取，1 万条记录需要约 40 秒。

**已尝试的方案**

1. 增量拉取 —— 需要维护游标，但服务端接口不支持按时间过滤。
2. 批量写入 —— 有效，但需要客户端持有完整数据集。

**希望讨论的问题**

大家更倾向于哪种方向？

- A：继续批量写入，在客户端做增量缓存
- B：推动服务端提供增量接口
- C：引入消息队列

**不讨论的内容**

本帖只讨论同步策略，不讨论存储选型。
\`\`\`

### 关键技巧

- **标题写成问题或主题**：「如何设计同步策略」优于「关于同步的一些想法」。
- **前置背景**，避免读者反复追问前提。
- **明确你想从讨论中得到什么**。是要一个决定、几种方案对比，还是单纯征求意见。
- **给出你已经做过的尝试**。这会显著提高回复质量。
- **划定边界**，减少跑题。

## 第四步：参与讨论的礼仪

### 提好问题

- 先搜历史讨论，避免重复。
- 说明你尝试过什么。
- 贴出完整错误信息和最小复现代码。

### 给出高质量回复

- 直接回答问题本身，不要绕开主题复述一遍。
- 反对时给出理由和替代方案，而不是只说「我不同意」。
- 承认自己不确定的部分，比强行给结论更有价值。
- 用「建议」代替「必须」，用「可能」代替「一定」。

### 接受答案

在 Q&A 分类中，最有帮助的回复可以被回答者或提问者标记为「已接受的答案」。这个标记让后来的读者能快速找到结论。

> [!NOTE]
> 被标记为接受的答案并不意味着「唯一正确答案」。对复杂问题，给出的往往是当时的最佳实践，随时可能因新信息而改变。

## 第五步：把 Discussion 与 Issue、PR 串起来

### 从讨论开 Issue

在讨论帖中可以创建 Issue（取决于仓库配置）。创建后的 Issue 会带上原讨论帖的链接，形成完整上下文。

### 在 Issue 中引用讨论

用 GitHub 的交叉引用语法即可自动生成链接：

\`\`\`markdown
See the discussion in #42 for background on this design decision.

Partially addresses #88.
\`\`\`

### 在 PR 中引用讨论

如果 PR 实现了讨论中达成的方案，在 PR 描述里写 \`Refs #42\`（讨论帖也有编号），维护者能立刻看到背景。

## 第六步：管理讨论区

### 置顶

重要公告和 FAQ 答案应该置顶。在分类页面点击「Pin discussion」，被置顶的帖会显示在分类顶部。

### 转 Issue

当一个讨论逐渐收敛成一个具体待办，可以在帖子内直接创建 Issue。转成 Issue 后，帖子仍会保留原链接。

### 关闭讨论

讨论达成结论后可以关闭（Close discussion），社区仍可浏览。已解决的问题若答案仍有价值，通常会先复制一份到项目文档或 Wiki 再关闭。

### 标记为答案

Q&A 分类支持标记最佳答案；General 分类则没有这一机制。

## 第七步：用 Discussions 承载社区活跃

对项目维护者来说，Discussions 是最有价值的社区工具之一：

- **降低 issue 噪音**：重复的使用问题不再污染待办列表。
- **沉淀知识**：高质量讨论可以整理成 FAQ 文档。
- **留住用户**：用户提的方案讨论比被关闭的 issue 更有参与感。
- **发现贡献者**：愿意深入讨论问题的人，通常是潜在的高质量贡献者。

对个人用户而言，认真参与 Discussions 也是积累公开贡献记录的途径之一 —— 这类活动在社区度的统计口径下有时会被计入「讨论类」贡献，与代码贡献共同构成你在项目中的整体参与度。

## 常见问题

**Discussions 会算进我的贡献图吗？** 参与讨论属于公开活动的一种，具体计入方式取决于仓库与平台当前的统计口径。GitHub 官方的 Profile Achievements 文档并未把「发讨论」列为独立的成就条件，因此不应假定它能直接触发某枚特定徽章。

**应该同时开 Discussion 和 Issue 吗？** 一般不必要。用交叉引用互相链接即可。频繁重复发布同样的内容，反而让信息分散。

**可以在组织层面统一管理吗？** 可以。组织可以设置 Discussions 的默认分类、权限和模板。多个仓库共用同一套规范时，这点很有用。

**Q&A 里的回答会被搜索到吗？** 会。已接受的答案会出现在仓库搜索结果里，在外部搜索引擎中也有较高权重。

**Issue 能不能转成 Discussion？** 可以，反之亦然。转换会保留原链接和评论历史。

## 参考资料

- [GitHub Docs — About discussions](https://docs.github.com/en/discussions/getting-started-with-github-discussions/about-discussions)
- [GitHub Docs — About issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues)
- [GitHub Docs — Basic formatting and syntax on GitHub](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-formatting-and-syntax-on-github)
- [GitHub Docs — Setting your preferences for private contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings)`,
    coverImage: null,
    tags: ['discussions', '社区协作', '问答', '分类设计'],
    featured: false,
    sortOrder: 6,
  },
  {
    slug: 'github-actions-basics',
    title: 'GitHub Actions: From Zero to Real Workflows',
    titleZh: 'GitHub Actions 入门与实战',
    category: 'ACTIONS',
    excerpt:
      'How GitHub Actions works, how to write a workflow file from scratch, and how to build practical CI, linting and release pipelines that run on every push.',
    excerptZh:
      'GitHub Actions 的运行原理、从零写出一个 workflow 文件，以及构建实用的 CI、代码检查与发布流水线。',
    contentMd: `GitHub Actions 是 GitHub 内置的 CI/CD 平台。它的价值在于：代码一推上去，测试、构建、发布就自动跑起来；出问题时，PR 页面会直接显示红色叉号，维护者不必手动问「这能跑吗」。本文从零开始，带你写出第一个可用的工作流，并逐步演进到发布流水线。

## Actions 的核心概念

理解四个概念，就能读懂任何 workflow 文件。

### Workflow（工作流）

一个自动化流程定义，存放在仓库的 \`.github/workflows/\` 目录下，每个 YAML 文件就是一个 workflow。

### Job（作业）

workflow 中的一个任务单元。每个 job 在独立的 runner 上运行，job 之间可以串行（\`needs\`）或并行。

### Step（步骤）

job 内部的单个动作，可以是运行一条命令（\`run\`），也可以是使用官方 action（\`uses\`）。

### Runner（运行器）

执行 job 的机器。GitHub 提供托管的 ubuntu-latest、windows-latest、macos-latest，也可自建。

## 第一步：写出第一个工作流

在 \`.github/workflows/ci.yml\` 中新建文件：

\`\`\`yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Run tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
\`\`\`

这个文件做了什么：

- \`on\` 定义触发条件。推送到 main 或向 main 提 PR 时运行。
- \`runs-on\` 指定运行器系统。
- \`actions/checkout\` 把代码拉到 runner 上 —— 这一步不能省，否则工作目录是空的。
- \`actions/setup-node\` 装 Node 并缓存 npm 依赖。
- \`npm ci\` 使用 lock 文件安装依赖，比 \`npm install\` 更严格也更可复现。

在 Actions 页面就能看到这个 workflow 运行，并点击进去查看每一步的实时日志。

## 第二步：掌握触发器的常用写法

\`on\` 是 Actions 里最容易配错的部分。

\`\`\`yaml
on:
  push:
    branches: [main, "release/**"]
    tags: ["v*.*.*"]
    paths-ignore:
      - "**.md"
      - "docs/**"
  pull_request:
    types: [opened, synchronize, reopened]
  workflow_dispatch:
    inputs:
      environment:
        description: "Target environment"
        required: true
        default: "staging"
  schedule:
    - cron: "0 3 * * 1"
\`\`\`

要点：

- \`workflow_dispatch\` 允许在页面上手动触发，并支持自定义输入，调试时非常有用。
- \`schedule\` 使用 UTC 时区，\`cron: "0 3 * * 1"\` 表示每周一 UTC 03:00。
- \`paths-ignore\` 能避免文档改动触发昂贵的构建。
- \`pull_request\` 默认只在打开、同步更新、重新打开时触发。

> [!NOTE]
> 面向公共仓库的 fork 提 PR 时，\`pull_request\` 工作流会在一个隔离环境中运行，且不会拿到 \`secrets\`。这是安全设计，不要试图绕过。

## 第三步：缓存与依赖加速

没有缓存的 CI 通常慢 3 到 5 倍。两个常用手段：

### setup-node 内置缓存

\`\`\`yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: npm
    cache-dependency-path: subdir/package-lock.json
\`\`\`

### 通用缓存 action

\`\`\`yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.cache/pip
      .venv
    key: \${{ runner.os }}-pip-\${{ hashFiles('**/requirements.txt') }}
    restore-keys: |
      \${{ runner.os }}-pip-
\`\`\`

key 一定要包含依赖清单的哈希，否则依赖更新后还会命中旧缓存。\`restore-keys\` 提供部分匹配回退，能在依赖微调时复用大部分缓存。

## 第四步：矩阵测试

矩阵（matrix）让一个 job 自动跑多组组合，最典型的就是多版本测试：

\`\`\`yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [18, 20, 22]
        include:
          - os: ubuntu-latest
            node: 22
            experimental: true
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node }}
      - run: npm ci
      - run: npm test
\`\`\`

\`fail-fast: false\` 让某个组合失败时其余组合继续跑完，这样你一次就能看到全部失败情况，而不是逐个试错。

## 第五步：处理密钥与权限

### 使用 secrets

\`\`\`yaml
steps:
  - uses: actions/checkout@v4
  - name: Publish to npm
    run: npm publish
    env:
      NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
\`\`\`

在仓库 Settings → Secrets and variables → Actions 中添加。密钥对 fork 的 PR 不可见，这是必要的隔离。

### 收紧默认权限

GitHub 默认给 workflow 较高的 \`GITHUB_TOKEN\` 权限。建议在 workflow 顶部显式收紧：

\`\`\`yaml
permissions:
  contents: read
\`\`\`

需要写权限时再按 job 单独放开：

\`\`\`yaml
permissions:
  contents: read
jobs:
  release:
    permissions:
      contents: write
      id-token: write
\`\`\`

## 第六步：用组合步骤组织发布流程

一个典型的「测试 + 发布」workflow：

\`\`\`yaml
name: Release

on:
  push:
    tags: ["v*.*.*"]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run lint

  publish:
    needs: verify
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: softprops/action-gh-release@v2
        with:
          files: dist/*.zip
          generate_release_notes: true
\`\`\`

关键设计是 \`needs: verify\` —— 只有测试通过才发布，避免把坏版本推出去。

## 第七步：缓存与排查技巧

### 加速的三个开关

- \`actions/cache\` 用于第三方依赖缓存。
- \`setup-node\` / \`setup-python\` / \`setup-go\` 的内置缓存开关。
- 合并多个小 job 成一个大 job，减少 runner 冷启动开销。

### 用条件跳过无意义的运行

并非每次提交都需要跑完整套流程。用 \`paths\` 判断改动范围，或用 \`if\` 条件跳过不必要的 job，能把等待时间压下来：

\`\`\`yaml
jobs:
  docs-only:
    if: \${{ github.event_name == 'pull_request' && contains(github.event.pull_request.labels.*.name, 'skip-ci') }}
    runs-on: ubuntu-latest
    steps:
      - run: echo "CI skipped by label"

  build:
    needs: docs-only
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "always build"
\`\`\`

注意 \`needs\` 的一个副作用：被依赖的 job 如果被跳过，依赖它的 job 也会被跳过，除非显式写上 \`if: always()\` 或 \`if: !cancelled()\`。这是新手最常踩的坑之一。

### 调试

- 在 Actions 日志里加 \`echo\` 或用 \`set -x\`（bash）打印执行轨迹。
- 用 \`run: |\` 多行脚本时加 \`shell: bash\` 明确指定 shell。
- 本地可以用 \`act\` 之类的工具近似运行 workflow，但差异始终存在，最终以 CI 结果为准。

### 复用工作流

私有仓库或跨仓库复用可抽成可复用 workflow：

\`\`\`yaml
jobs:
  call-shared:
    uses: owner/central-repo/.github/workflows/build.yml@main
    with:
      target: cli
    secrets: inherit
\`\`\`

复用时要注意引用的是分支还是 tag。引用一个可被外部写入的分支意味着别人能改你仓库的执行逻辑，稳妥做法是锁定到具体的 commit SHA 或受保护的 tag。

## 第八步：把 CI 与 PR 评审结合

workflow 的产物不只是「通过或失败」，它还能让评审体验更好。把覆盖率报告、构建产物、变更日志作为 PR 评论自动贴出来，评审者不必自己拉代码跑一遍。

\`\`\`yaml
name: PR summary
on:
  pull_request:

jobs:
  summary:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      checks: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test -- --coverage
      - name: Write comment
        uses: actions/github-script@v7
        with:
          script: |
            const pr = context.issue.number;
            const body = '### Test summary\\n\\nAll checks passed for this pull request.';
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: pr,
              body
            });
\`\`\`

注意两点：一是 \`permissions\` 要按最小权限写；二是重复触发时不要刷屏 —— 可以在写入前先删除本 bot 之前的评论，或使用 sticky 评论。

## 常见问题

**workflow 不触发？** 检查 \`on\` 的分支过滤、文件路径过滤，以及 Actions 是否被仓库设置禁用（Settings → Actions → General）。另外注意 YAML 里 \`on:\` 被解析成布尔值的问题，用某些工具校验 YAML 时要留意。

**如何跳过 CI？** 提交信息里加 \`[skip ci]\`。但不建议在 PR 上滥用。

**为什么我的 job 没有 secrets？** fork 的 PR 没有，这是安全策略。长期方案是让贡献者成为仓库成员，或使用 pull_request_target 配合严格限制 —— 但后者有安全风险，务必谨慎。

**Actions 消耗额度吗？** 公开仓库免费；私有仓库按组织套餐有分钟数配额。

## 参考资料

- [GitHub Docs — GitHub Actions](https://docs.github.com/en/actions)
- [GitHub Docs — About workflows](https://docs.github.com/en/actions/writing-workflows/about-workflows)
- [GitHub Docs — Workflow syntax for GitHub Actions](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
- [GitHub Docs — About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)`,
    coverImage: null,
    tags: ['actions', 'ci/cd', 'yaml', 'workflow', '自动化'],
    featured: false,
    sortOrder: 7,
  },
  {
    slug: 'contributing-to-open-source',
    title: 'The Complete Guide to Contributing to Open Source',
    titleZh: '参与开源项目完整指南',
    category: 'OPEN_SOURCE',
    excerpt:
      'How to find a welcoming project, make a first contribution that gets merged, and build a lasting relationship with maintainers.',
    excerptZh:
      '如何找到友好的项目、提交第一个能被合并的贡献，并与维护者建立长期关系。',
    contentMd: `开源贡献的门槛比多数人想象得低：一个 typo 修正、一个文档补充、一个复现良好的 bug 报告，都是贡献。但从「随便提个 PR」到「被合并并建立信任」，中间有一套方法论。这篇指南按时间顺序，把整个流程拆成可执行的步骤。

## 为什么值得参与开源

对个人而言，开源贡献带来的收益是复合的：

- **可验证的作品**。任何人都能查看你的每一次提交，这是简历上无法伪造的部分。
- **真实的代码评审**。开源项目通常有明确的评审规范，你能学到企业环境里不容易遇到的协作细节。
- **建立人脉**。维护者和贡献者之间会形成长期关系，很多工作机会就来自这里。
- **理解工程实践**。分支策略、CI 流水线、发布流程、向后兼容 —— 这些只在真实项目里学得到。

## 第一步：选择你的第一个项目

### 筛选标准

不要选「最有名」的项目，选「最可能合并你 PR」的项目。判断依据：

1. **近期活跃**。最近一次 commit 在几周内，而不是几年前。
2. **有 \`good first issue\` 标签**。这说明维护者有意识地在接待新人。
3. **有 CONTRIBUTING.md**。说明项目在意协作体验。
4. **PR 响应速度**。打开已合并的 PR，看从提交到合并的间隔。
5. **Issue 区有人回复**。如果 issue 全部无人问津，说明维护者已弃坑。

### 找到候选项目

\`\`\`bash
# 有 recently-active 的 good first issue，语言是 TypeScript
is:issue is:open label:"good first issue" pushed:>2026-08-01 language:TypeScript

# 或者用 topic 探索
https://github.com/topics/beginner-friendly
\`\`\`

也可以从你日常使用的工具开始。修一个你自己踩过的坑，是最自然的切入点。

## 第二步：读懂项目再动手

### 花半小时读这些

- **README** —— 项目解决什么问题，怎么用。
- **CONTRIBUTING.md** —— 贡献流程、代码风格、如何提 PR。
- **CODE_OF_CONDUCT.md** —— 社区行为准则，值得先读一遍。
- **最近 20 个 commit** —— 了解代码风格、提交信息习惯、变更粒度。
- **已合并的 PR** —— 这是最好的「参考答案」，看别人怎么写描述。

### 跑起来

\`\`\`bash
git clone https://github.com/owner/repo.git
cd repo

# Node 项目
npm install
npm test

# Python 项目
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pytest
\`\`\`

能在本地跑通测试，是提交 PR 的最低门槛。改完之后应当在本地跑通测试，并在描述中说明你跑过什么。

## 第三步：先沟通，再动手

### 认领任务

在 \`good first issue\` 上留言：

\`\`\`markdown
Hi, I'd like to work on this one. My plan is to:
1. Reproduce the issue in a small test case
2. Refactor \`parseValue()\` to handle the null case
3. Add a regression test

Does this look reasonable? I'd also appreciate any pointers on where the
edge cases should live.
\`\`\`

等待维护者确认，可以避免大量白做的返工。

### 如果没有 issue 标签

你也可以主动提一个 issue 描述 bug，先复现、给出最小复现代码，再提 PR。这种「先 issue 后 PR」的方式在成熟项目中接受度更高。

### 直接提 PR 的情况

改动非常小且明确（比如错别字、失效链接）时，直接提 PR 完全合理，描述里说明清楚即可。

## 第四步：让 PR 更容易被合并

### 一个改动一件事

- 不要同时修 bug 加功能。
- 不要顺手做全文件格式化。
- 大重构拆成多个 PR，先提纯机械性的那部分。

### 提交历史保持可读

\`\`\`bash
git switch -c fix/null-config-parse
git commit -m "fix(parser): return empty object for null input"
git commit -m "test(parser): add regression test for null config"
\`\`\`

如果中途发现要改方向，用 \`git rebase -i\` 整理提交信息后再推。已推送但尚未合并的分支，可以放心 force push（用 \`--force-with-lease\`）。

### 描述要照顾评审者

\`\`\`markdown
## What

Adds a null check in \`parseValue()\` so an empty config file no longer
throws \`TypeError: Cannot read properties of undefined\`.

Fixes #123

## Why

Running the CLI before completing the setup wizard creates a 0-byte
config file. Users reported a crash in #123.

## How to test

1. Create an empty \`config.json\`
2. Run \`node src/cli.js --config config.json\`
3. Expect: a clear "config is empty" message, exit code 0
\`\`\`

### 回应评审意见

- 每条评论都回应。
- 需要改动时推送到同一分支。
- 如果不认同某个建议，礼貌解释你的理由，并表明愿意接受维护者的最终决定。

## 第五步：理解评审与安全

维护者的评审不是刁难，而是他在为项目把关。几个原则：

- **不要请求跳过评审**。分支保护要求的审批数是有意义的质量门槛。
- **不要试图绕过 CI**。CI 失败通常是真实问题的信号。
- **不要在压力下让评审者放行**。如果时间紧，可以在 PR 中说明背景，让维护者自己决定优先级，而不是替他做决定。

> [!NOTE]
> 任何以「拿到徽章」为理由要求跳过评审或绕过保护规则的请求，都应当被拒绝。开源项目的健康度依赖于每个 PR 都经过真实审查，而不是徽章数量。

## 第六步：签署 CLA

很多项目要求贡献者签署 GitHub Contributor Agreement（CLA），其中可能包含知识产权授权条款。

签署方式通常是：首次提 PR 时，GitHub 会自动在 PR 里挂一个「Sign CLA」机器人检查，你点击确认即可。个别项目使用其他平台（如 CLA Assistant）也会在 PR 中提示。

签署前建议读一遍条款原文，了解你授予了哪些权利。

## 第七步：持续贡献的节奏

第一次 PR 被合并后，才是真正的开始。

### 逐步加码

1. 第一次：改文档或小 bug。
2. 第二次：修一个真实 bug 并补测试。
3. 第三次起：独立认领 issue，参与设计讨论。
4. 长期：成为某个模块的长期维护者，review 他人的 PR。

### 保持可见度

- 在 issue 里提供有价值的诊断信息。
- 在 PR 里解释你的思路，而不只贴代码。
- 帮助其他新人回答他们的问题 —— 这本身也是贡献。

### 维护健康

- 认领前先确认没有其他人已经在做。
- 进展变慢时主动在 issue 里说明，不要无声消失。
- 完成或放弃时都告知维护者。

## 常见问题

**被拒绝了怎么办？** 绝大多数拒绝不是针对你个人，通常是时机或方向问题。看维护者的解释，调整后可以换一个任务再试。

**需要多久才能被合并？** 几天到几周都正常。维护者往往是兼职。先在 issue 里沟通可以大幅缩短等待。

**提交信息被要求修改怎么办？** 照着改，用 \`git commit --amend\` 或 \`git rebase -i\` 整理后 force push（用 \`--force-with-lease\`）。

**我改的东西很大，被要求拆 PR？** 这很正常。先提纯重构的 PR，让维护者先合并它，再基于它提功能 PR。

**没被要求的测试要不要写？** 要。小改动不必强求完整测试覆盖，但新增的逻辑分支通常应该配一个测试。

## 参考资料

- [GitHub Docs — Contributing to a project](https://docs.github.com/en/get-started/quickstart/hello-world)
- [GitHub Docs — About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
- [GitHub Docs — GitHub Contributor Agreement](https://docs.github.com/en/site-policy/github-terms/github-contributor-agreement)
- [GitHub Docs — Setting your preferences for private contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings)`,
    coverImage: null,
    tags: ['开源贡献', 'good first issue', 'first pull request', 'cla', '社区'],
    featured: true,
    sortOrder: 8,
  },
  {
    slug: 'github-sponsors-guide',
    title: 'How GitHub Sponsors Works: A Practical Guide',
    titleZh: 'GitHub Sponsors 赞助机制解读',
    category: 'SPONSORS',
    excerpt:
      'How GitHub Sponsors handles payments, tiers, eligibility and tax requirements, and what maintainers should know before enabling it for a project.',
    excerptZh:
      'GitHub Sponsors 如何处理付款、档位、资格与税务要求，以及维护者在为项目开启赞助前需要了解什么。',
    contentMd: `GitHub Sponsors 是 GitHub 官方的赞助平台，让开源维护者通过订阅获得支持者的资金支持。它的定位很清晰：**这是自愿的、真实的资金往来**，不是虚拟徽章，也不是可以「刷」的成就。

> [!IMPORTANT]
> 赞助涉及真实金钱。是否赞助、赞助多少，完全由支持者自愿决定，任何人都无权、也不应催促他人为徽章或「解锁成就」而付费。本站介绍机制原理，不鼓励任何形式的消费引导。

## Sponsors 解决什么问题

开源维护是一项长期、隐形、消耗巨大的劳动。Sponsors 试图解决的核心矛盾是：使用开源软件的成本为零，而维护它的成本是实打实的时间。它的设计目标是让「受益」与「付出」之间建立一条可选的通道 —— 对支持者是自愿出资支持，对维护者是可持续收入，对平台则是巩固自己作为开源基础设施的地位。

## 第一步：了解两种参与者

Sponsors 分成两类账户，规则不同。

### 个人账户（User account）

以个人身份开通，代表你个人接受赞助。你可以用它赞助别人，也可以接受别人赞助。

### 组织账户（Organization account）

以组织名义开通，用于代表某个项目或整个团队接受赞助。组织账户需要连接支付处理方，并有更完整的税务与合规流程。

## 第二步：申请开通的资格要求

GitHub 官方对开通 Sponsors 有明确门槛，这也是很多人卡住的地方：

- **所在国家/地区必须在支持列表内**。
- **必须完成税务信息填写**。税务表单通过 GitHub 提供的流程提交，GitHub 会代为向税务部门报送（如美国 W-8BEN / W-9、中国相关的居民身份信息等）。
- **必须绑定银行账户或支付账户**用于收款。
- **账号状态必须正常**，未被平台限制。

这些条件不是形式主义。Sponsors 涉及跨国资金流动，各国对跨境个人收入的税务处理不同，GitHub 必须先完成合规才能开放。

## 第三步：理解档位（Tiers）

档位是 Sponsors 的核心产品结构。每个档位包含价格（月付或一次性）、名称（如 "Coffee"、"Supporter"、"Sponsor"）、描述，以及可选权益（README 致谢、Discord 频道等）。

### 档位设计的原则

档位数量不宜过多。社区经验是三到五档最合适，太多会让决策困难。

| 档位示例 | 价格区间 | 常见权益设计 |
| --- | --- | --- |
| Supporter | 1–3 美元/月 | README 致谢名单 |
| Backer | 5–10 美元/月 | 致谢 + Discord 频道 |
| Sponsor | 25 美元+/月 | 优先响应 issue |
| Partner | 100 美元+/月 | 季度路线图讨论 |

### 重要提醒

「优先响应 issue」「专属支持」这类权益只适用于**自愿且有偿的专业支持**，且不能替代项目原有的公开维护承诺。维护者不应因为某人付费就改变开源许可证、代码贡献的审核标准或安全问题的响应顺序。付费用户与非付费用户应使用同一套判定规则，否则就违背了开源的基本原则。

## 第四步：支持的支付方式与手续费

### 档位创建的实操

档位通过账户设置页创建，对应的配置在个人或组织仓库中体现。以 README 中展示赞助入口为例，常见的写法是使用官方提供的赞助徽章：

\`\`\`markdown
[![GitHub Sponsors](https://img.shields.io/badge/sponsor-GitHub-ea4aaa)](https://github.com/sponsors/your-handle)
\`\`\`

如果希望档位与仓库自动关联，可以启用 GitHub 的仓库赞助配置：

\`\`\`json
{
  "full_name": "owner/repo",
  "has_sponsors_listing": true,
  "is_template": false,
  "web_url": "https://github.com/owner/repo"
}
\`\`\`

\`has_sponsors_listing\` 设为 \`true\` 后，该仓库会出现在你 Sponsors 主页的「赞助这个项目」列表中，支持者可以针对具体仓库而不是整个个人账户进行赞助。对一个包含多个独立子项目的组织来说，这个开关能显著提升赞助归属的清晰度。

### 支付方式与手续费

支持者可以通过 GitHub 提供的支付方式完成支付，实际可用方式因地区而异，通常包括信用卡及部分地区的本地支付方式。GitHub 会收取一定比例的平台服务费，费率与档位、地区相关，具体以官方当前说明为准。对某些地区的支持者，平台还可能代扣代缴销售税或 VAT，这意味着最终支付金额可能略高于标价。

## 第五步：作为支持者如何赞助

如果你想支持某位维护者：

1. 打开对方的个人主页，找到 Sponsors 区块。
2. 选择档位，或填写自定义金额。
3. 完成支付。
4. 赞助会自动显示在你的公开资料中（对方可以选择是否公开支持者名单）。

作为支持者，你也可以设置**私密赞助**，不在对方主页显示。

## 第六步：Sponsors 与成就徽章的关系

这是本文最重要的一节，需要特别澄清。

Sponsors 在 GitHub 的成就体系里，主要是**支持维护者的一种方式**，而不是一条独立的、可以被「解锁」的成就路径：

- 很多维护者在 README 里会列出赞助者名单，但这属于项目自己的行为，不是 GitHub 自动发放的徽章。
- GitHub 官方文档中，Profile Achievements 的说明并未把「完成一笔赞助」列为可被触发的成就条件。
- 一些社区整理的徽章清单可能把赞助相关条目列入其中，但这类信息属于**社区观察**，且未获 GitHub 官方确认。

因此：如果你看到某篇文章说「赞助一次就能拿到 X 徽章」，请把它当作未经证实的说法，不要为徽章而赞助。赞助的价值在于支持真实的人做真实的工作，不在于换来一个图标。

## 第七步：维护者的实操建议

### 要不要开启

如果你的项目有明确的维护者本人、用户持续使用且有从中受益的人、并且你愿意处理税务与收款事务，那么开启是合理的。如果只是一个自用练习仓库，开启后也几乎不会有赞助者，反而增加管理负担。

### 常见坑

- **忘记更新税务信息**，导致结算中断。
- **档位描述含糊**，让支持者无法判断权益。
- **README 顶部塞满赞助广告**，反而伤害阅读体验。适度即可。
- **把赞助与 issue 优先级挂钩**。付费不应成为插队通道，写在条款里比不写更伤信誉。

## 常见问题

**个人和组织该选哪个？** 代表个人的项目用个人账户；团队共同维护、且有法人主体的项目用组织账户。

**收到的钱需要自己申报吗？** 需要。GitHub 会报送税务信息，但年度或周期性的税务申报责任通常仍在收款人一方，具体以当地法律为准。

**支持者可以开发票吗？** 是否可以开票取决于你的账户类型和所在地区。设置页通常会说明。

**可以设置一次性赞助吗？** 可以，单笔金额的赞助与周期性赞助是两个独立机制。

**为什么我的账户无法开通 Sponsors？** 最常见的原因是税务表单未提交或未通过校验、所在地区不在支持范围、账号存在未解决的违规记录。检查 Settings → Sponsors 页面的具体提示。

**最低金额是多少？** 支持者端可以填写自定义金额，但会受到平台最低/最高额度限制。

**可以取消赞助吗？** 周期性赞助可以在账户设置里取消，取消后不再扣款，已完成的周期不退款（除非平台另有说明）。

**Sponsors 会影响我的仓库吗？** 不会。Sponsors 是账户级别的功能，不改变仓库的可见性、权限或功能。

## 参考资料

- [GitHub Docs — GitHub Sponsors](https://docs.github.com/en/sponsors)
- [GitHub Docs — About GitHub Sponsors](https://docs.github.com/en/sponsors/getting-started-with-github-sponsors/about-github-sponsors)
- [GitHub Docs — Setting your preferences for private contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings)
- [GitHub Docs — Profile reference](https://docs.github.com/en/account-and-profile/reference/profile-reference)`,
    coverImage: null,
    tags: ['sponsors', '赞助', '开源维护', '支付', 'patron'],
    featured: false,
    sortOrder: 9,
  },
  {
    slug: 'achievement-earning-tips',
    title: 'Practical Strategies for Earning GitHub Achievements',
    titleZh: '成就获取技巧与实战策略',
    category: 'ACHIEVEMENT_TIPS',
    excerpt:
      'Honest, sustainable ways to build real GitHub activity and let the right profile achievements land naturally — with clear notes on which thresholds are community-reported.',
    excerptZh:
      '如何用真实、可持续的方式积累 GitHub 活动，让对应的个人资料成就自然到手，并明确标注哪些门槛来自社区报告。',
    contentMd: `GitHub 的 Profile Achievements 是平台自动发放的徽章，出现在你个人主页的侧边栏。这篇指南讨论的是如何**通过真实的贡献行为**让成就自然产生，而不是如何「刷」它们。

## 首先必须说明的三件事

### 成就功能处于公开预览阶段

GitHub 官方文档将 Profile Achievements 描述为处于 **public preview** 的功能，并明确保留随时调整规则的权利。这意味着徽章集合、判定口径、甚至某枚徽章是否继续发放都可能变化，任何声称「某套阈值是官方规定」的说法都应谨慎对待。

### 官方没有公布逐项阈值对照表

GitHub 的文档介绍了成就功能本身，但**没有发布每个成就从 Default → Bronze → Silver → Gold 的确切数量门槛**。本站记录的门槛来自多个社区来源的一致报告，并据此标注可信度等级：**高可信度**指多个独立社区来源长期给出相同数字且与个人观察一致；**中可信度**指社区来源基本一致但存在少量分歧；**待核实**指来源单一或彼此矛盾，本站会明确标注为不确定。请把这些数字当作「参考区间」，而不是「官方标准」。

### 真实贡献是唯一可靠的路径

所有成就的共同点是：它们由你**真实的、公开的、符合规则的行为**触发。任何试图伪造行为（批量创建空仓库、注册大量账号互相刷 star、滥用自动化提交垃圾 PR）的方式都存在明确风险：可能被平台检测、被维护者举报、被限制账号，且这些行为对社区是净损害。

> [!NOTE]
> 本指南不提供任何刷取、伪造或规避审核的方法。GitHub 的行为准则要求你只为真实目的创建内容。

## 第一步：把贡献设置调对

很多「做完了却没有徽章」的情况，根源在设置里。

### 检查私有贡献计数

Settings → Public profile → Contributions：

- **Include private contributions on my profile** —— 决定私有贡献是否计入并显示。
- **Private contributions** —— 决定私有贡献是否被统计到成就。
- **Show Achievements on my profile** —— 决定成就徽章是否展示。

默认情况下，私有仓库的贡献**不计入**成就。这是很多国内开发者在公司项目上大量工作、主页却空空如也的原因。此外还需确认邮箱已验证、账号未被限制、个人资料公开可见。

## 第二步：用真实贡献填充你的记录

下面这些行为本身是有价值的贡献，它们恰好也是若干成就的触发条件。

### 第一类：提交并合并 Pull Request

这是最直接的路径，也是最值得认真对待的。在自己的仓库中提交 PR 并合并它是真实的开发流程（哪怕仓库只有你自己）；在开源项目中提交并被合并价值更高；合并前的评审过程是真实的质量把控环节。

**为什么不推荐「未评审直接合并」？** 有一枚被称为 YOLO 的成就，其社区描述是「PR 在没有经过评审的情况下被合并」。从定义上它确实是某些场景的真实产物（例如团队内部的小仓库、需要快速合并的紧急修复）。但追求它的正确方式绝不是让评审者放水：

> [!IMPORTANT]
> 绝不应该要求评审者跳过评审、绕过分支保护规则或降低审核标准来「制造」这枚徽章。评审者的职责是保证代码质量，这个职责不应该被任何徽章诉求所削弱。真正的 YOLO 徽章应该来自那些本来就不需要正式评审的场合。

### 第二类：共同署名提交（co-authored commits）

GitHub 支持在提交信息中加入共同作者：

\`\`\`bash
git commit -m "Refactor the token refresh logic

Co-authored-by: OtherDev <other@example.com>"
\`\`\`

或者使用 commit trailer 语法：

\`\`\`text
feat: add retry with exponential backoff

Co-authored-by: Alice <alice@example.com>
Co-authored-by: Bob <bob@example.com>
\`\`\`

多个共同作者时，GitHub 会把它关联到贡献图上。**关键点**：共同作者必须是真实参与协作的人。临时拉一个陌生人来凑数，既不尊重对方，也违背了成就机制的本意。

### 第三类：创建仓库

发布一个真实有用的项目，哪怕很小，也会产生 star、issue 和 PR 活动。这些活动又可能触发其他类型的徽章。

### 第四类：参与 Discussions 与 Issue

在他人仓库中提问、回答、给出高质量诊断，也是被记录的公开活动。GitHub 官方的成就说明中并未把「发讨论」列为独立成就条件，所以它更像是间接贡献：**你在社区中的参与度会带来更多 PR 机会，而 PR 才直接对应成就**。

### 第五类：代码评审

给他人的 PR 留下有价值的评论，是维护者最需要、也最容易被忽视的贡献类型。它不直接对应某一枚徽章，但会带来后续的协作邀请与 co-author 机会。

## 第三步：一份可执行的四周计划

假设你每周能投入 4 小时左右。

- **第 1 周**：修环境与选项目。打开贡献设置，确认私有贡献与成就会被计入；选定 2 个候选项目，各自跑通本地开发环境和测试。
- **第 2 周**：第一次小贡献。找一个小 bug 或文档问题，提 issue 或直接提 PR。目标不是「触发徽章」，而是走通一次完整流程。
- **第 3 周**：扩大参与面。给别人的 PR 留至少两条有实质内容的评论；在 Discussions 里回答一个使用问题；在自己的仓库里做一次真实的重构并走 PR 流程。
- **第 4 周**：建立协作关系。询问某个长期存在的技术债能否认领；与另一位贡献者合作完成一个稍大的改动，使用 co-authored commit。

## 第四步：值得警惕的「行为模式」

以下做法在社区中偶尔被提及，但**不建议、也不应**采用：批量创建空仓库刷「创建仓库」类成就、用小号互相刷 star、提交空 PR 或无意义的格式化改动、绕过分支保护或要求跳过审批、自动化脚本批量回复 issue、为「解锁成就」而付费赞助。

这些行为即使短期让某个数字变大，也会损害你的长期信誉，并且大多数项目已经配置了自动化检测。其中「为成就而赞助」尤其需要强调：赞助涉及真实金钱，应完全出于支持维护者的自愿意愿。

## 第五步：让积累变得可持续

一次性刷 20 个 PR 和半年里做 20 个 PR，在徽章数量上可能相同，在社区中的口碑上却完全不同。后者意味着你熟悉了代码、赢得了信任、成为了某个人眼里的可靠贡献者。真正反映社区信任度的数据是：你参与过的 PR 数量、评论被采纳的比例、你维护的 issue 数量，以及别人在提交信息里 co-author 你的频率。在个人主页 README 里写一个简单的「贡献日志」记录每个项目的贡献内容，既是展示，也是复盘。

## 常见问题

**为什么我的贡献图是空的，但明明我提交过代码？** 最常见的原因是提交邮箱没有关联到你的账号。检查 Settings → Emails，确认提交时使用的邮箱在列表中且已验证。

**私有仓库的贡献算吗？** 默认不算，需要在贡献设置里开启计入。开启后可以在主页显示为「私有贡献」色块。

**徽章多久会出现？** GitHub 未公布官方处理时长。社区观察是触发事件后不久出现，但由于缓存机制与公开预览的特性，个别情况会更慢。

**同一个贡献会不会重复计数？** 具体规则未公开。社区经验是同一 PR 的多次提交通常按 PR 计数而非按提交计数。

**成就会失效吗？** 已获得的徽章通常会保留在资料页上，即使 GitHub 之后停止发放该徽章。

## 参考资料

- [GitHub Docs — Profile reference（Earning Achievements）](https://docs.github.com/en/account-and-profile/reference/profile-reference)
- [GitHub Docs — Setting your preferences for private contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings)
- [GitHub Docs — About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
- [GitHub Docs — About discussions](https://docs.github.com/en/discussions/getting-started-with-github-discussions/about-discussions)`,
    coverImage: null,
    tags: ['成就', '徽章', '个人主页', '贡献设置', '社区'],
    featured: true,
    sortOrder: 10,
  },
  {
    slug: 'achievement-tier-progression',
    title: 'Planning Your GitHub Achievement Tier Progression',
    titleZh: '勋章等级升级路线规划',
    category: 'TIER_PROGRESSION',
    excerpt:
      'A realistic roadmap for climbing Default, Bronze, Silver and Gold tiers through genuine contribution, with explicit caveats on where thresholds are community-reported.',
    excerptZh:
      '通过真实贡献从 Default、Bronze、Silver 走到 Gold 的务实路线图，并明确标注哪些门槛来自社区报告。',
    contentMd: `GitHub 的部分成就是「等级型」的 —— 随累计数量增长依次显示为 Default、Bronze、Silver、Gold 四个档位。这篇指南提供一条基于真实贡献的升级路线，并明确说明阈值的可信度问题。

## 先说清楚：阈值不是官方公布的

这一点必须放在最前面，因为它决定了整篇指南的性质。

GitHub 官方文档在 Profile reference 中介绍了成就功能及其公开预览状态，但**没有发布逐个成就的等级阈值对照表**。因此：本文出现的所有数量都标注了可信度等级（高 / 中 / 待核实）；这些数字来自多个社区来源的交叉比对，是**参考区间**而非官方标准；GitHub 可能随时调整判定规则，某个成就也可能被停止发放或改名；你的实际进度请以自己主页上显示的档位为准。

理解这一点后，规划才有意义：**计划的应该是「做什么贡献」，而不是「刷到第几格」**。

## 可信度等级的含义

| 等级 | 含义 | 使用建议 |
| --- | --- | --- |
| 高 | 多个独立社区来源长期一致，且与大量用户的实际观察吻合 | 可作为规划参考 |
| 中 | 社区来源基本一致，存在少量分歧或边界模糊 | 参考，注意浮动 |
| 待核实 | 单一来源，或不同来源互相矛盾 | 不要作为目标，等官方口径 |

## 第一步：认识等级型的成就

按照社区整理的观察，以下成就呈现明显的等级阶梯结构（具体阈值见本文末尾表格，可信度已标注）：

### 拉取请求类

**Pull Shark** —— 衡量累计合并的 Pull Request 数量。这是最容易规划的一条，因为它的计数对象明确：被合并的 PR。

**YOLO** —— 社区描述为「PR 未经过评审即被合并」。它的达成条件与项目本身的评审要求直接相关，因此**无法也不应该被主动规划**。若你所在的项目本身不强制评审，或某些小仓库确实采用直接合并策略，这枚徽章会自然出现。

> [!IMPORTANT]
> 任何要求评审者跳过评审、关闭分支保护、或者用其他方式绕过质量把关来「制造」这枚徽章的做法，都是错误的。评审质量高于任何图标。

**Starstruck** —— 与创建的仓库数量及获得的 star 数相关（不同来源对两者的权重组合有分歧，因此该项整体可信度被标为「中」）。

**Pair Extraordinaire** —— 衡量共同署名（co-authored）的提交数量。它的独特之处在于：这一项**天然要求真实的第二个人**，无法单方面完成。

部分社区整理中列出了「参与 Discussions」相关的等级成就，但 GitHub 官方文档并未把讨论参与列为独立的成就条件，因此本站把这类条目整体标为「待核实」。

## 第二步：建立你的基线

规划前先盘一下现状：已获得哪些徽章、各自处于什么档位；最近 90 天的公开活动量（提交、PR、issue、评论）；每周可投入的稳定时间。然后做一次简单的估算：

\`\`\`text
目标档位差距 = 目标阈值 - 当前数量
周产能 = 近 90 天产出 / 13 周
预计周数 = ceil(差距 / 周产能)
\`\`\`

如果预计周数超过 26（约半年），说明目标定得太激进，应该调整。

## 第三步：分阶段路线

下面是一条以「一年为周期」的参考路线，每一步都以真实产出为目标。

### 阶段一：基础期（第 1–3 个月）

**目标**：完成第一次被合并的 PR，建立完整流程认知。修好贡献设置；在两个活跃的开源项目中各提一个小 PR；每周给一个他人 PR 留一条有内容的评论；在自己的仓库里完成一次完整的功能开发，走 PR + review + merge 流程。这一阶段产出的数字会很少，但它是后面所有层级的地基。

### 阶段二：稳定期（第 4–9 个月）

**目标**：形成可持续的贡献节奏，PR 数量开始累积。固定参与 2–3 个项目并保持月度产出；开始认领带有 \`good first issue\` 标签的任务；与他人协作一次并使用 co-authored commit；保持每周一次真实的问题诊断。

### 阶段三：深度期（第 10–18 个月）

**目标**：从「提交者」转变为「被信任的协作者」。独立负责一个模块的维护；开始 review 他人的 PR；主导一次跨仓库的改动并带上 co-authored trailer；在自己维护的项目里接受他人 PR，形成双向流动。

### 阶段四：沉淀期（第 19 个月起）

**目标**：把贡献变成可持续的公共资产。维护主力仓库并定期发布；撰写技术文章或做分享；关注新增的成就类型，在 GitHub 更新文档时第一时间了解规则变化。

## 第四步：把不同成就转化成同一种习惯

观察各类成就的触发行为，会发现它们高度重合 —— 都指向「在公开仓库里持续做真实的事」。因此最高效的策略是**只做一件事，但持续做**：提交并被合并 PR 对应 Pull Shark 类，与他人共同署名提交对应 Pair Extraordinaire 类，创建并维护公开仓库对应 Starstruck 类，而在 issue 中给出高质量诊断则会间接带来更多 PR 机会。一个能同时满足多种成就的行为习惯，比逐个针对不同成就做优化要有效得多，而且不会产生任何垃圾行为。

## 第五步：等级提升中的常见误判

**误判一：把徽章当目标。** 当目标是徽章时，人会开始寻找「成本最低的触发路径」，而这些路径几乎都通向刷量。本路线刻意反过来：先定行为目标，徽章是副产品。

**误判二：把未评审合并当作成就。** 跳过评审既损害项目安全，也会让这枚徽章失去意义。

**误判三：忽略「长期空窗」。** 等级是累计的，不会因为空窗而重置。但如果你停更半年，回来后的第一件事往往是「刷一批低质量 PR 来恢复数字」，这是最容易出问题的时刻。保持低频但稳定的节奏，比阶段性爆发更安全。

**误判四：把私有贡献开关关掉。** 关闭「计入私有贡献」会立即让一大段真实工作从统计中消失。**公司项目不等于「假贡献」** —— 那是你真实付出的时间。

## 参考阈值表（社区报告，非官方）

以下数字来自多个社区来源的交叉比对，**GitHub 官方未发布任何等级门槛**。请以自己主页显示的实际档位为准。

| 成就 | Bronze | Silver | Gold | 可信度 |
| --- | --- | --- | --- | --- |
| Pull Shark（合并的 PR 数） | 16 | 128 | 1024 | 中 |
| Pair Extraordinaire（co-authored 提交数） | 2 | 6 | 24 | 中 |
| Starstruck（相关仓库/star 组合） | 差异较大 | 差异较大 | 差异较大 | 待核实 |
| Discussions 参与类 | 未确认 | 未确认 | 未确认 | 待核实 |
| YOLO（未评审即合并） | 单次行为，无等级阶梯 | — | — | 高（行为定义），门槛不适用 |

> [!NOTE]
> 上表刻意保留了「差异较大」「未确认」这类表述，而不是填上一个看起来精确的数字。这正是本站标注可信度的意义所在：不确定的信息应当被明确标记为不确定。

## 常见问题

**等级会自动升级吗？** 是的，达到对应条件后徽章的显示档位会变化，无需手动操作。

**等级会降级吗？** 据社区观察，累计数量不会因时间推移而减少，因此通常不会降级。GitHub 未就降级规则发布官方说明。

**私有仓库的贡献计入等级吗？** 取决于贡献设置。默认不计入，需要手动开启。

**同一枚徽章的多个项目贡献会累加吗？** 社区经验是跨仓库累加，但具体口径未获官方确认。

**看到有人说「刷到 Gold」的建议怎么办？** 那些方法往往指向批量空仓库、小号互刷或无意义 PR。本站不收录这类方法，也不建议采用。

## 参考资料

- [GitHub Docs — Profile reference（Earning Achievements）](https://docs.github.com/en/account-and-profile/reference/profile-reference)
- [GitHub Docs — Setting your preferences for private contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings)
- [GitHub Docs — About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
- [GitHub Docs — About issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues)`,
    coverImage: null,
    tags: ['等级', '升级路线', 'bronze', 'silver', 'gold', '成就'],
    featured: false,
    sortOrder: 11,
  },
  {
    slug: 'achievement-troubleshooting',
    title: 'Troubleshooting Missing GitHub Achievements',
    titleZh: '成就未触发与异常排查手册',
    category: 'TROUBLESHOOTING',
    excerpt:
      'A step-by-step diagnostic for achievements that never appear: settings checks, contribution graph verification, PR state audits, and how to distinguish "not earned" from "unknown".',
    excerptZh:
      '成就始终不出现时的分步排查手册：设置检查、贡献图核对、PR 状态审计，以及如何区分「未获得」与「无法确认」。',
    contentMd: `「我明明做了，为什么没有徽章？」是 GitHub 上最常见的问题之一。排查这类问题需要区分三种截然不同的状态：**确实没满足条件**、**条件满足了但显示设置关着**、以及**数据不可知**。本文给出一条有序的排查路径。

## 先建立正确的心理模型

### 成就的三个可能状态

1. **已获得** —— 徽章显示在你的资料页上。
2. **未获得** —— 你可以确定没达到条件。
3. **数据不可用** —— GitHub 没有公开足够信息让你判断。

第三种状态最容易被误当成第二种。GitHub 的 REST API **不提供**读取某个用户完整成就列表与等级档位的接口。任何声称能精确查询「某人拥有哪些徽章、处于什么等级」的第三方服务，技术上都存在局限 —— 它们只能用「API 返回了就标记为已获得，其余标记为数据不可用」的方式处理。

> [!IMPORTANT]
> 本站把「数据不可用」与「未获得」严格区分。GitHub 官方没有公开逐项等级阈值，因此任何声称「精确知道某人还差多少」的查询结果都应被谨慎对待。

Profile Achievements 处于 public preview 阶段，GitHub 保留调整规则的权利。你可能遇到「行为确实发生了，但判定口径已变」的情况。

## 第一步：检查贡献设置（最常见原因）

绝大多数「没出现」的问题出在这里。

### 三个独立开关

进入 Settings → Public profile → Contributions，逐项确认：

| 设置项 | 影响 |
| --- | --- |
| **Show Achievements on my profile** | 决定成就徽章是否展示。若关闭，徽章可能被完全隐藏。 |
| **Include private contributions on my profile** | 决定私有贡献是否显示在贡献图上。 |
| **Private contributions** | 决定私有贡献是否被计入统计与成就。 |

> [!NOTE]
> 这三个开关互相独立。常见误区是「我已经开启了私有贡献显示，所以私有贡献一定计入成就」—— 事实并非如此，显示与统计是两个不同的开关。

### 检查邮箱关联

这是第二常见的原因。你的提交必须使用一个**已验证并关联到账号**的邮箱：

\`\`\`bash
# 查看最近提交使用的邮箱
git log -5 --format='%h %ae %s'
\`\`\`

对照 Settings → Emails 中的列表。如果提交邮箱是公司邮箱、私人邮箱或未验证邮箱，贡献不会被归到你名下。同理，\`git config user.name\` 与 \`git config user.email\` 写的是昵称或另一个身份时，提交同样不会计入。

## 第二步：核对贡献图本身

打开你的主页，看侧边栏的贡献图（Contribution graph）。

### 贡献图是空的

说明提交根本没有被归到你名下。按顺序检查：

1. 提交邮箱是否在 Settings → Emails 列表中且已验证。
2. 该邮箱是否被设置为 primary（贡献图只统计 primary 或已验证邮箱）。
3. 是否开启了「计入私有贡献」（如果你的工作都在私有仓库里）。
4. 提交是否真的推送到了远端 —— 只在本地 commit 但从未 push，不会计入。

### 贡献图有记录，但没有徽章

说明行为被记录了，但没有触发成就条件。此时进入第三步。

## 第三步：审计具体行为的状态

不同成就的判定对象不同，需要逐一核对。

### Pull Shark 类：审查你的 PR

打开仓库 → Pull requests → Closed，逐条检查你的 PR 是否满足条件：状态确实是 **Merged** 而不是 Closed（手动 close 的 PR 不算合并）；合并者是否为你自己（**别人合并的 PR 通常不计入**，属社区经验，未获官方确认）；PR 是否指向了正确的目标分支。

### Pair Extraordinaire 类：检查共同署名格式

格式错误是最常见的问题。正确的写法是 trailer 形式，在提交信息正文末尾，空一行之后：

\`\`\`text
fix: handle null token in refresh flow

Refactor the retry path and guard against a null session token.

Co-authored-by: Jane Doe <jane@example.com>
\`\`\`

检查要点：

- 必须是 \`Co-authored-by:\` 这个精确的 trailer 标签（大小写与连字符）。
- 必须有尖括号包裹的邮箱。
- 必须是**真实参与协作的人**。凑数的共同作者既不尊重对方，也会让统计失真。

验证方法：打开该提交的 GitHub 页面，提交信息下方应显示带头像的共同作者链接。没有显示就说明格式没被识别。

### YOLO 类：确认合并方式

这枚成就的判定基于「PR 在没有 review 的情况下被合并」。审计方法是打开被合并的 PR，看右侧 Activity 中是否有 Approve / Request changes 记录；如果没有任何评审记录且 PR 被合并了，条件即成立。

需要重申的是：这类合并必须来自项目本身的评审策略（例如小团队、紧急修复），**不应该通过要求评审者放水来制造**。

### Starstruck 类：核对仓库与 star

确认仓库是 **Public**（私有仓库的 star 不可见），并确认 star 是真实获得的。不同社区来源对该成就「仓库数」与「star 数」的权重组合说法不一，因此本站将此项整体标为「待核实」。

## 第四步：排除时间因素

### 公开预览期的规则调整

如果你在几个月前完成了某个行为，但那时规则尚未开放，行为本身不会追溯生效。这是公开预览功能的一个已知特性。

### 缓存延迟

GitHub 未公布处理时长。社区观察是触发后不久出现，但缓存机制可能造成延迟。等待 24–48 小时再检查是合理的做法。

### 账号状态变更

如果账号近期发生过邮箱变更、用户名变更、登录方式调整或违反行为准则被处理，统计可能被重置或暂时隐藏。

## 第五步：记录并向上游反馈

如果上述检查全部通过、行为确实满足社区描述的条件，但徽章仍未出现，说明存在你无法解释的不一致。这时应该记录完整的复现信息并提交支持请求。

### 记录完整的复现信息

\`\`\`markdown
- Account: @yourhandle
- Repository: owner/repo (public)
- Action: PR #123 opened 2026-10-01, merged 2026-10-02 by @yourhandle
- Expected: Pull Shark badge visible in profile sidebar
- Actual: no badge as of 2026-10-05
- Contribution graph: entry for 2026-10-02 is present
- Settings: "Show Achievements" enabled, private contributions counting enabled
\`\`\`

### 提交 GitHub 支持请求

通过 https://github.com/contact/support 提交。带上 PR 链接、提交 SHA、时间线和上述复现信息。GitHub Support 的响应通常需要几天到几周。

> [!NOTE]
> 在等待期间不要反复做「尝试触发」的操作，例如批量重推提交或制造新 PR。这既无助于解决问题，也可能触发平台的滥用检测。

## 常见问题

**为什么 API 查不到我的徽章？** GitHub 的公开 API 不提供完整成就列表与等级档位接口。第三方工具只能基于有限的返回数据推断，因此会保守地标记为「数据不可用」。

**私有仓库的贡献能拿徽章吗？** 可以，前提是你开启了「计入私有贡献」设置。

**贡献图有格子但没有徽章，说明什么？** 说明行为被记录了，但未满足该徽章的判定条件，或该成就的类型判定与贡献图口径不同。

**撤销一个已合并的 PR 会让徽章消失吗？** 据社区观察，累计计数通常不会因单个行为被回退而重置。GitHub 未发布官方说明。

**我能自己写脚本计算「还差多少」吗？** 可以统计你自己仓库的合并 PR 数（用 GitHub API 的 search 接口），但这些数字与官方阈值之间没有公开的权威映射，只能作为参考。

## 排查速查表

| 现象 | 优先检查 |
| --- | --- |
| 徽章完全不显示 | 「Show Achievements」开关 |
| 贡献图是空白 | 提交邮箱是否已验证并关联 |
| 私有项目做了很多但没记录 | 「计入私有贡献」开关 |
| 合并了 PR 却没有 Pull Shark | PR 是否为 Merged 状态、是否由你合并 |
| 写了 Co-authored-by 但没显示 | trailer 格式与尖括号邮箱 |
| 长时间等待仍无变化 | 规则是否在公开预览中调整过 |

## 参考资料

- [GitHub Docs — Profile reference（Earning Achievements）](https://docs.github.com/en/account-and-profile/reference/profile-reference)
- [GitHub Docs — Setting your preferences for private contributions](https://docs.github.com/en/account-and-profile/how-tos/contribution-settings)
- [GitHub Docs — About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
- [GitHub Docs — About issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues)`,
    coverImage: null,
    tags: ['排查', '成就未触发', '贡献设置', '故障诊断', 'co-authored'],
    featured: false,
    sortOrder: 12,
  },
];

export const ARTICLE_CATEGORY_LABELS: Record<
  ArticleSeed['category'],
  { label: string; labelZh: string }
> = {
  GETTING_STARTED: { label: 'Getting Started', labelZh: '新手入门' },
  GIT_BASICS: { label: 'Git Basics', labelZh: 'Git 基础' },
  REPOSITORY: { label: 'Repository', labelZh: '仓库管理' },
  ISSUES: { label: 'Issues', labelZh: '问题追踪' },
  PULL_REQUESTS: { label: 'Pull Requests', labelZh: '拉取请求' },
  DISCUSSIONS: { label: 'Discussions', labelZh: '讨论区' },
  ACTIONS: { label: 'Actions', labelZh: '自动化工作流' },
  OPEN_SOURCE: { label: 'Open Source', labelZh: '开源贡献' },
  SPONSORS: { label: 'Sponsors', labelZh: '赞助机制' },
  ACHIEVEMENT_TIPS: { label: 'Achievement Tips', labelZh: '成就获取技巧' },
  TIER_PROGRESSION: { label: 'Tier Progression', labelZh: '等级升级路线' },
  TROUBLESHOOTING: { label: 'Troubleshooting', labelZh: '排查手册' },
};
