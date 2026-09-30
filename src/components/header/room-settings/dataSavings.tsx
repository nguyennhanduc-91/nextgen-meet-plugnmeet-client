import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { VideoQuality } from 'livekit-client';
import { create, toBinary } from '@bufbuild/protobuf';
import { DataMsgBodyType, UpdateUserLockSettingsReqSchema } from 'plugnmeet-protocol-js';

import { store, useAppDispatch, useAppSelector } from '../../../store';
import sendAPIRequest from '../../../helpers/api/plugNmeetAPI';
import { getNatsConn } from '../../../helpers/nats';
import {
  updateActivateWebcamsView,
  updateActiveScreenSharingView,
  updateMaxNumDisplayWebcams,
  updateRoomVideoQuality,
} from '../../../store/slices/roomSettingsSlice';
import {
  updateAdminOnlyWebcams,
  updateAllowViewOtherWebcams,
} from '../../../store/slices/sessionSlice';
import SettingsSwitch from '../../../helpers/ui/settingsSwitch';
import Dropdown, { ISelectOption } from '../../../helpers/ui/dropdown';
import { UserDeviceType } from '../../../store/slices/interfaces/session';
import { PlayerIconSVG } from '../../../assets/Icons/PlayerIconSVG';
import { ShareScreenIconSVG } from '../../../assets/Icons/ShareScreenIconSVG';
import { Camera } from '../../../assets/Icons/Camera';
import { ParticipantsMenuIconSVG } from '../../../assets/Icons/ParticipantsMenuIconSVG';

const DataSavings = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const videoQuality = useAppSelector(
    (state) => state.roomSettings.roomVideoQuality,
  );
  const activateWebcamsView = useAppSelector(
    (state) => state.roomSettings.activateWebcamsView,
  );
  const activeScreenSharingView = useAppSelector(
    (state) => state.roomSettings.activeScreenSharingView,
  );
  const userDeviceType = useAppSelector(
    (state) => state.session.userDeviceType,
  );
  const maxNumDisplayWebcams = useAppSelector(
    (state) => state.roomSettings.maxNumDisplayWebcams,
  );
  const isAdmin = useAppSelector(
    (state) => state.session.currentUser?.metadata?.isAdmin,
  );
  const adminOnlyWebcams = useAppSelector(
    (state) => state.session.currentRoom.metadata?.roomFeatures?.adminOnlyWebcams ?? false,
  );
  const allowViewOtherWebcams = useAppSelector(
    (state) => state.session.currentRoom.metadata?.roomFeatures?.allowViewOtherWebcams ?? true,
  );
  const [numWebcamsOpts, setNumWebcamsOpts] = useState<ISelectOption[]>([]);

  // Derived state: Meeting mode = allowViewOtherWebcams && !adminOnlyWebcams
  const isMeetingMode = allowViewOtherWebcams && !adminOnlyWebcams;

  useEffect(() => {
    let opts: ISelectOption[] = [
      { text: '4', value: 4 },
      { text: '6', value: 6 },
    ];

    if (userDeviceType === UserDeviceType.TABLET) {
      opts = [{ text: '9', value: 9 }];
    } else if (userDeviceType === UserDeviceType.DESKTOP) {
      opts.push(
        { text: '9', value: 9 },
        { text: '12', value: 12 },
        { text: '16', value: 16 },
        { text: '24', value: 24 },
        { text: '32', value: 32 },
      );
    }

    setNumWebcamsOpts(opts);
  }, [userDeviceType]);

  const toggleWebcamView = () => {
    dispatch(updateActivateWebcamsView(!activateWebcamsView));
  };

  const toggleScreenShareView = () => {
    dispatch(updateActiveScreenSharingView(!activeScreenSharingView));
  };

  const toggleMeetingMode = async () => {
    const roomSid = store.getState().session.currentRoom.sid;
    const roomId = store.getState().session.currentRoom.roomId;
    
    if (isMeetingMode) {
      // Switch to Webinar mode
      dispatch(updateAdminOnlyWebcams(true));
      dispatch(updateAllowViewOtherWebcams(false));
      
      // Send NATS message to hide participant list globally
      const msg = JSON.stringify({ type: 'CUSTOM_LOCK_SETTING', service: 'allow_view_other_users_list', enabled: false });
      await getNatsConn().sendDataMessage(DataMsgBodyType.INFO, msg);
      dispatch({ type: 'session/updateAllowViewOtherUsersList', payload: false });

      // Lock mic, webcam, screen share for all non-admins
      const servicesToLock = ['mic', 'webcam', 'screenShare'];
      for (const service of servicesToLock) {
        const body = create(UpdateUserLockSettingsReqSchema, {
          roomSid,
          roomId,
          userId: 'all',
          service,
          direction: 'lock',
        });
        await sendAPIRequest(
          'updateLockSettings',
          toBinary(UpdateUserLockSettingsReqSchema, body),
          false,
          'application/protobuf',
          'arraybuffer',
        );
      }
    } else {
      // Switch to Meeting mode
      dispatch(updateAdminOnlyWebcams(false));
      dispatch(updateAllowViewOtherWebcams(true));
      
      // Send NATS message to show participant list globally
      const msg = JSON.stringify({ type: 'CUSTOM_LOCK_SETTING', service: 'allow_view_other_users_list', enabled: true });
      await getNatsConn().sendDataMessage(DataMsgBodyType.INFO, msg);
      dispatch({ type: 'session/updateAllowViewOtherUsersList', payload: true });

      // Unlock mic, webcam, screen share for all non-admins
      const servicesToLock = ['mic', 'webcam', 'screenShare'];
      for (const service of servicesToLock) {
        const body = create(UpdateUserLockSettingsReqSchema, {
          roomSid,
          roomId,
          userId: 'all',
          service,
          direction: 'unlock',
        });
        await sendAPIRequest(
          'updateLockSettings',
          toBinary(UpdateUserLockSettingsReqSchema, body),
          false,
          'application/protobuf',
          'arraybuffer',
        );
      }
    }
  };

  const getVideoQualityText = (quality: VideoQuality) => {
    switch (quality) {
      case VideoQuality.LOW:
        return t('header.room-settings.low');
      case VideoQuality.MEDIUM:
        return t('header.room-settings.medium');
      case VideoQuality.HIGH:
        return t('header.room-settings.high');
      default:
        return '';
    }
  };

  return (
    <div className="mt-2">
      {/* Meeting/Webinar Mode Toggle - Admin only */}
      {isAdmin && (
        <div className="mb-4 p-3 rounded-lg bg-Blue-50 dark:bg-Blue-900/20 border border-Blue-200 dark:border-Blue-800">
          <SettingsSwitch
            label={isMeetingMode ? '👥 Meeting (Mọi người thấy nhau)' : '👨‍🏫 Webinar (Chỉ xem Admin)'}
            enabled={isMeetingMode}
            onChange={toggleMeetingMode}
            customCss=""
            icon={<Camera classes="" />}
          />
          <p className="text-xs text-Gray-500 dark:text-Gray-400 mt-1 ml-8">
            {isMeetingMode
              ? 'Tất cả thành viên có thể xem Camera của nhau'
              : 'Khán giả chỉ xem được Camera của Admin'}
          </p>
        </div>
      )}

      <Dropdown
        label={t('header.room-settings.video-quality')}
        id="video-quality"
        value={videoQuality}
        onChange={(v) => dispatch(updateRoomVideoQuality(v as VideoQuality))}
        options={Object.values(VideoQuality)
          .filter((q) => typeof q === 'number')
          .map((q) => {
            return {
              value: q,
              text: getVideoQualityText(q as VideoQuality),
            };
          })}
        direction="horizontal"
        icon={<PlayerIconSVG />}
      />

      <SettingsSwitch
        label={t('header.room-settings.show-screen-share')}
        enabled={activeScreenSharingView}
        onChange={toggleScreenShareView}
        customCss="my-4"
        icon={<ShareScreenIconSVG classes="" />}
      />

      <SettingsSwitch
        label={t('header.room-settings.show-webcams')}
        enabled={activateWebcamsView}
        onChange={toggleWebcamView}
        customCss="my-4"
        icon={<Camera classes="" />}
      />
      {activateWebcamsView && (
        <Dropdown
          label={t('header.room-settings.max-num-webcam')}
          id="max-num-webcam"
          value={maxNumDisplayWebcams || 32}
          onChange={(v) => dispatch(updateMaxNumDisplayWebcams(v))}
          options={numWebcamsOpts}
          direction="horizontal"
          icon={<ParticipantsMenuIconSVG classes="" />}
        />
      )}
    </div>
  );
};

export default DataSavings;

