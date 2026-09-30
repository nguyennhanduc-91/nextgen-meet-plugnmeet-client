import React from 'react';
import { useTranslation } from 'react-i18next';
import { MenuItem } from '@headlessui/react';
import { toast } from 'react-toastify';
import {
  CommonResponseSchema,
  SwitchPresenterReqSchema,
  SwitchPresenterTask,
} from 'plugnmeet-protocol-js';
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';

import { useAppSelector } from '../../../../../store';
import { participantsSelector } from '../../../../../store/slices/participantSlice';
import sendAPIRequest from '../../../../../helpers/api/plugNmeetAPI';
import { TransferIconSVG } from '../../../../../assets/Icons/TransferIconSVG';

interface ISwitchPresenterMenuItemProps {
  userId: string;
}

const SwitchPresenterMenuItem = ({ userId }: ISwitchPresenterMenuItemProps) => {
  const isPresenter = useAppSelector(
    (state) =>
      participantsSelector.selectById(state, userId)?.metadata.isPresenter,
  );
  const { t } = useTranslation();

  const togglePresenterStatus = async () => {
    const body = create(SwitchPresenterReqSchema, {
      userId: userId,
      task: isPresenter
        ? SwitchPresenterTask.DEMOTE
        : SwitchPresenterTask.PROMOTE,
    });

    const r = await sendAPIRequest(
      'switchPresenter',
      toBinary(SwitchPresenterReqSchema, body),
      false,
      'application/protobuf',
      'arraybuffer',
    );
    const res = fromBinary(CommonResponseSchema, new Uint8Array(r));

    if (res.status) {
      toast(t('left-panel.menus.notice.presenter-changed'), {
        toastId: 'lock-setting-status',
        type: 'info',
      });
    } else {
      toast(t(res.msg), {
        toastId: 'lock-setting-status',
        type: 'error',
      });
    }
  };

  return (
    <MenuItem>
      {() => (
        <button
          className="flex items-center gap-3 min-h-8 cursor-pointer py-1.5 w-full text-sm text-left font-medium text-Gray-950 dark:text-white px-3 rounded-lg transition-all duration-300 hover:bg-primary-50 dark:hover:bg-primary-900/30 group"
          onClick={togglePresenterStatus}
        >
          <div className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-Gray-500 dark:text-Gray-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors [&>svg]:w-full [&>svg]:h-full">
            <TransferIconSVG />
          </div>
          <span className="truncate">
            {isPresenter ? 'Thu quyền Trình bày' : 'Cấp quyền Trình bày'}
          </span>
        </button>
      )}
    </MenuItem>
  );
};

export default SwitchPresenterMenuItem;
