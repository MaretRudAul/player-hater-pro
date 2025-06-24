'use client'
import useSWR from 'swr'
import { Player, Team } from '../types'

const fetcher = (url: string) => fetch(url).then(res => res.json())

interface PlayerSelectorProps {
  team: Team
  onPlayerSelect: (player: Player) => void
}

export default function PlayerSelector({ team, onPlayerSelect }: PlayerSelectorProps) {
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

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-white mb-6">Choose Your Target</h3>
        <p className="text-slate-300 text-lg mb-8">Select a player from the {team.name} roster</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8 gap-3">
          {players?.map((player: Player) => (
            <button
              key={player.id}
              onClick={() => onPlayerSelect(player)}
              className="group bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-lg p-3 hover:border-purple-400/50 hover:bg-white/20 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500/30 relative"
            >
              <div className="flex flex-col items-center space-y-2">
                {/* Jersey Number Badge */}
                <div className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-sm px-2 py-1 rounded-full shadow-lg min-w-[32px] text-center">
                  #{player.jerseyNumber}
                </div>
                {/* Player Photo */}
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-2xl flex items-center justify-center overflow-hidden group-hover:from-purple-600/30 group-hover:to-pink-600/30 transition-all duration-300 shadow-lg border border-white/10 relative">
                  <img 
                    src={`https://a.espncdn.com/i/headshots/nfl/players/full/${player.id}.png`}
                    alt={`${player.name} headshot`} 
                    className="w-16 h-16 object-cover rounded-xl"
                    onError={(e) => {
                      // Fallback to a default player silhouette if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  {/* Fallback icon */}
                  <div className="fallback-icon absolute inset-0 items-center justify-center text-white/60" style={{ display: 'none' }}>
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  </div>
                </div>

                {/* Player Info */}
                <div className="text-center">
                  <div className="font-bold text-white text-lg group-hover:text-purple-300 transition-colors leading-tight">
                    {player.name}
                  </div>
                  <div className="text-slate-300 font-medium mt-1 text-sm">
                    {player.position}
                  </div>
                  {player.college && (
                    <div className="text-slate-400 text-xs mt-1">
                      {player.college}
                    </div>
                  )}
                </div>

                {/* Hover Arrow */}
                <div className="opacity-0 group-hover:opacity-100 text-purple-400 transition-opacity duration-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
