import React, { useMemo } from 'react';

import { store, useAppSelector } from '../../store';
import WebcamIcon from './icons/webcam';
import MicrophoneIcon from './icons/microphone';
import ChatIcon from './icons/chat';
import ParticipantIcon from './icons/participant';
import RaiseHandIcon from './icons/raisehand';
import ScreenshareIcon from './icons/screenshare';
import MenusIcon from './icons/menus';
import SharedNotePadIcon from './icons/sharedNotePad';
import WhiteboardIcon from './icons/whiteboard';
import EmojiReactionsButton from './icons/emojiReactions';
import BreakoutRoomInvitation from '../breakout-room/breakoutRoomInvitation';
import EndMeetingButton from './icons/endMeeting';
import RecordingIcon from './icons/recording';
import PollsIcon from './icons/polls';
import Translation from './icons/translation';
import InsightsAiTextChatIcon from './icons/insightAiTextChat';
import FocusModeIcon from './icons/focusMode';
import QAIcon from './icons/qa';

const Footer = () => {
  const visibleFooter = useAppSelector(
    (state) => state.roomSettings.visibleFooter,
  );
  const currentUser = useAppSelector((state) => state.session.currentUser);
  const currentRoom = useAppSelector((state) => state.session.currentRoom);
  
  const {
    isAdmin,
    isPresenter,
    isRecorder,
    allowChat,
    showMic,
    showWebcam,
    showScreenshare,
    isWebinarAttendee,
  } = useMemo(() => {
    const adminOnlyWebcams = !!currentRoom.metadata?.roomFeatures?.adminOnlyWebcams;
    const allowViewOtherWebcams = !!currentRoom.metadata?.roomFeatures?.allowViewOtherWebcams;
    const isMeetingMode = allowViewOtherWebcams && !adminOnlyWebcams;

    const isAdminUser = !!currentUser?.metadata?.isAdmin;
    const isPresenterUser = !!currentUser?.metadata?.isPresenter;
    const lockSettings = currentUser?.metadata?.lockSettings;

    // Webinar Attendee = anyone who is NOT admin AND NOT presenter in Webinar mode.
    // This controls visibility of "tools" (whiteboard, participant list, notepad, etc.)
    // A "Speaker" (attendee with unlocked mic) is still an attendee for tool purposes.
    const isAttendee = !isMeetingMode && !isAdminUser && !isPresenterUser;

    // Media button visibility:
    // - Meeting mode: everyone sees all
    // - Admin/Presenter: always sees all
    // - Webinar Attendee: only sees buttons for explicitly unlocked permissions
    const hasMicPermission = isAttendee ? !(lockSettings?.lockMicrophone ?? true) : true;
    const hasWebcamPermission = isAttendee ? !(lockSettings?.lockWebcam ?? true) : true;
    const hasScreensharePermission = isAttendee ? !(lockSettings?.lockScreenSharing ?? true) : true;

    return {
      isAdmin: isAdminUser,
      isPresenter: isPresenterUser,
      isRecorder: !!currentUser?.isRecorder,
      allowChat: !!currentRoom.metadata?.roomFeatures?.chatFeatures?.isAllow,
      showMic: isMeetingMode || isAdminUser || isPresenterUser || hasMicPermission,
      showWebcam: isMeetingMode || isAdminUser || isPresenterUser || hasWebcamPermission,
      showScreenshare: isMeetingMode || isAdminUser || isPresenterUser || hasScreensharePermission,
      isWebinarAttendee: isAttendee,
    };
  }, [currentRoom.metadata?.roomFeatures, currentUser?.metadata, currentUser?.isRecorder]);

  return (
    <footer
      id="main-footer"
      onClick={(e) => e.stopPropagation()}
      className={`relative w-full px-1 md:px-3 flex items-center justify-between bg-white dark:bg-dark-primary backdrop-blur-xl h-[36px] md:h-[42px] 3xl:h-[52px] border-t border-Gray-200/40 dark:border-Gray-800/40 transition-transform duration-300 z-[100] ${
        isRecorder ? 'hidden' : ''
      } ${!visibleFooter ? 'translate-y-full' : 'translate-y-0'}`}
    >
      <div className="footer-inner flex items-center justify-center md:justify-between w-full rtl:flex-row-reverse flex-nowrap overflow-visible gap-1 md:gap-0 h-full">
        <div className="footer-left min-w-max hidden md:flex items-center gap-0.5 relative z-50 rtl:justify-end">
          <MicrophoneIcon showButton={showMic} />
          <WebcamIcon showButton={showWebcam} />
          {(showMic || showWebcam) && (
            <div className="h-5 w-px bg-Gray-200 dark:bg-Gray-700 mx-1"></div>
          )}
        </div>

        <div className="footer-middle flex items-center gap-0.5 overflow-x-auto overflow-y-visible! no-scrollbar whitespace-nowrap px-1 h-full">
          <div className="flex md:hidden items-center gap-0.5">
            <MicrophoneIcon showButton={showMic} />
            <WebcamIcon showButton={showWebcam} />
          </div>
          {showScreenshare && <ScreenshareIcon />}
          {!isWebinarAttendee && <WhiteboardIcon />}
          <RaiseHandIcon />
          <EmojiReactionsButton />
          {!isWebinarAttendee && <SharedNotePadIcon />}
          <PollsIcon />
          <Translation />
          <InsightsAiTextChatIcon />
          <RecordingIcon />
          {!isWebinarAttendee && (
            <div className="icon scale-90 md:hidden flex-shrink-0 overflow-visible">
              <ParticipantIcon />
            </div>
          )}
          {allowChat && (
            <div className="icon scale-90 md:hidden flex-shrink-0 overflow-visible">
              <ChatIcon />
            </div>
          )}
          <div className="icon scale-90 md:hidden flex-shrink-0 overflow-visible">
            <QAIcon />
          </div>
          <MenusIcon isAdmin={isAdmin} isPresenter={isPresenter} />
          <div className="icon scale-90 md:hidden flex-shrink-0 overflow-visible">
            <FocusModeIcon />
          </div>
          <div className="icon scale-90 md:hidden flex-shrink-0 overflow-visible">
            <EndMeetingButton />
          </div>
        </div>

        <div className="footer-right min-w-max hidden md:flex items-center justify-end gap-0.5">
          <div className="h-5 w-px bg-Gray-200 dark:bg-Gray-700 mx-1"></div>
          {!isWebinarAttendee && <ParticipantIcon />}
          {allowChat && <ChatIcon />}
          <QAIcon />
          <div className="h-5 w-px bg-Gray-200 dark:bg-Gray-700 mx-1"></div>
          <FocusModeIcon />
          <EndMeetingButton />
        </div>
        <BreakoutRoomInvitation />
      </div>
    </footer>
  );
};

export default React.memo(Footer);
