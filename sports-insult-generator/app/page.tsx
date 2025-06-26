'use client'
import { useState } from 'react'
import TeamSelector from './components/TeamSelector'
import PlayerSelector from './components/PlayerSelector'
import InsultGenerator from './components/InsultGenerator'
import { Team, Player } from './types'

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
                <button
                  onClick={() => setSelectedPlayer(null)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-300 border border-white/20 hover:border-white/40"
                >
                  ← Change Player
                </button>
              </div>
              
              <InsultGenerator player={selectedPlayer} sport={selectedSport} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
