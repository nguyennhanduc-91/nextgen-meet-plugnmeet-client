import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import {
  LocalParticipant,
  RemoteAudioTrack,
  RemoteParticipant,
} from 'livekit-client';

import AudioElm from './audio';
import { CurrentConnectionEvents } from '../../../helpers/livekit/types';
import { getMediaServerConn } from '../../../helpers/livekit/utils';
import { toPlugNmeetUserId } from '../../../helpers/utils';

import { useAppSelector } from '../../../store';

const AudioElements = () => {
  const [audioSubscribers, setAudioSubscribers] =
    useState<Map<string, RemoteParticipant | LocalParticipant>>();
  const currentConnection = getMediaServerConn();

  const currentUserMetadata = useAppSelector((state) => state.session.currentUser?.metadata);
  const roomFeatures = useAppSelector((state) => state.session.currentRoom.metadata?.roomFeatures);
  const spotlightUserIds = useAppSelector((state) => state.roomSettings.spotlightUserIds);
  const screenSharing = useAppSelector((state) => state.session.screenSharing);

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

  const isLive = useMemo(() => {
    const hasSpotlight = spotlightUserIds && spotlightUserIds.length > 0;
    const hasScreenShare = screenSharing.isActive;
    return hasSpotlight || hasScreenShare;
  }, [spotlightUserIds, screenSharing.isActive]);

  useEffect(() => {
    if (currentConnection.audioSubscribersMap.size) {
      setAudioSubscribers(currentConnection.audioSubscribersMap);
    }
    currentConnection.on(
      CurrentConnectionEvents.AudioSubscribers,
      setAudioSubscribers,
    );
    return () => {
      currentConnection.off(
        CurrentConnectionEvents.AudioSubscribers,
        setAudioSubscribers,
      );
    };
  }, [currentConnection]);

  return useMemo(() => {
    if (!audioSubscribers) {
      return null;
    }
    
    // BACKSTAGE MODE: If it's a webinar attendee and the event is not live, hear nothing.
    if (isWebinarAttendee && !isLive) {
      return null;
    }

    const elms: Array<ReactElement> = [];
    audioSubscribers.forEach((participant) => {
      participant.audioTrackPublications.forEach((track) => {
        if (track.audioTrack && track.audioTrack instanceof RemoteAudioTrack) {
          const userId = toPlugNmeetUserId(participant.identity);
          elms.push(
            <AudioElm
              userId={userId}
              audioTrack={track.audioTrack}
              key={track.trackSid}
            />,
          );
        }
      });
    });

    return elms;
  }, [audioSubscribers, isWebinarAttendee, isLive]);
};

export default AudioElements;
