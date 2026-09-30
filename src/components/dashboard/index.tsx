import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getJoinTokenFromBackend } from '../../helpers/api/authAPI';
import { LoadingIcon } from '../../assets/Icons/Loading';
import tngLogo from '../../assets/tng_logo.png';
import { useMediaDevices } from '../landing/hooks/useMediaDevices';
import WebcamPreview from '../footer/modals/webcam/webcamPreview';
import WebcamSettings from '../footer/modals/webcam/webcamSettings';

function generateRandomRoomId(): string {
  const num1 = Math.floor(100 + Math.random() * 900);
  const num2 = Math.floor(100 + Math.random() * 900);
  return `phong-${num1}-${num2}`;
}

interface RecentRoom {
  roomId: string;
  userName: string;
  joinedAt: string;
  hasPassword: boolean;
  roomTitle?: string;
  roomPassword?: string;
  adminPassword?: string;
  isWaitingRoomEnabled?: boolean;
  roomMode?: 'meeting' | 'webinar';
}

function getRecentRooms(): RecentRoom[] {
  try {
    const data = localStorage.getItem('pnm_recent_rooms');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveRecentRoom(room: RecentRoom) {
  const rooms = getRecentRooms().filter((r) => r.roomId !== room.roomId);
  rooms.unshift(room);
  localStorage.setItem('pnm_recent_rooms', JSON.stringify(rooms.slice(0, 10)));
}

function removeRecentRoom(roomId: string) {
  const rooms = getRecentRooms().filter((r) => r.roomId !== roomId);
  localStorage.setItem('pnm_recent_rooms', JSON.stringify(rooms));
  return rooms;
}

const HomeDashboard = () => {
  const [activeTab, setActiveTab] = useState<'join'|'host'>('join');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [roomId, setRoomId] = useState('');
  const [roomTitle, setRoomTitle] = useState('');
  const [userName, setUserName] = useState('');
  const [roomPassword, setRoomPassword] = useState(''); // Guest Pass
  const [adminPassword, setAdminPassword] = useState(''); // Admin Pass
  const [hostEmail, setHostEmail] = useState('');
  const [hostPassword, setHostPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [hostAvatar, setHostAvatar] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isWaitingRoomEnabled, setIsWaitingRoomEnabled] = useState(false);
  const [roomMode, setRoomMode] = useState<'meeting' | 'webinar'>('meeting');
  const [showAdvancedCamera, setShowAdvancedCamera] = useState(false);
  
  const [isGuestLink, setIsGuestLink] = useState(false);
  const [isPasswordRequired, setIsPasswordRequired] = useState(false);
  const [hasRequestedMedia, setHasRequestedMedia] = useState(false);
  
  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([]);
  const [showRecentRooms, setShowRecentRooms] = useState(false);

  const [isHighFidelityAudio, setIsHighFidelityAudio] = useState(() => {
    try {
      const saved = localStorage.getItem('pnm_high_fidelity_audio');
      return saved ? JSON.parse(saved) : false;
    } catch { return false; }
  });
  const [isNoiseCancellationEnabled, setIsNoiseCancellationEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('pnm_noise_cancellation');
      return saved ? JSON.parse(saved) : true;
    } catch { return true; }
  });
  const [isTestingSpeaker, setIsTestingSpeaker] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const micAnalyserRef = useRef<{ stream: MediaStream; analyser: AnalyserNode; animId: number } | null>(null);
  const testAudioRef = useRef<HTMLAudioElement | null>(null);

  const {
    audioDevices,
    videoDevices,
    selectedAudioDevice,
    selectedVideoDevice,
    setSelectedAudioDevice,
    setSelectedVideoDevice,
    enableMediaDevices,
    disableWebcam,
    disableMic,
  } = useMediaDevices();

  // Check Session
  useEffect(() => {
    const savedName = localStorage.getItem('pnm_recent_name');
    if (savedName) setUserName(savedName);
    
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setIsDarkTheme(false);
    }

    // Auto-fill remembered email
    const rememberedEmail = localStorage.getItem('pnm_remember_email');
    if (rememberedEmail) {
      setHostEmail(rememberedEmail);
      setRememberMe(true);
    }

    const hostSessionStr = localStorage.getItem('pnm_host_session');
    if (hostSessionStr) {
      try {
        const session = JSON.parse(hostSessionStr);
        if (session && session.userName) {
            setUserName(session.userName);
            if (session.avatar) setHostAvatar(session.avatar);
            // Will automatically bypass to step 3 when host tab is active
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinRoom = params.get('join');
    if (joinRoom) {
      setRoomId(joinRoom);
      setIsGuestLink(true);
      setActiveTab('join');
      setStep(3);
    } else {
      setRoomId(generateRandomRoomId());
      // Default to guest tab initially to show Step 1
      setActiveTab('join'); 
      setRecentRooms(getRecentRooms());
    }
  }, []);

  useEffect(() => {
    if (!hasRequestedMedia) {
      enableMediaDevices('both').catch((e) => console.log('Auto Media Permission Issue:', e));
      setHasRequestedMedia(true);
    }
  }, [hasRequestedMedia, enableMediaDevices]);

  // Reset password warning when tab changes
  useEffect(() => {
    setIsPasswordRequired(false);
    setError('');
  }, [activeTab]);

  // Mic Level Analyser
  useEffect(() => {
    let isMounted = true;
    let localStream: MediaStream | null = null;

    if (selectedAudioDevice) {
      navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: selectedAudioDevice } }
      }).then(stream => {
        if (!isMounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        localStream = stream;
        const ctx = new window.AudioContext();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        const tick = () => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          setMicLevel(Math.min(100, Math.round(avg * 1.5)));
          const animId = requestAnimationFrame(tick);
          if (micAnalyserRef.current) micAnalyserRef.current.animId = animId;
        };
        const animId = requestAnimationFrame(tick);
        micAnalyserRef.current = { stream, analyser, animId };
      }).catch(() => {
        if (isMounted) setMicLevel(0);
      });
    }
    return () => {
      isMounted = false;
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
      if (micAnalyserRef.current) {
        cancelAnimationFrame(micAnalyserRef.current.animId);
        if (micAnalyserRef.current.stream) {
          micAnalyserRef.current.stream.getTracks().forEach(t => t.stop());
        }
        micAnalyserRef.current = null;
      }
      setMicLevel(0);
    };
  }, [selectedAudioDevice]);

  const toggleHighFidelityAudio = useCallback(() => {
    setIsHighFidelityAudio((prev: boolean) => {
      const next = !prev;
      localStorage.setItem('pnm_high_fidelity_audio', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleGenerateRandom = () => {
    setRoomId(generateRandomRoomId());
  };

  const handleHostClick = () => {
     setActiveTab('host');
     const sessionStr = localStorage.getItem('pnm_host_session');
     if (sessionStr) {
         try {
             const session = JSON.parse(sessionStr);
             if (session && session.userName) {
                 setUserName(session.userName);
                 if (session.avatar) setHostAvatar(session.avatar);
                 setStep(3); // Auto Bypass
                 return;
             }
         } catch(e) {}
     }
     setStep(2);
  };

  const handleLogout = () => {
      localStorage.removeItem('pnm_host_session');
      setUserName('');
      setHostAvatar('');
      setActiveTab('join');
      setStep(1);
  };

  const handleHostLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostEmail.trim() || !hostPassword.trim()) {
      setError('Vui lòng nhập Email và Mật khẩu Hub.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const config = (window as any).plugNmeetConfig;
      const supabaseUrl = config?.supabase?.url || config?.supabaseUrl;
      const supabaseAnonKey = config?.supabase?.anonKey || config?.supabaseAnonKey;
      
      if (!config || !supabaseUrl || !supabaseAnonKey) {
        throw new Error('Chưa cấu hình Supabase trong config.js');
      }

      const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: hostEmail, password: hostPassword })
      });
      const authData = await authRes.json();
      if (!authRes.ok || authData.error || authData.error_code) {
        setIsLoading(false);
        setError(authData.msg || authData.error_description || 'Tài khoản Hub hoặc Mật khẩu không chính xác.');
        return;
      }

      let finalName = hostEmail.split('@')[0];
      let finalAvatar = '';
      
      const meta = authData.user?.raw_user_meta_data || authData.user?.user_metadata || {};
      if (meta.full_name) finalName = meta.full_name;
      else if (meta.name) finalName = meta.name;
      
      if (meta.avatar_url) finalAvatar = meta.avatar_url;
      else if (meta.picture) finalAvatar = meta.picture;
      else if (meta.avatar) finalAvatar = meta.avatar;
      
      try {
        // Truy vấn trực tiếp bảng public.users (bảng profiles không tồn tại)
        const userRes = await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(hostEmail)}&select=full_name,avatar_url`, {
          method: 'GET',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${authData.access_token}`
          }
        });
        const userData = await userRes.json();
        if (Array.isArray(userData) && userData.length > 0) {
          finalName = userData[0].full_name || finalName;
          finalAvatar = userData[0].avatar_url || finalAvatar;
        }
      } catch (e) {
        console.warn('Lấy profile DB thất bại, dùng metadata thay thế', e);
      }

      setUserName(finalName);
      setHostAvatar(finalAvatar);
      
      // Save Session
      localStorage.setItem('pnm_host_session', JSON.stringify({
          access_token: authData.access_token,
          userName: finalName,
          email: hostEmail,
          avatar: finalAvatar
      }));

      // Remember Me - save or clear email
      if (rememberMe) {
        localStorage.setItem('pnm_remember_email', hostEmail);
      } else {
        localStorage.removeItem('pnm_remember_email');
      }

      // Move to Step 3 (Green Room)
      setStep(3);
    } catch (err: any) {
      setError('Lỗi kết nối Supabase: ' + err.message);
    }
    setIsLoading(false);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !userName.trim()) {
      setError('Vui lòng nhập Mã Phòng và Tên Của Bạn.');
      return;
    }
    
    // Nếu khách đang bị hỏi mật khẩu mà bấm gửi trắng thì báo lỗi nhẹ
    if (activeTab === 'join' && isPasswordRequired && !roomPassword.trim()) {
      setError('Vui lòng nhập Mật Khẩu để tiếp tục.');
      return;
    }

    setError('');
    setIsLoading(true);
    localStorage.setItem('pnm_recent_name', userName);
    localStorage.setItem('pnm_video_device', selectedVideoDevice);
    localStorage.setItem('pnm_audio_device', selectedAudioDevice);
    localStorage.setItem('pnm_high_fidelity_audio', JSON.stringify(isHighFidelityAudio));
    localStorage.setItem('pnm_noise_cancellation', JSON.stringify(isNoiseCancellationEnabled));
    localStorage.setItem('pnm_room_title', roomTitle.trim() || roomId);

    const formatRoomId = roomId.trim().toLowerCase().replace(/\s+/g, '-');
    const isAdmin = activeTab === 'host';
    
    let finalAuthPassword: string | undefined = undefined;
    let finalUserName = userName.trim();

    if (isAdmin) {
      try {
        const config = (window as any).plugNmeetConfig;
        const secretAdminPass = config?.roomCreationPassword || "tng@2025";

        const rPass = roomPassword.trim() || "none";
        const aPass = adminPassword.trim() || secretAdminPass;
        
        if (!isGuestLink) {
          // Tạo mới
          finalAuthPassword = `${rPass}|${aPass}`;
        } else {
          // Co-host
          finalAuthPassword = `|${aPass}`;
        }
      } catch (err: any) {
        setIsLoading(false);
        setError('Lỗi cấu hình: ' + err.message);
        return;
      }
    } else {
      // Mode: Khách => Gửi Guest Pass chuẩn
      if (roomPassword) finalAuthPassword = roomPassword.trim();
    }

    const result = await getJoinTokenFromBackend({
      roomId: formatRoomId,
      userName: finalUserName,
      avatar: hostAvatar && hostAvatar.trim().length > 0 ? hostAvatar.trim() : undefined,
      isAdmin: isAdmin,
      password: finalAuthPassword,
      isWaitingRoomEnabled: isWaitingRoomEnabled,
      roomTitle: roomTitle.trim() || undefined,
      roomMode: roomMode,
    });

    if (result.status && result.token) {
      if (isAdmin) {
        saveRecentRoom({
          roomId: formatRoomId,
          userName: finalUserName,
          joinedAt: new Date().toLocaleString('vi-VN'),
          hasPassword: !!roomPassword,
          roomTitle: roomTitle.trim() || undefined,
          roomPassword: roomPassword || undefined,
          adminPassword: adminPassword || undefined,
          isWaitingRoomEnabled: isWaitingRoomEnabled || undefined,
          roomMode: roomMode,
        });
      }
      const url = new URL(window.location.href);
      url.searchParams.delete('join');
      url.searchParams.set('access_token', result.token);
      window.location.href = url.toString();
    } else {
      if (result.msg === 'WRONG_PASSWORD') {
        if (activeTab === 'join') {
           setIsPasswordRequired(true);
           setError('Phòng này yêu cầu nhập Mật Khẩu bảo mật.');
           setRoomPassword('');
        } else {
           setError('Mật khẩu quản trị không chính xác hoặc phòng họp cũ chưa được đóng hoàn toàn.');
        }
      } else {
        setError('Không thể kết nối phòng. (' + (result.msg || 'Unknown') + ')');
      }
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = shareLink;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShowShareLink = useCallback(() => {
    if (!roomId.trim()) return;
    const formatRoomId = roomId.trim().toLowerCase().replace(/\s+/g, '-');
    setShareLink(`${window.location.origin}?join=${formatRoomId}`);
    setShowShareModal(true);
    setCopied(false);
  }, [roomId]);

  const themeClasses = isDarkTheme 
    ? "bg-[#050B14] text-white" 
    : "bg-slate-50 text-slate-800";
    
  const cardClasses = isDarkTheme
    ? "bg-white/5 border-white/10 shadow-2xl backdrop-blur-2xl"
    : "bg-white/80 border-slate-200 shadow-xl backdrop-blur-xl";

  const textPrimary = isDarkTheme ? "text-white" : "text-primary-color";
  const textSecondary = isDarkTheme ? "text-white/60" : "text-slate-500";
  const textLabel = isDarkTheme ? "text-white/80" : "text-slate-700 font-semibold";
  
  const inputBg = isDarkTheme 
    ? "bg-white/5 border-white/10 text-white placeholder-white/40 focus:bg-white/10 focus:border-white/20 focus:ring-2 focus:ring-[var(--color-Blue)] shadow-sm" 
    : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-[var(--color-primary-color)] focus:ring-2 focus:ring-[var(--color-primary-color)]/20 shadow-sm";

  return (
    <div className={`min-h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 transition-colors duration-700 relative overflow-hidden ${themeClasses}`}>
      {/* Ambient Orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none hidden sm:block">
          <div className="absolute bg-[#004D90]/20 w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] rounded-full blur-[100px] -top-[10%] -left-[10%] animate-[pulse_4s_ease-in-out_infinite]"></div>
          <div className="absolute bg-[#00a1f2]/20 w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] rounded-full blur-[120px] top-[20%] -right-[10%] animate-[pulse_6s_ease-in-out_infinite_1s]"></div>
          <div className="absolute bg-blue-600/10 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full blur-[100px] -bottom-[10%] left-[20%] animate-[pulse_5s_ease-in-out_infinite_2s]"></div>
      </div>

      <button 
        onClick={() => setIsDarkTheme(!isDarkTheme)}
        className={`fixed top-3 right-3 sm:top-6 sm:right-6 p-2.5 sm:p-3 rounded-full backdrop-blur-xl transition-all z-50 shadow-lg border-2 ${
          isDarkTheme ? 'bg-[#004D90]/50 hover:bg-[#004D90] text-[#00a1f2] border-[#00a1f2]/30 shadow-[0_0_15px_rgba(0,161,242,0.3)]' : 'bg-white/90 hover:bg-white text-[#004D90] border-[#00a1f2]/30 shadow-xl'
        }`}
        title={isDarkTheme ? 'Chuyển sang nền sáng' : 'Chuyển sang nền tối'}
      >
        {isDarkTheme ? (
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
        ) : (
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
        )}
      </button>

      <div className="relative z-10 w-full max-w-6xl flex flex-col items-center">
        {step === 1 ? (
          /* ========================================================= */
          /* BƯỚC 1: LỰA CHỌN ĐỊNH DANH & BRANDING                     */
          /* ========================================================= */
          <div className="w-full flex flex-col items-center animate-[fadeIn_0.6s_ease-out]">
            <div className="text-center mb-8 md:mb-12 w-full max-w-2xl px-4">
                <div className="inline-flex items-center justify-center p-4 md:p-5 rounded-[2rem] border bg-white/5 border-white/10 backdrop-blur-xl mb-6 shadow-[0_0_40px_rgba(0,161,242,0.2)]">
                    <img src={tngLogo} alt="Logo" className="w-12 h-12 md:w-16 md:h-16 object-contain drop-shadow-2xl" />
                </div>
                <h1 className={`text-4xl md:text-6xl font-black tracking-tighter mb-3 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>
                  NextGen <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00a1f2] to-[#004D90]">Meet</span>
                </h1>
                <p className={`text-sm md:text-base font-bold tracking-widest uppercase mb-4 ${isDarkTheme ? 'text-[#00a1f2]' : 'text-[#004D90]'}`}>
                  Hệ Thống NextGen
                </p>
                <p className={`text-sm md:text-lg font-medium leading-relaxed max-w-xl mx-auto ${isDarkTheme ? 'text-white/60' : 'text-slate-500'}`}>
                  Nền tảng giao tiếp trực tuyến nội bộ an toàn và bảo mật, phát triển độc quyền bởi Thanh Nguyên Group.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full max-w-4xl px-4 md:px-0">
                {/* Guest Tile */}
                <button 
                  onClick={() => { setActiveTab('join'); setStep(3); }} 
                  className={`group text-left p-6 md:p-8 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,161,242,0.15)] overflow-hidden relative ${isDarkTheme ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-[#00a1f2]/30' : 'bg-white/80 border-slate-200 hover:bg-white hover:border-[#00a1f2]/30 shadow-xl'}`}
                >
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-4 md:mb-6 transition-all duration-500 ${isDarkTheme ? 'bg-white/10 group-hover:bg-[#00a1f2]/20 text-white/70 group-hover:text-[#00a1f2]' : 'bg-slate-100 group-hover:bg-[#00a1f2]/10 text-slate-500 group-hover:text-[#00a1f2]'}`}>
                        <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <h3 className={`text-xl md:text-2xl font-black mb-2 md:mb-3 ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>Tham Gia Ngay</h3>
                    <p className={`text-xs md:text-sm leading-relaxed mb-6 md:mb-8 ${isDarkTheme ? 'text-white/50' : 'text-slate-500'}`}>Truy cập phòng họp trực tuyến NextGen mà không cần tạo tài khoản. Thích hợp cho khách mời, đối tác và ứng viên mới.</p>
                    <div className={`flex items-center text-sm font-bold opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 transform md:translate-x-[-10px] group-hover:translate-x-0 ${isDarkTheme ? 'text-[#00a1f2]' : 'text-[#004D90]'}`}>
                        Bắt đầu <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                </button>

                {/* Host Tile */}
                <button 
                  onClick={handleHostClick} 
                  className={`group text-left p-6 md:p-8 rounded-[2.5rem] border transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,77,144,0.3)] overflow-hidden relative ${isDarkTheme ? 'bg-[#004D90]/20 border-[#00a1f2]/30 hover:bg-[#004D90]/40' : 'bg-gradient-to-br from-[#004D90]/5 to-[#00a1f2]/10 border-[#00a1f2]/30 hover:bg-[#004D90]/10 shadow-xl'}`}
                >
                    <div className="absolute top-6 right-6">
                        <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-gradient-to-r from-[#004D90] to-[#00a1f2] text-white rounded-full shadow-lg">Secure Hub</span>
                    </div>
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-[#004D90] to-[#00a1f2] flex items-center justify-center mb-4 md:mb-6 shadow-lg shadow-[#00a1f2]/30 transition-transform duration-500 group-hover:scale-110">
                        <svg className="w-8 h-8 md:w-10 md:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    </div>
                    <h3 className={`text-xl md:text-2xl font-black mb-2 md:mb-3 ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>Quản Trị Viên</h3>
                    <p className={`text-xs md:text-sm leading-relaxed mb-6 md:mb-8 ${isDarkTheme ? 'text-white/50' : 'text-slate-600'}`}>Đăng nhập thông qua hệ sinh thái NextGen Hub. Được cấp toàn quyền khởi tạo, bảo mật và điều khiển phòng họp toàn diện.</p>
                    <div className={`flex items-center text-sm font-bold opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 transform md:translate-x-[-10px] group-hover:translate-x-0 ${isDarkTheme ? 'text-[#00a1f2]' : 'text-[#004D90]'}`}>
                        Đăng nhập Host <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                </button>
            </div>
          </div>
        ) : step === 2 ? (
          /* ========================================================= */
          /* BƯỚC 2: HOST AUTHENTICATION (ĐĂNG NHẬP HUB)                */
          /* ========================================================= */
          <div className="w-full max-w-md flex flex-col items-center animate-[slideUp_0.5s_ease-out]">
            <button onClick={() => setStep(1)} className={`mb-6 self-start flex items-center gap-2 text-sm font-bold transition-colors ${isDarkTheme ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
               Quay lại Trang Chủ
            </button>

            <div className={`w-full p-8 md:p-10 rounded-[2.5rem] border shadow-[0_30px_60px_rgba(0,0,0,0.4)] backdrop-blur-3xl ${cardClasses}`}>
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#004D90] to-[#00a1f2] flex items-center justify-center mb-6 shadow-[0_10px_20px_rgba(0,161,242,0.4)] relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl mix-blend-overlay"></div>
                  <svg className="w-8 h-8 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h2 className={`text-2xl font-black tracking-tight mb-2 ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>Xác Thực Bảo Mật</h2>
                <p className={`text-sm ${isDarkTheme ? 'text-white/60' : 'text-slate-500'}`}>Sử dụng tài khoản NextGen Hub</p>
              </div>

              {error && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start animate-[shake_0.5s_ease-in-out]">
                  <span className="mt-0.5 mr-3 text-red-500 text-xl">⚠️</span>
                  <p className="text-sm text-red-600 dark:text-red-400 font-bold leading-relaxed">{error}</p>
                </div>
              )}

              <form onSubmit={handleHostLogin} className="space-y-5">
                <div>
                  <label className={`block text-[11px] uppercase tracking-widest font-black mb-2.5 ${isDarkTheme ? 'text-[#00a1f2]' : 'text-[#004D90]'}`}>Email Định Danh</label>
                  <input
                    type="email"
                    value={hostEmail}
                    onChange={e => setHostEmail(e.target.value)}
                    placeholder="admin@thanhnguyen.group"
                    className={`w-full py-4 px-5 rounded-2xl border text-sm font-bold outline-none transition-all shadow-inner focus:ring-2 focus:ring-[#00a1f2]/50 ${inputBg}`}
                  />
                </div>
                <div className="relative">
                  <label className={`block text-[11px] uppercase tracking-widest font-black mb-2.5 ${isDarkTheme ? 'text-[#00a1f2]' : 'text-[#004D90]'}`}>Mật Mã Truy Cập</label>
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    value={hostPassword}
                    onChange={e => setHostPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full py-4 pl-5 pr-12 rounded-2xl border text-sm font-bold outline-none transition-all shadow-inner focus:ring-2 focus:ring-[#00a1f2]/50 ${inputBg}`}
                  />
                  <button type="button" onClick={() => setShowAdminPassword(!showAdminPassword)} className={`absolute right-4 bottom-[1.125rem] transition-colors p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 ${isDarkTheme ? 'text-[#00a1f2]/70 hover:text-[#00a1f2]' : 'text-[#004D90]/70 hover:text-[#004D90]'}`}>
                    {showAdminPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>

                {/* Remember Me Checkbox */}
                <label className={`flex items-center gap-3 cursor-pointer select-none py-1 ${isDarkTheme ? 'text-white/70 hover:text-white' : 'text-slate-600 hover:text-slate-800'} transition-colors`}>
                  <button
                    type="button"
                    onClick={() => setRememberMe(!rememberMe)}
                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                      rememberMe
                        ? 'bg-[#00a1f2] border-[#00a1f2]'
                        : isDarkTheme ? 'border-white/30 bg-white/5' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {rememberMe && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                  <span className="text-sm font-bold">Ghi nhớ Email đăng nhập</span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-4 py-4 px-6 rounded-2xl text-lg font-black text-white transition-all duration-300 transform hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,161,242,0.4)] hover:shadow-[0_15px_40px_rgba(0,161,242,0.6)] disabled:opacity-50 disabled:transform-none bg-gradient-to-r from-[#004D90] to-[#00a1f2] flex items-center justify-center gap-3 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 w-1/2 skew-x-12 -translate-x-full group-hover:animate-[shine_1s_ease]"></div>
                  {isLoading ? (
                    <><LoadingIcon className="w-6 h-6 animate-spin" fillColor="#ffffff" /> Đang Xác Thực...</>
                  ) : (
                    <>Mở Khóa Không Gian <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* BƯỚC 3: PHÒNG CHUẨN BỊ (THE GREEN ROOM)                   */
          /* ========================================================= */
          <div className="w-full flex flex-col items-center animate-[slideUp_0.5s_ease-out]">
            <div className="w-full flex justify-between items-center mb-4 md:mb-6">
                {!isGuestLink && (
                  <button onClick={() => setStep(1)} className={`flex items-center gap-2 text-sm font-bold transition-colors ${isDarkTheme ? 'text-white/50 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                     Quay lại
                  </button>
                )}
                <div className="flex-1"></div>
            </div>

            <div className={`w-full max-h-[90vh] md:max-h-[85vh] overflow-y-auto scrollBar backdrop-blur-3xl rounded-[2.5rem] border transition-all duration-500 flex flex-col lg:flex-row shadow-[0_30px_60px_rgba(0,0,0,0.4)] ${cardClasses}`}>
              
              {/* === CỘT TRÁI: GƯƠNG CAMERA === */}
              <div className={`w-full lg:w-[45%] p-4 md:p-6 flex flex-col justify-center border-b lg:border-b-0 lg:border-r relative ${isDarkTheme ? 'border-white/10' : 'border-slate-200/80'}`}>
                
                {/* Viewport Camera */}
                <div className="w-full aspect-video bg-black/90 rounded-[2rem] overflow-hidden relative shadow-2xl ring-1 ring-white/10 flex items-center justify-center group">
                   {selectedVideoDevice && !showAdvancedCamera ? (
                      <WebcamPreview deviceId={selectedVideoDevice} />
                   ) : (
                      <div className="flex flex-col items-center justify-center text-white/50 space-y-4">
                         {showAdvancedCamera ? (
                           <>
                             <svg className="w-10 h-10 md:w-14 md:h-14 stroke-[1.5] text-[#00a1f2] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                             <span className="text-xs md:text-sm font-bold text-[#00a1f2] tracking-wide">Đang Tinh Chỉnh...</span>
                           </>
                         ) : (
                           <>
                             <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                               <svg className="w-8 h-8 md:w-10 md:h-10 stroke-[1.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" className="stroke-2 text-red-500" d="M3 3l18 18" /></svg>
                             </div>
                             <span className="text-xs md:text-sm font-bold tracking-widest uppercase text-white/30">Camera Tắt</span>
                           </>
                         )}
                      </div>
                   )}

                   {/* Audio Sóng âm đứng hông trái */}
                   {selectedAudioDevice && (
                      <div className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 flex flex-col justify-end gap-1.5 z-10 opacity-90 transition-opacity h-32 md:h-40">
                        {Array.from({ length: 20 }).map((_, idx) => {
                           // Render from top to bottom, so index 19 is bottom, 0 is top
                           const activeIndex = 19 - idx; 
                           const isActive = activeIndex < Math.floor(micLevel / 5);
                           // Width animates when active
                           const width = isActive ? Math.max(8, Math.random() * 24) : 4;
                           return (
                             <div
                               key={idx}
                               className={`h-1 md:h-1.5 rounded-full transition-all duration-75 self-start ${
                                 isActive
                                   ? 'bg-[#00a1f2] shadow-[0_0_8px_rgba(0,161,242,0.8)]'
                                   : 'bg-white/30'
                               }`}
                               style={{ width: isActive ? `${width}px` : '4px' }}
                             />
                           );
                         })}
                      </div>
                   )}

                   {/* Toggles điều khiển (Top Right) */}
                   <div className="absolute top-4 md:top-5 right-4 md:right-5 flex flex-row gap-2 z-20 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <button 
                        onClick={(e) => { e.preventDefault(); selectedAudioDevice ? disableMic() : enableMediaDevices('audio'); }}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all hover:scale-105 active:scale-95 ${!selectedAudioDevice ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-slate-900/80 border-slate-700 text-white shadow-lg hover:bg-slate-800'}`}
                      >
                        {!selectedAudioDevice ? (
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 3l18 18" /></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        )}
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); selectedVideoDevice ? disableWebcam() : enableMediaDevices('video'); }}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all hover:scale-105 active:scale-95 ${!selectedVideoDevice ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/40' : 'bg-slate-900/80 border-slate-700 text-white shadow-lg hover:bg-slate-800'}`}
                      >
                        {selectedVideoDevice ? (
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 3l18 18" /></svg>
                        )}
                      </button>
                      {selectedVideoDevice && (
                        <button 
                          onClick={(e) => { e.preventDefault(); setShowAdvancedCamera(true); }}
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all hover:scale-105 active:scale-95 bg-[#004D90]/90 border-[#00a1f2]/50 text-white shadow-lg shadow-[#00a1f2]/20 hover:bg-[#004D90]"
                          title="Hiệu ứng Hình ảnh"
                        >
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                        </button>
                      )}
                   </div>
                </div>

                {/* Chọn Thiết bị Nhanh */}
                <div className="mt-4 md:mt-6 flex flex-col gap-2 md:gap-3">
                   <div className="relative w-full">
                     <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkTheme ? 'text-white/40' : 'text-slate-400'}`}>
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                     </span>
                     <select 
                       className={`w-full py-3.5 pl-12 pr-4 rounded-2xl text-xs font-bold outline-none transition-all shadow-inner appearance-none ${isDarkTheme ? 'bg-black/30 border-white/10 text-white hover:bg-black/40 border' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 border'}`} 
                       value={selectedAudioDevice} 
                       onChange={e => setSelectedAudioDevice(e.target.value)}
                     >
                       <option value="" className="text-slate-500">Microphone đang tắt</option>
                       {audioDevices.map(d => <option key={d.id} value={d.id} className={isDarkTheme ? 'bg-slate-800' : 'bg-white'}>{d.label}</option>)}
                     </select>
                   </div>
                   <div className="relative w-full">
                     <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkTheme ? 'text-white/40' : 'text-slate-400'}`}>
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                     </span>
                     <select 
                       className={`w-full py-3.5 pl-12 pr-4 rounded-2xl text-xs font-bold outline-none transition-all shadow-inner appearance-none ${isDarkTheme ? 'bg-black/30 border-white/10 text-white hover:bg-black/40 border' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 border'}`} 
                       value={selectedVideoDevice} 
                       onChange={e => setSelectedVideoDevice(e.target.value)}
                     >
                       <option value="" className="text-slate-500">Camera đang tắt</option>
                       {videoDevices.map(d => <option key={d.id} value={d.id} className={isDarkTheme ? 'bg-slate-800' : 'bg-white'}>{d.label}</option>)}
                     </select>
                   </div>
                   
                   {/* Audio processing toggles */}
                   <div className="grid grid-cols-2 gap-3 md:gap-4 mb-2">
                     <div className={`flex justify-between items-center p-3 rounded-xl border transition-colors cursor-pointer ${isDarkTheme ? (isNoiseCancellationEnabled ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-white/5 border-white/10') : (isNoiseCancellationEnabled ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200')}`} onClick={() => setIsNoiseCancellationEnabled(!isNoiseCancellationEnabled)}>
                       <span className={`text-[10px] md:text-xs font-bold select-none leading-tight ${isDarkTheme ? (isNoiseCancellationEnabled ? 'text-indigo-400' : 'text-white/60') : (isNoiseCancellationEnabled ? 'text-indigo-600' : 'text-slate-600')}`}>
                         Lọc tiếng ồn nền
                       </span>
                       <button type="button" className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full transition-colors ${isNoiseCancellationEnabled ? 'bg-indigo-500' : isDarkTheme ? 'bg-slate-700' : 'bg-slate-300'}`}>
                         <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${isNoiseCancellationEnabled ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                       </button>
                     </div>
                     
                     <div className={`flex justify-between items-center p-3 rounded-xl border transition-colors cursor-pointer ${isDarkTheme ? (isHighFidelityAudio ? 'bg-indigo-500/20 border-indigo-500/30' : 'bg-white/5 border-white/10') : (isHighFidelityAudio ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200')}`} onClick={() => setIsHighFidelityAudio(!isHighFidelityAudio)}>
                       <span className={`text-[10px] md:text-xs font-bold select-none leading-tight ${isDarkTheme ? (isHighFidelityAudio ? 'text-indigo-400' : 'text-white/60') : (isHighFidelityAudio ? 'text-indigo-600' : 'text-slate-600')}`}>
                         Âm thanh gốc (Stereo)
                       </span>
                       <button type="button" className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full transition-colors ${isHighFidelityAudio ? 'bg-indigo-500' : isDarkTheme ? 'bg-slate-700' : 'bg-slate-300'}`}>
                         <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${isHighFidelityAudio ? 'translate-x-[18px]' : 'translate-x-[2px]'}`} />
                       </button>
                     </div>
                   </div>
                </div>
              </div>

              {/* === CỘT PHẢI: FORM === */}
              <div className={`w-full lg:w-[55%] p-4 md:p-5 flex flex-col relative ${isDarkTheme ? 'bg-black/10' : 'bg-slate-50/50'}`}>
                 <div className="mb-4 flex items-center justify-between">
                    <h2 className={`text-lg md:text-2xl font-black tracking-tight flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
                      <svg className="w-5 h-5 md:w-6 md:h-6 text-[#00a1f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      Thiết Lập
                    </h2>
                    
                    {/* Compact Host Profile Header & Logout */}
                    <div className="flex items-center gap-2">
                      {activeTab === 'host' ? (
                        <>
                          <div className={`flex items-center gap-2 p-1 pr-3 rounded-full border shadow-sm transition-all hover:ring-1 hover:ring-[#00a1f2]/50 ${isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                             <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden border ${isDarkTheme ? 'border-[#00a1f2]/50' : 'border-[#004D90]/50'}`}>
                               {hostAvatar ? (
                                 <img src={hostAvatar} alt="Avatar" className="w-full h-full object-cover" />
                               ) : (
                                 <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#004D90] to-[#00a1f2] text-white">
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                 </div>
                               )}
                             </div>
                             <input
                               type="text"
                               value={userName}
                               onChange={e => setUserName(e.target.value)}
                               className={`w-full min-w-[100px] max-w-[200px] bg-transparent text-[11px] md:text-xs font-black tracking-wide outline-none ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}
                               title="Đổi tên hiển thị"
                               placeholder="Tên Host"
                             />
                          </div>
                          <button type="button" onClick={handleLogout} title="Đăng xuất Hub" className={`p-2 md:p-2.5 rounded-full border transition-colors shadow-sm ${isDarkTheme ? 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20' : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'}`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('host');
                            setStep(2);
                          }}
                          title="Đăng nhập tài khoản Hub để vào với quyền Co-Host"
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-inner transition-all hover:scale-105 active:scale-95 cursor-pointer ${isDarkTheme ? 'bg-[#00a1f2]/10 text-[#00a1f2] border border-[#00a1f2]/20 hover:bg-[#00a1f2]/20' : 'bg-[#00a1f2]/10 text-[#00a1f2] border border-[#00a1f2]/20 hover:bg-[#00a1f2]/20'}`}
                        >
                           Khách Mời
                           <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                        </button>
                      )}
                    </div>
                 </div>
                 
                 {error && (
                   <div className="mb-4 md:mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start animate-[shake_0.5s_ease-in-out]">
                     <span className="mt-0.5 mr-3 text-red-500 text-xl">⚠️</span>
                     <p className="text-xs md:text-sm text-red-600 dark:text-red-400 font-bold leading-relaxed">{error}</p>
                   </div>
                 )}

                 <form onSubmit={handleJoin} className="space-y-5 flex-1 flex flex-col justify-center">
                   {/* TAB KHÁCH MỜI */}
                   {activeTab === 'join' && (
                     <>
                       {isGuestLink ? (
                         <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden ${isDarkTheme ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                           <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00a1f2]"></div>
                           <p className={`text-[10px] uppercase tracking-widest font-black ${isDarkTheme ? 'text-white/40' : 'text-slate-400'} mb-1.5`}>ID Phòng</p>
                           <p className={`text-lg md:text-xl font-bold break-words ${isDarkTheme ? 'text-white' : 'text-slate-800'} tracking-tight`}>{roomId}</p>
                         </div>
                       ) : (
                         <div>
                           <label className={`block text-[11px] uppercase tracking-widest font-black mb-2 ${isDarkTheme ? 'text-[#00a1f2]' : 'text-[#004D90]'}`}>Mã Phòng / Link</label>
                           <input
                             type="text"
                             value={roomId}
                             onChange={e => setRoomId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                             placeholder="Nhập ID Phòng họp..."
                             className={`w-full py-4 px-5 rounded-2xl border text-sm font-semibold outline-none transition-all shadow-inner focus:ring-2 focus:ring-[#00a1f2]/50 ${inputBg}`}
                           />
                         </div>
                       )}
                       
                       <div>
                         <label className={`block text-[11px] uppercase tracking-widest font-black mb-2 ${isDarkTheme ? 'text-[#00a1f2]' : 'text-[#004D90]'}`}>Tên Hiển Thị</label>
                         <input
                           type="text"
                           value={userName}
                           onChange={e => setUserName(e.target.value)}
                           placeholder="Ví dụ: Nguyễn Văn A"
                           className={`w-full py-4 px-5 rounded-2xl border text-sm font-bold outline-none transition-all shadow-inner focus:ring-2 focus:ring-[#00a1f2]/50 ${inputBg}`}
                         />
                       </div>

                       <div className={`transition-all duration-300 overflow-hidden relative ${isPasswordRequired ? 'max-h-32 opacity-100 mt-4' : 'max-h-0 opacity-0 m-0'}`}>
                         <label className="block text-[11px] uppercase tracking-widest font-black mb-2 text-red-500">Mật Khẩu Bảo Vệ</label>
                         <input
                           type={showPassword ? 'text' : 'password'}
                           value={roomPassword}
                           onChange={e => setRoomPassword(e.target.value)}
                           placeholder="Phòng này yêu cầu mật khẩu..."
                           className={`w-full py-4 pl-5 pr-12 rounded-2xl border text-sm font-bold outline-none transition-all shadow-inner focus:ring-2 focus:ring-red-500/50 ${isDarkTheme ? 'bg-red-500/10 border-red-500/30 text-white placeholder-red-300/50' : 'bg-red-50 border-red-300 text-slate-800 placeholder-red-300'}`}
                         />
                         <button type="button" onClick={() => setShowPassword(!showPassword)} className={`absolute right-4 bottom-[1.125rem] transition-colors p-1 rounded-full ${isDarkTheme ? 'text-red-400/70 hover:text-red-400' : 'text-red-600/70 hover:text-red-600'}`}>
                           {showPassword ? (
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                           ) : (
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                           )}
                         </button>
                       </div>
                     </>
                   )}

                   {/* TAB QUẢN TRỊ VIÊN */}
                   {activeTab === 'host' && (
                     <>

                       {/* THIẾT LẬP PHÒNG CHUYÊN NGHIỆP */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3.5">
                         {/* Room ID + History Dropdown */}
                         <div className="relative z-20">
                           <div className="flex justify-between items-end mb-1">
                             <label className={`block text-[9px] md:text-[10px] uppercase tracking-widest font-black ${isDarkTheme ? 'text-[#00a1f2]' : 'text-[#004D90]'}`}>ID Phòng Mới</label>
                             {!isGuestLink && recentRooms.length > 0 && (
                               <button 
                                 type="button" 
                                 onClick={() => setShowRecentRooms(!showRecentRooms)}
                                 className={`flex items-center gap-1 text-[9px] uppercase font-bold hover:underline ${isDarkTheme ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
                               >
                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                 Lịch sử {showRecentRooms ? '▲' : '▼'}
                               </button>
                             )}
                           </div>
                           <div className="flex gap-1.5">
                             <div className={`flex-1 flex items-center pl-3 rounded-xl border shadow-inner focus-within:ring-2 focus-within:ring-[#00a1f2]/50 transition-all ${isGuestLink ? (isDarkTheme ? 'bg-white/5 border-white/10 text-white/50 cursor-not-allowed' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed') : inputBg}`}>
                               <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                               <input
                                 type="text"
                                 value={roomId}
                                 readOnly={isGuestLink}
                                 onChange={e => setRoomId(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                 placeholder="hop-kinh-doanh"
                                 className="w-full py-2.5 px-2 bg-transparent text-xs md:text-sm font-bold outline-none"
                               />
                             </div>
                             {!isGuestLink && (
                               <button type="button" onClick={handleGenerateRandom} title="Tạo ID ngẫu nhiên" className={`flex-shrink-0 w-10 h-[42px] rounded-xl border-2 flex items-center justify-center transition-all ${isDarkTheme ? 'border-[#00a1f2]/50 bg-[#004D90]/30 text-white hover:bg-[#004D90]/50' : 'border-[#00a1f2]/30 bg-[#00a1f2]/10 text-[#004D90] hover:bg-[#00a1f2]/20'}`}>
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                               </button>
                             )}
                           </div>
                           
                           {/* Recent Rooms Dropdown */}
                           {showRecentRooms && recentRooms.length > 0 && (
                             <div className={`absolute top-[4rem] left-0 right-0 rounded-xl border shadow-2xl overflow-hidden max-h-48 overflow-y-auto z-50 ${isDarkTheme ? 'bg-slate-800 border-white/10' : 'bg-white border-slate-200'}`}>
                               {recentRooms.map((r) => (
                                 <div key={r.roomId} className={`flex items-center justify-between p-2.5 border-b last:border-b-0 cursor-pointer transition-colors ${isDarkTheme ? 'border-white/10 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`} onClick={() => {
                                   setRoomId(r.roomId);
                                   if (r.roomTitle) setRoomTitle(r.roomTitle);
                                   if (r.roomPassword) setRoomPassword(r.roomPassword);
                                   if (r.adminPassword) setAdminPassword(r.adminPassword);
                                   if (r.isWaitingRoomEnabled !== undefined) setIsWaitingRoomEnabled(r.isWaitingRoomEnabled);
                                   if (r.roomMode) setRoomMode(r.roomMode);
                                   setShowRecentRooms(false);
                                 }}>
                                   <div>
                                     <p className={`text-xs font-bold flex items-center gap-2 ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>
                                       <svg className="w-3 h-3 text-[#00a1f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                                       {r.roomId}
                                     </p>
                                   </div>
                                   <button type="button" onClick={(e) => { e.stopPropagation(); setRecentRooms(removeRecentRoom(r.roomId)); }} className={`p-1 rounded-md hover:bg-red-500 hover:text-white transition-colors ${isDarkTheme ? 'text-white/30' : 'text-slate-300'}`}>
                                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                   </button>
                                 </div>
                               ))}
                             </div>
                           )}
                         </div>

                         <div>
                           <label className={`block text-[9px] md:text-[10px] uppercase tracking-widest font-black mb-1 ${isDarkTheme ? 'text-[#00a1f2]' : 'text-[#004D90]'}`}>Chủ đề (Tùy chọn)</label>
                           <div className={`flex items-center pl-3 rounded-xl border shadow-inner focus-within:ring-2 focus-within:ring-[#00a1f2]/50 transition-all ${inputBg}`}>
                             <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                             <input
                               type="text"
                               value={roomTitle}
                               onChange={e => setRoomTitle(e.target.value)}
                               placeholder="Họp chiến lược..."
                               className="w-full py-2.5 px-2 bg-transparent text-xs md:text-sm font-semibold outline-none"
                             />
                           </div>
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4 mb-3.5">
                           {/* Mật khẩu phòng */}
                           <div className="relative">
                               <label className={`block text-[9px] md:text-[10px] uppercase tracking-widest font-black mb-1 flex items-center gap-1 ${isDarkTheme ? 'text-amber-400' : 'text-amber-600'}`}>
                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                 Mật Khẩu Khách
                               </label>
                               <div className={`flex items-center pl-3 rounded-xl border shadow-inner focus-within:ring-2 focus-within:ring-amber-500/50 transition-all ${inputBg}`}>
                                 <input
                                   type={showPassword ? 'text' : 'password'}
                                   value={roomPassword}
                                   onChange={e => setRoomPassword(e.target.value)}
                                   placeholder="Trống nếu mở tự do"
                                   className="w-full py-2.5 px-1 bg-transparent text-xs md:text-sm font-bold outline-none"
                                 />
                                 <button type="button" onClick={() => setShowPassword(!showPassword)} className={`px-3 py-2 transition-colors ${isDarkTheme ? 'text-amber-400/70 hover:text-amber-400' : 'text-amber-600/70 hover:text-amber-600'}`}>
                                   {showPassword ? (
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                   ) : (
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                   )}
                                 </button>
                               </div>
                           </div>
                           {/* Mật khẩu Quản trị */}
                           <div className="relative">
                               <label className={`block text-[9px] md:text-[10px] uppercase tracking-widest font-black mb-1 flex items-center gap-1 ${isDarkTheme ? 'text-rose-400' : 'text-rose-600'}`}>
                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                 Mật Khẩu Co-Host
                               </label>
                               <div className={`flex items-center pl-3 rounded-xl border shadow-inner focus-within:ring-2 focus-within:ring-rose-500/50 transition-all ${inputBg}`}>
                                 <input
                                   type={showAdminPassword ? 'text' : 'password'}
                                   value={adminPassword}
                                   onChange={e => setAdminPassword(e.target.value)}
                                   placeholder="Quyền quản trị..."
                                   className="w-full py-2.5 px-1 bg-transparent text-xs md:text-sm font-bold outline-none"
                                 />
                                 <button type="button" onClick={() => setShowAdminPassword(!showAdminPassword)} className={`px-3 py-2 transition-colors ${isDarkTheme ? 'text-rose-400/70 hover:text-rose-400' : 'text-rose-600/70 hover:text-rose-600'}`}>
                                   {showAdminPassword ? (
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                   ) : (
                                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                   )}
                                 </button>
                               </div>
                           </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4 mb-2.5">
                         {/* Chế độ phân phối */}
                         <div className="flex flex-col">
                           <label className={`block text-[9px] md:text-[10px] uppercase tracking-widest font-black mb-1 flex items-center gap-1 ${isDarkTheme ? 'text-[#00a1f2]' : 'text-[#004D90]'}`}>
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                             Phân Phối
                           </label>
                           <div className={`flex w-full p-1 rounded-xl shadow-inner h-[42px] ${isDarkTheme ? 'bg-black/30 ring-1 ring-white/10' : 'bg-slate-200/60'}`}>
                             <button type="button" onClick={() => setRoomMode('meeting')} className={`flex-1 flex gap-1.5 items-center justify-center rounded-lg transition-all text-[11px] md:text-xs font-bold ${roomMode === 'meeting' ? (isDarkTheme ? 'bg-[#004D90] text-white shadow' : 'bg-[#004D90] text-white shadow') : (isDarkTheme ? 'text-white/40 hover:text-white/80 hover:bg-white/5' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50')}`}>
                               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                               Họp
                             </button>
                             <button type="button" onClick={() => setRoomMode('webinar')} className={`flex-1 flex gap-1.5 items-center justify-center rounded-lg transition-all text-[11px] md:text-xs font-bold ${roomMode === 'webinar' ? (isDarkTheme ? 'bg-amber-600 text-white shadow' : 'bg-amber-500 text-white shadow') : (isDarkTheme ? 'text-white/40 hover:text-white/80 hover:bg-white/5' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50')}`}>
                               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                               Webinar
                             </button>
                           </div>
                         </div>
                         
                         {/* Duyệt Khách */}
                         <div className="flex flex-col">
                           <label className={`block text-[9px] md:text-[10px] uppercase tracking-widest font-black mb-1 flex items-center gap-1 ${isDarkTheme ? 'text-amber-500' : 'text-amber-600'}`}>
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                             Bảo Mật
                           </label>
                           <div className={`flex items-center justify-between px-3 h-[42px] rounded-xl border transition-colors cursor-pointer ${isDarkTheme ? (isWaitingRoomEnabled ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/10') : (isWaitingRoomEnabled ? 'bg-amber-50 border-amber-200' : 'bg-slate-100 border-slate-200')}`} onClick={() => setIsWaitingRoomEnabled(!isWaitingRoomEnabled)}>
                             <span className={`text-[11px] md:text-xs font-black select-none uppercase tracking-wide flex items-center gap-1.5 ${isDarkTheme ? (isWaitingRoomEnabled ? 'text-amber-500' : 'text-white/80') : (isWaitingRoomEnabled ? 'text-amber-700' : 'text-slate-700')}`}>
                               Duyệt Khách
                             </span>
                             <button type="button" className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full transition-colors border-2 border-transparent ${isWaitingRoomEnabled ? 'bg-[#00a1f2]' : isDarkTheme ? 'bg-slate-700' : 'bg-slate-300'}`}>
                               <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${isWaitingRoomEnabled ? 'translate-x-[16px]' : 'translate-x-[0px]'}`} />
                             </button>
                           </div>
                         </div>
                       </div>
                     </>
                   )}

                   {/* NÚT SUBMIT */}
                   <div className="pt-4 flex gap-3">
                     <button
                       type="submit"
                       disabled={isLoading}
                       className={`flex-1 py-3.5 px-6 rounded-2xl text-base md:text-lg font-black text-white transition-all duration-300 transform hover:-translate-y-1 shadow-[0_10px_30px_rgba(0,161,242,0.4)] hover:shadow-[0_15px_40px_rgba(0,161,242,0.6)] disabled:opacity-50 disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2 relative overflow-hidden ${
                         activeTab === 'host' ? 'bg-gradient-to-r from-[#004D90] to-[#00a1f2]' : 'bg-gradient-to-r from-[#00a1f2] to-cyan-500'
                       }`}
                     >
                       <div className="absolute inset-0 bg-white/20 w-1/2 skew-x-12 -translate-x-full group-hover:animate-[shine_1s_ease]"></div>
                       {isLoading ? (
                         <><LoadingIcon className="w-6 h-6 animate-spin" fillColor="#ffffff" /> <span>Đang xử lý...</span></>
                       ) : (
                         <><span>{activeTab === 'host' ? 'Khởi Tạo Không Gian' : 'Vào Phòng'}</span> <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>
                       )}
                     </button>
                     
                     {activeTab === 'host' && (
                       <button
                         type="button"
                         onClick={handleShowShareLink}
                         className={`w-14 md:w-16 flex items-center justify-center rounded-2xl border-2 transition-all duration-300 hover:-translate-y-1 shadow-lg active:translate-y-1 active:shadow-none ${
                           isDarkTheme ? 'border-[#00a1f2]/30 bg-[#00a1f2]/10 hover:bg-[#00a1f2]/20 text-[#00a1f2]' : 'border-[#004D90]/20 bg-[#00a1f2]/10 hover:bg-[#00a1f2]/20 text-[#004D90]'
                         }`}
                         title="Chia sẻ Link Mời Khách"
                       >
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                       </button>
                     )}
                   </div>
                 </form>
              </div>
            </div>
          </div>
        )}
      </div>

      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className={`border rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl ${isDarkTheme ? 'bg-slate-900 border-white/20' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-lg md:text-xl font-bold mb-4 md:mb-6 ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>Chia sẻ lời mời</h3>
            <div className="flex gap-2 md:gap-3">
              <input type="text" readOnly value={shareLink} className={`flex-1 min-w-0 px-3 md:px-4 py-2.5 md:py-3 rounded-xl border text-xs md:text-sm font-medium outline-none ${isDarkTheme ? 'bg-white/5 border-white/20 text-white' : 'bg-slate-50 border-slate-300 text-slate-700'}`} />
              <button title="Chép" onClick={handleCopyLink} className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-white text-xs md:text-sm font-bold shadow-md transition-transform active:scale-95 ${isDarkTheme ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-[#004D90] hover:bg-[#00a1f2]'}`}>
                {copied ? '✅' : 'Copy'}
              </button>
            </div>
            <button onClick={() => setShowShareModal(false)} className={`mt-4 md:mt-6 w-full py-2.5 md:py-3 rounded-xl border transition-all text-xs md:text-sm font-bold ${isDarkTheme ? 'border-white/20 text-white/80 hover:text-white hover:bg-white/5' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
              Đóng
            </button>
          </div>
        </div>
      )}

      {/* Advanced Camera Modal */}
      {showAdvancedCamera && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className={`w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh] ${isDarkTheme ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}>
            <div className={`p-5 border-b flex justify-between items-center flex-shrink-0 ${isDarkTheme ? 'border-white/10' : 'border-slate-100'}`}>
              <h2 className={`text-base md:text-lg font-black ${isDarkTheme ? 'text-white' : 'text-slate-800'}`}>✨ Tùy chỉnh Nâng cao</h2>
              <button onClick={() => setShowAdvancedCamera(false)} className={`p-2.5 rounded-full transition-colors ${isDarkTheme ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto scrollBar flex-1">
              <WebcamSettings deviceId={selectedVideoDevice} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeDashboard;
