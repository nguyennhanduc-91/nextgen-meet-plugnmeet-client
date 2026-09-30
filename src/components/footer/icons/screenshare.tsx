import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createLocalScreenTracks,
  ScreenShareCaptureOptions,
  Track,
} from 'livekit-client';
import clsx from 'clsx';

import { store, useAppDispatch, useAppSelector } from '../../../store';
import { updateIsActiveScreenshare } from '../../../store/slices/bottomIconsActivitySlice';
import { updateScreenSharing } from '../../../store/slices/sessionSlice';
import { getScreenShareResolution } from '../../../helpers/utils';
import { getMediaServerConnRoom } from '../../../helpers/livekit/utils';
import { ShareScreenIconSVG } from '../../../assets/Icons/ShareScreenIconSVG';
import {
  addUserNotification,
  addSpotlightUserId,
  removeSpotlightUserId,
} from '../../../store/slices/roomSettingsSlice';
import { participantsSelector } from '../../../store/slices/participantSlice';
import { getNatsConn } from '../../../helpers/nats';
import { DataMsgBodyType } from 'plugnmeet-protocol-js';

const ScrenshareIcon = () => {
  const dispatch = useAppDispatch();
  const currentRoom = getMediaServerConnRoom();
  const { t } = useTranslation();
  const isPublishing = useRef<boolean>(false);

  const isScreenShareAllowed = useAppSelector(
    (state) => !!state.session.currentRoom.metadata?.roomFeatures?.allowScreenShare
  );

  const showTooltip = useAppSelector(
    (state) => state.session.userDeviceType === 'desktop'
  );

  const isAdmin = useAppSelector(
    (state) => !!state.session.currentUser?.metadata?.isAdmin
  );

  const currentUserId = useAppSelector(
    (state) => state.session.currentUser?.userId
  );

  const isPresenter = useAppSelector(
    (state) => !!participantsSelector.selectById(state, currentUserId ?? '')?.metadata?.isPresenter
  );

  const isActiveScreenshare = useAppSelector(
    (state) => state.bottomIconsActivity.isActiveScreenshare,
  );
  const sessionScreenSharing = useAppSelector(
    (state) => state.session.screenSharing,
  );
  const isScreenshareLock = useAppSelector(
    (state) =>
      !!participantsSelector.selectById(state, currentUserId ?? '')?.metadata?.lockSettings?.lockScreenSharing,
  );

  const isLocked = useMemo(
    () => !isAdmin && !isPresenter && isScreenshareLock,
    [isAdmin, isPresenter, isScreenshareLock],
  );

  const endScreenShare = useCallback(async () => {
    if (isActiveScreenshare && currentRoom) {
      for (const publication of currentRoom.localParticipant.trackPublications.values()) {
        if (
          (publication.source === Track.Source.ScreenShare ||
            publication.source === Track.Source.ScreenShareAudio) &&
          publication.track
        ) {
          await currentRoom.localParticipant.unpublishTrack(
            publication.track,
            true,
          );
        }
      }
      dispatch(updateIsActiveScreenshare(false));
      dispatch(
        updateScreenSharing({
          isActive: false,
          sharedBy: '',
        }),
      );
      
      // Auto remove Spotlight for the screen sharer
      if (currentUserId) {
        const payload = JSON.stringify({ type: 'GLOBAL_SPOTLIGHT', action: 'remove', userId: currentUserId });
        getNatsConn()?.sendDataMessage(DataMsgBodyType.INFO, payload);
        dispatch(removeSpotlightUserId(currentUserId));
      }
    }
  }, [isActiveScreenshare, dispatch, currentRoom, currentUserId]);

  // for change in lock setting
  useEffect(() => {
    if (isLocked) {
      endScreenShare().then();
    }
    //eslint-disable-next-line
  }, [isLocked]);

  // for special case when user cancels sharing from browser directly,
  // we will check & disable button status.
  useEffect(() => {
    if (!sessionScreenSharing.isActive && isActiveScreenshare) {
      dispatch(updateIsActiveScreenshare(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionScreenSharing]);

  const toggleScreenShare = async () => {
    if (isLocked || isPublishing.current) {
      return;
    }
    isPublishing.current = true;

    if (!isActiveScreenshare) {
      if (sessionScreenSharing.isActive) {
        dispatch(
          addUserNotification({
            message: t('footer.notice.already-active-screen-sharing'),
            typeOption: 'error',
          }),
        );
        isPublishing.current = false;
        return;
      }

      if (!currentRoom) {
        isPublishing.current = false;
        return;
      }

      const option: ScreenShareCaptureOptions = {
        audio: true,
      };
      // because of one bug, we'll disable to set regulation for safari
      // https://bugs.webkit.org/show_bug.cgi?id=263015
      const isSafari = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent,
      );
      if (!isSafari) {
        option.resolution = getScreenShareResolution();
      }

      try {
        const localTracks = await createLocalScreenTracks(option);
        for (let i = 0; i < localTracks.length; i++) {
          const track = localTracks[i];
          await currentRoom.localParticipant.publishTrack(track);
        }

        dispatch(updateIsActiveScreenshare(true));
        dispatch(
          updateScreenSharing({
            isActive: true,
            sharedBy: currentRoom.localParticipant.identity,
          }),
        );
        
        // Auto Spotlight the screen sharer
        if (currentUserId) {
          const payload = JSON.stringify({ type: 'GLOBAL_SPOTLIGHT', action: 'add', userId: currentUserId });
          getNatsConn()?.sendDataMessage(DataMsgBodyType.INFO, payload);
          dispatch(addSpotlightUserId(currentUserId));
        }
      } catch (e) {
        console.error('Screen sharing was cancelled or failed:', e);
      } finally {
        isPublishing.current = false;
      }
    } else {
      await endScreenShare();
      isPublishing.current = false;
    }
  };

  const text = () => {
    if (isActiveScreenshare) {
      return t('footer.icons.stop-screen-sharing');
    } else if (!isActiveScreenshare && !isLocked) {
      return t('footer.icons.start-screen-sharing');
    } else if (isLocked) {
      return t('footer.icons.screen-sharing-locked');
    }
  };

  const wrapperClasses = clsx(
    'share-screen relative footer-icon cursor-pointer w-9 md:w-10 3xl:w-11 h-9 md:h-10 3xl:h-11 rounded-[10px] md:rounded-[12px] 3xl:rounded-[15px] border-[2px] 3xl:border-[3px] overflow-visible!',
    {
      'border-[rgba(124,206,247,0.25)] dark:border-Gray-800':
        isActiveScreenshare,
      'border-transparent': !isActiveScreenshare,
      '!border-Red-100 dark:!border-Red-600 pointer-events-none': isLocked,
    },
  );

  const innerDivClasses = clsx(
    'footer-icon-bg h-full relative w-full flex items-center justify-center rounded-[8px] md:rounded-[10px] 3xl:rounded-[12px] border border-Gray-300 dark:border-Gray-700 shadow transition-all duration-300 hover:bg-gray-100 dark:hover:bg-Gray-700 text-Gray-950 dark:text-white',
    {
      'has-tooltip': showTooltip,
      'bg-gray-100 dark:bg-Gray-700': isActiveScreenshare,
      'bg-white dark:bg-Gray-800': !isActiveScreenshare,
      '!border-Red-200 dark:!border-Red-400 text-Red-400': isLocked,
    },
  );

  if (!isScreenShareAllowed) {
    return null;
  }

  return (
    <div className={wrapperClasses} onClick={() => toggleScreenShare()}>
      <div className={innerDivClasses}>
        <span className="tooltip">{text()}</span>
        <ShareScreenIconSVG classes="w-auto h-4 3xl:h-5" />
      </div>
      {isLocked && (
        <span className="add absolute -top-1 -right-2 z-[110]">
          <i className="pnm-lock primaryColor text-Red-400" />
        </span>
      )}
    </div>
  );
};

export default ScrenshareIcon;
