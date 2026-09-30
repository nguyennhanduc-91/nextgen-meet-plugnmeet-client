/**
 * authAPI.ts
 * Utility for communicating with the secure BFF (Backend For Frontend).
 * This replaces the previous insecure client-side signature generation.
 */

function getBffUrl(): string {
  if (typeof window !== 'undefined') {
    const config = (window as any).plugNmeetConfig;
    if (config?.bffUrl) {
      return config.bffUrl.replace(/\/+$/, '');
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:4000/api';
    }
  }
  return '/api';
}

export interface JoinRoomPayload {
  roomId: string;
  userName: string;
  avatar?: string;
  isAdmin?: boolean;
  password?: string;
  isWaitingRoomEnabled?: boolean;
  roomTitle?: string;
  roomMode?: string;
}

export interface JoinRoomResponse {
  status: boolean;
  token?: string;
  roomId?: string;
  userName?: string;
  msg?: string;
}

/**
 * Calls the secure backend to create a room if needed and get a join token.
 */
export async function getJoinTokenFromBackend(payload: JoinRoomPayload): Promise<JoinRoomResponse> {
  try {
    const response = await fetch(`${getBffUrl()}/join-room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error(`Server returned ${response.status} ${response.statusText} - ${e}`);
    }

    if (!response.ok && (!data || !data.msg)) {
      throw new Error(`Server returned ${response.status} ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('Failed to communicate with Auth Backend:', error);
    return { status: false, msg: String(error) };
  }
}

/**
 * Toggle Waiting Room on/off during an active meeting.
 */
export async function toggleWaitingRoomAPI(roomId: string, isActive: boolean): Promise<{ status: boolean; msg?: string }> {
  try {
    const response = await fetch(`${getBffUrl()}/room/toggleWaitingRoom`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, isActive }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to toggle waiting room:', error);
    return { status: false, msg: String(error) };
  }
}
