-- 博客文章表：每一行 = 一篇博客的一种语言（同一篇文章的中文、英文共用一个 slug）
CREATE TABLE IF NOT EXISTS posts (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  slug            TEXT NOT NULL,             -- 网址里的名字，如 /zh/blog/kira-talent-practice-guide-2026/
  lang            TEXT NOT NULL DEFAULT 'zh', -- zh 中文 / en 英文
  title           TEXT NOT NULL,             -- 标题
  excerpt         TEXT,                      -- 列表页显示的摘要
  content         TEXT NOT NULL,             -- 正文（Markdown 原文）
  cover           TEXT,                      -- 封面图地址
  cover_alt       TEXT,                      -- 封面图的替代文字（SEO / 无障碍）
  cover_title     TEXT,                      -- 封面上的大标题
  cover_subtitle  TEXT,                      -- 封面上的副标题
  schools         TEXT,                      -- 封面要展示的学校，JSON 数组，如 ["uoft"]
  full_translation INTEGER DEFAULT 1,        -- 英文版是否为全文（0 = 摘要版）
  author          TEXT,
  category        TEXT,
  tags            TEXT,                      -- 标签，存成 JSON 数组字符串
  keywords        TEXT,                      -- SEO 关键词，JSON 数组
  seo_title       TEXT,
  seo_description TEXT,
  faq             TEXT,                      -- 常见问题 [{q, a}]，用来生成 FAQ 结构化数据
  related         TEXT,                      -- 相关文章 slug，JSON 数组
  reading_time    INTEGER,                   -- 阅读时长（分钟）
  status          TEXT DEFAULT 'draft',      -- draft 草稿 / published 已发布
  published_at    TEXT,                      -- 发布日期 2026-10-19
  updated_at      TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (slug, lang)
);
