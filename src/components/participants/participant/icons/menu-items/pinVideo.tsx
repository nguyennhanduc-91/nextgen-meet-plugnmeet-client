import React, { useEffect, useState } from 'react';
import { MenuItem } from '@headlessui/react';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '../../../../../store';
import { togglePinCamUserId } from '../../../../../store/slices/roomSettingsSlice';
import { PinIconSVG } from '../../../../../assets/Icons/PinIconSVG';

interface IPinVideoMenuItemProps {
  userId: string;
}

const PinVideoMenuItem = ({ userId }: IPinVideoMenuItemProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [isPinned, setIsPinned] = useState(false);

  const pinnedCamUserIds = useAppSelector(
    (state) => state.roomSettings.pinnedCamUserIds,
  );

  useEffect(() => {
    setIsPinned(!!(pinnedCamUserIds && pinnedCamUserIds.includes(userId)));
  }, [pinnedCamUserIds, userId]);

  const togglePin = () => {
    dispatch(togglePinCamUserId(userId));
  };

  return (
    <MenuItem>
      <button
        className="flex items-center gap-3 min-h-8 cursor-pointer py-1.5 w-full text-sm text-left font-medium text-Gray-950 dark:text-white px-3 rounded-lg transition-all duration-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 group"
        onClick={togglePin}
      >
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-Gray-500 dark:text-Gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors [&>svg]:w-full [&>svg]:h-full">
          <PinIconSVG />
        </div>
        <span className="truncate">
          {isPinned ? 'Bỏ ghim Video' : 'Ghim Video'}
        </span>
      </button>
    </MenuItem>
  );
};

export default PinVideoMenuItem;
