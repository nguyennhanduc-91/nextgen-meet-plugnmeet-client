import React, { useMemo } from 'react';
import { differenceWith } from 'es-toolkit';
import { useTranslation } from 'react-i18next';

import {
  getFormatedRespondents,
  PollDataWithOption,
  Respondents,
} from '../../utils';
import { useAppSelector } from '../../../../store';
import { selectBasicParticipants } from '../../../../store/slices/participantSlice';

interface NotRespondentsProps {
  pollDataWithOption: PollDataWithOption;
}

const NotRespondents = ({ pollDataWithOption }: NotRespondentsProps) => {
  const { t } = useTranslation();
  const participants = useAppSelector(selectBasicParticipants);

  const { formattedNotRespondents, notRespondentsCount } = useMemo(() => {
    const notRespondentsList: Respondents[] = differenceWith(
      participants,
      pollDataWithOption.allRespondents,
      (a, b) => a.userId === b.userId,
    ).map((p) => ({ userId: p.userId, name: p.name }));

    return {
      formattedNotRespondents: getFormatedRespondents(notRespondentsList),
      notRespondentsCount: notRespondentsList.length,
    };
  }, [participants, pollDataWithOption]);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-Gray-900 dark:text-white flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#fff7ed] dark:bg-[#7c2d12]/20 text-[#f97316]">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 9V13M12 17H12.01M5.07183 19H18.9282C20.4678 19 21.4301 17.3333 20.6603 16L13.7321 4C12.9623 2.66667 11.0377 2.66667 10.2679 4L3.33975 16C2.56995 17.3333 3.53223 19 5.07183 19Z"
                stroke="currentColor"
                strokeWidth="1.67"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          {t('polls.not-respondents-total', {
            count: notRespondentsCount,
          })}
        </h4>
      </div>
      {notRespondentsCount > 0 ? (
        <div className="wrap relative rounded-xl bg-Gray-50 dark:bg-dark-secondary border border-gray-300 dark:border-Gray-700 overflow-auto">
          <div className="inner flex">{formattedNotRespondents}</div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-1.5 py-6 bg-[#f0fdf4] dark:bg-[#14532d]/20 rounded-xl border border-[#bbf7d0] dark:border-[#166534]/50 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#dcfce3] dark:bg-[#166534] flex items-center justify-center mb-1">
            <svg
              className="w-5 h-5 text-[#16a34a] dark:text-[#4ade80]"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22 11.0857V12.0057C21.9988 14.1621 21.3005 16.2604 20.0093 17.9875C18.7182 19.7147 16.9033 20.9782 14.8354 21.5896C12.7674 22.201 10.5573 22.1276 8.53447 21.3803C6.51168 20.633 4.78465 19.2518 3.61096 17.4428C2.43727 15.6338 1.87979 13.4938 2.02168 11.342C2.16356 9.19029 2.99721 7.14205 4.39828 5.5028C5.79935 3.86354 7.69279 2.72111 9.79619 2.24587C11.8996 1.77063 14.1003 1.98806 16.07 2.86572"
                stroke="currentColor"
                strokeWidth="1.67"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 4L12 14.01L9 11.01"
                stroke="currentColor"
                strokeWidth="1.67"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-sm font-bold text-[#16a34a] dark:text-[#4ade80]">
            Tất cả đã tham gia! 🎉
          </p>
          <p className="text-xs text-[#15803d] dark:text-[#22c55e]">
            Tuyệt vời, không còn ai bị bỏ sót.
          </p>
        </div>
      )}
    </>
  );
};

export default NotRespondents;
