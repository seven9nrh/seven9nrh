import { config, type SkillGroup } from "./config.js";
import type { Repo } from "./github.js";

/** Escape text for an HTML attribute value or element body. */
export const escHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Only https URLs are linked; anything else (javascript:, data:, …) is rejected. */
export function safeUrl(url: string): string | null {
  try {
    return new URL(url).protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

/** Hero banner (SVG, light/dark). The alt text keeps the heading accessible. */
export function renderIntro(c: Pick<typeof config, "name" | "title" | "tagline">): string {
  return `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/hero-dark.svg">
  <img alt="${escHtml(`${c.name} — ${c.title}, ${c.tagline}`)}" src="assets/hero-light.svg" width="840">
</picture>`;
}

export function renderSkills(groups: SkillGroup[]): string {
  const icons = groups
    .flatMap((g) => g.skills)
    .filter((s) => s.level === "main" && s.icon)
    .map((s) => {
      const base = `https://cdn.simpleicons.org/${encodeURIComponent(s.icon ?? "")}`;
      const img = `<img src="${base}" alt="${escHtml(s.name)}" title="${escHtml(s.name)}" height="40" />`;
      return s.iconDark
        ? `<picture><source media="(prefers-color-scheme: dark)" srcset="${base}/${encodeURIComponent(s.iconDark)}">${img}</picture>`
        : img;
    })
    .join("&nbsp;&nbsp;");
  const chips = `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/skills-dark.svg">
  <img alt="${escHtml(`Skills by area: ${groups.map((g) => g.title).join(", ")}`)}" src="assets/skills-light.svg" width="840">
</picture>`;
  return `${icons}\n\n${chips}\n\n<sub>Source: [oortedge.com/author](https://www.oortedge.com/author)</sub>`;
}

/** Two-column grid of repository cards (SVG, light/dark), each linking to the repo. */
export function renderFavorites(repos: Repo[]): string {
  if (!repos.length) return "_No starred repositories yet._";
  const cols = 2;
  const cell = (r: Repo, i: number) => {
    const img = `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/repos/${i}-dark.svg"><img src="assets/repos/${i}-light.svg" width="100%" alt="${escHtml(r.full_name)}"></picture>`;
    const url = safeUrl(r.html_url);
    return `<td width="50%">${url ? `<a href="${escHtml(url)}">${img}</a>` : img}</td>`;
  };
  const rows: string[] = [];
  for (let i = 0; i < repos.length; i += cols) {
    rows.push(`<tr>${repos.slice(i, i + cols).map((r, j) => cell(r, i + j)).join("")}</tr>`);
  }
  return `<table>\n${rows.join("\n")}\n</table>`;
}


export function renderStats(): string {
  return `<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/stats-dark.svg">
  <img alt="Contributions in the last year (3D)" src="assets/stats-light.svg" width="840">
</picture>`;
}

export function fill(template: string, values: Record<string, string>): string {
  return template.replaceAll(/\{\{(\w+)\}\}/g, (_, k: string) => {
    const v = values[k];
    if (v === undefined) throw new Error(`Unknown placeholder: ${k}`);
    return v;
  });
}
