import { NextRequest, NextResponse } from 'next/server'
// import redis, { CACHE_KEYS, CACHE_TTL } from '../../../lib/redis'
import { fetchTeamRoster } from '../../../lib/espn-api'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') || 'nfl'
  const { teamId } = await params

  try {
    // TEMPORARILY BYPASS CACHE FOR DEBUGGING
    // const cached = await redis.get(CACHE_KEYS.PLAYERS(teamId))
    // if (cached) {
    //   return NextResponse.json(cached)
    // }

    // Fetch from ESPN API
    const players = await fetchTeamRoster(sport, teamId)
    
    // Cache the results (temporarily disabled)
    // await redis.setex(CACHE_KEYS.PLAYERS(teamId), CACHE_TTL.PLAYERS, JSON.stringify(players))
    
    return NextResponse.json(players)
  } catch (error) {
    console.error('Players API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
  }
}
