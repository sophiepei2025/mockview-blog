"""把桌面上清洗好的文章 + posts_meta.py 里的信息，生成可导入数据库的 blog 文件。

用法：python3 build/build_posts.py
输出：posts/zh/<slug>.md、posts/en/<slug>.md 和 covers.md（封面设计规范）
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from posts_meta import POSTS  # noqa: E402
from posts_meta_en import CATEGORY_EN, EN  # noqa: E402

SRC_DIR = Path("/Users/chengyinpei/Desktop/营销备选/blog文章已清洗更改完成")
ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "posts"

DATE = "2026-10-19"
AUTHOR = "Edmoat 升学顾问团队"
AUTHOR_EN = "Edmoat Admissions Advisors"
MOCKVIEW_URL = "https://www.mockview.ca/"
CONSULT_URL = "https://edmoat.com/"  # TODO: 换成 1v1 预约页
LIVE_SCHOOLS = ["UofT Engineering", "McMaster Engineering", "Queen's Commerce"]

# 品牌替换：Youthfully → Edmoat / MockView。
# 涉及“辅导过的学生”“数千名学员”这类具体事实的句子，改成中性说法，不替 Edmoat 编造经历。
BRAND_FIXES = [
    ("以下展示 Youthfully 真实高分案例如何将", "以下用 Edmoat 整理的 3 个高分案例，展示如何将"),
    ("申请者必须借助 Youthfully 视频面试模拟器（Video Interview Simulator）等工具，进行高强度的实战演练。",
     "申请者必须借助 Edmoat 的 MockView 等 AI 模拟面试工具，进行高强度的实战演练。"),
    ("对照 Youthfully 模拟器生成的 AI 诊断报告与数据，重点监控以下四个指标：",
     "对照 MockView 生成的评分报告，并重点自查以下四个指标："),
    ("（参考 Youthfully 真实高分案例数据）", "（参考 Edmoat 整理的高分案例数据）"),
    ("正如 Youthfully 资深录取专家所指出的", "正如 Edmoat 升学顾问常说的"),
    ("综合 Youthfully 专家顾问团队指导数千名申请者成功通关顶尖工程院系的实战经验，总结出以下全局策略清单：",
     "Edmoat 升学顾问团队总结出以下全局策略清单："),
    ("*   **真实案例（Youthfully 源码实战）**：在 Youthfully 辅导的真实案例中，高中生 Liam",
     "*   **真实案例**：高中生 Liam"),
    ("推荐使用 Youthfully Video Interview Simulator 等专业工具，重点监控系统自动生成的 4 大量化评估指标：",
     "推荐使用 Edmoat 的 MockView 等专业工具，并重点自查以下 4 项指标："),
]

# 清掉生成稿残留的“源文本”等字样、错别字和生硬译法。
TEXT_FIXES = [
    ("（严格基于 Source Context）", ""),
    ("【技术文档架构师点评】", "【Edmoat 顾问点评】"),
    ("【招生策略顾问点评】", "【Edmoat 顾问点评】"),
    ("**真实源文案例融入：**", "**案例参考：**"),
    ("（精确保留源文本比喻）", ""),
    ("源文本实证表明，", "从录取案例来看，"),
    ("严格基于源文本事实，", ""),
    ("基于源文本实证，", ""),
    ("结合源文本中“7 天内将视频面试表达评分从 1 分系统性提升至 4/5 分”的实操经验",
     "按照“7 天内把视频面试表达从 1 分提升到 4–5 分”的训练思路"),
    ("源文本数据表明，", "实践表明，"),
    ("Queen me Supp App", "Queen's Supp App"),
    ("写作结构 recommended：", "推荐写作结构："),
    ("AI official 规范", "AI 使用规范"),
    ("UKAT", "UCAT"),
    ("地底自我探索", "深层自我探索"),
    ("地下室深度自我探索", "深层自我探索"),
    ("地下级深度自我挖掘", "深层自我挖掘"),
    ("地下层自我深度探索", "深层自我探索"),
    ("地下级深度", "深层"),
    ("地下级反思", "深层反思"),
]

BOX_START = tuple("┌│└├▼")


def find_source(prefix):
    matches = sorted(SRC_DIR.glob(f"{prefix}*.md"))
    if len(matches) != 1:
        raise SystemExit(f"找不到唯一的源文件：{prefix}")
    return matches[0]


def apply_fixes(text, fixes, required):
    for old, new in fixes:
        if required and old not in text:
            continue
        text = text.replace(old, new)
    return text


def strip_title(lines):
    """去掉 H1 标题和紧跟其后的分隔线（标题已放进头部信息）。"""
    while lines and (not lines[0].strip() or lines[0].startswith("# ")):
        lines.pop(0)
    if lines and lines[0].strip() == "---":
        lines.pop(0)
    return lines


def walk(lines):
    """逐行返回 (行, 是否在代码块内)。"""
    in_fence = False
    for line in lines:
        if line.strip().startswith("```"):
            in_fence = not in_fence
            yield line, True
            continue
        yield line, in_fence


def normalize_headings(lines):
    """部分文章把一级章节写成 ###，统一提升为 ##，保证标题层级正确。"""
    has_h2 = any(l.startswith("## ") for l, fenced in walk(lines) if not fenced)
    if has_h2:
        return lines
    out = []
    for line, fenced in walk(lines):
        if not fenced and re.match(r"#{3,6} ", line):
            line = line[1:]
        out.append(line)
    return out


def fix_tables(lines):
    """表格单元格里有换行时，Markdown 表格会断掉；把它们合并成 <br>。"""
    out, buf = [], None
    for line, fenced in walk(lines):
        if buf is not None:
            buf += "<br>" + line.strip()
            if buf.rstrip().endswith("|"):
                out.append(buf)
                buf = None
            continue
        if not fenced and line.startswith("|") and not line.rstrip().endswith("|"):
            buf = line.rstrip()
            continue
        out.append(line)
    if buf is not None:
        out.append(buf)
    return out


def fence_box_drawings(lines):
    """没放进代码块的框线图会在网页上错位，给它们补上代码块。"""
    out, i = [], 0
    fenced_flags = [f for _, f in walk(lines)]
    while i < len(lines):
        if not fenced_flags[i] and lines[i].strip().startswith(BOX_START):
            j = i
            while j < len(lines) and not fenced_flags[j] and lines[j].strip().startswith(BOX_START):
                j += 1
            out += ["```text", *lines[i:j], "```"]
            i = j
            continue
        out.append(lines[i])
        i += 1
    return out


SEP = re.compile(r"^\s*\+[-=+]+\+\s*$")


def box_to_ascii(line):
    """把 ┌─┬─┐ 这类制表符画的线转成 +---+ 和 |，交给同一个表格解析器。"""
    s = line.rstrip()
    if re.match(r"^\s*[┌├└]", s):
        s = re.sub("─+", lambda m: "-" * len(m.group(0)), s)
        return "".join("+" if ch in "┌┬┐├┼┤└┴┘" else ch for ch in s)
    return s.replace("│", "|")


def unbox_tables(lines):
    """把 +---+ 画的表格（放在代码块里）转成 Markdown 表格，网页上不会挤爆也不会错位。"""
    out, i = [], 0
    while i < len(lines):
        if not lines[i].strip().startswith("```"):
            out.append(lines[i])
            i += 1
            continue
        j = i + 1
        while j < len(lines) and not lines[j].strip().startswith("```"):
            j += 1
        body = [l for l in lines[i + 1:j] if l.strip()]
        if body and re.match(r"^\s*[┌├└]", body[0]):
            body = [box_to_ascii(l) for l in body]
        table = to_markdown_table(body) if body and SEP.match(body[0]) else None
        flow = to_flow_steps(body) if body and SEP.match(body[0]) and not table else None
        if table:
            out += table
        elif flow:
            out += flow
        else:
            out += lines[i:j + 1]
        i = j + 1
    return out


def to_flow_steps(body):
    """流程图（+---+ 方框加 | v 箭头）改成编号步骤列表。"""
    steps = []
    for l in body:
        s = l.strip()
        if SEP.match(l) or s in ("|", "v", "V") or s.startswith("v") and len(s) < 3:
            continue
        if s.startswith("|") and s.endswith("|"):
            text = s.strip("|").strip()
            if text:
                steps.append(text)
    if not steps:
        return None
    lines = []
    for n, text in enumerate(steps):
        lines.append(f"{n + 1}. {text}" if n else f"**{text}**")
    return lines + [""]


def to_markdown_table(body):
    """body 每一行要么是分隔线（+---+），要么是 | 单元格 | 行。无法解析时返回 None。"""
    if not all(SEP.match(l) or l.strip().startswith("|") for l in body):
        return None
    groups, current = [], []
    for l in body:
        if SEP.match(l):
            if current:
                groups.append(current)
            current = []
        else:
            current.append(l)
    if current:
        groups.append(current)
    def split(line):
        s = line.strip()
        s = s[1:-1] if s.endswith("|") else s[1:]
        return [p.strip() for p in s.split("|")]

    # 只有一个单元格的行是跨列标题（如表格顶上的标题），单独成段
    captions, rows, width = [], [], None
    for group in groups:
        parsed = [split(l) for l in group]
        if len(parsed) == 1 and len(parsed[0]) == 1 and parsed[0][0]:
            captions.append(parsed[0][0])
            continue
        if any(len(p) != len(parsed[0]) for p in parsed):
            return None
        if width is None:
            width = len(parsed[0])
        if len(parsed[0]) != width:
            return None
        cells = [[] for _ in range(width)]
        for parts in parsed:
            for k, p in enumerate(parts):
                if p:
                    cells[k].append(p)
        rows.append(["<br>".join(c) for c in cells])
    if not rows or width is None or width < 1:
        return None
    out = [f"**{c}**" for c in captions]
    if out:
        out.append("")
    header, body_rows = rows[0], rows[1:]
    out += ["| " + " | ".join(header) + " |", "| " + " | ".join(["---"] * width) + " |"]
    out += ["| " + " | ".join(r) + " |" for r in body_rows]
    return out + [""]


def utm(url, slug, where):
    return f"{url}?utm_source=edmoat_blog&utm_medium=cta&utm_campaign={slug}&utm_content={where}"


def mockview_status(post):
    if post.get("mockview_line"):
        return post["mockview_line"]
    kind, school = post["mockview"]
    live = "、".join(LIVE_SCHOOLS)
    if kind == "live":
        return f"目前已上线 **{school}** 真实格式模式，可以直接练这所学校的完整流程。"
    if kind == "coming":
        return (f"**{school}** 专项模式即将上线；现在可以先用已上线的 {live} 模式练习"
                "限时视频题和 STAR 结构，方法完全通用。")
    return f"目前已上线 {live} 三所学校的真实格式，Kira 式限时视频题的练法对其他学校同样适用。"


def mid_cta(post):
    slug = post["slug"]
    if post["mockview"][0] == "writing":
        return (
            "> ✍️ **文书卡住了？** 写完初稿后，最难的是判断它到底好不好。"
            f"Edmoat 顾问可以帮你做一次“替换姓名测试”式的诊断。[预约 1v1 咨询 →]({utm(CONSULT_URL, slug, 'mid')})"
        )
    return (
        "> 🎯 **边读边练：** 看完上面的评分标准，不如马上录一题，看看自己现在在哪一档。"
        f"[用 MockView 做一次限时模拟 →]({utm(MOCKVIEW_URL, slug, 'mid')})"
    )


def pad(text, right=True):
    """中英文混排：英文开头/结尾时补一个空格。"""
    if text[0].isascii():
        text = " " + text
    if right and text[-1].isascii():
        text += " "
    return text


def end_cta(post):
    slug = post["slug"]
    focus, focus_mid = pad(post["focus"], right=False), pad(post["focus"])
    mv, consult = utm(MOCKVIEW_URL, slug, "end"), utm(CONSULT_URL, slug, "end")
    mockview_intro = (
        f"[MockView]({mv}) 是 Edmoat 自研的 AI 模拟面试工具：按目标学校的真实格式出题"
        "（题型、准备时间、作答时长、字数上限都一致），用该校的评分标准打分，"
        "引用你自己说过的原话指出问题，每条修改建议都附一句可以直接说出口的英文表达。"
    )
    if post["mockview"][0] == "writing":
        return f"""## 下一步：让你的申请材料真正“像你”

读懂方法只是第一步。真正拉开差距的，是有没有人帮你从经历库里挑出最有辨识度的故事，并一轮轮改到“换掉名字就不成立”。

### 👩‍🏫 预约 Edmoat 1v1 咨询（推荐）

如果你正在准备{focus}，Edmoat 升学顾问可以帮你梳理经历库、确定申请主线，并逐轮打磨文书和面试回答。我们做你的“单一信任源”：一套策略，从选题跟到提交。

**[预约 1v1 咨询 →]({consult})**

### 🎯 有面试环节？先用 MockView 练起来

如果你同时申请需要视频面试的项目，可以先用 MockView 练起来。{mockview_intro}

{mockview_status(post)}

**[开始一次 MockView 模拟 →]({mv})**"""
    return f"""## 下一步：从“读懂”到“练熟”

读懂方法只是第一步。真正拉开分数的，是你在真实计时压力下练过多少次，以及有没有人告诉你哪里该改。

### 🎯 自己练：用 MockView 做一次全真模拟

{mockview_intro}

{mockview_status(post)}

**[开始一次 MockView 模拟面试 →]({mv})**

### 👩‍🏫 想更快提升：预约 Edmoat 1v1 咨询

如果你希望有人帮你梳理故事库、打磨文书，或针对{focus_mid}做一对一模拟和复盘，Edmoat 升学顾问可以做你的“单一信任源”：一套策略，从选题跟到提交。

**[预约 1v1 咨询 →]({consult})**"""


def reading_minutes(text):
    cjk = len(re.findall(r"[一-鿿]", text))
    words = len(re.findall(r"[A-Za-z]+", text))
    return max(1, round(cjk / 400 + words / 200))


def post_url(lang, slug):
    return f"/{lang}/blog/{slug}/"


def frontmatter(fields):
    lines = [f"{k}: {json.dumps(v, ensure_ascii=False)}" for k, v in fields.items()]
    return "---\n" + "\n".join(lines) + "\n---\n"


def common_fields(post, en, lang, minutes, related):
    meta = en if lang == "en" else post
    cover = meta["cover"]
    sep = ": " if lang == "en" else "："
    return {
        "lang": lang,
        "title": meta["title"],
        "slug": post["slug"],
        "date": DATE,
        "updated": DATE,
        "author": AUTHOR if lang == "zh" else AUTHOR_EN,
        "category": post["category"] if lang == "zh" else CATEGORY_EN[post["category"]],
        "schools": en["schools"],
        "tags": post["tags"],
        "keywords": post["keywords"],
        "excerpt": meta["excerpt"],
        "cover": f"/covers/{post['slug']}-{lang}.svg",
        "coverAlt": f"{cover['title'].replace('|', '')}{sep}{cover['subtitle']}",
        "coverTitle": cover["title"],
        "coverSubtitle": cover["subtitle"],
        "seoTitle": meta["seo_title"],
        "seoDescription": meta["seo_description"],
        "readingTime": minutes,
        "faq": [{"q": q, "a": a} for q, a in meta["faq"]],
        "related": [r["slug"] for r in related],
        "status": "published",
    }


def build_post(post, by_prefix):
    raw = find_source(post["src"]).read_text(encoding="utf-8")
    raw = apply_fixes(raw, BRAND_FIXES, required=True)
    raw = apply_fixes(raw, TEXT_FIXES, required=False)
    if "Youthfully" in raw:
        raise SystemExit(f"{post['src']} 还有未处理的 Youthfully")

    lines = strip_title(raw.splitlines())
    lines = unbox_tables(lines)
    lines = normalize_headings(lines)
    lines = fix_tables(lines)
    lines = fence_box_drawings(lines)

    anchor = next((i for i, l in enumerate(lines)
                   if l.startswith("#") and post["mid_before"] in l), None)
    if anchor is None:
        raise SystemExit(f"{post['src']} 找不到中段 CTA 位置：{post['mid_before']}")
    h2_index = sum(1 for l in lines[:anchor] if l.startswith("## "))
    lines[anchor:anchor] = [mid_cta(post), ""]
    body = "\n".join(lines).strip()

    minutes = reading_minutes(body)
    related = [by_prefix[p] for p in post["related"]]
    en = EN[post["src"]]
    tldr = "\n".join(f"- {item}" for item in post["tldr"])
    faq = "\n\n".join(f"### {q}\n\n{a}" for q, a in post["faq"])
    related_md = "\n".join(f"- [{r['title']}]({post_url('zh', r['slug'])})" for r in related)

    doc = f"""{frontmatter(common_fields(post, en, "zh", minutes, related))}
> **简短回答：** {post['answer']}

**本文要点**

{tldr}

*最后更新：{DATE} · 作者：{AUTHOR} · 阅读约 {minutes} 分钟*

---

{body}

---

## 常见问题（FAQ）

{faq}

## 相关阅读

{related_md}

---

{end_cta(post)}
"""
    (OUT_DIR / "zh" / f"{post['slug']}.md").write_text(doc, encoding="utf-8")
    full_en = build_post_en(post, en, related, h2_index, by_prefix)
    return minutes, full_en


# ---------- 英文版 ----------

LIVE_SCHOOLS_EN = ", ".join(LIVE_SCHOOLS[:-1]) + " and " + LIVE_SCHOOLS[-1]


def mockview_status_en(post):
    kind, school = post["mockview"]
    if post["src"] == "07_":
        return "MockView's live Queen's Commerce mode uses the same 10-minute written response + 2-minute video structure, so you can practise the pacing directly."
    if post["src"] == "08_":
        return "UofT Engineering and McMaster Engineering are live in MockView, with Waterloo Engineering coming soon."
    if post["src"] == "10_":
        return "Queen's Commerce is live in MockView, with Rotman Commerce and Ivey AEO coming soon."
    if post["src"] == "18_":
        return "Casper's video scenarios are also 2-minute timed answers, so MockView works well for practising timed delivery and STAR structure."
    if kind == "live":
        return f"**{school}** is live in MockView, so you can rehearse this school's full format."
    if kind == "coming":
        return (f"A dedicated **{school}** mode is coming soon. Until then, practise timed video answers "
                f"and STAR structure in the live {LIVE_SCHOOLS_EN} modes — the method carries over.")
    return f"{LIVE_SCHOOLS_EN} are live in MockView, and the same timed-video practice applies to other schools."


def mid_cta_en(post):
    slug = post["slug"]
    if post["mockview"][0] == "writing":
        return ("> ✍️ **Stuck on a draft?** The hardest part is knowing whether it's actually good. "
                f"An Edmoat advisor can run a replace-the-name review with you. [Book a 1:1 consultation →]({utm(CONSULT_URL, slug, 'mid')})")
    return ("> 🎯 **Practise as you read:** record one answer now and see which band you're in. "
            f"[Try a timed MockView mock interview →]({utm(MOCKVIEW_URL, slug, 'mid')})")


def end_cta_en(post, en):
    slug, focus = post["slug"], en["focus"]
    mv, consult = utm(MOCKVIEW_URL, slug, "end"), utm(CONSULT_URL, slug, "end")
    mockview_intro = (
        f"[MockView]({mv}) is Edmoat's AI mock interview tool. It follows your target school's real format "
        "(question types, prep time, answer length and word limits), scores you on that school's rubric, "
        "quotes your own words back to show what to fix, and gives you English phrasing you can say out loud."
    )
    consult_line = ("An Edmoat advisor can be your single source of truth: help you build your story bank, "
                    f"sharpen your writing and run one-on-one mocks for {focus}, from first draft to submission.")
    if post["mockview"][0] == "writing":
        return f"""## Next step: make your application sound like you

Understanding the method is the first step. What makes the difference is someone helping you pick your most distinctive stories and revise until no one else could have written them.

### 👩‍🏫 Book a 1:1 consultation with Edmoat (recommended)

{consult_line}

**[Book a 1:1 consultation →]({consult})**

### 🎯 Interview coming up? Practise with MockView

{mockview_intro}

{mockview_status_en(post)}

**[Start a MockView mock interview →]({mv})**"""
    return f"""## Next step: from understanding to practised

Reading the method is the first step. Your score depends on how often you've practised under real timing, and whether someone tells you what to fix.

### 🎯 Practise on your own: a full MockView mock

{mockview_intro}

{mockview_status_en(post)}

**[Start a MockView mock interview →]({mv})**

### 👩‍🏫 Improve faster: book a 1:1 consultation

{consult_line}

**[Book a 1:1 consultation →]({consult})**"""


def build_post_en(post, en, related, h2_index, by_prefix):
    slug = post["slug"]
    translation = ROOT / "build" / "en" / f"{slug}.md"
    tldr = "\n".join(f"- {item}" for item in en["tldr"])
    faq = "\n\n".join(f"### {q}\n\n{a}" for q, a in en["faq"])
    related_md = "\n".join(f"- [{EN[r['src']]['title']}]({post_url('en', r['slug'])})" for r in related)

    if translation.exists():
        lines = unbox_tables(translation.read_text(encoding="utf-8").strip().splitlines())
        h2_positions = [i for i, l in enumerate(lines) if l.startswith("## ")]
        at = h2_positions[min(h2_index, len(h2_positions) - 1)]
        lines[at:at] = [mid_cta_en(post), ""]
        body = "\n".join(lines)
    else:
        body = (
            "> 🌐 **Full English translation coming soon.** This page summarises the guide. "
            f"[Read the complete guide in Chinese →]({post_url('zh', slug)})\n\n"
            + mid_cta_en(post)
        )

    minutes = reading_minutes(body + tldr + faq)
    doc = f"""{frontmatter({**common_fields(post, en, "en", minutes, related), "fullTranslation": translation.exists()})}
> **Short answer:** {en['answer']}

**Key points**

{tldr}

*Last updated: {DATE} · By {AUTHOR_EN} · {minutes} min read*

---

{body}

---

## FAQ

{faq}

## Related reading

{related_md}

---

{end_cta_en(post, en)}
"""
    (OUT_DIR / "en" / f"{slug}.md").write_text(doc, encoding="utf-8")
    return translation.exists()


# ---------- 封面需求文档 ----------

COVER_GUIDE = """# Blog 封面图设计规范（学校 logo 版）

共 {count} 篇文章，每篇中、英文各一张封面。网站会按这份规范**自动生成**封面（`site/` 构建时输出 SVG），
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
{logo_rows}

> ⚠️ **授权提醒**：大学 logo 是注册商标。在介绍学校的文章里使用，通常属于“指明用途”，但商业推广页面上使用最好先确认各校的品牌使用规定，
> 封面上不要出现“官方合作”“认证”等暗示合作关系的字样。如果某所学校不允许，删掉对应的 logo 文件，网站会自动退回到文字占位标志。

## 五、逐篇封面

"""


def build_covers(posts):
    schools = json.loads((ROOT / "build" / "schools.json").read_text(encoding="utf-8"))
    usage = {key: [] for key in schools}
    for n, post in enumerate(posts, 1):
        for key in EN[post["src"]]["schools"]:
            usage[key].append(f"{n:02d}")
    logo_rows = "\n".join(
        f"| `{key}.svg` | {s['zh']}（{s['en']}） | {'、'.join(usage[key])} |"
        for key, s in schools.items() if usage[key]
    )
    parts = [COVER_GUIDE.format(count=len(posts), logo_rows=logo_rows)]
    for n, post in enumerate(posts, 1):
        en = EN[post["src"]]
        names = "、".join(schools[k]["zh"] for k in en["schools"])
        layout = "单个大 logo" if len(en["schools"]) == 1 else f"{len(en['schools'])} 个 logo 网格"
        parts.append(f"""### {n:02d}. {post['cover']['title'].replace('|', '')}

- **logo**：{names}（{layout}）
- **分类标签**：{post['category']} / {CATEGORY_EN[post['category']]}
- **中文标题**：{post['cover']['title'].replace('|', '')} ｜ 副标题：{post['cover']['subtitle']}
- **英文标题**：{en['cover']['title']} ｜ 副标题：{en['cover']['subtitle']}
- **文件**：`/covers/{post['slug']}-zh.svg`、`/covers/{post['slug']}-en.svg`
""")
    (ROOT / "covers.md").write_text("\n".join(parts), encoding="utf-8")


def main():
    for lang in ("zh", "en"):
        (OUT_DIR / lang).mkdir(parents=True, exist_ok=True)
    by_prefix = {p["src"]: p for p in POSTS}
    for post in POSTS:
        minutes, full_en = build_post(post, by_prefix)
        print(f"✓ {post['slug']}  中文 {minutes} 分钟 · 英文{'全文' if full_en else '摘要版'}")
    build_covers(POSTS)
    print(f"✓ covers.md\n共生成 {len(POSTS)} 篇 × 2 种语言")


if __name__ == "__main__":
    main()
