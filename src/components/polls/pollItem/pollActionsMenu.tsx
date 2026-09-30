import React, { Dispatch, SetStateAction, useState } from 'react';
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from '@headlessui/react';
import { useTranslation } from 'react-i18next';

import { FooterMenuIconSVG } from '../../../assets/Icons/FooterMenuIconSVG';
import { EyeIconSVG } from '../../../assets/Icons/EyeIconSVG';
import { StopCircleIconSVG } from '../../../assets/Icons/StopCircleIconSVG';
import { MegaphoneIconSVG } from '../../../assets/Icons/MegaphoneIconSVG';
import { TrashIconSVG } from '../../../assets/Icons/TrashIconSVG';
import { PollDataWithOption, publishPollResultByChat, deletePollLocally } from '../utils';
import { getNatsConn } from '../../../helpers/nats';
import { DataMsgBodyType } from 'plugnmeet-protocol-js';
import { useEndPoll } from '../hooks/useEndPoll';

interface PollActionsMenuProps {
  isRunning: boolean;
  setViewDetails: Dispatch<SetStateAction<boolean>>;
  pollDataWithOption: PollDataWithOption;
}

const PollActionsMenu = ({
  isRunning,
  setViewDetails,
  pollDataWithOption,
}: PollActionsMenuProps) => {
  const { t } = useTranslation();
  const { endPoll, isEndingPoll } = useEndPoll();
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = () => {
    setIsPublishing(true);
    publishPollResultByChat(pollDataWithOption).finally(() => {
      setIsPublishing(false);
    });
  };

  const handleEndPoll = () => {
    if (window.confirm(t('polls.confirm-end-poll') || 'Bạn chắc chắn muốn kết thúc bình chọn này?')) {
      endPoll(pollDataWithOption.pollId);
    }
  };

  const handleDelete = () => {
    if (window.confirm(t('polls.confirm-delete-poll') || 'Bạn có chắc chắn muốn xóa bình chọn này?')) {
      deletePollLocally(pollDataWithOption.pollId);
      const conn = getNatsConn();
      if (conn) {
        conn.sendDataMessage(
          DataMsgBodyType.INFO,
          JSON.stringify({ type: 'DELETE_POLL', pollId: pollDataWithOption.pollId })
        );
      }
    }
  };

  return (
    <Menu as="div">
      {({ open }) => (
        <>
          <MenuButton className="relative shrink-0 p-2 mr-2 cursor-pointer hover:bg-Gray-100 dark:hover:bg-Gray-700 rounded-lg transition-all duration-200">
            <div className="">
              <FooterMenuIconSVG />
            </div>
          </MenuButton>
          <Transition
            as="div"
            show={open}
            enter="transition duration-100 ease-out"
            enterFrom="transform scale-95 opacity-0"
            enterTo="transform scale-100 opacity-100"
            leave="transition duration-75 ease-out"
            leaveFrom="transform scale-100 opacity-100"
            leaveTo="transform scale-95 opacity-0"
          >
            <MenuItems
              static
              className="origin-top-right z-20 absolute ltr:right-0 rtl:-left-4 mt-2 w-[244px] shadow-dropdown-menu rounded-[15px] overflow-hidden border border-Gray-100 dark:border-Gray-700 bg-white dark:bg-dark-primary p-2 ring-0 focus:outline-hidden"
            >
              {/* View Details */}
              <MenuItem>
                <button
                  className="h-8 cursor-pointer w-full flex items-center hover:bg-Gray-50 dark:hover:bg-dark-secondary2 text-sm gap-2.5 leading-none font-medium text-Gray-950 dark:text-white px-2.5 3xl:px-3 rounded-lg transition-all duration-300 relative"
                  onClick={() => setViewDetails(true)}
                >
                  <span className="text-Blue2-500 flex-shrink-0"><EyeIconSVG /></span>
                  {t('polls.view-details')}
                </button>
              </MenuItem>

              <div className="divider h-px w-full bg-Gray-100 dark:bg-Gray-700 my-1"></div>

              {/* End Poll or Publish Result */}
              {isRunning ? (
                <MenuItem>
                  <button
                    onClick={handleEndPoll}
                    disabled={isEndingPoll}
                    className="h-8 cursor-pointer w-full flex items-center hover:bg-Red-50 dark:hover:bg-Red-900/20 text-sm gap-2.5 leading-none font-medium text-Red-600 px-2.5 3xl:px-3 rounded-lg transition-all duration-300 relative disabled:opacity-50 disabled:cursor-wait"
                  >
                    <span className="flex-shrink-0"><StopCircleIconSVG /></span>
                    {t('polls.end-poll')}
                  </button>
                </MenuItem>
              ) : (
                <MenuItem>
                  <button
                    className="h-8 cursor-pointer w-full flex items-center hover:bg-Green-50 dark:hover:bg-Green-900/20 text-sm gap-2.5 leading-none font-medium text-Green-600 dark:text-Green-400 px-2.5 3xl:px-3 rounded-lg transition-all duration-300 relative disabled:opacity-50 disabled:cursor-wait"
                    onClick={handlePublish}
                    disabled={isPublishing}
                  >
                    <span className="flex-shrink-0"><MegaphoneIconSVG /></span>
                    {t('polls.publish-result')}
                  </button>
                </MenuItem>
              )}

              <div className="divider h-px w-full bg-Gray-100 dark:bg-Gray-700 my-1"></div>

              {/* Delete Poll */}
              <MenuItem>
                <button
                  className="h-8 cursor-pointer w-full flex items-center hover:bg-Red-50 dark:hover:bg-Red-900/20 text-sm gap-2.5 leading-none font-medium text-Red-600 px-2.5 3xl:px-3 rounded-lg transition-all duration-300 relative"
                  onClick={handleDelete}
                >
                  <span className="flex-shrink-0"><TrashIconSVG /></span>
                  {t('polls.delete-poll')}
                </button>
              </MenuItem>
            </MenuItems>
          </Transition>
        </>
      )}
    </Menu>
  );
};

export default PollActionsMenu;
