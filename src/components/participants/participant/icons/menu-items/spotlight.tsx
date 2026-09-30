import React, { useEffect, useState } from 'react';
import { MenuItem } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { store, useAppSelector, useAppDispatch } from '../../../../../store';
import { addSpotlightUserId, removeSpotlightUserId } from '../../../../../store/slices/roomSettingsSlice';
import { StarIconSVG } from '../../../../../assets/Icons/StarIconSVG';
import { getNatsConn } from '../../../../../helpers/nats';
import { DataMsgBodyType } from 'plugnmeet-protocol-js';

interface ISpotlightMenuItemProps {
  userId: string;
}

const SpotlightMenuItem = ({ userId }: ISpotlightMenuItemProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [isSpotlighted, setIsSpotlighted] = useState(false);

  const spotlightUserIds = useAppSelector(
    (state) => state.roomSettings.spotlightUserIds,
  );

  useEffect(() => {
    setIsSpotlighted(!!(spotlightUserIds && spotlightUserIds.includes(userId)));
  }, [spotlightUserIds, userId]);

  const toggleSpotlight = () => {
    const action = isSpotlighted ? 'remove' : 'add';
    const payload = JSON.stringify({ type: 'GLOBAL_SPOTLIGHT', action, userId });
    
    // Broadcast to the entire room
    getNatsConn()?.sendDataMessage(DataMsgBodyType.INFO, payload);
    
    // Also dispatch locally immediately
    if (action === 'add') {
      dispatch(addSpotlightUserId(userId));
    } else {
      dispatch(removeSpotlightUserId(userId));
    }
  };

  return (
    <MenuItem>
      <button
        className="flex items-center gap-3 min-h-8 cursor-pointer py-1.5 w-full text-sm text-left font-medium text-Gray-950 dark:text-white px-3 rounded-lg transition-all duration-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 group"
        onClick={toggleSpotlight}
      >
        <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-Gray-500 dark:text-Gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors [&>svg]:w-full [&>svg]:h-full">
          <StarIconSVG />
        </div>
        <span className="truncate">
          {isSpotlighted ? 'Bỏ Tiêu điểm' : t('left-panel.menus.items.spotlight')}
        </span>
      </button>
    </MenuItem>
  );
};

export default SpotlightMenuItem;
