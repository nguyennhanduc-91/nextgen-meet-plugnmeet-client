import React, {
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { create } from '@bufbuild/protobuf';
import {
  DataMsgBodyType,
  SubmitPollResponseReqSchema,
} from 'plugnmeet-protocol-js';

import { store, useAppDispatch } from '../../../store';
import {
  useAddResponseMutation,
  useGetUserSelectedOptionQuery,
} from '../../../store/services/pollsApi';
import { getNatsConn } from '../../../helpers/nats';
import { PollDataWithOption } from '../utils';
import { addUserNotification } from '../../../store/slices/roomSettingsSlice';
import { LoadingIcon } from '../../../assets/Icons/Loading';

interface PollFormProps {
  pollDataWithOption: PollDataWithOption;
  isRunning: boolean;
}

const PollForm = ({ pollDataWithOption, isRunning }: PollFormProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [selectedOption, setSelectedOption] = useState<number>();
  const conn = getNatsConn();
  const currentUser = useMemo(() => store.getState().session.currentUser, []);

  const [voted, setVoted] = useState<boolean>(false);
  const { data: userVoteData } = useGetUserSelectedOptionQuery({
    pollId: pollDataWithOption.pollId,
    userId: currentUser?.userId || '',
  });
  useEffect(() => {
    if (
      userVoteData &&
      userVoteData.status &&
      userVoteData.voted &&
      Number(userVoteData.voted) > 0
    ) {
      // only when we've valid vote
      setVoted(true);
      setSelectedOption(Number(userVoteData.voted));
    }
  }, [userVoteData]);

  const [addResponse, { isLoading, data: addReqResponse }] =
    useAddResponseMutation();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOption || isLoading) {
      return;
    }
    addResponse(
      create(SubmitPollResponseReqSchema, {
        pollId: pollDataWithOption.pollId,
        userId: currentUser?.userId ?? '',
        name: currentUser?.name ?? '',
        selectedOption: `${selectedOption}`,
      }),
    );

    // notify to everyone
    if (conn) {
      conn.sendDataMessage(
        DataMsgBodyType.NEW_POLL_RESPONSE,
        pollDataWithOption.pollId,
      );
    }
  };

  useEffect(() => {
    if (addReqResponse) {
      const message = addReqResponse.status
        ? t('polls.response-added')
        : t(addReqResponse.msg);
      const typeOption = addReqResponse.status ? 'info' : 'error';

      dispatch(
        addUserNotification({
          message,
          typeOption,
        }),
      );
    }
    // We only want this to run when the response comes back.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addReqResponse]);

  const onClickSelectOption = useCallback(
    (val: number) => {
      if (voted || !isRunning) {
        return;
      }
      setSelectedOption(val);
    },
    [isRunning, voted],
  );

  const canViewPercentage = () => {
    if (!isRunning) {
      return true;
    }
    return !!currentUser?.metadata?.isAdmin;
  };

  const pollOption = useMemo(() => {
    const elms: Array<ReactElement> = [];
    for (const key in pollDataWithOption.options) {
      const o = pollDataWithOption.options[key];
      // Determine bar color based on percentage
      let barColor = 'linear-gradient(90deg, rgba(79,70,229,0.12) 0%, rgba(14,165,233,0.22) 100%)';
      if (o.responsesPercentage >= 50) {
        barColor = 'linear-gradient(90deg, rgba(16,185,129,0.15) 0%, rgba(14,165,233,0.25) 100%)';
      }
      elms.push(
        <div
          key={`option-${pollDataWithOption.pollId}-${o.id}`}
          className="relative flex items-center border border-Gray-300 dark:border-Gray-600 min-h-[38px] bg-white dark:bg-dark-secondary shadow-button-shadow dark:shadow-none rounded-xl px-2 overflow-hidden my-2 cursor-pointer"
          onClick={() => onClickSelectOption(o.id)}
        >
          <input
            type="radio"
            id={`option-${pollDataWithOption.pollId}-${o.id}`}
            checked={selectedOption === o.id}
            readOnly
            className="polls-checkbox relative appearance-none w-[18px] h-[18px] border border-Gray-300 shadow-button-shadow rounded-[6px] checked:bg-Blue2-500 checked:border-Blue2-600"
          />
          <label
            className="text-sm text-Gray-900 dark:text-white w-full h-full pl-7 z-10 flex items-center cursor-pointer"
            htmlFor={`option-${pollDataWithOption.pollId}-${o.id}`}
          >
            {o.text}
          </label>
          {canViewPercentage() && (
            <>
              <div
                className="shape absolute top-0 left-0 h-full rounded-r-lg"
                style={{
                  width: `${o.responsesPercentage}%`,
                  background: barColor,
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              ></div>
              <div className="per absolute top-1/2 -translate-y-1/2 right-4 text-xs text-Gray-700 dark:text-white">
                {o.responsesPercentage + '%'}
              </div>
            </>
          )}
        </div>,
      );
    }
    return elms;
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [onClickSelectOption, pollDataWithOption.options, selectedOption]);

  return (
    <form
      className="group"
      onSubmit={onSubmit}
      name={`voteForm-${pollDataWithOption.pollId}`}
    >
      {pollOption}
      {isLoading && (
        <div className="absolute text-center top-1/2 -translate-y-1/2 z-999 left-0 right-0 m-auto">
          <LoadingIcon
            className={
              'inline w-10 h-10 me-3 text-Gray-200 dark:text-Gray-800 animate-spin'
            }
            fillColor={'var(--color-primary-color)'}
          />
        </div>
      )}
      {!isRunning || voted || !selectedOption ? null : (
        <div className="button-section flex items-center justify-end mt-3">
          <button
            className="primary-button h-9 px-6 cursor-pointer flex items-center justify-center gap-1.5 rounded-[12px] text-sm font-semibold text-white bg-gradient-to-r from-Blue to-Blue2-600 border border-DarkBlue transition-all duration-300 hover:from-Dark-blue hover:to-Blue2-700 shadow-button-shadow hover:shadow-lg active:scale-[0.98]"
            type="submit"
          >
            {t('polls.submit')}
          </button>
        </div>
      )}
    </form>
  );
};

export default PollForm;
