import { useCallback, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import {
  CommonResponseSchema,
  RoomEndAPIReqSchema,
} from 'plugnmeet-protocol-js';
import { Button } from '@headlessui/react';

import { store, useAppSelector } from '../../../store';
import { participantsSelector } from '../../../store/slices/participantSlice';
import sendAPIRequest from '../../../helpers/api/plugNmeetAPI';
import { getNatsConn } from '../../../helpers/nats';
import ConfirmationModal from '../../../helpers/ui/confirmationModal';
import { EndMeetingIconSVG } from '../../../assets/Icons/EndMeetingIconSVG';

const EndMeetingButton = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [alertText, setAlertText] = useState<string>('');
  const [isBusy, setIsBusy] = useState<boolean>(false);

  const { t } = useTranslation();
  const conn = getNatsConn();
  const { isAdmin, roomId } = useMemo(() => {
    const session = store.getState().session;
    return {
      isAdmin: session.currentUser?.metadata?.isAdmin,
      roomId: session.currentRoom.roomId,
    };
  }, []);

  const totalAdminsCount = useAppSelector(
    (state) => participantsSelector.selectAll(state).filter(p => p?.metadata?.isAdmin).length
  );

  function open() {
    if (isAdmin) {
      if (totalAdminsCount >= 2) {
        setAlertText('Trong phòng đang có nhiều Quản trị viên. Bạn muốn kết thúc phòng họp cho tất cả, hay chỉ rời đi một mình?');
      } else {
        setAlertText(t('header.menus.alert.end').toString());
      }
    } else {
      setAlertText(t('header.menus.alert.logout').toString());
    }

    setIsOpen(true);
  }

  const handleLeaveOnly = useCallback(async () => {
    if (isBusy) return;
    setIsBusy(true);
    await conn.endSession('notifications.user-logged-out');
    setIsBusy(false);
    setIsOpen(false);
  }, [isBusy, conn]);

  const onConfirm = useCallback(async () => {
    if (isBusy) {
      return;
    }
    setIsBusy(true);

    if (!isAdmin) {
      await conn.endSession('notifications.user-logged-out');
    } else {
      const id = toast.loading(t('notifications.ending-session'), {
        type: 'info',
      });

      const body = create(RoomEndAPIReqSchema, {
        roomId: roomId,
      });
      const r = await sendAPIRequest(
        'endRoom',
        toBinary(RoomEndAPIReqSchema, body),
        false,
        'application/protobuf',
        'arraybuffer',
      );
      const res = fromBinary(CommonResponseSchema, new Uint8Array(r));
      if (!res.status) {
        toast.update(id, {
          render: t(res.msg),
          type: 'error',
          isLoading: false,
          autoClose: 3000,
        });
      } else {
        toast.dismiss(id);
      }
    }
    setIsBusy(false);
    setIsOpen(false);
  }, [isBusy, isAdmin, conn, roomId, t]);

  return (
    <>
      <Button
        onClick={open}
        className="relative footer-icon cursor-pointer w-9 md:w-10 3xl:w-11 h-9 md:h-10 3xl:h-11 rounded-[10px] md:rounded-[12px] 3xl:rounded-[15px] border-[2px] 3xl:border-[3px] border-Red-400/30 dark:border-Red-600/30 group"
      >
        <div className="footer-icon-bg h-full w-full flex items-center justify-center rounded-[8px] md:rounded-[10px] 3xl:rounded-[12px] border border-Red-300 dark:border-Red-700 shadow transition-all duration-300 bg-Red-50 dark:bg-Red-900/30 hover:bg-Red-100 dark:hover:bg-Red-800/50 text-Red-500 dark:text-Red-400 has-tooltip">
          <span className="tooltip">
            {isAdmin ? t('header.menus.end') : t('header.menus.logout')}
          </span>
          <EndMeetingIconSVG />
        </div>
      </Button>

      <ConfirmationModal
        show={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={onConfirm}
        alternateBtnText={isAdmin && totalAdminsCount >= 2 ? 'Chỉ tôi rời phòng' : undefined}
        onAlternateAction={isAdmin && totalAdminsCount >= 2 ? handleLeaveOnly : undefined}
        title={t('header.menus.alert.confirm')}
        text={alertText}
      />
    </>
  );
};

export default EndMeetingButton;
