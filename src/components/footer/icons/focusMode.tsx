import React from 'react';
import { useTranslation } from 'react-i18next';

import { useAppDispatch, useAppSelector } from '../../../store';
import { setUIVisibility } from '../../../store/slices/roomSettingsSlice';

const FocusModeIcon = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const visibleFooter = useAppSelector((state) => state.roomSettings.visibleFooter);

  const toggleFocusMode = () => {
    dispatch(setUIVisibility(!visibleFooter));
  };

  return (
    <div className="relative footer-icon cursor-pointer w-9 md:w-10 3xl:w-11 h-9 md:h-10 3xl:h-11 rounded-[10px] md:rounded-[12px] 3xl:rounded-[15px] border-[2px] 3xl:border-[3px] border-transparent overflow-visible! group">
      <div 
        onClick={toggleFocusMode}
        className="footer-icon-bg h-full w-full flex items-center justify-center rounded-[8px] md:rounded-[10px] 3xl:rounded-[12px] border border-Gray-300 dark:border-Gray-700 shadow transition-all duration-300 hover:bg-gray-100 dark:hover:bg-Gray-700 text-Gray-950 dark:text-white overflow-visible! has-tooltip"
      >
        <span className="tooltip">{t('footer.immersive-mode', 'Chế độ Toàn màn hình')}</span>
        <svg
          className="w-5 h-5 md:w-6 md:h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </div>
    </div>
  );
};

export default FocusModeIcon;
