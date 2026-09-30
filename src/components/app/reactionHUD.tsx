import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ReceivedEmoji } from '../../store/slices/interfaces/roomSettings';

const HUD_FADE_DELAY = 10000; // Stay visible 10s after last reaction

const ReactionHUD = () => {
  const [emojiCounts, setEmojiCounts] = useState<Record<string, number>>({});
  const [isVisible, setIsVisible] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        setEmojiCounts({});
        setTotalCount(0);
      }, 600);
    }, HUD_FADE_DELAY);
  }, []);

  useEffect(() => {
    const handleNewEmoji = (e: Event) => {
      const customEvent = e as CustomEvent<ReceivedEmoji>;
      const { emoji, isMega } = customEvent.detail;
      const weight = isMega ? 5 : 1;

      setEmojiCounts((prev) => ({
        ...prev,
        [emoji]: (prev[emoji] || 0) + weight,
      }));
      setTotalCount((prev) => prev + weight);
      setIsVisible(true);
      scheduleHide();
    };

    window.addEventListener('on_new_emoji_reaction', handleNewEmoji);
    return () => {
      window.removeEventListener('on_new_emoji_reaction', handleNewEmoji);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [scheduleHide]);

  if (!isVisible || totalCount === 0) return null;

  const topEmojis = Object.entries(emojiCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  return (
    <div
      className={`fixed top-20 right-4 md:right-8 z-[9999] pointer-events-none transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}
    >
      <div className="bg-black/60 dark:bg-black/80 backdrop-blur-md rounded-2xl py-1.5 px-3 flex items-center gap-3 shadow-xl border border-white/10">
        {topEmojis.map(([emoji, count]) => (
          <div key={emoji} className="flex items-center gap-0.5">
            <span className="text-base">{emoji}</span>
            <span className="text-white text-[11px] font-bold tabular-nums">{count}</span>
          </div>
        ))}

        {totalCount > 5 && (
          <>
            <div className="w-px h-4 bg-white/20"></div>
            <span className="text-white/70 text-[10px] font-bold tabular-nums">
              Σ {totalCount}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default ReactionHUD;
