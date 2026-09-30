import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { store, useAppDispatch, useAppSelector } from '../../store';
import { updateShowTeleprompter } from '../../store/slices/bottomIconsActivitySlice';

/**
 * Teleprompter - A draggable floating widget that auto-scrolls script text.
 * Only visible to Admin/Host users.
 */
const Teleprompter = () => {
  const currentUserMetadata = useAppSelector((state) => state.session.currentUser?.metadata);
  const roomMode = useAppSelector((state) => state.session.currentRoom.metadata?.roomFeatures?.roomMode);
  const isMeetingMode = roomMode === 'normal' || roomMode === undefined;
  const canUseTeleprompter = !!currentUserMetadata?.isAdmin || !!currentUserMetadata?.isPresenter || isMeetingMode;

  const dispatch = useAppDispatch();
  const isOpen = useAppSelector((state) => state.bottomIconsActivity.showTeleprompter);

  const [script, setScript] = useState('');
  const [isScrolling, setIsScrolling] = useState(false);
  const [speed, setSpeed] = useState(2); // pixels per frame tick
  const [fontSize, setFontSize] = useState(18);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const [isEditing, setIsEditing] = useState(true);

  // Draggable state
  const [pos, setPos] = useState({ x: 20, y: 100 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
    };
    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      setPos({
        x: dragRef.current.originX + (ev.clientX - dragRef.current.startX),
        y: dragRef.current.originY + (ev.clientY - dragRef.current.startY),
      });
    };
    const handleMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const startScroll = useCallback(() => {
    if (!scrollRef.current) return;
    setIsScrolling(true);
    const tick = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop += speed * 0.5;
        // Stop at the end
        if (scrollRef.current.scrollTop >= scrollRef.current.scrollHeight - scrollRef.current.clientHeight) {
          setIsScrolling(false);
          return;
        }
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, [speed]);

  const stopScroll = useCallback(() => {
    setIsScrolling(false);
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  const resetScroll = useCallback(() => {
    stopScroll();
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [stopScroll]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Toggle scroll
  const toggleScroll = () => {
    if (isScrolling) {
      stopScroll();
    } else {
      setIsEditing(false);
      startScroll();
    }
  };

  if (!canUseTeleprompter) return null;

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-[9996]"
      style={{ left: pos.x, top: pos.y }}
    >
      <div className="w-[340px] sm:w-[420px] bg-slate-900/95 backdrop-blur-2xl rounded-2xl border border-emerald-500/30 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Title Bar (draggable) */}
        <div
          className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-emerald-900/80 to-teal-900/80 cursor-move select-none border-b border-emerald-500/20"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">Teleprompter</span>
          </div>
          <button
            onClick={() => { stopScroll(); dispatch(updateShowTeleprompter(false)); }}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleScroll}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isScrolling
                  ? 'bg-red-500 text-white'
                  : 'bg-emerald-500 text-white hover:bg-emerald-400'
              }`}
            >
              {isScrolling ? '⏸ Dừng' : '▶ Chạy'}
            </button>
            <button
              onClick={resetScroll}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 text-white/70 hover:bg-white/20 transition-all"
            >
              ↺ Lại đầu
            </button>
            <button
              onClick={() => { stopScroll(); setIsEditing(true); }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/10 text-white/70 hover:bg-white/20 transition-all"
            >
              ✎ Sửa
            </button>
          </div>
        </div>

        {/* Speed & Font Controls */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/40 font-semibold">Tốc độ</span>
            <input
              type="range"
              min={1}
              max={8}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-16 h-1 accent-emerald-500"
            />
            <span className="text-[10px] text-emerald-400 font-mono w-5">{speed}x</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-white/40 font-semibold">Cỡ chữ</span>
            <button onClick={() => setFontSize(Math.max(12, fontSize - 2))} className="w-5 h-5 rounded bg-white/10 text-white/60 text-xs flex items-center justify-center hover:bg-white/20">-</button>
            <span className="text-[10px] text-white/60 font-mono w-5 text-center">{fontSize}</span>
            <button onClick={() => setFontSize(Math.min(32, fontSize + 2))} className="w-5 h-5 rounded bg-white/10 text-white/60 text-xs flex items-center justify-center hover:bg-white/20">+</button>
          </div>
        </div>

        {/* Script Area */}
        {isEditing ? (
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Dán kịch bản của bạn vào đây...&#10;&#10;Mỗi dòng sẽ cuộn lên từ từ để bạn đọc tự nhiên trước camera."
            className="w-full h-[200px] sm:h-[260px] bg-black/40 text-white px-4 py-3 text-sm resize-none outline-none placeholder-white/30 font-medium leading-relaxed"
            style={{ fontSize: fontSize }}
          />
        ) : (
          <div
            ref={scrollRef}
            className="w-full h-[200px] sm:h-[260px] bg-black/60 text-white px-4 py-3 overflow-y-auto scroll-smooth"
            style={{ fontSize: fontSize }}
          >
            {/* Top spacer so text starts from middle */}
            <div className="h-[100px]" />
            <div className="whitespace-pre-wrap font-medium leading-[2] tracking-wide">
              {script || 'Chưa có kịch bản. Bấm "Sửa" để nhập nội dung.'}
            </div>
            {/* Bottom spacer */}
            <div className="h-[150px]" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Teleprompter;
