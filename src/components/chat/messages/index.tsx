import React, { useCallback, useEffect, useRef, useState } from 'react';
import { debounce } from 'es-toolkit';

import { store, useAppSelector } from '../../../store';
import { selectMessagesByKeyValue } from '../../../store/slices/chatMessagesSlice';
import Message from './message';
import { AngleDown } from '../../../assets/Icons/AngleDown';

interface IMessagesProps {
  messageKey: string;
}

const Messages = ({ messageKey }: IMessagesProps) => {
  const chatMessages = useAppSelector((state) =>
    selectMessagesByKeyValue(state, messageKey),
  );

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const currentUser = store.getState().session.currentUser;
  const [autoScrollToBottom, setAutoScrollToBottom] = useState<boolean>(true);
  const [unreadScrolledCount, setUnreadScrolledCount] = useState<number>(0);
  const prevMessagesLength = useRef(chatMessages.length);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setAutoScrollToBottom(true);
      setUnreadScrolledCount(0);
    }
  }, []);

  // We debounce the scroll to prevent it from firing on every single message
  // in a rapid burst. It will only scroll once after the messages stop arriving.
  // oxlint-disable-next-line exhaustive-deps
  const debouncedScrollToBottom = useCallback(
    debounce(() => {
      if (autoScrollToBottom) {
        scrollToBottom();
      }
    }, 50),
    [scrollToBottom, autoScrollToBottom],
  );

  useEffect(() => {
    // Check if new messages arrived
    if (chatMessages.length > prevMessagesLength.current) {
      const diff = chatMessages.length - prevMessagesLength.current;
      if (autoScrollToBottom) {
        debouncedScrollToBottom();
      } else {
        // If user is scrolled up, increase unread count instead of scrolling
        setUnreadScrolledCount((prev) => prev + diff);
      }
    }
    prevMessagesLength.current = chatMessages.length;
  }, [chatMessages, autoScrollToBottom, debouncedScrollToBottom]);

  // Also reset when changing tabs
  useEffect(() => {
    scrollToBottom();
  }, [messageKey, scrollToBottom]);

  const handleScroll = () => {
    const element = messagesContainerRef.current;
    if (element) {
      // Check if the user is at or very near the bottom (with a 10px tolerance)
      const isAtBottom =
        element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
      setAutoScrollToBottom(isAtBottom);
      if (isAtBottom && unreadScrolledCount > 0) {
        setUnreadScrolledCount(0);
      }
    }
  };

  return (
    <div className="relative h-full w-full">
      <div
        className="h-full w-full overflow-auto scrollBar messages-item-wrap px-3 3xl:px-5"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {chatMessages.map((message) => (
          <div key={message.id} className="message-item py-2" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 60px' }}>
            <Message body={message} currentUser={currentUser} />
          </div>
        ))}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {!autoScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-2 right-4 z-20 w-8 h-8 rounded-full bg-Gray-100 dark:bg-Gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.5)] border border-Gray-300 dark:border-Gray-600 flex items-center justify-center text-Gray-700 hover:text-white hover:bg-Blue dark:text-Gray-200 hover:border-Blue dark:hover:bg-Blue dark:hover:border-Blue transition-all cursor-pointer"
        >
          <AngleDown />
          {unreadScrolledCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-Red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-Gray-100 dark:ring-Gray-800">
              {unreadScrolledCount > 99 ? '99+' : unreadScrolledCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
};

export default Messages;
