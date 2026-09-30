import React, { useEffect, useState } from 'react';

export interface IErrorPageProps {
  title: string;
  text: string;
}

const ErrorPage = ({ title, text }: IErrorPageProps) => {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (countdown === 0) {
      window.location.href = window.location.origin;
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <div
      id="errorPage"
      className="error-page h-screen w-full flex items-center justify-center relative p-4 bg-slate-50 dark:bg-[#0d1117] selection:bg-[#00a1f2]/30"
    >
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-br from-[#00a1f2]/10 to-transparent blur-[100px] opacity-50 dark:opacity-20 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-gradient-to-tl from-indigo-500/10 to-transparent blur-[100px] opacity-50 dark:opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="content relative z-20 w-full max-w-md flex flex-col items-center text-center rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden bg-white/80 dark:bg-[#161b22]/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-10 transform transition-all hover:scale-[1.01]">
        
        {/* Icon Container */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-[#00a1f2] blur-xl opacity-20 rounded-full animate-pulse"></div>
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#004D90] to-[#00a1f2] flex items-center justify-center shadow-lg shadow-[#00a1f2]/30 text-white">
             {/* Dynamic Icon based on title. If it's an error, maybe a different icon, but typically it's just 'left room' */}
             {title.toLowerCase().includes('lỗi') ? (
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
             ) : (
               <svg className="w-10 h-10 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             )}
          </div>
        </div>

        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-3 tracking-tight">
          {title}
        </h2>
        
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 mb-10 px-4">
          {text}
        </p>
        
        <div className="flex flex-col items-center gap-4 w-full">
          <button 
            onClick={() => window.location.href = window.location.origin}
            className="w-full py-3.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white text-[13px] font-black uppercase tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Quay lại trang chủ ngay
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
          
          <div className="flex items-center gap-2 mt-2 opacity-60">
            <svg className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
              Tự động chuyển hướng sau {countdown}s
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;

