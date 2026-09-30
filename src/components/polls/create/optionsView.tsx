import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';

import { TrashIconSVG } from '../../../assets/Icons/TrashIconSVG';
import { PlusCircleIconSVG } from '../../../assets/Icons/PlusCircleIconSVG';
import { CreatePollOptions } from './index';

interface OptionsProps {
  options: CreatePollOptions[];
  setOptions: Dispatch<SetStateAction<CreatePollOptions[]>>;
}

const OptionsView = ({ options, setOptions }: OptionsProps) => {
  const { t } = useTranslation();

  // update option text
  const onChange = useCallback(
    (index: number, e: ChangeEvent<HTMLInputElement>) => {
      const newOptions = options.map((option, i) =>
        i === index ? { ...option, text: e.target.value } : option,
      );
      setOptions(newOptions);
    },
    [options, setOptions],
  );

  const removeOption = useCallback(
    (idToRemove: number) => {
      // Prevent removing below 2 options
      if (options.length <= 2) return;
      setOptions(options.filter((option) => option.id !== idToRemove));
    },
    [options, setOptions],
  );

  const addOption = useCallback(() => {
    setOptions((prev) => [
      ...prev,
      {
        id: (prev[prev.length - 1]?.id ?? 0) + 1,
        text: '',
      },
    ]);
  }, [setOptions]);

  const canRemove = useMemo(() => options.length > 2, [options.length]);

  return (
    <div className="option-field-wrapper pt-6 pb-6">
      <p className="text-sm text-Gray-800 dark:text-white font-semibold mb-3 flex items-center gap-2">
        <span className="w-1.5 h-4 rounded-full bg-Blue-500"></span>
        {t('polls.options')}
      </p>
      <div className="overflow-auto h-full max-h-[345px] scrollBar scrollBar2 mb-5">
        <div className="option-field-inner grid gap-5">
          {options.map((elm, index) => (
            <div className="form-inline" key={elm.id}>
              <div className="input-wrapper w-full flex items-center gap-2">
                <input
                  type="text"
                  required={true}
                  name={`opt_${elm.id}`}
                  value={elm.text}
                  onChange={(e) => onChange(index, e)}
                  placeholder={t('polls.option', {
                    count: index + 1,
                  })}
                  className="default-input flex-1 dark:bg-dark-secondary dark:border-Gray-700 dark:text-white focus:ring-2 focus:ring-Blue/50 transition-all"
                  autoComplete="off"
                />
                {canRemove && (
                  <button
                    type="button"
                    title={t('polls.remove-option')}
                    className="h-10 md:h-11 w-10 md:w-11 bg-white dark:bg-[#1e293b] border border-Gray-200 dark:border-Gray-700 text-[#94a3b8] hover:text-[#ef4444] hover:border-[#fca5a5] dark:hover:border-[#7f1d1d]/50 hover:bg-[#fef2f2] dark:hover:bg-[#7f1d1d]/10 shadow-sm rounded-xl flex items-center justify-center cursor-pointer transition-all duration-200"
                    onClick={() => removeOption(elm.id)}
                  >
                    <TrashIconSVG />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <button
        className="w-full cursor-pointer h-10 3xl:h-11 text-sm 3xl:text-base font-semibold bg-white dark:bg-dark-secondary hover:bg-Gray-50 dark:hover:bg-dark-secondary3 text-Gray-700 dark:text-white rounded-xl flex justify-center items-center gap-2 transition-all duration-300 shadow-sm hover:shadow-md border border-Gray-200 dark:border-Gray-700 active:scale-[0.99]"
        type="button"
        onClick={addOption}
      >
        <span className="text-Blue-500"><PlusCircleIconSVG /></span>
        {t('polls.add-new-option')}
      </button>
    </div>
  );
};

export default OptionsView;
