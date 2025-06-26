'use client'
import { useState, useMemo } from 'react'
import useSWR from 'swr'
import InsultCard from './InsultCard'
import { Player, Insult } from '../types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

// Generate a unique client ID for this session
function generateClientId(): string {
  return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

interface InsultGeneratorProps {
  player: Player
  sport: string
}

export default function InsultGenerator({ player, sport }: InsultGeneratorProps) {
  const [view, setView] = useState<'top' | 'new'>('top')
  const [isGenerating, setIsGenerating] = useState(false)
  const [votedInsults, setVotedInsults] = useState<Set<string>>(new Set())

  // Get or create persistent client ID
  const persistentClientId = useMemo(() => {
    if (typeof window === 'undefined') return ''
    
    let id = sessionStorage.getItem('player-hater-client-id')
    if (!id) {
      id = generateClientId()
      sessionStorage.setItem('player-hater-client-id', id)
    }
    return id
  }, [])

  const { data: topInsults, mutate: mutateTop } = useSWR(
    `/api/insults/top?playerId=${player.id}`,
    fetcher
  )

  const { data: playerInsults, mutate: mutatePlayer } = useSWR(
    persistentClientId ? `/api/insults/player?playerId=${player.id}&clientId=${persistentClientId}` : null,
    fetcher
  )

  const generateNewInsults = async () => {
    if (!persistentClientId) {
      return
    }
    
    setIsGenerating(true)
    try {
      const response = await fetch('/api/insults/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: player.id,
          teamId: player.teamId,
          sport: sport,
          clientId: persistentClientId, // Include client ID for session tracking
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate insult')
      }

      await response.json() // Just wait for the response, don't store it
      
      // Switch to session view and refresh both data sources
      setView('new')
      // Small delay to ensure the API call completed
      setTimeout(() => {
        mutatePlayer() // Refresh player-specific insults
        mutateTop() // Refresh top insults  
      }, 100)
    } catch (error) {
      console.error('Error generating insults:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleVote = async (insultId: string, voteType: 'up' | 'down') => {
    // Check if already voted on this insult
    if (votedInsults.has(insultId)) {
      console.log('Already voted on this insult')
      return
    }

    try {
      const response = await fetch('/api/insults/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insultId,
          voteType: voteType === 'up' ? 'upvote' : 'downvote',
          clientId: persistentClientId, // Include client ID for duplicate prevention
        }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        if (response.status === 409) {
          // Already voted - mark as voted locally and return silently
          setVotedInsults(prev => new Set([...prev, insultId]))
          return
        }
        throw new Error(result.error || 'Failed to vote')
      }

      // Mark as voted locally
      setVotedInsults(prev => new Set([...prev, insultId]))

      // Update local state with new vote counts - SWR will handle data refresh
      
      // Refresh both data sources after vote
      mutateTop()
      mutatePlayer()
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const currentInsults = view === 'top' ? (topInsults || []) : (playerInsults || [])

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
              '🔥 Generate More Roasts'
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
          🏆 Top & Recent ({(topInsults || []).length})
        </button>
        <button
          onClick={() => setView('new')}
          className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 ${
            view === 'new' 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/30' 
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          ⚡ Your Session ({(playerInsults || []).length})
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
                  : 'Click "Generate More Roasts" to create fresh material!'
                }
              </div>
            </div>
          </div>
        ) : (
          currentInsults.map((insult: Insult, index: number) => (
            <InsultCard
              key={insult.id}
              insult={insult}
              onVote={handleVote}
              rank={view === 'top' ? index + 1 : undefined}
              hasVoted={votedInsults.has(insult.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
