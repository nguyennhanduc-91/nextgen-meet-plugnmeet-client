import React, { useState, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector, store } from '../../store';
import {
  addQuestion,
  upvoteQuestion,
  markAsAnswered,
  setActiveLiveAnswer,
  deleteQuestion,
} from '../../store/slices/qaSlice';
import {
  setActiveSidePanel,
  setIsQAPopout,
} from '../../store/slices/bottomIconsActivitySlice';
import { getNatsConn } from '../../helpers/nats';
import { DataMsgBodyType } from 'plugnmeet-protocol-js';
import { IQAMessage } from '../../store/slices/interfaces/qa';

interface QAPanelProps {
  isPopoutWindow?: boolean;
}

const QAPanel = ({ isPopoutWindow = false }: QAPanelProps) => {
  const dispatch = useAppDispatch();
  const questions = useAppSelector((state) => state.qa.questions);
  const activeLiveAnswerId = useAppSelector((state) => state.qa.activeLiveAnswerId);
  const [newQuestion, setNewQuestion] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');

  const { isAdmin, currentUserId, currentUserName } = useMemo(() => {
    const session = store.getState().session;
    return {
      isAdmin: !!session.currentUser?.metadata?.isAdmin,
      currentUserId: session.currentUser?.userId ?? '',
      currentUserName: session.currentUser?.name ?? '',
    };
  }, []);

  const sortedQuestions = useMemo(() => {
    const sorted = [...questions];
    if (sortBy === 'popular') {
      sorted.sort((a, b) => b.upvotes - a.upvotes);
    } else {
      sorted.sort((a, b) => b.timestamp - a.timestamp);
    }
    return sorted;
  }, [questions, sortBy]);

  const unanswered = sortedQuestions.filter((q) => !q.isAnswered);
  const answered = sortedQuestions.filter((q) => q.isAnswered);

  const broadcastQA = useCallback(
    (type: string, payload: Record<string, unknown>) => {
      try {
        const conn = getNatsConn();
        const data = JSON.stringify({ type: `WEBINAR_QA_${type}`, payload });
        conn?.sendDataMessage(DataMsgBodyType.INFO, data);
      } catch (e) {
        console.error('QA broadcast error:', e);
      }
    },
    [],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;
    const msg: IQAMessage = {
      id: `qa-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      userId: currentUserId,
      name: currentUserName,
      question: newQuestion.trim(),
      timestamp: Date.now(),
      upvotes: 0,
      upvotedBy: [],
      isAnswered: false,
    };
    dispatch(addQuestion(msg));
    broadcastQA('NEW', { message: msg });
    setNewQuestion('');
  };

  const handleUpvote = (id: string) => {
    dispatch(upvoteQuestion({ id, userId: currentUserId }));
    broadcastQA('UPVOTE', { id, userId: currentUserId });
  };

  const handleLiveAnswer = (id: string) => {
    const newId = activeLiveAnswerId === id ? null : id;
    dispatch(setActiveLiveAnswer(newId));
    broadcastQA('LIVE_ANSWER', { id: newId });
  };

  const handleMarkAnswered = (id: string) => {
    dispatch(markAsAnswered({ id }));
    if (activeLiveAnswerId === id) {
      dispatch(setActiveLiveAnswer(null));
    }
    broadcastQA('MARK_ANSWERED', { id });
  };

  const handleDelete = (id: string) => {
    dispatch(deleteQuestion(id));
    broadcastQA('DELETE', { id });
  };

  const closePanel = () => {
    dispatch(setActiveSidePanel(null));
  };

  const handlePopout = () => {
    dispatch(setActiveSidePanel(null));
    dispatch(setIsQAPopout(true));
  };

  const hasUpvoted = (q: IQAMessage) => q.upvotedBy.includes(currentUserId);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="side-panel-bg-color relative z-10 w-full bg-white dark:bg-[#0d1117] h-full flex flex-col border-l border-slate-200 dark:border-white/5">
      {/* Header */}
      <div className="flex items-center justify-between h-12 px-3 border-b border-slate-100 dark:border-white/5 shrink-0 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#00a1f2]/10 flex items-center justify-center text-[#00a1f2]">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-[13px] text-slate-800 dark:text-white font-black uppercase tracking-wider">
            Hỏi đáp
          </span>
          {unanswered.length > 0 && (
            <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[16px] text-center shadow-sm">
              {unanswered.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Sort toggle */}
          <div className="flex bg-slate-200/50 dark:bg-white/5 rounded-md p-0.5 mr-1">
            <button
              onClick={() => setSortBy('newest')}
              className={`flex items-center gap-1 px-2 py-1 rounded-[4px] text-[9px] font-black uppercase tracking-wider transition-all ${
                sortBy === 'newest'
                  ? 'bg-white dark:bg-[#161b22] text-[#00a1f2] shadow-sm'
                  : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70'
              }`}
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Mới
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`flex items-center gap-1 px-2 py-1 rounded-[4px] text-[9px] font-black uppercase tracking-wider transition-all ${
                sortBy === 'popular'
                  ? 'bg-white dark:bg-[#161b22] text-[#00a1f2] shadow-sm'
                  : 'text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70'
              }`}
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /></svg>
              Hot
            </button>
          </div>

          {/* Popout button */}
          {!isPopoutWindow && (
            <button
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-[#00a1f2] dark:hover:bg-white/10 dark:hover:text-[#00a1f2] transition-colors"
              onClick={handlePopout}
              title="Mở cửa sổ riêng"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[14px] h-[14px]">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
          )}

          {/* Close button */}
          {!isPopoutWindow && (
            <button
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors"
              onClick={closePanel}
              title="Đóng"
            >
              <svg className="w-[14px] h-[14px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-1.5 custom-scrollbar">
        {unanswered.length === 0 && answered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-60">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-3 text-slate-400 dark:text-white/40">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[11px] font-black text-slate-500 dark:text-white/50 uppercase tracking-widest">
              Chưa có câu hỏi
            </p>
          </div>
        )}

        {/* Unanswered */}
        {unanswered.map((q) => (
          <div
            key={q.id}
            className={`group relative rounded-xl border transition-all duration-200 overflow-hidden ${
              activeLiveAnswerId === q.id
                ? 'border-[#00a1f2]/30 bg-[#00a1f2]/5 dark:bg-[#00a1f2]/10 ring-1 ring-[#00a1f2]/20'
                : 'border-slate-200 dark:border-white/5 bg-white dark:bg-[#161b22] hover:border-[#00a1f2]/30 dark:hover:border-[#00a1f2]/30 shadow-sm hover:shadow-md'
            }`}
          >
            {activeLiveAnswerId === q.id && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#004D90] to-[#00a1f2] animate-pulse" />
            )}
            
            <div className="px-3 py-2.5">
              <div className="flex items-start gap-2">
                {/* Avatar */}
                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-white/80 text-[10px] font-black shrink-0">
                  {q.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px] font-black text-slate-700 dark:text-white/90 truncate uppercase tracking-wide">{q.name}</span>
                    <span className="text-[9px] font-bold text-slate-400 dark:text-white/30 shrink-0">{formatTime(q.timestamp)}</span>
                    {activeLiveAnswerId === q.id && (
                      <span className="ml-auto text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-widest animate-pulse">Live</span>
                    )}
                  </div>
                  <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed break-words">{q.question}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <button
                  onClick={() => handleUpvote(q.id)}
                  disabled={hasUpvoted(q)}
                  title={hasUpvoted(q) ? 'Bạn đã bình chọn' : 'Bình chọn câu hỏi này'}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black transition-all ${
                    hasUpvoted(q)
                      ? 'bg-[#00a1f2]/10 text-[#00a1f2] cursor-default'
                      : 'text-slate-400 hover:bg-slate-100 hover:text-[#00a1f2] dark:hover:bg-white/5 active:scale-95'
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill={hasUpvoted(q) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                  {q.upvotes}
                </button>
                
                {isAdmin && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleLiveAnswer(q.id)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${
                        activeLiveAnswerId === q.id
                          ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                          : 'bg-[#00a1f2]/10 text-[#00a1f2] border border-[#00a1f2]/20 hover:bg-[#00a1f2]/20'
                      }`}
                      title={activeLiveAnswerId === q.id ? 'Dừng trả lời' : 'Trả lời live'}
                    >
                      {activeLiveAnswerId === q.id ? (
                        <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="1" /></svg>
                      ) : (
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4-15a3 3 0 016 0v4a3 3 0 01-6 0V8z" /></svg>
                      )}
                      {activeLiveAnswerId === q.id ? 'Dừng' : 'Live'}
                    </button>
                    <button
                      onClick={() => handleMarkAnswered(q.id)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all"
                      title="Đánh dấu đã trả lời"
                    >
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      Xong
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="flex items-center justify-center w-6 h-6 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      title="Xóa câu hỏi"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Answered Section */}
        {answered.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">Đã trả lời ({answered.length})</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-white/5" />
            </div>
            <div className="space-y-1.5">
              {answered.map((q) => (
                <div key={q.id} className="rounded-xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] px-3 py-2 opacity-60 grayscale-[0.5]">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <svg className="w-3 h-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[10px] font-black text-slate-600 dark:text-white/70 uppercase tracking-wide">{q.name}</span>
                    <span className="text-[8px] font-bold text-slate-400 ml-auto">{formatTime(q.timestamp)}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-white/50 line-clamp-2 pl-4.5">{q.question}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 p-2 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Nhập câu hỏi của bạn..."
            className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#161b22] text-[13px] text-slate-800 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#00a1f2]/20 focus:border-[#00a1f2] transition-all shadow-inner"
          />
          <button
            type="submit"
            disabled={!newQuestion.trim()}
            className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-r from-[#004D90] to-[#00a1f2] text-white flex items-center justify-center shadow-md shadow-[#00a1f2]/20 transition-all disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed active:scale-95"
          >
            <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default QAPanel;
