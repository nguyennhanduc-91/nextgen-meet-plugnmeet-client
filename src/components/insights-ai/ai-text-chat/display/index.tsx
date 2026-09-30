import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { marked } from 'marked';
import Draggable from 'react-draggable';

import {
  updateIsActiveInsightsAiTextChat,
} from '../../../../store/slices/bottomIconsActivitySlice';
import { clearAllMessages } from '../../../../store/slices/insightsAiTextChatSlice';
import { useAppDispatch, useAppSelector } from '../../../../store';
import {
  AIMessage,
  MyMessage,
} from '../../../chat/messages/message/messageTypes';
import TextBoxArea from './textBoxArea';
import { PopupCloseSVGIcon } from '../../../../assets/Icons/PopupCloseSVGIcon';
import { ScrollToBottomIconSVG } from '../../../../assets/Icons/ScrollToBottom';
import { AiIconSVG } from '../../../../assets/Icons/AiIconSVG';

// Typing indicator with animated dots
const TypingIndicator = () => (
  <div className="flex items-center gap-2.5 px-3 py-3 my-2">
    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 ai-avatar-pulse">
      <span className="h-4 w-4">
        <AiIconSVG classes="w-full h-full" />
      </span>
    </div>
    <div className="flex items-center gap-2 bg-Gray-50 dark:bg-Gray-800 border border-Gray-200 dark:border-Gray-700 rounded-lg rounded-tl-none px-3 py-2.5">
      <span className="ai-typing-dots">
        <span /><span /><span />
      </span>
      <span className="text-xs text-Gray-500 dark:text-Gray-400">
        Đang soạn tin...
      </span>
    </div>
  </div>
);

// Welcome message when no chat history
const WelcomeMessage = ({
  onSuggest,
}: {
  onSuggest: (text: string) => void;
}) => (
  <div className="flex flex-col items-center justify-center h-full px-6 py-8 text-center">
    <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center mb-4 ai-avatar-pulse">
      <span className="h-8 w-8">
        <AiIconSVG classes="w-full h-full" />
      </span>
    </div>
    <h3 className="text-base font-semibold text-Gray-900 dark:text-white mb-1">
      Xin chào! 👋
    </h3>
    <p className="text-xs text-Gray-500 dark:text-Gray-400 mb-5 max-w-[260px]">
      Tôi là Trợ lý AI thông minh. Hãy hỏi bất kỳ điều gì về cuộc họp.
    </p>
    <div className="flex flex-col gap-2 w-full max-w-[260px]">
      {[
        'Tóm tắt nội dung cuộc họp',
        'Dịch sang tiếng Anh',
        'Giải thích thuật ngữ chuyên ngành',
      ].map((text) => (
        <button
          key={text}
          onClick={() => onSuggest(text)}
          className="text-xs text-left px-3 py-2 rounded-lg border border-Gray-200 dark:border-Gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-Gray-700 dark:text-Gray-300 transition-all duration-200 cursor-pointer"
        >
          <span className="mr-1.5">💡</span> {text}
        </button>
      ))}
    </div>
  </div>
);

const InsightsAiTextChat = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const nodeRef = useRef(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollDownBtn, setShowScrollDownBtn] = useState(false);
  const [suggestedText, setSuggestedText] = useState('');

  const isActive = useAppSelector(
    (state) => state.bottomIconsActivity.isActiveInsightsAiTextChat,
  );
  const finalMessages = useAppSelector(
    (state) => state.insightsAiTextChat.finalMessages,
  );
  const interimMessage = useAppSelector(
    (state) => state.insightsAiTextChat.interimMessage,
  );
  const isAwaitingResponse = useAppSelector(
    (state) => state.insightsAiTextChat.isAwaitingResponse,
  );
  const isEnabled = useAppSelector(
    (state) =>
      state.session.currentRoom?.metadata?.roomFeatures?.insightsFeatures
        ?.aiFeatures?.aiTextChatFeatures?.isEnabled,
  );

  const allMessages = useMemo(() => {
    const messages = [...finalMessages];
    if (interimMessage) {
      messages.push(interimMessage);
    }
    return messages;
  }, [finalMessages, interimMessage]);

  // Show typing indicator: awaiting response but no interim message yet
  const showTypingIndicator = isAwaitingResponse && !interimMessage;

  useEffect(() => {
    if (scrollRef.current) {
      const timer = setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [allMessages, showTypingIndicator, scrollRef]);

  const close = useCallback(() => {
    dispatch(updateIsActiveInsightsAiTextChat(false));
  }, [dispatch]);

  const clearChat = useCallback(() => {
    dispatch(clearAllMessages());
  }, [dispatch]);

  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (container) {
      const isScrolledUp =
        container.scrollHeight - container.clientHeight >
        container.scrollTop + 200;
      if (isScrolledUp !== showScrollDownBtn) {
        setShowScrollDownBtn(isScrolledUp);
      }
    }
  }, [showScrollDownBtn]);

  const forceScrollToBottom = useCallback(() => {
    const container = scrollRef.current;
    if (container) {
      setTimeout(() => {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, []);

  const handleSuggest = useCallback((text: string) => {
    setSuggestedText(text);
  }, []);

  if (!isEnabled) {
    return null;
  }

  return (
    <div
      className={
        isActive
          ? 'w-full absolute h-full z-40 top-0 left-0 pointer-events-none'
          : 'hidden'
      }
    >
      <div className="ai-chat-widget h-[calc(100%-50px)] mt-9 flex items-end justify-center">
        <Draggable
          handle="#draggable-aichat"
          nodeRef={nodeRef}
          bounds="#main-area"
        >
          <div
            className="h-[400px] md:h-[500px] w-[400px] min-w-[300px] min-h-[300px] relative pointer-events-auto rounded-xl bg-Gray-25 dark:bg-dark-primary border border-Gray-200 dark:border-Gray-800 resize overflow-hidden shadow-lg"
            ref={nodeRef}
          >
            <div className="inner-wrapper relative z-20 w-full h-full flex flex-col">
              {/* Header */}
              <div
                id="draggable-aichat"
                className="absolute top-0 w-full flex items-center justify-between text-sm leading-none text-Gray-900 dark:text-white px-3 py-2 border-b border-Gray-200 dark:border-Gray-800 bg-Gray-50 dark:bg-[#1C1F2E] rounded-t-xl cursor-move transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <span className="h-3 w-3">
                      <AiIconSVG classes="w-full h-full" />
                    </span>
                  </div>
                  <span className="font-semibold text-sm">Trợ lý AI</span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full px-1.5 py-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Online
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  {allMessages.length > 0 && (
                    <button
                      className="cursor-pointer relative z-30 transition-all hover:opacity-80 text-Gray-400 hover:text-red-500 dark:text-Gray-500 dark:hover:text-red-400 p-0.5"
                      onClick={clearChat}
                      title="Phíen chat mới"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 4V1L8 5l4 4V6a6 6 0 016 6 6 6 0 01-6 6 6 6 0 01-6-6H4a8 8 0 008 8 8 8 0 008-8 8 8 0 00-8-8z" fill="currentColor"/>
                      </svg>
                    </button>
                  )}
                  {showScrollDownBtn && (
                    <button
                      className="cursor-pointer relative z-30 transition-opacity hover:opacity-80 text-Gray-500 hover:text-Gray-700 dark:text-Gray-400 dark:hover:text-white"
                      onClick={forceScrollToBottom}
                    >
                      <ScrollToBottomIconSVG />
                    </button>
                  )}
                  <button
                    className="cursor-pointer relative z-30 hover:opacity-80 transition-opacity text-Gray-500 hover:text-Gray-700 dark:text-Gray-400 dark:hover:text-white"
                    onClick={close}
                  >
                    <PopupCloseSVGIcon classes="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="h-full pt-[37px] flex flex-col">
                <div
                  ref={scrollRef}
                  className="message-list-wrapper relative overflow-auto scrollBar px-3 3xl:px-5 pt-2 xl:pt-3 flex-grow mb-1"
                  onScroll={handleScroll}
                >
                  {allMessages.length === 0 && !showTypingIndicator ? (
                    <WelcomeMessage onSuggest={handleSuggest} />
                  ) : (
                    <div>
                      {allMessages.map((msg) => {
                        if (!msg) return null;

                        const parsedMessage = marked.parse(msg.parts.join(''), {
                          async: false,
                        });
                        const isStreaming =
                          interimMessage !== null &&
                          interimMessage.id === msg.id;

                        return (
                          <div
                            key={msg.id}
                            className="wrapper flex gap-2 3xl:gap-3 my-4"
                          >
                            {msg.role === 'model' ? (
                              <AIMessage
                                name={t('insights.ai-text-chat.name')}
                                message={parsedMessage}
                                isStreaming={isStreaming}
                                sentAt={msg.createdAt}
                              />
                            ) : (
                              <MyMessage
                                message={parsedMessage}
                                sentAt={msg.createdAt}
                              />
                            )}
                          </div>
                        );
                      })}

                      {/* Typing indicator */}
                      {showTypingIndicator && <TypingIndicator />}
                    </div>
                  )}
                </div>

                <div className="message-form z-30 border-t border-Gray-200 dark:border-Gray-800 bg-white dark:bg-dark-primary w-full px-3 3xl:px-5 py-2 3xl:py-4 flex items-center shrink-0">
                  <TextBoxArea
                    suggestedText={suggestedText}
                    onSuggestedTextUsed={() => setSuggestedText('')}
                  />
                </div>
              </div>
            </div>
          </div>
        </Draggable>
      </div>
    </div>
  );
};

export default InsightsAiTextChat;
