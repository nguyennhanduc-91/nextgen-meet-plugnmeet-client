import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { LocalTrack, Track, LocalVideoTrack } from 'livekit-client';

import { store, useAppDispatch, useAppSelector } from '../../../store';
import {
  updateIsActiveWebcam,
  updateShowVideoShareModal,
} from '../../../store/slices/bottomIconsActivitySlice';
import ShareWebcamModal from '../modals/webcam';
import WebcamMenu from './webcam/menu';
import { updateSelectedVideoDevice } from '../../../store/slices/roomSettingsSlice';
import { participantsSelector } from '../../../store/slices/participantSlice';
import { getMediaServerConnRoom } from '../../../helpers/livekit/utils';
import { Camera } from '../../../assets/Icons/Camera';
import { CameraOff } from '../../../assets/Icons/CameraOff';
import { PlusIcon } from '../../../assets/Icons/PlusIcon';
import useWebcamPublisher from './webcam/useWebcamPublisher';

interface IWebcamIconProps {
  showButton?: boolean;
}

const WebcamIcon = ({ showButton = true }: IWebcamIconProps) => {
  const dispatch = useAppDispatch();
  const currentRoom = getMediaServerConnRoom();
  const { t } = useTranslation();

  const { showTooltip, isAdmin, defaultLock } = useMemo(() => {
    const session = store.getState().session;
    const isAdmin = !!session.currentUser?.metadata?.isAdmin;

    return {
      showTooltip: session.userDeviceType === 'desktop',
      isAdmin,
      defaultLock:
        !!session.currentRoom?.metadata?.defaultLockSettings?.lockWebcam,
    };
  }, []);
  const showVideoShareModal = useAppSelector(
    (state) => state.bottomIconsActivity.showVideoShareModal,
  );
  const isActiveWebcam = useAppSelector(
    (state) => state.bottomIconsActivity.isActiveWebcam,
  );
  const isWebcamLock = useAppSelector(
    (state) => state.session.currentUser?.metadata?.lockSettings?.lockWebcam,
  );
  const virtualBackground = useAppSelector(
    (state) => state.bottomIconsActivity.virtualBackground,
  );
  const selectedVideoDevice = useAppSelector(
    (state) => state.roomSettings.selectedVideoDevice,
  );
  const isRequireVideoEnabled = useAppSelector(
    (state) => state.roomSettings.isRequireVideoEnabled,
  );

  const currentUserId = useAppSelector(
    (state) => state.session.currentUser?.userId
  );
  const isPresenter = useAppSelector(
    (state) => !!participantsSelector.selectById(state, currentUserId ?? '')?.metadata?.isPresenter
  );

  // Lock if not an admin and not presenter & user-specific lock is set, or fall back to room default.
  const isWebcamLocked = useMemo(
    () => !isAdmin && !isPresenter && (isWebcamLock ?? defaultLock),
    [isAdmin, isPresenter, isWebcamLock, defaultLock],
  );

  const { publishNewTrack, replaceTrack, unpublishWebcam } = useWebcamPublisher();

  // require video logic
  useEffect(() => {
    if (isRequireVideoEnabled && !isActiveWebcam && !isWebcamLocked && showButton) {
      if (!showVideoShareModal) {
        dispatch(updateShowVideoShareModal(true));
      }
    }
  }, [isRequireVideoEnabled, isActiveWebcam, isWebcamLocked, showButton, showVideoShareModal, dispatch]);

  // for change in webcam lock setting
  useEffect(() => {
    if (!currentRoom) return;

    const closeWebcamOnLock = async (cameraTrack: LocalTrack) => {
      cameraTrack.stop(); // extra safety
      await currentRoom.localParticipant.unpublishTrack(cameraTrack, true);
      dispatch(updateIsActiveWebcam(false));
    };

    if (isWebcamLocked) {
      for (const publication of currentRoom.localParticipant.videoTrackPublications.values()) {
        if (publication.track && publication.kind === Track.Kind.Video) {
          if (publication.track.source !== Track.Source.ScreenShare) {
             closeWebcamOnLock(publication.track).then();
          }
        }
      }
    }
  }, [isWebcamLocked, currentRoom, dispatch]);

  // for change in virtual background settings
  useEffect(() => {
    if (!currentRoom || !isActiveWebcam) {
      return;
    }

    const updateProcessor = async () => {
      const publications = currentRoom.localParticipant.getTrackPublications();
      const pub = publications.find((p) => p.source === Track.Source.Camera);

      if (pub && pub.track && pub.videoTrack) {
        const processor = (pub.videoTrack as LocalVideoTrack).getProcessor();
        if (processor && (processor as any).update) {
          // It's our custom TwilioTrackProcessor
          await (processor as any).update(virtualBackground);
        } else if (virtualBackground.type !== 'none') {
          // If we need a background but don't have a processor yet, we need to re-publish
          await publishNewTrack(selectedVideoDevice, undefined, virtualBackground);
        }
      }
    };

    updateProcessor().then();
  }, [virtualBackground, isActiveWebcam, currentRoom, publishNewTrack, selectedVideoDevice]);

  // this is required during changing webcam device
  useEffect(() => {
    if (!selectedVideoDevice || !isActiveWebcam || !currentRoom) {
      return;
    }

    const changeDevice = async (deviceId: string) => {
      await currentRoom.switchActiveDevice('videoinput', deviceId);
    };

    if (virtualBackground.type === 'none') {
      changeDevice(selectedVideoDevice).then();
    } else {
      // virtual background stream will be handled by its own hook
    }
  }, [
    selectedVideoDevice,
    isActiveWebcam,
    currentRoom,
    virtualBackground.type,
  ]);

  const onSelectedDevice = useCallback(
    async (deviceId: string) => {
      if (isWebcamLocked) {
        dispatch(updateSelectedVideoDevice(''));
        return;
      }
      dispatch(updateSelectedVideoDevice(deviceId));
      dispatch(updateIsActiveWebcam(true));
      await publishNewTrack(deviceId, undefined, virtualBackground);
    },
    [dispatch, publishNewTrack, virtualBackground, isWebcamLocked],
  );

  const hasAutoPublished = useRef(false);
  // only for initial if device was selected in landing page
  useEffect(() => {
    if (selectedVideoDevice && !hasAutoPublished.current) {
      hasAutoPublished.current = true;
      onSelectedDevice(selectedVideoDevice).then();
    }
  }, [selectedVideoDevice, onSelectedDevice]);

  const toggleWebcam = useCallback(async () => {
    if (isWebcamLocked) {
      return;
    }

    if (!isActiveWebcam) {
      if (!currentRoom) return;
      if (selectedVideoDevice !== '') {
        await onSelectedDevice(selectedVideoDevice);
      } else {
        dispatch(updateShowVideoShareModal(!isActiveWebcam));
      }
    } else if (isActiveWebcam) {
      // Dùng unpublishWebcam thay vì thay thế bằng emptyStream để loại bỏ hoàn toàn track.
      await unpublishWebcam();
    }
    //oxlint-disable-next-line
  }, [
    isWebcamLocked,
    isActiveWebcam,
    selectedVideoDevice,
    currentRoom,
    onSelectedDevice,
    unpublishWebcam,
  ]);

  const getTooltipText = () => {
    if (!isActiveWebcam && !isWebcamLock) {
      return t('footer.icons.start-webcam');
    } else if (!isActiveWebcam && isWebcamLock) {
      return t('footer.icons.webcam-locked');
    } else if (isActiveWebcam) {
      return t('footer.icons.turn-off-webcam');
    }
  };

  if (!showButton && !isActiveWebcam) {
    return null;
  }

  const wrapperClasses = clsx(
    'relative footer-icon cursor-pointer min-w-9 md:min-w-10 3xl:min-w-11 h-9 md:h-10 3xl:h-11 rounded-[10px] md:rounded-[12px] 3xl:rounded-[15px] border-[2px] 3xl:border-[3px]',
    {
      'border-Red-100!': !isActiveWebcam && selectedVideoDevice !== '',
      'border-[rgba(124,206,247,0.25)]': isActiveWebcam,
      'border-transparent': !isActiveWebcam,
      'border-Red-100! dark:!border-Red-600 pointer-events-none':
        isWebcamLocked,
    },
  );

  const camWrapClasses = clsx(
    'footer-icon-bg cam-wrap relative cursor-pointer shadow border border-Gray-300 dark:border-Gray-700 rounded-[8px] md:rounded-[10px] 3xl:rounded-[12px] h-full w-full flex items-center justify-center transition-all duration-300 hover:bg-gray-100 dark:hover:bg-Gray-700 text-Gray-950 dark:text-white bg-white dark:bg-Gray-800',
    {
      'border-Red-200!': !isActiveWebcam && selectedVideoDevice !== '',
      'border-Red-200! dark:!border-Red-400 text-Red-400': isWebcamLocked,
    },
  );

  const iconDivClasses = clsx(
    'w-[24px] md:w-[28px] 3xl:w-[32px] h-full relative flex items-center justify-center transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-Gray-700 rounded-l-[8px] md:rounded-l-[10px] 3xl:rounded-l-[12px]',
    {
      'has-tooltip': showTooltip,
    },
  );

  return (
    <>
      <div className={wrapperClasses}>
        <div className={camWrapClasses}>
          <div className={iconDivClasses} onClick={() => toggleWebcam()}>
            <span className="tooltip">{getTooltipText()}</span>
            {isActiveWebcam ? <Camera classes={'h-4 3xl:h-5 w-auto'} /> : null}
            {!isActiveWebcam && (
              <>
                {selectedVideoDevice === '' ? (
                  <Camera classes={'h-4 3xl:h-5 w-auto'} />
                ) : (
                  <CameraOff classes={'h-4 3xl:h-5 w-auto'} />
                )}
                <span className="add absolute -top-2 -right-2 z-10">
                  {isWebcamLocked ? (
                    <i className="pnm-lock primaryColor" />
                  ) : (
                    selectedVideoDevice === '' && <PlusIcon />
                  )}
                </span>
              </>
            )}
          </div>
          {(isActiveWebcam || selectedVideoDevice !== '') && (
            <>
              <div className="h-4 w-px bg-Gray-200 dark:bg-Gray-700/50 self-center opacity-50" />
              <WebcamMenu
                currentRoom={currentRoom}
                isActiveWebcam={isActiveWebcam}
                toggleWebcam={toggleWebcam}
              />
            </>
          )}
        </div>
      </div>

      {showVideoShareModal && (
        <ShareWebcamModal
          onSelectedDevice={onSelectedDevice}
          selectedDeviceId={selectedVideoDevice}
          displayWebcamSelection={true}
        />
      )}
    </>
  );
};

export default WebcamIcon;
