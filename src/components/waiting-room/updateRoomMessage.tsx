import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CommonResponseSchema,
  UpdateWaitingRoomMessageReqSchema,
} from 'plugnmeet-protocol-js';
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';

import { useAppDispatch, useAppSelector } from '../../store';
import sendAPIRequest from '../../helpers/api/plugNmeetAPI';
import { addUserNotification } from '../../store/slices/roomSettingsSlice';

const UpdateRoomMessage = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const waitingRoomMessage = useAppSelector(
    (state) =>
      state.session.currentRoom.metadata?.roomFeatures?.waitingRoomFeatures
        ?.waitingRoomMsg,
  );
  const [message, setMessage] = useState<string>(waitingRoomMessage ?? '');

  const updateRoomMsg = async () => {
    if (message === '') {
      return;
    }
    const body = create(UpdateWaitingRoomMessageReqSchema, {
      msg: message,
    });

    const r = await sendAPIRequest(
      'waitingRoom/updateMsg',
      toBinary(UpdateWaitingRoomMessageReqSchema, body),
      false,
      'application/protobuf',
      'arraybuffer',
    );
    const res = fromBinary(CommonResponseSchema, new Uint8Array(r));

    if (res.status) {
      dispatch(
        addUserNotification({
          message: t('waiting-room.updated-msg'),
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
  };

  return (
    <div className="bg-Blue/5 dark:bg-Blue2-500/5 p-4 rounded-2xl border border-Blue/10 dark:border-Blue2-500/10 mb-6">
      <label className="block text-[11px] font-bold text-Blue dark:text-Blue2-600 uppercase tracking-widest mb-2 px-1">
        {t('waiting-room.update-waiting-message')}
      </label>
      <div className="relative">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.currentTarget.value)}
          className="border border-Gray-200 dark:border-Gray-800 bg-white dark:bg-dark-primary shadow-sm block px-4 py-3 w-full h-24 rounded-xl outline-hidden focus:border-Blue focus:ring-2 focus:ring-Blue/20 text-sm text-gray-950 dark:text-white transition-all resize-none"
          placeholder="VD: Chào mừng bạn, vui lòng đợi trong giây lát..."
        ></textarea>
        <button
          onClick={updateRoomMsg}
          className="absolute bottom-2 right-2 flex items-center gap-1.5 px-4 py-1.5 bg-Blue hover:bg-Dark-blue text-white text-xs font-bold rounded-lg shadow-lg shadow-Blue/20 transition-all duration-300 cursor-pointer active:scale-95"
        >
          <i className="pnm-settings-solid text-[10px]" />
          {t('waiting-room.update-msg')}
        </button>
      </div>
    </div>
  );
};

export default UpdateRoomMessage;
