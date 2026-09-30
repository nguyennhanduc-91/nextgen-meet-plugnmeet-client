import React, { memo, ReactElement, useCallback } from 'react';
import { ChatMessage } from 'plugnmeet-protocol-js';
import { useTranslation } from 'react-i18next';

import { ICurrentUser } from '../../../../store/slices/interfaces/session';
import { MyMessage, OtherUserMessage, SystemMessage } from './messageTypes';
import { useAppDispatch } from '../../../../store';
import { setReplyingTo } from '../../../../store/slices/roomSettingsSlice';

interface IMessageProps {
  body: ChatMessage;
  currentUser?: ICurrentUser;
}

const Message = ({ body, currentUser }: IMessageProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  let content: ReactElement | null;

  const isSystem = body.fromUserId === 'system';
  const isMe = currentUser?.userId === body.fromUserId;

  const handleReply = useCallback(() => {
    dispatch(setReplyingTo({
      messageId: body.id,
      name: isMe ? t('right-panel.you') : body.fromName,
      text: body.message,
    }));
  }, [dispatch, body, isMe, t]);

  if (isSystem) {
    content = <SystemMessage message={body.message} />;
  } else if (isMe) {
    content = <MyMessage message={body.message} sentAt={body.sentAt} onReply={handleReply} />;
  } else {
    content = <OtherUserMessage body={body} onReply={handleReply} />;
  }

  return <div className="wrapper flex gap-2 3xl:gap-3">{content}</div>;
};

export default memo(Message);
