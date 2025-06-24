'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { Player, Team } from '../types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface PlayerSelectorProps {
  team: Team
  onPlayerSelect: (player: Player) => void
}

export default function PlayerSelector({ team, onPlayerSelect }: PlayerSelectorProps) {
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const { data: players, error, isLoading } = useSWR(
    `/api/players/${team.id}?sport=${team.sport}`,
    fetcher
  )

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center space-x-3">
          <div className="w-6 h-6 border-3 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-lg text-white font-medium">Loading roster...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 max-w-md mx-auto">
          <div className="text-red-300 font-bold">⚠️ Error loading roster</div>
        </div>
      </div>
    )
  }

  const uniqueNumbers: number[] = [...new Set((players?.map((p: Player) => p.jerseyNumber) ?? []) as number[])].sort((a, b) => a - b)
  const playersWithNumber = selectedNumber ? players?.filter((p: Player) => p.jerseyNumber === selectedNumber) : []

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Select Jersey Number</h3>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
          {uniqueNumbers.map((number: number) => (
            <button
              key={number}
              onClick={() => setSelectedNumber(number)}
              className={`aspect-square p-3 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-110 ${
                selectedNumber === number 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/50 ring-4 ring-purple-400/30' 
                  : 'bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 hover:border-purple-400/50 hover:bg-white/20'
              }`}
            >
              #{number}
            </button>
          ))}
        </div>
      </div>

      {playersWithNumber.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-white mb-6">Select Player</h3>
          <div className="space-y-4">
            {playersWithNumber.map((player: Player) => (
              <button
                key={player.id}
                onClick={() => onPlayerSelect(player)}
                className="w-full p-6 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl hover:border-purple-400/50 hover:bg-white/20 text-left transition-all duration-300 transform hover:scale-[1.02] group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white text-xl group-hover:text-purple-300 transition-colors">
                      {player.name}
                    </div>
                    <div className="text-slate-300 font-medium mt-1">
                      #{player.jerseyNumber} • {player.position}
                      {player.college && ` • ${player.college}`}
                    </div>
                  </div>
                  <div className="text-purple-400 group-hover:text-purple-300 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
