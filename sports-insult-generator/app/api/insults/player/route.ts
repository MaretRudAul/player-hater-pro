import { NextRequest, NextResponse } from 'next/server'
import redis from '../../../lib/redis'
import { getWeekId } from '../../../lib/utils'
import { Insult } from '../../../types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const playerId = searchParams.get('playerId')
  const clientId = searchParams.get('clientId')
  
  if (!playerId) {
    return NextResponse.json({ error: 'Player ID required' }, { status: 400 })
  }

  try {
    let playerInsultIds: string[] = []
    
    if (clientId) {
      // Get client-specific insults for this player
      playerInsultIds = await redis.lrange(`client_insults:${clientId}:${playerId}`, 0, -1)
    } else {
      // Fallback to weekly player insults if no clientId
      const weekId = getWeekId()
      playerInsultIds = await redis.smembers(`player_insults:${playerId}:${weekId}`)
    }
    
    const playerInsults: Insult[] = []

    for (const id of playerInsultIds) {
      const insultData = await redis.get(`insult:${id}`)
      if (insultData) {
        const insult: Insult = typeof insultData === 'string' ? JSON.parse(insultData) : insultData
        playerInsults.push(insult)
      }
    }

    // Sort by creation date (newest first)
    const sortedInsults = playerInsults.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return NextResponse.json(sortedInsults)
  } catch (error) {
    console.error('Player Insults API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch player insults' }, { status: 500 })
  }
}
