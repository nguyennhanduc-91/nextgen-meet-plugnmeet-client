import {
  ChatMessage,
  DataChannelMessage,
  DataMsgBodyType,
  InsightsTranscriptionResultSchema,
} from 'plugnmeet-protocol-js';
import { ConnectionQuality } from 'livekit-client';

import ConnectNats from './ConnectNats';
import { store } from '../../store';
import {
  addWhiteboardDataSentFromDonor,
  updateRequestedWhiteboardData,
} from '../../store/slices/whiteboard';
import { pollsApi } from '../../store/services/pollsApi';
import { deletePollLocally } from '../../components/polls/utils';
import { updateParticipant } from '../../store/slices/participantSlice';
import { addExternalMediaPlayerEvent } from '../../store/slices/externalMediaPlayer';
import {
  addReceivedEmoji,
  addUserNotification,
  updateIsWatermarkEnabled,
  updateIsFocusModeEnabled,
  updateIsHostOnlyChatEnabled,
  updateIsRequireVideoEnabled,
  updateIsLockReactionsEnabled,
  addSpotlightUserId,
  removeSpotlightUserId,
  setSpotlightUserIds,
  updateActiveCTA,
  updateActiveLowerThird,
  updateTimer,
} from '../../store/slices/roomSettingsSlice';
import {
  addQuestion,
  upvoteQuestion,
  markAsAnswered,
  setActiveLiveAnswer,
  deleteQuestion,
} from '../../store/slices/qaSlice';
import { updateAllowViewOtherUsersList } from '../../store/slices/sessionSlice';
import i18n from '../i18n';
import { updateReceivedInvitationFor } from '../../store/slices/breakoutRoomSlice';
import { WhiteboardDataAsDonorData } from '../../store/slices/interfaces/whiteboard';
import { fromJsonString } from '@bufbuild/protobuf';
import { TextWithInfo } from '../../store/slices/interfaces/speechServices';
import { addSpeechSubtitleText } from '../../store/slices/speechServicesSlice';
import {
  addAllChatMessages,
  selectPublicChatMessages,
} from '../../store/slices/chatMessagesSlice';

export default class HandleDataMessage {
  private connectNats: ConnectNats;

  constructor(connectNats: ConnectNats) {
    this.connectNats = connectNats;
  }

  public handleMessage = async (payload: DataChannelMessage) => {
    switch (payload.type) {
      case DataMsgBodyType.REQ_FULL_WHITEBOARD_DATA:
        if (payload.toUserId === this.connectNats.userId) {
          // only if was sent for me
          this.handleSendInitWhiteboard(payload);
        }
        break;
      case DataMsgBodyType.RES_FULL_WHITEBOARD_DATA:
        if (payload.toUserId === this.connectNats.userId) {
          // only if was sent for me
          this.handleWhiteboardDataSentFromDonor(payload.message);
        }
        break;
      case DataMsgBodyType.REQ_PUBLIC_CHAT_DATA:
        if (payload.toUserId === this.connectNats.userId) {
          // only if was sent for me
          this.handlePublicChatDataReq(payload.fromUserId);
        }
        break;
      case DataMsgBodyType.RES_PUBLIC_CHAT_DATA:
        if (payload.toUserId === this.connectNats.userId) {
          // only if was sent for me
          this.handlePublicChatDataRes(payload.message);
        }
        break;
      case DataMsgBodyType.USER_VISIBILITY_CHANGE:
        if (payload.fromUserId === this.connectNats.userId) {
          return;
        }
        this.handleUserVisibility(payload);
        break;
      case DataMsgBodyType.INFO:
        if (
          payload.fromUserId === this.connectNats.userId ||
          this.connectNats.isRecorder
        ) {
          return;
        }

        try {
          if (payload.message.startsWith('{')) {
            const data = JSON.parse(payload.message);
            if (data.type === 'emoji_reaction') {
              const receivedEmoji = {
                emoji: data.emoji,
                userId: payload.fromUserId,
                userName: data.userName || payload.fromUserId,
                timestamp: Date.now(),
                isMega: !!data.isMega,
              };

              // Dispatch to Redux (for Overlay)
              store.dispatch(addReceivedEmoji(receivedEmoji));

              // Emit event for HUD (avoids Redux consumption issue)
              const event = new CustomEvent('on_new_emoji_reaction', {
                detail: receivedEmoji,
              });
              window.dispatchEvent(event);

              return;
            }
            if (data.type === 'CUSTOM_LOCK_SETTING') {
              const { service, enabled } = data;
              if (service === 'watermark') store.dispatch(updateIsWatermarkEnabled(enabled));
              if (service === 'focus_mode') store.dispatch(updateIsFocusModeEnabled(enabled));
              if (service === 'host_only_chat') store.dispatch(updateIsHostOnlyChatEnabled(enabled));
              if (service === 'require_video') store.dispatch(updateIsRequireVideoEnabled(enabled));
              if (service === 'lock_reactions') store.dispatch(updateIsLockReactionsEnabled(enabled));
              if (service === 'allow_view_other_users_list') store.dispatch(updateAllowViewOtherUsersList(enabled));
              return;
            }
            if (data.type === 'REQ_CUSTOM_LOCK_SETTINGS') {
              if (this.connectNats.isAdmin) {
                const state = store.getState().roomSettings;
                const sessionState = store.getState().session;
                const replyMsg = JSON.stringify({
                  type: 'RES_CUSTOM_LOCK_SETTINGS',
                  settings: {
                    watermark: state.isWatermarkEnabled,
                    focus_mode: state.isFocusModeEnabled,
                    host_only_chat: state.isHostOnlyChatEnabled,
                    require_video: state.isRequireVideoEnabled,
                    lock_reactions: state.isLockReactionsEnabled,
                    spotlightUserIds: state.spotlightUserIds,
                    allow_view_other_users_list: sessionState.currentRoom.metadata?.roomFeatures?.allowViewOtherUsersList
                  }
                });
                this.connectNats.sendDataMessage(DataMsgBodyType.INFO, replyMsg, payload.fromUserId).then();
              }
              return;
            }
            if (data.type === 'RES_CUSTOM_LOCK_SETTINGS') {
              const { settings } = data;
              if (settings.watermark !== undefined) store.dispatch(updateIsWatermarkEnabled(settings.watermark));
              if (settings.focus_mode !== undefined) store.dispatch(updateIsFocusModeEnabled(settings.focus_mode));
              if (settings.host_only_chat !== undefined) store.dispatch(updateIsHostOnlyChatEnabled(settings.host_only_chat));
              if (settings.require_video !== undefined) store.dispatch(updateIsRequireVideoEnabled(settings.require_video));
              if (settings.lock_reactions !== undefined) store.dispatch(updateIsLockReactionsEnabled(settings.lock_reactions));
              if (settings.spotlightUserIds !== undefined) store.dispatch(setSpotlightUserIds(settings.spotlightUserIds));
              if (settings.allow_view_other_users_list !== undefined) store.dispatch(updateAllowViewOtherUsersList(settings.allow_view_other_users_list));
              return;
            }
            if (data.type === 'GLOBAL_SPOTLIGHT') {
              const { action, userId } = data;
              if (action === 'add') {
                store.dispatch(addSpotlightUserId(userId));
              } else if (action === 'remove') {
                store.dispatch(removeSpotlightUserId(userId));
              }
              return;
            }
            if (data.type === 'DELETE_POLL') {
              deletePollLocally(data.pollId);
              return;
            }
            if (data.type === 'WEBINAR_CTA') {
              store.dispatch(updateActiveCTA(data));
              return;
            }
            if (data.type === 'WEBINAR_LOWER_THIRD') {
              store.dispatch(updateActiveLowerThird(data.payload ?? null));
              return;
            }
            if (data.type === 'WEBINAR_QA_NEW') {
              store.dispatch(addQuestion(data.payload.message));
              return;
            }
            if (data.type === 'WEBINAR_QA_UPVOTE') {
              store.dispatch(upvoteQuestion({ id: data.payload.id, userId: data.payload.userId }));
              return;
            }
            if (data.type === 'WEBINAR_QA_LIVE_ANSWER') {
              store.dispatch(setActiveLiveAnswer(data.payload.id));
              return;
            }
            if (data.type === 'WEBINAR_QA_MARK_ANSWERED') {
              store.dispatch(markAsAnswered({ id: data.payload.id }));
              return;
            }
            if (data.type === 'WEBINAR_QA_DELETE') {
              store.dispatch(deleteQuestion(data.payload.id));
              return;
            }
            if (data.type === 'WEBINAR_TIMER') {
              store.dispatch(updateTimer(data.payload));
              return;
            }
            if (data.type === 'WEBINAR_TIMER_ACK') {
              const currentTimer = store.getState().roomSettings.timer;
              if (currentTimer) {
                store.dispatch(updateTimer({ ...currentTimer, isAcknowledged: true }));
              }
              return;
            }
          }
        } catch (e) {
          // Not JSON or parse error, fallback to regular info
        }

        store.dispatch(
          addUserNotification({
            message: i18n.t(payload.message),
            typeOption: 'info',
          }),
        );
        break;
      case DataMsgBodyType.ALERT:
        if (
          payload.fromUserId === this.connectNats.userId ||
          this.connectNats.isRecorder
        ) {
          return;
        }
        store.dispatch(
          addUserNotification({
            message: i18n.t(payload.message),
            typeOption: 'warning',
          }),
        );
        break;
      case DataMsgBodyType.EXTERNAL_MEDIA_PLAYER_EVENTS:
        if (payload.fromUserId === this.connectNats.userId) {
          return;
        }
        this.handleExternalMediaPlayerEvents(payload.message);
        break;
      case DataMsgBodyType.NEW_POLL_RESPONSE:
        if (payload.fromUserId === this.connectNats.userId) {
          return;
        }
        store.dispatch(
          pollsApi.util.invalidateTags([
            {
              type: 'Count',
              id: payload.message,
            },
            {
              type: 'Selected',
              id: payload.message,
            },
            {
              type: 'PollDetails',
              id: payload.message,
            },
          ]),
        );
        break;
      case DataMsgBodyType.USER_CONNECTION_QUALITY_CHANGE:
        store.dispatch(
          updateParticipant({
            id: payload.fromUserId,
            changes: {
              connectionQuality: payload.message as ConnectionQuality,
            },
          }),
        );
        break;
      case DataMsgBodyType.PUSH_JOIN_BREAKOUT_ROOM:
        if (payload.toUserId === this.connectNats.userId) {
          store.dispatch(updateReceivedInvitationFor(payload.message));
        }
        break;
    }
  };

  private handleSendInitWhiteboard(payload: DataChannelMessage) {
    if (store.getState().whiteboard.requestedWhiteboardData.requested) {
      // already have one request
      return;
    }
    // we'll update the reducer-only
    // component will take care for sending data
    store.dispatch(
      updateRequestedWhiteboardData({
        requested: true,
        sendTo: payload.fromUserId,
      }),
    );
  }

  private handleUserVisibility(payload: DataChannelMessage) {
    if (!this.connectNats.isAdmin) {
      return;
    }
    store.dispatch(
      updateParticipant({
        id: payload.fromUserId,
        changes: {
          visibility: payload.message,
        },
      }),
    );
  }

  private handleExternalMediaPlayerEvents(msg: string) {
    if (msg === '') {
      return;
    }
    const data = JSON.parse(msg);
    store.dispatch(addExternalMediaPlayerEvent(data));
  }

  public handleSpeechSubtitleText(message: string) {
    if (message === '') {
      return;
    }
    const lang = store.getState().speechServices.selectedSubtitleLang;
    const data = fromJsonString(InsightsTranscriptionResultSchema, message);

    if (lang !== '') {
      const d = new Date();
      const type = data.isPartial ? 'interim' : 'final';
      const result: TextWithInfo = {
        text: '',
        from: data.fromUserName,
        time: d.toLocaleTimeString(),
        id: d.getUTCMilliseconds().toString(),
      };
      if (data.lang === lang) {
        result.text = data.text;
      } else if (typeof data.translations[lang] !== 'undefined') {
        result.text = data.translations[lang];
      } else {
        return;
      }

      store.dispatch(
        addSpeechSubtitleText({
          type,
          result,
        }),
      );
    }
  }

  private handleWhiteboardDataSentFromDonor(msg: string) {
    try {
      const data: WhiteboardDataAsDonorData = JSON.parse(msg);
      store.dispatch(addWhiteboardDataSentFromDonor(data));
    } catch (e) {
      console.error(e);
    }
  }

  private handlePublicChatDataReq(fromUserId: string) {
    const publicChats = selectPublicChatMessages(store.getState()).filter(
      (msg) => msg.fromUserId !== 'system',
    );
    if (publicChats.length) {
      this.connectNats
        .sendDataMessage(
          DataMsgBodyType.RES_PUBLIC_CHAT_DATA,
          JSON.stringify(publicChats),
          fromUserId,
        )
        .then();
    }
  }

  private handlePublicChatDataRes(msg: string) {
    try {
      const data: ChatMessage[] = JSON.parse(msg);
      store.dispatch(
        addAllChatMessages({
          messages: data,
          currentUserId: this.connectNats.userId,
        }),
      );
    } catch (e) {
      console.error(e);
    }
  }
}
