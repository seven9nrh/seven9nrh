import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { renderRepoCard } from "./cards.js";
import { config } from "./config.js";
import { fetchFavoriteRepos } from "./github.js";
import { renderHeroSvg } from "./hero.js";
import { renderSkillsSvg } from "./skills.js";
import { fill, renderFavorites, renderIntro, renderSkills, renderStats } from "./render.js";
import { fetchStats, renderStatsSvg } from "./stats.js";

const token = process.env["GITHUB_TOKEN"];
const { username, limits } = config;
if (!token) throw new Error("GITHUB_TOKEN is required (GraphQL API needs authentication)");

const [favorites, stats, template] = await Promise.all([
  fetchFavoriteRepos(username, limits.favorites, token),
  fetchStats(username, token),
  readFile("README.template.md", "utf8"),
]);

await mkdir("assets", { recursive: true });
await writeFile("assets/stats-light.svg", renderStatsSvg(stats, "light"), "utf8");
await writeFile("assets/stats-dark.svg", renderStatsSvg(stats, "dark"), "utf8");


await writeFile("assets/skills-light.svg", renderSkillsSvg(config.skills, "light"), "utf8");
await writeFile("assets/skills-dark.svg", renderSkillsSvg(config.skills, "dark"), "utf8");
await writeFile("assets/hero-light.svg", renderHeroSvg(config, "light"), "utf8");
await writeFile("assets/hero-dark.svg", renderHeroSvg(config, "dark"), "utf8");

await rm("assets/repos", { recursive: true, force: true });
await mkdir("assets/repos", { recursive: true });
for (const [i, r] of favorites.entries()) {
  for (const theme of ["light", "dark"] as const) {
    await writeFile(`assets/repos/${i}-${theme}.svg`, renderRepoCard(r, i + 1, theme), "utf8");
  }
}

const readme = fill(template, {
  intro: renderIntro(config),
  skills: renderSkills(config.skills),
  stats: renderStats(),
  favorites: renderFavorites(favorites),
});

await writeFile("README.md", readme.trimEnd() + "\n", "utf8");
console.log(`README.md generated: ${favorites.length} favorites`);
