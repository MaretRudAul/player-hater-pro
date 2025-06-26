import { NextRequest, NextResponse } from 'next/server'
import redis from '../../../lib/redis'
import { Insult } from '../../../types'

export async function POST(request: NextRequest) {
  try {
    const { insultId, voteType, clientId } = await request.json()

    if (!insultId || !voteType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Optional: Check for duplicate votes from same client (if clientId provided)
    if (clientId) {
      const voteKey = `vote:${clientId}:${insultId}`
      const existingVote = await redis.get(voteKey)
      if (existingVote) {
        return NextResponse.json({ error: 'Already voted on this insult' }, { status: 409 })
      }
    }

    // Get the insult
    const insultData = await redis.get(`insult:${insultId}`)
    if (!insultData) {
      return NextResponse.json({ error: 'Insult not found' }, { status: 404 })
    }

    const insult: Insult = typeof insultData === 'string' ? JSON.parse(insultData) : insultData

    // Update vote count
    if (voteType === 'upvote') {
      insult.upvotes += 1
    } else if (voteType === 'downvote') {
      insult.downvotes += 1
    } else {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 })
    }

    // Save updated insult
    await redis.set(`insult:${insultId}`, JSON.stringify(insult))

    // Record the vote to prevent duplicates (if clientId provided)
    if (clientId) {
      const voteKey = `vote:${clientId}:${insultId}`
      await redis.setex(voteKey, 604800, voteType) // 1 week expiry
    }

    return NextResponse.json({ 
      success: true, 
      upvotes: insult.upvotes, 
      downvotes: insult.downvotes 
    })
  } catch (error) {
    console.error('Vote API Error:', error)
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 })
  }
}
