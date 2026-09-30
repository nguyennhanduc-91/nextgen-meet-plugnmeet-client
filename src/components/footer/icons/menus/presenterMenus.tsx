import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import FooterMenuItem from './menuItem';
import { store, useAppDispatch, useAppSelector } from '../../../../store';
import useSharedNotepad from './hooks/useSharedNotepad';
import useExternalMediaPlayer from './hooks/useExternalMediaPlayer';
import {
  updateShowLowerThirdModal,
} from '../../../../store/slices/roomSettingsSlice';
import {
  updateShowCTAModal,
  updateShowTeleprompter,
  updateShowTimer
} from '../../../../store/slices/bottomIconsActivitySlice';
import { addSpotlightUserId, removeSpotlightUserId } from '../../../../store/slices/roomSettingsSlice';
import { getNatsConn } from '../../../../helpers/nats';
import { DataMsgBodyType } from 'plugnmeet-protocol-js';

import { PlayerIconSVG } from '../../../../assets/Icons/PlayerIconSVG';
import { SharedNotepadIconSVG } from '../../../../assets/Icons/SharedNotepadIconSVG';
import { MegaphoneIconSVG } from '../../../../assets/Icons/MegaphoneIconSVG';
import { StarIconSVG } from '../../../../assets/Icons/StarIconSVG';

const PresenterMenus = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const currentUser = useAppSelector((state) => state.session.currentUser);
  const spotlightUserIds = useAppSelector((state) => state.roomSettings.spotlightUserIds);
  const isSpotlighted = useMemo(() => {
    return !!(currentUser?.userId && spotlightUserIds && spotlightUserIds.includes(currentUser.userId));
  }, [spotlightUserIds, currentUser?.userId]);

  const showTeleprompter = useAppSelector((state) => state.bottomIconsActivity.showTeleprompter);
  const showTimer = useAppSelector((state) => state.bottomIconsActivity.showTimer);
  const timerState = useAppSelector((state) => state.roomSettings.timer);

  const { roomFeatures } = useMemo(() => {
    return {
      roomFeatures: store.getState().session.currentRoom?.metadata?.roomFeatures,
    };
  }, []);

  const { toggleSharedNotepad, sharedNotepadStatus } = useSharedNotepad();
  const { toggleExternalMediaPlayer, isActiveExternalMediaPlayer } = useExternalMediaPlayer();

  const openCTAModal = useCallback(() => {
    dispatch(updateShowCTAModal(true));
  }, [dispatch]);

  const openLowerThirdModal = useCallback(() => {
    dispatch(updateShowLowerThirdModal(true));
  }, [dispatch]);

  const toggleTeleprompter = useCallback(() => {
    dispatch(updateShowTeleprompter(!showTeleprompter));
  }, [dispatch, showTeleprompter]);

  const toggleTimer = useCallback(() => {
    dispatch(updateShowTimer(!showTimer));
  }, [dispatch, showTimer]);

  const toggleSelfSpotlight = useCallback(() => {
    if (!currentUser?.userId) return;
    const action = isSpotlighted ? 'remove' : 'add';
    const payload = JSON.stringify({ type: 'GLOBAL_SPOTLIGHT', action, userId: currentUser.userId });
    
    getNatsConn()?.sendDataMessage(DataMsgBodyType.INFO, payload);
    
    if (action === 'add') {
      dispatch(addSpotlightUserId(currentUser.userId));
    } else {
      dispatch(removeSpotlightUserId(currentUser.userId));
    }
  }, [isSpotlighted, currentUser?.userId, dispatch]);

  return (
    <>
      <FooterMenuItem
        onClick={toggleSelfSpotlight}
        isActive={isSpotlighted}
        icon={<StarIconSVG classes="w-5 h-5 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />}
        text={isSpotlighted ? "Bỏ ghim tiêu điểm (Self-Spotlight)" : "Tự ghim tiêu điểm (Self-Spotlight)"}
        customColor={isSpotlighted ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20" : "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"}
      />
      <div className="h-px w-full bg-Gray-100 dark:bg-Gray-700 my-1"></div>

      <FooterMenuItem
        onClick={toggleTeleprompter}
        isActive={showTeleprompter}
        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        text={showTeleprompter ? "Tắt Máy nhắc chữ" : "Mở Máy nhắc chữ"}
        customColor="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
      />
      
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

      <div className="h-px w-full bg-Gray-100 dark:bg-Gray-700 my-1"></div>

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
    </>
  );
};

export default PresenterMenus;
