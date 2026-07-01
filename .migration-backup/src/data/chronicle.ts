export type ArticleStatus = "draft" | "published" | "scheduled" | "trash";

export type Author = {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl: string;
  email: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
};

export type GalleryImage = { url: string; alt: string; caption: string };
export type Embed = { type: "youtube" | "tweet"; url: string; title: string };

export type Article = {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  coverAlt: string;
  coverCaption: string;
  category: Category;
  author: Author;
  status: ArticleStatus;
  featured: boolean;
  breaking: boolean;
  pinned: boolean;
  tags: string[];
  readingMinutes: number;
  views: number;
  publishedAt: string;
  updatedAt: string;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  canonicalUrl: string;
  galleries: GalleryImage[];
  embeds: Embed[];
  versions: Array<{ savedAt: string; title: string; content: string }>;
};

export const categories: Category[] = [
  { id: "politics", name: "Politics", slug: "politics", description: "Power, policy, elections, and civic life.", color: "#9f3a38" },
  { id: "technology", name: "Technology", slug: "technology", description: "Platforms, AI, devices, security, and internet culture.", color: "#2f6f73" },
  { id: "sports", name: "Sports", slug: "sports", description: "Competition, money, performance, and the people inside the arena.", color: "#9a6b22" },
  { id: "entertainment", name: "Entertainment", slug: "entertainment", description: "Film, television, streaming, music, and celebrity business.", color: "#8f4b6b" },
  { id: "science", name: "Science", slug: "science", description: "Research, climate, space, medicine, and discovery.", color: "#3f6f56" },
  { id: "business", name: "Business", slug: "business", description: "Markets, companies, labor, and the global economy.", color: "#675a2f" },
  { id: "gaming", name: "Gaming", slug: "gaming", description: "Studios, platforms, esports, hardware, and player culture.", color: "#5b5792" },
  { id: "lifestyle", name: "Lifestyle", slug: "lifestyle", description: "Design, travel, food, wellness, style, and modern routines.", color: "#86634e" },
  { id: "health", name: "Health", slug: "health", description: "Public health, care systems, research, and everyday wellbeing.", color: "#42705e" },
  { id: "world", name: "World", slug: "world", description: "Global affairs reported with context and restraint.", color: "#526e8f" },
  { id: "education", name: "Education", slug: "education", description: "Schools, universities, learning technology, and policy.", color: "#7f6535" },
];

export const authors: Author[] = [
  {
    id: "mara-velasquez",
    name: "Mara Velasquez",
    role: "Senior Correspondent",
    bio: "Reports on institutions, technology, and the way systems behave under pressure.",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80",
    email: "mara@chronicle.news",
  },
  {
    id: "eli-tan",
    name: "Eli Tan",
    role: "Markets Editor",
    bio: "Covers boardrooms, supply chains, and the numbers behind public narratives.",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80",
    email: "eli@chronicle.news",
  },
  {
    id: "nadia-cross",
    name: "Nadia Cross",
    role: "Features Director",
    bio: "Builds visual narratives across culture, health, design, and cities.",
    avatarUrl: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=240&q=80",
    email: "nadia@chronicle.news",
  },
];

const body = (topic: string) => `## What changed
${topic} moved from a specialized concern into a public test of competence. The important shift is not a single announcement, but the accumulation of decisions now visible to households, investors, and local officials.

The Chronicle reviewed public documents, analyst notes, and interviews with people close to the work. The pattern is consistent: institutions are trying to move faster without losing the trust that lets them operate.

> Speed is useful only when the reader can still see how the facts were assembled.

## Why it matters
The consequences are practical. Budgets change. Workflows change. Consumers adjust. Smaller organizations that once waited for standards from larger peers are now making their own calls, often with limited information.

\`\`\`ts
const publicTrust = accuracy * transparency - avoidableDelay;
\`\`\`

## What comes next
Expect more measurement, more disclosure, and more fights over who gets to define success. The next phase is less about spectacle and more about verification, durability, and execution.`;

const image = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=82`;

export const seedArticles: Article[] = [
  {
    id: "1",
    title: "Inside the Race to Rebuild Public Trust at Machine Speed",
    subtitle: "Newsrooms, agencies, and technology companies are learning that faster systems only work when accountability moves just as quickly.",
    slug: "race-to-rebuild-public-trust-machine-speed",
    excerpt: "A new operating model is emerging for institutions that need speed without sacrificing credibility.",
    content: body("Institutional trust"),
    coverImage: image("photo-1495020689067-958852a7765e"),
    coverAlt: "Stacks of newspapers under morning light",
    coverCaption: "Credibility now depends on both publication speed and transparent sourcing.",
    category: categories[1],
    author: authors[0],
    status: "published",
    featured: true,
    breaking: true,
    pinned: true,
    tags: ["Trust", "AI", "Media"],
    readingMinutes: 7,
    views: 48216,
    publishedAt: "2026-06-25T08:15:00.000Z",
    updatedAt: "2026-06-25T10:42:00.000Z",
    metaTitle: "Inside the Race to Rebuild Public Trust at Machine Speed",
    metaDescription: "A Chronicle feature on speed, credibility, and institutional trust.",
    ogImage: image("photo-1495020689067-958852a7765e"),
    canonicalUrl: "/article/race-to-rebuild-public-trust-machine-speed",
    galleries: [
      { url: image("photo-1500530855697-b586d89ba3ee"), alt: "City skyline at dawn", caption: "Morning briefings increasingly combine data, verification, and visual reporting." },
      { url: image("photo-1516321318423-f06f85e504b3"), alt: "Laptop with analytics dashboard", caption: "Editors are watching trust signals as closely as traffic." },
    ],
    embeds: [{ type: "youtube", url: "https://www.youtube.com/embed/dQw4w9WgXcQ", title: "Editorial systems briefing" }],
    versions: [],
  },
  ...categories.slice(0, 11).map((category, index) => ({
    id: String(index + 2),
    title: [
      "Capitol Negotiators Turn to Smaller Deals as Deadline Pressure Builds",
      "Chip Buyers Rewrite Their Playbooks After a Volatile Quarter",
      "A Quiet Sports Science Revolution Is Changing Recovery Rooms",
      "Studios Bet on Fewer Premieres and Longer Cultural Tails",
      "Ocean Sensors Are Finding Climate Signals Months Earlier",
      "Shipping Executives Brace for a Patchwork Recovery",
      "Independent Game Studios Find Leverage in Subscription Fatigue",
      "A New Class of Hotels Designs for Work, Sleep, and Silence",
      "Hospitals Test Faster Triage Without Losing the Human Check",
      "Regional Diplomats Seek Practical Wins Before a Larger Summit",
      "Universities Reconsider the Lecture for an AI-Heavy Semester",
    ][index],
    subtitle: "A concise Chronicle briefing with the context readers need before the next update lands.",
    slug: [
      "capitol-negotiators-smaller-deals",
      "chip-buyers-rewrite-playbooks",
      "sports-science-recovery-rooms",
      "studios-fewer-premieres-longer-tails",
      "ocean-sensors-climate-signals",
      "shipping-executives-patchwork-recovery",
      "game-studios-subscription-fatigue",
      "hotels-work-sleep-silence",
      "hospitals-faster-triage-human-check",
      "regional-diplomats-practical-wins",
      "universities-reconsider-lecture-ai-semester",
    ][index],
    excerpt: `The latest ${category.name.toLowerCase()} story explains the pressure points, winners, and unanswered questions.`,
    content: body(category.name),
    coverImage: image([
      "photo-1529107386315-e1a2ed48a620",
      "photo-1518770660439-4636190af475",
      "photo-1517649763962-0c623066013b",
      "photo-1485846234645-a62644f84728",
      "photo-1446776811953-b23d57bd21aa",
      "photo-1494412651409-8963ce7935a7",
      "photo-1550745165-9bc0b252726f",
      "photo-1500530855697-b586d89ba3ee",
      "photo-1505751172876-fa1923c5c528",
      "photo-1521295121783-8a321d551ad2",
      "photo-1523240795612-9a054b0db644",
    ][index]),
    coverAlt: `${category.name} reporting image`,
    coverCaption: "Chronicle photography pairs context with atmosphere without obscuring the subject.",
    category,
    author: authors[index % authors.length],
    status: "published" as ArticleStatus,
    featured: index === 1 || index === 4,
    breaking: index === 0 || index === 5,
    pinned: index === 2,
    tags: [category.name, "Briefing", index % 2 ? "Analysis" : "Dispatch"],
    readingMinutes: 4 + (index % 5),
    views: 8170 + index * 2317,
    publishedAt: new Date(Date.UTC(2026, 5, 24 - index, 9 + index, 10)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 5, 25 - index, 10 + index, 22)).toISOString(),
    metaTitle: `${category.name} briefing from Chronicle`,
    metaDescription: `Independent ${category.name.toLowerCase()} reporting from Chronicle.`,
    ogImage: image("photo-1504711434969-e33886168f5c"),
    canonicalUrl: `/article/${[
      "capitol-negotiators-smaller-deals",
      "chip-buyers-rewrite-playbooks",
      "sports-science-recovery-rooms",
      "studios-fewer-premieres-longer-tails",
      "ocean-sensors-climate-signals",
      "shipping-executives-patchwork-recovery",
      "game-studios-subscription-fatigue",
      "hotels-work-sleep-silence",
      "hospitals-faster-triage-human-check",
      "regional-diplomats-practical-wins",
      "universities-reconsider-lecture-ai-semester",
    ][index]}`,
    galleries: [],
    embeds: index === 3 ? [{ type: "tweet" as const, url: "https://twitter.com/chronicle/status/1800000000000000000", title: "Reporter thread" }] : [],
    versions: [],
  })),
];

export const popularSearches = ["AI regulation", "markets", "public health", "climate", "gaming layoffs", "elections"];
