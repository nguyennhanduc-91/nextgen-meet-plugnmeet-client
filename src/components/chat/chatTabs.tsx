import React, { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from '@headlessui/react';
import { createSelector } from '@reduxjs/toolkit';

import { RootState, useAppDispatch, useAppSelector } from '../../store';
import { selectChatKeys } from '../../store/slices/chatMessagesSlice';
import Messages from './messages';
import { participantsSelector } from '../../store/slices/participantSlice';
import {
  updateSelectedChatOption,
  updateUnreadMsgFrom,
} from '../../store/slices/roomSettingsSlice';
import { CloseIconSVG } from '../../assets/Icons/CloseIconSVG';
import { setActiveSidePanel, setIsChatPopout } from '../../store/slices/bottomIconsActivitySlice';
import { CheckMarkIcon } from '../../assets/Icons/CheckMarkIcon';
import i18n from '../../helpers/i18n';
import ChatTranslation from './chatTranslation';

const PopoutIconSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

interface IChatOption {
  id: string;
  title: string;
  hasUnread: boolean;
}

const selectChatTabsData = createSelector(
  [
    selectChatKeys,
    participantsSelector.selectEntities,
    (state: RootState) => state.roomSettings.initiatePrivateChat,
    (state: RootState) => state.roomSettings.unreadMsgFrom,
    (state: RootState) => state.roomSettings.selectedChatOption,
  ],
  (
    chatKeys,
    participantEntities,
    initiatePrivateChat,
    unreadMsgFrom,
    selectedChatOption,
  ) => {
    const allKeys = [...chatKeys];
    // let's add user from initiatePrivateChat
    if (
      initiatePrivateChat.userId &&
      !allKeys.includes(initiatePrivateChat.userId)
    ) {
      allKeys.push(initiatePrivateChat.userId);
    }

    const options: IChatOption[] = [];
    allKeys.forEach((k) => {
      if (k === 'public') {
        options.push({
          id: 'public',
          title: i18n.t('left-panel.public-chat'),
          hasUnread: unreadMsgFrom.includes('public'),
        });
      } else {
        const participant = participantEntities[k];
        let title = k; // Use key as fallback
        if (participant) {
          title = participant.name;
        } else if (initiatePrivateChat.userId === k) {
          title = initiatePrivateChat.name;
        }

        options.push({
          id: k,
          title: title,
          hasUnread: unreadMsgFrom.includes(k),
        });
      }
    });

    const selected = options.find((o) => o.id === selectedChatOption);
    const selectedTitle = selected?.title ?? i18n.t('left-panel.public-chat');

    return {
      chatOptions: options,
      selectedChatOption,
      selectedTitle,
      hasUnreadMessages: unreadMsgFrom.length > 0,
    };
  },
);

interface ChatTabsProps {
  isRecorder: boolean;
  isPopoutWindow?: boolean;
}

const ChatTabs = ({ isRecorder, isPopoutWindow = false }: ChatTabsProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  const { chatOptions, selectedChatOption, selectedTitle, hasUnreadMessages } =
    useAppSelector(selectChatTabsData);

  const onChange = (id: string) => {
    dispatch(updateSelectedChatOption(id));
    dispatch(
      updateUnreadMsgFrom({
        task: 'DEL',
        id: id,
      }),
    );
  };

  const closePanel = () => {
    dispatch(setActiveSidePanel(null));
  };
  
  const handlePopout = () => {
    dispatch(setActiveSidePanel(null));
    dispatch(setIsChatPopout(true));
  };

  if (isRecorder) {
    return (
      <div className="h-full">
        <div className="h-[calc(100%-5px)] chat-messages-container">
          <Messages messageKey={selectedChatOption} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white dark:bg-dark-primary flex flex-col">
      {/* Main Header */}
      <div className="flex items-center justify-between h-12 px-4 3xl:px-5 border-b border-Gray-100 dark:border-Gray-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-Blue/10 dark:bg-Blue/20 flex items-center justify-center text-Blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <p className="text-[15px] 3xl:text-base text-Gray-900 dark:text-white font-semibold tracking-tight">
            {t('left-panel.public-chat')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ChatTranslation />
          
          {!isPopoutWindow && (
            <button 
              className="w-8 h-8 flex items-center justify-center rounded-full text-Gray-500 hover:bg-Gray-100 hover:text-Blue dark:hover:bg-Gray-800 dark:hover:text-white transition-colors cursor-pointer" 
              onClick={handlePopout}
              title="Bật ra cửa sổ mới"
            >
              <PopoutIconSVG />
            </button>
          )}

          {!isPopoutWindow && (
            <button 
              className="w-8 h-8 flex items-center justify-center rounded-full text-Gray-500 hover:bg-Gray-100 hover:text-Gray-900 dark:hover:bg-Gray-800 dark:hover:text-white transition-colors cursor-pointer" 
              onClick={closePanel}
              title={t('left-panel.close-panel')}
            >
              <CloseIconSVG />
            </button>
          )}
        </div>
      </div>

      {/* Recipient Dropdown (Replaces "To:") */}
      <div className="px-4 3xl:px-5 py-2">
        <Listbox value={selectedChatOption} onChange={onChange}>
          <div className="relative z-10">
            <ListboxButton className="flex items-center justify-between bg-Gray-50 hover:bg-Gray-100 dark:bg-dark-secondary dark:hover:bg-Gray-800 border border-Gray-200 dark:border-Gray-700/60 transition-colors h-9 3xl:h-10 w-full rounded-xl outline-hidden px-3.5 text-xs 3xl:text-sm text-Gray-800 dark:text-white cursor-pointer shadow-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="text-Gray-500 dark:text-Gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </span>
                <span className="font-semibold truncate text-Gray-900 dark:text-white">
                  {selectedTitle}
                </span>
              </div>
              
              <span className="pointer-events-none flex items-center gap-2">
                {hasUnreadMessages && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-Red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-Red-500"></span>
                  </span>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-Gray-400 dark:text-Gray-500">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </span>
            </ListboxButton>

            <Transition
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <ListboxOptions className="absolute mt-1.5 w-full left-0 border border-Gray-200/80 dark:border-Gray-700 bg-white/95 dark:bg-dark-secondary/95 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden py-1.5 px-1 origin-top">
                <div className="px-3 py-2 text-[10px] 3xl:text-xs font-bold tracking-wider text-Gray-400 dark:text-Gray-500 uppercase">
                  {t('left-panel.select-chat-conversation-title')}
                </div>
                {chatOptions.map((option) => (
                  <ListboxOption
                    key={option.id}
                    className={({ focus, selected }) =>
                      `w-full cursor-pointer flex items-center justify-between text-sm 3xl:text-[15px] font-medium text-Gray-800 dark:text-white py-2.5 px-3 rounded-xl transition-all duration-200 ${
                        focus ? 'bg-Blue/5 dark:bg-Blue/10 text-Blue dark:text-Blue' : 'hover:bg-Gray-50 dark:hover:bg-Gray-800/50'
                      } ${selected ? 'bg-Blue/10 dark:bg-Blue/20 text-Blue dark:text-Blue' : ''}`
                    }
                    value={option.id}
                  >
                    {({ selected }) => (
                      <>
                        <div className="flex items-center gap-2.5">
                          {option.id === 'public' ? (
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${selected ? 'bg-Blue text-white' : 'bg-Gray-100 dark:bg-Gray-700 text-Gray-500 dark:text-Gray-400'}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            </div>
                          ) : (
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${selected ? 'bg-Blue text-white' : 'bg-Gray-100 dark:bg-Gray-700 text-Gray-500 dark:text-Gray-400'}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            </div>
                          )}
                          <span className={selected ? 'font-semibold text-Blue dark:text-Blue' : 'text-Gray-800 dark:text-white'}>
                            {option.title}
                          </span>
                          {option.hasUnread && (
                            <span className="flex h-2 w-2 relative ml-1">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-Red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-Red-500"></span>
                            </span>
                          )}
                        </div>
                        {selected && (
                          <div className="text-Blue">
                            <CheckMarkIcon />
                          </div>
                        )}
                      </>
                    )}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </div>
        </Listbox>
      </div>

      {/* Messages Container */}
      <div className="flex-1 min-h-0 chat-messages-container">
        <Messages messageKey={selectedChatOption} />
      </div>
    </div>
  );
};

export default React.memo(ChatTabs);
