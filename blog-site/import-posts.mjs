// 批量导入：把 posts/zh 和 posts/en 里的每个 .md 文件写进数据库的 posts 表
// 用法：node import-posts.mjs
// 同一个 slug + 语言再导入一次 = 更新那篇文章（不会重复）
import { DatabaseSync } from "node:sqlite";
import { existsSync, readFileSync, readdirSync } from "node:fs";

const db = new DatabaseSync("blog.db");
db.exec(readFileSync("schema.sql", "utf8"));

// 拆开 "--- 头部信息 ---" 和正文
function parsePost(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("文件开头缺少 --- 头部信息 ---");
  const meta = {};
  for (const line of match[1].split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    meta[line.slice(0, i).trim()] = JSON.parse(line.slice(i + 1).trim());
  }
  return { meta, content: match[2].trim() };
}

const columns = [
  "slug", "lang", "title", "excerpt", "content", "cover", "cover_alt", "cover_title",
  "cover_subtitle", "schools", "full_translation", "author", "category", "tags", "keywords",
  "seo_title", "seo_description", "faq", "related", "reading_time", "status", "published_at",
];
const updates = columns.filter((c) => c !== "slug" && c !== "lang")
  .map((c) => `${c} = excluded.${c}`).join(", ");
const upsert = db.prepare(`
  INSERT INTO posts (${columns.join(", ")})
  VALUES (${columns.map(() => "?").join(", ")})
  ON CONFLICT(slug, lang) DO UPDATE SET ${updates}, updated_at = CURRENT_TIMESTAMP
`);

const json = (value) => JSON.stringify(value ?? []);
let count = 0;

for (const lang of ["zh", "en"]) {
  const dir = `posts/${lang}`;
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const { meta: m, content } = parsePost(readFileSync(`${dir}/${file}`, "utf8"));
    upsert.run(
      m.slug, lang, m.title, m.excerpt ?? null, content, m.cover ?? null, m.coverAlt ?? null,
      m.coverTitle ?? null, m.coverSubtitle ?? null, json(m.schools),
      m.fullTranslation === false ? 0 : 1, m.author ?? null, m.category ?? null,
      json(m.tags), json(m.keywords), m.seoTitle ?? null, m.seoDescription ?? null,
      json(m.faq), json(m.related), m.readingTime ?? null, m.status ?? "draft", m.date ?? null,
    );
    count++;
    console.log(`✓ ${lang}/${file}  →  /${lang}/blog/${m.slug}/`);
  }
}
console.log(`共导入 ${count} 篇`);
