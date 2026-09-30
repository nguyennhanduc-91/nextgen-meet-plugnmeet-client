import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

import { store, useAppDispatch, useAppSelector } from '../../../store';
import { participantsSelector } from '../../../store/slices/participantSlice';
import { ParticipantsIconSVG } from '../../../assets/Icons/ParticipantsIconSVG';
import { setActiveSidePanel } from '../../../store/slices/bottomIconsActivitySlice';

const ParticipantIcon = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { showTooltip } = useMemo(() => {
    const session = store.getState().session;
    return {
      showTooltip: session.userDeviceType === 'desktop',
    };
  }, []);

  const isActiveParticipantsPanel = useAppSelector(
    (state) => state.bottomIconsActivity.activeSidePanel === 'PARTICIPANTS',
  );
  const participantsTotal = useAppSelector(participantsSelector.selectTotal);

  const toggleParticipantsPanel = useCallback(() => {
    dispatch(setActiveSidePanel('PARTICIPANTS'));
  }, [dispatch]);

  const wrapperClasses = clsx(
    'participants relative footer-icon cursor-pointer w-9 md:w-10 3xl:w-11 h-9 md:h-10 3xl:h-11 rounded-[10px] md:rounded-[12px] 3xl:rounded-[15px] border-[2px] 3xl:border-[3px] overflow-visible!',
    {
      'border-[rgba(124,206,247,0.25)] dark:border-Gray-800':
        isActiveParticipantsPanel,
      'border-transparent': !isActiveParticipantsPanel,
    },
  );

  const innerDivClasses = clsx(
    'footer-icon-bg h-full w-full flex items-center justify-center rounded-[8px] md:rounded-[10px] 3xl:rounded-[12px] border border-Gray-300 dark:border-Gray-700 shadow transition-all duration-300 hover:bg-gray-100 dark:hover:bg-Gray-700 text-Gray-950 dark:text-white overflow-visible!',
    {
      'has-tooltip': showTooltip,
      'bg-gray-100 dark:bg-Gray-700': isActiveParticipantsPanel,
      'bg-white dark:bg-Gray-800': !isActiveParticipantsPanel,
    },
  );

  return (
    <div className={wrapperClasses} onClick={toggleParticipantsPanel}>
      <div className={innerDivClasses}>
        <span className="tooltip">
          {isActiveParticipantsPanel
            ? t('footer.icons.hide-users-list')
            : t('footer.icons.show-users-list')}
        </span>
        <ParticipantsIconSVG />
      </div>
      {!isActiveParticipantsPanel && (
        <div className="unseen-message-count bg-secondary-color w-4 3xl:w-5 h-4 3xl:h-5 rounded-full text-[10px] 3xl:text-xs text-white absolute -top-1 -right-1 flex justify-center items-center z-[110]">
          {participantsTotal}
        </div>
      )}
    </div>
  );
};

export default ParticipantIcon;
