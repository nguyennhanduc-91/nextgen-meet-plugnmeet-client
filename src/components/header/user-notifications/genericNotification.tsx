import React from 'react';
import clsx from 'clsx';

import { UserNotification } from '../../../store/slices/interfaces/roomSettings';
import { NotifyIconSVG } from '../../../assets/Icons/NotifyIconSVG';

interface IGenericNotificationProps {
  notification: UserNotification;
}

const GenericNotification = ({ notification }: IGenericNotificationProps) => {
  const formatDate = (timeStamp?: number) => {
    const date = new Date(timeStamp ?? 0);
    return date.toLocaleString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const iconClasses = clsx(
    'icon w-8 h-8 rounded-lg relative flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
    {
      'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400':
        notification.typeOption === 'info',
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400':
        notification.typeOption === 'warning',
      'bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400':
        notification.typeOption === 'error',
    },
  );

  return (
    <div
      className="group w-full flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer relative overflow-hidden"
      key={notification.created}
    >
      <div className={iconClasses}>
        <NotifyIconSVG classes="w-4 h-4 transition-transform group-hover:rotate-[15deg]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-800 dark:text-slate-200 text-[13px] font-medium leading-tight mb-1">
          {notification.message}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wide">
            {formatDate(notification.created)}
          </span>
          {notification.typeOption === 'info' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.6)] animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
};

export default GenericNotification;
