import React from 'react';
import { useTranslation } from 'react-i18next';

import languages from '../../../helpers/languages';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
  updateAllowPlayAudioNotification,
  updateFocusActiveSpeakerWebcam,
  updateTheme,
  updateHideNonVideoParticipants,
} from '../../../store/slices/roomSettingsSlice';
import SettingsSwitch from '../../../helpers/ui/settingsSwitch';
import Dropdown from '../../../helpers/ui/dropdown';
import { LanguageIconSVG } from '../../../assets/Icons/LanguageIconSVG';
import { MoonIcon } from '../../../assets/Icons/MoonIcon';
import { FocusModeIconSVG } from '../../../assets/Icons/FocusModeIconSVG';
import { NotifyIconSVG } from '../../../assets/Icons/NotifyIconSVG';
import { CameraOff } from '../../../assets/Icons/CameraOff';
import { updateShowTeleprompter } from '../../../store/slices/bottomIconsActivitySlice';

const ApplicationSettings = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();

  const theme = useAppSelector((state) => state.roomSettings.theme);
  const focusActiveSpeakerWebcam = useAppSelector(
    (state) => state.roomSettings.focusActiveSpeakerWebcam,
  );
  const allowPlayAudioNotification = useAppSelector(
    (state) => state.roomSettings.allowPlayAudioNotification,
  );
  const hideNonVideoParticipants = useAppSelector(
    (state) => state.roomSettings.hideNonVideoParticipants,
  );

  const toggleTheme = () => {
    dispatch(updateTheme(theme === 'light' ? 'dark' : 'light'));
  };

  const toggleAudioNotification = () => {
    dispatch(updateAllowPlayAudioNotification(!allowPlayAudioNotification));
  };

  const currentUser = useAppSelector((state) => state.session.currentUser);
  const showTeleprompter = useAppSelector((state) => state.bottomIconsActivity.showTeleprompter);
  const roomMode = useAppSelector((state) => state.session.currentRoom.metadata?.roomFeatures?.roomMode);
  const isMeetingMode = roomMode === 'normal' || roomMode === undefined;
  const canUseTeleprompter = !!currentUser?.metadata?.isAdmin || !!currentUser?.metadata?.isPresenter || isMeetingMode;

  return (
    <div className="s">
      <Dropdown
        label={t('header.room-settings.language')}
        id="language"
        value={i18n.languages[0]}
        onChange={(e) => i18n.changeLanguage(e as string)}
        options={languages.map((l) => {
          return {
            value: l.code,
            text: l.text,
          };
        })}
        direction="horizontal"
        icon={<LanguageIconSVG classes="" />}
      />
      <SettingsSwitch
        label={t('header.room-settings.enable-dark-theme')}
        enabled={theme === 'dark'}
        onChange={toggleTheme}
        customCss="my-4"
        icon={<MoonIcon classes="" />}
      />
      <SettingsSwitch
        label={t('header.room-settings.focus-active-speaker-webcam')}
        enabled={!!focusActiveSpeakerWebcam}
        customCss="my-4"
        onChange={() =>
          dispatch(updateFocusActiveSpeakerWebcam(!focusActiveSpeakerWebcam))
        }
        icon={<FocusModeIconSVG classes="" />}
      />
      <SettingsSwitch
        label={t('header.room-settings.allow-audio-notification')}
        enabled={allowPlayAudioNotification}
        onChange={toggleAudioNotification}
        customCss="my-4"
        icon={<NotifyIconSVG classes="" />}
      />
      <SettingsSwitch
        label={t('header.room-settings.hide-non-video-participants', 'Ẩn người không bật Camera')}
        enabled={hideNonVideoParticipants}
        onChange={() => dispatch(updateHideNonVideoParticipants(!hideNonVideoParticipants))}
        customCss="my-4"
        icon={<CameraOff classes="w-5 h-5" />}
      />
      {canUseTeleprompter && (
        <SettingsSwitch
          label="Bật Máy nhắc chữ (Teleprompter)"
          enabled={showTeleprompter}
          onChange={() => dispatch(updateShowTeleprompter(!showTeleprompter))}
          customCss="my-4"
          icon={<svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        />
      )}
    </div>
  );
};

export default ApplicationSettings;
