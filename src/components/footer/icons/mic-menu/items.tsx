import React, { useCallback } from 'react';
import { MenuItem, MenuItems } from '@headlessui/react';
import { Room, Track } from 'livekit-client';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '../../../../store';
import { updateSelectedAudioDevice, updateIsHighFidelityAudio } from '../../../../store/slices/roomSettingsSlice';
import {
  updateIsActiveMicrophone,
  updateIsMicMuted,
} from '../../../../store/slices/bottomIconsActivitySlice';
import { CheckMarkIcon } from '../../../../assets/Icons/CheckMarkIcon';
import { Microphone } from '../../../../assets/Icons/Microphone';
import { MicrophoneOff } from '../../../../assets/Icons/MicrophoneOff';

interface IMicMenuItemsProps {
  currentRoom: Room;
}

const MicMenuItems = ({ currentRoom }: IMicMenuItemsProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const audioDevices = useAppSelector(
    (state) => state.roomSettings.audioDevices,
  );
  const isMicMuted = useAppSelector(
    (state) => state.bottomIconsActivity.isMicMuted,
  );
  const selectedAudioDevice = useAppSelector(
    (state) => state.roomSettings.selectedAudioDevice,
  );
  const isHighFidelityAudio = useAppSelector(
    (state) => state.roomSettings.isHighFidelityAudio,
  );

  const handleDeviceChange = useCallback(
    async (deviceId: string) => {
      await currentRoom.switchActiveDevice('audioinput', deviceId);
      dispatch(updateSelectedAudioDevice(deviceId));
    },
    [currentRoom, dispatch],
  );

  const muteUnmuteMic = useCallback(async () => {
    if (!currentRoom) return;
    for (const publication of currentRoom.localParticipant.audioTrackPublications.values()) {
      if (publication.track && publication.kind === Track.Kind.Audio) {
        if (publication.isMuted) {
          await publication.track.unmute();
          dispatch(updateIsMicMuted(false));
        } else {
          await publication.track.mute();
          dispatch(updateIsMicMuted(true));
        }
      }
    }
  }, [currentRoom, dispatch]);

  const leaveMic = useCallback(async () => {
    if (!currentRoom) return;
    for (const publication of currentRoom.localParticipant.audioTrackPublications.values()) {
      if (publication.track && publication.kind === Track.Kind.Audio) {
        if (publication.track) {
          await currentRoom.localParticipant.unpublishTrack(
            publication.track,
            true,
          );
        }
      }
    }
    dispatch(updateIsActiveMicrophone(false));
    dispatch(updateIsMicMuted(false));
    dispatch(updateSelectedAudioDevice(''));
  }, [currentRoom, dispatch]);

  return (
    <MenuItems
      static
      className="menu origin-bottom-left z-[9999] fixed left-2 md:left-auto border border-Gray-100 dark:border-Gray-700 bg-white dark:bg-dark-primary shadow-lg rounded-2xl overflow-hidden p-2 w-max"
      style={{ bottom: '48px' }}
    >
      <div className="title h-8 w-full flex items-center text-xs leading-none text-Gray-700 dark:text-dark-text px-2 uppercase">
        {t('footer.icons.select-microphone')}
      </div>
      {audioDevices.map((device) => (
        <MenuItem key={device.id}>
          {() => (
            <p
              className={`${
                selectedAudioDevice === device.id
                  ? 'bg-Gray-50 dark:bg-dark-secondary2'
                  : ''
              } h-8 w-full flex items-center justify-between text-sm gap-2 leading-none font-medium text-Gray-950 dark:text-white px-2 rounded-lg transition-all duration-300 hover:bg-Gray-50 dark:hover:bg-dark-secondary2`}
              onClick={() => handleDeviceChange(device.id)}
            >
              {device.label}
              {selectedAudioDevice === device.id ? <CheckMarkIcon /> : ''}
            </p>
          )}
        </MenuItem>
      ))}
      <div className="divider h-1 w-[110%] bg-Gray-50 dark:bg-Gray-700 -ml-3 my-1"></div>
      
      {/* DJ Mode Toggle */}
      <div className="px-2 py-2" role="none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
            <div>
              <p className="text-xs font-semibold text-Gray-900 dark:text-white leading-none">DJ Mode</p>
              <p className="text-[9px] text-Gray-500 dark:text-Gray-400 mt-0.5 leading-tight">Tắt khử ồn, bật Stereo</p>
            </div>
          </div>
          <button
            onClick={() => {
              const next = !isHighFidelityAudio;
              dispatch(updateIsHighFidelityAudio(next));
            }}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isHighFidelityAudio ? 'bg-amber-500' : 'bg-Gray-300 dark:bg-Gray-600'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${isHighFidelityAudio ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
          </button>
        </div>
      </div>

      <div className="divider h-1 w-[110%] bg-Gray-50 dark:bg-Gray-700 -ml-3 my-1"></div>
      <div className="" role="none">
        <MenuItem>
          {() => (
            <p
              className="h-8 w-full flex items-center text-sm gap-2 leading-none font-medium text-red-700 px-2 rounded-lg transition-all duration-300 hover:bg-Red-600 hover:text-white"
              onClick={muteUnmuteMic}
            >
              {isMicMuted ? (
                <>
                  <Microphone classes={'h-4 w-auto'} />
                  {t('footer.menus.unmute-microphone')}
                </>
              ) : (
                <>
                  <MicrophoneOff classes={'h-4 w-auto'} />
                  {t('footer.menus.mute-microphone')}
                </>
              )}
            </p>
          )}
        </MenuItem>
      </div>
      <div className="" role="none">
        <MenuItem>
          {() => (
            <p
              className="group h-8 w-full flex items-center text-sm gap-2 leading-none font-medium px-2 rounded-lg transition-all duration-300 hover:bg-Red-600 hover:text-white text-red-700"
              onClick={leaveMic}
            >
              <i className="pnm-logout text-base transition ease-in" />
              {t('footer.menus.leave-microphone')}
            </p>
          )}
        </MenuItem>
      </div>
    </MenuItems>
  );
};

export default MicMenuItems;
