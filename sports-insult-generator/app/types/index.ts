export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  sport: 'nfl' | 'nba' | 'mlb' | 'nhl';
}

export interface Player {
  id: string;
  name: string;
  jerseyNumber: number;
  position: string;
  teamId: string;
  stats: Record<string, string | number | boolean | null>;
  college?: string;
  hometown?: string;
  age: number;
  bio?: string;
}

export interface Insult {
  id: string;
  playerId: string;
  text: string;
  upvotes: number;
  downvotes: number;
  createdAt: string;
  weekId: string; // Format: YYYY-WW
}

export interface PlayerNews {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
}
