import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import FooterMenuItem from './menuItem';
import { store, useAppDispatch, useAppSelector } from '../../../../store';
import useSharedNotepad from './hooks/useSharedNotepad';
import usePolls from './hooks/usePolls';
import useMuteAll from './hooks/useMuteAll';
import useExternalMediaPlayer from './hooks/useExternalMediaPlayer';
import useDisplayExternalLink from './hooks/useDisplayExternalLink';
import {
  updateShowLowerThirdModal,
} from '../../../../store/slices/roomSettingsSlice';
import { updateShowManageWaitingRoomModal, updateShowManageBreakoutRoomModal, updateDisplaySpeechSettingsModal, updateDisplayInsightsAISettingsModal, updateShowLockSettingsModal, updateShowCTAModal, updateShowRtmpModal, updateShowTimer } from '../../../../store/slices/bottomIconsActivitySlice';
import { RTMPIconSVG } from '../../../../assets/Icons/RTMPIconSVG';
import { PlayerIconSVG } from '../../../../assets/Icons/PlayerIconSVG';
import { ExternalPlayerIconSVG } from '../../../../assets/Icons/ExternalPlayerIconSVG';
import { SharedNotepadIconSVG } from '../../../../assets/Icons/SharedNotepadIconSVG';
import { SpeechIconSVG } from '../../../../assets/Icons/SpeechIconSVG';
import { PollsIconSVG } from '../../../../assets/Icons/PollsIconSVG';
import { BreakoutRoomIconSVG } from '../../../../assets/Icons/BreakoutRoomIconSVG';
import { RoomLockIconSVG } from '../../../../assets/Icons/RoomLockIconSVG';
import { AiIconSVG } from '../../../../assets/Icons/AiIconSVG';
import { MicrophoneOff } from '../../../../assets/Icons/MicrophoneOff';
import { WaitingRoomIconSVG } from '../../../../assets/Icons/WaitingRoomIconSVG';
import { MegaphoneIconSVG } from '../../../../assets/Icons/MegaphoneIconSVG';

const AdminMenus = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const isActiveRtmpBroadcasting = useAppSelector(
    (state) => state.session.isActiveRtmpBroadcasting,
  );
  
  const showTimer = useAppSelector((state) => state.bottomIconsActivity.showTimer);
  const timerState = useAppSelector((state) => state.roomSettings.timer);

  const isWaitingRoomActive = useAppSelector(
    (state) =>
      !!state.session.currentRoom?.metadata?.roomFeatures
        ?.waitingRoomFeatures?.isActive,
  );

  const { roomFeatures } = useMemo(() => {
    return {
      roomFeatures:
        store.getState().session.currentRoom?.metadata?.roomFeatures,
    };
  }, []);

  const { toggleSharedNotepad, sharedNotepadStatus } = useSharedNotepad();
  const { togglePolls, isActivePoll } = usePolls();
  const { muteAllUsers } = useMuteAll();
  const { toggleExternalMediaPlayer, isActiveExternalMediaPlayer } =
    useExternalMediaPlayer();
  const { toggleDisplayExternalLinkModal, isActiveDisplayExternalLink } =
    useDisplayExternalLink();

  const openLockSettingsModal = useCallback(() => {
    dispatch(updateShowLockSettingsModal(true));
  }, [dispatch]);

  const openRtmpModal = useCallback(() => {
    dispatch(updateShowRtmpModal(true));
  }, [dispatch]);

  const openManageWaitingRoomModal = useCallback(() => {
    dispatch(updateShowManageWaitingRoomModal(true));
  }, [dispatch]);

  const openSpeechServiceSettingsModal = useCallback(() => {
    dispatch(updateDisplaySpeechSettingsModal(true));
  }, [dispatch]);

  const openManageBreakoutRoomModal = useCallback(() => {
    dispatch(updateShowManageBreakoutRoomModal(true));
  }, [dispatch]);

  const openInsightsAISettingsModal = useCallback(() => {
    dispatch(updateDisplayInsightsAISettingsModal(true));
  }, [dispatch]);

  const openCTAModal = useCallback(() => {
    dispatch(updateShowCTAModal(true));
  }, [dispatch]);

  const toggleTimer = useCallback(() => {
    dispatch(updateShowTimer(!showTimer));
  }, [dispatch, showTimer]);

  const openLowerThirdModal = useCallback(() => {
    dispatch(updateShowLowerThirdModal(true));
  }, [dispatch]);

  return (
    <>
      {roomFeatures?.insightsFeatures?.isAllow &&
        roomFeatures?.insightsFeatures?.aiFeatures?.isAllow && (
          <FooterMenuItem
            onClick={openInsightsAISettingsModal}
            icon={<AiIconSVG classes="w-6" />}
            text={t('footer.menus.ai-settings')}
          />
        )}
      {roomFeatures?.allowRtmp && (
        <FooterMenuItem
          onClick={openRtmpModal}
          isActive={isActiveRtmpBroadcasting}
          icon={<RTMPIconSVG />}
          text={
            isActiveRtmpBroadcasting
              ? t('footer.icons.stop-rtmp-broadcasting')
              : t('footer.icons.start-rtmp-broadcasting')
          }
        />
      )}
      {roomFeatures?.insightsFeatures?.isAllow &&
        roomFeatures?.insightsFeatures?.transcriptionFeatures?.isAllow && (
          <FooterMenuItem
            onClick={openSpeechServiceSettingsModal}
            icon={<SpeechIconSVG classes="w-6" />}
            text={t('footer.menus.speech-to-text-settings')}
          />
        )}
      <div className="h-px w-full bg-Gray-100 dark:bg-Gray-700 my-1"></div>
      {roomFeatures?.pollsFeatures?.isAllow && (
        <FooterMenuItem
          onClick={togglePolls}
          isActive={isActivePoll}
          icon={<PollsIconSVG classes="" />}
          text={
            isActivePoll
              ? t('footer.menus.disable-polls')
              : t('footer.menus.enable-polls')
          }
        />
      )}
      {roomFeatures?.externalMediaPlayerFeatures?.isAllow && (
        <FooterMenuItem
          onClick={toggleExternalMediaPlayer}
          isActive={isActiveExternalMediaPlayer}
          icon={<PlayerIconSVG />}
          text={
            isActiveExternalMediaPlayer
              ? t('footer.menus.stop-external-media-player')
              : t('footer.menus.start-external-media-player')
          }
        />
      )}
      {roomFeatures?.displayExternalLinkFeatures?.isAllow && (
        <FooterMenuItem
          onClick={toggleDisplayExternalLinkModal}
          isActive={isActiveDisplayExternalLink}
          icon={<ExternalPlayerIconSVG />}
          text={
            isActiveDisplayExternalLink
              ? t('footer.menus.stop-display-external-link')
              : t('footer.menus.start-display-external-link')
          }
        />
      )}
      {roomFeatures?.sharedNotePadFeatures?.isAllow && (
        <FooterMenuItem
          onClick={toggleSharedNotepad}
          isActive={sharedNotepadStatus}
          icon={<SharedNotepadIconSVG classes="" />}
          text={
            sharedNotepadStatus
              ? t('footer.menus.disable-shared-notepad')
              : t('footer.menus.enable-shared-notepad')
          }
        />
      )}
      <div className="h-px w-full bg-Gray-100 dark:bg-Gray-700 my-1"></div>
      
      {/* Webinar Features */}
      <FooterMenuItem
        onClick={toggleTimer}
        isActive={showTimer || timerState?.isActive}
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        text={(showTimer || timerState?.isActive) ? "Đóng bảng Đồng hồ" : "Mở bảng Đồng hồ"}
        customColor="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      />
      <FooterMenuItem
        onClick={openCTAModal}
        icon={<MegaphoneIconSVG />}
        text="Gửi Thông báo & Hành động (CTA)"
        customColor="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
      />
      <FooterMenuItem
        onClick={openLowerThirdModal}
        icon={<i className="pnm-whiteboard text-xl" />}
        text="Tên chức danh (Lower Third)"
        customColor="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
      />

      <FooterMenuItem
        onClick={muteAllUsers}
        icon={<MicrophoneOff classes="" />}
        text={t('footer.menus.mute-all-users')}
        customColor="text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
      />
      <FooterMenuItem
        onClick={openLockSettingsModal}
        icon={<RoomLockIconSVG />}
        text={t('footer.menus.room-lock-settings')}
      />
      
      {/* Waiting Room: show manage button when active */}
      {isWaitingRoomActive && (
        <FooterMenuItem
          onClick={openManageWaitingRoomModal}
          isActive={true}
          icon={<WaitingRoomIconSVG classes="" />}
          text={t('footer.menus.manage-waiting-room')}
        />
      )}

      {roomFeatures?.breakoutRoomFeatures?.isAllow && (
        <FooterMenuItem
          onClick={openManageBreakoutRoomModal}
          icon={<BreakoutRoomIconSVG classes="w-6 h-auto" />}
          text={t('footer.menus.manage-breakout-room')}
        />
      )}
    </>
  );
};

export default AdminMenus;
