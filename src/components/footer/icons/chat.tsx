import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

import { store, useAppDispatch, useAppSelector } from '../../../store';
import { ChatIconSVG } from '../../../assets/Icons/ChatIconSVG';
import { setActiveSidePanel } from '../../../store/slices/bottomIconsActivitySlice';

const ChatIcon = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  
  const { showTooltip, isAdmin, defaultLock } = useMemo(() => {
    const session = store.getState().session;
    return {
      showTooltip: session.userDeviceType === 'desktop',
      isAdmin: !!session.currentUser?.metadata?.isAdmin,
      defaultLock: !!session.currentRoom.metadata?.defaultLockSettings?.lockChat,
    };
  }, []);

  const isChatLock = useAppSelector(
    (state) => state.session.currentUser?.metadata?.lockSettings?.lockChat,
  );

  const isLocked = useMemo(
    () => !isAdmin && (isChatLock ?? defaultLock),
    [isAdmin, isChatLock, defaultLock],
  );

  const isActiveChatPanel = useAppSelector(
    (state) => state.bottomIconsActivity.activeSidePanel === 'CHAT',
  );
  
  const totalUnreadChatMsgs = useAppSelector(
    (state) => state.bottomIconsActivity.totalUnreadChatMsgs,
  );

  useEffect(() => {
    if (isLocked && isActiveChatPanel) {
      dispatch(setActiveSidePanel(null));
    }
  }, [isLocked, isActiveChatPanel, dispatch]);

  const toggleChatPanel = useCallback(() => {
    if (isLocked) return;
    dispatch(setActiveSidePanel('CHAT'));
  }, [dispatch, isLocked]);

  const wrapperClasses = clsx(
    'message relative footer-icon cursor-pointer w-9 md:w-10 3xl:w-11 h-9 md:h-10 3xl:h-11 rounded-[10px] md:rounded-[12px] 3xl:rounded-[15px] border-[2px] 3xl:border-[3px] overflow-visible!',
    {
      'border-[rgba(124,206,247,0.25)] dark:border-Gray-800': isActiveChatPanel,
      'border-transparent': !isActiveChatPanel && !isLocked,
      '!border-Red-100 dark:!border-Red-600 pointer-events-none': isLocked,
    },
  );

  const innerDivClasses = clsx(
    'footer-icon-bg h-full w-full flex items-center justify-center rounded-[8px] md:rounded-[10px] 3xl:rounded-[12px] border border-Gray-300 dark:border-Gray-700 shadow transition-all duration-300 hover:bg-gray-100 dark:hover:bg-Gray-700 text-Gray-950 dark:text-white overflow-visible!',
    {
      'has-tooltip': showTooltip,
      'bg-gray-100 dark:bg-Gray-700': isActiveChatPanel,
      'bg-white dark:bg-Gray-800': !isActiveChatPanel,
      '!border-Red-200 dark:!border-Red-400 text-Red-400': isLocked,
    },
  );

  const tooltipText = isLocked 
    ? t('left-panel.menus.items.lock-chat') 
    : (isActiveChatPanel ? t('footer.icons.hide-chat-panel') : t('footer.icons.show-chat-panel'));

  return (
    <div className={wrapperClasses} onClick={toggleChatPanel}>
      <div className={innerDivClasses}>
        <span className="tooltip">{tooltipText}</span>
        <ChatIconSVG />
      </div>

      {isLocked && (
        <span className="add absolute -top-1 -right-2 z-[110]">
          <i className="pnm-lock primaryColor" />
        </span>
      )}

      {!isActiveChatPanel && !isLocked && totalUnreadChatMsgs > 0 && (
        <div className="unseen-message-count bg-secondary-color w-4 3xl:w-5 h-4 3xl:h-5 rounded-full text-[10px] 3xl:text-xs text-white absolute -top-1 -right-1 flex justify-center items-center z-[110]">
          {totalUnreadChatMsgs}
        </div>
      )}
    </div>
  );
};

export default ChatIcon;
