import { NextRequest, NextResponse } from 'next/server'
import redis, { CACHE_KEYS } from '../../../lib/redis'
import { getWeekId } from '../../../lib/utils'
import { Insult } from '../../../types'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const playerId = searchParams.get('playerId')
  
  if (!playerId) {
    return NextResponse.json({ error: 'Player ID required' }, { status: 400 })
  }

  try {
    const weekId = getWeekId()
    const topInsults = await redis.get(CACHE_KEYS.TOP_INSULTS(playerId, weekId))
    
    if (!topInsults) {
      // If no top insults, get regular insults and sort them
      const regularInsults = await redis.get(CACHE_KEYS.INSULTS(playerId, weekId))
      if (regularInsults) {
        const insults: Insult[] = JSON.parse(regularInsults as string)
        const sorted = insults
          .sort((a: Insult, b: Insult) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
          .slice(0, 5)
        
        await redis.set(CACHE_KEYS.TOP_INSULTS(playerId, weekId), JSON.stringify(sorted))
        return NextResponse.json(sorted)
      }
      return NextResponse.json([])
    }

    return NextResponse.json(JSON.parse(topInsults as string))
  } catch (error) {
    console.error('Top Insults API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch top insults' }, { status: 500 })
  }
}
