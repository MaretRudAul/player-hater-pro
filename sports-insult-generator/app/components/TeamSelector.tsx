'use client'
// import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Team } from '../types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface TeamSelectorProps {
  sport: string
  onTeamSelect: (team: Team) => void
}

export default function TeamSelector({ sport, onTeamSelect }: TeamSelectorProps) {
  const { data: teams, error, isLoading } = useSWR(`/api/teams?sport=${sport}`, fetcher)

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xl text-white font-medium">Loading teams...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-8 max-w-md mx-auto backdrop-blur-sm">
          <div className="text-red-300 text-xl font-bold mb-2">⚠️ Error loading teams</div>
          <div className="text-red-400 text-sm mb-4">Failed to fetch team data</div>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h3 className="text-3xl font-bold text-white mb-3">Choose Your Team</h3>
        <p className="text-slate-300 text-lg">Select a team from the {sport.toUpperCase()}</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6">
        {teams?.map((team: Team) => (
          <button
            key={team.id}
            onClick={() => onTeamSelect(team)}
            className="group bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-2xl p-6 hover:border-purple-400/50 hover:bg-white/20 hover:shadow-2xl transition-all duration-500 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/30"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center overflow-hidden group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                {team.logo ? (
                  <img 
                    src={team.logo} 
                    alt={`${team.name} logo`} 
                    className="w-16 h-16 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling!.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <div className={`text-2xl font-bold text-white/80 ${team.logo ? 'hidden' : ''}`}>
                  {team.abbreviation || team.name.slice(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="text-center">
                <div className="font-bold text-white text-sm leading-tight group-hover:text-purple-300 transition-colors">
                  {team.name}
                </div>
                <div className="text-xs text-slate-400 mt-1 font-medium">
                  {team.abbreviation}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
