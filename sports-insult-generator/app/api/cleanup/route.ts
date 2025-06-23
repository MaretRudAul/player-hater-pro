import { NextResponse } from 'next/server'
import redis from '../../lib/redis'

export async function POST() {
  try {
    // This should be called by a cron job or scheduled function
    const keys = await redis.keys('insults:*')
    const currentWeek = getWeekId()
    const oneWeekAgo = getPreviousWeekId()

    let deletedCount = 0
    
    for (const key of keys) {
      // Extract week ID from key pattern: insults:playerId:weekId
      const weekId = key.split(':')[2]
      if (weekId && weekId !== currentWeek && weekId !== oneWeekAgo) {
        await redis.del(key)
        deletedCount++
      }
    }

    // Also clean up top insults
    const topKeys = await redis.keys('top_insults:*')
    for (const key of topKeys) {
      const weekId = key.split(':')[2]
      if (weekId && weekId !== currentWeek && weekId !== oneWeekAgo) {
        await redis.del(key)
      }
    }

    return NextResponse.json({ deletedCount, message: 'Cleanup completed' })
  } catch (error) {
    console.error('Cleanup API Error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}

function getWeekId(): string {
  const now = new Date()
  const year = now.getFullYear()
  const week = getWeekNumber(now)
  return `${year}-${week.toString().padStart(2, '0')}`
}

function getPreviousWeekId(): string {
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const year = oneWeekAgo.getFullYear()
  const week = getWeekNumber(oneWeekAgo)
  return `${year}-${week.toString().padStart(2, '0')}`
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
