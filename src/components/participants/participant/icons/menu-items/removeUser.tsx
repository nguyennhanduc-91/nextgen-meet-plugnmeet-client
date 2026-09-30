import React from 'react';
import { MenuItem } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import { TrashIconSVG } from '../../../../../assets/Icons/TrashIconSVG';

interface IRemoveUserMenuItemProps {
  userId: string;
  onOpenAlert(userId: string, type: string): void;
}

const RemoveUserMenuItem = ({
  userId,
  onOpenAlert,
}: IRemoveUserMenuItemProps) => {
  const { t } = useTranslation();

  return (
    <MenuItem>
      {() => (
        <button
          className="flex items-center gap-3 min-h-8 cursor-pointer py-1.5 w-full text-sm text-left font-medium text-Red-600 px-3 rounded-lg transition-all duration-300 hover:bg-Red-50 dark:hover:bg-Red-900/30 group"
          onClick={() => onOpenAlert(userId, 'remove')}
        >
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-Red-600 transition-colors [&>svg]:w-full [&>svg]:h-full">
            <TrashIconSVG />
          </div>
          <span className="truncate">Đuổi khỏi phòng</span>
        </button>
      )}
    </MenuItem>
  );
};

export default RemoveUserMenuItem;
