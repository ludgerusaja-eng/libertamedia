import React, { useState, useEffect } from 'react';
import { Vote, CheckCircle2, BarChart2 } from 'lucide-react';
import { PollData } from '../types';

interface InteractivePollProps {
  poll: PollData;
}

export const InteractivePoll: React.FC<InteractivePollProps> = ({ poll }) => {
  const [pollState, setPollState] = useState<PollData>(poll);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);

  useEffect(() => {
    const savedVote = localStorage.getItem(`liberta_poll_${poll.id}`);
    if (savedVote) {
      setSelectedOption(savedVote);
      setHasVoted(true);
    }
  }, [poll.id]);

  const totalVotes = pollState.options.reduce((sum, opt) => sum + opt.votes, 0);

  const handleVote = (optionId: string) => {
    if (hasVoted) return;

    const updatedOptions = pollState.options.map((opt) => {
      if (opt.id === optionId) {
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });

    setPollState({ ...pollState, options: updatedOptions });
    setSelectedOption(optionId);
    setHasVoted(true);
    localStorage.setItem(`liberta_poll_${poll.id}`, optionId);
  };

  return (
    <div id="interactive-poll-box" className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-100 text-[#E5252A]">
            <Vote className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-red-600">
              {pollState.topic}
            </span>
            <h4 className="text-xs font-bold text-slate-900 leading-tight">
              Suara Pembaca Liberta
            </h4>
          </div>
        </div>
        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
          {totalVotes.toLocaleString('id-ID')} Suara
        </span>
      </div>

      {/* Question */}
      <p className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed">
        {pollState.question}
      </p>

      {/* Options */}
      <div className="space-y-2">
        {pollState.options.map((option) => {
          const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          const isSelected = selectedOption === option.id;

          if (hasVoted) {
            return (
              <div key={option.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-100 flex-shrink-0" />}
                    <span className={isSelected ? 'text-red-700 font-bold' : ''}>{option.text}</span>
                  </span>
                  <span className="font-mono text-slate-900">{percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isSelected ? 'bg-[#E5252A]' : 'bg-slate-400'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          }

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-red-400 hover:bg-red-50/50 text-xs font-medium text-slate-700 transition-all flex items-center justify-between group"
            >
              <span>{option.text}</span>
              <span className="text-[10px] text-slate-400 group-hover:text-[#E5252A] font-bold">
                Pilih →
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
        <span>Berakhir: {pollState.endDate}</span>
        {hasVoted ? (
          <span className="text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Suara Tercatat
          </span>
        ) : (
          <span className="text-slate-400 flex items-center gap-1">
            <BarChart2 className="w-3 h-3" /> Pilih untuk melihat hasil
          </span>
        )}
      </div>
    </div>
  );
};
