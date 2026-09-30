import { useMemo } from 'react';
import { useAppSelector } from '../../../store';
import { useDeviceInfo } from '../../media-elements/videos/helpers/useDeviceInfo';

interface IUseVideoLayoutParams {
  hasScreenShareSubscribers: boolean;
  isActiveWhiteboard: boolean;
  isActiveExternalMediaPlayer: boolean;
  isActiveDisplayExternalLink: boolean;
  isActiveSharedNotepad: boolean;
  isActiveWebcamsView: boolean;
  hasVideoSubscribers: boolean;
}

export const useVideoLayout = ({
  hasScreenShareSubscribers,
  isActiveWhiteboard,
  isActiveExternalMediaPlayer,
  isActiveDisplayExternalLink,
  isActiveSharedNotepad,
  isActiveWebcamsView,
  hasVideoSubscribers,
}: IUseVideoLayoutParams) => {
  const pinnedCamUserIds = useAppSelector(
    (state) => state.roomSettings.pinnedCamUserIds,
  );
  const hideNonVideoParticipants = useAppSelector(
    (state) => state.roomSettings.hideNonVideoParticipants,
  );

  const showVerticalVideoView = useMemo(
    () =>
      hasScreenShareSubscribers ||
      isActiveWhiteboard ||
      isActiveExternalMediaPlayer ||
      isActiveDisplayExternalLink ||
      isActiveSharedNotepad,
    [
      hasScreenShareSubscribers,
      isActiveWhiteboard,
      isActiveExternalMediaPlayer,
      isActiveDisplayExternalLink,
      isActiveSharedNotepad,
    ],
  );

  const showVideoElms = useMemo(
    () => isActiveWebcamsView && (hasVideoSubscribers || !hideNonVideoParticipants),
    [isActiveWebcamsView, hasVideoSubscribers, hideNonVideoParticipants],
  );

  const { isMobile, isPortrait } = useDeviceInfo();
  const isMobileLandscape = isMobile && !isPortrait;

  return { showVerticalVideoView, showVideoElms, pinnedCamUserIds, isMobileLandscape };
};
