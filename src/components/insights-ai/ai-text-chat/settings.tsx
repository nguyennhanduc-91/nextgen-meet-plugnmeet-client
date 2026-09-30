import React, { useCallback, useState, useEffect } from 'react';
import { create, fromBinary, toBinary } from '@bufbuild/protobuf';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import {
  CommonResponseSchema,
  InsightsAITextChatConfigReqSchema,
} from 'plugnmeet-protocol-js';

import { useAppSelector } from '../../../store';
import SettingsSwitch from '../../../helpers/ui/settingsSwitch';
import UsersSelector from './usersSelector';
import sendAPIRequest from '../../../helpers/api/plugNmeetAPI';

interface AiTextChatSettingsProps {
  setErrorMsg: React.Dispatch<React.SetStateAction<string | undefined>>;
  closeModal: () => void;
}

const AiTextChatSettings = ({
  setErrorMsg,
  closeModal,
}: AiTextChatSettingsProps) => {
  const { t } = useTranslation();
  const aiTextChatFeatures = useAppSelector(
    (state) =>
      state.session.currentRoom.metadata?.roomFeatures?.insightsFeatures
        ?.aiFeatures?.aiTextChatFeatures,
  );

  const [isEnabled, setIsEnabled] = useState(!!aiTextChatFeatures?.isEnabled);
  const [isAllowedEveryone, setIsAllowedEveryone] = useState(
    !!aiTextChatFeatures?.isAllowedEveryone,
  );
  const [isReasoningEnabled, setIsReasoningEnabled] = useState(
    !(aiTextChatFeatures?.allowedUserIds || []).includes('__DISABLE_REASONING__')
  );
  const [allowedUsers, setAllowedUsers] = useState<string[]>(
    (aiTextChatFeatures?.allowedUserIds ?? []).filter((u) => u !== '__DISABLE_REASONING__' && u !== '__ENABLE_REASONING__'),
  );

  useEffect(() => {
    if (aiTextChatFeatures) {
      console.log("Redux aiTextChatFeatures updated:", aiTextChatFeatures);
      setIsEnabled(!!aiTextChatFeatures.isEnabled);
      setIsAllowedEveryone(!!aiTextChatFeatures.isAllowedEveryone);
      setIsReasoningEnabled(!(aiTextChatFeatures.allowedUserIds || []).includes('__DISABLE_REASONING__'));
      setAllowedUsers((aiTextChatFeatures.allowedUserIds ?? []).filter((u) => u !== '__DISABLE_REASONING__' && u !== '__ENABLE_REASONING__'));
    }
  }, [aiTextChatFeatures]);

  const enableOrUpdateService = useCallback(async () => {
    // Filter out our special reasoning flags before checking length
    const actualUsers = allowedUsers.filter((u) => u !== '__DISABLE_REASONING__' && u !== '__ENABLE_REASONING__');
    if (!isAllowedEveryone && actualUsers.length == 0) {
      setErrorMsg(t('insights.ai-text-chat.users-required'));
      return;
    }
    setErrorMsg(undefined);

    const finalAllowedUsers = [...actualUsers];
    if (!isReasoningEnabled) {
      finalAllowedUsers.push('__DISABLE_REASONING__');
    } else if (finalAllowedUsers.length === 0) {
      finalAllowedUsers.push('__ENABLE_REASONING__');
    }

    // WORKAROUND: If isAllowedEveryone is true, the backend MIGHT completely ignore
    // the allowedUserIds array, leaving the old __DISABLE_REASONING__ flag stuck in the DB forever.
    // To force the backend to overwrite it, we first send a request with isAllowedEveryone = false.
    if (isAllowedEveryone) {
      const dummyBody = create(InsightsAITextChatConfigReqSchema, {
        isEnabled: isEnabled,
        isAllowedEveryone: false,
        allowedUserIds: finalAllowedUsers, // Forces backend to write this array!
      });
      await sendAPIRequest(
        'insights/ai/textChat/configure',
        toBinary(InsightsAITextChatConfigReqSchema, dummyBody),
        false,
        'application/protobuf',
        'arraybuffer',
      );
    }

    // Now send the actual desired state
    const body = create(InsightsAITextChatConfigReqSchema, {
      isEnabled: isEnabled,
      isAllowedEveryone,
      allowedUserIds: finalAllowedUsers,
    });

    const r = await sendAPIRequest(
      'insights/ai/textChat/configure',
      toBinary(InsightsAITextChatConfigReqSchema, body),
      false,
      'application/protobuf',
      'arraybuffer',
    );

    const res = fromBinary(CommonResponseSchema, new Uint8Array(r));
    if (!res.status) {
      setErrorMsg(t(res.msg));
      return;
    }

    toast(t('insights.service-started-successfully'), {
      type: 'info',
    });
    closeModal();
  }, [t, setErrorMsg, closeModal, isEnabled, isAllowedEveryone, allowedUsers, isReasoningEnabled]);

  const stopService = useCallback(async () => {
    const r = await sendAPIRequest(
      'insights/ai/textChat/end',
      [],
      false,
      'application/protobuf',
      'arraybuffer',
    );

    const res = fromBinary(CommonResponseSchema, new Uint8Array(r));
    if (!res.status) {
      setErrorMsg(t(res.msg));
      return;
    }

    toast(t('insights.service-stopped-successfully'), {
      type: 'info',
    });
    closeModal();
  }, [t, setErrorMsg, closeModal]);

  return (
    <>
      <div className="p-4 bg-Gray-2">
        <div className="main-wrap -my-4">
          <div className="grid">
            <div className="bg-Gray-25 dark:bg-dark-primary border-y border-dotted border-Gray-100 dark:border-Gray-800 -mx-4 px-4 py-4">
              <SettingsSwitch
                label="Kích hoạt Trợ lý AI Thông minh"
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                }
                enabled={isEnabled}
                onChange={setIsEnabled}
                customCss="shadow-Icon-box h-11 border border-Gray-100 dark:border-Gray-800 rounded-2xl px-4 bg-white dark:bg-dark-primary"
              />
              <p className="text-xs text-Gray-500 dark:text-Gray-400 mt-2 ml-10">Khởi động AI để hỗ trợ giải đáp thắc mắc và dịch thuật trong cuộc họp.</p>
            </div>
            {isEnabled && (
              <>
                <div className="bg-Gray-25 dark:bg-dark-primary border-y border-dotted border-Gray-100 dark:border-Gray-800 -mx-4 px-4 py-4">
                  <SettingsSwitch
                    label="Cấp quyền cho tất cả thành viên"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    }
                    enabled={isAllowedEveryone}
                    onChange={setIsAllowedEveryone}
                    customCss="shadow-Icon-box h-11 border border-Gray-100 dark:border-Gray-800 rounded-2xl px-4 bg-white dark:bg-dark-primary"
                  />
                  <p className="text-xs text-Gray-500 dark:text-Gray-400 mt-2 ml-10">Cho phép tất cả mọi người trong phòng được nhắn tin trò chuyện với AI.</p>
                </div>
                
                <div className="bg-Gray-25 dark:bg-dark-primary border-y border-dotted border-Gray-100 dark:border-Gray-800 -mx-4 px-4 py-4">
                  <SettingsSwitch
                    label="Chế độ Suy luận sâu (Deep Thinking)"
                    icon={
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
                    }
                    enabled={isReasoningEnabled}
                    onChange={setIsReasoningEnabled}
                    customCss="shadow-Icon-box h-11 border border-Gray-100 dark:border-Gray-800 rounded-2xl px-4 bg-white dark:bg-dark-primary"
                  />
                  <p className="text-xs text-Gray-500 dark:text-Gray-400 mt-2 ml-10">
                    {isReasoningEnabled ? 'Đang bật: AI sẽ suy luận cẩn thận trước khi trả lời (Chính xác cao).' : 'Đang tắt: AI sẽ phản xạ trả lời ngay lập tức (Tốc độ siêu tốc).'}
                  </p>
                </div>
                {!isAllowedEveryone && (
                  <div className="bg-Gray-25 dark:bg-dark-primary border-y border-dotted border-Gray-100 dark:border-Gray-800 -mx-4 px-4 py-4">
                    <UsersSelector
                      selectedUsers={allowedUsers}
                      setSelectedUsers={setAllowedUsers}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 border-t border-Gray-100 dark:border-Gray-800 flex justify-end items-center gap-4 rounded-b-xl">
        {!aiTextChatFeatures?.isEnabled && (
          <button
            className="primary-button h-10 px-8 w-auto cursor-pointer text-sm 3xl:text-base font-semibold bg-Blue hover:bg-white border border-[#4338ca] rounded-[15px] text-white hover:text-Gray-950 transition-all duration-300 shadow-button-shadow"
            onClick={() => enableOrUpdateService()}
          >
            Bắt đầu dịch vụ
          </button>
        )}
        {aiTextChatFeatures?.isEnabled && (
          <>
            <button
              className="secondary-button h-10 px-8 w-auto cursor-pointer text-sm 3xl:text-base font-semibold bg-white hover:bg-Red-600 border border-Gray-300 rounded-[15px] text-Gray-950 hover:text-white transition-all duration-300 shadow-button-shadow"
              onClick={() => stopService()}
            >
              Tạm ngưng AI
            </button>
            <button
              className="primary-button h-10 px-8 w-auto cursor-pointer text-sm 3xl:text-base font-semibold bg-Blue hover:bg-white border border-[#4338ca] rounded-[15px] text-white hover:text-Gray-950 transition-all duration-300 shadow-button-shadow"
              onClick={() => enableOrUpdateService()}
            >
              Lưu cấu hình
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default AiTextChatSettings;
