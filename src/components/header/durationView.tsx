import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { store, useAppDispatch, useAppSelector } from '../../store';
import { addUserNotification } from '../../store/slices/roomSettingsSlice';
import { useRoomDurationCountdown } from '../../helpers/hooks/useRoomDurationCountdown';

const DurationView = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isRecorder = store.getState().session.currentUser?.isRecorder;
  const roomDuration = useAppSelector(
    (state) => state.session.currentRoom.metadata?.roomFeatures?.roomDuration,
  );
  const startedAt = useAppSelector(
    (state) => state.session.currentRoom.metadata?.startedAt,
  );

  const [showTimer, setShowTimer] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');

  const endTime = useMemo(() => {
    const duration = Number(roomDuration);
    if (!duration) {
      return 0;
    }
    const startTimeInMs = startedAt ? Number(startedAt) * 1000 : Date.now();
    const durationInMs = duration * 60 * 1000;
    return startTimeInMs + durationInMs;
  }, [roomDuration, startedAt]);

  const remaining = useRoomDurationCountdown(endTime);

  // Show the countdown clock only if the initial room duration is 60 minutes or less.
  const isCountdown = useMemo(() => {
    const duration = Number(roomDuration);
    return duration > 0 && duration <= 60;
  }, [roomDuration]);

  useEffect(() => {
    if (isRecorder || !isCountdown) {
      return;
    }

    switch (remaining) {
      case '60:00':
      case '30:00':
      case '10:00':
      case '5:00':
        dispatch(
          addUserNotification({
            message: t('notifications.room-will-end-in', {
              minutes: remaining,
            }),
            typeOption: 'warning',
          }),
        );
    }
  }, [remaining, isRecorder, dispatch, t, isCountdown]);

  // Calculate elapsed time
  useEffect(() => {
    if (isCountdown) return; // If it's countdown, we don't need elapsed time
    
    const startTime = startedAt ? Number(startedAt) * 1000 : Date.now();
    
    const updateElapsed = () => {
      const now = Date.now();
      const diffInSeconds = Math.floor(Math.max(0, now - startTime) / 1000);
      
      const hours = Math.floor(diffInSeconds / 3600);
      const minutes = Math.floor((diffInSeconds % 3600) / 60);
      const seconds = diffInSeconds % 60;
      
      if (hours > 0) {
        setElapsedTime(
          `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      } else {
        setElapsedTime(
          `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [startedAt, isCountdown]);

  const displayTime = isCountdown ? remaining : elapsedTime;

  return (
    <div className="flex items-center ml-1">
      <button
        onClick={() => setShowTimer(!showTimer)}
        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
        title="Thời gian phòng họp"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out flex items-center ${showTimer ? 'max-w-[100px] opacity-100 ml-1 mr-2' : 'max-w-0 opacity-0 ml-0 mr-0'}`}
      >
        <span className="text-sm font-medium font-mono text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
          {displayTime}
        </span>
      </div>
    </div>
  );
};

export default DurationView;
