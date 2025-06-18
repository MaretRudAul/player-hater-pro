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

  if (isLoading) return <div className="animate-pulse">Loading teams...</div>
  if (error) return <div className="text-red-500">Error loading teams</div>

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {teams?.map((team: Team) => (
        <button
          key={team.id}
          onClick={() => onTeamSelect(team)}
          className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
        >
          <img src={team.logo} alt={team.name} className="w-12 h-12 mb-2" />
          <span className="text-sm font-medium text-center">{team.name}</span>
        </button>
      ))}
    </div>
  )
}
