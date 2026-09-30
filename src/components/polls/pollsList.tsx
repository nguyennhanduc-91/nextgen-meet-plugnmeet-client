import React, { useMemo } from 'react';

import { useGetPollListsQuery } from '../../store/services/pollsApi';
import PollItem from './pollItem';
import { LoadingIcon } from '../../assets/Icons/Loading';
import { PollsIconSVG } from '../../assets/Icons/PollsIconSVG';
import { isPollDeletedLocally } from './utils';

const PollsList = () => {
  const { currentData: data, isFetching } = useGetPollListsQuery();

  const polls = useMemo(() => {
    if (data && data.polls) {
      const activePolls = data.polls.filter((p) => !isPollDeletedLocally(p.id));
      const sortedPolls = activePolls.slice();
      sortedPolls.sort((a, b) => Number(b.created) - Number(a.created));
      return sortedPolls;
    }
    return [];
  }, [data]);

  return (
    <div className="polls-list-wrapper relative overflow-y-auto scrollBar px-3 3xl:px-5 pt-2 xl:pt-3 h-full pb-4">
      <div className="polls-list-wrap-inner grid gap-4">
        {polls.map((poll, index) => (
          <PollItem
            key={poll.id}
            item={poll}
            serialNum={polls.length - index}
          />
        ))}

        {/* Empty State */}
        {polls.length === 0 && !isFetching && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-Gray-100 dark:bg-dark-secondary2 flex items-center justify-center mb-4">
              <PollsIconSVG classes="w-8 h-8 text-Gray-400" />
            </div>
            <p className="text-sm text-Gray-600 dark:text-Gray-400 font-medium mb-1">
              Chưa có bình chọn nào
            </p>
            <p className="text-xs text-Gray-400 dark:text-Gray-500 max-w-[200px]">
              Admin có thể tạo bình chọn mới bằng nút bên dưới
            </p>
          </div>
        )}

        {isFetching && (
          <div className="absolute text-center top-1/2 -translate-y-1/2 z-999 left-0 right-0 m-auto">
            <LoadingIcon
              className={'inline w-10 h-10 me-3 text-Gray-200 animate-spin'}
              fillColor={'var(--color-primary-color)'}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PollsList;
