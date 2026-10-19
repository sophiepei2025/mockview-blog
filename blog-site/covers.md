# Blog 封面图设计规范（学校 logo 版）

共 24 篇文章，每篇中、英文各一张封面。网站会按这份规范**自动生成**封面（`site/` 构建时输出 SVG），
你只需要把各学校的官方 logo 文件放进 `site/public/logos/`，重新构建就会替换占位标志。
如果之后想请设计师或 AI 作图出更精致的版本，也按这份规范来。

## 一、设计原则：学校 logo 是封面主角

读者在列表页扫一眼，就要知道“这篇讲的是哪所学校”。所以：

- **logo 占封面左侧约一半面积**，放在白色圆角卡片上，四周留足空白
- 一篇只讲一所学校：一个大 logo
- 一篇讲 2–5 所学校（对比类、通用面试类）：logo 平铺成网格，每个大小一致，不分主次
- 右侧是文字区：分类标签 → 主标题 → 副标题 → Edmoat 字标
- 中文、英文封面版式完全一致，只换文字

## 二、尺寸

- 主图 1600 × 900（16:9），文章头图和列表卡片都用这一张
- 社交分享可从中间裁 1200 × 630；logo 和标题都在中间安全区内

## 三、配色与字体（Edmoat 品牌）

| 用途 | 颜色 |
| :--- | :--- |
| 背景 | 米灰 `#EEF0EB`，叠加很淡的 Moat 蓝网格 |
| logo 卡片 | 白色 `#FFFFFF`，细边框 `#C5CCC6` |
| 分类标签 | Pennant 黄 `#E9B526` 底，深色字 |
| 标题 | 深墨蓝 `#15202A` |
| 副标题、字标 | `#4A5660` / Moat 蓝 `#2E6378` |

- 中文标题：思源宋体（Noto Serif SC）粗体；英文标题：Gloock
- 标签、副标题：思源黑体 / Schibsted Grotesk
- 学校品牌色只出现在 logo 本身（和占位标志），封面其余部分保持 Edmoat 配色，整套系列才统一

## 四、logo 文件要求

- 优先 SVG；没有就用透明底 PNG，宽度至少 800px
- 用学校官方发布的版本，不要自己改颜色、拉伸或裁切
- 横版 logo 优先（更适合卡片）；只有校徽时用校徽
- 文件名必须是下面表格里的“文件名”，例如 `uoft.svg`

### 需要准备的 logo

| 文件名 | 学校 | 用在第几篇 |
| :--- | :--- | :--- |
| `uoft.svg` | 多伦多大学（University of Toronto） | 01、06、08、09、13、19、23、24 |
| `rotman.svg` | 多伦多大学 Rotman 商科（Rotman Commerce, UofT） | 10、12 |
| `waterloo.svg` | 滑铁卢大学（University of Waterloo） | 01、04、05、08、09、13、14 |
| `mcmaster.svg` | 麦克马斯特大学（McMaster University） | 04、08、09、13、16、22、23、24 |
| `queens.svg` | 女王大学（Queen's University） | 01、04、07、09、19 |
| `smith.svg` | 女王大学史密斯商学院（Smith School of Business, Queen's） | 10、13、20、23、24 |
| `ubc.svg` | 英属哥伦比亚大学（University of British Columbia） | 02、04、09、15 |
| `sauder.svg` | UBC 尚德商学院（UBC Sauder School of Business） | 01、10、13、19、21 |
| `western.svg` | 西安大略大学（Western University） | 18 |
| `ivey.svg` | 西安大略大学 Ivey 商学院（Ivey Business School, Western） | 03、10、19 |
| `schulich.svg` | 约克大学舒立克商学院（Schulich School of Business, York） | 10、17 |
| `sgu.svg` | 圣乔治大学（St. George's University） | 04、14 |
| `uk.svg` | 英国医学院（UK medical schools） | 11 |
| `ireland.svg` | 爱尔兰医学院（Irish medical schools） | 11 |

> ⚠️ **授权提醒**：大学 logo 是注册商标。在介绍学校的文章里使用，通常属于“指明用途”，但商业推广页面上使用最好先确认各校的品牌使用规定，
> 封面上不要出现“官方合作”“认证”等暗示合作关系的字样。如果某所学校不允许，删掉对应的 logo 文件，网站会自动退回到文字占位标志。

## 五、逐篇封面


### 01. Kira Talent 面试备考指南

- **logo**：滑铁卢大学、多伦多大学、女王大学、UBC 尚德商学院（4 个 logo 网格）
- **分类标签**：面试备考 / Interview Prep
- **中文标题**：Kira Talent 面试备考指南 ｜ 副标题：5 步答题法 · 故事库 · 7 天练习
- **英文标题**：Kira Talent Prep Guide ｜ 副标题：5-step method · story bank · 7-day plan
- **文件**：`/covers/kira-talent-practice-guide-2026-zh.svg`、`/covers/kira-talent-practice-guide-2026-en.svg`

### 02. UBC Science 申请指南

- **logo**：英属哥伦比亚大学（单个大 logo）
- **分类标签**：理科申请 / Science
- **中文标题**：UBC Science 申请指南 ｜ 副标题：Personal Profile 四大评分维度
- **英文标题**：UBC Science Guide ｜ 副标题：The four Personal Profile criteria
- **文件**：`/covers/ubc-science-admission-guide-2026-2027-zh.svg`、`/covers/ubc-science-admission-guide-2026-2027-en.svg`

### 03. Western Ivey AEO 申请指南

- **logo**：西安大略大学 Ivey 商学院（单个大 logo）
- **分类标签**：商科申请 / Business
- **中文标题**：Western Ivey AEO 申请指南 ｜ 副标题：领导力文书 · 5 道 Kira 视频题
- **英文标题**：Western Ivey AEO Guide ｜ 副标题：Leadership essays · 5 Kira questions
- **文件**：`/covers/western-ivey-aeo-application-guide-2026-2027-zh.svg`、`/covers/western-ivey-aeo-application-guide-2026-2027-en.svg`

### 04. 加拿大 5 大 Pre-Med 路径对比

- **logo**：麦克马斯特大学、女王大学、滑铁卢大学、圣乔治大学、英属哥伦比亚大学（5 个 logo 网格）
- **分类标签**：医科与健康科学 / Medicine & Health Sciences
- **中文标题**：加拿大 5 大 Pre-Med 路径对比 ｜ 副标题：学制 · 门槛 · 学费 · CaRMS 风险
- **英文标题**：5 Pre-Med Pathways Compared ｜ 副标题：Length · thresholds · tuition · CaRMS risk
- **文件**：`/covers/canada-pre-med-pathways-comparison-2026-zh.svg`、`/covers/canada-pre-med-pathways-comparison-2026-en.svg`

### 05. Waterloo Engineering 申请指南

- **logo**：滑铁卢大学（单个大 logo）
- **分类标签**：工程申请 / Engineering
- **中文标题**：Waterloo Engineering 申请指南 ｜ 副标题：AIF 6 大问题 · Kira 视频面试
- **英文标题**：Waterloo Engineering Guide ｜ 副标题：Six AIF questions · Kira interview
- **文件**：`/covers/waterloo-engineering-aif-video-interview-guide-2026-2027-zh.svg`、`/covers/waterloo-engineering-aif-video-interview-guide-2026-2027-en.svg`

### 06. UofT Engineering 申请指南

- **logo**：多伦多大学（单个大 logo）
- **分类标签**：工程申请 / Engineering
- **中文标题**：UofT Engineering 申请指南 ｜ 副标题：Online Profile · 250 字短文 · Kira 面试
- **英文标题**：UofT Engineering Guide ｜ 副标题：Online Profile · 250 words · Kira
- **文件**：`/covers/uoft-engineering-online-profile-guide-2026-2027-zh.svg`、`/covers/uoft-engineering-online-profile-guide-2026-2027-en.svg`

### 07. Queen's Health Sciences 申请指南

- **logo**：女王大学（单个大 logo）
- **分类标签**：医科与健康科学 / Medicine & Health Sciences
- **中文标题**：Queen's Health Sciences 申请指南 ｜ 副标题：10 分钟写作 · 视频面试 · CanMEDS
- **英文标题**：Queen's Health Sciences Guide ｜ 副标题：10-minute response · video · CanMEDS
- **文件**：`/covers/queens-health-sciences-bhsc-supplementary-guide-2026-2027-zh.svg`、`/covers/queens-health-sciences-bhsc-supplementary-guide-2026-2027-en.svg`

### 08. 加拿大顶尖工程学院申请攻略

- **logo**：多伦多大学、滑铁卢大学、麦克马斯特大学（3 个 logo 网格）
- **分类标签**：工程申请 / Engineering
- **中文标题**：加拿大顶尖工程学院申请攻略 ｜ 副标题：选课 · 均分缓冲 · 三大评估信号
- **英文标题**：Top Engineering Schools ｜ 副标题：Courses · 5% buffer · three signals
- **文件**：`/covers/canada-top-engineering-schools-admission-guide-2026-2027-zh.svg`、`/covers/canada-top-engineering-schools-admission-guide-2026-2027-en.svg`

### 09. 视频面试技巧全指南

- **logo**：多伦多大学、滑铁卢大学、麦克马斯特大学、女王大学、英属哥伦比亚大学（5 个 logo 网格）
- **分类标签**：面试备考 / Interview Prep
- **中文标题**：视频面试技巧全指南 ｜ 副标题：评分真相 · 三大失分原因 · 满分框架
- **英文标题**：Video Interview Tips ｜ 副标题：How scoring works · 3 mistakes · framework
- **文件**：`/covers/kira-talent-video-interview-tips-canada-zh.svg`、`/covers/kira-talent-video-interview-tips-canada-en.svg`

### 10. 加拿大五大商学院对比

- **logo**：女王大学史密斯商学院、西安大略大学 Ivey 商学院、UBC 尚德商学院、多伦多大学 Rotman 商科、约克大学舒立克商学院（5 个 logo 网格）
- **分类标签**：商科申请 / Business
- **中文标题**：加拿大五大商学院对比 ｜ 副标题：录取偏好 · 申请时间线 · 面试策略
- **英文标题**：Top 5 Business Schools ｜ 副标题：What each wants · timeline · interviews
- **文件**：`/covers/canada-top-business-schools-comparison-2026-zh.svg`、`/covers/canada-top-business-schools-comparison-2026-en.svg`

### 11. 英国与爱尔兰直读医学申请指南

- **logo**：英国医学院、爱尔兰医学院（2 个 logo 网格）
- **分类标签**：医科与健康科学 / Medicine & Health Sciences
- **中文标题**：英国与爱尔兰直读医学申请指南 ｜ 副标题：UCAS · UCAT · MMI · 回加执业
- **英文标题**：UK & Ireland Medicine Guide ｜ 副标题：UCAS · UCAT · MMI · returning to Canada
- **文件**：`/covers/uk-ireland-direct-entry-medicine-guide-canadian-students-zh.svg`、`/covers/uk-ireland-direct-entry-medicine-guide-canadian-students-en.svg`

### 12. Rotman Commerce 补充申请指南

- **logo**：多伦多大学 Rotman 商科（单个大 logo）
- **分类标签**：商科申请 / Business
- **中文标题**：Rotman Commerce 补充申请指南 ｜ 副标题：200 字文书 · 60 秒视频 · 随机题
- **英文标题**：Rotman Commerce Guide ｜ 副标题：200-word essays · 60-second video
- **文件**：`/covers/rotman-commerce-supplementary-application-guide-2026-2027-zh.svg`、`/covers/rotman-commerce-supplementary-application-guide-2026-2027-en.svg`

### 13. Kira Talent 评分机制揭秘

- **logo**：多伦多大学、滑铁卢大学、麦克马斯特大学、UBC 尚德商学院、女王大学史密斯商学院（5 个 logo 网格）
- **分类标签**：面试备考 / Interview Prep
- **中文标题**：Kira Talent 评分机制揭秘 ｜ 副标题：大学真正看重的 4 项能力
- **英文标题**：How Kira Talent Is Scored ｜ 副标题：The four abilities schools look for
- **文件**：`/covers/kira-talent-scoring-what-universities-look-for-2026-zh.svg`、`/covers/kira-talent-scoring-what-universities-look-for-2026-en.svg`

### 14. Waterloo + SGU 6 年直通 MD 指南

- **logo**：滑铁卢大学、圣乔治大学（2 个 logo 网格）
- **分类标签**：医科与健康科学 / Medicine & Health Sciences
- **中文标题**：Waterloo + SGU 6 年直通 MD 指南 ｜ 副标题：学制 · 学费 · 免 MCAT · IMG 风险
- **英文标题**：Waterloo + SGU MD Guide ｜ 副标题：Structure · tuition · no MCAT · IMG risk
- **文件**：`/covers/waterloo-sgu-direct-entry-md-program-guide-zh.svg`、`/covers/waterloo-sgu-direct-entry-md-program-guide-en.svg`

### 15. UBC Engineering 申请指南

- **logo**：英属哥伦比亚大学（单个大 logo）
- **分类标签**：工程申请 / Engineering
- **中文标题**：UBC Engineering 申请指南 ｜ 副标题：Personal Profile · 视频面试
- **英文标题**：UBC Engineering Guide ｜ 副标题：Personal Profile · video interview
- **文件**：`/covers/ubc-engineering-personal-profile-guide-2026-2027-zh.svg`、`/covers/ubc-engineering-personal-profile-guide-2026-2027-en.svg`

### 16. McMaster Engineering 申请指南

- **logo**：麦克马斯特大学（单个大 logo）
- **分类标签**：工程申请 / Engineering
- **中文标题**：McMaster Engineering 申请指南 ｜ 副标题：20 分钟补充申请 · RPI 框架
- **英文标题**：McMaster Engineering Guide ｜ 副标题：20-minute supp app · RPI framework
- **文件**：`/covers/mcmaster-engineering-supplementary-application-guide-2026-2027-zh.svg`、`/covers/mcmaster-engineering-supplementary-application-guide-2026-2027-en.svg`

### 17. York Schulich 补充申请指南

- **logo**：约克大学舒立克商学院（单个大 logo）
- **分类标签**：商科申请 / Business
- **中文标题**：York Schulich 补充申请指南 ｜ 副标题：领导力履历 · 5 分钟文书 · 4 道 Kira
- **英文标题**：York Schulich Guide ｜ 副标题：Leadership profile · 5-minute essay · Kira
- **文件**：`/covers/york-schulich-supplementary-application-guide-2026-2027-zh.svg`、`/covers/york-schulich-supplementary-application-guide-2026-2027-en.svg`

### 18. Western Engineering Casper 备考指南

- **logo**：西安大略大学（单个大 logo）
- **分类标签**：面试备考 / Interview Prep
- **中文标题**：Western Engineering Casper 备考指南 ｜ 副标题：15 个情境 · 打字 + 视频
- **英文标题**：Casper for Western Engineering ｜ 副标题：15 scenarios · typed + video
- **文件**：`/covers/western-engineering-casper-test-guide-zh.svg`、`/covers/western-engineering-casper-test-guide-en.svg`

### 19. Kira Talent 高分回答范例

- **logo**：多伦多大学、女王大学、UBC 尚德商学院、西安大略大学 Ivey 商学院（4 个 logo 网格）
- **分类标签**：面试备考 / Interview Prep
- **中文标题**：Kira Talent 高分回答范例 ｜ 副标题：强 vs 弱 · 逐句对比
- **英文标题**：Kira Sample Answers ｜ 副标题：Strong vs. weak, sentence by sentence
- **文件**：`/covers/kira-talent-sample-answers-strong-vs-weak-2026-zh.svg`、`/covers/kira-talent-sample-answers-strong-vs-weak-2026-en.svg`

### 20. Queen's Commerce 补充申请指南

- **logo**：女王大学史密斯商学院（单个大 logo）
- **分类标签**：商科申请 / Business
- **中文标题**：Queen's Commerce 补充申请指南 ｜ 副标题：10 分钟 335 字 · 2 分钟视频
- **英文标题**：Queen's Commerce Guide ｜ 副标题：10 minutes, 335 words · 2-minute video
- **文件**：`/covers/queens-commerce-smith-supplementary-application-guide-2026-2027-zh.svg`、`/covers/queens-commerce-smith-supplementary-application-guide-2026-2027-en.svg`

### 21. UBC Sauder 申请指南

- **logo**：UBC 尚德商学院（单个大 logo）
- **分类标签**：商科申请 / Business
- **中文标题**：UBC Sauder 申请指南 ｜ 副标题：Personal Profile · Kira 视频面试
- **英文标题**：UBC Sauder Guide ｜ 副标题：Personal Profile · Kira interview
- **文件**：`/covers/ubc-sauder-personal-profile-video-interview-guide-2026-2027-zh.svg`、`/covers/ubc-sauder-personal-profile-video-interview-guide-2026-2027-en.svg`

### 22. McMaster Health Sciences 申请指南

- **logo**：麦克马斯特大学（单个大 logo）
- **分类标签**：医科与健康科学 / Medicine & Health Sciences
- **中文标题**：McMaster Health Sciences 申请指南 ｜ 副标题：1,500 字符补充文书写作
- **英文标题**：McMaster Health Sciences Guide ｜ 副标题：Writing 1,500-character essays
- **文件**：`/covers/mcmaster-health-sciences-bhsc-supplementary-guide-2026-2027-zh.svg`、`/covers/mcmaster-health-sciences-bhsc-supplementary-guide-2026-2027-en.svg`

### 23. MockView 模拟面试工具

- **logo**：多伦多大学、麦克马斯特大学、女王大学史密斯商学院（3 个 logo 网格）
- **分类标签**：MockView 工具 / MockView
- **中文标题**：MockView 模拟面试工具 ｜ 副标题：真实格式 · 学校评分标准 · 英文改法
- **英文标题**：MockView Mock Interviews ｜ 副标题：Real formats · school rubrics · English fixes
- **文件**：`/covers/mockview-ai-mock-interview-introduction-zh.svg`、`/covers/mockview-ai-mock-interview-introduction-en.svg`

### 24. MockView 使用指南

- **logo**：多伦多大学、麦克马斯特大学、女王大学史密斯商学院（3 个 logo 网格）
- **分类标签**：MockView 工具 / MockView
- **中文标题**：MockView 使用指南 ｜ 副标题：读报告 · 每轮改一项 · 7 天计划
- **英文标题**：MockView User Guide ｜ 副标题：Read the report · fix one thing · 7-day plan
- **文件**：`/covers/mockview-user-guide-practice-plan-zh.svg`、`/covers/mockview-user-guide-practice-plan-en.svg`
