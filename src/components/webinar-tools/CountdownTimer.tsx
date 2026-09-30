import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateTimer } from '../../store/slices/roomSettingsSlice';
import { getNatsConn } from '../../helpers/nats';
import { DataMsgBodyType } from 'plugnmeet-protocol-js';

const CountdownTimer = () => {
  const dispatch = useAppDispatch();
  const timerState = useAppSelector((state) => state.roomSettings.timer);
  const currentUser = useAppSelector((state) => state.session.currentUser);
  
  const isHost = !!currentUser?.metadata?.isAdmin;
  const isPresenter = !!currentUser?.metadata?.isPresenter;
  const canManageTimer = useMemo(() => isHost || isPresenter, [isHost, isPresenter]);

  const [pos, setPos] = useState({ x: window.innerWidth - 260, y: 100 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  // Host local states for inputs
  const [inputMinutes, setInputMinutes] = useState('5');
  const [warningThreshold, setWarningThreshold] = useState('1'); 
  
  const isActive = timerState?.isActive || false;
  const secondsRemaining = timerState?.secondsRemaining || 0;
  const warningSec = (timerState?.warningThresholdSec || 60);

  // Sync inputs with global state
  useEffect(() => {
    if (timerState?.duration) setInputMinutes((timerState.duration / 60).toString());
    if (timerState?.warningThresholdSec) setWarningThreshold((timerState.warningThresholdSec / 60).toString());
  }, [timerState?.duration, timerState?.warningThresholdSec]);

  const broadcastTimerState = (active: boolean, remaining: number, duration: number, warning: number) => {
    const payload = JSON.stringify({
      type: 'WEBINAR_TIMER',
      payload: { isActive: active, secondsRemaining: remaining, duration: duration, warningThresholdSec: warning }
    });
    getNatsConn()?.sendDataMessage(DataMsgBodyType.INFO, payload);
    dispatch(updateTimer({ isActive: active, secondsRemaining: remaining, duration: duration, warningThresholdSec: warning }));
  };

  const startTimer = () => {
    const mins = parseFloat(inputMinutes);
    const warnMins = parseFloat(warningThreshold);
    if (!isNaN(mins) && mins > 0) {
      const secs = Math.floor(mins * 60);
      const warnSecs = isNaN(warnMins) ? 60 : Math.floor(warnMins * 60);
      broadcastTimerState(true, secs, secs, warnSecs);
    }
  };

  const stopTimer = () => broadcastTimerState(false, secondsRemaining, timerState?.duration || 0, warningSec);
  const resetTimer = () => broadcastTimerState(false, 0, 0, 60);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: pos.x, originY: pos.y };
    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({ x: dragRef.current.originX + (ev.clientX - dragRef.current.startX), y: dragRef.current.originY + (ev.clientY - dragRef.current.startY) });
    };
    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = timerState?.duration ? ((timerState.duration - secondsRemaining) / timerState.duration) * 100 : 0;
  const isWarning = secondsRemaining > 0 && secondsRemaining <= warningSec;

  const showTimerUI = useAppSelector((state) => state.bottomIconsActivity.showTimer);

  if (!canManageTimer || !showTimerUI) return null;

  return (
    <div className="fixed z-[9996] select-none" style={{ left: pos.x, top: pos.y }}>
      <div className="w-[240px] bg-white dark:bg-[#0d1117] backdrop-blur-2xl rounded-2xl border border-slate-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transition-all">
        
        {/* Header / Drag Handle */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 cursor-move" onMouseDown={handleMouseDown}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg shadow-sm ${isActive ? (isWarning ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-[#00a1f2]'} transition-colors`}>
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-[0.15em]">
              {isActive ? (isWarning ? 'Sắp hết giờ' : 'Đang chạy') : 'Bộ đếm'}
            </span>
          </div>
          <button 
            onClick={() => dispatch({ type: 'bottomIconsActivity/updateShowTimer', payload: false })}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 hover:text-red-500 dark:hover:text-red-400 transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Progress Bar */}
        {isActive && (
          <div className="px-4 pb-1">
            <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ease-linear ${isWarning ? 'bg-amber-500' : 'bg-[#00a1f2]'}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="px-4 pb-4">
          {isActive ? (
            /* === ĐANG CHẠY === */
            <div className="flex flex-col items-center gap-3 pt-2">
              <span className={`text-4xl font-mono font-black tracking-tighter transition-colors ${isWarning ? 'text-amber-500 animate-pulse' : 'text-slate-800 dark:text-white'}`}>
                {formatTime(secondsRemaining)}
              </span>
              
              <div className="grid grid-cols-2 gap-2 w-full">
                <button 
                  onClick={stopTimer} 
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Dừng
                </button>
                <button 
                  onClick={resetTimer} 
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            /* === CÀI ĐẶT === */
            <div className="flex flex-col gap-3 pt-1">
              <div className="grid grid-cols-2 gap-2">
                {/* Thời gian */}
                <div>
                  <label className="flex items-center gap-1 text-[8px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.15em] mb-1 ml-0.5">
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Thời gian
                  </label>
                  <div className="relative">
                    <input 
                      type="number" step="0.5" min="0.5" value={inputMinutes} 
                      onChange={(e) => setInputMinutes(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white text-lg font-black py-2 rounded-xl outline-none border border-slate-200 dark:border-white/10 focus:border-[#00a1f2] focus:ring-2 focus:ring-[#00a1f2]/20 transition-all text-center" 
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 dark:text-white/30">phút</span>
                  </div>
                </div>
                {/* Cảnh báo */}
                <div>
                  <label className="flex items-center gap-1 text-[8px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.15em] mb-1 ml-0.5">
                    <svg className="w-2.5 h-2.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                    Cảnh báo
                  </label>
                  <div className="relative">
                    <input 
                      type="number" step="0.5" min="0" value={warningThreshold} 
                      onChange={(e) => setWarningThreshold(e.target.value)} 
                      className="w-full bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white text-lg font-black py-2 rounded-xl outline-none border border-slate-200 dark:border-white/10 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all text-center" 
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300 dark:text-white/30">phút</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={startTimer} 
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#004D90] to-[#00a1f2] hover:from-[#003d70] hover:to-[#0091d2] text-white text-[10px] font-black uppercase tracking-[0.15em] shadow-lg shadow-[#00a1f2]/20 transition-all active:scale-[0.97]"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Bắt đầu
              </button>
            </div>
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
          <p className="text-[7px] font-bold text-slate-400 dark:text-white/30 text-center leading-relaxed tracking-wide">
            Đồng hồ hiển thị trên Header khi đóng cửa sổ này
          </p>
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
