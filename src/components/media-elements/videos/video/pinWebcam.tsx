import React, { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from '../../../../store';
import { togglePinCamUserId } from '../../../../store/slices/roomSettingsSlice';

interface IPinWebcamProps {
  userId: string;
}

const PinWebcam = ({ userId }: IPinWebcamProps) => {
  const dispatch = useAppDispatch();
  const pinnedCamUserIds = useAppSelector(
    (state) => state.roomSettings.pinnedCamUserIds,
  );
  const [isPinCamActive, setIsPinCamActive] = useState<boolean>(false);

  useEffect(() => {
    setIsPinCamActive(!!(pinnedCamUserIds && pinnedCamUserIds.includes(userId)));
  }, [pinnedCamUserIds, userId]);

  const togglePin = useCallback(() => {
    dispatch(togglePinCamUserId(userId));
  }, [userId, dispatch]);

  return (
    <div
      className="pin-webcam cursor-pointer w-7 h-7 rounded-full bg-Gray-950/50 shadow-shadowXS flex items-center justify-center"
      onClick={togglePin}
    >
      {isPinCamActive ? (
        <i className="pnm-pin text-white text-[12px]" />
      ) : (
        <i className="pnm-pin -rotate-90 text-white text-[12px]" />
      )}
    </div>
  );
};

export default PinWebcam;
