export interface Repo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  language: string | null;
}

/** Sort by stars (desc), then name, and keep the top `limit`. */
export function topByStars(repos: Repo[], limit: number): Repo[] {
  return [...repos]
    .sort((a, b) => b.stargazers_count - a.stargazers_count || a.full_name.localeCompare(b.full_name))
    .slice(0, limit);
}

/** Repositories the user has starred, most-starred first. */
export async function fetchFavoriteRepos(username: string, limit: number, token?: string): Promise<Repo[]> {
  const all: Repo[] = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(`https://api.github.com/users/${username}/starred?per_page=100&page=${page}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "profile-generator",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!res.ok) throw new Error(`GitHub API starred: ${res.status}`);
    const batch = (await res.json()) as Repo[];
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return topByStars(all, limit);
}
