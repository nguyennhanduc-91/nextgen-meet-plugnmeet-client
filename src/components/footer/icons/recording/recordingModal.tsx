import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CloudRecordingVariants,
  RecordingFeatures,
} from 'plugnmeet-protocol-js';
import clsx from 'clsx';

import { RecordingType, SelectedRecordingType } from './IRecording';
import { store } from '../../../../store';
import Modal from '../../../../helpers/ui/modal';
import ActionButton from '../../../../helpers/ui/actionButton';
import { SelectedIcon } from '../../../../assets/Icons/SelectedIcon';

interface IRecordingModalProps {
  showModal: boolean;
  recordingFeatures?: RecordingFeatures;
  onCloseModal(selected: SelectedRecordingType): void;
}

const RecordingModal = ({
  showModal,
  recordingFeatures,
  onCloseModal,
}: IRecordingModalProps) => {
  const [recordingType, setRecordingType] = useState<
    SelectedRecordingType | undefined
  >(undefined);
  const { t } = useTranslation();
  const isCloud = store.getState().session.isCloud;
  const e2eeFeatures =
    store.getState().session.currentRoom?.metadata?.roomFeatures
      ?.endToEndEncryptionFeatures;

  const startRecording = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (recordingType) {
        onCloseModal(recordingType);
      }
    },
    [recordingType, onCloseModal],
  );

  const closeModal = () => {
    onCloseModal({
      type: RecordingType.RECORDING_TYPE_NONE,
    });
  };

  const recordingOptions = useMemo(() => {
    const options: any[] = [];
    if (recordingFeatures?.isAllowCloud) {
      options.push({
        id: 'full-screen',
        value: CloudRecordingVariants.FULL_SCREEN_CLOUD_RECORDING,
        label: t('footer.icons.cloud-recording'),
        type: RecordingType.RECORDING_TYPE_CLOUD,
        icon: <i className="pnm-broadcasting text-3xl" />,
        description: t('footer.icons.recording-types-cloud-des', 'Lưu trên hệ thống, xem lại mọi lúc mọi nơi'),
        disabled: !!e2eeFeatures?.enabledSelfInsertEncryptionKey,
        error: e2eeFeatures?.enabledSelfInsertEncryptionKey
          ? t('notifications.cloud-recording-not-supported-self-key')
          : undefined,
      });

      if (isCloud) {
        options.push({
          id: 'media-only',
          value: CloudRecordingVariants.MEDIA_ONLY_CLOUD_RECORDING,
          label: t('footer.icons.cloud-media-only-recording'),
          type: RecordingType.RECORDING_TYPE_CLOUD,
          icon: <i className="pnm-audio text-3xl" />,
          description: t('footer.icons.recording-types-media-des', 'Chỉ lưu âm thanh và video webcam'),
          disabled: !!e2eeFeatures?.isEnabled,
          error: e2eeFeatures?.isEnabled
            ? t('notifications.media-only-recording-not-support-e2ee')
            : undefined,
        });
      }
    }

    if (recordingFeatures?.isAllowLocal) {
      options.push({
        id: 'local',
        value: RecordingType.RECORDING_TYPE_LOCAL,
        label: t('footer.icons.local-recording'),
        type: RecordingType.RECORDING_TYPE_LOCAL,
        icon: <i className="pnm-display text-3xl" />,
        description: t('footer.icons.recording-types-local-des', 'Lưu trực tiếp về máy tính của bạn'),
      });
    }

    return options;
  }, [recordingFeatures, isCloud, e2eeFeatures, t]);

  const handleSelect = (option: any) => {
    if (option.disabled) return;
    if (option.type === RecordingType.RECORDING_TYPE_LOCAL) {
      setRecordingType({ type: RecordingType.RECORDING_TYPE_LOCAL });
    } else {
      setRecordingType({
        type: RecordingType.RECORDING_TYPE_CLOUD,
        variant: option.value,
      });
    }
  };

  const isSelected = (option: any) => {
    if (option.type === RecordingType.RECORDING_TYPE_LOCAL) {
      return recordingType?.type === RecordingType.RECORDING_TYPE_LOCAL;
    }
    return recordingType?.variant === option.value;
  };

  return (
    <Modal
      show={showModal}
      onClose={closeModal}
      title={t('footer.icons.how-to-record')}
      renderButtons={() => (
        <ActionButton
          buttonType="submit"
          onClick={(e) => startRecording(e as any)}
          disabled={!recordingType}
        >
          {t('footer.icons.start-recording')}
        </ActionButton>
      )}
    >
      <form
        className="RecorderPop space-y-4"
        action="#"
        method="POST"
        onSubmit={(e) => startRecording(e)}
      >
        <p className="text-sm text-Gray-600 dark:text-Gray-400 mb-4 italic">
          {t('footer.icons.recording-types-des')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recordingOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => handleSelect(option)}
              className={clsx(
                'relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer group',
                isSelected(option)
                  ? 'border-Blue dark:border-secondary-color bg-Blue/5 dark:bg-secondary-color/10 shadow-lg'
                  : 'border-Gray-100 dark:border-Gray-800 bg-white dark:bg-Gray-900 hover:border-Blue/40 dark:hover:border-secondary-color/40 shadow-sm',
                option.disabled && 'opacity-50 cursor-not-allowed grayscale'
              )}
            >
              <div
                className={clsx(
                  'mb-3 p-3 rounded-full transition-colors duration-300',
                  isSelected(option)
                    ? 'bg-Blue text-white'
                    : 'bg-Gray-50 dark:bg-Gray-800 text-Gray-600 dark:text-Gray-400 group-hover:bg-Blue/10 group-hover:text-Blue'
                )}
              >
                {option.icon}
              </div>

              <h4 className={clsx(
                'text-sm font-bold text-center mb-1',
                isSelected(option) ? 'text-Blue dark:text-secondary-color' : 'text-Gray-950 dark:text-white'
              )}>
                {option.label}
              </h4>

              <p className="text-[11px] leading-tight text-Gray-500 dark:text-Gray-400 text-center">
                {option.description}
              </p>

              {option.error && (
                <p className="text-[10px] text-Red-400 mt-2 text-center">
                  {option.error}
                </p>
              )}

              {isSelected(option) && (
                <div className="absolute top-2 right-2 text-Blue dark:text-secondary-color scale-110">
                  <SelectedIcon />
                </div>
              )}
            </div>
          ))}
        </div>
      </form>
    </Modal>
  );
};

export default RecordingModal;

