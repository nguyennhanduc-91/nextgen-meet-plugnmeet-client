import React, { useCallback, useMemo, useState } from 'react';
import { MenuItem } from '@headlessui/react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import {
  CommonResponseSchema,
  UpdateUserLockSettingsReqSchema,
} from 'plugnmeet-protocol-js';

import { store, useAppSelector } from '../../../../../store';
import { participantsSelector } from '../../../../../store/slices/participantSlice';
import { ICurrentUserMetadata } from '../../../../../store/slices/interfaces/session';
import sendAPIRequest from '../../../../../helpers/api/plugNmeetAPI';
import { RoomLockIconSVG } from '../../../../../assets/Icons/RoomLockIconSVG';

interface ILockSettingMenuItemProps {
  userId: string;
}

const serviceToLockSettingMap: Record<
  string,
  keyof NonNullable<ICurrentUserMetadata['lockSettings']>
> = {
  mic: 'lockMicrophone',
  webcam: 'lockWebcam',
  screenShare: 'lockScreenSharing',
  whiteboard: 'lockWhiteboard',
  sharedNotepad: 'lockSharedNotepad',
  chat: 'lockChat',
  sendChatMsg: 'lockChatSendMessage',
  chatFile: 'lockChatFileShare',
};

const LockSettingMenuItem = ({ userId }: ILockSettingMenuItemProps) => {
  const { t } = useTranslation();
  const [isBusy, setIsBusy] = useState<boolean>(false);

  // all static values
  const { roomId, sid, roomFeatures } = useMemo(() => {
    const session = store.getState().session;
    return {
      roomId: session.currentRoom.roomId,
      sid: session.currentRoom.sid,
      roomFeatures: session.currentRoom.metadata?.roomFeatures,
    };
  }, []);

  const lockSettings = useAppSelector(
    (state) =>
      participantsSelector.selectById(state, userId)?.metadata?.lockSettings,
  );

  const toggleLockSetting = useCallback(
    async (task: string) => {
      if (isBusy) {
        return;
      }
      setIsBusy(true);

      const settingKey = serviceToLockSettingMap[task];
      const isLocked = !!lockSettings?.[settingKey];
      const direction = isLocked ? 'unlock' : 'lock';

      const body = create(UpdateUserLockSettingsReqSchema, {
        roomSid: sid,
        roomId: roomId,
        userId: userId,
        service: task,
        direction,
      });

      const r = await sendAPIRequest(
        'updateLockSettings',
        toBinary(UpdateUserLockSettingsReqSchema, body),
        false,
        'application/protobuf',
        'arraybuffer',
      );
      const res = fromBinary(CommonResponseSchema, new Uint8Array(r));

      if (res.status) {
        toast(t('left-panel.menus.notice.applied-new-setting'), {
          toastId: 'lock-setting-status',
          type: 'info',
        });
      } else {
        toast(t(res.msg), {
          type: 'error',
        });
      }
      setIsBusy(false);
    },
    [userId, sid, roomId, t, isBusy, lockSettings],
  );

  const lockableFeatures = [
    {
      key: 'mic',
      isDisplayed: true,
      isLocked: lockSettings?.lockMicrophone,
      lockText: 'Khóa Micro',
      unlockText: 'Mở khóa Micro',
    },
    {
      key: 'webcam',
      isDisplayed:
        roomFeatures?.allowWebcams && !roomFeatures?.adminOnlyWebcams,
      isLocked: lockSettings?.lockWebcam,
      lockText: 'Khóa Camera',
      unlockText: 'Mở khóa Camera',
    },
    {
      key: 'screenShare',
      isDisplayed: roomFeatures?.allowScreenShare,
      isLocked: lockSettings?.lockScreenSharing,
      lockText: 'Khóa Chia sẻ MH',
      unlockText: 'Mở khóa Chia sẻ MH',
    },
    {
      key: 'whiteboard',
      isDisplayed: roomFeatures?.whiteboardFeatures?.isAllow,
      isLocked: lockSettings?.lockWhiteboard,
      lockText: 'Khóa Bảng trắng',
      unlockText: 'Mở khóa Bảng trắng',
    },
    {
      key: 'sharedNotepad',
      isDisplayed: roomFeatures?.sharedNotePadFeatures?.isAllow,
      isLocked: lockSettings?.lockSharedNotepad,
      lockText: 'Khóa Ghi chú',
      unlockText: 'Mở khóa Ghi chú',
    },
    {
      key: 'chat',
      isDisplayed: roomFeatures?.chatFeatures?.isAllow,
      isLocked: lockSettings?.lockChat,
      lockText: 'Khóa Chat',
      unlockText: 'Mở khóa Chat',
    },
    {
      key: 'sendChatMsg',
      isDisplayed: roomFeatures?.chatFeatures?.isAllow,
      isLocked: lockSettings?.lockChatSendMessage,
      lockText: 'Khóa gửi tin nhắn',
      unlockText: 'Mở khóa gửi tin nhắn',
    },
    {
      key: 'chatFile',
      isDisplayed:
        roomFeatures?.chatFeatures?.isAllow &&
        roomFeatures?.chatFeatures?.isAllowFileUpload,
      isLocked: lockSettings?.lockChatFileShare,
      lockText: 'Khóa gửi file',
      unlockText: 'Mở khóa gửi file',
    },
  ];

  return lockableFeatures.map(
    (feature) =>
      feature.isDisplayed && (
        <div role="none" key={feature.key}>
          <MenuItem>
            {() => (
              <button
                className="flex items-center gap-3 min-h-8 cursor-pointer py-1.5 w-full text-sm text-left font-medium text-Gray-950 dark:text-white px-3 rounded-lg transition-all duration-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 group"
                onClick={() => toggleLockSetting(feature.key)}
              >
                <div className={`w-5 h-5 flex items-center justify-center flex-shrink-0 transition-colors [&>svg]:w-full [&>svg]:h-full ${feature.isLocked ? 'text-amber-500 dark:text-amber-400' : 'text-Gray-500 dark:text-Gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400'}`}>
                  <RoomLockIconSVG />
                </div>
                <span className="truncate">
                  {feature.isLocked ? feature.unlockText : feature.lockText}
                </span>
              </button>
            )}
          </MenuItem>
        </div>
      ),
  );
};

export default LockSettingMenuItem;
