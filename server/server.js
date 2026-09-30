const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const PLUGNMEET_SERVER_URL = process.env.PLUGNMEET_SERVER_URL || 'http://localhost:8080';
const PLUGNMEET_API_KEY = process.env.PLUGNMEET_API_KEY;
const PLUGNMEET_SECRET = process.env.PLUGNMEET_SECRET;

// In-memory room password stores
const roomPasswords = {};
const adminPasswords = {};

// Utility function to generate HMAC-SHA256 signature for plugNmeet
function getHashSignature(secretKey, message) {
  return crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('hex');
}

// Wrapper to send requests to plugNmeet Backend
async function sendPlugNmeetRequest(method, body) {
  const bodyString = JSON.stringify(body);
  const signature = getHashSignature(PLUGNMEET_SECRET, bodyString);

  console.log(`[PlugNmeet Request] Method: ${method}, Body: ${bodyString}`);

  const headers = {
    'Content-Type': 'application/json',
    'API-KEY': PLUGNMEET_API_KEY,
    'HASH-SIGNATURE': signature,
  };

  try {
    const response = await axios.post(`${PLUGNMEET_SERVER_URL}/auth/${method}`, bodyString, {
      headers: headers
    });
    console.log(`[PlugNmeet Response] Success:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`[PlugNmeet Error] ${method}:`, error.response ? error.response.data : error.message);
    throw new Error(`PlugNmeet API Error: ${error.response ? error.response.statusText : error.message}`, { cause: error });
  }
}

/**
 * POST /api/join-room
 */
app.post('/api/join-room', async (req, res) => {
  try {
    const { roomId, userName, isAdmin, password, isWaitingRoomEnabled, roomTitle, roomMode } = req.body;

    if (!roomId || !userName) {
      return res.status(400).json({ status: false, msg: 'Missing roomId or userName' });
    }

    // 1. Check if room is active
    const isActiveRes = await sendPlugNmeetRequest('room/isRoomActive', { room_id: roomId });
    let isRoomActive = isActiveRes.status && isActiveRes.is_active;

    // Determine actual admin status:
    // Only the creator (first person) gets admin rights automatically.
    // Joiners must have adminPassword to be a Co-host.
    let actualIsAdmin = false;

    // 2. If room is not active, create it
    if (!isRoomActive) {
      if (!isAdmin) {
        return res.status(403).json({ status: false, msg: 'Phòng chưa được mở. Vui lòng đợi Chủ trì (Host) bắt đầu.' });
      }

      // Creator sets the password. Support "guestpwd|adminpwd"
      // "none" means explicitly no password set for that slot
      if (password) {
        if (password.includes('|')) {
          const parts = password.split('|');
          const guestPass = parts[0] && parts[0] !== 'none' ? parts[0] : '';
          const adminPass = parts[1] && parts[1] !== 'none' ? parts[1] : '';
          if (guestPass) roomPasswords[roomId] = guestPass;
          if (adminPass) adminPasswords[roomId] = adminPass;
        } else if (password !== 'none') {
          roomPasswords[roomId] = password;
        }
      }

      const isWebinar = roomMode === 'webinar';

      const createRes = await sendPlugNmeetRequest('room/create', {
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
              transcription_features: {
                is_allow: false,
              },
              ai_features: {
                is_allow: true,
                ai_text_chat_features: {
                  is_allow: true,
                },
              },
            },
            mute_on_start: true,
          },
          default_lock_settings: isWebinar ? {
            lock_microphone: true,
            lock_webcam: true,
            lock_screen_sharing: true,
          } : undefined
        }
      });

      if (!createRes.status) {
        return res.status(500).json({ status: false, msg: `Failed to create room: ${createRes.msg}` });
      }
      isRoomActive = true;
      actualIsAdmin = true; // Creator is the Host
    } else {
      // Room exists
      let enteredPass = password || '';
      
      // If the guest typed |123, let's treat it as if they meant 123 for Co-host logic
      if (enteredPass.startsWith('|')) {
        enteredPass = enteredPass.substring(1);
      }

      if (adminPasswords[roomId] && enteredPass === adminPasswords[roomId]) {
        // Provided the Co-Host/Admin password
        actualIsAdmin = true;
      } else {
        // If they provided a password (trying to authenticate) but failed the admin check
        // AND the room has no guest password, they should be rejected for wrong password!
        if (enteredPass && !roomPasswords[roomId]) {
          return res.status(403).json({ status: false, msg: 'WRONG_PASSWORD' });
        }

        // Normal guest checking
        if (roomPasswords[roomId]) {
          // If the room has a guest password, they must match it exactly,
          // (note: if they typed |guestpwd, we stripped |, so let's allow it or just assume they meant the guest pass)
          // To be safe, we check against the raw `password` OR the stripped `enteredPass`
          if (password !== roomPasswords[roomId] && enteredPass !== roomPasswords[roomId]) {
            return res.status(403).json({ status: false, msg: 'WRONG_PASSWORD' });
          }
        }
        
        actualIsAdmin = false; // Joiners are NEVER hosts unless they have the admin password
      }
    }

    // 3. Generate Join Token
    if (isRoomActive) {
      const userId = `user-${Date.now()}`;
      
      let userMetadata = {};
      
      // Validate avatar URL - must be a non-empty string that looks like a URL
      const avatarUrl = req.body.avatar;
      if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim().length > 0) {
        // Basic URL validation
        if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('data:image/')) {
          userMetadata.profile_pic = avatarUrl.trim();
          console.log(`[Avatar] ✅ Setting profile_pic for user "${userName}":`, avatarUrl.substring(0, 80) + '...');
        } else {
          console.warn(`[Avatar] ⚠️ Invalid avatar URL format for user "${userName}":`, avatarUrl.substring(0, 80));
        }
      } else {
        console.log(`[Avatar] ℹ️ No avatar provided for user "${userName}"`);
      }

      const hasMetadata = Object.keys(userMetadata).length > 0;
      console.log(`[Token] Generating token for "${userName}" (admin: ${actualIsAdmin}), metadata:`, hasMetadata ? userMetadata : '(none)');

      const tokenRes = await sendPlugNmeetRequest('room/getJoinToken', {
        room_id: roomId,
        user_info: {
          name: userName,
          user_id: userId,
          is_admin: actualIsAdmin,
          user_metadata: hasMetadata ? userMetadata : undefined
        }
      });

      if (tokenRes.status && tokenRes.token) {
        return res.json({ status: true, token: tokenRes.token, roomId, userName });
      } else {
        return res.status(500).json({ status: false, msg: `Failed to generate token: ${tokenRes.msg}` });
      }
    }
  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({ status: false, msg: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend Server running on port ${PORT}`);
});
