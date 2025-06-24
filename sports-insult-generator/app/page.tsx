'use client'
import { useState } from 'react'
import TeamSelector from './components/TeamSelector'
import PlayerSelector from './components/PlayerSelector'
import InsultCard from './components/InsultCard'
import { Team, Player, Insult } from './types'
import { getWeekId } from './lib/utils'

const SPORTS = [
  { id: 'nfl', name: 'NFL' },
  { id: 'nba', name: 'NBA' },
  { id: 'mlb', name: 'MLB' },
  { id: 'nhl', name: 'NHL' },
]

export default function Home() {
  const [selectedSport, setSelectedSport] = useState('nfl')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [insults, setInsults] = useState<Insult[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const generateInsults = async () => {
    if (!selectedPlayer) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/insults/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: selectedPlayer.id,
          teamId: selectedPlayer.teamId,
          sport: selectedSport,
        }),
      })

      const data = await response.json()
      setInsults([data])
    } catch (error) {
      console.error('Error generating insults:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleVote = async (insultId: string, voteType: 'up' | 'down') => {
    if (!selectedPlayer) return

    try {
      await fetch('/api/insults/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          insultId,
          voteType,
          playerId: selectedPlayer.id,
          weekId: getWeekId(),
        }),
      })

      // Update local state
      setInsults(prev => prev.map(insult => 
        insult.id === insultId 
          ? { 
              ...insult, 
              [voteType === 'up' ? 'upvotes' : 'downvotes']: insult[voteType === 'up' ? 'upvotes' : 'downvotes'] + 1 
            }
          : insult
      ))
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-6">
            Sports Roast Generator
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Select your sport, pick a player, and let AI generate the most savage roasts based on real stats and current events
          </p>
        </div>
        
        {/* Sport Selection */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">Choose Your Battle Arena</h2>
            <p className="text-slate-400">Pick a league to unleash the fury</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 max-w-4xl mx-auto">
            {SPORTS.map(sport => (
              <button
                key={sport.id}
                onClick={() => {
                  setSelectedSport(sport.id)
                  setSelectedTeam(null)
                  setSelectedPlayer(null)
                  setInsults([])
                }}
                className={`group relative px-10 py-6 rounded-2xl font-bold text-xl transition-all duration-500 transform hover:scale-110 ${
                  selectedSport === sport.id 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl shadow-purple-500/50 ring-4 ring-purple-400/30' 
                    : 'bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 hover:border-purple-400/50 hover:bg-white/20 hover:shadow-xl'
                }`}
              >
                <span className="relative z-10">{sport.name}</span>
                {selectedSport === sport.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Team Selection */}
        {!selectedTeam && (
          <div className="mb-16">
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-2xl">
              <TeamSelector sport={selectedSport} onTeamSelect={setSelectedTeam} />
            </div>
          </div>
        )}

        {/* Player Selection */}
        {selectedTeam && !selectedPlayer && (
          <div className="mb-12">
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Choose Your Target - {selectedTeam.name}</h2>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 border border-white/20 hover:border-white/40"
                >
                  ← Change Team
                </button>
              </div>
              <PlayerSelector team={selectedTeam} onPlayerSelect={setSelectedPlayer} />
            </div>
          </div>
        )}

        {/* Insult Generation */}
        {selectedPlayer && (
          <div className="mb-12">
            <div className="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-white">
                  Roast Time: {selectedPlayer.name} #{selectedPlayer.jerseyNumber}
                </h2>
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 border border-white/20 hover:border-white/40"
                >
                  ← Change Player
                </button>
              </div>

              {insults.length === 0 && (
                <div className="text-center py-12">
                  <button
                    onClick={generateInsults}
                    disabled={isGenerating}
                    className="group relative px-12 py-6 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold text-xl rounded-2xl hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-red-500/30"
                  >
                    <span className="relative z-10">
                      {isGenerating ? (
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Generating Savage Roasts...</span>
                        </div>
                      ) : (
                        '🔥 Generate Roasts'
                      )}
                    </span>
                  </button>
                </div>
              )}

              {insults.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">This Week&apos;s Roasts</h3>
                    <button
                      onClick={generateInsults}
                      disabled={isGenerating}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 transition-all duration-300 shadow-lg"
                    >
                      {isGenerating ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Generating...</span>
                        </div>
                      ) : (
                        '⚡ Generate More'
                      )}
                    </button>
                  </div>
                  {insults.map(insult => (
                    <InsultCard
                      key={insult.id}
                      insult={insult}
                      onVote={handleVote}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
