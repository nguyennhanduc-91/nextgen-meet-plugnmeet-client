import React, { useEffect, useState, useRef } from 'react';

interface EmojiDisplay {
  emoji: string;
  id: number;
}

interface IVideoEmojiReactionProps {
  userId: string;
}

const VideoEmojiReaction = ({ userId }: IVideoEmojiReactionProps) => {
  const [activeEmoji, setActiveEmoji] = useState<EmojiDisplay | null>(null);
  const idRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleReaction = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.userId === userId) {
        const newId = idRef.current++;
        setActiveEmoji({ emoji: detail.emoji, id: newId });

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setActiveEmoji(null);
        }, 2500);
      }
    };

    window.addEventListener('on_new_emoji_reaction', handleReaction);
    return () => {
      window.removeEventListener('on_new_emoji_reaction', handleReaction);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [userId]);

  if (!activeEmoji) return null;

  return (
    <div
      key={activeEmoji.id}
      className="absolute top-3 right-3 z-20 animate-emoji-bounce pointer-events-none"
    >
      <div className="bg-black/40 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-lg border border-white/10">
        <span className="text-2xl">{activeEmoji.emoji}</span>
      </div>
    </div>
  );
};

export default VideoEmojiReaction;
