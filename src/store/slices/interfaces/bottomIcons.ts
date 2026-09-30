import { BackgroundConfig } from '../../../helpers/libs/TrackProcessor';

export type DeviceOrientation = 'landscape' | 'portrait';

export type SidePanelType = 'CHAT' | 'PARTICIPANTS' | 'POLLS' | 'QA' | null;

export interface IBottomIconsSlice {
  isActiveMicrophone: boolean;
  isActiveWebcam: boolean;
  isActiveRaisehand: boolean;
  isActiveRecording: boolean;
  isActiveScreenshare: boolean;
  isActiveSharedNotePad: boolean;
  isActiveWhiteboard: boolean;
  isActiveInsightsAiTextChat: boolean;
  isActivePiPWebcams: boolean;

  activeSidePanel: SidePanelType;

  isMicMuted: boolean;
  screenWidth: number;
  screenHeight: number;
  deviceOrientation: DeviceOrientation;

  // modal related
  showMicrophoneModal: boolean;
  showVideoShareModal: boolean;
  showLockSettingsModal: boolean;
  showRtmpModal: boolean;
  showExternalMediaPlayerModal: boolean;
  showManageWaitingRoomModal: boolean;
  showManageBreakoutRoomModal: boolean;
  showDisplayExternalLinkModal: boolean;
  showSpeechSettingsModal: boolean;
  showSpeechSettingOptionsModal: boolean;
  showInsightsAISettingsModal: boolean;
  showCTAModal: boolean;
  showTeleprompter: boolean;
  showTimer: boolean;

  totalUnreadChatMsgs: number;
  virtualBackground: BackgroundConfig;
  isEnabledExtendedVerticalCamView: boolean;

  isChatPopout: boolean;
  isParticipantsPopout: boolean;
  isPollsPopout: boolean;
  isQAPopout: boolean;
}
