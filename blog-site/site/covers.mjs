// 封面生成：学校 logo 占左半边，右边是分类、标题、副标题。
// 有官方 logo 文件（public/logos/<学校>.svg 或 .png）就嵌进去，没有就画占位标志。
import { existsSync, readFileSync } from "node:fs";

const W = 1600;
const H = 900;
const C = {
  ground: "#EEF0EB", ink: "#15202A", soft: "#4A5660", rule: "#C5CCC6",
  moat: "#2E6378", pennant: "#E9B526",
};
const SERIF = "Gloock, 'Noto Serif SC', 'Songti SC', 'STSong', serif";
const SANS = "'Schibsted Grotesk', 'Noto Sans SC', 'PingFang SC', 'Helvetica Neue', sans-serif";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function logoFile(key) {
  for (const ext of ["svg", "png"]) {
    const path = new URL(`./public/logos/${key}.${ext}`, import.meta.url);
    if (existsSync(path)) return { path, ext };
  }
  return null;
}

function logoDataUri(key) {
  const file = logoFile(key);
  if (!file) return null;
  const type = file.ext === "svg" ? "image/svg+xml" : "image/png";
  return `data:${type};base64,${readFileSync(file.path).toString("base64")}`;
}

// 粗略估算文字宽度：中文 1 个字宽，英文约半个字宽
function textWidth(text, size) {
  let w = 0;
  for (const ch of text) w += /[⺀-￿]/.test(ch) ? size : ch === " " ? size * 0.28 : size * 0.54;
  return w;
}

function wrap(text, size, maxWidth) {
  // 副标题按“ · ”分段断行；标题里英文单词、数字和 8 字以内的中文词组整体不拆开，
  // “|”是手动指定的断行点
  const units = text.includes(" · ")
    ? text.split(/(?<= · )/)
    : text.split("|").flatMap((part) =>
      part.match(/[A-Za-z0-9'’.+\-/:&]+\s*|[\u2e80-\uffff]{1,8}(?![\u2e80-\uffff])\s*|\s+|./gu) || []);
  const lines = [];
  let line = "";
  for (const unit of units) {
    if (line && textWidth(line + unit, size) > maxWidth) {
      lines.push(line.trimEnd());
      line = unit.trimStart();
    } else line += unit;
  }
  if (line) lines.push(line.trimEnd());
  return lines.map((l) => l.replace(/ ·$/, ""));
}

// 从大字号往小试，选第一个“行数不超过上限、最后一行不是孤零零一两个字”的字号
function fit(text, size, minSize, maxWidth, maxLines) {
  let fallback = null;
  for (let s = size; s >= minSize; s -= 2) {
    const lines = wrap(text, s, maxWidth);
    if (lines.length > maxLines) continue;
    fallback ??= { size: s, lines };
    const last = lines.at(-1);
    if (lines.length === 1 || textWidth(last, s) >= maxWidth * 0.3) return { size: s, lines };
  }
  return fallback ?? { size: minSize, lines: wrap(text, minSize, maxWidth) };
}

// 一个学校方块：有 logo 就放 logo，没有就画占位标志（学校色圆形 + 简称 + 全称）
function schoolTile(key, school, x, y, w, h, lang) {
  const uri = logoDataUri(key);
  const card = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) * 0.07}" fill="#FFFFFF" stroke="${C.rule}" stroke-width="2"/>`;
  if (uri) {
    const pad = Math.min(w, h) * 0.14;
    return `${card}<image href="${uri}" x="${x + pad}" y="${y + pad}" width="${w - pad * 2}" height="${h - pad * 2}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  const r = Math.min(w, h * 0.78) * 0.36;
  const cx = x + w / 2;
  const cy = y + h * 0.43;
  const shortSize = Math.min(r * 0.62, (r * 1.7) / Math.max(3, school.short.length * 0.56));
  const name = lang === "zh" ? school.zh : school.en;
  const nameSize = Math.max(14, Math.min(h * 0.07, (w * 0.86) / Math.max(1, textWidth(name, 1))));
  return `${card}
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${school.bg}"/>
  <circle cx="${cx}" cy="${cy}" r="${r * 0.86}" fill="none" stroke="${school.fg}" stroke-opacity=".45" stroke-width="${Math.max(1.5, r * 0.02)}"/>
  <text x="${cx}" y="${cy + shortSize * 0.35}" text-anchor="middle" font-family="${SERIF}" font-size="${shortSize}" fill="${school.fg}">${esc(school.short)}</text>
  <text x="${cx}" y="${y + h * 0.88}" text-anchor="middle" font-family="${SANS}" font-weight="600" font-size="${nameSize}" fill="${C.ink}">${esc(name)}</text>`;
}

function logoArea(keys, schools, lang) {
  const area = { x: 90, y: 90, w: 720, h: 720 };
  const n = keys.length;
  const cols = n === 1 ? 1 : n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const gap = 28;
  const tw = (area.w - gap * (cols - 1)) / cols;
  const th = n === 1 ? area.h : Math.min(tw, (area.h - gap * (rows - 1)) / rows);
  const totalH = rows * th + (rows - 1) * gap;
  const top = area.y + (area.h - totalH) / 2;
  return keys.map((key, i) => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, n - row * cols);
    const rowW = inRow * tw + (inRow - 1) * gap;
    const left = area.x + (area.w - rowW) / 2;
    const col = i % cols;
    return schoolTile(key, schools[key], left + col * (tw + gap), top + row * (th + gap), tw, th, lang);
  }).join("\n");
}

export function coverSvg(post, schools) {
  const lang = post.lang;
  const keys = JSON.parse(post.schools);
  const textX = 880;
  const maxW = W - textX - 90;

  const { size, lines } = fit(post.cover_title, lang === "zh" ? 78 : 70, 48, maxW, 3);
  const lineH = size * 1.18;
  const { size: subSize, lines: subLines } = fit(post.cover_subtitle, lang === "zh" ? 34 : 32, 26, maxW, 2);
  const blockH = 70 + lines.length * lineH + 30 + subLines.length * subSize * 1.35;
  let y = (H - blockH) / 2 - 20;

  const pillSize = 24;
  const pillW = textWidth(post.category, pillSize) + 44;
  const pill = `<rect x="${textX}" y="${y}" width="${pillW}" height="46" rx="23" fill="${C.pennant}"/>
  <text x="${textX + 22}" y="${y + 31}" font-family="${SANS}" font-weight="600" font-size="${pillSize}" fill="${C.ink}">${esc(post.category)}</text>`;
  y += 70 + size;
  const title = lines.map((l, i) =>
    `<text x="${textX}" y="${y + i * lineH}" font-family="${SERIF}" font-weight="700" font-size="${size}" fill="${C.ink}">${esc(l)}</text>`).join("\n");
  y += (lines.length - 1) * lineH + 30 + subSize * 1.2;
  const sub = subLines.map((l, i) =>
    `<text x="${textX}" y="${y + i * subSize * 1.35}" font-family="${SANS}" font-size="${subSize}" fill="${C.soft}">${esc(l)}</text>`).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs><pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="${C.moat}" stroke-opacity=".09" stroke-width="1"/></pattern></defs>
  <rect width="${W}" height="${H}" fill="${C.ground}"/>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="0" y="${H - 14}" width="${W}" height="14" fill="${C.moat}"/>
  ${logoArea(keys, schools, lang)}
  ${pill}
  ${title}
  ${sub}
  <text x="${textX}" y="${H - 70}" font-family="${SERIF}" font-size="34" fill="${C.moat}">Edmoat</text>
  <text x="${textX + 128}" y="${H - 71}" font-family="${SANS}" font-size="22" fill="${C.soft}">${lang === "zh" ? "申请洞察" : "Admissions Insights"}</text>
</svg>`;
}

// 列表页“按学校浏览”用的小标志
export function schoolBadge(key, school) {
  const uri = logoDataUri(key);
  if (uri) return `<img class="badge-logo" src="/logos/${key}.${logoFile(key).ext}" alt="${esc(school.en)}">`;
  // 小圆里放不下完整简称：3 个字母以内照写，否则只取首字母
  const mark = school.short.length <= 3 ? school.short : school.short[0];
  return `<span class="badge-mark${mark.length > 1 ? " is-long" : ""}" style="--bg:${school.bg};--fg:${school.fg}" aria-hidden="true">${esc(mark)}</span>`;
}
