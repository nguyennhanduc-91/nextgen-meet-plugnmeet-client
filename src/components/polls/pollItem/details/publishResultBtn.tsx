import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PollDataWithOption, publishPollResultByChat } from '../../utils';
import ActionButton from '../../../../helpers/ui/actionButton';
import { MegaphoneIconSVG } from '../../../../assets/Icons/MegaphoneIconSVG';

interface PublishResultBtnProps {
  pollDataWithOption: PollDataWithOption;
  onCloseViewDetails: () => void;
}

const PublishResultBtn = ({
  pollDataWithOption,
  onCloseViewDetails,
}: PublishResultBtnProps) => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const publishByChat = () => {
    setIsLoading(true);
    publishPollResultByChat(pollDataWithOption).finally(() =>
      onCloseViewDetails(),
    );
  };

  return (
    <ActionButton
      onClick={publishByChat}
      isLoading={isLoading}
      buttonType="button"
      custom="w-full sm:w-auto px-5 bg-Green-50 text-Green-700 hover:bg-Green-100 hover:text-Green-800 border-Green-200 flex items-center justify-center gap-2 whitespace-nowrap"
    >
      <MegaphoneIconSVG />
      {t('polls.publish-result')}
    </ActionButton>
  );
};
export default PublishResultBtn;
