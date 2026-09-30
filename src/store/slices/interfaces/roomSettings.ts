import { VideoQuality } from 'livekit-client';
import { Theme } from '@excalidraw/excalidraw/element/types';
import type { TypeOptions } from 'react-toastify';

import { AzureTokenInfo } from '../../../components/translation-transcription/helpers/apiConnections';

export enum VideoObjectFit {
  COVER = 'cover',
  CONTAIN = 'contain',
}

export interface IReplyingTo {
  messageId: string;
  name: string;
  text: string;
}

export interface IActiveCTA {
  title: string;
  description: string;
  buttonText: string;
  link: string;
  duration: number; // in seconds
  startedAt: number;
}

export interface ILowerThird {
  name: string;
  title?: string;
}

export interface TimerState {
  isActive: boolean;
  secondsRemaining: number;
  duration: number; // original duration set
  isAcknowledged?: boolean;
  warningThresholdSec?: number;
  isCompletedConfirmed?: boolean;
}

export interface ILowerThirdAutomation {
  enabled: boolean;
  name: string;
  title: string;
  delaySec: number;
  durationSec: number;
}

export interface ITimerAutomation {
  enabled: boolean;
  durationSec: number;
  delaySec: number;
}

export interface IRoomSettings {
  isShowRoomSettingsModal: boolean;
  isShowKeyboardShortcuts: boolean;
  isNatsServerConnected: boolean;

  audioDevices: Array<IMediaDevice>;
  videoDevices: Array<IMediaDevice>;
  selectedAudioDevice: string;
  selectedVideoDevice: string;
  playAudioNotification: boolean;
  activateWebcamsView: boolean;
  activeScreenSharingView: boolean;
  allowPlayAudioNotification: boolean;
  isHighFidelityAudio: boolean;
  roomAudioVolume: number;
  roomScreenShareAudioVolume: number;
  roomVideoQuality: VideoQuality;
  theme: Theme;
  videoObjectFit: VideoObjectFit;

  selectedTabLeftPanel: number;
  selectedChatOption: string;
  initiatePrivateChat: InitiatePrivateChat;
  unreadMsgFrom: Array<string>;
  selectedChatTransLang: string;
  replyingTo: IReplyingTo | null;

  columnCameraWidth: ColumnCameraWidth;
  columnCameraPosition: ColumnCameraPosition;
  visibleHeader: boolean;
  visibleFooter: boolean;
  azureTokenInfo?: AzureTokenInfo;
  isPNMWindowTabVisible: boolean;
  pinnedCamUserIds?: string[];
  focusActiveSpeakerWebcam: boolean;
  selfInsertedE2EESecretKey?: string;
  userNotifications: UserNotification[];
  isSidePanelOpened: boolean;
  hasWebcamPages: boolean;
  maxNumDisplayWebcams?: number;
  hideNonVideoParticipants: boolean;
  receivedEmoji?: ReceivedEmoji | null;
  isWatermarkEnabled: boolean;
  isFocusModeEnabled: boolean;
  isHostOnlyChatEnabled: boolean;
  isRequireVideoEnabled: boolean;
  isLockReactionsEnabled?: boolean;
  spotlightUserIds?: string[];
  ignoreSpotlightLayout?: boolean;
  activeCTA?: IActiveCTA | null;
  activeLowerThird?: ILowerThird | null;
  showLowerThirdModal?: boolean;
  timer?: TimerState;
  lowerThirdAutomation?: ILowerThirdAutomation;
  timerAutomation?: ITimerAutomation;
}

export interface ReceivedEmoji {
  emoji: string;
  userId: string;
  userName: string;
  timestamp: number;
  isMega?: boolean;
}

export interface IMediaDevice {
  id: string;
  label: string;
}

export interface InitiatePrivateChat {
  name: string;
  userId: string;
}

export interface UnreadMsgFromPayload {
  task: 'ADD' | 'DEL';
  id: string;
}

export enum ColumnCameraWidth {
  FULL_WIDTH = 'full',
  MEDIUM_WIDTH = 'medium',
  SMALL_WIDTH = 'small',
}

export enum ColumnCameraPosition {
  LEFT = 'left',
  TOP = 'top',
  BOTTOM = 'bottom',
}

export interface UserNotification {
  message: string;
  typeOption: TypeOptions;
  notificationCat?: NotificationCats;
  data?: string;
  newInstance?: boolean;
  autoClose?: number | false;
  created?: number;
  disableToastNotification?: boolean;
}

export type NotificationCats =
  | 'new-poll-created'
  | 'breakout-room-invitation'
  | 'default';
