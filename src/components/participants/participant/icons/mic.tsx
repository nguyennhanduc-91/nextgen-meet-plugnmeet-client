import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Menu, MenuButton, MenuItems, Transition } from '@headlessui/react';
import { debounce } from 'es-toolkit';

import { useAppDispatch, useAppSelector } from '../../../../store';
import {
  participantsSelector,
  updateParticipant,
} from '../../../../store/slices/participantSlice';
import { Microphone } from '../../../../assets/Icons/Microphone';
import { MicrophoneOff } from '../../../../assets/Icons/MicrophoneOff';
import IconWrapper from './iconWrapper';
import RangeSlider from '../../../../helpers/ui/rangeSlider';

interface MicIconProps {
  userId: string;
  isRemoteParticipant: boolean;
  isSpeaking?: boolean;
}

const MicIcon = ({ userId, isRemoteParticipant, isSpeaking }: MicIconProps) => {
  const audioTracks = useAppSelector(
    (state) => participantsSelector.selectById(state, userId)?.audioTracks,
  );
  const isMuted = useAppSelector(
    (state) => participantsSelector.selectById(state, userId)?.isMuted,
  );
  const audioVolume = useAppSelector(
    (state) => participantsSelector.selectById(state, userId)?.audioVolume,
  );

  const [volume, setVolume] = useState<number>(audioVolume ?? 1);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Sync from store to local state, but only if the value is actually different.
    // This prevents the infinite loop by ignoring the "echo" of our own update.
    if (typeof audioVolume !== 'undefined' && audioVolume !== volume) {
      setVolume(audioVolume);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioVolume]);

  // Create a debounced version of the dispatch function.
  // This will only run 200ms after the last time it was called.
  // oxlint-disable-next-line exhaustive-deps
  const debouncedUpdate = useCallback(
    debounce((newVolume: number) => {
      dispatch(
        updateParticipant({
          id: userId,
          changes: { audioVolume: newVolume },
        }),
      );
    }, 200),
    [dispatch, userId],
  );

  useEffect(() => {
    // When volume changes, call the debounced function.
    debouncedUpdate(volume);
  }, [volume, debouncedUpdate]);

  const renderVolumeControl = useCallback(() => {
    return (
      <div className="mic-unmute-wrapper relative flex items-center justify-center">
        <Menu>
          {({ open }) => (
            <>
              <MenuButton className="cursor-pointer">
                <div
                  className={`relative flex items-center justify-center rounded-md w-5 h-5 3xl:w-6 3xl:h-6 transition-all duration-200 ${
                    isSpeaking
                      ? 'text-Green-600 dark:text-Green-400'
                      : 'text-Gray-600 dark:text-Gray-300'
                  }`}
                >
                  {isSpeaking && (
                    <span className="absolute inset-0 rounded-md bg-Green-100 dark:bg-Green-800/30 animate-pulse" />
                  )}
                  {volume ? (
                    <Microphone classes="relative z-[1] h-3 3xl:h-4 w-auto" />
                  ) : (
                    <MicrophoneOff classes="relative z-[1] h-3 3xl:h-4 w-auto text-Red-400" />
                  )}
                </div>
              </MenuButton>

              <Transition show={open}>
                <MenuItems
                  static
                  className="volume-popup-wrapper z-10 absolute ltr:-right-6 rtl:-left-6 top-3 mt-2 w-48 xl:w-60 py-4 px-2 rounded-md shadow-virtual-pOP bg-white dark:bg-dark-secondary3 ring-1 ring-Gray-100 dark:ring-Gray-700 focus:outline-hidden"
                >
                  <section className="flex items-center">
                    <div className="flex-1 px-1">
                      <RangeSlider
                        min={0}
                        max={100}
                        value={Math.round(volume * 100)}
                        onChange={(newValue) => {
                          setVolume(newValue / 100);
                        }}
                        thumbSize={16}
                        trackHeight={4}
                      />
                    </div>
                    <p className="w-10 text-center text-sm text-Gray-700 dark:text-Gray-200">
                      {Math.round(volume * 100)}
                    </p>
                    <button className="w-5 h-5">
                      {volume ? (
                        <Microphone classes="h-3 3xl:h-4 w-auto text-Gray-700 dark:text-white" />
                      ) : (
                        <MicrophoneOff classes="h-3 3xl:h-4 w-auto text-Red-400" />
                      )}
                    </button>
                  </section>
                </MenuItems>
              </Transition>
            </>
          )}
        </Menu>
      </div>
    );
  }, [volume, isSpeaking]);

  const render = useMemo(() => {
    if (audioTracks > 0) {
      if (isMuted) {
        return (
          <div className="flex items-center justify-center w-5 h-5 3xl:w-6 3xl:h-6 rounded-md">
            <MicrophoneOff classes="h-3 3xl:h-4 w-auto text-Red-400 dark:text-Red-400" />
          </div>
        );
      }
      // if this user is a remote Participant, then we can control volume.
      if (isRemoteParticipant) {
        return renderVolumeControl();
      }
      // for local user don't need volume control
      return (
        <div
          className={`relative flex items-center justify-center w-5 h-5 3xl:w-6 3xl:h-6 rounded-md transition-all duration-200 ${
            isSpeaking
              ? 'text-Green-600 dark:text-Green-400'
              : 'text-Gray-600 dark:text-Gray-300'
          }`}
        >
          {isSpeaking && (
            <span className="absolute inset-0 rounded-md bg-Green-100 dark:bg-Green-800/30 animate-pulse" />
          )}
          <Microphone classes="relative z-[1] h-3 3xl:h-4 w-auto" />
        </div>
      );
    }

    return null;
  }, [isRemoteParticipant, renderVolumeControl, audioTracks, isMuted, isSpeaking]);

  return render && <IconWrapper>{render}</IconWrapper>;
};

export default MicIcon;

