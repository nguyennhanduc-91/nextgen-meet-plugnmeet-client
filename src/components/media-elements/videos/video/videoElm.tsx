import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { LocalTrackPublication, RemoteTrackPublication } from 'livekit-client';

import { useAppSelector } from '../../../../store';
import { LoadingIcon } from '../../../../assets/Icons/Loading';
import './style.css';

interface IVideoElmProps {
  track: RemoteTrackPublication | LocalTrackPublication;
  isPinned?: boolean;
  isLocal?: boolean;
}

const VideoElm = forwardRef<HTMLVideoElement, IVideoElmProps>(
  ({ track, isPinned, isLocal }, fRef) => {
    const ref = useRef<HTMLVideoElement>(null);
    useImperativeHandle(fRef, () => ref.current!, []);

    const roomVideoQuality = useAppSelector(
      (state) => state.roomSettings.roomVideoQuality,
    );
    const videoObjectFit = useAppSelector(
      (state) => state.roomSettings.videoObjectFit,
    );
    const isNatsServerConnected = useAppSelector(
      (state) => state.roomSettings.isNatsServerConnected,
    );
    const isWatermarkEnabled = useAppSelector(
      (state) => state.roomSettings.isWatermarkEnabled,
    );
    const roomTitle = useAppSelector(
      (state) => state.session.currentRoom.metadata?.roomTitle,
    );

    // Read beautify & mirror settings for local camera only
    const virtualBackground = useAppSelector(
      (state) => state.bottomIconsActivity.virtualBackground,
    );

    const videoFit = useMemo(() => {
      if (isPinned) return 'contain';
      return track.trackName === 'canvas' ? 'contain' : videoObjectFit;
    }, [track.trackName, videoObjectFit, isPinned]);

    // CSS filter & transform for local user's camera (beautify + mirror)
    const localVideoStyle = useMemo((): React.CSSProperties => {
      if (!isLocal) return { objectFit: videoFit };

      const style: React.CSSProperties = { objectFit: videoFit };

      // Mirror (local preview only — other participants see the un-mirrored version)
      if (virtualBackground.isMirrored) {
        style.transform = 'scaleX(-1)';
      }

      // Beautify via CSS filter — GPU-accelerated, zero CPU cost
      const level = virtualBackground.beautifyLevel;
      if (level && level !== 'none') {
        if (level === 'low') {
          style.filter = 'brightness(1.05) contrast(1.02) saturate(1.1)';
        } else if (level === 'medium') {
          style.filter = 'brightness(1.1) contrast(1.05) saturate(1.15)';
        } else if (level === 'high') {
          style.filter = 'brightness(1.15) contrast(1.08) saturate(1.2)';
        }
      }

      return style;
    }, [isLocal, videoFit, virtualBackground.isMirrored, virtualBackground.beautifyLevel]);

    const [loaded, setLoaded] = useState<boolean>();
    const onLoadedData = useCallback(() => setLoaded(true), []);

    useEffect(() => {
      const el = ref.current;
      if (el) {
        track.videoTrack?.attach(el);
      }

      return () => {
        if (el) {
          track.videoTrack?.detach(el);
        }
      };
    }, [track]);

    useEffect(() => {
      if (track instanceof RemoteTrackPublication) {
        track.setVideoQuality(roomVideoQuality);
      }
    }, [roomVideoQuality, track]);

    useEffect(() => {
      const el = ref.current;
      if (!el) {
        return;
      }
      if (!isNatsServerConnected) {
        el.pause();
      } else if (isNatsServerConnected && el.paused) {
        el.play().catch((e) => console.error('video play failed', e.message));
      }
    }, [isNatsServerConnected]);

    return (
      <>
        {!loaded && (
          <div className="loading-status absolute flex h-full w-full items-center justify-center bg-black/50">
            <LoadingIcon
              className="inline h-8 w-8 animate-spin text-gray-200"
              fillColor="var(--color-primary-color)"
            />
          </div>
        )}
        <video
          className="camera-video"
          onLoadedData={onLoadedData}
          ref={ref}
          style={localVideoStyle}
        />
        {isWatermarkEnabled && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30 select-none overflow-hidden">
            <div className="transform -rotate-45 text-white text-xl md:text-3xl font-bold uppercase tracking-widest whitespace-nowrap drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              {roomTitle || 'Bản quyền Thanh Nguyen'}
            </div>
          </div>
        )}
      </>
    );
  },
);

export default VideoElm;
