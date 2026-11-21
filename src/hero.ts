import { shade, type Theme } from "./stats.js";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const PALETTE = {
  light: { bg1: "#ffffff", bg2: "#f3f0ff", border: "#d0d7de", text: "#1f2328", sub: "#656d76", a1: "#8250df", a2: "#0969da", bar: "#8250df" },
  dark: { bg1: "#0d1117", bg2: "#1a1033", border: "#30363d", text: "#e6edf3", sub: "#8b949e", a1: "#a371f7", a2: "#58a6ff", bar: "#a371f7" },
} as const;

type P = [number, number];
const poly = (pts: P[], fill: string, extra = "") => `<polygon points="${pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ")}" fill="${fill}"${extra}/>`;

/** Isometric bar field echoing the 3D contribution graph. */
function bars(color: string): string {
  const heights = [
    [30, 50, 72, 98],
    [18, 38, 58, 80],
    [8, 24, 42, 60],
  ];
  const U: P = [22, 11];
  const V: P = [-22, 11];
  const K = 0.9;
  const ox = 690, oy = 98;
  const out: string[] = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      const h = heights[j]?.[i] ?? 0;
      const px = ox + i * U[0] + j * V[0];
      const py = oy + i * U[1] + j * V[1];
      const A: P = [px, py - h];
      const B: P = [px + U[0] * K, py + U[1] * K - h];
      const C: P = [B[0] + V[0] * K, B[1] + V[1] * K];
      const D: P = [px + V[0] * K, py + V[1] * K - h];
      const down = (p: P): P => [p[0], p[1] + h];
      const tone = 0.55 + (h / 98) * 0.45; // taller bars are brighter
      const col = shade(color, tone);
      out.push(poly([D, C, down(C), down(D)], shade(col, 0.78)), poly([B, C, down(C), down(B)], shade(col, 0.6)), poly([A, B, C, D], col));
    }
  }
  return out.join("\n");
}

export interface HeroInput { name: string; title: string; tagline: string }

export function renderHeroSvg(h: HeroInput, theme: Theme): string {
  const c = PALETTE[theme];
  const W = 840, H = 200;
  const font = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${font}" role="img" aria-label="${esc(h.name)} — ${esc(h.title)}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.bg1}"/><stop offset="1" stop-color="${c.bg2}"/></linearGradient>
<linearGradient id="ac" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${c.a1}"/><stop offset="1" stop-color="${c.a2}"/></linearGradient>
<clipPath id="card"><rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14"/></clipPath>
</defs>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="url(#bg)" stroke="${c.border}"/>
<g clip-path="url(#card)">
${bars(c.bar)}
</g>
<text x="48" y="56" font-size="12" font-weight="700" letter-spacing="3" fill="${c.sub}">HELLO, I'M</text>
<text x="46" y="118" font-size="68" font-weight="800" letter-spacing="2" fill="url(#ac)">${esc(h.name)}</text>
<rect x="48" y="134" width="64" height="4" rx="2" fill="url(#ac)"/>
<text x="48" y="168" font-size="22" font-weight="600" letter-spacing="1" fill="${c.text}">${esc(h.title)}</text>
<text x="48" y="190" font-size="13" letter-spacing="0.5" fill="${c.sub}">${esc(h.tagline)}</text>
</svg>
`;
}
