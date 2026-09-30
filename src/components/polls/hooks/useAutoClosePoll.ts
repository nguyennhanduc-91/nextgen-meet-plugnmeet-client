import { useEffect, useRef, useCallback, useState } from 'react';
import { useEndPoll } from './useEndPoll';

/**
 * Hook quản lý tự động đóng bình chọn theo thời gian hẹn giờ.
 * Lưu deadline vào localStorage để giữ được khi F5.
 */
export const useAutoClosePoll = (
  pollId: string,
  isRunning: boolean,
  syncedDeadline?: number | null,
) => {
  const { endPoll } = useEndPoll();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const storageKey = `poll_timer_${pollId}`;

  // Check if there's a saved deadline for this poll
  const getDeadline = useCallback((): number | null => {
    // Priority 1: Synced deadline from Host
    if (syncedDeadline) return syncedDeadline;

    // Priority 2: Local storage (for Host)
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const deadline = parseInt(raw, 10);
    if (isNaN(deadline)) return null;
    return deadline;
  }, [storageKey, syncedDeadline]);

  // Save a new deadline
  const setDeadline = useCallback(
    (durationMinutes: number) => {
      if (durationMinutes <= 0) return;
      const deadline = Date.now() + durationMinutes * 60 * 1000;
      localStorage.setItem(storageKey, deadline.toString());
    },
    [storageKey],
  );

  // Clear the deadline
  const clearDeadline = useCallback(() => {
    localStorage.removeItem(storageKey);
    setRemainingSeconds(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [storageKey]);

  // Start the countdown tick
  useEffect(() => {
    if (!isRunning) {
      // Poll already closed, clean up
      clearDeadline();
      return;
    }

    const deadline = getDeadline();
    if (!deadline) return;

    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((deadline - now) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        // Time's up — auto close
        endPoll(pollId);
        clearDeadline();
      }
    };

    // Immediately tick once
    tick();

    // Then tick every second
    timerRef.current = setInterval(tick, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, pollId, getDeadline, clearDeadline, endPoll]);

  // Format remaining time as mm:ss
  const formatTime = useCallback((totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  return {
    remainingSeconds,
    formattedTime: formatTime(remainingSeconds),
    setDeadline,
    clearDeadline,
    hasTimer: remainingSeconds > 0,
  };
};
