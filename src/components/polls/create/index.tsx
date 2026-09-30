import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import FormView from './formView';
import Modal from '../../../helpers/ui/modal';
import { PlusCircleIconSVG } from '../../../assets/Icons/PlusCircleIconSVG';

export interface CreatePollOptions {
  id: number;
  text: string;
}

const Create = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <>
      <Modal
        show={isOpen}
        onClose={() => setIsOpen(false)}
        title={t('polls.create')}
        maxWidth="max-w-xl"
        customBodyClass="rounded-b-xl"
      >
        <FormView setIsOpen={setIsOpen} />
      </Modal>
      <div className="button-wrap px-3 3xl:px-5 py-3 md:py-4 border-t border-Gray-200 dark:border-Gray-800 bg-Gray-25 dark:bg-dark-primary">
        <button
          onClick={() => setIsOpen(true)}
          className="primary-button h-10 3xl:h-11 cursor-pointer px-5 flex items-center justify-center gap-2 w-full rounded-[15px] text-sm 3xl:text-base font-medium 3xl:font-semibold text-white bg-gradient-to-r from-Blue to-Blue2-600 border border-Dark-blue transition-all duration-300 hover:from-Dark-blue hover:to-Blue2-700 shadow-button-shadow hover:shadow-lg active:scale-[0.98]"
        >
          <PlusCircleIconSVG />
          {t('polls.create')}
        </button>
      </div>
    </>
  );
};

export default Create;
