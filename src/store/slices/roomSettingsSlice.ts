import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { VideoQuality } from 'livekit-client';
import { Theme } from '@excalidraw/excalidraw/element/types';

import {
  ColumnCameraPosition,
  ColumnCameraWidth,
  IMediaDevice,
  InitiatePrivateChat,
  IRoomSettings,
  UnreadMsgFromPayload,
  UserNotification,
  VideoObjectFit,
  IReplyingTo,
  ReceivedEmoji,
  IActiveCTA,
  ILowerThird,
  TimerState,
  ILowerThirdAutomation,
  ITimerAutomation,
} from './interfaces/roomSettings';
import { AzureTokenInfo } from '../../components/translation-transcription/helpers/apiConnections';
import { DB_STORE_NAMES, idbStore } from '../../helpers/libs/idb';

const initialState: IRoomSettings = {
  isShowRoomSettingsModal: false,
  isShowKeyboardShortcuts: false,
  isNatsServerConnected: false,

  audioDevices: [],
  videoDevices: [],
  selectedAudioDevice: '',
  selectedVideoDevice: '',
  playAudioNotification: false,
  activateWebcamsView: true,
  activeScreenSharingView: true,
  allowPlayAudioNotification: true,
  isHighFidelityAudio: (() => {
    try {
      const saved = localStorage.getItem('pnm_high_fidelity_audio');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  })(),
  roomAudioVolume: 1,
  roomScreenShareAudioVolume: 1,
  roomVideoQuality: VideoQuality.HIGH,
  theme: 'light',
  videoObjectFit: VideoObjectFit.CONTAIN,

  selectedTabLeftPanel: 0,
  selectedChatOption: 'public',
  initiatePrivateChat: {
    name: '',
    userId: '',
  },
  unreadMsgFrom: [],
  selectedChatTransLang: '',
  replyingTo: null,

  columnCameraWidth: ColumnCameraWidth.FULL_WIDTH,
  columnCameraPosition: ColumnCameraPosition.LEFT,
  visibleHeader: true,
  visibleFooter: true,
  isPNMWindowTabVisible: true,
  isWatermarkEnabled: false,
  isFocusModeEnabled: false,
  isHostOnlyChatEnabled: false,
  isRequireVideoEnabled: false,
  isLockReactionsEnabled: false,
  focusActiveSpeakerWebcam: true,
  userNotifications: [],
  isSidePanelOpened: false,
  hasWebcamPages: false,
  hideNonVideoParticipants: false,
  activeCTA: null,
  activeLowerThird: null,
  showLowerThirdModal: false,
  timer: {
    isActive: false,
    secondsRemaining: 0,
    duration: 0,
  },
};

const roomSettingsSlice = createSlice({
  name: 'room-settings',
  initialState,
  reducers: {
    updateShowRoomSettingsModal: (state, action: PayloadAction<boolean>) => {
      state.isShowRoomSettingsModal = action.payload;
    },
    updateShowKeyboardShortcutsModal: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.isShowKeyboardShortcuts = action.payload;
    },
    updateIsNatsServerConnected: (state, action: PayloadAction<boolean>) => {
      state.isNatsServerConnected = action.payload;
    },
    addAudioDevices: (state, action: PayloadAction<Array<IMediaDevice>>) => {
      state.audioDevices = action.payload;
    },
    addVideoDevices: (state, action: PayloadAction<Array<IMediaDevice>>) => {
      state.videoDevices = action.payload;
    },
    updateSelectedAudioDevice: (state, action: PayloadAction<string>) => {
      state.selectedAudioDevice = action.payload;
    },
    updateSelectedVideoDevice: (state, action: PayloadAction<string>) => {
      state.selectedVideoDevice = action.payload;
    },
    updatePlayAudioNotification: (state, action: PayloadAction<boolean>) => {
      state.playAudioNotification = action.payload;
    },
    updateActivateWebcamsView: (state, action: PayloadAction<boolean>) => {
      state.activateWebcamsView = action.payload;
    },
    updateActiveScreenSharingView: (state, action: PayloadAction<boolean>) => {
      state.activeScreenSharingView = action.payload;
    },
    updateAllowPlayAudioNotification: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.allowPlayAudioNotification = action.payload;
    },
    updateIsHighFidelityAudio: (state, action: PayloadAction<boolean>) => {
      state.isHighFidelityAudio = action.payload;
      try {
        localStorage.setItem('pnm_high_fidelity_audio', JSON.stringify(action.payload));
      } catch (e) {
        console.error('Failed to save high fidelity audio state', e);
      }
    },
    updateRoomAudioVolume: (state, action: PayloadAction<number>) => {
      state.roomAudioVolume = action.payload;
    },
    updateRoomScreenShareAudioVolume: (
      state,
      action: PayloadAction<number>,
    ) => {
      state.roomScreenShareAudioVolume = action.payload;
    },
    updateRoomVideoQuality: (state, action: PayloadAction<VideoQuality>) => {
      state.roomVideoQuality = action.payload;
    },
    updateTheme: (state, action: PayloadAction<string>) => {
      state.theme = action.payload as Theme;
    },
    updateVideoObjectFit: (state, action: PayloadAction<VideoObjectFit>) => {
      state.videoObjectFit = action.payload;
    },
    updateSelectedTabLeftPanel: (state, action: PayloadAction<number>) => {
      state.selectedTabLeftPanel = action.payload;
    },
    updateSelectedChatOption: (state, action: PayloadAction<string>) => {
      state.selectedChatOption = action.payload;
    },
    updateInitiatePrivateChat: (
      state,
      action: PayloadAction<InitiatePrivateChat>,
    ) => {
      state.initiatePrivateChat = action.payload;
    },
    updateUnreadMsgFrom: (
      state,
      action: PayloadAction<UnreadMsgFromPayload>,
    ) => {
      const tmp = [...state.unreadMsgFrom];
      if (action.payload.task === 'ADD') {
        const exist = tmp.filter((id) => id === action.payload.id);
        if (!exist.length) {
          tmp.push(action.payload.id);
          state.unreadMsgFrom = tmp;
        }
      } else if (action.payload.task === 'DEL') {
        state.unreadMsgFrom = tmp.filter((id) => id !== action.payload.id);
      }
    },
    updateColumnCameraWidth: (
      state,
      action: PayloadAction<ColumnCameraWidth>,
    ) => {
      state.columnCameraWidth = action.payload;
    },
    updateColumnCameraPosition: (
      state,
      action: PayloadAction<ColumnCameraPosition>,
    ) => {
      state.columnCameraPosition = action.payload;
    },
    toggleHeaderVisibility: (state) => {
      state.visibleHeader = !state.visibleHeader;
    },
    toggleFooterVisibility: (state) => {
      state.visibleFooter = !state.visibleFooter;
    },
    setUIVisibility: (state, action: PayloadAction<boolean>) => {
      state.visibleHeader = action.payload;
      state.visibleFooter = action.payload;
    },
    updateAzureTokenInfo: (state, action: PayloadAction<AzureTokenInfo>) => {
      state.azureTokenInfo = action.payload;
    },
    cleanAzureToken: (state) => {
      if (state.azureTokenInfo) {
        state.azureTokenInfo.token = '';
      }
    },
    updateIsPNMWindowTabVisible: (state, action: PayloadAction<boolean>) => {
      state.isPNMWindowTabVisible = action.payload;
    },
    togglePinCamUserId: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (!state.pinnedCamUserIds) {
        state.pinnedCamUserIds = [];
      }
      const index = state.pinnedCamUserIds.indexOf(id);
      if (index === -1) {
        state.pinnedCamUserIds.push(id);
      } else {
        state.pinnedCamUserIds.splice(index, 1);
      }
    },
    removePinCamUserId: (state, action: PayloadAction<string>) => {
      if (state.pinnedCamUserIds) {
        state.pinnedCamUserIds = state.pinnedCamUserIds.filter(i => i !== action.payload);
      }
    },
    addSpotlightUserId: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (!state.spotlightUserIds) {
        state.spotlightUserIds = [];
      }
      if (!state.spotlightUserIds.includes(id)) {
        state.spotlightUserIds.push(id);
      }
    },
    removeSpotlightUserId: (state, action: PayloadAction<string>) => {
      if (state.spotlightUserIds) {
        state.spotlightUserIds = state.spotlightUserIds.filter(i => i !== action.payload);
      }
    },
    setSpotlightUserIds: (state, action: PayloadAction<string[]>) => {
      state.spotlightUserIds = action.payload;
    },
    toggleIgnoreSpotlightLayout: (state) => {
      state.ignoreSpotlightLayout = !state.ignoreSpotlightLayout;
    },
    updateFocusActiveSpeakerWebcam: (state, action: PayloadAction<boolean>) => {
      state.focusActiveSpeakerWebcam = action.payload;
    },
    addSelfInsertedE2EESecretKey: (state, action: PayloadAction<string>) => {
      state.selfInsertedE2EESecretKey = action.payload;
    },
    addUserNotification: (state, action: PayloadAction<UserNotification>) => {
      if (!action.payload.created) {
        action.payload.created = Date.now();
      }
      state.userNotifications.push(action.payload);
      idbStore(
        DB_STORE_NAMES.USER_NOTIFICATIONS,
        action.payload.created.toString(),
        action.payload,
      ).then();
    },
    setAllUserNotifications: (
      state,
      action: PayloadAction<UserNotification[]>,
    ) => {
      state.userNotifications = action.payload;
    },
    updateIsSidePanelOpened: (state, action: PayloadAction<boolean>) => {
      state.isSidePanelOpened = action.payload;
    },
    updateSelectedChatTransLang: (state, action: PayloadAction<string>) => {
      state.selectedChatTransLang = action.payload;
    },
    setReplyingTo: (state, action: PayloadAction<IReplyingTo | null>) => {
      state.replyingTo = action.payload;
    },
    updateHasWebcamPages: (state, action: PayloadAction<boolean>) => {
      state.hasWebcamPages = action.payload;
    },
    updateMaxNumDisplayWebcams: (state, action: PayloadAction<number>) => {
      state.maxNumDisplayWebcams = action.payload;
    },
    addReceivedEmoji: (state, action: PayloadAction<ReceivedEmoji | null>) => {
      state.receivedEmoji = action.payload;
    },
    updateHideNonVideoParticipants: (state, action: PayloadAction<boolean>) => {
      state.hideNonVideoParticipants = action.payload;
    },
    updateIsWatermarkEnabled: (state, action: PayloadAction<boolean>) => {
      state.isWatermarkEnabled = action.payload;
    },
    updateIgnoreSpotlightLayout: (state, action: PayloadAction<boolean>) => {
      state.ignoreSpotlightLayout = action.payload;
    },
    updateActiveCTA: (state, action: PayloadAction<IActiveCTA | null>) => {
      state.activeCTA = action.payload;
    },
    updateIsFocusModeEnabled: (state, action: PayloadAction<boolean>) => {
      state.isFocusModeEnabled = action.payload;
    },
    updateIsHostOnlyChatEnabled: (state, action: PayloadAction<boolean>) => {
      state.isHostOnlyChatEnabled = action.payload;
    },
    updateIsRequireVideoEnabled: (state, action: PayloadAction<boolean>) => {
      state.isRequireVideoEnabled = action.payload;
    },
    updateIsLockReactionsEnabled: (state, action: PayloadAction<boolean>) => {
      state.isLockReactionsEnabled = action.payload;
    },
    updateActiveLowerThird: (state, action: PayloadAction<ILowerThird | null>) => {
      state.activeLowerThird = action.payload;
    },
    updateShowLowerThirdModal: (state, action: PayloadAction<boolean>) => {
      state.showLowerThirdModal = action.payload;
    },
    updateTimer: (state, action: PayloadAction<TimerState>) => {
      state.timer = action.payload;
    },
    updateLowerThirdAutomation: (
      state,
      action: PayloadAction<ILowerThirdAutomation | undefined>,
    ) => {
      state.lowerThirdAutomation = action.payload;
    },
    updateTimerAutomation: (
      state,
      action: PayloadAction<ITimerAutomation | undefined>,
    ) => {
      state.timerAutomation = action.payload;
    },
  },
});

export const {
  addAudioDevices,
  addVideoDevices,
  updateSelectedAudioDevice,
  updateSelectedVideoDevice,
  updatePlayAudioNotification,
  updateShowRoomSettingsModal,
  updateActivateWebcamsView,
  updateActiveScreenSharingView,
  updateAllowPlayAudioNotification,
  updateShowKeyboardShortcutsModal,
  updateRoomAudioVolume,
  updateRoomScreenShareAudioVolume,
  updateIsHighFidelityAudio,
  updateRoomVideoQuality,
  updateTheme,
  updateVideoObjectFit,
  updateSelectedTabLeftPanel,
  updateSelectedChatOption,
  updateInitiatePrivateChat,
  updateUnreadMsgFrom,
  updateColumnCameraWidth,
  updateColumnCameraPosition,
  toggleHeaderVisibility,
  toggleFooterVisibility,
  updateAzureTokenInfo,
  cleanAzureToken,
  updateIsNatsServerConnected,
  updateIsPNMWindowTabVisible,
  togglePinCamUserId,
  removePinCamUserId,
  addSpotlightUserId,
  removeSpotlightUserId,
  setSpotlightUserIds,
  toggleIgnoreSpotlightLayout,
  updateFocusActiveSpeakerWebcam,
  addSelfInsertedE2EESecretKey,
  addUserNotification,
  setAllUserNotifications,
  updateIsSidePanelOpened,
  updateSelectedChatTransLang,
  setReplyingTo,
  updateHasWebcamPages,
  updateMaxNumDisplayWebcams,
  addReceivedEmoji,
  setUIVisibility,
  updateHideNonVideoParticipants,
  updateIsWatermarkEnabled,
  updateIsFocusModeEnabled,
  updateIsHostOnlyChatEnabled,
  updateIsRequireVideoEnabled,
  updateIsLockReactionsEnabled,
  updateIgnoreSpotlightLayout,
  updateActiveCTA,
  updateActiveLowerThird,
  updateShowLowerThirdModal,
  updateTimer,
  updateLowerThirdAutomation,
  updateTimerAutomation,
} = roomSettingsSlice.actions;

export default roomSettingsSlice.reducer;
