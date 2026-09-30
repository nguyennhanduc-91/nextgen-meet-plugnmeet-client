import React, {
  ClipboardEvent,
  KeyboardEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import sanitizeHtml from 'sanitize-html';
import { useTranslation } from 'react-i18next';
import { isEmpty } from 'es-toolkit/compat';
import { RoomUploadedFileType } from 'plugnmeet-protocol-js';

import { store, useAppDispatch, useAppSelector } from '../../../store';
import FileSend from './fileSend';
import EmojiPicker from './emojiPicker';
import { getNatsConn } from '../../../helpers/nats';
import { useAutosizeTextArea } from './useAutosizeTextArea';
import { publishFileAttachmentToChat } from '../utils';
import { uploadResumableFile } from '../../../helpers/fileUpload';
import { addUserNotification, setReplyingTo } from '../../../store/slices/roomSettingsSlice';
import SendIconSVG from '../../../assets/Icons/SendIconSVG';
import { CloseIconSVG } from '../../../assets/Icons/CloseIconSVG';

const urlRegex =
  /(\b(https?):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%?=~_|])/gi;

const TextBoxArea = () => {
  const dispatch = useAppDispatch();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();
  const conn = getNatsConn();
  // Values that are static for the session
  const { isAdmin, chatFeatures } = useMemo(() => {
    const session = store.getState().session;
    const currentUser = session.currentUser;
    return {
      isAdmin: !!currentUser?.metadata?.isAdmin,
      chatFeatures: session.currentRoom.metadata?.roomFeatures?.chatFeatures,
    };
  }, []);

  const isLockChatSendMsg = useAppSelector(
    (state) =>
      state.session.currentUser?.metadata?.lockSettings?.lockChatSendMessage,
  );
  const isLockSendFile = useAppSelector(
    (state) =>
      state.session.currentUser?.metadata?.lockSettings?.lockChatFileShare,
  );
  const selectedChatOption = useAppSelector(
    (state) => state.roomSettings.selectedChatOption,
  );
  const defaultLockSettings = useAppSelector(
    (state) => state.session.currentRoom.metadata?.defaultLockSettings,
  );
  const replyingTo = useAppSelector((state) => state.roomSettings.replyingTo);
  const isHostOnlyChatEnabled = useAppSelector((state) => state.roomSettings.isHostOnlyChatEnabled);

  const [message, setMessage] = useState<string>('');
  useAutosizeTextArea(textAreaRef.current, message);
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  const handleChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = evt.target?.value;
    setMessage(val);
  };

  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessage((prev) => prev + emoji);
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  }, []);

  const cancelReply = useCallback(() => {
    dispatch(setReplyingTo(null));
  }, [dispatch]);

  const showSendFile = useMemo(
    () => !!chatFeatures?.isAllowFileUpload,
    [chatFeatures],
  );

  const isMsgSendingLocked = useMemo(() => {
    if (isAdmin) return false;

    if (isHostOnlyChatEnabled && selectedChatOption === 'public') {
      return true;
    }

    // User-specific setting takes precedence.
    if (typeof isLockChatSendMsg !== 'undefined') {
      return isLockChatSendMsg;
    }
    // Otherwise, fall back to the room's default setting.
    return !!defaultLockSettings?.lockChatSendMessage;
  }, [isAdmin, isHostOnlyChatEnabled, selectedChatOption, isLockChatSendMsg, defaultLockSettings?.lockChatSendMessage]);

  const isFileSendingLocked = useMemo(() => {
    if (isAdmin) return false;

    // User-specific setting takes precedence.
    if (typeof isLockSendFile !== 'undefined') {
      return isLockSendFile;
    }
    // Otherwise, fall back to the room's default setting.
    return !!defaultLockSettings?.lockChatFileShare;
  }, [isAdmin, isLockSendFile, defaultLockSettings?.lockChatFileShare]);

  const cleanHtml = (rawText: string) => {
    return sanitizeHtml(rawText, {
      allowedTags: ['b', 'i', 'strong', 'br', 'a', 'blockquote'],
      allowedAttributes: {
        a: ['href', 'target', 'class'],
        blockquote: ['class'],
      },
      allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    });
  };

  const sendMsg = useCallback(async () => {
    if (isSendingMsg || isMsgSendingLocked) {
      return;
    }
    if (conn) {
      const formattedMessage = message.replace(
        urlRegex,
        (url) =>
          `<a href="${url}" target="_blank" class="text-secondary-color hover:underline">${url}</a>`,
      );
      
      let finalMsg = cleanHtml(formattedMessage);
      
      if (replyingTo) {
        // Prevent double quoting or too deep nesting by stripping previous blockquotes in the preview if needed
        const quotedText = replyingTo.text.replace(/<blockquote(.*?)>(.*?)<\/blockquote>/g, '[Trích dẫn]');
        finalMsg = `<blockquote class="border-l-2 border-Gray-300 dark:border-Gray-600 pl-2 ml-1 text-xs text-Gray-500 mb-1"><b>${replyingTo.name}:</b> ${cleanHtml(quotedText)}</blockquote>` + finalMsg;
      }

      if (isEmpty(finalMsg)) {
        return;
      }
      setIsSendingMsg(true);
      setMessage('');
      if (replyingTo) {
        dispatch(setReplyingTo(null));
      }

      await conn.sendChatMsg(
        selectedChatOption,
        finalMsg.replace(/\r?\n/g, '<br />'),
      );
      setIsSendingMsg(false);
    }
  }, [conn, message, selectedChatOption, isSendingMsg, isMsgSendingLocked, replyingTo, dispatch]);

  const onEnterPress = useCallback(
    async (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        await sendMsg();
      }
    },
    [sendMsg],
  );

  const handleOnPaste = useCallback(
    (e: ClipboardEvent) => {
      if (isFileSendingLocked || isMsgSendingLocked) {
        return;
      }

      if (e.clipboardData && e.clipboardData.items) {
        const files: File[] = [];
        const items = e.clipboardData.items;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            const f = items[i].getAsFile();
            if (f) {
              const extension = f.name.slice(
                ((f.name.lastIndexOf('.') - 1) >>> 0) + 2,
              );
              files.push(
                new File([f], Date.now().toString() + '.' + extension, {
                  type: f.type,
                  lastModified: f.lastModified,
                }),
              );
            }
          }
        }

        if (files.length) {
          uploadResumableFile(
            chatFeatures?.allowedFileTypes ?? [],
            chatFeatures?.maxFileSize,
            RoomUploadedFileType.CHAT_FILE,
            files,
            (result) => {
              publishFileAttachmentToChat(
                result.filePath,
                result.fileName,
              ).then(() =>
                dispatch(
                  addUserNotification({
                    message: t('right-panel.file-upload-success'),
                    typeOption: 'success',
                  }),
                ),
              );
            },
          );
        }
      }
    },
    [isFileSendingLocked, isMsgSendingLocked, chatFeatures, dispatch, t],
  );

  const placeholderText = isSendingMsg
    ? t('right-panel.sending-message')
    : t('right-panel.chat-box-placeholder');

  return (
    <div className="flex flex-col w-full relative">
      {replyingTo && (
        <div className="absolute -top-10 left-0 right-0 h-10 bg-Gray-100 dark:bg-Gray-800 border-x border-t border-Gray-200 dark:border-Gray-700 rounded-t-xl px-3 py-1 flex items-center justify-between text-xs z-10 overflow-hidden">
          <div className="flex-1 truncate text-Gray-600 dark:text-Gray-300">
            <span className="font-semibold">{replyingTo.name}: </span>
            <span dangerouslySetInnerHTML={{ __html: replyingTo.text.replace(/<[^>]*>?/gm, '') }} />
          </div>
          <button onClick={cancelReply} className="ml-2 w-4 h-4 text-Gray-500 hover:text-Red-500 cursor-pointer">
            <CloseIconSVG />
          </button>
        </div>
      )}
      <div className={`flex items-center justify-between border border-Gray-200 dark:border-Gray-700 p-1.5 w-full bg-white dark:bg-dark-secondary z-20 ${replyingTo ? 'rounded-b-2xl rounded-t-none' : 'rounded-2xl 3xl:rounded-3xl'}`}>
        {showSendFile && (
          <FileSend
            lockSendFile={isFileSendingLocked}
            chatFeatures={chatFeatures}
          />
        )}
        <textarea
          name="message-textarea"
          id="message-textarea"
          className="flex-1 outline-hidden text-xs 3xl:text-sm text-Gray-600 dark:text-white font-normal h-10 mr-2 overflow-hidden bg-transparent"
          value={message}
          onChange={handleChange}
          disabled={isMsgSendingLocked}
          placeholder={placeholderText}
          onKeyDown={onEnterPress}
          ref={textAreaRef}
          rows={1}
          onPaste={handleOnPaste}
        />
        <div className="flex items-center gap-1">
          <EmojiPicker onSelect={handleEmojiSelect} disabled={isMsgSendingLocked} />
          <button
            disabled={isMsgSendingLocked || isSendingMsg}
            onClick={sendMsg}
            className={`w-7 3xl:w-9 h-7 3xl:h-9 flex items-center justify-center rounded-full transition-all duration-300 hover:bg-Blue hover:border-Blue2-600 ${isEmpty(message) ? 'bg-Blue/30 border border-Blue2-600/30' : 'bg-Blue border border-Blue2-600'} ${!isMsgSendingLocked && !isEmpty(message) ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          >
            <SendIconSVG />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextBoxArea;
