import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../../store';

/**
 * LowerThirdOverlay - Broadcast-style speaker name & title overlay.
 * Only visible when the presenter is NOT sharing any content (whiteboard,
 * screen share, notepad, etc.) to avoid overlapping shared content.
 * Positioned INSIDE the main-area container (not fixed to viewport).
 */
const LowerThirdOverlay = () => {
  const lowerThird = useAppSelector((s) => s.roomSettings.activeLowerThird);
  const isActiveWhiteboard = useAppSelector(
    (s) => s.bottomIconsActivity.isActiveWhiteboard || !!s.session.currentRoom.metadata?.roomFeatures?.whiteboardFeatures?.visible,
  );
  const isActiveSharedNotePad = useAppSelector(
    (s) => s.bottomIconsActivity.isActiveSharedNotePad || !!s.session.currentRoom.metadata?.roomFeatures?.sharedNotePadFeatures?.isActive,
  );
  const isSomeoneScreenSharing = useAppSelector((s) => s.session.screenSharing.isActive);
  const isActiveScreenshare = useAppSelector((s) => s.bottomIconsActivity.isActiveScreenshare) || isSomeoneScreenSharing;
  const isActiveExternalMediaPlayer = useAppSelector(
    (s) => !!s.session.currentRoom.metadata?.roomFeatures?.externalMediaPlayerFeatures?.isActive,
  );
  const isActiveDisplayExternalLink = useAppSelector(
    (s) => !!s.session.currentRoom.metadata?.roomFeatures?.displayExternalLinkFeatures?.isActive,
  );

  const isSharingSomething =
    isActiveWhiteboard ||
    isActiveSharedNotePad ||
    isActiveScreenshare ||
    isActiveExternalMediaPlayer ||
    isActiveDisplayExternalLink;

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lowerThird && !isSharingSomething) {
      const t = setTimeout(() => setVisible(true), 80);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [lowerThird, isSharingSomething]);

  if (!lowerThird || isSharingSomething) return null;

  return (
    <div
      className={`absolute bottom-4 left-4 z-[9997] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible
          ? 'opacity-100 translate-x-0 translate-y-0'
          : 'opacity-0 -translate-x-8 translate-y-2'
      }`}
    >
      <div className="flex items-stretch overflow-hidden rounded-md shadow-lg shadow-black/30">
        {/* Accent bar */}
        <div className="w-[3px] bg-gradient-to-b from-indigo-400 via-violet-500 to-fuchsia-500 shrink-0" />

        {/* Content */}
        <div className="bg-slate-900/85 backdrop-blur-xl pl-2.5 pr-3.5 py-1 border border-white/[0.06] border-l-0">
          <p className="text-[12px] sm:text-[13px] font-semibold text-white leading-tight tracking-tight">
            {lowerThird.name}
          </p>
          {lowerThird.title && (
            <p className="text-[9px] sm:text-[10px] font-medium text-indigo-300/80 mt-[1px] leading-tight">
              {lowerThird.title}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LowerThirdOverlay;
