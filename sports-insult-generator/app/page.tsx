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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Sports Player Roast Generator</h1>
        
        {/* Sport Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Choose a Sport</h2>
          <div className="flex space-x-4">
            {SPORTS.map(sport => (
              <button
                key={sport.id}
                onClick={() => {
                  setSelectedSport(sport.id)
                  setSelectedTeam(null)
                  setSelectedPlayer(null)
                  setInsults([])
                }}
                className={`px-6 py-2 rounded-lg ${
                  selectedSport === sport.id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white border hover:bg-gray-50'
                }`}
              >
                {sport.name}
              </button>
            ))}
          </div>
        </div>

        {/* Team Selection */}
        {!selectedTeam && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Choose a Team</h2>
            <TeamSelector sport={selectedSport} onTeamSelect={setSelectedTeam} />
          </div>
        )}

        {/* Player Selection */}
        {selectedTeam && !selectedPlayer && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Choose a Player - {selectedTeam.name}</h2>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-blue-500 hover:underline"
              >
                Change Team
              </button>
            </div>
            <PlayerSelector team={selectedTeam} onPlayerSelect={setSelectedPlayer} />
          </div>
        )}

        {/* Insult Generation */}
        {selectedPlayer && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                Generate Roasts for {selectedPlayer.name} #{selectedPlayer.jerseyNumber}
              </h2>
              <button
                onClick={() => setSelectedPlayer(null)}
                className="text-blue-500 hover:underline"
              >
                Change Player
              </button>
            </div>

            {insults.length === 0 && (
              <div className="text-center">
                <button
                  onClick={generateInsults}
                  disabled={isGenerating}
                  className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {isGenerating ? 'Generating Roasts...' : 'Generate Roasts'}
                </button>
              </div>
            )}

            {insults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">This Week&apos;s Roasts</h3>
                  <button
                    onClick={generateInsults}
                    disabled={isGenerating}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : 'Generate New Batch'}
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
        )}
      </div>
    </div>
  )
}
