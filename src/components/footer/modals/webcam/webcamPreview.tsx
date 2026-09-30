import React, { useEffect, useMemo, useRef } from 'react';
import { createLocalVideoTrack, LocalVideoTrack } from 'livekit-client';

import { useAppSelector } from '../../../../store';
import {
  createVirtualBackgroundProcessor,
  TwilioBackgroundProcessor,
} from '../../../../helpers/libs/TrackProcessor';
import { getWebcamResolution } from '../../../../helpers/utils';

interface WebcamPreviewProps {
  deviceId: string;
}

const WebcamPreview = ({ deviceId }: WebcamPreviewProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const localVideoTrack = useRef<LocalVideoTrack | null>(null);

  const virtualBackground = useAppSelector(
    (state) => state.bottomIconsActivity.virtualBackground,
  );

  // Only recreate track when device, aspect ratio, or virtual background type/url/blur changes
  // Beautify and mirror are handled purely via CSS — zero performance cost
  const hasVirtualBg = virtualBackground.type !== 'none';
  const trackConfigKey = `${deviceId}-${virtualBackground.aspectRatio}-${hasVirtualBg}-${virtualBackground.url}-${virtualBackground.blurRadius}`;

  useEffect(() => {
    if (deviceId && videoRef.current) {
      // stop the previous track before creating a new one
      if (localVideoTrack.current) {
        localVideoTrack.current.detach();
        localVideoTrack.current.stop();
      }

      let processor: TwilioBackgroundProcessor | undefined;
      const resolution = getWebcamResolution();

      // Apply selected aspect ratio
      if (virtualBackground.aspectRatio && virtualBackground.aspectRatio !== 'default') {
        const [w, h] = virtualBackground.aspectRatio.split('/').map(Number);
        resolution.aspectRatio = w / h;
        resolution.width = 1280;
        resolution.height = Math.round(1280 / (w / h));
      } else {
        resolution.aspectRatio = 16 / 9;
      }

      // Only use TrackProcessor for actual virtual backgrounds (blur/image)
      // Beautify is handled by CSS filter on the <video> element — no processor needed
      if (hasVirtualBg) {
        processor = createVirtualBackgroundProcessor(virtualBackground);
        // Twilio AI segmentation model needs lower resolution to avoid CPU overload
        resolution.width = 960;
        resolution.height = virtualBackground.aspectRatio === '3/4' ? 1280
          : virtualBackground.aspectRatio === '1/1' ? 960
          : 540;
        resolution.frameRate = 24;
      }

      createLocalVideoTrack({
        deviceId,
        resolution,
        processor,
      }).then((track) => {
        localVideoTrack.current = track;
        if (videoRef.current) {
          localVideoTrack.current.attach(videoRef.current);
        }
      });
    }

    return () => {
      if (localVideoTrack.current) {
        localVideoTrack.current.stopProcessor(false).then(() => {
          localVideoTrack.current?.detach();
          localVideoTrack.current?.stop();
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackConfigKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (localVideoTrack.current) {
        localVideoTrack.current.stopProcessor(false).then(() => {
          localVideoTrack.current?.detach();
          localVideoTrack.current?.stop();
        });
      }
    };
  }, []);

  // Beautify + Mirror are pure CSS — instant, GPU-accelerated, no lag
  const videoStyle = useMemo(() => {
    const style: React.CSSProperties = {};

    // Mirror
    const transforms: string[] = [];
    if (virtualBackground.isMirrored) {
      transforms.push('scaleX(-1)');
    }
    if (transforms.length > 0) {
      style.transform = transforms.join(' ');
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
  }, [virtualBackground.isMirrored, virtualBackground.beautifyLevel]);

  return (
    <video
      ref={videoRef}
      className="w-full h-full object-cover"
      style={videoStyle}
      autoPlay
      muted
    />
  );
};

export default WebcamPreview;
