import React, { useMemo } from 'react';

import { useAppSelector } from '../../store';
import { useSharedNotepad } from './hooks/useSharedNotepad';
import { useWhiteboard } from './hooks/useWhiteboard';
import { useExternalMediaPlayer } from './hooks/useExternalMediaPlayer';
import { useDisplayExternalLink } from './hooks/useDisplayExternalLink';
import { useVideosComponent } from './hooks/useVideosComponent';
import { useScreenShareElements } from './hooks/useScreenShareElements';
import { useTranslationTranscription } from './hooks/useTranslationTranscription';
import { useVideoLayout } from './hooks/useVideoLayout';

import AudioElements from '../media-elements/audios';
import LayoutWrapper from './layoutWrapper';
import WebinarStandbyScreen from './webinarStandbyScreen';
import { useInsightsAiTextChat } from './hooks/useInsightsAiTextChat';

interface IMainViewProps {
  isRecorder: boolean;
  isActiveWhiteboard: boolean;
  isActiveExternalMediaPlayer: boolean;
  isActiveDisplayExternalLink: boolean;
  isActiveScreenSharingView: boolean;
  hasScreenShareSubscribers: boolean;
  isActiveWebcamsView: boolean;
  hasVideoSubscribers: boolean;
}

const MainView = ({
  isRecorder,
  isActiveWhiteboard,
  isActiveExternalMediaPlayer,
  isActiveDisplayExternalLink,
  isActiveScreenSharingView,
  hasScreenShareSubscribers,
  isActiveWebcamsView,
  hasVideoSubscribers,
}: IMainViewProps) => {
  // Webinar standby detection
  const currentUserMetadata = useAppSelector((state) => state.session.currentUser?.metadata);
  const roomFeatures = useAppSelector((state) => state.session.currentRoom.metadata?.roomFeatures);
  const spotlightUserIds = useAppSelector((state) => state.roomSettings.spotlightUserIds);

  const isWebinarAttendee = useMemo(() => {
    const adminOnlyWebcams = !!roomFeatures?.adminOnlyWebcams;
    const allowViewOtherWebcams = !!roomFeatures?.allowViewOtherWebcams;
    const isMeetingMode = allowViewOtherWebcams && !adminOnlyWebcams;
    if (isMeetingMode || currentUserMetadata?.isAdmin || currentUserMetadata?.isPresenter) return false;
    // A "Speaker" (attendee with explicitly unlocked permissions) is NOT a passive attendee
    const lock = currentUserMetadata?.lockSettings;
    if (lock?.lockMicrophone === false || lock?.lockWebcam === false) return false;
    return true;
  }, [roomFeatures, currentUserMetadata]);

  const isActiveSharedNotepad = useAppSelector(
    (state) =>
      state.session.currentRoom.metadata?.roomFeatures?.sharedNotePadFeatures
        ?.isActive,
  ) ?? false;

  const hasActiveContent = useMemo(() => {
    const hasSpotlight = spotlightUserIds && spotlightUserIds.length > 0;
    const hasScreenShare = isActiveScreenSharingView && hasScreenShareSubscribers;
    return hasSpotlight || hasScreenShare || isActiveWhiteboard || isActiveExternalMediaPlayer || isActiveDisplayExternalLink || isActiveSharedNotepad;
  }, [spotlightUserIds, isActiveScreenSharingView, hasScreenShareSubscribers, isActiveWhiteboard, isActiveExternalMediaPlayer, isActiveDisplayExternalLink, isActiveSharedNotepad]);

  const showStandbyScreen = isWebinarAttendee && !hasActiveContent;

  const { showVerticalVideoView, showVideoElms, pinnedCamUserIds } = useVideoLayout(
    {
      hasScreenShareSubscribers,
      isActiveWhiteboard,
      isActiveExternalMediaPlayer,
      isActiveDisplayExternalLink,
      isActiveSharedNotepad,
      isActiveWebcamsView,
      hasVideoSubscribers,
    },
  );

  const sharedNotepadElm = useSharedNotepad();
  const insightsAiTextChatElm = useInsightsAiTextChat();
  const whiteboardElm = useWhiteboard(
    isActiveWhiteboard,
    hasScreenShareSubscribers,
    showVideoElms,
  );
  const externalMediaPlayerElm = useExternalMediaPlayer(
    isActiveExternalMediaPlayer,
    hasScreenShareSubscribers,
    isActiveWhiteboard,
    isRecorder,
  );
  const displayExternalLinkElm = useDisplayExternalLink(
    isActiveDisplayExternalLink,
    hasScreenShareSubscribers,
    isActiveWhiteboard,
    isActiveExternalMediaPlayer,
    isRecorder,
  );

  const videosComponentElm = useVideosComponent(
    isActiveWebcamsView,
    showVerticalVideoView,
  );
  const screenShareElementsElm = useScreenShareElements(
    isActiveScreenSharingView,
  );
  const translationTranscriptionElm = useTranslationTranscription();

  return (
    <>
      <LayoutWrapper
        isActiveScreenShare={
          isActiveScreenSharingView && hasScreenShareSubscribers
        }
        showVideoElms={showVideoElms}
        showVerticalVideoView={showVerticalVideoView}
        pinnedCamUserIds={pinnedCamUserIds}
      >
        {showStandbyScreen && <WebinarStandbyScreen />}
        {videosComponentElm}
        {screenShareElementsElm}
        {sharedNotepadElm}
        {insightsAiTextChatElm}
        {whiteboardElm}
        {translationTranscriptionElm}
        {externalMediaPlayerElm}
        {displayExternalLinkElm}
      </LayoutWrapper>
      <AudioElements />
    </>
  );
};

export default MainView;
