import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { DataMsgBodyType } from 'plugnmeet-protocol-js';

import { useAppDispatch, useAppSelector } from '../../../store';
import { addReceivedEmoji } from '../../../store/slices/roomSettingsSlice';
import { getNatsConn } from '../../../helpers/nats';
import { playPopSound } from '../../../helpers/audio/popSound';

const EMOJI_LIST = [
  // Row 1 — Positive / Approval
  { emoji: '👍', label: 'thumbs-up', key: '1' },
  { emoji: '👏', label: 'clap', key: '2' },
  { emoji: '❤️', label: 'heart', key: '3' },
  { emoji: '🎉', label: 'party', key: '4' },
  { emoji: '🔥', label: 'fire', key: '5' },
  { emoji: '💯', label: 'hundred', key: '6' },
  { emoji: '⭐', label: 'star', key: '7' },
  { emoji: '💪', label: 'strong', key: '8' },
  // Row 2 — Expressive / Interactive
  { emoji: '😂', label: 'joy' },
  { emoji: '😮', label: 'surprised' },
  { emoji: '🤔', label: 'thinking' },
  { emoji: '😍', label: 'love-eyes' },
  { emoji: '👀', label: 'eyes' },
  { emoji: '☕', label: 'coffee' },
  { emoji: '🚀', label: 'rocket' },
  { emoji: '✋', label: 'high-five' },
];

const THROTTLE_MS = 150;
const AUTO_CLOSE_MS = 5000;
const MEGA_CHARGE_MS = 600;
const RECENT_STORAGE_KEY = 'pnm_recent_emojis';
const SOUND_STORAGE_KEY = 'pnm_reaction_sound';
const MAX_RECENT = 4;

// Get recent emojis from localStorage
const getRecentEmojis = (): string[] => {
  try {
    const stored = localStorage.getItem(RECENT_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentEmoji = (emoji: string) => {
  try {
    const recent = getRecentEmojis().filter((e) => e !== emoji);
    recent.unshift(emoji);
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch { /* ignore */ }
};

const getSoundEnabled = (): boolean => {
  try {
    const val = localStorage.getItem(SOUND_STORAGE_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
};

const EmojiReactionsButton = () => {
  const dispatch = useAppDispatch();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [lastTappedEmoji, setLastTappedEmoji] = useState<string | null>(null);
  const [chargingEmojiDisplay, setChargingEmojiDisplay] = useState<string | null>(null);
  const [isMegaReadyDisplay, setIsMegaReadyDisplay] = useState(false);
  const [comboCounts, setComboCounts] = useState<Record<string, number>>({});
  const [recentEmojis, setRecentEmojis] = useState<string[]>(getRecentEmojis());
  const [soundEnabled, setSoundEnabled] = useState(getSoundEnabled());

  const currentUser = useAppSelector((state) => state.session.currentUser);
  const userDeviceType = useAppSelector((state) => state.session.userDeviceType);
  const isLockReactionsEnabled = useAppSelector((state) => state.roomSettings.isLockReactionsEnabled);
  const isAdmin = currentUser?.metadata?.isAdmin;

  const triggerRef = useRef<HTMLDivElement>(null);
  const throttleRef = useRef<number>(0);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chargeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chargingEmojiRef = useRef<string | null>(null);
  const isMegaReadyRef = useRef(false);
  const isPickerOpenRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isPickerOpenRef.current = isPickerOpen;
  }, [isPickerOpen]);

  const showTooltip = useMemo(() => userDeviceType === 'desktop', [userDeviceType]);

  const resetAutoClose = useCallback(() => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    autoCloseTimerRef.current = setTimeout(() => setIsPickerOpen(false), AUTO_CLOSE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current);
      if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    };
  }, []);

  const internalSend = useCallback(
    (emoji: string, isMega: boolean) => {
      const conn = getNatsConn();
      if (conn) {
        conn.sendDataMessage(
          DataMsgBodyType.INFO,
          JSON.stringify({
            type: 'emoji_reaction',
            emoji,
            userName: currentUser?.name || 'Me',
            isMega,
          }),
        );
      }

      const emojiData = {
        emoji,
        userId: currentUser?.userId || 'me',
        userName: currentUser?.name || 'Me',
        timestamp: Date.now(),
        isMega,
      };

      dispatch(addReceivedEmoji(emojiData));
      window.dispatchEvent(new CustomEvent('on_new_emoji_reaction', { detail: emojiData }));

      // Visual feedback
      setLastTappedEmoji(emoji);
      if (bounceTimerRef.current) clearTimeout(bounceTimerRef.current);
      bounceTimerRef.current = setTimeout(() => setLastTappedEmoji(null), 300);

      // Sound
      if (soundEnabled) {
        playPopSound(isMega ? 1.0 : 0.4);
      }

      // Save to recent
      saveRecentEmoji(emoji);
      setRecentEmojis(getRecentEmojis());

      resetAutoClose();
    },
    [dispatch, currentUser, resetAutoClose, soundEnabled],
  );

  // Keyboard shortcuts (1-8 = row 1 emojis) — only when picker is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPickerOpenRef.current) return;
      // Don't intercept if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const keyNum = parseInt(e.key, 10);
      if (keyNum >= 1 && keyNum <= 8) {
        e.preventDefault();
        const emoji = EMOJI_LIST[keyNum - 1].emoji;
        const now = Date.now();
        if (now - throttleRef.current >= THROTTLE_MS) {
          throttleRef.current = now;
          internalSend(emoji, false);
          setComboCounts((prev) => ({ [emoji]: (prev[emoji] || 0) + 1 }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [internalSend]);

  const handlePointerDown = useCallback((emoji: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    chargingEmojiRef.current = emoji;
    isMegaReadyRef.current = false;
    setChargingEmojiDisplay(emoji);
    setIsMegaReadyDisplay(false);

    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    chargeTimerRef.current = setTimeout(() => {
      if (chargingEmojiRef.current === emoji) {
        isMegaReadyRef.current = true;
        setIsMegaReadyDisplay(true);
        if (soundEnabled) playPopSound(0.15);
      }
    }, MEGA_CHARGE_MS);
  }, [soundEnabled]);

  const handlePointerUp = useCallback((emoji: string, e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);

    if (chargingEmojiRef.current === emoji) {
      if (isMegaReadyRef.current) {
        internalSend(emoji, true);
        setComboCounts({});
      } else {
        const now = Date.now();
        if (now - throttleRef.current >= THROTTLE_MS) {
          throttleRef.current = now;
          internalSend(emoji, false);
          setComboCounts((prev) => ({ [emoji]: (prev[emoji] || 0) + 1 }));
        }
      }
    }

    chargingEmojiRef.current = null;
    isMegaReadyRef.current = false;
    setChargingEmojiDisplay(null);
    setIsMegaReadyDisplay(false);
  }, [internalSend]);

  const handlePointerLeave = useCallback(() => {
    if (chargeTimerRef.current) clearTimeout(chargeTimerRef.current);
    chargingEmojiRef.current = null;
    isMegaReadyRef.current = false;
    setChargingEmojiDisplay(null);
    setIsMegaReadyDisplay(false);
  }, []);

  const toggleSound = useCallback(() => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem(SOUND_STORAGE_KEY, String(newVal));
  }, [soundEnabled]);

  const getPickerStyle = useCallback((): React.CSSProperties => {
    if (!triggerRef.current) return {};
    const rect = triggerRef.current.getBoundingClientRect();
    const pickerWidth = 370;
    let left = rect.left + rect.width / 2 - pickerWidth / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - pickerWidth - 8));
    return {
      position: 'fixed' as const,
      bottom: window.innerHeight - rect.top + 10,
      left,
      width: pickerWidth,
    };
  }, []);

  const handleOpenPicker = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isLockReactionsEnabled || isAdmin) {
        const newState = !isPickerOpen;
        setIsPickerOpen(newState);
        if (newState) {
          resetAutoClose();
          setComboCounts({});
          setRecentEmojis(getRecentEmojis());
        }
      }
    },
    [isLockReactionsEnabled, isAdmin, isPickerOpen, resetAutoClose],
  );

  const renderEmojiButton = (emoji: string, label: string, shortcutKey?: string) => {
    const isChargingThis = chargingEmojiDisplay === emoji;
    const combo = comboCounts[emoji] || 0;

    return (
      <div key={label} className="relative flex justify-center items-center">
        {combo > 1 && !isChargingThis && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none animate-emoji-bounce">
            <span className="text-[10px] font-black text-white bg-Blue dark:bg-Blue2-500 px-1 rounded-sm shadow-sm">
              x{combo}
            </span>
          </div>
        )}
        <button
          onPointerDown={(e) => handlePointerDown(emoji, e)}
          onPointerUp={(e) => handlePointerUp(emoji, e)}
          onPointerLeave={handlePointerLeave}
          onContextMenu={(e) => e.preventDefault()}
          className={`relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-xl md:text-2xl rounded-xl transition-all duration-150 cursor-pointer
            ${isChargingThis && isMegaReadyDisplay ? 'bg-Red-50 dark:bg-Red-500/20 scale-125 shake' : ''}
            ${isChargingThis && !isMegaReadyDisplay ? 'bg-Blue/20 dark:bg-Blue2-500/30 scale-110' : ''}
            ${!isChargingThis ? 'hover:bg-Blue/10 dark:hover:bg-Blue2-500/15 active:scale-90' : ''}
            ${lastTappedEmoji === emoji && !isChargingThis ? 'animate-emoji-bounce bg-Blue/10 dark:bg-Blue2-500/15' : ''}
          `}
          title={label}
        >
          <span className={`transition-transform duration-300 ${isChargingThis && isMegaReadyDisplay ? 'scale-150 drop-shadow-md' : ''}`}>
            {emoji}
          </span>
          {shortcutKey && (
            <span className="absolute -bottom-0.5 right-0.5 text-[7px] text-Gray-400 dark:text-Gray-600 font-mono leading-none">
              {shortcutKey}
            </span>
          )}
        </button>
      </div>
    );
  };

  return (
    <>
      <div className="emoji-reactions relative">
        {isPickerOpen && (
          <>
            <div className="fixed inset-0 z-[9997]" onClick={() => setIsPickerOpen(false)} />
            <div
              className="z-[9999] bg-white/98 dark:bg-dark-secondary/98 backdrop-blur-xl rounded-2xl shadow-virtual-pOP border border-Gray-200/50 dark:border-Gray-700/50 p-3 select-none touch-none"
              style={getPickerStyle()}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-xs font-bold uppercase tracking-widest text-Blue dark:text-Blue2-500">
                  Thả cảm xúc
                </span>
                <span className="text-[9px] text-Gray-400 dark:text-Gray-500 font-medium ml-auto hidden sm:block">
                  Giữ lâu → Siêu cảm xúc
                </span>
                {/* Sound Toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleSound(); }}
                  className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-Gray-100 dark:hover:bg-Gray-700 transition-colors cursor-pointer"
                  title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
                >
                  <span className="text-xs">{soundEnabled ? '🔊' : '🔇'}</span>
                </button>
              </div>

              {/* Recent Emojis Row */}
              {recentEmojis.length > 0 && (
                <div className="flex items-center gap-1 mb-1.5 px-0.5">
                  <span className="text-[8px] text-Gray-400 dark:text-Gray-500 font-medium uppercase tracking-wider mr-1">Gần đây</span>
                  {recentEmojis.map((emoji, i) =>
                    renderEmojiButton(emoji, `recent-${i}`)
                  )}
                  <div className="flex-1 h-px bg-Gray-200/50 dark:bg-Gray-700/50 ml-1"></div>
                </div>
              )}

              {/* Main Emoji Grid — 8 cols × 2 rows */}
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_LIST.map((item) =>
                  renderEmojiButton(item.emoji, item.label, item.key)
                )}
              </div>
            </div>
          </>
        )}

        {/* Trigger Button */}
        <div
          ref={triggerRef}
          className={`relative footer-icon cursor-pointer w-9 md:w-10 3xl:w-11 h-9 md:h-10 3xl:h-11 rounded-[10px] md:rounded-[12px] 3xl:rounded-[15px] border-[2px] 3xl:border-[3px] ${isPickerOpen ? 'border-[rgba(124,206,247,0.25)] dark:border-Gray-800' : 'border-transparent'} ${(isLockReactionsEnabled && !isAdmin) ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleOpenPicker}
        >
          <div
            className={`footer-icon-bg h-full w-full flex items-center justify-center rounded-[8px] md:rounded-[10px] 3xl:rounded-[12px] border border-Gray-300 dark:border-Gray-700 shadow transition-all duration-300 hover:bg-gray-100 dark:hover:bg-Gray-700 text-Gray-950 dark:text-white ${
              showTooltip ? 'has-tooltip' : ''
            } ${isPickerOpen ? 'bg-gray-100 dark:bg-Gray-700' : 'bg-white dark:bg-Gray-800'}`}
          >
            <span className="tooltip">Cảm xúc</span>
            <span className="text-sm md:text-base 3xl:text-lg">😀</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmojiReactionsButton;
