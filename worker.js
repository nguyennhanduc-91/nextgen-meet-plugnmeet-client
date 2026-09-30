/**
 * Cloudflare Worker with Static Assets
 * Handles /api/join-room and /api/room/toggleWaitingRoom
 * Falls back to static assets in ./dist (SPA mode)
 */

async function getHashSignature(secretKey, message) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const msgData = encoder.encode(message);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sendPlugNmeetRequest(serverUrl, apiKey, secretKey, method, body) {
  const bodyString = JSON.stringify(body);
  const signature = await getHashSignature(secretKey, bodyString);

  const headers = {
    'Content-Type': 'application/json',
    'API-KEY': apiKey,
    'HASH-SIGNATURE': signature,
  };

  const response = await fetch(`${serverUrl}/auth/${method}`, {
    method: 'POST',
    headers,
    body: bodyString,
  });

  return await response.json();
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const PLUGNMEET_SERVER_URL = env?.PLUGNMEET_SERVER_URL || 'https://api-meet.thanhnguyen.group';
    const PLUGNMEET_API_KEY = env?.PLUGNMEET_API_KEY || 'thanhnguyen_api';
    const PLUGNMEET_SECRET = env?.PLUGNMEET_SECRET || 'thanhnguyen_secret_key_super_safe_2026';

    if (url.pathname === '/api/join-room' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { roomId, userName, isAdmin, roomTitle, roomMode, isWaitingRoomEnabled } = body;

        if (!roomId || !userName) {
          return new Response(JSON.stringify({ status: false, msg: 'Missing roomId or userName' }), {
            status: 400,
            headers: corsHeaders,
          });
        }

        // Check if room is active
        let isRoomActive = false;
        try {
          const isActiveRes = await sendPlugNmeetRequest(PLUGNMEET_SERVER_URL, PLUGNMEET_API_KEY, PLUGNMEET_SECRET, 'room/isRoomActive', { room_id: roomId });
          isRoomActive = isActiveRes.status && isActiveRes.is_active;
        } catch (e) {
          console.warn('isRoomActive check failed:', e);
        }

        let actualIsAdmin = false;

        if (!isRoomActive) {
          if (!isAdmin) {
            return new Response(JSON.stringify({ status: false, msg: 'Phòng chưa được mở. Vui lòng đợi Chủ trì (Host) bắt đầu.' }), {
              status: 403,
              headers: corsHeaders,
            });
          }

          const isWebinar = roomMode === 'webinar';

          const createRes = await sendPlugNmeetRequest(PLUGNMEET_SERVER_URL, PLUGNMEET_API_KEY, PLUGNMEET_SECRET, 'room/create', {
            room_id: roomId,
            metadata: {
              room_title: roomTitle || roomId,
              welcome_message: 'Chào mừng bạn đến với Thanh Nguyên Room!',
              room_features: {
                allow_webcams: true,
                admin_only_webcams: isWebinar,
                allow_view_other_webcams: !isWebinar,
                allow_view_other_users_list: !isWebinar,
                allow_screen_share: true,
                allow_raise_hand: true,
                chat_features: { is_allow: true, is_allow_file_upload: true },
                whiteboard_features: { is_allow: true },
                shared_note_pad_features: { is_allow: true, is_active: false },
                polls_features: { is_allow: true, is_active: false },
                waiting_room_features: { is_active: isWaitingRoomEnabled === true },
                recording_features: {
                  is_allow: true,
                  is_allow_cloud: true,
                  is_allow_local: true,
                },
                insights_features: {
                  is_allow: true,
                  transcription_features: { is_allow: false },
                  ai_features: {
                    is_allow: true,
                    ai_text_chat_features: { is_allow: true },
                  },
                },
                mute_on_start: true,
              },
              default_lock_settings: isWebinar ? {
                lock_microphone: true,
                lock_webcam: true,
                lock_screen_sharing: true,
              } : undefined,
            },
          });

          if (!createRes.status) {
            return new Response(JSON.stringify({ status: false, msg: `Failed to create room: ${createRes.msg}` }), {
              status: 500,
              headers: corsHeaders,
            });
          }
          isRoomActive = true;
          actualIsAdmin = true;
        } else {
          actualIsAdmin = !!isAdmin;
        }

        const userId = `user-${Date.now()}`;
        let userMetadata = {};
        const avatarUrl = body.avatar;
        if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim().length > 0) {
          if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:image/')) {
            userMetadata.profile_pic = avatarUrl.trim();
          }
        }

        const tokenRes = await sendPlugNmeetRequest(PLUGNMEET_SERVER_URL, PLUGNMEET_API_KEY, PLUGNMEET_SECRET, 'room/getJoinToken', {
          room_id: roomId,
          user_info: {
            name: userName,
            user_id: userId,
            is_admin: actualIsAdmin,
            user_metadata: Object.keys(userMetadata).length > 0 ? userMetadata : undefined,
          },
        });

        if (tokenRes.status && tokenRes.token) {
          return new Response(JSON.stringify({ status: true, token: tokenRes.token, roomId, userName }), {
            status: 200,
            headers: corsHeaders,
          });
        } else {
          return new Response(JSON.stringify({ status: false, msg: `Failed to generate token: ${tokenRes.msg}` }), {
            status: 500,
            headers: corsHeaders,
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({ status: false, msg: error.message || String(error) }), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    if (url.pathname === '/api/room/toggleWaitingRoom' && request.method === 'POST') {
      try {
        const { roomId, isActive } = await request.json();
        const res = await sendPlugNmeetRequest(PLUGNMEET_SERVER_URL, PLUGNMEET_API_KEY, PLUGNMEET_SECRET, 'room/updateWaitingRoom', {
          room_id: roomId,
          is_active: isActive,
        });
        return new Response(JSON.stringify(res), { status: 200, headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ status: false, msg: String(err) }), { status: 500, headers: corsHeaders });
      }
    }

    // Default: Serve static assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
