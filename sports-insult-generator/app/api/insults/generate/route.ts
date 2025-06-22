import { NextRequest, NextResponse } from 'next/server'
import { generateInsults } from '@/app/lib/openai'
import { fetchPlayerDetails, fetchPlayerNews, fetchTeamRoster, fetchTeams } from '@/app/lib/espn-api'
import redis, { CACHE_KEYS, CACHE_TTL } from '@/app/lib/redis'
import { getWeekId } from '@/app/lib/utils'
import { PlayerNews } from '@/app/types'

export async function POST(request: NextRequest) {
  try {
    const { playerId, teamId, sport = 'nfl' } = await request.json()

    if (!playerId || !teamId) {
      return NextResponse.json(
        { error: 'Player ID and Team ID are required' },
        { status: 400 }
      )
    }

    const weekId = getWeekId()
    const cacheKey = CACHE_KEYS.INSULTS(playerId, weekId)

    // Check if insult already exists for this player this week
    const cachedInsult = await redis.get(cacheKey)
    if (cachedInsult) {
      return NextResponse.json(cachedInsult)
    }

    // Fetch team roster to get basic player info
    const teamRoster = await fetchTeamRoster(sport, teamId)
    const player = teamRoster.find((p) => p.id === playerId)

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      )
    }

    // Fetch team info to get team name
    const teams = await fetchTeams(sport)
    const team = teams.find((t) => t.id === teamId)
    const teamName = team?.name || 'Unknown Team'

    // Fetch additional player details
    const playerDetails = await fetchPlayerDetails(sport, playerId)

    // Fetch player news using the player's name
    const playerNews = await fetchPlayerNews(player.name || '')

    // Generate the insults
    const insults = await generateInsults(
      player.name,
      { ...player.stats, ...playerDetails.stats },
      `${player.position} for team. ${playerDetails.bio || ''}`,
      playerNews.slice(0, 3).map((news: PlayerNews) => news.title)
    )

    // Select a random insult from the generated list
    const insultText = insults[Math.floor(Math.random() * insults.length)]

    // Create insult object
    const insult = {
      id: `${playerId}-${weekId}-${Date.now()}`,
      playerId,
      teamId,
      text: insultText,
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date().toISOString(),
      weekId,
      player: {
        name: player.name,
        position: player.position || 'Unknown',
        team: teamName
      }
    }

    // Cache the insult
    await redis.setex(cacheKey, CACHE_TTL.INSULTS, JSON.stringify(insult))

    // Also add to weekly insults list for cleanup
    const weeklyInsultsKey = `weekly_insults:${weekId}`
    await redis.sadd(weeklyInsultsKey, insult.id)
    await redis.expire(weeklyInsultsKey, CACHE_TTL.INSULTS)

    return NextResponse.json(insult)
  } catch (error) {
    console.error('Error generating insult:', error)
    return NextResponse.json(
      { error: 'Failed to generate insult' },
      { status: 500 }
    )
  }
}
