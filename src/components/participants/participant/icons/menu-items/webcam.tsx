import React, { useMemo } from 'react';
import { MenuItem } from '@headlessui/react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { DataMsgBodyType } from 'plugnmeet-protocol-js';

import { store, useAppSelector } from '../../../../../store';
import { participantsSelector } from '../../../../../store/slices/participantSlice';
import { getNatsConn } from '../../../../../helpers/nats';

import { Camera } from '../../../../../assets/Icons/Camera';
import { CameraOff } from '../../../../../assets/Icons/CameraOff';

interface IWebcamMenuItemProps {
  userId: string;
}
const WebcamMenuItem = ({ userId }: IWebcamMenuItemProps) => {
  const { t } = useTranslation();
  const name = useAppSelector(
    (state) => participantsSelector.selectById(state, userId)?.name,
  );
  const videoTracks = useAppSelector(
    (state) => participantsSelector.selectById(state, userId)?.videoTracks,
  );

  const session = store.getState().session;
  const roomFeatures = session.currentRoom.metadata?.roomFeatures;
  const conn = getNatsConn();

  const { text, task, icon } = useMemo(() => {
    if (!videoTracks) {
      return {
        text: 'Yêu cầu mở Camera',
        task: 'left-panel.menus.items.share-webcam',
        icon: <Camera classes="" />,
      };
    } else {
      return {
        text: 'Yêu cầu tắt Camera',
        task: 'left-panel.menus.items.stop-webcam',
        icon: <CameraOff classes="" />,
      };
    }
  }, [t, videoTracks]);

  const handleWebcamAction = async () => {
    conn.sendDataMessage(
      DataMsgBodyType.INFO,
      t('left-panel.menus.notice.asked-you-to', {
        name: session.currentUser?.name,
        task: t(task),
      }),
      userId,
    );

    toast(
      t('left-panel.menus.notice.you-have-asked', {
        name: name,
        task: t(task),
      }),
      {
        toastId: 'asked-status',
        type: 'info',
      },
    );
  };

  // Conditions to show this menu item
  const shouldShow =
    session.currentUser?.userId !== userId &&
    roomFeatures?.allowWebcams &&
    !roomFeatures.adminOnlyWebcams;

  if (!shouldShow) {
    return null;
  }

  return (
    <MenuItem>
      <button
        className="flex items-center gap-3 min-h-8 cursor-pointer py-1.5 w-full text-sm text-left font-medium text-Gray-950 dark:text-white px-3 rounded-lg transition-all duration-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 group"
        onClick={handleWebcamAction}
      >
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-Gray-500 dark:text-Gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors [&>svg]:w-full [&>svg]:h-full">
          {icon}
        </div>
        <span className="truncate">{text}</span>
      </button>
    </MenuItem>
  );
};

export default WebcamMenuItem;
