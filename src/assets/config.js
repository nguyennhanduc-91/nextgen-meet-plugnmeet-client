window.plugNmeetConfig = {
  // 1. ĐỊA CHỈ SERVER API (Bắt buộc phải chính xác)
  // Đây là nơi Client sẽ gửi Token lên để xác thực
  serverUrl: "https://api-meet.thanhnguyen.group",

  // API Credentials cho plugNmeet (Tự động vào phòng)
  plugNmeetApiKey: "plugnmeet",
  plugNmeetApiSecret: "macqsec123",

  // Cấu hình Supabase (Liên kết từ NextGen Hub)
  supabase: {
    url: "https://qlvjvthezyeuyeitlxig.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdmp2dGhlenlldXllaXRseGlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1Nzk3MTksImV4cCI6MjA2MTE1NTcxOX0.YvIpW2J2eQkLrD8SWj1HCU9gQDiA-L9j5XvAkVX5sno"
  },

  // =======================================================
  // PHẦN BÊN DƯỚI LÀ TÙY CHỈNH GIAO DIỆN (UI/UX) CHO THƯƠNG HIỆU
  // (Bạn có thể sửa lại màu sắc theo màu của Thanh Nguyên Group)
  // =======================================================

  theme: {
    // Chế độ sáng/tối (light/dark)
    defaultTheme: "light",
  },

  designCustomization: {
    // Link ảnh Logo hiển thị trong phòng họp (để trống sẽ dùng logo gốc)
    custom_logo: "", 
    primary_color: '#004D90', // Deep Blue
    primary_btn_bg_color: '#00a1f2', // Sky Blue
    primary_btn_text_color: '#ffffff',
    header_bg_color: '#004D90',
    side_panel_bg_color: '#00a1f2',
  },

  // Cài đặt ngôn ngữ mặc định (ví dụ: 'vi-VN' cho tiếng Việt, 'en' cho tiếng Anh)
  defaultLanguage: "vi-VN",

  // Cấu hình âm thanh/video mặc định khi vừa vào phòng
  defaultSettings: {
    audio_video: {
      is_mic_muted: false,      // Tự động mở mic khi mới vào
      is_camera_muted: false,   // Tự động mở cam khi mới vào
    },
  },
  
  // Tùy chỉnh các module hiển thị
  modules: {
    chat: {
      enabled: true,           // Bật tính năng Chat
    },
    whiteboard: {
      enabled: true,           // Bật tính năng Bảng trắng
    },
    screen_share: {
      enabled: true,           // Bật tính năng Chia sẻ màn hình
    },
  },

  // =======================================================
  // CẤU HÌNH CHẤT LƯỢNG CUỘC HỌP CAO CẤP (PREMIUM QUALITY)
  // =======================================================

  // Simulcast: Người gửi phát đồng thời 4 tầng chất lượng (90p, 180p, 360p, 720p).
  // Server tự chọn tầng phù hợp nhất cho mỗi người xem → không cần transcode.
  // BẮT BUỘC BẬT cho phòng >10 người.
  enableSimulcast: true,

  // Dynacast: Server tự động NGỪNG gửi video của người mà không ai xem.
  // Tiết kiệm ~60% băng thông cho phòng lớn.
  // BẮT BUỘC BẬT cho phòng >50 người.
  enableDynacast: true,

  // Adaptive Stream: Tự động điều chỉnh chất lượng video theo kích thước hiển thị.
  // Thumbnail nhỏ → nhận 90p. Phóng to → tự chuyển sang 720p HD.
  enableAdaptiveStream: true,

  // Video Codec: VP9 tiết kiệm ~30% băng thông so với VP8 mà giữ nguyên chất lượng.
  // Hỗ trợ trên Chrome, Edge, Firefox, Safari 16+.
  videoCodec: 'vp9',

  // Độ phân giải camera mặc định (h720 = 1280×720 HD)
  // Hỗ trợ: h90, h180, h216, h360, h540, h720, h1080, h1440, h2160
  defaultWebcamResolution: 'h720',

  // Chia sẻ màn hình Full HD 15fps (tối ưu cho trình chiếu slide + demo)
  defaultScreenShareResolution: 'h1080fps15',

  // Audio preset: 'music' cho chất lượng cao nhất (48kbps Opus)
  defaultAudioPreset: 'music',
};
