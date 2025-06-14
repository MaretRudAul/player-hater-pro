import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const CACHE_KEYS = {
  TEAMS: (sport: string) => `teams:${sport}`,
  PLAYERS: (teamId: string) => `players:${teamId}`,
  PLAYER_DETAILS: (playerId: string) => `player:${playerId}`,
  INSULTS: (playerId: string, weekId: string) => `insults:${playerId}:${weekId}`,
  TOP_INSULTS: (playerId: string, weekId: string) => `top_insults:${playerId}:${weekId}`,
  PLAYER_NEWS: (playerId: string) => `news:${playerId}`,
}

export const CACHE_TTL = {
  TEAMS: 86400, // 24 hours
  PLAYERS: 3600, // 1 hour
  PLAYER_DETAILS: 1800, // 30 minutes
  INSULTS: 604800, // 1 week
  NEWS: 1800, // 30 minutes
}

export default redis
