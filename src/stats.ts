export interface Day { date: string; count: number; level: 0 | 1 | 2 | 3 | 4; weekday: number }
export interface Stats {
  totalContributions: number;
  weeks: Day[][];
}

const QUERY = `query($login:String!){
  user(login:$login){
    contributionsCollection{
      contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount contributionLevel weekday } } }
    }
  }
}`;

const LEVELS: Record<string, Day["level"]> = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

export function parseStats(user: any): Stats {
  const cal = user.contributionsCollection.contributionCalendar;
  return {
    totalContributions: cal.totalContributions,
    weeks: cal.weeks.map((w: any) =>
      w.contributionDays.map((d: any) => ({ date: d.date, count: d.contributionCount, level: LEVELS[d.contributionLevel] ?? 0, weekday: d.weekday })),
    ),
  };
}

export async function fetchStats(login: string, token: string): Promise<Stats> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "profile-generator" },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  if (!res.ok) throw new Error(`GraphQL: ${res.status}`);
  const json = (await res.json()) as any;
  if (json.errors || !json.data?.user) throw new Error(`GraphQL error: ${JSON.stringify(json.errors ?? "no user")}`);
  return parseStats(json.data.user);
}

// ---------- 3D (isometric) contribution graph ----------

export type Theme = "light" | "dark";

const PALETTE = {
  light: { bg: "#ffffff", border: "#d0d7de", text: "#1f2328", sub: "#656d76", cells: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"] },
  dark: { bg: "#0d1117", border: "#30363d", text: "#e6edf3", sub: "#8b949e", cells: ["#21262d", "#0e4429", "#006d32", "#26a641", "#39d353"] },
} as const;

/** Multiply an #rrggbb color by `f` (<1 darkens). */
export function shade(hex: string, f: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * f))).toString(16).padStart(2, "0");
  return `#${ch((n >> 16) & 255)}${ch((n >> 8) & 255)}${ch(n & 255)}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Nov 2025 – Nov 2026" from the first and last day in the calendar (string parsing: no timezone shifts). */
export function periodLabel(weeks: Day[][]): string {
  const days = weeks.flat();
  const first = days[0], last = days.at(-1);
  if (!first || !last) return "";
  const label = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1] ?? "?"} ${iso.slice(0, 4)}`;
  return `${label(first.date)} – ${label(last.date)}`;
}

const fmt = (n: number) => n.toFixed(1);
const poly = (pts: [number, number][], fill: string) => `<polygon points="${pts.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(" ")}" fill="${fill}"/>`;

export function renderStatsSvg(s: Stats, theme: Theme): string {
  const c = PALETTE[theme];
  const W = 840, P = 24, MAX_H = 90;
  const U: [number, number] = [13, 3.5]; // one week step
  const V: [number, number] = [-6.5, 7]; // one day step
  const K = 0.86; // cell size within its slot (leaves gaps)
  const weeks = s.weeks.length;
  const max = Math.max(1, ...s.weeks.flat().map((d) => d.count));

  const spanX = (weeks - 1) * U[0] + U[0] + 6 * Math.abs(V[0]);
  const ox = (W - spanX) / 2 + 6 * Math.abs(V[0]);
  const oy = 64 + MAX_H;
  const H = Math.ceil(oy + (weeks - 1) * U[1] + 6 * V[1] + V[1] + P);

  const out: string[] = [];
  for (const [wi, week] of s.weeks.entries()) {
    for (const d of week) {
      const px = ox + wi * U[0] + d.weekday * V[0];
      const py = oy + wi * U[1] + d.weekday * V[1];
      const h = d.count > 0 ? 6 + Math.sqrt(d.count / max) * (MAX_H - 6) : 0;
      const A: [number, number] = [px, py - h];
      const B: [number, number] = [px + U[0] * K, py + U[1] * K - h];
      const C: [number, number] = [B[0] + V[0] * K, B[1] + V[1] * K];
      const D: [number, number] = [px + V[0] * K, py + V[1] * K - h];
      const col = c.cells[d.level];
      if (h > 0) {
        const down = (p: [number, number]): [number, number] => [p[0], p[1] + h];
        out.push(poly([D, C, down(C), down(D)], shade(col, 0.78)));
        out.push(poly([B, C, down(C), down(B)], shade(col, 0.6)));
      }
      out.push(`<g>${poly([A, B, C, D], col)}<title>${d.count} contributions on ${d.date}</title></g>`);
    }
  }

  const font = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${font}" role="img" aria-label="Contributions in the last year, 3D view">
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="${c.bg}" stroke="${c.border}"/>
<text x="${P}" y="38" font-size="16" font-weight="700" fill="${c.text}">Contributions</text>
<text x="${W - P}" y="38" font-size="13" text-anchor="end" fill="${c.sub}">${periodLabel(s.weeks)} · ${s.totalContributions.toLocaleString("en-US")} contributions</text>
${out.join("\n")}
</svg>
`;
}
