import React, { ReactElement, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react';

import { getFormatedRespondents, PollDataWithOption } from '../../utils';
import { ParticipantsIconSVG } from '../../../../assets/Icons/ParticipantsIconSVG';

interface RespondentsProps {
  pollDataWithOption: PollDataWithOption;
}

const Respondents = ({ pollDataWithOption }: RespondentsProps) => {
  const { t } = useTranslation();

  const optionDisclosures = useMemo(() => {
    const elms: Array<ReactElement> = [];
    for (const key in pollDataWithOption.options) {
      const o = pollDataWithOption.options[key];
      const elm = (
        <Disclosure as="div" key={o.id}>
          {({ open }) => (
            <div className="bg-white dark:bg-dark-secondary rounded-xl border border-Gray-200 dark:border-Gray-800 overflow-hidden w-full hover:border-[#bfdbfe] dark:hover:border-[#1e3a8a] transition-colors">
              <DisclosureButton
                className={`flex items-center cursor-pointer justify-between gap-3 w-full pl-4 pr-3 bg-transparent h-11 transition-all duration-300 relative overflow-hidden ${open ? 'border-b border-Gray-100 dark:border-Gray-800' : ''}`}
              >
                {/* Progress bar background */}
                <div
                  className="absolute inset-y-0 left-0 bg-[#eff6ff] dark:bg-[#1e3a8a]/30 transition-all duration-500 rounded-xl"
                  style={{ width: `${o.responsesPercentage}%` }}
                />
                <span className="text-sm text-Gray-800 dark:text-white relative z-10 font-medium">
                  {o.text} <span className="text-Gray-500 dark:text-[#94a3b8]">({o.respondents.length})</span>
                </span>
                <div className="right flex items-center gap-2 relative z-10">
                  <span className="text-xs font-semibold text-[#2563eb] dark:text-[#60a5fa]">
                    {o.responsesPercentage}%
                  </span>
                  <motion.div
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className=""
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="17"
                      viewBox="0 0 16 17"
                      fill="none"
                    >
                      <path d="M12 6.5L8 10.5L4 6.5" fill="currentColor" />
                      <path
                        d="M12 6.5L8 10.5L4 6.5H12Z"
                        stroke="currentColor"
                        strokeWidth="1.67"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </motion.div>
                </div>
              </DisclosureButton>

              <AnimatePresence>
                {open && (
                  <DisclosurePanel
                    static
                    as={motion.div}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="wrap relative rounded-xl overflow-auto">
                      <div className="inner flex">
                        {getFormatedRespondents(o.respondents)}
                      </div>
                    </div>
                  </DisclosurePanel>
                )}
              </AnimatePresence>
            </div>
          )}
        </Disclosure>
      );
      elms.push(elm);
    }
    return elms;
  }, [pollDataWithOption]);

  return (
    <div className="px-5 py-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-Gray-900 dark:text-white flex items-center gap-2">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#f3f4f6] dark:bg-[#1e293b] text-[#64748b] dark:text-[#94a3b8]">
            <ParticipantsIconSVG />
          </span>
          {t('polls.total-responses', {
            count: pollDataWithOption.totalRespondents,
          })}
        </h4>
      </div>
      <div className="relative">
        <div className="wrap grid gap-3">{optionDisclosures}</div>
      </div>
    </div>
  );
};

export default Respondents;
