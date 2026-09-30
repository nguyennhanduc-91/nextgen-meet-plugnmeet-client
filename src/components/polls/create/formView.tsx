import React, {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { create } from '@bufbuild/protobuf';
import { CreatePollReqSchema } from 'plugnmeet-protocol-js';

import { useCreatePollMutation } from '../../../store/services/pollsApi';
import { CreatePollOptions } from './index';
import OptionsView from './optionsView';
import { addUserNotification } from '../../../store/slices/roomSettingsSlice';
import { useAppDispatch } from '../../../store';
import { LoadingIcon } from '../../../assets/Icons/Loading';
import { QuestionMarkIconSVG } from '../../../assets/Icons/QuestionMarkIconSVG';
import { PlusCircleIconSVG } from '../../../assets/Icons/PlusCircleIconSVG';
import { TimerIconSVG } from '../../../assets/Icons/TimerIconSVG';

interface FormViewProps {
  setIsOpen: Dispatch<SetStateAction<boolean>>;
}

const FormView = ({ setIsOpen }: FormViewProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [question, setQuestion] = useState<string>('');
  const [timerMinutes, setTimerMinutes] = useState<number>(0);
  const [createPoll, { isLoading, data }] = useCreatePollMutation();

  const [options, setOptions] = useState<CreatePollOptions[]>([
    {
      id: 1,
      text: '',
    },
    {
      id: 2,
      text: '',
    },
  ]);

  useEffect(() => {
    if (data) {
      if (data.status) {
        // On success
        dispatch(
          addUserNotification({
            message: t('polls.created-successfully'),
            typeOption: 'info',
          }),
        );
        // Save timer deadline if set
        if (timerMinutes > 0 && data.pollId) {
          const deadline = Date.now() + timerMinutes * 60 * 1000;
          localStorage.setItem(`poll_timer_${data.pollId}`, deadline.toString());
        }
        setIsOpen(false);
      } else {
        // On failure
        dispatch(
          addUserNotification({
            message: t(data.msg),
            typeOption: 'error',
          }),
        );
      }
    }
  }, [data, dispatch, setIsOpen, t]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isLoading) {
      return;
    }

    // Prevent submission if any option is empty
    if (options.some((opt) => opt.text.trim() === '')) {
      dispatch(
        addUserNotification({
          message: t('polls.fill-all-options'),
          typeOption: 'error',
        }),
      );
      return;
    }

    const deadline = timerMinutes > 0 ? Date.now() + timerMinutes * 60 * 1000 : 0;
    const finalQuestion = deadline > 0 ? `[T:${deadline}]${question}` : question;

    const body = create(CreatePollReqSchema, {
      question: finalQuestion,
      options,
    });
    createPoll(body);
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="question-area border-b border-Gray-100 dark:border-Gray-800 pb-5">
        <label className="text-sm text-Gray-800 dark:text-white font-semibold mb-2.5 flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-Blue-50 dark:bg-Blue-900/20 text-Blue-500">
            <QuestionMarkIconSVG />
          </span>
          {t('polls.enter-question')}
        </label>
        <input
          type="text"
          name="question"
          value={question}
          required={true}
          onChange={(e) => setQuestion(e.currentTarget.value)}
          placeholder={t('polls.question') || 'Câu hỏi'}
          className="default-input dark:bg-dark-secondary dark:border-Gray-700 dark:text-white focus:ring-2 focus:ring-Blue/50 transition-all"
          autoComplete="off"
        />
      </div>
      

      {/* Timer Section - Optimized for Dark Mode */}
      <div className="timer-area py-5 border-b border-Gray-100 dark:border-Gray-800">
        <label className="text-sm text-Gray-800 dark:text-white font-semibold mb-2.5 flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-[#fff7ed] dark:bg-[#7c2d12]/20 text-[#f97316]">
            <TimerIconSVG classes="w-4 h-4" />
          </span>
          {t('polls.timer-label')}
        </label>
        <div className="relative mt-2">
          <select
            value={timerMinutes}
            onChange={(e) => setTimerMinutes(Number(e.target.value))}
            className="default-input w-full cursor-pointer dark:bg-dark-secondary dark:border-Gray-700 dark:text-white pr-10 appearance-none focus:ring-2 focus:ring-Blue/50 transition-all"
          >
            <option value={0} className="dark:bg-dark-secondary2">{t('polls.timer-none')}</option>
            <option value={1} className="dark:bg-dark-secondary2">1 phút</option>
            <option value={2} className="dark:bg-dark-secondary2">2 phút</option>
            <option value={3} className="dark:bg-dark-secondary2">3 phút</option>
            <option value={5} className="dark:bg-dark-secondary2">5 phút</option>
            <option value={10} className="dark:bg-dark-secondary2">10 phút</option>
            <option value={15} className="dark:bg-dark-secondary2">15 phút</option>
            <option value={30} className="dark:bg-dark-secondary2">30 phút</option>
            <option value={60} className="dark:bg-dark-secondary2">60 phút</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-Gray-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
        {timerMinutes > 0 && (
          <p className="text-xs text-[#ea580c] dark:text-[#fb923c] font-medium mt-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
            <span className="flex h-1.5 w-1.5 rounded-full bg-[#f97316] animate-pulse"></span>
            Bình chọn sẽ tự động kết thúc sau {timerMinutes} phút
          </p>
        )}
      </div>

      <OptionsView options={options} setOptions={setOptions} />
      {isLoading && (
        <div className="absolute text-center top-1/2 -translate-y-1/2 z-999 left-0 right-0 m-auto">
          <LoadingIcon
            className={'inline w-10 h-10 me-3 text-Gray-200 animate-spin'}
            fillColor={'var(--color-primary-color)'}
          />
        </div>
      )}
      <div className="button-section flex items-center gap-2 md:gap-5 pt-4 border-t border-Gray-100 dark:border-Gray-800">
        <button
          className="secondary-button w-full cursor-pointer h-10 3xl:h-11 text-sm 3xl:text-base font-semibold bg-Gray-25 dark:bg-dark-secondary2 hover:bg-Gray-100 dark:hover:bg-dark-secondary3 text-Gray-700 dark:text-Gray-300 border border-Gray-300 dark:border-Gray-600 rounded-[15px] flex justify-center items-center gap-2 transition-all duration-300 shadow-button-shadow dark:shadow-none"
          type="button"
          onClick={() => setIsOpen(false)}
        >
          {t('close')}
        </button>
        <button
          className="primary-button w-full cursor-pointer h-10 3xl:h-11 text-sm 3xl:text-base font-semibold bg-gradient-to-r from-Blue to-Blue2-600 hover:from-Dark-blue hover:to-Blue2-700 border border-[#4338ca] rounded-[15px] text-white transition-all duration-300 shadow-button-shadow hover:shadow-lg active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          type="submit"
          disabled={isLoading}
        >
          <PlusCircleIconSVG />
          {t('polls.create-poll')}
        </button>
      </div>
    </form>
  );
};

export default FormView;
