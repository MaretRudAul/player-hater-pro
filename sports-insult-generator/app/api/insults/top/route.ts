import { NextRequest, NextResponse } from 'next/server'
import redis from '../../../lib/redis'
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
    const result: Insult[] = []

    // Get all insults from this week
    const allInsultIds = await redis.lrange(`global_insults:${weekId}`, 0, -1)
    const allInsults: Insult[] = []

    for (const id of allInsultIds) {
      const insultData = await redis.get(`insult:${id}`)
      if (insultData) {
        const insult: Insult = typeof insultData === 'string' ? JSON.parse(insultData) : insultData
        allInsults.push(insult)
      }
    }

    // Get top 3 roasts by (upvotes - downvotes) across all players
    const topRoasts = allInsults
      .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
      .slice(0, 3)

    result.push(...topRoasts)

    // Get 2 most recent roasts (regardless of votes)
    const recentRoasts = allInsults
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2)

    result.push(...recentRoasts)

    // Remove duplicates while preserving order
    const seen = new Set()
    const uniqueResult = result.filter(insult => {
      if (seen.has(insult.id)) {
        return false
      }
      seen.add(insult.id)
      return true
    })

    return NextResponse.json(uniqueResult)
  } catch (error) {
    console.error('Top Insults API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch top insults' }, { status: 500 })
  }
}
