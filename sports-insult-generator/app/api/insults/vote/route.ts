import { NextRequest, NextResponse } from 'next/server'
import redis, { CACHE_KEYS } from '../../../lib/redis'
import { Insult } from '../../../types'

export async function POST(request: NextRequest) {
  try {
    const { insultId, voteType, playerId, weekId } = await request.json()

    // Get current insults
    const insults = await redis.get(CACHE_KEYS.INSULTS(playerId, weekId))
    if (!insults) {
      return NextResponse.json({ error: 'Insults not found' }, { status: 404 })
    }

    const insultsArray: Insult[] = JSON.parse(insults as string)
    const insultIndex = insultsArray.findIndex((i: Insult) => i.id === insultId)
    
    if (insultIndex === -1) {
      return NextResponse.json({ error: 'Insult not found' }, { status: 404 })
    }

    // Update vote count
    if (voteType === 'upvote') {
      insultsArray[insultIndex].upvotes += 1
    } else if (voteType === 'downvote') {
      insultsArray[insultIndex].downvotes += 1
    }

    // Save back to cache
    await redis.set(CACHE_KEYS.INSULTS(playerId, weekId), JSON.stringify(insultsArray))

    // Update top insults ranking
    await updateTopInsults(playerId, weekId, insultsArray)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Vote API Error:', error)
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 })
  }
}

async function updateTopInsults(playerId: string, weekId: string, insults: Insult[]) {
  const topInsults = insults
    .sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes))
    .slice(0, 5)

  await redis.set(CACHE_KEYS.TOP_INSULTS(playerId, weekId), JSON.stringify(topInsults))
}
