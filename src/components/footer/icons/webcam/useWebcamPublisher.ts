import { useCallback, useRef } from 'react';
import {
  createLocalVideoTrack,
  LocalTrackPublication,
  Track,
} from 'livekit-client';

import { useAppDispatch } from '../../../../store';
import { getMediaServerConnRoom } from '../../../../helpers/livekit/utils';
import { getWebcamResolution } from '../../../../helpers/utils';
import { updateIsActiveWebcam } from '../../../../store/slices/bottomIconsActivitySlice';
import {
  BackgroundConfig,
  createVirtualBackgroundProcessor,
  TwilioBackgroundProcessor,
} from '../../../../helpers/libs/TrackProcessor';

// [GLOBAL LOCK FIX]: Ngăn chặn Double-Publish khi 2 component WebcamIcon (Mobile & Desktop) mount cùng lúc.
let globalIsPublishingWebcam = false;

const useWebcamPublisher = () => {
  const dispatch = useAppDispatch();
  const room = getMediaServerConnRoom();

  const replaceTrack = useCallback(
    async (newTrack: MediaStreamTrack): Promise<boolean> => {
      if (!room || globalIsPublishingWebcam) return false;
      let replaced = false;
      globalIsPublishingWebcam = true;

      const publications = room.localParticipant.getTrackPublications();
      for (let i = 0; i < publications.length; i++) {
        const pub = publications[i] as LocalTrackPublication;
        if (pub.source === Track.Source.Camera && pub.track) {
          newTrack.enabled = true;
          await pub.track.replaceTrack(newTrack, {
            userProvidedTrack: true,
          });
          replaced = true;
          break;
        }
      }
      globalIsPublishingWebcam = false;
      return replaced;
    },
    [room],
  );

  const unpublishWebcam = useCallback(async () => {
    if (!room || globalIsPublishingWebcam) return;
    globalIsPublishingWebcam = true;
    const publications = room.localParticipant.getTrackPublications();
    for (let i = 0; i < publications.length; i++) {
      const pub = publications[i] as LocalTrackPublication;
      if (pub.source === Track.Source.Camera && pub.track) {
        pub.track.stop();
        await room.localParticipant.unpublishTrack(pub.track, true);
      }
    }
    dispatch(updateIsActiveWebcam(false));
    globalIsPublishingWebcam = false;
  }, [room, dispatch]);

  /**
   * publishNewTrack will end any of the previous tracks,
   * don't use this for replacement
   */
  const publishNewTrack = useCallback(
    async (
      deviceId: string,
      mediaStreamTrack?: MediaStreamTrack,
      virtualBackground?: BackgroundConfig,
    ) => {
      if (!room || globalIsPublishingWebcam) return;
      globalIsPublishingWebcam = true;

      const publications = room.localParticipant.getTrackPublications();
      for (let i = 0; i < publications.length; i++) {
        const pub = publications[i] as LocalTrackPublication;
        if (pub.source === Track.Source.Camera && pub.track) {
          await room.localParticipant.unpublishTrack(pub.track, true);
        }
      }

      const resolution = getWebcamResolution();
      if (deviceId !== '') {
        let processor: TwilioBackgroundProcessor | undefined;

        // Apply aspect ratio from user settings (selected in Advanced Camera modal)
        if (virtualBackground && virtualBackground.aspectRatio && virtualBackground.aspectRatio !== 'default') {
          const [w, h] = virtualBackground.aspectRatio.split('/').map(Number);
          resolution.aspectRatio = w / h;
          resolution.width = 1280;
          resolution.height = Math.round(1280 / (w / h));
        }

        // Only use TrackProcessor for actual virtual backgrounds (blur/image).
        // Beautify is now handled via CSS filter on the video element — zero CPU cost.
        const hasVirtualBg = virtualBackground && virtualBackground.type !== 'none';

        if (hasVirtualBg) {
          processor = createVirtualBackgroundProcessor(virtualBackground);
          // Twilio AI segmentation requires lower resolution for stable performance
          resolution.height = 540;
          resolution.width = 960;
          resolution.frameRate = 24;
          resolution.aspectRatio = undefined;
        }

        // [ANTI DOUBLE-PUBLISH BUG]: Ngăn chặn publish 2 cái camera cùng lúc!
        const existingVideoTracks = Array.from(room.localParticipant.videoTrackPublications.values());
        if (existingVideoTracks.length > 0) {
          console.warn("[WEBCAM] Phát hiện đã có Video Track, chặn không publish track thứ 2!");
          dispatch(updateIsActiveWebcam(true));
          globalIsPublishingWebcam = false;
          return;
        }

        let track: LocalVideoTrack;
        try {
          track = await createLocalVideoTrack({
            deviceId: { exact: deviceId, ideal: deviceId },
            resolution,
            processor,
          });
        } catch (error: any) {
          console.warn("[WEBCAM] Expected constraints failed, retrying with fallback...", error);
          // Fallback: Remove strict deviceId constraint and custom resolution
          track = await createLocalVideoTrack({
            facingMode: 'user',
            processor,
          });
        }
        
        await room.localParticipant.publishTrack(track, {
          source: Track.Source.Camera,
        });
      } else if (mediaStreamTrack) {
        // assuming we are not using virtual background
        await room.localParticipant.publishTrack(mediaStreamTrack, {
          source: Track.Source.Camera,
        });
      } else {
        console.error('webcam publishing was not successful');
        globalIsPublishingWebcam = false;
        return;
      }

      dispatch(updateIsActiveWebcam(true));
      globalIsPublishingWebcam = false;
    },
    [dispatch, room],
  );

  return {
    publishNewTrack,
    replaceTrack,
    unpublishWebcam,
  };
};

export default useWebcamPublisher;
