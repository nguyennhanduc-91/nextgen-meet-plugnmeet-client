import React, { memo } from 'react';

import Avatar from './avatar';
import ParticipantName from './name';
import RaiseHandIcon from './icons/raiseHand';
import MicIcon from './icons/mic';
import WebcamIcon from './icons/webcam';
import ScreenShareIcon from './icons/screenShare';
import MenuIcon from './icons/menu';
import VisibilityIcon from './icons/visibility';
import PresenterIcon from './icons/presenterIcon';
import SpotlightIcon from './icons/spotlight';
import WaitingApproval from './waitingApproval';

import { useAppSelector } from '../../../store';
import { ICurrentUser } from '../../../store/slices/interfaces/session';
import { IVisibleParticipantInfo } from '../../../store/slices/interfaces/participant';
import { selectIsSpeakingByUserId } from '../../../store/slices/activeSpeakersSlice';

interface IParticipantComponentProps {
  participant: IVisibleParticipantInfo;
  currentUser: ICurrentUser | undefined;
  isRemoteParticipant: boolean;
  openRemoveParticipantAlert(name: string, userId: string, type: string): void;
}

const ParticipantComponent = ({
  participant,
  currentUser,
  isRemoteParticipant,
  openRemoveParticipantAlert,
}: IParticipantComponentProps) => {
  const isSpeaking = useAppSelector(
    selectIsSpeakingByUserId(participant.userId),
  );

  const onOpenRemoveParticipantAlert = (user_id: string, type: string) => {
    if (user_id === participant.userId) {
      openRemoveParticipantAlert(participant.name, user_id, type);
    }
  };

  return (
    <div
      className={`flex items-center justify-between relative w-full gap-2 px-2 py-1.5 rounded-xl transition-all duration-300 ${
        isSpeaking
          ? 'bg-Green-50/60 dark:bg-Green-900/15 ring-1 ring-Green-300/50 dark:ring-Green-500/30'
          : 'hover:bg-Gray-50 dark:hover:bg-Gray-800/40'
      }`}
    >
      <div className="left flex items-center gap-2 3xl:gap-[10px] min-w-0">
        {/* Avatar with speaking indicator ring */}
        <div className="relative shrink-0">
          <Avatar participant={participant} />
          {isSpeaking && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-Green-500 border-2 border-white dark:border-dark-primary animate-pulse" />
          )}
        </div>
        <ParticipantName
          name={participant.name}
          isCurrentUser={currentUser?.userId === participant.userId}
        />
      </div>
      <div className="right flex items-center justify-end gap-0.5">
        <RaiseHandIcon userId={participant.userId} />
        <SpotlightIcon userId={participant.userId} />
        <VisibilityIcon userId={participant.userId} />
        <PresenterIcon userId={participant.userId} />
        <ScreenShareIcon userId={participant.userId} />
        <WebcamIcon userId={participant.userId} />
        <MicIcon
          userId={participant.userId}
          isRemoteParticipant={isRemoteParticipant}
          isSpeaking={isSpeaking}
        />
        {(currentUser?.userId !== participant.userId || currentUser?.metadata?.isAdmin) && (
          <MenuIcon
            userId={participant.userId}
            name={participant.name}
            isAdmin={participant.isAdmin}
            openRemoveParticipantAlert={onOpenRemoveParticipantAlert}
          />
        )}
      </div>
      {currentUser?.metadata?.isAdmin && (
        <WaitingApproval
          userId={participant.userId}
          name={participant.name}
          openRemoveParticipantAlert={onOpenRemoveParticipantAlert}
        />
      )}
    </div>
  );
};

export default memo(ParticipantComponent);

