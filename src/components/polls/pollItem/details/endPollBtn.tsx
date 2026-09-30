import React from 'react';
import { useTranslation } from 'react-i18next';

import { useEndPoll } from '../../hooks/useEndPoll';
import ActionButton from '../../../../helpers/ui/actionButton';
import { StopCircleIconSVG } from '../../../../assets/Icons/StopCircleIconSVG';

interface EndPollBtnProps {
  pollId: string;
}

const EndPollBtn = ({ pollId }: EndPollBtnProps) => {
  const { t } = useTranslation();
  const { endPoll, isEndingPoll } = useEndPoll();

  const handleEndPoll = () => {
    if (window.confirm(t('polls.confirm-end-poll') || 'Bạn chắc chắn muốn kết thúc bình chọn này?')) {
      endPoll(pollId);
    }
  };

  return (
    <ActionButton
      onClick={handleEndPoll}
      isLoading={isEndingPoll}
      buttonType="button"
      custom="w-full sm:w-auto px-5 !text-white bg-Red-500 !border-Red-600 hover:!bg-Red-600 flex items-center justify-center gap-2 whitespace-nowrap"
    >
      <StopCircleIconSVG />
      {t('polls.end-poll')}
    </ActionButton>
  );
};

export default EndPollBtn;
