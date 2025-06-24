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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">
          🎯 Roasts for {player.name} #{player.jerseyNumber}
        </h2>
        <button
          onClick={generateNewInsults}
          disabled={isGenerating}
          className="group relative px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-lg rounded-2xl hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-xl shadow-red-500/30"
        >
          <span className="relative z-10">
            {isGenerating ? (
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </div>
            ) : (
              '🔥 Generate New Roasts'
            )}
          </span>
        </button>
      </div>

      <div className="flex space-x-2 bg-white/5 backdrop-blur-sm rounded-2xl p-2 border border-white/10">
        <button
          onClick={() => setView('top')}
          className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
            view === 'top' 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/30' 
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          🏆 Top 5 This Week ({(topInsults || []).length})
        </button>
        <button
          onClick={() => setView('new')}
          className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
            view === 'new' 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/30' 
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          ⚡ Latest Batch ({newInsults.length})
        </button>
      </div>

      <div className="space-y-6">
        {currentInsults.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10">
              <div className="text-6xl mb-6">
                {view === 'top' ? '🏆' : '⚡'}
              </div>
              <div className="text-xl text-slate-300 font-medium mb-4">
                {view === 'top' 
                  ? 'No roasts yet this week' 
                  : 'Ready to generate fresh roasts?'
                }
              </div>
              <div className="text-slate-400">
                {view === 'top' 
                  ? 'Generate some savage content to get the leaderboard started!'
                  : 'Click "Generate New Roasts" to create fresh material!'
                }
              </div>
            </div>
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
