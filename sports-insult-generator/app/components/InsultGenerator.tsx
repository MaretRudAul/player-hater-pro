'use client'
import { useState } from 'react'
import useSWR from 'swr'
import InsultCard from './InsultCard'
import { Player, Insult } from '../types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface InsultGeneratorProps {
  player: Player
  sport: string
}

export default function InsultGenerator({ player, sport }: InsultGeneratorProps) {
  const [view, setView] = useState<'top' | 'new'>('top')
  const [newInsults, setNewInsults] = useState<Insult[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const { data: topInsults, mutate: mutateTop } = useSWR(
    `/api/insults/top?playerId=${player.id}`,
    fetcher
  )

  const generateNewInsults = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/insults/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: player.id,
          playerName: player.name,
          sport: sport,
        }),
      })

      const data = await response.json()
      setNewInsults(data.insults)
      setView('new')
    } catch (error) {
      console.error('Error generating insults:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleVote = async (insultId: string, voteType: 'up' | 'down') => {
    try {
      await fetch('/api/insults/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insultId,
          voteType,
          playerId: player.id,
          weekId: getWeekId(),
        }),
      })

      // Update both views
      if (view === 'new') {
        setNewInsults(prev => prev.map(insult => 
          insult.id === insultId 
            ? { 
                ...insult, 
                [voteType === 'up' ? 'upvotes' : 'downvotes']: 
                  insult[voteType === 'up' ? 'upvotes' : 'downvotes'] + 1 
              }
            : insult
        ))
      }
      
      // Refresh top insults after vote
      mutateTop()
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const currentInsults = view === 'top' ? (topInsults || []) : newInsults

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Roasts for {player.name} #{player.jerseyNumber}
        </h2>
        <button
          onClick={generateNewInsults}
          disabled={isGenerating}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate New Roasts'}
        </button>
      </div>

      <div className="flex space-x-4 border-b">
        <button
          onClick={() => setView('top')}
          className={`pb-2 px-1 ${
            view === 'top' 
              ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Top 5 This Week ({(topInsults || []).length})
        </button>
        <button
          onClick={() => setView('new')}
          className={`pb-2 px-1 ${
            view === 'new' 
              ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Latest Batch ({newInsults.length})
        </button>
      </div>

      <div className="space-y-4">
        {currentInsults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {view === 'top' 
              ? 'No roasts yet this week. Generate some to get started!'
              : 'Click "Generate New Roasts" to create fresh material!'
            }
          </div>
        ) : (
          currentInsults.map((insult: Insult) => (
            <InsultCard
              key={insult.id}
              insult={insult}
              onVote={handleVote}
            />
          ))
        )}
      </div>
    </div>
  )
}

function getWeekId(): string {
  const now = new Date()
  const year = now.getFullYear()
  const week = getWeekNumber(now)
  return `${year}-${week.toString().padStart(2, '0')}`
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}
