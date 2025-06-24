import axios from 'axios'
import { Team, Player, PlayerNews } from '../types'

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports'

export const fetchTeams = async (sport: string): Promise<Team[]> => {
  try {
    const response = await axios.get(`${ESPN_BASE_URL}/${sport}/teams`)
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
    const response = await axios.get(`${ESPN_BASE_URL}/${sport}/teams/${teamId}/roster`)
    return response.data.athletes.map((athlete: any) => ({
      id: athlete.id,
      name: athlete.displayName,
      jerseyNumber: parseInt(athlete.jersey) || 0,
      position: athlete.position?.abbreviation || 'N/A',
      teamId,
      stats: athlete.statistics || {},
      college: athlete.college?.name,
      age: athlete.age,
    }))
  } catch (error) {
    console.error(`Error fetching roster for team ${teamId}:`, error)
    return []
  }
}

export const fetchPlayerDetails = async (sport: string, playerId: string): Promise<Partial<Player>> => {
  try {
    const response = await axios.get(`${ESPN_BASE_URL}/${sport}/athletes/${playerId}`)
    const athlete = response.data.athlete
    
    return {
      bio: athlete.bio,
      hometown: athlete.birthPlace?.displayText,
      college: athlete.college?.name,
      stats: athlete.statistics || {},
    }
  } catch (error) {
    console.error(`Error fetching player details for ${playerId}:`, error)
    return {}
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
