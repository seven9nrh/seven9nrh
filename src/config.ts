export type Level = "main" | "hands-on" | "researched";

export interface Skill {
  name: string;
  level: Level;
  /** simple-icons slug. Icons are shown only for "main" skills that have one. */
  icon?: string;
  /** Icon color (hex, no #) for dark mode, when the brand color is too dark to see. */
  iconDark?: string;
}

export interface SkillGroup {
  title: string;
  skills: Skill[];
}

export const config = {
  username: "seven9nrh",
  name: "HNNR",
  title: "System Architect",
  tagline: "Owner of OoED",
  limits: { favorites: 8 },
  // Source: https://www.oortedge.com/author (2026-11-21)
  skills: [
    {
      title: "Application development",
      skills: [
        { name: "Java", level: "main", icon: "openjdk", iconDark: "e6edf3" },
        { name: "Spring Boot", level: "main", icon: "springboot" },
        { name: "TypeScript", level: "main", icon: "typescript" },
        { name: "JavaScript", level: "main", icon: "javascript" },
        { name: "Go", level: "hands-on" },
        { name: "Python", level: "hands-on" },
        { name: "Agile", level: "hands-on" },
      ],
    },
    {
      title: "Architecture",
      skills: [
        { name: "Domain-Driven Design", level: "main" },
        { name: "Modular Monolith", level: "main" },
        { name: "Microservices", level: "main" },
        { name: "API design (REST/GraphQL/gRPC)", level: "main" },
      ],
    },
    {
      title: "Web",
      skills: [
        { name: "React", level: "main", icon: "react" },
        { name: "Next.js", level: "hands-on" },
        { name: "Web performance", level: "researched" },
      ],
    },
    {
      title: "AI-driven development",
      skills: [
        { name: "AI-driven development", level: "main" },
        { name: "Claude Code", level: "main", icon: "claude" },
        { name: "Spec-driven development", level: "hands-on" },
        { name: "Harness engineering", level: "hands-on" },
        { name: "Prompt engineering", level: "hands-on" },
      ],
    },
    {
      title: "AI engineering",
      skills: [
        { name: "MCP", level: "hands-on" },
        { name: "RAG", level: "researched" },
        { name: "LLM evaluation", level: "researched" },
      ],
    },
    {
      title: "Cloud / infra",
      skills: [
        { name: "CI/CD (GitHub Actions)", level: "main", icon: "githubactions" },
        { name: "AWS", level: "hands-on" },
        { name: "Kubernetes", level: "researched" },
      ],
    },
  ] satisfies SkillGroup[],
};
