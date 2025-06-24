'use client';

import { useState } from 'react';
import { Insult } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface InsultCardProps {
  insult: Insult;
  onVote?: (insultId: string, voteType: 'up' | 'down') => void;
  showVoting?: boolean;
  isVoting?: boolean;
}

export default function InsultCard({ 
  insult, 
  onVote, 
  showVoting = true, 
  isVoting = false 
}: InsultCardProps) {
  const [localVotes, setLocalVotes] = useState({
    upvotes: insult.upvotes,
    downvotes: insult.downvotes
  });
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [votingState, setVotingState] = useState<'up' | 'down' | null>(null);

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!onVote || isVoting || votingState) return;

    setVotingState(voteType);

    // Optimistic update
    const previousVotes = { ...localVotes };
    const previousUserVote = userVote;

    // Update local state optimistically
    if (userVote === voteType) {
      // Remove vote
      setLocalVotes(prev => ({
        ...prev,
        [voteType === 'up' ? 'upvotes' : 'downvotes']: prev[voteType === 'up' ? 'upvotes' : 'downvotes'] - 1
      }));
      setUserVote(null);
    } else {
      // Add new vote (and remove previous if exists)
      const newVotes = { ...localVotes };
      
      if (userVote) {
        newVotes[userVote === 'up' ? 'upvotes' : 'downvotes']--;
      }
      
      newVotes[voteType === 'up' ? 'upvotes' : 'downvotes']++;
      
      setLocalVotes(newVotes);
      setUserVote(voteType);
    }

    try {
      await onVote(insult.id, voteType);
    } catch (error) {
      // Revert optimistic update on error
      setLocalVotes(previousVotes);
      setUserVote(previousUserVote);
      console.error('Failed to vote:', error);
    } finally {
      setVotingState(null);
    }
  };

  const totalVotes = localVotes.upvotes + localVotes.downvotes;
  const voteRatio = totalVotes > 0 ? (localVotes.upvotes / totalVotes) * 100 : 0;

  return (
    <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/10 p-8 hover:shadow-purple-500/20 transition-all duration-500 transform hover:scale-[1.02]">
      {/* Player Info Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
            #{insult.playerId.slice(-2)}
          </div>
          <div>
            <h3 className="font-bold text-white text-xl">{insult.player.name}</h3>
            <p className="text-purple-300 font-medium">{insult.player.team}</p>
          </div>
        </div>
        <div className="text-sm text-slate-400 bg-white/5 px-3 py-1 rounded-full">
          {formatDistanceToNow(new Date(insult.createdAt), { addSuffix: true })}
        </div>
      </div>

      {/* Insult Content */}
      <div className="mb-8">
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <p className="text-white leading-relaxed text-lg font-medium">
            &ldquo;{insult.text}&rdquo;
          </p>
        </div>
      </div>

      {/* Vote Ratio Bar */}
      {totalVotes > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-slate-300 mb-3">
            <span className="font-medium">🔥 Roast Rating</span>
            <span className="font-bold text-lg">{Math.round(voteRatio)}%</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 h-3 rounded-full transition-all duration-700 shadow-lg"
              style={{ width: `${voteRatio}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Voting Controls */}
      {showVoting && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleVote('up')}
              disabled={isVoting || votingState !== null}
              className={`group flex items-center space-x-3 px-6 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-110 ${
                userVote === 'up'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl shadow-green-500/30 ring-4 ring-green-400/30'
                  : 'bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 hover:border-green-400/50 hover:bg-green-500/20'
              } ${
                isVoting || votingState ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'
              }`}
            >
              <svg 
                className={`w-5 h-5 ${votingState === 'up' ? 'animate-bounce' : 'group-hover:scale-125 transition-transform'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span className="text-lg">{localVotes.upvotes}</span>
            </button>

            <button
              onClick={() => handleVote('down')}
              disabled={isVoting || votingState !== null}
              className={`group flex items-center space-x-3 px-6 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-110 ${
                userVote === 'down'
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-xl shadow-red-500/30 ring-4 ring-red-400/30'
                  : 'bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 hover:border-red-400/50 hover:bg-red-500/20'
              } ${
                isVoting || votingState ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'
              }`}
            >
              <svg 
                className={`w-5 h-5 ${votingState === 'down' ? 'animate-bounce' : 'group-hover:scale-125 transition-transform'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span className="text-lg">{localVotes.downvotes}</span>
            </button>
          </div>

          {/* Total Votes */}
          <div className="text-slate-300 font-medium bg-white/5 px-4 py-2 rounded-xl">
            💬 {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </div>
        </div>
      )}

      {/* Loading State for Voting */}
      {(isVoting || votingState) && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm rounded-3xl flex items-center justify-center">
          <div className="flex items-center space-x-3 text-white bg-white/10 px-6 py-3 rounded-2xl border border-white/20">
            <div className="w-6 h-6 border-3 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-medium">Casting vote...</span>
          </div>
        </div>
      )}
    </div>
  );
}
