import React from 'react';
import { useAppSelector } from '../../store';

/**
 * QALiveOverlay - Shows the currently "live answered" question
 * as a floating overlay above the video area.
 * Uses absolute positioning inside main-area to avoid going off-screen.
 */
const QALiveOverlay = () => {
  const activeLiveAnswerId = useAppSelector((s) => s.qa.activeLiveAnswerId);
  const questions = useAppSelector((s) => s.qa.questions);

  if (!activeLiveAnswerId) return null;

  const question = questions.find((q) => q.id === activeLiveAnswerId);
  if (!question) return null;

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[9998] w-[88%] max-w-lg pointer-events-none">
      <div className="relative bg-slate-900/92 backdrop-blur-2xl rounded-xl border border-indigo-500/20 shadow-xl shadow-black/30 overflow-hidden pointer-events-auto">
        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
        
        {/* Live badge + content */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.15em]">
              Đang trả lời
            </span>

            <div className="flex-1" />

            {/* Author */}
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-[9px] font-bold">
                {question.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[11px] font-semibold text-indigo-300">{question.name}</span>
              {question.upvotes > 0 && (
                <span className="text-[9px] font-bold bg-white/10 text-white/60 px-1.5 py-0.5 rounded-full">
                  ▲{question.upvotes}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
            "{question.question}"
          </p>
        </div>
      </div>
    </div>
  );
};

export default QALiveOverlay;
