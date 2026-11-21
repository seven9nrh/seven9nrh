# GitHub Profile Generator Requirements

## Purpose
Generate `README.md` of `seven9nrh/seven9nrh` from a template and live data, and keep it updated with GitHub Actions.

## Output
- `README.md` (English only) plus SVG assets under `assets/`.
- Every SVG is generated in light and dark themes and switched with `<picture>` (`prefers-color-scheme`).
- Sections, in order:

| Section | Content | Source |
|---|---|---|
| Hero | Banner: "HELLO, I'M", name (HNNR), title (System Architect), tagline (Owner of OoED), isometric bar decoration | `src/config.ts` |
| Skills | Icon row for "main" skills + chip card grouped by area; source link to oortedge.com/author | `src/config.ts` (static list, based on oortedge.com/author, 2026-11-21) |
| Contributions | 3D isometric bar graph of the last year, with period (e.g. "Nov 2025 – Nov 2026") and total | GitHub GraphQL |
| Favorite repositories | Cards for repos the user has starred, most-starred first, top 8, 2 columns | GitHub REST `/users/:user/starred` |

Removed by decision: GitHub stats tiles and language bar, own "Featured repositories", "Recent activity", "Articles", lowlighter/metrics (`metrics.yml` and its SVGs).

## Rules
- Skills: levels are main / hands-on / researched & written. Main = filled chip (+ icon from Simple Icons when available), hands-on = tinted chip, researched = dashed outline chip.
- Contributions: bar height = sqrt(count / max) scaled; color = GitHub contribution level. Period is taken from the first and last day of the calendar.
- Favorite repositories: starred repos (up to 500 fetched), sorted by star count desc, ties by name. Card shows owner, name, rank, description (2 lines), language color, stars (abbreviated, e.g. 500k).

## Architecture
- TypeScript (Node), tests with `node:test` via tsx.

| File | Role |
|---|---|
| `src/config.ts` | Name, title, tagline, limits, static skill list |
| `src/github.ts` | Starred repositories (REST) |
| `src/stats.ts` | Contribution calendar (GraphQL) and 3D graph SVG |
| `src/hero.ts` | Hero banner SVG |
| `src/skills.ts` | Skills chip card SVG |
| `src/cards.ts` | Repository card SVG, text wrapping |
| `src/render.ts` | README fragments, HTML escaping |
| `src/main.ts` | Fetch -> render SVGs and README from `README.template.md` -> write files |

- Token: `GITHUB_TOKEN` (GraphQL requires authentication).

## Workflow (`.github/workflows/profile.yml`)
- Triggers: `schedule` daily (00:30 UTC), `workflow_dispatch`, push to main on source changes. `concurrency` prevents overlapping runs.
- `generate` job: read-only token, `persist-credentials: false`, `npm ci --ignore-scripts`, typecheck, test, generate, upload README.md and assets as an artifact.
- `commit` job: write token, runs no npm code; replaces README.md and assets with the artifact and commits only when changed, with `[Skip GitHub Action]`.

## Security
- Actions are pinned to commit SHAs (tag noted in a comment).
- Third-party data in SVG and HTML is escaped; only `https:` URLs are linked.
- No runtime dependencies (`fast-xml-parser` is test-only).
