import React, { Fragment, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react';

import EndPollBtn from './endPollBtn';
import PublishResultBtn from './publishResultBtn';
import NotRespondents from './notRespondents';
import Respondents from './respondents';
import { PollDataWithOption } from '../../utils';
import { CloseIconSVG } from '../../../../assets/Icons/CloseIconSVG';
import { QuestionMarkIconSVG } from '../../../../assets/Icons/QuestionMarkIconSVG';
import { BarChartIconSVG } from '../../../../assets/Icons/BarChartIconSVG';
import { ParticipantsIconSVG } from '../../../../assets/Icons/ParticipantsIconSVG';

interface ViewDetailsProps {
  pollDataWithOption: PollDataWithOption;
  isRunning: boolean;
  onCloseViewDetails: () => void;
  serialNum: number;
  refetch: () => void;
}

const DetailsModal = ({
  pollDataWithOption,
  isRunning,
  onCloseViewDetails,
  serialNum,
  refetch,
}: ViewDetailsProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const { t } = useTranslation();

  useEffect(() => {
    refetch();
  }, [refetch]);

  const closeModal = () => {
    setIsOpen(false);
    onCloseViewDetails();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-9999 overflow-y-auto"
        onClose={closeModal}
      >
        <div className="min-h-screen px-4 text-center bg-Gray-950/70 flex items-center justify-center">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-dark-primary rounded-2xl border border-Gray-200 dark:border-Gray-800">
              <div className="top flex items-center justify-between py-4 px-6 border-b border-Gray-100 dark:border-Gray-800">
                <DialogTitle
                  as="h3"
                  className="text-sm 3xl:text-base font-semibold text-Gray-950 dark:text-white flex items-center gap-3"
                >
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#eff6ff] dark:bg-[#1e3a8a]/30 border border-[#bfdbfe] dark:border-[#1e3a8a] whitespace-nowrap shrink-0">
                    <span className="text-[#2563eb] dark:text-[#60a5fa] w-3.5 h-3.5 flex items-center justify-center"><BarChartIconSVG /></span>
                    <span className="text-[#1e40af] dark:text-[#93c5fd] font-bold text-xs">
                      #{serialNum}
                    </span>
                  </div>
                  {!isRunning ? (
                    <div className="whitespace-nowrap border border-Red-200 bg-Red-100 shadow-button-shadow rounded-full h-[22px] px-2 text-xs text-Red-700 font-medium flex items-center">
                      {t('polls.poll-closed')}
                    </div>
                  ) : (
                    <div className="whitespace-nowrap border border-Green-200 bg-Green-100 shadow-button-shadow rounded-full h-[22px] px-2 text-xs text-Green-700 font-medium flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-Green-500 animate-pulse"></span>
                      {t('polls.poll-running')}
                    </div>
                  )}
                </DialogTitle>
                <button
                  className="close-btn w-8 h-8 rounded-lg text-Gray-500 dark:text-Gray-400 hover:bg-Gray-100 dark:hover:bg-dark-secondary2 flex items-center justify-center cursor-pointer transition-colors"
                  type="button"
                  onClick={closeModal}
                >
                  <CloseIconSVG />
                </button>
              </div>
              <div className="q-headline px-5 py-4 border-b border-Gray-100 dark:border-Gray-800 bg-white dark:bg-dark-primary text-[15px] font-semibold text-Gray-900 dark:text-white flex items-start gap-3">
                <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 mt-0.5"><QuestionMarkIconSVG /></span>
                <p className="leading-snug pt-1">{pollDataWithOption.question}</p>
              </div>
              <Respondents pollDataWithOption={pollDataWithOption} />
              <div className="line h-1 w-full bg-Gray-50 dark:bg-Gray-800"></div>
              <NotRespondents pollDataWithOption={pollDataWithOption} />
              <div className="px-5 py-4 flex items-center justify-end gap-3 bg-Gray-25 dark:bg-dark-secondary border-t border-Gray-100 dark:border-Gray-800">
                {isRunning ? (
                  <EndPollBtn pollId={pollDataWithOption.pollId} />
                ) : (
                  <PublishResultBtn
                    onCloseViewDetails={onCloseViewDetails}
                    pollDataWithOption={pollDataWithOption}
                  />
                )}
              </div>
            </div>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
};

export default DetailsModal;
