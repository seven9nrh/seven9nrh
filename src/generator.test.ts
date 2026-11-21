import assert from "node:assert/strict";
import { test } from "node:test";
import { XMLValidator } from "fast-xml-parser";
import { languageColor, renderRepoCard, wrapText } from "./cards.js";
import { config } from "./config.js";
import { topByStars, type Repo } from "./github.js";
import { renderHeroSvg } from "./hero.js";
import { renderSkillsSvg } from "./skills.js";
import { escHtml, fill, renderFavorites, renderSkills, safeUrl } from "./render.js";
import { parseStats, periodLabel, renderStatsSvg, shade } from "./stats.js";

const repo = (o: Partial<Repo>): Repo => ({
  name: "x", full_name: "u/x", html_url: "", description: null, stargazers_count: 0, language: null, ...o,
});

test("favorites: sorted by stars desc, ties by name, limited", () => {
  const r = topByStars(
    [repo({ full_name: "u/b", stargazers_count: 5 }), repo({ full_name: "u/a", stargazers_count: 5 }), repo({ full_name: "u/c", stargazers_count: 9 }), repo({ full_name: "u/d", stargazers_count: 1 })],
    3,
  );
  assert.deepEqual(r.map((x) => x.full_name), ["u/c", "u/a", "u/b"]);
});

test("repo cards: valid svg in both themes, escapes text, grid links every repo", () => {
  const r = repo({ full_name: "o/n&m", description: "a|b <x> ".repeat(30), language: "TypeScript", stargazers_count: 123456, html_url: "https://github.com/o/r" });
  for (const t of ["light", "dark"] as const) {
    const svg = renderRepoCard(r, 1, t);
    assert.equal(XMLValidator.validate(svg), true);
    assert.match(svg, /123k/);
  }
  assert.equal((renderFavorites([r, r, r]).match(/<a href/g) ?? []).length, 3);
  assert.equal(languageColor("Nope"), "#8b949e");
});


test("html: attributes are escaped and only https links are emitted", () => {
  assert.equal(escHtml(`a"b'<c>&`), "a&quot;b&#39;&lt;c&gt;&amp;");
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("http://x"), null);
  assert.equal(safeUrl("https://github.com/a/b"), "https://github.com/a/b");
  const out = renderFavorites([
    repo({ full_name: `o/"><x`, html_url: "javascript:alert(1)" }),
    repo({ full_name: "o/ok", html_url: `https://github.com/o/ok?"` }),
  ]);
  assert.doesNotMatch(out, /javascript:/);
  assert.doesNotMatch(out, /"><x/);
  assert.match(out, /href="https:\/\/github\.com\/o\/ok\?&quot;"/);
});

test("fill: replaces placeholders and rejects unknown ones", () => {
  assert.equal(fill("a {{x}}", { x: "1" }), "a 1");
  assert.throws(() => fill("{{y}}", {}));
});

test("skills: icons only for main skills", () => {
  const out = renderSkills(config.skills);
  assert.match(out, /simpleicons\.org\/typescript/);
  assert.doesNotMatch(out, /alt="Go"/);
});

test("3D graph: valid svg for both themes", () => {
  const day = (n: number, weekday: number) => ({
    contributionDays: [{ date: `2026-01-0${weekday + 1}`, contributionCount: n, contributionLevel: n ? "FOURTH_QUARTILE" : "NONE", weekday }],
  });
  const s = parseStats({ contributionsCollection: { contributionCalendar: { totalContributions: 12, weeks: [day(2, 0), day(10, 1), day(0, 2)] } } });
  for (const t of ["light", "dark"] as const) {
    const svg = renderStatsSvg(s, t);
    assert.equal(XMLValidator.validate(svg), true);
    assert.match(svg, /<polygon/);
    assert.match(svg, /Jan 2026 – Jan 2026 · 12 contributions/);
  }
  assert.equal(
    periodLabel([[{ date: "2025-11-23", count: 0, level: 0, weekday: 0 }], [{ date: "2026-11-21", count: 0, level: 0, weekday: 6 }]]),
    "Nov 2025 – Nov 2026",
  );
});

test("skills svg: valid, all skills present, long names stay inside the card", () => {
  for (const t of ["light", "dark"] as const) {
    const svg = renderSkillsSvg(config.skills, t);
    assert.equal(XMLValidator.validate(svg), true);
    for (const g of config.skills) for (const s of g.skills) assert.ok(svg.includes(s.name.replace("&", "&amp;")), s.name);
    for (const m of svg.matchAll(/<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)" height="28"/g)) {
      assert.ok(Number(m[1]) + Number(m[2]) <= 840 - 24, `chip overflows: ${m[0]}`);
    }
  }
});

test("hero: valid svg in both themes, escapes text", () => {
  for (const t of ["light", "dark"] as const) {
    const svg = renderHeroSvg({ name: "A&B", title: "System Architect", tagline: "Owner of <X>" }, t);
    assert.equal(XMLValidator.validate(svg), true);
    assert.match(svg, /A&amp;B/);
  }
});

test("shade darkens and clamps", () => {
  assert.equal(shade("#ffffff", 0.5), "#808080");
  assert.equal(shade("#000000", 0.5), "#000000");
});

test("cards: title split, wrapping and truncation", () => {
  const lines = wrapText("あ".repeat(100), 10, 3);
  assert.equal(lines.length, 3);
  assert.ok(lines[2]?.endsWith("…"));
  assert.deepEqual(wrapText("short", 10, 3), ["short"]);
});

