import React, { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { marked } from 'marked';
import { ChatMessage } from 'plugnmeet-protocol-js';

import { formatDate } from '../../utils';
import { useAppSelector } from '../../../../store';
import { participantsSelector } from '../../../../store/slices/participantSlice';
import Avatar from './avatar';
import { AiIconSVG } from '../../../../assets/Icons/AiIconSVG';

const ReplyIconSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <polyline points="9 17 4 12 9 7"></polyline>
    <path d="M20 18v-2a4 4 0 0 0-4-4H4"></path>
  </svg>
);

export const SystemMessage = memo(({ message }: { message: string }) => {
  return (
    <div className="content w-full system flex items-center gap-2 text-center my-2">
      <div className="flex-1 border-t border-dashed border-Gray-300 dark:border-Gray-800" />
      <p
        className="message-content text-xs text-Gray-600 dark:text-dark-text px-2"
        dangerouslySetInnerHTML={{ __html: message }}
      />
      <div className="flex-1 border-t border-dashed border-Gray-300 dark:border-Gray-800" />
    </div>
  );
});
SystemMessage.displayName = 'SystemMessage';

export const MyMessage = memo(
  ({ message, sentAt, onReply }: { message: string; sentAt: string; onReply?: () => void }) => {
    const { t } = useTranslation();
    const [isHovered, setIsHovered] = useState(false);
    return (
      <div 
        className="content me w-[calc(100%-36px)] 3xl:w-[calc(100%-48px)] ml-auto relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="name min-h-5 flex items-center text-xs 3xl:text-sm text-Gray-800 dark:text-white font-medium pb-1.5 capitalize justify-between">
          <p>{t('right-panel.you')}</p>
          <p className="time text-xs text-Gray-600 dark:text-dark-text">
            {formatDate(sentAt)}
          </p>
        </div>
        <div className="flex items-center justify-end gap-2">
          {onReply && isHovered && (
            <button
              onClick={onReply}
              className="w-6 h-6 flex shrink-0 items-center justify-center rounded-full bg-white dark:bg-dark-secondary shadow-sm border border-Gray-200 dark:border-Gray-700 text-Gray-500 hover:text-Blue transition-colors z-10"
              title="Trả lời"
            >
              <ReplyIconSVG />
            </button>
          )}
          <p
            className="message-content py-2 px-2.5 border border-Gray-200 dark:border-Gray-700 rounded-lg overflow-hidden rounded-br-none text-sm text-Gray-950 dark:text-white break-words"
            dangerouslySetInnerHTML={{ __html: message }}
          />
        </div>
      </div>
    );
  },
);
MyMessage.displayName = 'MyMessage';

export const OtherUserMessage = memo(({ body, onReply }: { body: ChatMessage; onReply?: () => void }) => {
  const participantName = useAppSelector(
    (state) => participantsSelector.selectById(state, body.fromUserId)?.name,
  );
  const displayName = body.fromName || participantName;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <Avatar userId={body.fromUserId} name={body.fromName} />
      <div 
        className="content w-[calc(100%-36px)] 3xl:w-[calc(100%-48px)] flex-1 relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="name min-h-5 flex items-center text-sm text-Gray-800 dark:text-white font-medium pb-1.5 capitalize justify-between">
          <p>
            {displayName}
            {!participantName && (
              <span className="text-[10px] pl-1">(offline)</span>
            )}
          </p>
          <p className="time text-xs text-Gray-600">
            {formatDate(body.sentAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p
            className="message-content py-2 px-2.5 border border-Gray-200 dark:border-Gray-700 rounded-lg overflow-hidden text-sm text-Gray-950 dark:text-white break-words rounded-tl-none bg-Gray-50 dark:bg-Gray-800"
            dangerouslySetInnerHTML={{ __html: body.message }}
          />
          {onReply && isHovered && (
            <button
              onClick={onReply}
              className="w-6 h-6 flex shrink-0 items-center justify-center rounded-full bg-white dark:bg-dark-secondary shadow-sm border border-Gray-200 dark:border-Gray-700 text-Gray-500 hover:text-Blue transition-colors z-10"
              title="Trả lời"
            >
              <ReplyIconSVG />
            </button>
          )}
        </div>
      </div>
    </>
  );
});
OtherUserMessage.displayName = 'OtherUserMessage';

export const AIMessage = memo(
  ({
    name,
    message,
    sentAt,
    isStreaming,
  }: {
    name: string;
    message: string;
    sentAt: string;
    isStreaming: boolean;
  }) => {
    const [showThinking, setShowThinking] = useState(false);

    // Parse thinking content from markers
    const thinkingRegex = /<!--THINKING_START-->([\s\S]*?)<!--THINKING_END-->/;
    const thinkingMatch = message.match(thinkingRegex);
    const thinkingContent = thinkingMatch ? thinkingMatch[1].trim() : '';
    const mainContent = message.replace(thinkingRegex, '').trim();

    // Check if still in thinking phase (has start marker but no end marker yet = still streaming thinking)
    const isStillThinking =
      isStreaming &&
      message.includes('<!--THINKING_START-->') &&
      !message.includes('<!--THINKING_END-->');

    // Extract raw thinking text for display while still streaming
    const streamingThinkingText = isStillThinking
      ? message.replace('<!--THINKING_START-->', '').trim()
      : '';

    return (
      <>
        {/* AI Avatar with pulse animation */}
        <div
          className={`thumb h-7 3xl:h-9 w-7 3xl:w-9 rounded-lg 3xl:rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center overflow-hidden shrink-0 ${isStreaming ? 'ai-avatar-pulse' : ''}`}
        >
          <span className="h-4 w-4 3xl:h-5 3xl:w-5">
            <AiIconSVG classes="w-full h-full" />
          </span>
        </div>
        <div className="content w-[calc(100%-36px)] 3xl:w-[calc(100%-48px)] flex-1">
          <div className="name min-h-5 flex items-center text-sm text-Gray-800 dark:text-white font-medium pb-1.5 capitalize justify-between">
            <p className="flex items-center gap-1.5">
              {name}
              {isStreaming && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-normal text-indigo-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  đang trả lời
                </span>
              )}
            </p>
            <p className="time text-xs text-Gray-600 dark:text-dark-text">
              {formatDate(sentAt)}
            </p>
          </div>

          <div className="message-content py-2.5 px-3 border border-Gray-200 dark:border-Gray-700 rounded-lg overflow-hidden text-sm text-Gray-950 dark:text-white break-words rounded-tl-none bg-Gray-50 dark:bg-Gray-800">
            {/* Still-thinking indicator (streaming phase) */}
            {isStillThinking && (
              <div className="mb-2">
                <div className="flex items-center gap-2 text-xs text-purple-400 dark:text-purple-300 mb-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-slow">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
                  </svg>
                  <span>AI đang suy luận...</span>
                  <span className="ai-typing-dots">
                    <span /><span /><span />
                  </span>
                </div>
                <div className="ai-thinking-stream text-xs text-Gray-500 dark:text-Gray-400 italic border-l-2 border-purple-400/40 pl-2 max-h-[100px] overflow-y-auto">
                  {streamingThinkingText}
                </div>
              </div>
            )}

            {/* Collapsible thinking section (after thinking is done) */}
            {thinkingContent && !isStillThinking && (
              <div className="mb-2">
                <button
                  onClick={() => setShowThinking(!showThinking)}
                  className="flex items-center gap-1.5 text-xs text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors cursor-pointer py-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
                  </svg>
                  <span>{showThinking ? 'Ẩn quá trình suy luận' : 'Xem quá trình suy luận'}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${showThinking ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {showThinking && (
                  <div className="ai-thinking-content text-xs text-Gray-500 dark:text-Gray-400 italic border-l-2 border-purple-400/30 pl-2.5 py-1.5 max-h-[200px] overflow-y-auto mt-1 bg-purple-50/50 dark:bg-purple-900/10 rounded-r">
                    <div
                      className="break-words [&>p]:mb-1"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(thinkingContent, { async: false }),
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Main answer content */}
            {mainContent && (
              <div
                className="break-words [&>p]:mb-1 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>pre]:bg-Gray-100 [&>pre]:dark:bg-Gray-900 [&>pre]:p-2 [&>pre]:rounded [&>pre]:text-xs [&>pre]:overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: mainContent }}
              />
            )}

            {/* Streaming cursor */}
            {isStreaming && !isStillThinking && (
              <span className="inline-block h-4 w-0.5 ml-0.5 bg-indigo-500 animate-pulse" />
            )}
          </div>
        </div>
      </>
    );
  },
);
AIMessage.displayName = 'AIMessage';

