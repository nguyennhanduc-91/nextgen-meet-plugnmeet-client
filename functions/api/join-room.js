/**
 * Cloudflare Pages Function: /api/join-room
 * Securely communicates with the PlugNmeet backend using HMAC-SHA256 signature.
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

export async function onRequestPost(context) {
  const { request, env } = context;

  // Environment variables configured in Cloudflare Pages dashboard or fallback defaults
  const PLUGNMEET_SERVER_URL = env?.PLUGNMEET_SERVER_URL || 'https://api-meet.thanhnguyen.group';
  const PLUGNMEET_API_KEY = env?.PLUGNMEET_API_KEY || 'thanhnguyen_api';
  const PLUGNMEET_SECRET = env?.PLUGNMEET_SECRET || 'thanhnguyen_secret_key_super_safe_2026';

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const body = await request.json();
    const { roomId, userName, isAdmin, password, isWaitingRoomEnabled, roomTitle, roomMode } = body;

    if (!roomId || !userName) {
      return new Response(JSON.stringify({ status: false, msg: 'Missing roomId or userName' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 1. Check if room is active
    let isRoomActive = false;
    try {
      const isActiveRes = await sendPlugNmeetRequest(PLUGNMEET_SERVER_URL, PLUGNMEET_API_KEY, PLUGNMEET_SECRET, 'room/isRoomActive', { room_id: roomId });
      isRoomActive = isActiveRes.status && isActiveRes.is_active;
    } catch (e) {
      console.warn('isRoomActive check failed:', e);
    }

    let actualIsAdmin = false;

    // 2. If room is not active, create it
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

    // 3. Generate Join Token
    const userId = `user-${Date.now()}`;
    let userMetadata = {};
    const avatarUrl = body.avatar;
    if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim().length > 0) {
      if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:image/')) {
        userMetadata.profile_pic = avatarUrl.trim();
      }
    }

    const hasMetadata = Object.keys(userMetadata).length > 0;

    const tokenRes = await sendPlugNmeetRequest(PLUGNMEET_SERVER_URL, PLUGNMEET_API_KEY, PLUGNMEET_SECRET, 'room/getJoinToken', {
      room_id: roomId,
      user_info: {
        name: userName,
        user_id: userId,
        is_admin: actualIsAdmin,
        user_metadata: hasMetadata ? userMetadata : undefined,
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

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
