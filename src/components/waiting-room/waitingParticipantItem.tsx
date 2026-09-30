import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ApproveWaitingUsersReqSchema,
  CommonResponseSchema,
  RemoveParticipantReqSchema,
} from 'plugnmeet-protocol-js';
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';

import { IParticipant } from '../../store/slices/interfaces/participant';
import sendAPIRequest from '../../helpers/api/plugNmeetAPI';
import { store, useAppDispatch } from '../../store';
import { addUserNotification } from '../../store/slices/roomSettingsSlice';
import { generateAvatarInitial } from '../../helpers/utils';
import { LoadingIcon } from '../../assets/Icons/Loading';
import { CheckMarkIconSVG } from '../../assets/Icons/CheckMarkIconSVG';
import { CloseIconSVG } from '../../assets/Icons/CloseIconSVG';
import { ShieldIconSVG } from '../../assets/Icons/ShieldIconSVG';

interface IWaitingParticipantItemProps {
  participant: IParticipant;
}

const WaitingParticipantItem = ({
  participant,
}: IWaitingParticipantItemProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = useCallback(async () => {
    setIsProcessing(true);
    const body = create(ApproveWaitingUsersReqSchema, {
      userId: participant.userId,
    });

    const r = await sendAPIRequest(
      'waitingRoom/approveUsers',
      toBinary(ApproveWaitingUsersReqSchema, body),
      false,
      'application/protobuf',
      'arraybuffer',
    );
    const res = fromBinary(CommonResponseSchema, new Uint8Array(r));

    if (res.status) {
      dispatch(
        addUserNotification({
          message: t('left-panel.menus.notice.user-approved', {
            name: participant.name,
          }),
          typeOption: 'info',
        }),
      );
    } else {
      dispatch(
        addUserNotification({
          message: t(res.msg),
          typeOption: 'error',
        }),
      );
    }
  }, [dispatch, participant, t]);

  const handleReject = useCallback(
    async (block: boolean) => {
      setIsProcessing(true);
      const session = store.getState().session;
      const body = create(RemoveParticipantReqSchema, {
        sid: session.currentRoom.sid,
        roomId: session.currentRoom.roomId,
        userId: participant.userId,
        msg: t('notifications.you-have-reject').toString(),
        blockUser: block,
      });

      const r = await sendAPIRequest(
        'removeParticipant',
        toBinary(RemoveParticipantReqSchema, body),
        false,
        'application/protobuf',
        'arraybuffer',
      );
      const res = fromBinary(CommonResponseSchema, new Uint8Array(r));

      if (res.status) {
        dispatch(
          addUserNotification({
            message: t('left-panel.menus.notice.participant-removed'),
            typeOption: 'info',
          }),
        );
      } else {
        dispatch(
          addUserNotification({
            message: t(res.msg),
            typeOption: 'error',
          }),
        );
      }
    },
    [dispatch, participant, t],
  );

  const initials = generateAvatarInitial(participant.name);

  return (
    <div className="waiting-list-item flex items-center justify-between p-3 mb-2 bg-white dark:bg-Gray-900/50 rounded-2xl border border-Gray-100 dark:border-Gray-800 transition-all duration-300 hover:shadow-md group">
      <div className="flex items-center gap-3">
        <div className="thumb h-10 w-10 rounded-full bg-Blue/10 dark:bg-Blue/20 text-Blue text-sm font-bold flex items-center justify-center overflow-hidden shrink-0 border border-Blue/20">
          {participant.metadata.profilePic ? (
            <img
              src={participant.metadata.profilePic}
              alt={participant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-Gray-950 dark:text-white capitalize leading-tight">
            {participant.name}
          </p>
          <p className="text-[10px] text-Gray-500 dark:text-Gray-400 mt-0.5 uppercase tracking-wider font-semibold">
            {t('waiting-room.user-waiting', { name: participant.name })}
          </p>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        {isProcessing ? (
          <div className="w-8 h-8 flex justify-center items-center">
            <LoadingIcon className="w-5 h-5 animate-spin" fillColor="#6366f1" />
          </div>
        ) : (
          <>
            <button
              onClick={handleApprove}
              title={t('left-panel.approve')}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-Green-50 dark:bg-Green-700/10 text-Green-700 dark:text-Green-400 border border-Green-100 dark:border-Green-700/20 hover:bg-Green-700 hover:text-white transition-all duration-300 cursor-pointer"
            >
              <CheckMarkIconSVG />
            </button>
            <button
              onClick={() => handleReject(false)}
              title={t('left-panel.reject')}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-Red-50 dark:bg-Red-600/10 text-Red-600 dark:text-Red-400 border border-Red-100 dark:border-Red-600/20 hover:bg-Red-600 hover:text-white transition-all duration-300 cursor-pointer"
            >
              <CloseIconSVG />
            </button>
            <button
              onClick={() => handleReject(true)}
              title={t('waiting-room.reject-and-block-user')}
              className="h-8 w-8 flex items-center justify-center rounded-full bg-Gray-100 dark:bg-Gray-800 text-Gray-700 dark:text-Gray-300 border border-Gray-300 dark:border-Gray-700 hover:bg-Gray-950 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-300 cursor-pointer"
            >
              <ShieldIconSVG classes="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WaitingParticipantItem;
