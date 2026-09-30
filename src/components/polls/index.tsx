import React from 'react';
import { useTranslation } from 'react-i18next';

import Create from './create/index';
import PollsList from './pollsList';

import { store, useAppDispatch, useAppSelector } from '../../store';
import { CloseIconSVG } from '../../assets/Icons/CloseIconSVG';
import { setActiveSidePanel, setIsPollsPopout } from '../../store/slices/bottomIconsActivitySlice';

const PopoutIconSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

interface PollsComponentProps {
  isPopoutWindow?: boolean;
}

const PollsComponent = ({ isPopoutWindow = false }: PollsComponentProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const isAdmin = store.getState().session.currentUser?.metadata?.isAdmin;

  return (
    <div className="side-panel-bg-color relative z-10 w-full bg-Gray-25 dark:bg-dark-primary border-l border-Gray-200 dark:border-Gray-800 h-full">
      <div className="flex items-center gap-2 absolute z-50 right-3 3xl:right-5 top-[10px] 3xl:top-[18px]">
        {!isPopoutWindow && (
          <div
            className="w-8 h-8 flex items-center justify-center rounded-full text-Gray-600 dark:text-white hover:bg-Gray-100 dark:hover:bg-Gray-800 transition-colors cursor-pointer"
            onClick={() => {
              dispatch(setActiveSidePanel(null));
              dispatch(setIsPollsPopout(true));
            }}
            title="Bật ra cửa sổ mới"
          >
            <PopoutIconSVG />
          </div>
        )}
        <div
          className="w-8 h-8 flex items-center justify-center rounded-full text-Gray-600 dark:text-white hover:bg-Gray-100 dark:hover:bg-Gray-800 transition-colors cursor-pointer"
          onClick={() => dispatch(setActiveSidePanel(null))}
          title="Đóng"
        >
          <CloseIconSVG />
        </div>
      </div>
      <div className="inner-wrapper relative z-20 w-full h-full flex flex-col">
        <div className="top flex items-center shrink-0 h-10 3xl:h-14 px-3 3xl:px-5 border-b border-Gray-200 dark:border-Gray-800">
          <p className="text-sm 3xl:text-base text-Gray-950 dark:text-white font-medium leading-tight">
            {t('polls.title')}
          </p>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <PollsList />
        </div>
        {isAdmin && <div className="shrink-0"><Create /></div>}
      </div>
    </div>
  );
};

export default PollsComponent;
