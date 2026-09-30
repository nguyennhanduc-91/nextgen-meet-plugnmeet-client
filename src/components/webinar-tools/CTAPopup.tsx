import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateActiveCTA } from '../../store/slices/roomSettingsSlice';

const CTAPopup = () => {
  const dispatch = useAppDispatch();
  const activeCTA = useAppSelector((state) => state.roomSettings.activeCTA);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!activeCTA) return;

    const now = Date.now();
    const expiresAt = activeCTA.startedAt + activeCTA.duration * 1000;
    const initialTimeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
    setTimeLeft(initialTimeLeft);

    if (initialTimeLeft === 0) {
      dispatch(updateActiveCTA(null));
      return;
    }

    const interval = setInterval(() => {
      const currentNow = Date.now();
      const currentLeft = Math.max(0, Math.floor((expiresAt - currentNow) / 1000));
      setTimeLeft(currentLeft);

      if (currentLeft === 0) {
        clearInterval(interval);
        dispatch(updateActiveCTA(null));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeCTA, dispatch]);

  if (!activeCTA || timeLeft <= 0) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-x-0 bottom-8 z-[9998] flex justify-center pointer-events-none px-4">
      <div className="bg-white/95 dark:bg-dark-secondary/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2rem] p-6 border border-indigo-100 dark:border-white/10 pointer-events-auto max-w-md w-full flex flex-col gap-4 animate-[slideUp_0.4s_cubic-bezier(0.22,1,0.36,1)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-1.5 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-none">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-base font-black text-Gray-900 dark:text-white uppercase tracking-wider">
                {activeCTA.title}
              </h3>
            </div>
            <p className="text-sm text-Gray-600 dark:text-Gray-300 font-medium leading-relaxed">
              {activeCTA.description}
            </p>
          </div>
          <button
            onClick={() => dispatch(updateActiveCTA(null))}
            className="w-8 h-8 rounded-full hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center justify-center text-Gray-400 hover:text-red-500 transition-all shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={activeCTA.link}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
          >
            {activeCTA.buttonText}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </a>
          
          <div className="flex items-center gap-2 font-mono text-[11px] font-black bg-Gray-100 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 px-4 py-3.5 rounded-2xl border border-Gray-200 dark:border-white/5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CTAPopup;
