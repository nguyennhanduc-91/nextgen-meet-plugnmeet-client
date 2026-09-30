import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

import { store, useAppDispatch, useAppSelector } from '../../../store';
import { setActiveSidePanel } from '../../../store/slices/bottomIconsActivitySlice';
import { PollsIconSVG } from '../../../assets/Icons/PollsIconSVG';
import { useGetPollsStatsQuery } from '../../../store/services/pollsApi';

const PollsIcon = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const showTooltip = useMemo(
    () => store.getState().session.userDeviceType === 'desktop',
    [],
  );

  const isActive = useAppSelector(
    (state) =>
      state.session.currentRoom.metadata?.roomFeatures?.pollsFeatures?.isActive,
  );
  const isActivePollsPanel = useAppSelector(
    (state) => state.bottomIconsActivity.activeSidePanel === 'POLLS',
  );

  useEffect(() => {
    if (!isActive && isActivePollsPanel) {
      dispatch(setActiveSidePanel('POLLS'));
    }
    //eslint-disable-next-line
  }, [isActive]);

  const togglePollsPanel = useCallback(() => {
    dispatch(setActiveSidePanel('POLLS'));
  }, [dispatch]);

  const wrapperClasses = clsx(
    'pollsIcon hidden md:block relative footer-icon cursor-pointer w-9 md:w-10 3xl:w-11 h-9 md:h-10 3xl:h-11 rounded-[10px] md:rounded-[12px] 3xl:rounded-[15px] border-[2px] 3xl:border-[3px] overflow-visible!',
    {
      'border-[rgba(124,206,247,0.25)] dark:border-Gray-800':
        isActivePollsPanel,
      'border-transparent': !isActivePollsPanel,
    },
  );

  const innerDivClasses = clsx(
    'footer-icon-bg h-full w-full flex items-center justify-center rounded-[8px] md:rounded-[10px] 3xl:rounded-[12px] border border-Gray-300 dark:border-Gray-700 shadow transition-all duration-300 hover:bg-gray-100 dark:hover:bg-Gray-700 text-Gray-950 dark:text-white overflow-visible!',
    {
      'has-tooltip': showTooltip,
      'bg-gray-100 dark:bg-Gray-700': isActivePollsPanel,
      'bg-white dark:bg-Gray-800': !isActivePollsPanel,
    },
  );

  const { data: pollsStats } = useGetPollsStatsQuery(undefined, { skip: !isActive });
  const runningCount = pollsStats?.totalRunning ?? 0;

  if (!isActive) {
    return null;
  }

  return (
    <div className={wrapperClasses} onClick={togglePollsPanel}>
      <div className={innerDivClasses}>
        <span className="tooltip">
          {isActivePollsPanel
            ? t('footer.icons.hide-polls-panel')
            : t('footer.icons.show-polls-panel')}
        </span>
        <PollsIconSVG classes="" />
      </div>
      
      {Number(runningCount) > 0 && (
        <div className="unseen-message-count bg-secondary-color w-4 3xl:w-5 h-4 3xl:h-5 rounded-full text-[10px] 3xl:text-xs text-white absolute -top-1 -right-1 flex justify-center items-center z-[110] animate-pulse">
          {runningCount}
        </div>
      )}
    </div>
  );
};

export default PollsIcon;
