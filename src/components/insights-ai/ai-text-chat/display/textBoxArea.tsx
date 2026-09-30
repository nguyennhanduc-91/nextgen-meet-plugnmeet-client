import React, { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { isEmpty } from 'es-toolkit/compat';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import {
  CommonResponseSchema,
  InsightsAITextChatContentSchema,
  InsightsAITextChatRole,
} from 'plugnmeet-protocol-js';

import SendIconSVG from '../../../../assets/Icons/SendIconSVG';
import { useAutosizeTextArea } from '../../../chat/text-box/useAutosizeTextArea';
import { store, useAppDispatch, useAppSelector } from '../../../../store';
import {
  addAiTextChatUserMessage,
  clearIsAwaitingResponse,
} from '../../../../store/slices/insightsAiTextChatSlice';
import sendAPIRequest from '../../../../helpers/api/plugNmeetAPI';

interface TextBoxAreaProps {
  suggestedText?: string;
  onSuggestedTextUsed?: () => void;
}

const TextBoxArea = ({ suggestedText, onSuggestedTextUsed }: TextBoxAreaProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const isAwaitingResponse = useAppSelector(
    (state) => state.insightsAiTextChat.isAwaitingResponse,
  );

  const [message, setMessage] = useState<string>('');
  useAutosizeTextArea(textAreaRef.current, message);

  // Accept suggested text from welcome message
  useEffect(() => {
    if (suggestedText && suggestedText.length > 0) {
      setMessage(suggestedText);
      onSuggestedTextUsed?.();
      textAreaRef.current?.focus();
    }
  }, [suggestedText, onSuggestedTextUsed]);

  const sendMsg = useCallback(async () => {
    if (isAwaitingResponse || isEmpty(message)) return;

    // Read synchronously to avoid re-rendering the hidden component and triggering the 0px bug
    const state = store.getState();
    const aiTextChatFeatures = state.session.currentRoom.metadata?.roomFeatures?.insightsFeatures?.aiFeatures?.aiTextChatFeatures;

    // Check if reasoning is disabled via the special flag in allowedUserIds
    const isReasoningDisabled = (aiTextChatFeatures?.allowedUserIds || []).includes('__DISABLE_REASONING__');
    const prefix = isReasoningDisabled ? '[R-] ' : '[R+] ';

    const body = create(InsightsAITextChatContentSchema, {
      role: InsightsAITextChatRole.INSIGHTS_AI_TEXT_CHAT_ROLE_USER,
      text: prefix + message, // Inject reasoning flag
    });
    // Dispatch the user message immediately, this will set isAwaitingResponse to true
    // and instantly lock the UI.
    dispatch(addAiTextChatUserMessage(message)); // Show original message in UI
    setMessage('');

    try {
      const r = await sendAPIRequest(
        'insights/ai/textChat/execute',
        toBinary(InsightsAITextChatContentSchema, body),
        false,
        'application/protobuf',
        'arraybuffer',
      );

      const res = fromBinary(CommonResponseSchema, new Uint8Array(r));
      if (!res.status) {
        toast(t(res.msg), {
          type: 'error',
        });
        dispatch(clearIsAwaitingResponse());
      }
    } catch (e: any) {
      toast(e.message || 'Lỗi kết nối đến máy chủ AI', {
        type: 'error',
      });
      dispatch(clearIsAwaitingResponse());
    }
  }, [t, dispatch, message, isAwaitingResponse]);

  const handleChange = useCallback(
    (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMessage(evt.target?.value);
    },
    [],
  );

  const onEnterPress = useCallback(
    async (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        await sendMsg();
      }
    },
    [sendMsg],
  );

  const placeholderText = isAwaitingResponse
    ? t('insights.ai-text-chat.responding-placeholder')
    : t('insights.ai-text-chat.chat-box-placeholder');

  const isSendButtonDisabled = isAwaitingResponse || isEmpty(message);

  return (
    <div className={`flex items-center justify-between border rounded-2xl 3xl:rounded-3xl p-1.5 w-full transition-all duration-300 ${
      isAwaitingResponse
        ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-900/10'
        : 'border-Gray-200 dark:border-Gray-800'
    }`}>
      <textarea
        name="message-textarea"
        id="message-textarea"
        className="flex-1 outline-hidden text-xs 3xl:text-sm text-Gray-600 dark:text-dark-text placeholder:dark:text-dark-text  font-normal h-10 mr-2 overflow-hidden px-2"
        value={message}
        onChange={handleChange}
        disabled={isAwaitingResponse}
        placeholder={placeholderText}
        onKeyDown={onEnterPress}
        ref={textAreaRef}
        rows={1}
      />
      <button
        disabled={isSendButtonDisabled}
        onClick={sendMsg}
        className={`w-7 3xl:w-9 h-7 3xl:h-9 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-Blue hover:border-Blue2-600 ${
          isSendButtonDisabled
            ? 'bg-Blue/30 border border-Blue2-600/30 cursor-not-allowed'
            : 'bg-Blue border border-Blue2-600 cursor-pointer'
        }`}
      >
        <SendIconSVG />
      </button>
    </div>
  );
};

export default TextBoxArea;
