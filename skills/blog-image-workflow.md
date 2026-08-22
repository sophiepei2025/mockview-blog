# Edmoat Blog 配图工作流 (SOP)

## 总览：三类图片 → 三种生产方式

| 类型 | 内容特点 | 生产方式 | 为什么 |
|---|---|---|---|
| Stat 数据卡片 | 有精确数字/文字 | HTML/CSS模板 + 截图 | AI文生图渲染数字/文字不可靠，模板化保证品牌一致 + 零版权风险 |
| Edmoat品牌插画 | 场景氛围（面试/学习），不需要精确文字 | AI文生图 | 风格可控、成本低、无版权问题 |
| 真实氛围照片（可选，谨慎用） | 泛用场景，非特定校园实景 | 免版权图库搜索 | 避免使用具体大学的版权校园实景照片 |

文章正文里用 `<!-- [IMAGE: type | 内容说明 | alt=...] -->` 标记图片需求（上次示例文章里已经这样标了），这套工作流就是把这些标记逐一变成真实图片文件的过程。

---

## 分支A：Stat 数据卡片（模板 + 截图）

**流程：**
1. 从文章里提取所有 `[IMAGE: data-card ...]` 标记，整理成结构化数据（学校名、1-2个核心数字、对应说明文字）
2. 套用下面固定的 HTML/CSS 模板，把数据填进去
3. 用 Puppeteer 打开这个 HTML，对卡片元素截图，导出 PNG
4. 按命名规则存档，写回 markdown

**卡片模板**（`stat-card-template.html`，占位符用 `{{}}` 标记，方便脚本批量替换）：

```html
<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; font-family: 'Inter', -apple-system, sans-serif; }
  .card {
    width: 600px;
    padding: 32px 40px;
    background: #FFFFFF;
    border: 1px solid #E5E3DC;
    border-radius: 16px;
    box-sizing: border-box;
  }
  .card-header {
    font-size: 14px;
    color: #6B6960;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 20px;
  }
  .stat-row { display: flex; gap: 32px; }
  .stat-block { flex: 1; }
  .stat-number {
    font-size: 40px;
    font-weight: 600;
    color: #1D1B16;
    /* TODO: 替换成 Edmoat 品牌主色 */
    line-height: 1;
  }
  .stat-caption {
    font-size: 13px;
    color: #6B6960;
    margin-top: 8px;
    line-height: 1.4;
  }
  .card-footer {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #E5E3DC;
    font-size: 12px;
    color: #9A988E;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="card-header">{{SCHOOL_NAME}} — CS at a glance</div>
    <div class="stat-row">
      <div class="stat-block">
        <div class="stat-number">{{STAT_1_VALUE}}</div>
        <div class="stat-caption">{{STAT_1_LABEL}}</div>
      </div>
      <div class="stat-block">
        <div class="stat-number">{{STAT_2_VALUE}}</div>
        <div class="stat-caption">{{STAT_2_LABEL}}</div>
      </div>
    </div>
    <div class="card-footer">Data compiled by Edmoat</div>
  </div>
</body>
</html>
```

**Puppeteer 截图脚本骨架**（`generate-stat-cards.js`）：

```javascript
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 每所学校的数据，从文章标记里整理出来
const schools = [
  {
    slug: 'waterloo',
    name: 'University of Waterloo',
    stat1Value: '80%',
    stat1Label: 'of CS students complete a co-op',
    stat2Value: '92%',
    stat2Label: 'of co-op students employed shortly after graduation',
  },
  {
    slug: 'alberta',
    name: 'University of Alberta',
    stat1Value: '25+ yrs',
    stat1Label: 'as a recognized leader in AI research',
    stat2Value: 'Amii',
    stat2Label: 'affiliated research institute',
  },
  // 按需继续加
];

const template = fs.readFileSync(
  path.join(__dirname, 'stat-card-template.html'),
  'utf-8'
);

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 700, height: 400 });

  for (const school of schools) {
    const html = template
      .replace('{{SCHOOL_NAME}}', school.name)
      .replace('{{STAT_1_VALUE}}', school.stat1Value)
      .replace('{{STAT_1_LABEL}}', school.stat1Label)
      .replace('{{STAT_2_VALUE}}', school.stat2Value)
      .replace('{{STAT_2_LABEL}}', school.stat2Label);

    await page.setContent(html);
    const card = await page.$('.card');
    await card.screenshot({
      path: `output/${school.slug}_stat-card.png`,
    });
  }

  await browser.close();
})();
```

这个脚本是骨架，实际用之前需要：
- 把 `.stat-number` 的颜色换成 Edmoat 品牌主色（我不知道具体色值，需要你提供）
- 字体如果 Edmoat 有专属字体，需要在 `<style>` 里 `@font-face` 引入
- 数据来源建议保留一份 JSON 文件（比如 `schools-data.json`），跟文章内容分离，方便以后批量改数据不用动脚本

---

## 分支B：Edmoat 品牌插画（AI 文生图）

**流程：**
1. 从文章里提取所有 `[IMAGE: illustration ...]` 标记，整理场景描述
2. 套用统一的 Prompt 模板（保证风格一致，不会每篇文章插画风格都不一样）
3. 调用文生图 API 生成（你们已经在用 MiniMax，MiniMax 有文生图能力，可以直接复用同一账号/pipeline）
4. 人工筛选，选中的图存档

**Prompt 模板**（把 `{{SCENE}}` 换成具体场景描述）：

```
Style: flat editorial illustration, warm minimal color palette (Edmoat brand
tones — [待补充具体色值]), simple geometric shapes, no text in the image,
consistent line weight, professional but approachable, suitable for an
education/career blog.

Scene: {{SCENE}}

Constraints: no realistic human faces (use simplified/abstract figures),
no text or logos, no specific recognizable university buildings or crests,
16:9 aspect ratio.
```

比如 Waterloo 那张的 `{{SCENE}}` 就填：
`"A student sitting at a desk practicing a mock interview on a laptop, calm and focused expression, soft warm lighting"`

**风格一致性的关键**：Prompt 模板里的 Style 段落要保持逐字不变，只换 Scene 段落——这样跨文章、跨插图的视觉风格才会统一，不会看起来像随手拼凑的。建议把这个 Style 段落存成一个独立的"品牌插画风格锚点"片段，以后新开一批文章直接调用。

---

## 分支C（可选，谨慎使用）：真实氛围照片

只在真的需要"看起来很真实"的场景时用，且**严禁搜索具体大学名+校园/建筑**（版权风险）。

- 只搜索泛用场景关键词：如 "students studying group" "job interview office" ，不带学校名
- 只用明确标注免版权商用的图源（Unsplash、Pexels）
- 即使 CC0，也建议记录来源链接存档，以备将来需要核查

---

## 产出规范

- **文件命名**：`{school-slug}_{type}.png`，如 `waterloo_stat-card.png`、`waterloo_illustration-interview.png`
- **存放路径**：建议按文章分文件夹，如 `/assets/blog/best-cs-universities-2026/`
- **Alt 文本**：数据卡片用"学校名 + CS program statistics"结构；插画用场景描述（不含学校名，因为插画本身是通用场景）——这个规则跟 SEO 有关，alt 文本要包含目标关键词但不能堆砌
- **文章里的引用方式**：把 markdown 里的 `<!-- [IMAGE: ...] -->` 注释替换成 `![alt文本](图片路径)`

---

## 待你补充的信息（脚本/模板里标了 TODO 的地方）

1. Edmoat 品牌主色色值（HEX）
2. Edmoat 是否有专属字体，需要引入
3. MiniMax 文生图的具体调用方式/账号是否已经在用（还是需要新开）
