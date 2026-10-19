// 生成静态网站：从 ../blog.db 读文章，输出到 dist/
// 用法：npm run build   （正式域名用 SITE_URL=https://你的域名 npm run build）
import { DatabaseSync } from "node:sqlite";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { Marked } from "marked";
import { coverSvg, schoolBadge } from "./covers.mjs";

const SITE_URL = (process.env.SITE_URL || "https://blog.edmoat.com").replace(/\/$/, "");
const MOCKVIEW_URL = "https://www.mockview.ca/";
const CONSULT_URL = "https://edmoat.com/";
const FEATURED = "kira-talent-practice-guide-2026";
const DIST = new URL("./dist/", import.meta.url);

const schools = JSON.parse(readFileSync(new URL("../build/schools.json", import.meta.url), "utf8"));
const db = new DatabaseSync(new URL("../blog.db", import.meta.url).pathname, { readOnly: true });
const rows = db.prepare("SELECT * FROM posts WHERE status = 'published' ORDER BY published_at DESC, slug").all();

const T = {
  zh: {
    htmlLang: "zh-Hans", other: "en", otherLabel: "English", siteName: "Edmoat 申请洞察",
    heroKicker: "Edmoat 申请洞察", heroTitle: "加拿大名校申请，拆开讲清楚",
    heroText: "补充申请、视频面试、Personal Profile 和选校规划：按评分标准写的实战指南，每篇都告诉你下一步该练什么。",
    bySchool: "按学校浏览", byTopic: "按主题", all: "全部", featured: "推荐阅读", allPosts: "全部文章",
    minutes: (n) => `${n} 分钟`, readMore: "阅读全文", toc: "本文目录",
    navMockview: "MockView 模拟面试", navConsult: "预约 1v1",
    ctaTitle: "用 MockView 练这一题", ctaText: "按学校真实格式出题、按评分标准打分，附可直接说出口的英文改法。",
    ctaButton: "开始模拟面试", consultTitle: "想要一对一指导？", consultButton: "预约 1v1 咨询",
    home: "首页", updated: "更新于", empty: "没有符合条件的文章。",
    footer: "Edmoat 帮助学生准备加拿大名校的补充申请与面试。", summaryBadge: "",
    desc: "加拿大名校补充申请、Kira 视频面试、Personal Profile 与选校规划实战指南，由 Edmoat 升学顾问团队撰写。",
  },
  en: {
    htmlLang: "en", other: "zh", otherLabel: "中文", siteName: "Edmoat Admissions Insights",
    heroKicker: "Edmoat Admissions Insights", heroTitle: "Canadian admissions, explained",
    heroText: "Supplementary applications, video interviews, Personal Profiles and school choice: practical guides built around how you're actually scored, each ending with what to practise next.",
    bySchool: "Browse by school", byTopic: "By topic", all: "All", featured: "Featured", allPosts: "All guides",
    minutes: (n) => `${n} min read`, readMore: "Read the guide", toc: "On this page",
    navMockview: "MockView", navConsult: "Book 1:1",
    ctaTitle: "Practise this with MockView", ctaText: "Real school formats, scored on the school's rubric, with English phrasing you can say out loud.",
    ctaButton: "Start a mock interview", consultTitle: "Want one-on-one help?", consultButton: "Book a 1:1 consultation",
    home: "Home", updated: "Updated", empty: "No guides match this filter.",
    footer: "Edmoat helps students prepare supplementary applications and interviews for Canada's top universities.",
    summaryBadge: "Summary · full translation coming soon",
    desc: "Practical guides to Canadian university supplementary applications, Kira video interviews, Personal Profiles and school choice, by Edmoat's admissions advisors.",
  },
};

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const parse = (v) => JSON.parse(v || "[]");
const postPath = (lang, slug) => `/${lang}/blog/${slug}/`;
const utm = (url, slug, where) => `${url}?utm_source=edmoat_blog&utm_medium=${where}&utm_campaign=${slug}`;

const posts = { zh: [], en: [] };
for (const r of rows) posts[r.lang]?.push({ ...r, schoolList: parse(r.schools), faqList: parse(r.faq), relatedList: parse(r.related) });
for (const lang of ["zh", "en"]) {
  posts[lang].sort((a, b) => (b.slug === FEATURED) - (a.slug === FEATURED));
}
const bySlug = (lang, slug) => posts[lang].find((p) => p.slug === slug);

// Markdown → HTML，给标题加锚点、给表格加横向滚动容器
function render(md) {
  const headings = [];
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        const id = `s${headings.length + 1}`;
        headings.push({ id, depth, text: html.replace(/<[^>]+>/g, "") });
        return `<h${depth} id="${id}">${html}</h${depth}>\n`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:/.test(href);
        return `<a href="${esc(href)}"${title ? ` title="${esc(title)}"` : ""}${external ? ' target="_blank" rel="noopener"' : ""}>${text}</a>`;
      },
    },
  });
  // 页面头部已经显示更新日期和阅读时长，去掉正文里重复的那一行
  const cleaned = md.replace(/^\*(最后更新|Last updated)[^\n]*\*\n/m, "");
  const html = marked.parse(cleaned)
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, "</table></div>");
  return { html, headings };
}

function head({ lang, title, description, path, altPath, image, jsonLd = [] }) {
  const t = T[lang];
  const url = SITE_URL + path;
  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="zh-Hans" href="${SITE_URL + (lang === "zh" ? path : altPath)}">
<link rel="alternate" hreflang="en" href="${SITE_URL + (lang === "en" ? path : altPath)}">
<link rel="alternate" hreflang="x-default" href="${SITE_URL + (lang === "zh" ? path : altPath)}">
<meta property="og:type" content="${jsonLd.length ? "article" : "website"}">
<meta property="og:site_name" content="${esc(t.siteName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url}">
${image ? `<meta property="og:image" content="${SITE_URL + image}">` : ""}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gloock&family=Schibsted+Grotesk:wght@400;500;600;700&family=Noto+Serif+SC:wght@600;700&family=Noto+Sans+SC:wght@400;500;700&display=swap">
<link rel="stylesheet" href="/styles.css">
${jsonLd.map((d) => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, "\\u003c")}</script>`).join("\n")}
</head>`;
}

function header(lang, altPath) {
  const t = T[lang];
  return `<header class="site-header">
  <div class="wrap header-row">
    <a class="brand" href="/${lang}/"><span class="brand-mark">Edmoat</span><span class="brand-sub">${lang === "zh" ? "申请洞察" : "Insights"}</span></a>
    <nav class="nav">
      <a class="nav-link hide-sm" href="${utm(MOCKVIEW_URL, "nav", "nav")}" target="_blank" rel="noopener">${t.navMockview}</a>
      <a class="lang-switch" href="${altPath}" hreflang="${t.other}" lang="${t.other === "zh" ? "zh-Hans" : "en"}">${t.otherLabel}</a>
      <a class="btn btn-small" href="${utm(CONSULT_URL, "nav", "nav")}" target="_blank" rel="noopener">${t.navConsult}</a>
    </nav>
  </div>
</header>`;
}

function footer(lang) {
  const t = T[lang];
  return `<footer class="site-footer">
  <div class="wrap footer-row">
    <div><span class="brand-mark">Edmoat</span><p>${t.footer}</p></div>
    <div class="footer-links">
      <a href="${utm(MOCKVIEW_URL, "footer", "footer")}" target="_blank" rel="noopener">MockView</a>
      <a href="${utm(CONSULT_URL, "footer", "footer")}" target="_blank" rel="noopener">${t.consultButton}</a>
      <a href="/${t.other}/">${t.otherLabel}</a>
    </div>
  </div>
  <div class="wrap fine">© ${new Date().getFullYear()} Edmoat</div>
</footer>`;
}

function schoolChips(p, lang) {
  return p.schoolList.map((k) => `<span class="chip">${esc(schools[k].short)}</span>`).join("");
}

function card(p, lang, featured = false) {
  const t = T[lang];
  return `<a class="card${featured ? " card-featured" : ""}" href="${postPath(lang, p.slug)}" data-cat="${esc(p.category)}" data-schools="${p.schoolList.join(" ")}">
  <img class="card-cover" src="${p.cover}" alt="${esc(p.cover_alt)}" width="1600" height="900" loading="${featured ? "eager" : "lazy"}">
  <div class="card-body">
    <span class="cat">${esc(p.category)}</span>
    <h3 class="card-title">${esc(p.title)}</h3>
    <p class="card-excerpt">${esc(p.excerpt)}</p>
    <div class="card-meta"><span>${t.minutes(p.reading_time)}</span>${lang === "en" && !p.full_translation ? `<span class="pill-note">${t.summaryBadge}</span>` : ""}<span class="chips">${schoolChips(p, lang)}</span></div>
  </div>
</a>`;
}

function indexPage(lang) {
  const t = T[lang];
  const list = posts[lang];
  const [featured, ...rest] = list;
  const cats = [...new Set(list.map((p) => p.category))];
  const used = Object.keys(schools).filter((k) => list.some((p) => p.schoolList.includes(k)));
  const altPath = `/${t.other}/`;
  return `${head({ lang, title: `${t.siteName} | ${t.heroTitle}`, description: t.desc, path: `/${lang}/`, altPath, image: featured?.cover })}
<body>
${header(lang, altPath)}
<main>
  <section class="hero wrap">
    <p class="kicker">${t.heroKicker}</p>
    <h1 class="hero-title">${t.heroTitle}</h1>
    <p class="hero-text">${t.heroText}</p>
  </section>

  <section class="wrap filters" aria-label="${t.bySchool}">
    <h2 class="filter-label">${t.bySchool}</h2>
    <div class="school-row" role="group">
      <button class="school-btn is-active" data-school="">${t.all}</button>
      ${used.map((k) => `<button class="school-btn" data-school="${k}" title="${esc(lang === "zh" ? schools[k].zh : schools[k].en)}">${schoolBadge(k, schools[k])}<span>${esc(schools[k].short)}</span></button>`).join("\n      ")}
    </div>
    <h2 class="filter-label">${t.byTopic}</h2>
    <div class="cat-row" role="group">
      <button class="cat-btn is-active" data-cat="">${t.all}</button>
      ${cats.map((c) => `<button class="cat-btn" data-cat="${esc(c)}">${esc(c)}</button>`).join("\n      ")}
    </div>
  </section>

  <section class="wrap">
    <h2 class="section-title" id="featured-title">${t.featured}</h2>
    ${featured ? card(featured, lang, true) : ""}
    <h2 class="section-title">${t.allPosts}</h2>
    <div class="grid" id="grid">
      ${rest.map((p) => card(p, lang)).join("\n")}
    </div>
    <p class="empty" id="empty" hidden>${t.empty}</p>
  </section>
</main>
${footer(lang)}
<script>
(() => {
  const state = { school: "", cat: "" };
  const cards = [...document.querySelectorAll(".card")];
  const empty = document.getElementById("empty");
  const featuredTitle = document.getElementById("featured-title");
  function apply() {
    let shown = 0;
    for (const c of cards) {
      const ok = (!state.school || c.dataset.schools.split(" ").includes(state.school)) && (!state.cat || c.dataset.cat === state.cat);
      c.hidden = !ok;
      if (ok) shown++;
    }
    const filtering = state.school || state.cat;
    featuredTitle.hidden = filtering;
    document.querySelector(".card-featured")?.classList.toggle("as-grid", !!filtering);
    empty.hidden = shown > 0;
  }
  function bind(selector, key) {
    const btns = document.querySelectorAll(selector);
    btns.forEach((b) => b.addEventListener("click", () => {
      state[key] = b.dataset[key];
      btns.forEach((x) => x.classList.toggle("is-active", x === b));
      apply();
    }));
  }
  bind(".school-btn", "school");
  bind(".cat-btn", "cat");
})();
</script>
</body>
</html>`;
}

function postPage(p) {
  const lang = p.lang;
  const t = T[lang];
  const other = bySlug(t.other, p.slug);
  const altPath = other ? postPath(t.other, p.slug) : `/${t.other}/`;
  const { html, headings } = render(p.content);
  const toc = headings.filter((h) => h.depth === 2);
  const url = SITE_URL + postPath(lang, p.slug);
  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, description: p.seo_description,
      image: SITE_URL + p.cover, datePublished: p.published_at, dateModified: p.published_at, inLanguage: t.htmlLang,
      author: { "@type": "Organization", name: p.author }, publisher: { "@type": "Organization", name: "Edmoat", url: "https://edmoat.com" },
      mainEntityOfPage: url, keywords: parse(p.keywords).join(", "),
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: p.faqList.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: t.home, item: `${SITE_URL}/${lang}/` },
        { "@type": "ListItem", position: 2, name: p.category, item: `${SITE_URL}/${lang}/` },
        { "@type": "ListItem", position: 3, name: p.title, item: url },
      ],
    },
  ];
  const mockviewHref = utm(MOCKVIEW_URL, p.slug, "sidebar");
  return `${head({ lang, title: p.seo_title, description: p.seo_description, path: postPath(lang, p.slug), altPath, image: p.cover, jsonLd })}
<body>
${header(lang, altPath)}
<main class="wrap">
  <nav class="crumbs" aria-label="breadcrumb"><a href="/${lang}/">${t.home}</a><span aria-hidden="true">/</span><span>${esc(p.category)}</span></nav>
  <header class="post-head">
    <span class="cat">${esc(p.category)}</span>
    <h1 class="post-title">${esc(p.title)}</h1>
    <p class="post-meta">${esc(p.author)} · ${t.updated} ${esc(p.published_at)} · ${t.minutes(p.reading_time)}${lang === "en" && !p.full_translation ? ` · <span class="pill-note">${t.summaryBadge}</span>` : ""}</p>
    <div class="chips">${schoolChips(p, lang)}</div>
  </header>
  <img class="post-cover" src="${p.cover}" alt="${esc(p.cover_alt)}" width="1600" height="900">
  <div class="post-layout">
    <article class="prose">
${html}
    </article>
    <aside class="sidebar">
      ${toc.length > 2 ? `<nav class="toc" aria-label="${t.toc}"><p class="toc-title">${t.toc}</p><ol>${toc.map((h) => `<li><a href="#${h.id}">${h.text}</a></li>`).join("")}</ol></nav>` : ""}
      <div class="side-cta">
        <p class="side-cta-title">${t.ctaTitle}</p>
        <p>${t.ctaText}</p>
        <a class="btn" href="${mockviewHref}" target="_blank" rel="noopener">${t.ctaButton}</a>
        <p class="side-cta-title small">${t.consultTitle}</p>
        <a class="btn btn-ghost" href="${utm(CONSULT_URL, p.slug, "sidebar")}" target="_blank" rel="noopener">${t.consultButton}</a>
      </div>
    </aside>
  </div>
</main>
${footer(lang)}
</body>
</html>`;
}

function write(path, content) {
  const file = new URL(path.replace(/^\//, ""), DIST);
  mkdirSync(new URL("./", file), { recursive: true });
  writeFileSync(file, content);
}

rmSync(DIST, { recursive: true, force: true });
cpSync(new URL("./public/", import.meta.url), DIST, { recursive: true });

write("/index.html", `<!doctype html><html><head><meta charset="utf-8"><title>Edmoat</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="alternate" hreflang="zh-Hans" href="${SITE_URL}/zh/"><link rel="alternate" hreflang="en" href="${SITE_URL}/en/">
<script>location.replace((navigator.language || "").toLowerCase().startsWith("zh") ? "/zh/" : "/en/");</script></head>
<body><a href="/zh/">中文</a> · <a href="/en/">English</a></body></html>`);

const urls = [];
for (const lang of ["zh", "en"]) {
  write(`/${lang}/index.html`, indexPage(lang));
  urls.push(`/${lang}/`);
  for (const p of posts[lang]) {
    write(`${postPath(lang, p.slug)}index.html`, postPage(p));
    write(p.cover, coverSvg(p, schools));
    urls.push(postPath(lang, p.slug));
  }
}

write("/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`).join("\n")}
</urlset>`);
write("/robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);

console.log(`✓ ${posts.zh.length} 篇中文 + ${posts.en.length} 篇英文，共 ${urls.length} 个页面 → site/dist/`);
