import React, { useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { addReceivedEmoji } from '../../store/slices/roomSettingsSlice';

interface FloatingEmoji {
  id: number;
  emoji: string;
  userName: string;
  x: number;
  startTime: number;
  variant: 1 | 2 | 3;
  duration: number;
  scale: number;
  isMega?: boolean;
  isStorm?: boolean;
  delay?: number; // Precalculated delay for storm emojis
}

interface BurstParticle {
  id: number;
  emoji: string;
  burstIndex: number;
  x: number;
  y: number;
  startTime: number;
}

const FLOAT_DURATION_MIN = 2800;
const FLOAT_DURATION_MAX = 4200;
const BURST_DURATION = 700;
const CLEANUP_INTERVAL = 400;
const STORM_THRESHOLD = 5;
const STORM_WINDOW_MS = 3000;

const ReactionOverlay = () => {
  const dispatch = useAppDispatch();
  const receivedEmoji = useAppSelector((state) => state.roomSettings.receivedEmoji);
  const currentUser = useAppSelector((state) => state.session.currentUser);
  const [activeEmojis, setActiveEmojis] = useState<FloatingEmoji[]>([]);
  const [burstParticles, setBurstParticles] = useState<BurstParticle[]>([]);
  const [isStormActive, setIsStormActive] = useState(false);
  const idCounter = useRef(0);
  const recentTimestamps = useRef<number[]>([]);
  const stormTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkStorm = () => {
    const now = Date.now();
    recentTimestamps.current = recentTimestamps.current.filter(
      (t) => now - t < STORM_WINDOW_MS,
    );
    recentTimestamps.current.push(now);

    if (recentTimestamps.current.length >= STORM_THRESHOLD && !isStormActive) {
      triggerStorm();
    }
  };

  const triggerStorm = () => {
    setIsStormActive(true);

    const stormEmojis = ['🎉', '🔥', '❤️', '👏', '⭐', '💯', '🚀', '😍'];
    const newStormEmojis: FloatingEmoji[] = [];
    for (let i = 0; i < 15; i++) {
      newStormEmojis.push({
        id: idCounter.current++,
        emoji: stormEmojis[Math.floor(Math.random() * stormEmojis.length)],
        userName: '',
        x: 5 + Math.random() * 90,
        startTime: Date.now(),
        variant: (Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3,
        duration: 2500 + Math.random() * 1500,
        scale: 0.6 + Math.random() * 0.6,
        isStorm: true,
        delay: Math.random() * 800, // Precalculate delay here
      });
    }
    setActiveEmojis((prev) => [...prev, ...newStormEmojis]);

    if (stormTimerRef.current) clearTimeout(stormTimerRef.current);
    stormTimerRef.current = setTimeout(() => {
      setIsStormActive(false);
    }, 4000);
  };

  useEffect(() => {
    if (receivedEmoji) {
      checkStorm();

      const isMega = receivedEmoji.isMega;
      const variant = isMega ? 3 : ((Math.floor(Math.random() * 3) + 1) as 1 | 2 | 3);
      const duration = isMega
        ? 3500
        : FLOAT_DURATION_MIN + Math.random() * (FLOAT_DURATION_MAX - FLOAT_DURATION_MIN);
      const scale = isMega
        ? 3.5 + Math.random() * 1.0
        : 0.9 + Math.random() * 0.35;

      const newEmoji: FloatingEmoji = {
        id: idCounter.current++,
        emoji: receivedEmoji.emoji,
        userName: receivedEmoji.userName,
        x: isMega ? 45 + Math.random() * 10 : 8 + Math.random() * 84,
        startTime: Date.now(),
        variant,
        duration,
        scale,
        isMega,
      };

      setActiveEmojis((prev) => [...prev, newEmoji]);

      const isSelf =
        receivedEmoji.userId === currentUser?.userId ||
        receivedEmoji.userId === 'me';

      if (isSelf || isMega) {
        const numParticles = isMega ? 8 : 3 + Math.floor(Math.random() * 3);
        const burstX = isMega ? newEmoji.x : 50;
        const burstY = window.innerHeight - (isMega ? window.innerHeight / 2 : 60);
        const newBursts: BurstParticle[] = [];
        for (let i = 0; i < numParticles; i++) {
          newBursts.push({
            id: idCounter.current++,
            emoji: receivedEmoji.emoji,
            burstIndex: (i % 5) + 1,
            x: burstX + (Math.random() - 0.5) * 20,
            y: burstY,
            startTime: Date.now(),
          });
        }
        setBurstParticles((prev) => [...prev, ...newBursts]);
      }

      dispatch(addReceivedEmoji(null));
    }
  }, [receivedEmoji, dispatch, currentUser]);

  // Cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveEmojis((prev) =>
        prev.filter((e) => now - e.startTime < e.duration + 500),
      );
      setBurstParticles((prev) =>
        prev.filter((p) => now - p.startTime < BURST_DURATION),
      );
    }, CLEANUP_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[10000] overflow-hidden">
      {/* Storm banner */}
      {isStormActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[10001] animate-emoji-bounce">
          <div className="bg-gradient-to-r from-Red-400 via-Red-600 to-Red-400 text-white text-xs font-black uppercase tracking-widest px-5 py-1.5 rounded-full shadow-xl border border-white/20">
            🔥 Bão Cảm Xúc! 🔥
          </div>
        </div>
      )}

      {/* Floating Emojis (normal + mega) */}
      {activeEmojis.filter((e) => !e.isStorm).map((item) => (
        <div
          key={item.id}
          className={`absolute flex flex-col items-center animate-emoji-float-${item.variant} bottom-0`}
          style={{
            left: `${item.x}%`,
            marginBottom: '60px',
            '--emoji-duration': `${item.duration}ms`,
          } as React.CSSProperties}
        >
          <span
            className={`${item.isMega ? 'shake drop-shadow-2xl' : ''}`}
            style={{
              fontSize: item.isMega ? '5rem' : undefined,
              transform: `scale(${item.scale})`,
            }}
          >
            <span className={`${item.isMega ? '' : 'text-3xl md:text-4xl'}`}>
              {item.emoji}
            </span>
          </span>
          <span
            className="text-[8px] font-medium text-Gray-600 dark:text-Gray-400 whitespace-nowrap mt-0.5 opacity-0 animate-fade-in-out max-w-[60px] truncate"
            style={{ '--emoji-duration': `${item.duration}ms` } as React.CSSProperties}
          >
            {item.userName}
          </span>
        </div>
      ))}

      {/* Storm Emojis (rain down from top) */}
      {activeEmojis.filter((e) => e.isStorm).map((item) => (
        <div
          key={item.id}
          className="absolute animate-emoji-rain top-0"
          style={{
            left: `${item.x}%`,
            '--emoji-duration': `${item.duration}ms`,
            animationDelay: `${item.delay}ms`,
          } as React.CSSProperties}
        >
          <span style={{ transform: `scale(${item.scale})` }} className="text-2xl md:text-3xl">
            {item.emoji}
          </span>
        </div>
      ))}

      {/* Burst Particles */}
      {burstParticles.map((particle) => (
        <span
          key={particle.id}
          className={`absolute text-2xl animate-burst-${particle.burstIndex}`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}px`,
          }}
        >
          {particle.emoji}
        </span>
      ))}
    </div>
  );
};

export default ReactionOverlay;
