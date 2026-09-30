import React from 'react';
import { useTranslation } from 'react-i18next';

import { IParticipant } from '../../store/slices/interfaces/participant';
import sendAPIRequest from '../../helpers/api/plugNmeetAPI';
import {
  ApproveWaitingUsersReqSchema,
  CommonResponseSchema,
  RemoveParticipantReqSchema,
} from 'plugnmeet-protocol-js';
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';

import { store, useAppDispatch } from '../../store';
import { addUserNotification } from '../../store/slices/roomSettingsSlice';
import { CheckMarkIconSVG } from '../../assets/Icons/CheckMarkIconSVG';
import { CloseIconSVG } from '../../assets/Icons/CloseIconSVG';

interface IBulkActionProps {
  waitingParticipants: IParticipant[];
}

const BulkAction = ({ waitingParticipants }: IBulkActionProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const approveEveryone = () => {
    const body = create(ApproveWaitingUsersReqSchema);

    waitingParticipants.forEach(async (p) => {
      body.userId = p.userId;
      const r = await sendAPIRequest(
        'waitingRoom/approveUsers',
        toBinary(ApproveWaitingUsersReqSchema, body),
        false,
        'application/protobuf',
        'arraybuffer',
      );
      const res = fromBinary(CommonResponseSchema, new Uint8Array(r));

      if (!res.status) {
        dispatch(
          addUserNotification({
            message: t(res.msg),
            typeOption: 'error',
          }),
        );
      }
    });
  };

  const rejectEveryone = () => {
    const session = store.getState().session;
    const body = create(RemoveParticipantReqSchema, {
      sid: session.currentRoom.sid,
      roomId: session.currentRoom.roomId,
    });

    waitingParticipants.forEach(async (p) => {
      body.userId = p.userId;
      body.msg = t('notifications.you-have-reject');
      body.blockUser = false;

      const r = await sendAPIRequest(
        'removeParticipant',
        toBinary(RemoveParticipantReqSchema, body),
        false,
        'application/protobuf',
        'arraybuffer',
      );
      const res = fromBinary(CommonResponseSchema, new Uint8Array(r));

      if (!res.status) {
        dispatch(
          addUserNotification({
            message: t(res.msg),
            typeOption: 'error',
          }),
        );
      }
    });
  };

  return (
    <div className="bottom-area pt-6 mt-2 border-t border-Gray-100 dark:border-Gray-800 flex flex-col sm:flex-row justify-between items-center gap-3">
      <button
        onClick={approveEveryone}
        className="flex-1 w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-Blue hover:bg-Dark-blue text-white text-sm font-bold shadow-lg shadow-Blue/20 dark:shadow-none transition-all duration-300 cursor-pointer active:scale-[0.98]"
      >
        <CheckMarkIconSVG />
        {t('waiting-room.accept-all')}
      </button>
      <button
        onClick={rejectEveryone}
        className="flex-1 w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-white dark:bg-Gray-900 border-2 border-Red-400/20 hover:border-Red-600 text-Red-600 dark:text-Red-400 text-sm font-bold transition-all duration-300 cursor-pointer active:scale-[0.98]"
      >
        <CloseIconSVG />
        {t('waiting-room.reject-all')}
      </button>
    </div>
  );
};

export default BulkAction;
