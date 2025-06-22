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

  if (isLoading) return <div className="animate-pulse">Loading roster...</div>
  if (error) return <div className="text-red-500">Error loading roster</div>

  const uniqueNumbers: number[] = [...new Set((players?.map((p: Player) => p.jerseyNumber) ?? []) as number[])].sort((a, b) => a - b)
  const playersWithNumber = selectedNumber ? players?.filter((p: Player) => p.jerseyNumber === selectedNumber) : []

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Jersey Number</h3>
        <div className="grid grid-cols-8 md:grid-cols-12 gap-2">
          {uniqueNumbers.map((number: number) => (
            <button
              key={number}
              onClick={() => setSelectedNumber(number)}
              className={`p-2 border rounded ${
                selectedNumber === number ? 'bg-blue-500 text-white' : 'hover:bg-gray-50'
              }`}
            >
              #{number}
            </button>
          ))}
        </div>
      </div>

      {playersWithNumber.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Select Player</h3>
          <div className="space-y-2">
            {playersWithNumber.map((player: Player) => (
              <button
                key={player.id}
                onClick={() => onPlayerSelect(player)}
                className="w-full p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="font-medium">{player.name}</div>
                <div className="text-sm text-gray-600">
                  #{player.jerseyNumber} • {player.position}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
