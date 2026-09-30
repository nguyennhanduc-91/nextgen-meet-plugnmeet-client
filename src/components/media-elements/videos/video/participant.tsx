import React from 'react';
import { useAppSelector } from '../../../../store';
import RaisedHand from './raisedHand';
import VideoEmojiReaction from './videoEmojiReaction';

export interface IParticipantProps {
  userId: string;
  name: string;
  isLocal: boolean;
}

const Participant = ({ userId, name, isLocal }: IParticipantProps) => {
  const activeLowerThird = useAppSelector((state) => state.roomSettings.activeLowerThird);
  
  const isSharingSomething = useAppSelector((s) => {
    const isActiveWhiteboard = s.bottomIconsActivity.isActiveWhiteboard || !!s.session.currentRoom.metadata?.roomFeatures?.whiteboardFeatures?.visible;
    const isActiveSharedNotePad = s.bottomIconsActivity.isActiveSharedNotePad || !!s.session.currentRoom.metadata?.roomFeatures?.sharedNotePadFeatures?.isActive;
    const isSomeoneScreenSharing = s.session.screenSharing.isActive;
    const isActiveScreenshare = s.bottomIconsActivity.isActiveScreenshare || isSomeoneScreenSharing;
    const isActiveExternalMediaPlayer = !!s.session.currentRoom.metadata?.roomFeatures?.externalMediaPlayerFeatures?.isActive;
    const isActiveDisplayExternalLink = !!s.session.currentRoom.metadata?.roomFeatures?.displayExternalLinkFeatures?.isActive;
    
    return isActiveWhiteboard || isActiveSharedNotePad || isActiveScreenshare || isActiveExternalMediaPlayer || isActiveDisplayExternalLink;
  });

  const shouldHideName = activeLowerThird && !isSharingSomething;

  return (
    <>
      <VideoEmojiReaction userId={userId} />
      <div className={`name w-full absolute capitalize bottom-4 left-0 px-4 text-sm font-medium text-white z-10 flex items-center gap-2 justify-between transition-opacity duration-300 ${shouldHideName ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {name} {isLocal && '(me)'}
        <RaisedHand userId={userId} />
      </div>
    </>
  );
};

export default Participant;
