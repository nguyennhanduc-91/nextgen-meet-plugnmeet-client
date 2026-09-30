import React, { useCallback, useMemo, useState } from 'react';
import { MenuItem } from '@headlessui/react';
import { toast } from 'react-toastify';
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import {
  CommonResponseSchema,
  UpdateUserLockSettingsReqSchema,
} from 'plugnmeet-protocol-js';

import { store, useAppSelector } from '../../../../../store';
import { participantsSelector } from '../../../../../store/slices/participantSlice';
import sendAPIRequest from '../../../../../helpers/api/plugNmeetAPI';

interface IPromoteMenuItemProps {
  userId: string;
}

const PromoteMenuItem = ({ userId }: IPromoteMenuItemProps) => {
  const [isBusy, setIsBusy] = useState<boolean>(false);

  const { roomId, sid } = useMemo(() => {
    const session = store.getState().session;
    return {
      roomId: session.currentRoom.roomId,
      sid: session.currentRoom.sid,
    };
  }, []);

  const lockSettings = useAppSelector(
    (state) =>
      participantsSelector.selectById(state, userId)?.metadata?.lockSettings,
  );

  // If mic and webcam are currently locked, they are an attendee.
  const isPromoted = !(lockSettings?.lockMicrophone && lockSettings?.lockWebcam);

  const togglePromote = useCallback(async () => {
    if (isBusy) {
      return;
    }
    setIsBusy(true);

    const direction = isPromoted ? 'lock' : 'unlock';
    const services = ['mic', 'webcam', 'screenShare'];

    let successCount = 0;
    for (const service of services) {
      const body = create(UpdateUserLockSettingsReqSchema, {
        roomSid: sid,
        roomId: roomId,
        userId: userId,
        service: service,
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
      if (res.status) successCount++;
    }

    if (successCount === services.length) {
      toast(isPromoted ? 'Đã thu hồi quyền phát biểu' : 'Đã cấp quyền phát biểu thành công', {
        type: 'success',
      });
    } else {
      toast('Có lỗi xảy ra khi cập nhật quyền', {
        type: 'error',
      });
    }
    setIsBusy(false);
  }, [userId, sid, roomId, isBusy, isPromoted]);

  return (
    <div role="none">
      <MenuItem>
        {() => (
          <button
            className="flex items-center gap-3 min-h-8 cursor-pointer py-1.5 w-full text-sm text-left font-medium text-Gray-950 dark:text-white px-3 rounded-lg transition-all duration-300 hover:bg-Blue-50 dark:hover:bg-Blue-900/30 group"
            onClick={togglePromote}
            disabled={isBusy}
          >
            <div className={`w-5 h-5 flex items-center justify-center flex-shrink-0 transition-colors [&>svg]:w-full [&>svg]:h-full ${isPromoted ? 'text-amber-500' : 'text-Green-500'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isPromoted ? (
                  <>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </>
                ) : (
                  <>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <line x1="20" y1="8" x2="20" y2="14"></line>
                    <line x1="23" y1="11" x2="17" y2="11"></line>
                  </>
                )}
              </svg>
            </div>
            <span className="truncate">
              {isPromoted ? 'Thu hồi quyền phát biểu' : 'Cấp quyền phát biểu'}
            </span>
          </button>
        )}
      </MenuItem>
    </div>
  );
};

export default PromoteMenuItem;
