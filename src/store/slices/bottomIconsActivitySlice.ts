import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  DeviceOrientation,
  IBottomIconsSlice,
  SidePanelType,
} from './interfaces/bottomIcons';
import { BackgroundConfig } from '../../helpers/libs/TrackProcessor';

const initialState: IBottomIconsSlice = {
  isActiveMicrophone: false,
  isActiveWebcam: false,
  isActiveRaisehand: false,
  isActiveRecording: false,
  isActiveScreenshare: false,
  isActiveSharedNotePad: false,
  isActiveWhiteboard: false,
  isActiveInsightsAiTextChat: false,
  isActivePiPWebcams: false,

  activeSidePanel: 'PARTICIPANTS',

  isMicMuted: false,
  screenWidth: 1024,
  screenHeight: 500,
  deviceOrientation: 'portrait',

  showMicrophoneModal: false,
  showVideoShareModal: false,
  showLockSettingsModal: false,
  showRtmpModal: false,
  showExternalMediaPlayerModal: false,
  showManageWaitingRoomModal: false,
  showManageBreakoutRoomModal: false,
  showDisplayExternalLinkModal: false,
  showSpeechSettingsModal: false,
  showSpeechSettingOptionsModal: false,
  showInsightsAISettingsModal: false,
  showCTAModal: false,
  showTeleprompter: false,
  showTimer: false,

  totalUnreadChatMsgs: 0,
  virtualBackground: (() => {
    try {
      const saved = localStorage.getItem('pnm_virtual_background');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load virtual background state', e);
    }
    return { type: 'none' };
  })(),
  isEnabledExtendedVerticalCamView: false,
  isChatPopout: false,
  isParticipantsPopout: false,
  isPollsPopout: false,
  isQAPopout: false,
};

const bottomIconsSlice = createSlice({
  name: 'bottomIconsActivity',
  initialState,
  reducers: {
    setIsChatPopout: (state, action: PayloadAction<boolean>) => {
      state.isChatPopout = action.payload;
    },
    setIsParticipantsPopout: (state, action: PayloadAction<boolean>) => {
      state.isParticipantsPopout = action.payload;
    },
    setIsPollsPopout: (state, action: PayloadAction<boolean>) => {
      state.isPollsPopout = action.payload;
    },
    setIsQAPopout: (state, action: PayloadAction<boolean>) => {
      state.isQAPopout = action.payload;
    },
    setActiveSidePanel: (state, action: PayloadAction<SidePanelType>) => {
      // If the payload is the same as the current active panel, it means we're toggling it off.
      if (state.activeSidePanel === action.payload) {
        state.activeSidePanel = null;
      } else {
        // Prevent opening side panel if it's currently popped out
        if (action.payload === 'CHAT' && state.isChatPopout) return;
        if (action.payload === 'PARTICIPANTS' && state.isParticipantsPopout) return;
        if (action.payload === 'POLLS' && state.isPollsPopout) return;
        if (action.payload === 'QA' && state.isQAPopout) return;
        
        state.activeSidePanel = action.payload;
      }

      // Handle side effects, like clearing unread messages, in one place.
      if (state.activeSidePanel === 'CHAT' || state.isChatPopout) {
        state.totalUnreadChatMsgs = 0;
      }
    },
    updateIsActiveMicrophone: (state, action: PayloadAction<boolean>) => {
      state.isActiveMicrophone = action.payload;
    },
    updateIsMicMuted: (state, action: PayloadAction<boolean>) => {
      state.isMicMuted = action.payload;
    },
    updateIsActiveWebcam: (state, action: PayloadAction<boolean>) => {
      state.isActiveWebcam = action.payload;
    },
    updateIsActiveRaisehand: (state, action: PayloadAction<boolean>) => {
      state.isActiveRaisehand = action.payload;
    },
    updateIsActiveRecording: (state, action: PayloadAction<boolean>) => {
      state.isActiveRecording = action.payload;
    },
    updateIsActiveScreenshare: (state, action: PayloadAction<boolean>) => {
      state.isActiveScreenshare = action.payload;

      if (state.isActiveScreenshare) {
        // If screen sharing starts, we should close any open side panel.
        state.activeSidePanel = null;
        state.isActiveWhiteboard = false;
      }
    },
    updateIsActiveSharedNotePad: (state, action: PayloadAction<boolean>) => {
      state.isActiveSharedNotePad = action.payload;
    },
    updateIsActiveWhiteboard: (state, action: PayloadAction<boolean>) => {
      state.isActiveWhiteboard = action.payload;
    },
    updateIsActiveInsightsAiTextChat: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.isActiveInsightsAiTextChat = action.payload;
    },
    updateIsActivePiPWebcams: (state, action: PayloadAction<boolean>) => {
      state.isActivePiPWebcams = action.payload;
    },
    updateScreenWidth: (state, action: PayloadAction<number>) => {
      state.screenWidth = action.payload;
    },
    updateScreenHeight: (state, action: PayloadAction<number>) => {
      state.screenHeight = action.payload;
    },
    updateDeviceOrientation: (
      state,
      action: PayloadAction<DeviceOrientation>,
    ) => {
      state.deviceOrientation = action.payload;
    },

    // modal related
    updateShowMicrophoneModal: (state, action: PayloadAction<boolean>) => {
      state.showMicrophoneModal = action.payload;
    },
    updateShowVideoShareModal: (state, action: PayloadAction<boolean>) => {
      state.showVideoShareModal = action.payload;
    },
    updateShowLockSettingsModal: (state, action: PayloadAction<boolean>) => {
      state.showLockSettingsModal = action.payload;
    },
    updateShowRtmpModal: (state, action: PayloadAction<boolean>) => {
      state.showRtmpModal = action.payload;
    },
    updateShowExternalMediaPlayerModal: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.showExternalMediaPlayerModal = action.payload;
    },
    updateShowManageWaitingRoomModal: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.showManageWaitingRoomModal = action.payload;
    },
    updateShowManageBreakoutRoomModal: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.showManageBreakoutRoomModal = action.payload;
    },
    updateDisplayExternalLinkRoomModal: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.showDisplayExternalLinkModal = action.payload;
    },
    updateDisplaySpeechSettingsModal: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.showSpeechSettingsModal = action.payload;
    },
    updateDisplaySpeechSettingOptionsModal: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.showSpeechSettingOptionsModal = action.payload;
    },
    updateDisplayInsightsAISettingsModal: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.showInsightsAISettingsModal = action.payload;
    },
    updateShowCTAModal: (state, action: PayloadAction<boolean>) => {
      state.showCTAModal = action.payload;
    },
    updateShowTeleprompter: (state, action: PayloadAction<boolean>) => {
      state.showTeleprompter = action.payload;
    },
    updateShowTimer: (state, action: PayloadAction<boolean>) => {
      state.showTimer = action.payload;
    },
    updateTotalUnreadChatMsgs: (state) => {
      if (state.activeSidePanel !== 'CHAT' && !state.isChatPopout) {
        state.totalUnreadChatMsgs += 1;
      }
    },
    updateVirtualBackground: (
      state,
      action: PayloadAction<BackgroundConfig>,
    ) => {
      state.virtualBackground = action.payload;
      try {
        localStorage.setItem('pnm_virtual_background', JSON.stringify(action.payload));
      } catch (e) {
        console.error('Failed to save virtual background state', e);
      }
    },
    updateIsEnabledExtendedVerticalCamView: (
      state,
      action: PayloadAction<boolean>,
    ) => {
      state.isEnabledExtendedVerticalCamView = action.payload;
    },
  },
});

export const {
  setActiveSidePanel,
  setIsChatPopout,
  setIsParticipantsPopout,
  setIsPollsPopout,
  setIsQAPopout,
  updateIsActiveMicrophone,
  updateIsMicMuted,
  updateIsActiveWebcam,
  updateIsActiveRaisehand,
  updateIsActiveRecording,
  updateIsActiveScreenshare,
  updateIsActiveSharedNotePad,
  updateIsActiveWhiteboard,
  updateIsActiveInsightsAiTextChat,
  updateIsActivePiPWebcams,
  updateShowMicrophoneModal,
  updateShowVideoShareModal,
  updateShowLockSettingsModal,
  updateShowManageWaitingRoomModal,
  updateShowRtmpModal,
  updateShowExternalMediaPlayerModal,
  updateShowManageBreakoutRoomModal,
  updateDisplayExternalLinkRoomModal,
  updateScreenWidth,
  updateScreenHeight,
  updateDeviceOrientation,
  updateTotalUnreadChatMsgs,
  updateVirtualBackground,
  updateDisplaySpeechSettingsModal,
  updateDisplaySpeechSettingOptionsModal,
  updateIsEnabledExtendedVerticalCamView,
  updateDisplayInsightsAISettingsModal,
  updateShowCTAModal,
  updateShowTeleprompter,
  updateShowTimer,
} = bottomIconsSlice.actions;

export default bottomIconsSlice.reducer;
