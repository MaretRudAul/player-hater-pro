import axios from 'axios'
import { Team, Player, PlayerNews } from '../types'

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports'

// Map sport abbreviations to ESPN API sport categories
const SPORT_MAPPING: Record<string, string> = {
  'nfl': 'football/nfl',
  'nba': 'basketball/nba',
  'mlb': 'baseball/mlb',
  'nhl': 'hockey/nhl'
}

export const fetchTeams = async (sport: string): Promise<Team[]> => {
  try {
    const sportPath = SPORT_MAPPING[sport] || sport
    const url = `${ESPN_BASE_URL}/${sportPath}/teams`
    
    const response = await axios.get(url)
    return response.data.sports[0].leagues[0].teams.map((team: any) => ({
      id: team.team.id,
      name: team.team.displayName,
      abbreviation: team.team.abbreviation,
      logo: team.team.logos[0]?.href || '',
      sport: sport as any,
    }))
  } catch (error) {
    console.error(`Error fetching ${sport} teams:`, error)
    return []
  }
}

export const fetchTeamRoster = async (sport: string, teamId: string): Promise<Player[]> => {
  try {
    const sportPath = SPORT_MAPPING[sport] || sport
    const response = await axios.get(`${ESPN_BASE_URL}/${sportPath}/teams/${teamId}/roster`)
    
    // Handle the nested structure where athletes are grouped by position type
    const athleteGroups = response.data?.athletes || []
    const allPlayers: Player[] = []
    
    // Iterate through each position group (offense, defense, specialTeam, etc.)
    for (const group of athleteGroups) {
      const players = group.items || []
      
      // Map each player in the current group
      const groupPlayers = players.map((athlete: any) => ({
        id: athlete.id,
        name: athlete.displayName || athlete.fullName || athlete.name,
        jerseyNumber: parseInt(athlete.jersey) || 0,
        position: athlete.position?.abbreviation || athlete.position?.name || 'N/A',
        teamId,
        stats: (athlete.statistics || {}) as Record<string, string | number | boolean | null>,
        college: athlete.college?.name,
        age: athlete.age,
      }))
      
      allPlayers.push(...groupPlayers)
    }
    
    return allPlayers
  } catch (error) {
    console.error(`Error fetching roster for team ${teamId}:`, error)
    return []
  }
}

export const fetchPlayerDetails = async (sport: string, playerId: string): Promise<Partial<Player>> => {
  try {
    const sportPath = SPORT_MAPPING[sport] || sport
    const response = await axios.get(`${ESPN_BASE_URL}/${sportPath}/athletes/${playerId}`)
    const athlete = response.data.athlete
    
    return {
      bio: athlete?.bio || '',
      hometown: athlete?.birthPlace?.displayText || '',
      college: athlete?.college?.name || '',
      stats: athlete?.statistics || {},
    }
  } catch (error) {
    // Handle 404 errors gracefully - player may not have detailed profile
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.warn(`Player details not found for ${playerId} - this is normal for some players`)
      return {
        bio: '',
        hometown: '',
        college: '',
        stats: {},
      }
    }
    
    console.error(`Error fetching player details for ${playerId}:`, error)
    return {
      bio: '',
      hometown: '',
      college: '',
      stats: {},
    }
  }
}

export const fetchPlayerNews = async (playerName: string): Promise<PlayerNews[]> => {
  try {
    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: playerName,
        sortBy: 'publishedAt',
        pageSize: 5,
        apiKey: process.env.NEWS_API_KEY,
      },
    })

    return response.data.articles.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      publishedAt: article.publishedAt,
      source: article.source.name,
    }))
  } catch (error) {
    console.error(`Error fetching news for ${playerName}:`, error)
    return []
  }
}
