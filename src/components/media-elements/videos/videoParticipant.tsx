import React, { useMemo, useState } from 'react';
import { LocalParticipant, RemoteParticipant, Track, ParticipantEvent } from 'livekit-client';

import VideoComponent from './video';
import { useAppSelector } from '../../../store';
import { selectIsSpeakingByUserId } from '../../../store/slices/activeSpeakersSlice';
import { generateAvatarInitial } from '../../../helpers/utils';
import { VideoParticipantType } from './';
import { RepeatIconSVG } from '../../../assets/Icons/RepeatIconSVG';

export interface VideoParticipantProps {
  participantType: VideoParticipantType;
  participant: RemoteParticipant | LocalParticipant;
  displayPinIcon: boolean;
  displaySwitchCamIcon: boolean;
  isPinned?: boolean;
}
const VideoParticipant = ({
  participantType,
  participant,
  displayPinIcon,
  displaySwitchCamIcon,
  isPinned,
}: VideoParticipantProps) => {
  const isSpeaking = useAppSelector(
    selectIsSpeakingByUserId(participant.identity),
  );
  const videoTracksCount = useAppSelector(
    (state) => state.participants.entities[participant.identity]?.videoTracks
  );
  const [floatView, setFloatView] = useState<boolean>(true);

  // Force re-render when tracks change directly on the participant
  // This bypasses Redux batching bugs where fast unpublish/publish (1->0->1) prevents re-render
  const [trackUpdateCount, setTrackUpdateCount] = useState(0);
  React.useEffect(() => {
    const onTrackChange = () => setTrackUpdateCount((c) => c + 1);
    participant.on(ParticipantEvent.TrackSubscribed, onTrackChange);
    participant.on(ParticipantEvent.TrackUnsubscribed, onTrackChange);
    participant.on(ParticipantEvent.LocalTrackPublished, onTrackChange);
    participant.on(ParticipantEvent.LocalTrackUnpublished, onTrackChange);
    return () => {
      participant.off(ParticipantEvent.TrackSubscribed, onTrackChange);
      participant.off(ParticipantEvent.TrackUnsubscribed, onTrackChange);
      participant.off(ParticipantEvent.LocalTrackPublished, onTrackChange);
      participant.off(ParticipantEvent.LocalTrackUnpublished, onTrackChange);
    };
  }, [participant]);

  const renderVideoElms = useMemo(() => {

    const elements: Array<React.ReactNode> = [];

    for (const track of participant.videoTrackPublications.values()) {
      if (
        track.source === Track.Source.Camera &&
        !track.isMuted &&
        track.videoTrack
      ) {
        const elm = (
          <VideoComponent
            userId={participant.identity}
            name={participant.name ?? ''}
            isLocal={participantType.isLocal}
            track={track}
            displayPinIcon={displayPinIcon}
            isPinned={isPinned}
            key={track.trackSid}
          />
        );
        elements.push(elm);
      }
    }
    return elements;
  }, [participant, displayPinIcon, participantType, videoTracksCount, isPinned, trackUpdateCount]);

  return (
    <div
      className={`video-camera-item relative group ${isSpeaking ? 'speaking' : ''} ${
        participantType.isAdmin ? 'admin' : 'participants'
      } ${participantType.isLocal && floatView ? 'its-me' : ''}`}
    >
      {participantType.isLocal && displaySwitchCamIcon && (
        <>
          <div
            className="switch-camera absolute top-3 left-4 z-50 text-white cursor-pointer h-7 w-7 rounded-full hidden items-center justify-center bg-black bg-opacity-50"
            onClick={() => setFloatView(!floatView)}
          >
            <RepeatIconSVG />
          </div>
        </>
      )}
      
      {renderVideoElms.length > 0 ? (
        renderVideoElms
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-Gray-800 dark:bg-black rounded-lg">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-600 dark:bg-slate-700 flex items-center justify-center shadow-lg border-2 border-slate-500/50">
             <span className="text-white font-bold text-4xl md:text-5xl tracking-wider">
               {generateAvatarInitial(participant.name ?? 'User')}
             </span>
          </div>
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white text-sm font-medium z-10 max-w-[calc(100%-24px)] truncate border border-white/10">
            {participant.name} {participantType.isLocal ? '(You)' : ''}
          </div>
        </div>
      )}

      <div className="bg-shadow pointer-events-none bg-linear-to-b from-95% from-black/0 to-black/50 w-full h-full absolute bottom-0 left-0 opacity-0 transition-all duration-300 group-hover:opacity-100"></div>
    </div>
  );
};

export default VideoParticipant;
