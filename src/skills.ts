import { em } from "./cards.js";
import type { Level, SkillGroup } from "./config.js";
import type { Theme } from "./stats.js";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const PALETTE = {
  light: {
    bg: "#ffffff", border: "#d0d7de", text: "#1f2328", sub: "#656d76", line: "#eaeef2", onAccent: "#ffffff",
    groups: ["#8250df", "#0969da", "#1a7f37", "#bc4c00", "#bf3989", "#0e7c86"],
  },
  dark: {
    bg: "#0d1117", border: "#30363d", text: "#e6edf3", sub: "#8b949e", line: "#21262d", onAccent: "#0d1117",
    groups: ["#a371f7", "#58a6ff", "#3fb950", "#f0883e", "#db61a2", "#39c5cf"],
  },
} as const;

const W = 840, P = 24, LABEL_W = 200, CHIP_H = 28, GAP = 8, FONT = 12.5, PAD_X = 14, ROW_PAD = 14;

interface Placed { name: string; level: Level; x: number; y: number; w: number }

function layout(skills: { name: string; level: Level }[]): { chips: Placed[]; height: number } {
  const x0 = P + LABEL_W, xMax = W - P;
  let x = x0, y = 0;
  const chips: Placed[] = [];
  for (const s of skills) {
    const w = Math.ceil([...s.name].reduce((a, ch) => a + em(ch), 0) * FONT * 1.06 + PAD_X * 2);
    if (x + w > xMax && x > x0) {
      x = x0;
      y += CHIP_H + GAP;
    }
    chips.push({ ...s, x, y, w });
    x += w + GAP;
  }
  return { chips, height: y + CHIP_H };
}

function chip(p: Placed, oy: number, color: string, c: (typeof PALETTE)[Theme]): string {
  const y = oy + p.y;
  const cx = p.x + p.w / 2, ty = y + CHIP_H / 2 + 4.5;
  const rect = (attrs: string) => `<rect x="${p.x}" y="${y}" width="${p.w}" height="${CHIP_H}" rx="${CHIP_H / 2}" ${attrs}/>`;
  const text = (fill: string, weight: number) =>
    `<text x="${cx}" y="${ty}" font-size="${FONT}" font-weight="${weight}" text-anchor="middle" fill="${fill}">${esc(p.name)}</text>`;
  if (p.level === "main") return `${rect(`fill="${color}"`)}\n${text(c.onAccent, 700)}`;
  if (p.level === "hands-on") return `${rect(`fill="${color}" fill-opacity="0.14" stroke="${color}" stroke-opacity="0.45"`)}\n${text(color, 600)}`;
  return `${rect(`fill="none" stroke="${c.sub}" stroke-opacity="0.6" stroke-dasharray="3 3"`)}\n${text(c.sub, 500)}`;
}

export function renderSkillsSvg(groups: SkillGroup[], theme: Theme): string {
  const c = PALETTE[theme];
  const font = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;
  const out: string[] = [];
  let y = P - ROW_PAD + 4;
  groups.forEach((g, gi) => {
    const color = c.groups[gi % c.groups.length] ?? c.groups[0];
    const { chips, height } = layout(g.skills);
    const top = y + ROW_PAD;
    out.push(
      `<circle cx="${P + 5}" cy="${top + CHIP_H / 2}" r="5" fill="${color}"/>`,
      `<text x="${P + 18}" y="${top + CHIP_H / 2 + 5}" font-size="13.5" font-weight="700" fill="${c.text}">${esc(g.title)}</text>`,
      ...chips.map((p) => chip(p, top, color, c)),
    );
    y = top + height + ROW_PAD;
    if (gi < groups.length - 1) out.push(`<line x1="${P}" y1="${y}" x2="${W - P}" y2="${y}" stroke="${c.line}"/>`);
  });

  // Legend
  y += 8;
  const ly = y + 14;
  const legend = [
    { label: "Main focus", level: "main" as const },
    { label: "Hands-on", level: "hands-on" as const },
    { label: "Researched & written", level: "researched" as const },
  ];
  let lx = P;
  const lc = c.groups[0];
  for (const l of legend) {
    if (l.level === "main") out.push(`<rect x="${lx}" y="${ly - 10}" width="26" height="12" rx="6" fill="${lc}"/>`);
    else if (l.level === "hands-on") out.push(`<rect x="${lx}" y="${ly - 10}" width="26" height="12" rx="6" fill="${lc}" fill-opacity="0.14" stroke="${lc}" stroke-opacity="0.45"/>`);
    else out.push(`<rect x="${lx}" y="${ly - 10}" width="26" height="12" rx="6" fill="none" stroke="${c.sub}" stroke-opacity="0.6" stroke-dasharray="3 3"/>`);
    out.push(`<text x="${lx + 34}" y="${ly}" font-size="12" fill="${c.sub}">${esc(l.label)}</text>`);
    lx += 34 + Math.ceil([...l.label].reduce((a, ch) => a + em(ch), 0) * 12) + 24;
  }
  const H = ly + P - 6;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${font}" role="img" aria-label="Skills">
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="${c.bg}" stroke="${c.border}"/>
${out.join("\n")}
</svg>
`;
}
