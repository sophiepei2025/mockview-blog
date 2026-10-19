// 生成静态网站：从 ../blog.db 读文章，输出到 dist/
// 用法：npm run build   （正式域名用 SITE_URL=https://你的域名 npm run build）
import { DatabaseSync } from "node:sqlite";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { Marked } from "marked";
import { coverSvg, schoolBadge } from "./covers.mjs";

const SITE_URL = (process.env.SITE_URL || "https://blog.edmoat.com").replace(/\/$/, "");
const MOCKVIEW_URL = "https://www.mockview.ca/";
const CONSULT_URL = "https://edmoat.com/";
const config = JSON.parse(readFileSync(new URL("./config.json", import.meta.url), "utf8"));
const NEWSLETTER_ACTION = process.env.NEWSLETTER_ACTION || config.newsletterAction || "";
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
    nlTitle: "订阅 Edmoat 留学通讯", nlText: "第一时间收到最新的留学资讯、申请攻略更新，以及 MockView 和咨询服务的优惠。",
    nlEmail: "邮箱地址", nlConsent: "我同意接收 Edmoat 的留学资讯和产品优惠邮件，可随时退订。", nlButton: "订阅",
    nlPending: "订阅服务正在接入中，暂时无法提交。欢迎先关注我们的小红书。", nlSending: "提交中…",
    nlDone: "订阅成功！请留意邮箱里的确认信息。", nlFailed: "提交没有成功，请稍后再试。",
    followUs: "关注我们", social: { xiaohongshu: "小红书", wechat: "微信公众号", youtube: "YouTube" },
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
    nlTitle: "Subscribe to the Edmoat newsletter", nlText: "Get the latest admissions news and guide updates first, plus offers on MockView and consulting.",
    nlEmail: "Email address", nlConsent: "I agree to receive Edmoat admissions news and product offers by email. I can unsubscribe at any time.", nlButton: "Subscribe",
    nlPending: "Subscriptions are being set up and can't be submitted yet. Follow us on Xiaohongshu in the meantime.", nlSending: "Submitting…",
    nlDone: "You're subscribed! Please check your inbox for a confirmation.", nlFailed: "That didn't go through. Please try again later.",
    followUs: "Follow us", social: { xiaohongshu: "Xiaohongshu", wechat: "WeChat", youtube: "YouTube" },
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

const TOPICS = [
  { slug: "interview-prep", zh: "面试备考", en: "Interview Prep",
    descZh: "Kira Talent 视频面试、Casper 情境题的评分标准、答题框架和限时练习方法。",
    descEn: "How Kira Talent video interviews and Casper are scored, plus answer frameworks and timed practice." },
  { slug: "business", zh: "商科申请", en: "Business",
    descZh: "Queen's、Ivey AEO、UBC Sauder、Rotman、Schulich 的补充申请、文书和面试策略。",
    descEn: "Supplementary applications, essays and interviews for Queen's, Ivey AEO, UBC Sauder, Rotman and Schulich." },
  { slug: "engineering", zh: "工程申请", en: "Engineering",
    descZh: "UofT、Waterloo、McMaster、UBC 工程的 Profile、AIF、短文与视频面试指南。",
    descEn: "Profiles, AIFs, essays and video interviews for UofT, Waterloo, McMaster and UBC Engineering." },
  { slug: "science", zh: "理科申请", en: "Science",
    descZh: "UBC 理学院等理科项目的 Personal Profile 写法与评分维度。",
    descEn: "How to write and score the Personal Profile for UBC Science and similar programs." },
  { slug: "mockview", zh: "MockView 工具", en: "MockView",
    descZh: "Edmoat 自研 AI 模拟面试工具 MockView 的介绍、使用指南和练习计划。",
    descEn: "An introduction to Edmoat's AI mock interview tool MockView, with a user guide and practice plan." },
  { slug: "medicine-health-sciences", zh: "医科与健康科学", en: "Medicine & Health Sciences",
    descZh: "McMaster/Queen's 健康科学、Waterloo+SGU 与英爱直读医学的申请与风险对比。",
    descEn: "Applications and risks for McMaster and Queen's Health Sciences, Waterloo+SGU and UK/Ireland medicine." },
];
const topicOf = (p) => TOPICS.find((x) => x.zh === p.category || x.en === p.category);
const topicName = (topic, lang) => topic[lang];
const topicPath = (lang, topic) => `/${lang}/topic/${topic.slug}/`;

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

function socialLinks(lang) {
  const t = T[lang];
  return Object.entries(config.social)
    .filter(([, url]) => url)
    .map(([key, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener me">${esc(t.social[key])}</a>`)
    .join("\n      ");
}

function newsletterBlock(lang) {
  const t = T[lang];
  const action = NEWSLETTER_ACTION ? ` action="${esc(NEWSLETTER_ACTION)}"` : "";
  const social = socialLinks(lang);
  return `<section class="newsletter" aria-labelledby="nl-title">
  <div class="wrap newsletter-row">
    <div class="newsletter-copy">
      <h2 id="nl-title">${t.nlTitle}</h2>
      <p>${t.nlText}</p>
      ${social ? `<p class="newsletter-follow"><span>${t.followUs}</span> ${social}</p>` : ""}
    </div>
    <form class="newsletter-form" method="post"${action} data-pending="${esc(t.nlPending)}" data-sending="${esc(t.nlSending)}" data-done="${esc(t.nlDone)}" data-failed="${esc(t.nlFailed)}">
      <label class="newsletter-label" for="nl-email">${t.nlEmail}</label>
      <div class="newsletter-field">
        <input id="nl-email" name="email_address" type="email" required autocomplete="email" inputmode="email" placeholder="you@example.com">
        <button class="btn" type="submit">${t.nlButton}</button>
      </div>
      <label class="newsletter-consent"><input type="checkbox" name="consent" value="yes" required><span>${t.nlConsent}</span></label>
      <input type="hidden" name="lang" value="${lang}">
      <input type="hidden" name="source" value="">
      <p class="newsletter-status" role="status" aria-live="polite"></p>
    </form>
  </div>
  <script src="/newsletter.js" defer></script>
</section>`;
}

function footer(lang) {
  const t = T[lang];
  const social = socialLinks(lang);
  return `${newsletterBlock(lang)}
<footer class="site-footer">
  <div class="wrap footer-row">
    <div><span class="brand-mark">Edmoat</span><p>${t.footer}</p></div>
    <div class="footer-links">
      <a href="${utm(MOCKVIEW_URL, "footer", "footer")}" target="_blank" rel="noopener">MockView</a>
      <a href="${utm(CONSULT_URL, "footer", "footer")}" target="_blank" rel="noopener">${t.consultButton}</a>
      ${social}
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
  const topics = TOPICS.filter((x) => list.some((p) => topicOf(p) === x));
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
    <nav class="cat-row" aria-label="${t.byTopic}">
      <a class="cat-btn is-active" href="/${lang}/" aria-current="page">${t.all}</a>
      ${topics.map((x) => `<a class="cat-btn" href="${topicPath(lang, x)}">${esc(topicName(x, lang))}<span class="cat-count">${list.filter((p) => topicOf(p) === x).length}</span></a>`).join("\n      ")}
    </nav>
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
  const state = { school: "" };
  const cards = [...document.querySelectorAll(".card")];
  const empty = document.getElementById("empty");
  const featuredTitle = document.getElementById("featured-title");
  function apply() {
    let shown = 0;
    for (const c of cards) {
      const ok = (!state.school || c.dataset.schools.split(" ").includes(state.school));
      c.hidden = !ok;
      if (ok) shown++;
    }
    const filtering = state.school;
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
        { "@type": "ListItem", position: 2, name: p.category, item: `${SITE_URL}${topicPath(lang, topicOf(p))}` },
        { "@type": "ListItem", position: 3, name: p.title, item: url },
      ],
    },
  ];
  const mockviewHref = utm(MOCKVIEW_URL, p.slug, "sidebar");
  return `${head({ lang, title: p.seo_title, description: p.seo_description, path: postPath(lang, p.slug), altPath, image: p.cover, jsonLd })}
<body>
${header(lang, altPath)}
<main class="wrap">
  <nav class="crumbs" aria-label="breadcrumb"><a href="/${lang}/">${t.home}</a><span aria-hidden="true">/</span><a href="${topicPath(lang, topicOf(p))}">${esc(p.category)}</a></nav>
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

function topicPage(lang, topic) {
  const t = T[lang];
  const list = posts[lang].filter((p) => topicOf(p) === topic);
  const other = topicPath(t.other, topic);
  const topics = TOPICS.filter((x) => posts[lang].some((p) => topicOf(p) === x));
  const name = topicName(topic, lang);
  const desc = lang === "zh" ? topic.descZh : topic.descEn;
  const title = lang === "zh" ? `${name}：${list.length} 篇指南 | ${t.siteName}` : `${name}: ${list.length} guides | ${t.siteName}`;
  const jsonLd = [{
    "@context": "https://schema.org", "@type": "CollectionPage", name: name, description: desc,
    url: SITE_URL + topicPath(lang, topic), inLanguage: t.htmlLang,
    hasPart: list.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: SITE_URL + postPath(lang, p.slug) })),
  }];
  return `${head({ lang, title, description: desc, path: topicPath(lang, topic), altPath: other, image: list[0]?.cover })}
<body>
${header(lang, other)}
<main>
  <section class="hero wrap">
    <nav class="crumbs" aria-label="breadcrumb"><a href="/${lang}/">${t.home}</a><span aria-hidden="true">/</span><span>${esc(name)}</span></nav>
    <p class="kicker">${t.byTopic}</p>
    <h1 class="hero-title">${esc(name)}</h1>
    <p class="hero-text">${esc(desc)}</p>
  </section>
  <section class="wrap filters">
    <nav class="cat-row" aria-label="${t.byTopic}">
      <a class="cat-btn" href="/${lang}/">${t.all}</a>
      ${topics.map((x) => `<a class="cat-btn${x === topic ? " is-active" : ""}" href="${topicPath(lang, x)}"${x === topic ? ' aria-current="page"' : ""}>${esc(topicName(x, lang))}<span class="cat-count">${posts[lang].filter((p) => topicOf(p) === x).length}</span></a>`).join("\n      ")}
    </nav>
  </section>
  <section class="wrap">
    <h2 class="section-title">${lang === "zh" ? `${esc(name)}（${list.length}）` : `${esc(name)} (${list.length})`}</h2>
    <div class="grid">
      ${list.map((p) => card(p, lang)).join("\n")}
    </div>
  </section>
</main>
${footer(lang)}
${jsonLd.map((d) => `<script type="application/ld+json">${JSON.stringify(d).replace(/</g, "\\u003c")}</script>`).join("\n")}
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
  for (const topic of TOPICS.filter((x) => posts[lang].some((p) => topicOf(p) === x))) {
    write(`${topicPath(lang, topic)}index.html`, topicPage(lang, topic));
    urls.push(topicPath(lang, topic));
  }
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
