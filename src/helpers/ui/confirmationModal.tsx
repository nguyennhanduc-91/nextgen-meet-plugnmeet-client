import React from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './modal';

interface IConfirmationModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  text: string;
  alternateBtnText?: string;
  onAlternateAction?: () => void;
}

const ConfirmationModal = ({
  show,
  onClose,
  onConfirm,
  title,
  text,
  alternateBtnText,
  onAlternateAction,
}: IConfirmationModalProps) => {
  const { t } = useTranslation();

  const renderButtons = () => (
    <div className="flex flex-col sm:flex-row items-center justify-end gap-2 w-full">
      {alternateBtnText && onAlternateAction && (
        <button
          type="button"
          className="h-10 px-4 flex-1 sm:flex-none flex items-center justify-center rounded-[15px] text-sm 3xl:text-base font-medium 3xl:font-semibold text-white bg-amber-500 border border-amber-600 transition-all duration-300 hover:bg-amber-600 shadow-button-shadow cursor-pointer"
          onClick={onAlternateAction}
        >
          {alternateBtnText}
        </button>
      )}
      <button
        className="h-10 px-5 flex-1 sm:flex-none flex items-center justify-center rounded-[15px] text-sm 3xl:text-base font-medium 3xl:font-semibold text-white bg-Red-400 border border-Red-600 transition-all duration-300 hover:bg-Red-600 shadow-button-shadow cursor-pointer"
        onClick={onConfirm}
      >
        {t('ok')}
      </button>
      <button
        type="button"
        className="primary-button h-10 px-5 flex-1 sm:flex-none flex items-center justify-center text-sm 3xl:text-base font-semibold bg-Blue hover:bg-white border border-Dark-blue rounded-[15px] text-white hover:text-Gray-950 transition-all duration-300 shadow-button-shadow cursor-pointer"
        onClick={onClose}
      >
        {t('close')}
      </button>
    </div>
  );

  return (
    <Modal
      show={show}
      onClose={onClose}
      title={title}
      renderButtons={renderButtons}
    >
      <p className="text-sm text-Gray-900 dark:text-white">{text}</p>
    </Modal>
  );
};

export default ConfirmationModal;
