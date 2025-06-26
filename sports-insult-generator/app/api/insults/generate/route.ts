import { NextRequest, NextResponse } from 'next/server'
import { generateInsults } from '@/app/lib/openai'
import { fetchPlayerDetails, fetchPlayerNews, fetchTeamRoster, fetchTeams } from '@/app/lib/espn-api'
import redis, { CACHE_TTL } from '@/app/lib/redis'
import { getWeekId } from '@/app/lib/utils'
import { PlayerNews } from '@/app/types'

export async function POST(request: NextRequest) {
  try {
    const { playerId, teamId, sport = 'nfl', clientId } = await request.json()

    if (!playerId || !teamId) {
      return NextResponse.json(
        { error: 'Player ID and Team ID are required' },
        { status: 400 }
      )
    }

    const weekId = getWeekId()

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

    // Create insult object with unique ID
    const insult = {
      id: `${playerId}-${weekId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
        team: teamName,
        jerseyNumber: player.jerseyNumber || 0
      }
    }

    // Store individual insult
    await redis.setex(`insult:${insult.id}`, CACHE_TTL.INSULTS, JSON.stringify(insult))

    // Add to player's insults list
    const playerInsultsKey = `player_insults:${playerId}:${weekId}`
    await redis.sadd(playerInsultsKey, insult.id)
    await redis.expire(playerInsultsKey, CACHE_TTL.INSULTS)

    // Add to client-specific insults list if clientId provided
    if (clientId) {
      const clientInsultsKey = `client_insults:${clientId}:${playerId}`
      await redis.lpush(clientInsultsKey, insult.id)
      await redis.expire(clientInsultsKey, CACHE_TTL.INSULTS)
    }

    // Add to global insults list for recent roasts
    const globalInsultsKey = `global_insults:${weekId}`
    await redis.lpush(globalInsultsKey, insult.id)
    await redis.expire(globalInsultsKey, CACHE_TTL.INSULTS)

    return NextResponse.json(insult)
  } catch (error) {
    console.error('Error generating insult:', error)
    return NextResponse.json(
      { error: 'Failed to generate insult' },
      { status: 500 }
    )
  }
}
