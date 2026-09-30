import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { debounce } from 'es-toolkit';

import { store, useAppDispatch, useAppSelector } from '../../store';
import {
  setActiveSidePanel,
  setIsChatPopout,
  setIsParticipantsPopout,
  setIsPollsPopout,
  setIsQAPopout,
  updateIsEnabledExtendedVerticalCamView,
} from '../../store/slices/bottomIconsActivitySlice';

import { useMainAreaState } from './hooks/useMainAreaState';
import { useMainAreaCustomCSS } from './hooks/useMainAreaCustomCSS';
import { triggerRefreshWhiteboard } from '../../store/slices/whiteboard';
import { updateIsSidePanelOpened } from '../../store/slices/roomSettingsSlice';
import { getMediaServerConn } from '../../helpers/livekit/utils';

import ActiveSpeakers from '../active-speakers';
import MainView from './mainView';
import PollsComponent from '../polls';
import ChatComponent from '../chat';
import ParticipantsComponent from '../participants';
import QAPanel from '../webinar-tools/QAPanel';
import SidePanel from './sidePanel';
import PopoutWindow from '../common/popoutWindow';
import WebinarAutomationManager from '../webinar-tools/WebinarAutomationManager';

const MainArea = () => {
  const dispatch = useAppDispatch();
  const mediaServerConn = getMediaServerConn();

  const { isRecorder, roomFeatures } = useMemo(() => {
    const session = store.getState().session;
    const roomFeatures = session.currentRoom.metadata?.roomFeatures;
    return {
      isRecorder: !!session.currentUser?.isRecorder,
      roomFeatures,
    };
  }, []);

  // Reactive webinar attendee detection
  const currentUserMetadata = useAppSelector((state) => state.session.currentUser?.metadata);
  const isWebinarAttendee = useMemo(() => {
    const adminOnlyWebcams = !!roomFeatures?.adminOnlyWebcams;
    const allowViewOtherWebcams = !!roomFeatures?.allowViewOtherWebcams;
    const isMeetingMode = allowViewOtherWebcams && !adminOnlyWebcams;
    return !isMeetingMode && !currentUserMetadata?.isAdmin && !currentUserMetadata?.isPresenter;
  }, [roomFeatures, currentUserMetadata?.isAdmin, currentUserMetadata?.isPresenter]);
  const isNatsServerConnected = useAppSelector(
    (state) => state.roomSettings.isNatsServerConnected,
  );
  const natsPrevioulyState = useRef<boolean>(isNatsServerConnected);

  const isChatPopout = useAppSelector(
    (state) => state.bottomIconsActivity.isChatPopout,
  );
  const isParticipantsPopout = useAppSelector(
    (state) => state.bottomIconsActivity.isParticipantsPopout,
  );
  const isPollsPopout = useAppSelector(
    (state) => state.bottomIconsActivity.isPollsPopout,
  );
  const isQAPopout = useAppSelector(
    (state) => state.bottomIconsActivity.isQAPopout,
  );

  const {
    columnCameraWidth,
    columnCameraPosition,
    activeSidePanel,
    isActiveScreenSharingView,
    hasScreenShareSubscribers,
    isActiveWebcamsView,
    hasVideoSubscribers,
    isActiveWhiteboard,
    isActiveExternalMediaPlayer,
    isActiveDisplayExternalLink,
    screenHeight,
    screenWidth,
    headerVisible,
    footerVisible,
  } = useMainAreaState();

  useEffect(() => {
    if (!roomFeatures?.chatFeatures?.isAllow) {
      // If chat is not allowed and it's the active panel, close it.
      if (store.getState().bottomIconsActivity.activeSidePanel === 'CHAT') {
        dispatch(setActiveSidePanel(null));
      }
    }

    // if recorder then webcam always has extended view
    if (isRecorder) {
      dispatch(updateIsEnabledExtendedVerticalCamView(true));
    }

    // ask for notification permission
    // we'll not bother if permission was rejected before
    if (
      !isRecorder &&
      'Notification' in window &&
      Notification.permission !== 'denied'
    ) {
      Notification.requestPermission().then();
    }
  }, [dispatch, isRecorder, roomFeatures]);

  // Webinar: auto-close PARTICIPANTS panel for attendees
  useEffect(() => {
    if (isWebinarAttendee) {
      const currentPanel = store.getState().bottomIconsActivity.activeSidePanel;
      if (currentPanel === 'PARTICIPANTS') {
        dispatch(setActiveSidePanel(null));
      }
    }
  }, [isWebinarAttendee, dispatch]);

  useEffect(() => {
    if (!mediaServerConn) {
      return;
    }

    const publications = Array.from(
      mediaServerConn.room.localParticipant.trackPublications.values(),
    );

    if (!isNatsServerConnected) {
      // NATS has disconnected. Pause all upstream tracks.
      const pausePromises = publications.map((pub) => pub.pauseUpstream());
      Promise.all(pausePromises).then();
    } else if (isNatsServerConnected && !natsPrevioulyState.current) {
      // NATS has reconnected (was previously false, now true). Resume tracks.
      const resumePromises = publications.map((pub) => pub.resumeUpstream());
      Promise.all(resumePromises).then();
    }

    // Update the ref to prepare for the next change.
    natsPrevioulyState.current = isNatsServerConnected;
  }, [isNatsServerConnected, mediaServerConn]);

  const customCSS = useMainAreaCustomCSS({
    isActiveScreenSharingView,
    hasScreenShareSubscribers,
    isActiveWhiteboard,
    isActiveExternalMediaPlayer,
    isActiveDisplayExternalLink,
    isRecorder,
  });

  const renderMainView = useMemo(() => {
    return (
      <MainView
        isRecorder={isRecorder}
        isActiveWhiteboard={isActiveWhiteboard}
        isActiveExternalMediaPlayer={isActiveExternalMediaPlayer ?? false}
        isActiveDisplayExternalLink={isActiveDisplayExternalLink ?? false}
        isActiveScreenSharingView={isActiveScreenSharingView}
        hasScreenShareSubscribers={hasScreenShareSubscribers}
        isActiveWebcamsView={isActiveWebcamsView}
        hasVideoSubscribers={hasVideoSubscribers}
      />
    );
  }, [
    isRecorder,
    isActiveScreenSharingView,
    hasScreenShareSubscribers,
    isActiveWebcamsView,
    hasVideoSubscribers,
    isActiveDisplayExternalLink,
    isActiveExternalMediaPlayer,
    isActiveWhiteboard,
  ]);

  const debouncedRefresh = useMemo(
    () =>
      debounce(() => {
        dispatch(triggerRefreshWhiteboard());
      }, 500),
    [dispatch],
  );

  const handleSidePanelToggled = useCallback(() => {
    const anyPanelIsOpen =
      store.getState().bottomIconsActivity.activeSidePanel !== null;
    dispatch(updateIsSidePanelOpened(anyPanelIsOpen));

    if (isActiveWhiteboard) {
      debouncedRefresh();
    }

    if (anyPanelIsOpen && !isRecorder) {
      dispatch(updateIsEnabledExtendedVerticalCamView(false));
    }
  }, [dispatch, debouncedRefresh, isActiveWhiteboard, isRecorder]);

  const handleChatPopoutClose = useCallback(() => {
    dispatch(setIsChatPopout(false));
  }, [dispatch]);

  const handleParticipantsPopoutClose = useCallback(() => {
    dispatch(setIsParticipantsPopout(false));
  }, [dispatch]);

  const handlePollsPopoutClose = useCallback(() => {
    dispatch(setIsPollsPopout(false));
  }, [dispatch]);

  const handleQAPopoutClose = useCallback(() => {
    dispatch(setIsQAPopout(false));
  }, [dispatch]);

  const mainAreaClasses = `plugNmeet-app-main-area overflow-hidden relative flex w-full h-full ${customCSS} column-camera-width-${columnCameraWidth} column-camera-position-${columnCameraPosition}`;
  const middleAreaClasses = `middle-area relative transition-all duration-300 w-full ${
    activeSidePanel ? 'pb-[300px] md:pb-0 md:pr-[300px] 3xl:pr-[340px]' : ''
  }`;

  return (
    <div
      id="main-area"
      className={mainAreaClasses}
    >
      <div className="inner flex justify-between rtl:flex-row-reverse flex-1">
        <div className={middleAreaClasses}>
          {isNatsServerConnected && (
            <>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none w-full">
                <ActiveSpeakers activeSidePanel={activeSidePanel} />
              </div>
              {renderMainView}
              <WebinarAutomationManager />
            </>
          )}
        </div>
        
        {/* Participants: render in SidePanel OR PopoutWindow (hidden for webinar attendees) */}
        {!isWebinarAttendee && !isParticipantsPopout && (
          <SidePanel
            isActive={activeSidePanel === 'PARTICIPANTS'}
            panelClass="participants-panel"
            onToggle={handleSidePanelToggled}
          >
            <ParticipantsComponent />
          </SidePanel>
        )}
        {!isWebinarAttendee && isParticipantsPopout && (
          <PopoutWindow
            title="Người tham gia"
            onClose={handleParticipantsPopoutClose}
            width={380}
            height={600}
          >
            <ParticipantsComponent isPopoutWindow={true} />
          </PopoutWindow>
        )}

        {/* Chat: render in SidePanel OR PopoutWindow */}
        {roomFeatures?.chatFeatures?.isAllow && !isChatPopout && (
          <SidePanel
            isActive={activeSidePanel === 'CHAT'}
            panelClass="chat-panel"
            onToggle={handleSidePanelToggled}
          >
            <ChatComponent />
          </SidePanel>
        )}
        {roomFeatures?.chatFeatures?.isAllow && isChatPopout && (
          <PopoutWindow
            title="Trò chuyện"
            onClose={handleChatPopoutClose}
            width={420}
            height={700}
          >
            <ChatComponent isPopoutWindow={true} />
          </PopoutWindow>
        )}

        {roomFeatures?.pollsFeatures?.isAllow && !isPollsPopout && (
          <SidePanel
            isActive={activeSidePanel === 'POLLS'}
            panelClass="polls-panel"
            onToggle={handleSidePanelToggled}
          >
            <PollsComponent />
          </SidePanel>
        )}
        {roomFeatures?.pollsFeatures?.isAllow && isPollsPopout && (
          <PopoutWindow
            title="Bình chọn"
            onClose={handlePollsPopoutClose}
            width={400}
            height={600}
          >
            <PollsComponent isPopoutWindow={true} />
          </PopoutWindow>
        )}

        {/* QA: render in SidePanel OR PopoutWindow */}
        {!isQAPopout && (
          <SidePanel
            isActive={activeSidePanel === 'QA'}
            panelClass="qa-panel"
            onToggle={handleSidePanelToggled}
          >
            <QAPanel />
          </SidePanel>
        )}
        {isQAPopout && (
          <PopoutWindow
            title="Hỏi Đáp (Q&A)"
            onClose={handleQAPopoutClose}
            width={400}
            height={600}
          >
            <QAPanel isPopoutWindow={true} />
          </PopoutWindow>
        )}
      </div>
    </div>
  );
};

export default MainArea;
