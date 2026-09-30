import React from 'react';
import { MenuItem } from '@headlessui/react';
import { useTranslation } from 'react-i18next';

import { useAppDispatch } from '../../../../../store';
import {
  updateInitiatePrivateChat,
  updateSelectedChatOption,
} from '../../../../../store/slices/roomSettingsSlice';
import { setActiveSidePanel } from '../../../../../store/slices/bottomIconsActivitySlice';
import { ChatIconSVG } from '../../../../../assets/Icons/ChatIconSVG';

interface IChatMenuItemProps {
  userId: string;
  name: string;
}
const PrivateChatMenuItem = ({ name, userId }: IChatMenuItemProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const initiatePrivateChat = () => {
    dispatch(setActiveSidePanel('CHAT'));
    dispatch(
      updateInitiatePrivateChat({
        name,
        userId,
      }),
    );
    dispatch(updateSelectedChatOption(userId));
  };
  return (
    <div className="" role="none">
      <MenuItem>
        {() => (
          <button
            className="flex items-center gap-3 min-h-8 cursor-pointer py-1.5 w-full text-sm text-left font-medium text-Gray-950 dark:text-white px-3 rounded-lg transition-all duration-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 group"
            onClick={initiatePrivateChat}
          >
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-Gray-500 dark:text-Gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors [&>svg]:w-full [&>svg]:h-full">
              <ChatIconSVG />
            </div>
            <span className="truncate">Nhắn tin riêng</span>
          </button>
        )}
      </MenuItem>
    </div>
  );
};

export default PrivateChatMenuItem;
