import React, { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateTimer } from '../../store/slices/roomSettingsSlice';

const HeaderTimer = () => {
  const dispatch = useAppDispatch();
  const timerState = useAppSelector((state) => state.roomSettings.timer);
  const currentUser = useAppSelector((state) => state.session.currentUser);
  
  const isHost = !!currentUser?.metadata?.isAdmin;
  const isPresenter = !!currentUser?.metadata?.isPresenter;
  const canSeeTimer = useMemo(() => isHost || isPresenter, [isHost, isPresenter]);

  const isActive = timerState?.isActive || false;
  const secondsRemaining = timerState?.secondsRemaining || 0;
  const warningSec = timerState?.warningThresholdSec || 60;

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0 && canSeeTimer) {
      interval = setInterval(() => {
        dispatch(updateTimer({ ...timerState!, secondsRemaining: secondsRemaining - 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining, dispatch, timerState, canSeeTimer]);

  if (!isActive || !canSeeTimer) return null;

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWarning = secondsRemaining <= warningSec && secondsRemaining > 0;
  const isTimesUp = secondsRemaining === 0;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all duration-300 ${
      isTimesUp ? 'bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400 animate-pulse' : 
      isWarning ? 'bg-amber-500/10 border-amber-500/50 text-amber-600 dark:text-amber-400' : 
      'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
    }`}>
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-[13px] font-black font-mono tracking-tighter leading-none">
        {isTimesUp ? 'HẾT GIỜ!' : formatTime(secondsRemaining)}
      </span>
    </div>
  );
};

export default React.memo(HeaderTimer);

