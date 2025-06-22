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
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-200">
      {/* Player Info Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
            #{insult.playerId.slice(-2)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{insult.player.name}</h3>
            <p className="text-sm text-gray-600">{insult.player.team}</p>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {formatDistanceToNow(new Date(insult.createdAt), { addSuffix: true })}
        </div>
      </div>

      {/* Insult Content */}
      <div className="mb-4">
        <p className="text-gray-800 leading-relaxed text-lg italic">
          &ldquo;{insult.text}&rdquo;
        </p>
      </div>

      {/* Vote Ratio Bar */}
      {totalVotes > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
            <span>Approval Rating</span>
            <span>{Math.round(voteRatio)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
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
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                userVote === 'up'
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-green-50 hover:text-green-600 border border-gray-200'
              } ${
                isVoting || votingState ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'
              }`}
            >
              <svg 
                className={`w-4 h-4 ${votingState === 'up' ? 'animate-pulse' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span className="font-medium">{localVotes.upvotes}</span>
            </button>

            <button
              onClick={() => handleVote('down')}
              disabled={isVoting || votingState !== null}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                userVote === 'down'
                  ? 'bg-red-100 text-red-700 border border-red-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200'
              } ${
                isVoting || votingState ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'
              }`}
            >
              <svg 
                className={`w-4 h-4 ${votingState === 'down' ? 'animate-pulse' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path 
                  fillRule="evenodd" 
                  d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
              <span className="font-medium">{localVotes.downvotes}</span>
            </button>
          </div>

          {/* Total Votes */}
          <div className="text-sm text-gray-500">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </div>
        </div>
      )}

      {/* Loading State for Voting */}
      {(isVoting || votingState) && (
        <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg flex items-center justify-center">
          <div className="flex items-center space-x-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-sm">Voting...</span>
          </div>
        </div>
      )}
    </div>
  );
}
