import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

import { store, useAppDispatch, useAppSelector } from '../../../store';
import { setActiveSidePanel } from '../../../store/slices/bottomIconsActivitySlice';
import { QuestionMarkIconSVG } from '../../../assets/Icons/QuestionMarkIconSVG';

const QAIcon = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const showTooltip = useMemo(
    () => store.getState().session.userDeviceType === 'desktop',
    [],
  );

  const isActiveQAPanel = useAppSelector(
    (state) => state.bottomIconsActivity.activeSidePanel === 'QA',
  );

  const questions = useAppSelector((state) => state.qa.questions);
  const unansweredCount = questions.filter((q) => !q.isAnswered).length;

  const toggleQAPanel = useCallback(() => {
    dispatch(setActiveSidePanel(isActiveQAPanel ? null : 'QA'));
  }, [dispatch, isActiveQAPanel]);

  const wrapperClasses = clsx(
    'qaIcon relative footer-icon cursor-pointer w-9 md:w-10 3xl:w-11 h-9 md:h-10 3xl:h-11 rounded-[10px] md:rounded-[12px] 3xl:rounded-[15px] border-[2px] 3xl:border-[3px] overflow-visible!',
    {
      'border-[rgba(124,206,247,0.25)] dark:border-Gray-800': isActiveQAPanel,
      'border-transparent': !isActiveQAPanel,
    },
  );

  const innerDivClasses = clsx(
    'footer-icon-bg h-full w-full flex items-center justify-center rounded-[8px] md:rounded-[10px] 3xl:rounded-[12px] border border-Gray-300 dark:border-Gray-700 shadow transition-all duration-300 hover:bg-gray-100 dark:hover:bg-Gray-700 text-Gray-950 dark:text-white overflow-visible!',
    {
      'has-tooltip': showTooltip,
      'bg-gray-100 dark:bg-Gray-700': isActiveQAPanel,
      'bg-white dark:bg-Gray-800': !isActiveQAPanel,
    },
  );

  const tooltipText = isActiveQAPanel ? 'Ẩn Q&A' : 'Hiện Q&A';

  return (
    <div className={wrapperClasses} onClick={toggleQAPanel}>
      <div className={innerDivClasses}>
        <span className="tooltip">{tooltipText}</span>
        <QuestionMarkIconSVG />
      </div>

      {!isActiveQAPanel && unansweredCount > 0 && (
        <div className="unseen-message-count bg-secondary-color w-4 3xl:w-5 h-4 3xl:h-5 rounded-full text-[10px] 3xl:text-xs text-white absolute -top-1 -right-1 flex justify-center items-center z-[110]">
          {unansweredCount > 9 ? '9+' : unansweredCount}
        </div>
      )}
    </div>
  );
};

export default QAIcon;
