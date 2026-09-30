import React, { useCallback, useMemo, useState } from 'react';
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import { useTranslation } from 'react-i18next';
import {
  CommonResponseSchema,
  UpdateUserLockSettingsReqSchema,
  DataMsgBodyType,
} from 'plugnmeet-protocol-js';

import { store, useAppDispatch, useAppSelector } from '../../../store';
import { updateShowLockSettingsModal } from '../../../store/slices/bottomIconsActivitySlice';
import sendAPIRequest from '../../../helpers/api/plugNmeetAPI';
import { addUserNotification, updateIsWatermarkEnabled, updateIsFocusModeEnabled, updateIsHostOnlyChatEnabled, updateIsRequireVideoEnabled, updateIsLockReactionsEnabled } from '../../../store/slices/roomSettingsSlice';
import { getNatsConn } from '../../../helpers/nats';
import Modal from '../../../helpers/ui/modal';
import SettingsSwitch from '../../../helpers/ui/settingsSwitch';
import Tabs from '../../../helpers/ui/tabs';

// Import Icons
import { Microphone } from '../../../assets/Icons/Microphone';
import { Camera } from '../../../assets/Icons/Camera';
import { ChatIconSVG } from '../../../assets/Icons/ChatIconSVG';
import SendIconSVG from '../../../assets/Icons/SendIconSVG';
import { FileIconSVG } from '../../../assets/Icons/FileIconSVG';
import { ShareScreenIconSVG } from '../../../assets/Icons/ShareScreenIconSVG';
import { WhiteBoardIconSVG } from '../../../assets/Icons/WhiteBoardIconSVG';
import { SharedNotepadIconSVG } from '../../../assets/Icons/SharedNotepadIconSVG';
import { RoomLockIconSVG } from '../../../assets/Icons/RoomLockIconSVG';
import { EmojiIconSVG } from '../../../assets/Icons/EmojiIconSVG';
import { PenIconSVG } from '../../../assets/Icons/PenIconSVG';
import { StampIconSVG } from '../../../assets/Icons/StampIconSVG';
import { WaitingRoomIconSVG } from '../../../assets/Icons/WaitingRoomIconSVG';
import { FocusModeIconSVG } from '../../../assets/Icons/FocusModeIconSVG';
import { HandsIconSVG } from '../../../assets/Icons/HandsIconSVG';
import { ParticipantsIconSVG } from '../../../assets/Icons/ParticipantsIconSVG';

const LockSettingsModal = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const { roomSid, roomId } = useMemo(() => {
    const session = store.getState().session;
    return {
      roomSid: session.currentRoom.sid,
      roomId: session.currentRoom.roomId,
    };
  }, []);

  const roomLockSettings = useAppSelector(
    (state) => state.session.currentRoom.metadata?.defaultLockSettings,
  );
  
  const session = useAppSelector((state) => state.session);
  const isRequireVideoEnabled = useAppSelector((state) => state.roomSettings.isRequireVideoEnabled);
  const isHostOnlyChatEnabled = useAppSelector((state) => state.roomSettings.isHostOnlyChatEnabled);
  const isLockReactionsEnabled = useAppSelector((state) => state.roomSettings.isLockReactionsEnabled);
  const isFocusModeEnabled = useAppSelector((state) => state.roomSettings.isFocusModeEnabled);
  const isWatermarkEnabled = useAppSelector((state) => state.roomSettings.isWatermarkEnabled);
  const allowViewOtherUsersList = useAppSelector((state) => state.session.currentRoom.metadata?.roomFeatures?.allowViewOtherUsersList ?? true);

  const updateLockSettings = useCallback(
    async (status: boolean, service: string) => {
      if (isBusy) {
        return;
      }
      setIsBusy(true);

      const direction = status ? 'lock' : 'unlock';
      
      const customLocalServices = ['watermark', 'focus_mode', 'host_only_chat', 'require_video', 'lock_reactions', 'allow_view_other_users_list'];
      if (customLocalServices.includes(service)) {
        const msg = JSON.stringify({ type: 'CUSTOM_LOCK_SETTING', service, enabled: status });
        try {
          await getNatsConn().sendDataMessage(DataMsgBodyType.INFO, msg);
          
          if (service === 'watermark') dispatch(updateIsWatermarkEnabled(status));
          if (service === 'focus_mode') dispatch(updateIsFocusModeEnabled(status));
          if (service === 'host_only_chat') dispatch(updateIsHostOnlyChatEnabled(status));
          if (service === 'require_video') dispatch(updateIsRequireVideoEnabled(status));
          if (service === 'lock_reactions') dispatch(updateIsLockReactionsEnabled(status));
          if (service === 'allow_view_other_users_list') {
            dispatch({ type: 'session/updateAllowViewOtherUsersList', payload: status });
          }
          
          dispatch(
            addUserNotification({
              message: t('footer.notice.applied-settings'),
              typeOption: 'info',
            }),
          );
        } catch (e: any) {
          dispatch(addUserNotification({ message: e.message, typeOption: 'error' }));
        }
        setIsBusy(false);
        return;
      }

      const body = create(UpdateUserLockSettingsReqSchema, {
        roomSid,
        roomId,
        userId: 'all',
        service,
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
        dispatch(
          addUserNotification({
            message: t('footer.notice.applied-settings'),
            typeOption: 'info',
          }),
        );
      } else {
        dispatch(
          addUserNotification({
            message: res.msg,
            typeOption: 'error',
          }),
        );
      }

      setIsBusy(false);
    },
    // oxlint-disable-next-line exhaustive-deps
    [isBusy, t, dispatch],
  );

  const closeModal = () => {
    dispatch(updateShowLockSettingsModal(false));
  };

  const deviceOptions = [
    {
      label: t('footer.modal.lock-microphone'),
      icon: <Microphone classes="" />,
      checked: roomLockSettings?.lockMicrophone ?? false,
      service: 'mic',
    },
    {
      label: t('footer.modal.lock-webcams'),
      icon: <Camera classes="" />,
      checked: roomLockSettings?.lockWebcam ?? false,
      service: 'webcam',
    },
    {
      label: 'Tắt Micro khi mới vào phòng',
      icon: <Microphone classes="" />,
      checked: session?.currentRoom?.metadata?.roomFeatures?.muteOnStart ?? false,
      disabled: true,
      service: 'mute_on_entry',
    },
    {
      label: 'Yêu cầu bật Camera để tham gia',
      icon: <Camera classes="" />,
      checked: isRequireVideoEnabled,
      service: 'require_video',
    },
  ];

  const chatOptions = [
    {
      label: t('footer.modal.lock-chat'),
      icon: <ChatIconSVG />,
      checked: roomLockSettings?.lockChat ?? false,
      service: 'chat',
    },
    {
      label: t('footer.modal.lock-send-message'),
      icon: <SendIconSVG />,
      checked: roomLockSettings?.lockChatSendMessage ?? false,
      service: 'sendChatMsg',
    },
    {
      label: t('footer.modal.lock-chat-file-share'),
      icon: <FileIconSVG />,
      checked: roomLockSettings?.lockChatFileShare ?? false,
      service: 'chatFile',
    },
    {
      label: t('footer.modal.lock-private-chat'),
      icon: <ChatIconSVG />,
      checked: roomLockSettings?.lockPrivateChat ?? false,
      service: 'privateChat',
    },
    {
      label: 'Chế độ Chat "Chỉ với Host"',
      icon: <ChatIconSVG />,
      checked: isHostOnlyChatEnabled,
      service: 'host_only_chat',
    },
    {
      label: 'Khóa thả biểu tượng cảm xúc',
      icon: <EmojiIconSVG />,
      checked: isLockReactionsEnabled,
      service: 'lock_reactions',
    },
  ];

  const collabOptions = [
    {
      label: t('footer.modal.lock-screen-sharing'),
      icon: <ShareScreenIconSVG classes="" />,
      checked: roomLockSettings?.lockScreenSharing ?? false,
      service: 'screenShare',
    },
    {
      label: t('footer.modal.lock-whiteboard'),
      icon: <WhiteBoardIconSVG />,
      checked: roomLockSettings?.lockWhiteboard ?? false,
      service: 'whiteboard',
    },
    {
      label: t('footer.modal.lock-shared-notepad'),
      icon: <SharedNotepadIconSVG classes="" />,
      checked: roomLockSettings?.lockSharedNotepad ?? false,
      service: 'sharedNotepad',
    },
    {
      label: 'Cấm chú thích lên màn hình chia sẻ',
      icon: <PenIconSVG classes="" />,
      checked: false,
      disabled: true,
      service: 'disable_annotation',
    },
  ];

  const securityOptions = [
    {
      label: 'Khóa phòng họp',
      icon: <RoomLockIconSVG />,
      checked: false,
      disabled: true,
      service: 'hard_lock',
    },
    {
      label: 'Bật phòng chờ',
      icon: <WaitingRoomIconSVG classes="" />,
      checked: session?.currentRoom?.metadata?.roomFeatures?.waitingRoomFeatures?.isActive ?? false,
      disabled: true,
      service: 'waiting_room',
    },
    {
      label: 'Chế độ Tập trung',
      icon: <FocusModeIconSVG classes="" />,
      checked: isFocusModeEnabled,
      service: 'focus_mode',
    },
    {
      label: 'Đóng dấu Bản quyền (Watermark)',
      icon: <StampIconSVG classes="" />,
      checked: isWatermarkEnabled,
      service: 'watermark',
    },
    {
      label: 'Khóa tính năng Giơ tay',
      icon: <HandsIconSVG classes="" />,
      checked: session?.currentRoom?.metadata?.roomFeatures?.allowRaiseHand === false,
      disabled: true,
      service: 'disable_raise_hand',
    },
    {
      label: 'Cho phép Khách xem danh sách',
      icon: <ParticipantsIconSVG />,
      checked: allowViewOtherUsersList,
      service: 'allow_view_other_users_list',
    },
  ];

  const renderOptions = (options: any[]) => (
    <div className="flex flex-col gap-4 py-2">
      {options.map((option) => (
        <SettingsSwitch
          key={option.service}
          label={option.label}
          icon={option.icon}
          enabled={option.checked}
          onChange={(e) => updateLockSettings(e, option.service)}
          disabled={isBusy || option.disabled}
        />
      ))}
    </div>
  );

  const tabItems = [
    {
      id: 'devices',
      title: 'Thiết bị',
      content: renderOptions(deviceOptions),
    },
    {
      id: 'chat',
      title: 'Trò chuyện',
      content: renderOptions(chatOptions),
    },
    {
      id: 'collab',
      title: 'Cộng tác',
      content: renderOptions(collabOptions),
    },
    {
      id: 'security',
      title: 'Bảo mật',
      content: renderOptions(securityOptions),
    },
  ];

  return (
    <Modal
      show={true}
      onClose={closeModal}
      title={t('footer.modal.lock-settings-title')}
    >
      <div className="min-h-[300px]">
        <Tabs items={tabItems} />
      </div>
    </Modal>
  );
};

export default LockSettingsModal;

