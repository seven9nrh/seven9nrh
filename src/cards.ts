import type { Repo } from "./github.js";
import type { Theme } from "./stats.js";


const PALETTE = {
  light: { bg: "#ffffff", border: "#d0d7de", text: "#1f2328", sub: "#656d76" },
  dark: { bg: "#0d1117", border: "#30363d", text: "#e6edf3", sub: "#8b949e" },
} as const;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Estimated glyph width in em: CJK/full-width = 1, others ~0.56. */
export const em = (ch: string) => ((ch.codePointAt(0) ?? 0) >= 0x2e80 ? 1 : 0.56);

/** Wrap text into at most `maxLines` lines of `maxEm` width; the last line gets an ellipsis if truncated. */
export function wrapText(text: string, maxEm: number, maxLines: number): string[] {
  const lines: string[] = [];
  let cur = "";
  let w = 0;
  let lastSpace = -1;
  const chars = [...text];
  for (const ch of chars) {
    if (w + em(ch) > maxEm) {
      if (lastSpace > 0 && ch !== " ") {
        const rest = cur.slice(lastSpace + 1);
        cur = cur.slice(0, lastSpace);
        lines.push(cur);
        cur = rest;
        w = [...rest].reduce((a, x) => a + em(x), 0);
      } else {
        lines.push(cur);
        cur = "";
        w = 0;
      }
      lastSpace = -1;
      if (lines.length === maxLines) {
        // Truncated: make room for the ellipsis on the last line.
        const last = [...(lines.pop() ?? "")];
        while (last.length && last.reduce((a, x) => a + em(x), 0) + 1 > maxEm) last.pop();
        lines.push(last.join("") + "…");
        return lines;
      }
      if (ch === " ") continue;
    }
    if (ch === " ") lastSpace = cur.length;
    cur += ch;
    w += em(ch);
  }
  if (cur) lines.push(cur);
  return lines.slice(0, maxLines);
}

// ---------- Favorite repository cards ----------

export const REPO_W = 420;
export const REPO_H = 140;

const LANG_COLORS: Record<string, string> = {
  Python: "#3572A5", TypeScript: "#3178c6", JavaScript: "#f1e05a", Java: "#b07219", Go: "#00ADD8", Rust: "#dea584",
  C: "#555555", "C++": "#f34b7d", "C#": "#178600", Ruby: "#701516", PHP: "#4F5D95", Shell: "#89e051", HTML: "#e34c26",
  CSS: "#563d7c", Kotlin: "#A97BFF", Swift: "#F05138", Vue: "#41b883", Dart: "#00B4AB", Lua: "#000080", Zig: "#ec915c",
};

export function languageColor(lang: string | null): string {
  return (lang && LANG_COLORS[lang]) || "#8b949e";
}

const fmtStars = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}k` : n.toLocaleString("en-US"));

export function renderRepoCard(r: Repo, rank: number, theme: Theme): string {
  const c = PALETTE[theme];
  const lang = languageColor(r.language);
  const [owner = "", name = r.full_name] = r.full_name.split("/");
  const desc = wrapText(r.description ?? "No description", (REPO_W - 40) / 12, 2);
  const star = "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${REPO_W}" height="${REPO_H}" viewBox="0 0 ${REPO_W} ${REPO_H}" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif" role="img" aria-label="${esc(r.full_name)}">
<defs>
<linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${lang}"/><stop offset="1" stop-color="${lang}" stop-opacity="0.15"/></linearGradient>
<clipPath id="r"><rect x="0.5" y="0.5" width="${REPO_W - 1}" height="${REPO_H - 1}" rx="12"/></clipPath>
</defs>
<rect x="0.5" y="0.5" width="${REPO_W - 1}" height="${REPO_H - 1}" rx="12" fill="${c.bg}" stroke="${c.border}"/>
<rect x="0" y="0" width="${REPO_W}" height="5" fill="url(#g)" clip-path="url(#r)"/>
<text x="20" y="34" font-size="12" fill="${c.sub}">${esc(owner)}</text>
<text x="20" y="56" font-size="17" font-weight="700" fill="${c.text}">${esc([...name].length > 30 ? [...name].slice(0, 29).join("") + "…" : name)}</text>
<text x="${REPO_W - 20}" y="40" font-size="22" font-weight="800" text-anchor="end" fill="${lang}" fill-opacity="0.9">#${rank}</text>
${desc.map((l, i) => `<text x="20" y="${82 + i * 18}" font-size="12" fill="${c.sub}">${esc(l)}</text>`).join("\n")}
<circle cx="26" cy="${REPO_H - 20}" r="5" fill="${lang}"/>
<text x="38" y="${REPO_H - 16}" font-size="12" fill="${c.text}">${esc(r.language ?? "—")}</text>
<g transform="translate(${REPO_W - 20 - 18 - String(fmtStars(r.stargazers_count)).length * 7.5 - 4},${REPO_H - 28}) scale(0.9)"><path d="${star}" fill="#e3b341"/></g>
<text x="${REPO_W - 20}" y="${REPO_H - 16}" font-size="13" font-weight="700" text-anchor="end" fill="${c.text}">${fmtStars(r.stargazers_count)}</text>
</svg>
`;
}
