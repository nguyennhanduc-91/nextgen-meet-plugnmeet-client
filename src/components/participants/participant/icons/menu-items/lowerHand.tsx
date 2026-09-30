import React from 'react';
import { MenuItem } from '@headlessui/react';
import { useTranslation } from 'react-i18next';
import {
  NatsMsgClientToServerEvents,
  NatsMsgClientToServerSchema,
} from 'plugnmeet-protocol-js';
import { create } from '@bufbuild/protobuf';

import { useAppSelector } from '../../../../../store';
import { participantsSelector } from '../../../../../store/slices/participantSlice';
import { getNatsConn } from '../../../../../helpers/nats';
import { HandsIconSVG } from '../../../../../assets/Icons/HandsIconSVG';

interface ILowerHandMenuItemProps {
  userId: string;
}

const LowerHandMenuItem = ({ userId }: ILowerHandMenuItemProps) => {
  const raisedHand = useAppSelector(
    (state) =>
      participantsSelector.selectById(state, userId)?.metadata.raisedHand,
  );
  const { t } = useTranslation();
  const conn = getNatsConn();

  const lowerHand = async () => {
    const data = create(NatsMsgClientToServerSchema, {
      event: NatsMsgClientToServerEvents.REQ_LOWER_OTHER_USER_HAND,
      msg: userId,
    });
    conn.sendMessageToSystemWorker(data);
  };

  return (
    raisedHand && (
      <div className="" role="none">
        <MenuItem>
          {() => (
            <button
              className="flex items-center gap-3 min-h-8 cursor-pointer py-1.5 w-full text-sm text-left font-medium text-Gray-950 dark:text-white px-3 rounded-lg transition-all duration-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 group"
              onClick={lowerHand}
            >
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-Gray-500 dark:text-Gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors [&>svg]:w-full [&>svg]:h-full">
                <HandsIconSVG classes="" />
              </div>
              <span className="truncate">Hạ tay</span>
            </button>
          )}
        </MenuItem>
      </div>
    )
  );
};

export default LowerHandMenuItem;
