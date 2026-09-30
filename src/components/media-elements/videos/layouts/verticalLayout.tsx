import React, { ReactElement, useCallback, useEffect, useRef, useState } from 'react';
import { Track, VideoTrack, ParticipantEvent } from 'livekit-client';

import { useAppDispatch, useAppSelector } from '../../../../store';
import { updateIsEnabledExtendedVerticalCamView, updateIsActivePiPWebcams } from '../../../../store/slices/bottomIconsActivitySlice';
import { ArrowRight } from '../../../../assets/Icons/ArrowRight';
import { VideoParticipantProps } from '../videoParticipant';
import { usePiPDetector } from '../../../../helpers/hooks/usePiPDetector';
import { useDeviceInfo } from '../helpers/useDeviceInfo';

const PIP_WINDOW_HEIGHT = 600,
  PIP_WINDOW_WIDTH = 280;

interface IVerticalLayoutProps {
  allParticipants: ReactElement<VideoParticipantProps>[];
  participantsToRender: Array<ReactElement>;
  pinParticipants?: ReactElement[];
  totalNumWebcams: number;
  currentPage: number;
  isSidebarOpen: boolean;
  isEnabledExtendedVerticalCamView: boolean;
  isDesktop: boolean;
}

const VerticalLayout = ({
  allParticipants,
  participantsToRender,
  pinParticipants,
  totalNumWebcams,
  currentPage,
  isSidebarOpen,
  isEnabledExtendedVerticalCamView,
  isDesktop,
}: IVerticalLayoutProps) => {
  const dispatch = useAppDispatch();
  const pipWindowRef = useRef<Window | null>(null);
  const tracksToDetachRef = useRef<
    { track: VideoTrack; videoElm: HTMLVideoElement }[]
  >([]);
  const pipCleanupCallbacksRef = useRef<(() => void)[]>([]);
  const { isLandscape } = useDeviceInfo();
  const isSmallLandscape = !isDesktop && isLandscape;
  const [isMinimized, setIsMinimized] = useState(false);
  const { isCustomPipActive, isNativePipActive, isAnyPipActive } = usePiPDetector();
  const maxNumDisplayWebcams = useAppSelector(
    (state) => state.roomSettings.maxNumDisplayWebcams,
  );

  const toggleExtendedVerticalCamView = useCallback(() => {
    dispatch(
      updateIsEnabledExtendedVerticalCamView(!isEnabledExtendedVerticalCamView),
    );
  }, [dispatch, isEnabledExtendedVerticalCamView]);

  const renderPipView = useCallback(
    (participants: ReactElement<VideoParticipantProps>[]) => {
      const pipWindow = pipWindowRef.current;
      if (!pipWindow) return;

      // First, clear previous content & detach old tracks
      while (pipWindow.document.body.firstChild) {
        pipWindow.document.body.removeChild(pipWindow.document.body.firstChild);
      }
      tracksToDetachRef.current.forEach(({ track, videoElm }) => {
        track.detach(videoElm);
      });
      tracksToDetachRef.current = [];
      pipCleanupCallbacksRef.current.forEach((cb) => cb());
      pipCleanupCallbacksRef.current = [];

      // Now create a grid container for dynamic layout
      const container = document.createElement('div');
      container.style.display = 'grid';
      container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(140px, 1fr))';
      container.style.gridAutoRows = '1fr';
      container.style.gap = '4px';
      container.style.width = '100%';
      container.style.height = '100%';
      container.style.alignContent = 'center';
      container.style.padding = '4px';
      container.style.boxSizing = 'border-box';
      pipWindow.document.body.appendChild(container);

      // Determine max webcams to show in PiP (default to 24 if not set)
      const maxPipWebcams = maxNumDisplayWebcams && maxNumDisplayWebcams > 0 ? maxNumDisplayWebcams : 24;

      // Finally iterate through participants, create video elements, and attach tracks
      participants.slice(0, maxPipWebcams).forEach((p) => {
        const participant = p.props.participant;
        const videoTrack = participant.getTrackPublication(
          Track.Source.Camera,
        )?.videoTrack;

        if (videoTrack) {
          const wrapper = document.createElement('div');
          wrapper.style.position = 'relative';
          wrapper.style.width = '100%';
          wrapper.style.height = '100%';
          wrapper.style.backgroundColor = '#111';
          wrapper.style.borderRadius = '8px';
          wrapper.style.overflow = 'hidden';
          wrapper.style.display = 'flex';
          wrapper.style.flexDirection = 'column';

          const video = document.createElement('video');
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'cover';
          video.style.display = 'block';
          video.autoplay = true;
          video.muted = true;
          video.title = p.props.participant.name ?? '';
          videoTrack.attach(video);
          
          const overlay = document.createElement('div');
          overlay.style.position = 'absolute';
          overlay.style.bottom = '8px';
          overlay.style.left = '8px';
          overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
          overlay.style.color = '#fff';
          overlay.style.padding = '4px 8px';
          overlay.style.borderRadius = '6px';
          overlay.style.fontSize = '13px';
          overlay.style.fontFamily = 'system-ui, sans-serif';
          overlay.style.display = 'flex';
          overlay.style.alignItems = 'center';
          overlay.style.gap = '6px';
          overlay.style.zIndex = '10';

          const micSvgUnmuted = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>`;
          const micSvgMuted = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" x2="22" y1="2" y2="22"></line><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"></path><path d="M5 10v2a7 7 0 0 0 12 5"></path><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"></path><path d="M9 9v3a3 3 0 0 0 5.12 2.12"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>`;

          const updateOverlay = () => {
            const micTrack = participant.getTrackPublication(Track.Source.Microphone);
            const isMicMuted = !micTrack || micTrack.isMuted;
            const micIconColor = isMicMuted ? '#ef4444' : '#10b981';

            overlay.innerHTML = `
              <span style="display: flex; align-items: center; color: ${micIconColor};">
                ${isMicMuted ? micSvgMuted : micSvgUnmuted}
              </span>
              <span style="font-weight: 500; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">${participant.name ?? ''}</span>
            `;
          };

          // Initial overlay setup
          updateOverlay();

          // Listen for mute/unmute events in real-time
          const handleMicChange = () => {
            updateOverlay();
          };
          participant.on(ParticipantEvent.TrackMuted, handleMicChange);
          participant.on(ParticipantEvent.TrackUnmuted, handleMicChange);

          pipCleanupCallbacksRef.current.push(() => {
            participant.off(ParticipantEvent.TrackMuted, handleMicChange);
            participant.off(ParticipantEvent.TrackUnmuted, handleMicChange);
          });

          wrapper.appendChild(video);
          wrapper.appendChild(overlay);
          container.appendChild(wrapper);

          tracksToDetachRef.current.push({
            track: videoTrack,
            videoElm: video,
          });
        }
      });
    },
    [maxNumDisplayWebcams],
  );

  const openPip = useCallback(async () => {
    try {
      const pipWindow = await (
        window as any
      ).documentPictureInPicture.requestWindow({
        width: PIP_WINDOW_WIDTH,
        height: PIP_WINDOW_HEIGHT,
      });
      pipWindowRef.current = pipWindow;

      // Set base styles for the PiP window
      pipWindow.document.documentElement.style.height = '100%';
      pipWindow.document.body.style.height = '100%';
      pipWindow.document.body.style.margin = '0';
      pipWindow.document.body.style.background = '#000';

      // Initial render
      renderPipView(allParticipants);
      dispatch(updateIsActivePiPWebcams(true));

      // When the Picture-in-Picture window closes, detach all tracks.
      pipWindow.addEventListener('pagehide', () => {
        tracksToDetachRef.current.forEach(({ track, videoElm }) => {
          track.detach(videoElm);
        });
        tracksToDetachRef.current = [];
        pipCleanupCallbacksRef.current.forEach((cb) => cb());
        pipCleanupCallbacksRef.current = [];
        pipWindowRef.current = null;
        dispatch(updateIsActivePiPWebcams(false));
      });
    } catch (error) {
      console.error('Failed to open PiP window:', error);
    }
  }, [allParticipants, renderPipView, dispatch]);

  useEffect(() => {
    // If PiP window is open, re-render its content when participants change
    if (pipWindowRef.current) {
      renderPipView(allParticipants);
    }
  }, [allParticipants, renderPipView]);

  useEffect(() => {
    // clean everything up when the component unmounts
    return () => {
      if (pipWindowRef.current) {
        tracksToDetachRef.current.forEach(({ track, videoElm }) => {
          track.detach(videoElm);
        });
        pipCleanupCallbacksRef.current.forEach((cb) => cb());
        pipCleanupCallbacksRef.current = [];
        pipWindowRef.current.close();
        pipWindowRef.current = null;
      }
    };
  }, []);

  const wrapperClasses = `vertical-webcams-wrapper group absolute transition-all duration-300 z-30 ${
    isSmallLandscape 
      ? `is-floating right-4 bottom-16 rounded-xl shadow-2xl overflow-hidden border border-white/20 backdrop-blur-md bg-black/40 ${isMinimized ? 'w-10 h-10' : 'w-40 h-auto p-1'}`
      : `right-0 bottom-0 xl:bottom-auto xl:top-0 border-t xl:border-t-0 xl:border-l h-[126px] lg:h-[200px] xl:h-full ${
          isAnyPipActive ? 'xl:w-0 xl:border-0 p-0 overflow-hidden pointer-events-none' : 'bg-Gray-25 dark:bg-dark-primary border-Gray-200 dark:border-Gray-800 p-3'
        }`
  } ${
    isEnabledExtendedVerticalCamView && !isAnyPipActive && !isSmallLandscape
      ? 'w-full xl:w-[416px] flex flex-col justify-center extended-view-wrap'
      : (isAnyPipActive || isSmallLandscape) ? '' : 'w-full xl:w-[212px] not-extended'
  }`;

  const hasPinned = pinParticipants && pinParticipants.length > 0;

  const innerClasses = `inner row-count-${
    participantsToRender.length
  } total-cam-${totalNumWebcams} group-total-cam-${
    totalNumWebcams
  } page-${currentPage} ${
    isEnabledExtendedVerticalCamView
      ? 'flex gap-3 h-full xl:flex-col justify-center w-full'
      : `flex justify-center gap-3 z-20 ${isSmallLandscape ? 'flex-col h-auto w-full' : 'h-full xl:flex-col'}`
  } ${hasPinned ? 'has-pin-cam' : ''} ${
    isCustomPipActive || (isSmallLandscape && isMinimized) ? 'hidden' : isNativePipActive ? 'opacity-0 pointer-events-none' : ''
  }`;

  return (
    <div className={wrapperClasses}>
      {isSmallLandscape && (
        <button 
          onClick={() => setIsMinimized(!isMinimized)}
          className={`absolute z-50 flex items-center justify-center bg-black/60 text-white rounded-full transition-all duration-300 ${
            isMinimized ? 'w-full h-full' : 'top-1 right-1 w-6 h-6 hover:bg-black/80'
          }`}
        >
          <i className={`icon ${isMinimized ? 'pnm-video' : 'pnm-close'} text-[12px]`} />
        </button>
      )}
      {(window as any).documentPictureInPicture && (
        <button
          className="cam-pip cursor-pointer w-7 h-7 rounded-full bg-Gray-950/50 shadow-shadowXS flex items-center justify-center absolute top-2 right-2 z-50 opacity-0 group-hover:opacity-100 transition-all duration-300"
          onClick={openPip}
          title="Picture-in-Picture"
        >
          <i className="icon pnm-pip text-[14px] text-white" />
        </button>
      )}
      <div className={innerClasses}>
        {React.Children.map(participantsToRender, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as ReactElement, {
              key: `sidebar-${child.key}`,
            });
          }
          return child;
        })}
      </div>
      {isDesktop && !isSidebarOpen && !isAnyPipActive && (
        <button
          onClick={toggleExtendedVerticalCamView}
          className="extend-button cursor-pointer absolute top-1/2 -translate-y-1/2 left-0 w-5 h-10 rounded-l-lg hidden xl:flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:-left-5 bg-white/90 dark:bg-Gray-800/90 backdrop-blur-sm border border-Gray-200 dark:border-Gray-700 border-r-0 shadow-md hover:bg-Blue2-50 dark:hover:bg-Gray-700 text-Gray-600 dark:text-Gray-300 hover:text-Blue dark:hover:text-Blue2-500"
        >
          <span
            className={`${
              isEnabledExtendedVerticalCamView ? '' : 'rotate-180'
            }`}
          >
            <ArrowRight />
          </span>
        </button>
      )}
    </div>
  );
};

export default VerticalLayout;
