import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { create } from '@bufbuild/protobuf';
import copy from 'copy-text-to-clipboard';
import { JoinBreakoutRoomReqSchema } from 'plugnmeet-protocol-js';

import { store, useAppDispatch } from '../../../store';
import { useJoinRoomMutation } from '../../../store/services/breakoutRoomApi';
import { updateReceivedInvitationFor } from '../../../store/slices/breakoutRoomSlice';
import { addUserNotification } from '../../../store/slices/roomSettingsSlice';
import ActionButton from '../../../helpers/ui/actionButton';
import { BreakoutRoomIconSVG } from '../../../assets/Icons/BreakoutRoomIconSVG';

interface NewBreakoutRoomProps {
  receivedInvitationFor: string | undefined;
  createdAt: number | undefined;
}

const NewBreakoutRoom = ({
  receivedInvitationFor,
  createdAt,
}: NewBreakoutRoomProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [joinRoom, { isLoading, data }] = useJoinRoomMutation();
  const [joinLink, setJoinLink] = useState<string>('');
  const [copyText, setCopyText] = useState<string>(
    t('breakout-room.copy').toString(),
  );
  const userId = useMemo(
    () => store.getState().session.currentUser?.userId,
    [],
  );

  useEffect(() => {
    if (!isLoading && data) {
      if (!data.status) {
        dispatch(
          addUserNotification({
            message: t(data.msg),
            typeOption: 'error',
            newInstance: true,
          }),
        );
        return;
      }
      if (data.token && data.token !== '') {
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('access_token', data.token);
        const url =
          location.protocol +
          '//' +
          location.host +
          window.location.pathname +
          '?' +
          searchParams.toString();

        const opened = window.open(url, '_blank');
        setJoinLink(url);

        if (!opened) {
          setJoinLink(url);
          return;
        }

        dispatch(updateReceivedInvitationFor(''));
      }
    }
    //eslint-disable-next-line
  }, [isLoading, data]);

  const join = useCallback(() => {
    if (!receivedInvitationFor) {
      dispatch(
        addUserNotification({
          message: t('breakout-room.user-joined'),
          typeOption: 'error',
          newInstance: true,
        }),
      );
      return;
    }
    joinRoom(
      create(JoinBreakoutRoomReqSchema, {
        breakoutRoomId: receivedInvitationFor,
        userId: userId,
      }),
    );
  }, [receivedInvitationFor, userId, joinRoom, dispatch, t]);

  const copyUrl = useCallback(() => {
    copy(joinLink);
    setCopyText(t('breakout-room.copied').toString());
    setTimeout(() => {
      setCopyText(t('breakout-room.copy').toString());
    }, 1000);
  }, [joinLink, t]);

  const formatDate = (timeStamp?: number) => {
    const date = new Date(timeStamp ?? 0);
    return date.toLocaleString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="group w-full flex items-start gap-3 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer relative overflow-hidden">
      <div className="icon w-8 h-8 rounded-lg relative flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 transition-transform group-hover:scale-105">
        <BreakoutRoomIconSVG classes="w-4 h-4 transition-transform group-hover:rotate-[15deg]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-800 dark:text-slate-200 text-[13px] font-medium leading-tight mb-1">
          {t('breakout-room.invitation-msg')}
        </p>
        
        {joinLink !== '' && (
          <div className="invite-link mt-1.5 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 mb-1">
            <span className="text-slate-500 text-[10px] block mb-0.5 ml-1">
              {t('breakout-room.join-text-label')}
            </span>
            <div className="flex gap-1.5">
              <input
                type="text"
                readOnly={true}
                value={joinLink}
                className="flex-1 min-w-0 outline-hidden border border-slate-200 dark:border-slate-700 rounded-md px-2 h-6 text-[10px] bg-white dark:bg-slate-800 dark:text-slate-200"
              />
              <button
                onClick={copyUrl}
                className="shrink-0 h-6 px-2.5 text-[10px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-md transition-colors"
              >
                {copyText}
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-1">
          <span className="text-slate-400 dark:text-slate-500 text-[11px] uppercase tracking-wide">
            {formatDate(createdAt)}
          </span>
          <ActionButton
            onClick={join}
            isLoading={isLoading}
            custom="!h-6 w-auto px-3 !text-[11px] !rounded-lg bg-indigo-500 hover:bg-indigo-600 border-none text-white font-semibold transition-all"
          >
            {t('breakout-room.join')}
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default NewBreakoutRoom;
