import { NextRequest, NextResponse } from 'next/server'
import redis, { CACHE_KEYS, CACHE_TTL } from '../../lib/redis'
import { fetchTeams } from '../../lib/espn-api'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') || 'nfl'

  try {
    // TEMPORARILY BYPASS CACHE FOR DEBUGGING
    // const cached = await redis.get(CACHE_KEYS.TEAMS(sport))
    // if (cached) {
    //   return NextResponse.json(JSON.parse(cached))
    // }

    // Fetch from ESPN API
    const teams = await fetchTeams(sport)
    
    // Cache the results (temporarily disabled)
    // await redis.setex(CACHE_KEYS.TEAMS(sport), CACHE_TTL.TEAMS, JSON.stringify(teams))
    
    return NextResponse.json(teams)
  } catch (error) {
    console.error('Teams API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}
