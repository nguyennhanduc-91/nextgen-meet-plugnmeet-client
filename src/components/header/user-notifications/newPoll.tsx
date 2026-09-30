import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { setActiveSidePanel } from '../../../store/slices/bottomIconsActivitySlice';
import { useAppDispatch } from '../../../store';
import { PollsIconSVG } from '../../../assets/Icons/PollsIconSVG';
import ActionButton from '../../../helpers/ui/actionButton';

interface INewPollProps {
  createdAt: number | undefined;
  onClosePopover?: () => void;
  closeToast?: () => void;
}

const NewPoll = ({ createdAt, onClosePopover, closeToast }: INewPollProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const openPollsPanel = useCallback(() => {
    dispatch(setActiveSidePanel('POLLS'));
    if (onClosePopover) {
      onClosePopover();
    }
    if (closeToast) {
      closeToast();
    }
  }, [dispatch, onClosePopover, closeToast]);

  const formatDate = (timeStamp?: number) => {
    const date = new Date(timeStamp ?? 0);
    return date.toLocaleString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="group w-full flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer relative overflow-hidden">
      <div className="icon w-8 h-8 rounded-lg relative flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 transition-transform group-hover:scale-105">
        <PollsIconSVG classes="w-4 h-4 transition-transform group-hover:rotate-[15deg]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-800 dark:text-slate-200 text-[13px] font-medium leading-tight mb-1">
          {t('polls.new-poll')}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wide">
            {formatDate(createdAt)}
          </span>
          <ActionButton
            onClick={openPollsPanel}
            custom="!h-6 w-auto px-3 !text-[11px] !rounded-lg bg-indigo-500 hover:bg-indigo-600 border-none text-white font-semibold transition-all"
          >
            {t('open')}
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default NewPoll;
