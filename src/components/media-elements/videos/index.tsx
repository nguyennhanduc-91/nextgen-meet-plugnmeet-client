import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { LocalParticipant, RemoteParticipant, Track, RoomEvent } from 'livekit-client';
import { concat } from 'es-toolkit/compat';

import { store, useAppDispatch, useAppSelector } from '../../../store';
import VideoLayout from './videoLayout';
import VideoParticipant, { VideoParticipantProps } from './videoParticipant';
import { CurrentConnectionEvents } from '../../../helpers/livekit/types';
import { getMediaServerConn } from '../../../helpers/livekit/utils';

import { participantsSelector } from '../../../store/slices/participantSlice';

interface IVideosComponentProps {
  isVertical?: boolean;
}

export interface VideoParticipantType {
  isAdmin: boolean;
  isLocal: boolean;
}

const VideosComponent = ({ isVertical }: IVideosComponentProps) => {
  const dispatch = useAppDispatch();
  const pinnedCamUserIds = useAppSelector(
    (state) => state.roomSettings.pinnedCamUserIds,
  );
  const spotlightUserIds = useAppSelector(
    (state) => state.roomSettings.spotlightUserIds,
  );
  const ignoreSpotlightLayout = useAppSelector(
    (state) => state.roomSettings.ignoreSpotlightLayout,
  );
  const [videoSubscribers, setVideoSubscribers] =
    useState<Map<string, LocalParticipant | RemoteParticipant>>();
  const currentConnection = getMediaServerConn();
  const hideNonVideoParticipants = useAppSelector(
    (state) => state.roomSettings.hideNonVideoParticipants,
  );
  const isFocusModeEnabled = useAppSelector(
    (state) => state.roomSettings.isFocusModeEnabled,
  );
  const currentUserIsAdmin = useAppSelector(
    (state) => state.session.currentUser?.metadata?.isAdmin,
  );
  const allReduxParticipants = useAppSelector(participantsSelector.selectAll);

  useEffect(() => {
    if (currentConnection.videoSubscribersMap.size) {
      setVideoSubscribers(currentConnection.videoSubscribersMap as any);
    }
    currentConnection.on(
      CurrentConnectionEvents.VideoSubscribers,
      setVideoSubscribers,
    );
    return () => {
      currentConnection.off(
        CurrentConnectionEvents.VideoSubscribers,
        setVideoSubscribers,
      );
    };
  }, [currentConnection]);

  // Fix race condition: LiveKit ParticipantConnected may happen after Redux NATS update
  const [participantsChange, setParticipantsChange] = useState(0);
  useEffect(() => {
    if (!currentConnection?.room) return;
    const forceUpdate = () => setParticipantsChange(prev => prev + 1);
    currentConnection.room.on(RoomEvent.ParticipantConnected, forceUpdate);
    currentConnection.room.on(RoomEvent.ParticipantDisconnected, forceUpdate);
    return () => {
      currentConnection.room.off(RoomEvent.ParticipantConnected, forceUpdate);
      currentConnection.room.off(RoomEvent.ParticipantDisconnected, forceUpdate);
    };
  }, [currentConnection]);

  const { allParticipants, pinParticipants, totalNumWebcams } = useMemo(() => {
    let totalNumWebcams = 0;
    const localSubscribers: Array<ReactElement<VideoParticipantProps>> = [];
    const pinSubscribers: Array<ReactElement<VideoParticipantProps>> = [];
    const adminSubscribers: Array<ReactElement<VideoParticipantProps>> = [];
    const otherSubscribers: Array<ReactElement<VideoParticipantProps>> = [];

    const subscribers: (LocalParticipant | RemoteParticipant)[] = [];

    if (hideNonVideoParticipants) {
      if (videoSubscribers) {
        subscribers.push(...Array.from(videoSubscribers.values()));
      }
      // Force add spotlighted participants even if they don't have video (or video was blocked)
      if (spotlightUserIds && spotlightUserIds.length > 0 && currentConnection?.room?.remoteParticipants) {
        spotlightUserIds.forEach(id => {
          if (!videoSubscribers?.has(id)) {
            const p = currentConnection.room.remoteParticipants.get(id);
            if (p) subscribers.push(p);
          }
        });
      }
    } else {
      // If showing all participants, gather everyone from currentConnection
      if (currentConnection?.room) {
        if (currentConnection.room.localParticipant) {
          subscribers.push(currentConnection.room.localParticipant);
        }
        if (currentConnection.room.remoteParticipants) {
          subscribers.push(...Array.from(currentConnection.room.remoteParticipants.values()));
        }
      }
    }

    let filteredSubscribers = subscribers;
    if (isFocusModeEnabled && !currentUserIsAdmin) {
      filteredSubscribers = subscribers.filter((p) => {
        if (p instanceof LocalParticipant) return true;
        const pp = participantsSelector.selectById(store.getState(), p.identity);
        return !!pp?.metadata?.isAdmin;
      });
    }

    // Webinar Mode: Hide local participant if they are an attendee with no camera
    const roomFeatures = store.getState().session.currentRoom.metadata?.roomFeatures;
    const adminOnlyWebcams = !!roomFeatures?.adminOnlyWebcams;
    const allowViewOtherWebcams = !!roomFeatures?.allowViewOtherWebcams;
    const isMeetingMode = allowViewOtherWebcams && !adminOnlyWebcams;
    const currentUserIsPresenter = !!store.getState().session.currentUser?.metadata?.isPresenter;
    const currentUserLockSettings = store.getState().session.currentUser?.metadata?.lockSettings;
    const isSpeaker = currentUserLockSettings?.lockMicrophone === false || currentUserLockSettings?.lockWebcam === false;
    const isWebinarAttendee = !isMeetingMode && !currentUserIsAdmin && !currentUserIsPresenter && !isSpeaker;

    if (isWebinarAttendee) {
      filteredSubscribers = filteredSubscribers.filter((p) => {
        if (p instanceof LocalParticipant) {
          // Hide self if no camera track (attendee with no camera permission)
          const hasVideo = p.getTrackPublication(Track.Source.Camera) !== undefined;
          return hasVideo;
        }
        // Remote participants: only show spotlighted users or screen sharers (Backstage Mode)
        const isSpotlighted = spotlightUserIds && spotlightUserIds.includes(p.identity);
        const isScreenSharer = store.getState().session.screenSharing.sharedBy === p.identity;
        return isSpotlighted || isScreenSharer;
      });
    }

    for (const participant of filteredSubscribers) {
      // Check if participant has camera
      const videoTracks = participant.getTrackPublication(Track.Source.Camera);
      
      if (videoTracks || !hideNonVideoParticipants) {
        let isAdmin = false,
          displayPinIcon = true,
          displaySwitchCamIcon = true;

        const pp = participantsSelector.selectById(
          store.getState(),
          participant.identity,
        );
        isAdmin = !!pp?.metadata?.isAdmin;

        const participantType: VideoParticipantType = {
          isAdmin,
          isLocal: participant instanceof LocalParticipant,
        };

        if (filteredSubscribers.length === 1) {
          displayPinIcon = false;
          displaySwitchCamIcon = false;
        }

        const isSpotlighted = !ignoreSpotlightLayout && spotlightUserIds && spotlightUserIds.includes(participant.identity);
        const isPinnedLocally = pinnedCamUserIds && pinnedCamUserIds.includes(participant.identity);

        totalNumWebcams++;
        const elm = (
          <VideoParticipant
            key={participant.sid}
            participantType={participantType}
            participant={participant}
            displayPinIcon={displayPinIcon}
            displaySwitchCamIcon={displaySwitchCamIcon}
            isPinned={isSpotlighted || isPinnedLocally}
          />
        );

        if (isSpotlighted || isPinnedLocally) {
          pinSubscribers.push(elm);
          totalNumWebcams--;
        } else if (isAdmin) {
          adminSubscribers.push(elm);
        } else if (participant instanceof LocalParticipant) {
          localSubscribers.push(elm);
        } else {
          otherSubscribers.push(elm);
        }
      }
    }

    const allParticipants = concat(
      adminSubscribers,
      localSubscribers,
      otherSubscribers,
    );

    let finalPinParticipants: Array<ReactElement<VideoParticipantProps>> | undefined =
      undefined;
    
    if (totalNumWebcams > 0 && pinSubscribers.length > 0) {
      // only then we can activate pin cam
      finalPinParticipants = pinSubscribers;
    } else if (pinSubscribers.length > 0) {
      allParticipants.push(...pinSubscribers);
      totalNumWebcams += pinSubscribers.length;
    }

    return {
      allParticipants,
      pinParticipants: finalPinParticipants,
      totalNumWebcams,
    };
  }, [
    videoSubscribers,
    pinnedCamUserIds,
    spotlightUserIds,
    ignoreSpotlightLayout,
    hideNonVideoParticipants,
    currentConnection,
    allReduxParticipants,
    isFocusModeEnabled,
    currentUserIsAdmin,
    participantsChange,
  ]);

  return (
    <VideoLayout
      allParticipants={allParticipants}
      pinParticipants={pinParticipants}
      totalNumWebcams={totalNumWebcams}
      isVertical={isVertical}
    />
  );
};

export default VideosComponent;
