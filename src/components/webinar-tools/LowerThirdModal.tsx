import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { updateActiveLowerThird, updateLowerThirdAutomation } from '../../store/slices/roomSettingsSlice';
import { getNatsConn } from '../../helpers/nats';
import { DataMsgBodyType } from 'plugnmeet-protocol-js';

interface LowerThirdModalProps {
  onClose: () => void;
}

const LowerThirdModal = ({ onClose }: LowerThirdModalProps) => {
  const dispatch = useAppDispatch();
  const currentLT = useAppSelector((s) => s.roomSettings.activeLowerThird);
  const automationState = useAppSelector((s) => s.roomSettings.lowerThirdAutomation);
  const [name, setName] = useState(automationState?.name || currentLT?.name || sessionStorage.getItem('draft_lt_name') || '');
  const [title, setTitle] = useState(automationState?.title || currentLT?.title || sessionStorage.getItem('draft_lt_title') || '');
  const [delaySec, setDelaySec] = useState(automationState ? automationState.delaySec.toString() : sessionStorage.getItem('draft_lt_delay') || '60');
  const [durationSec, setDurationSec] = useState(automationState ? automationState.durationSec.toString() : sessionStorage.getItem('draft_lt_duration') || '10');
  
  // Persist drafts locally if modal is closed without showing
  useEffect(() => {
    sessionStorage.setItem('draft_lt_name', name);
    sessionStorage.setItem('draft_lt_title', title);
    sessionStorage.setItem('draft_lt_delay', delaySec);
    sessionStorage.setItem('draft_lt_duration', durationSec);
  }, [name, title, delaySec, durationSec]);
  
  const isLive = !!currentLT;
  const isAutoLoop = !!automationState?.enabled;

  const broadcast = (payload: { name: string; title?: string } | null) => {
    try {
      const conn = getNatsConn();
      const data = JSON.stringify({ type: 'WEBINAR_LOWER_THIRD', payload });
      conn.sendDataMessage(DataMsgBodyType.INFO, data);
    } catch (e) {
      console.error('Lower Third broadcast error:', e);
    }
    dispatch(updateActiveLowerThird(payload));
  };

  const handleShow = () => {
    if (!name.trim()) return;
    broadcast({ name: name.trim(), title: title.trim() || undefined });
    
    // If auto-loop is enabled, we should also update the automation settings 
    // to make sure changes to delay/duration are saved.
    if (isAutoLoop) {
      const parsedDelay = parseInt(delaySec, 10);
      const parsedDuration = parseInt(durationSec, 10);
      dispatch(
        updateLowerThirdAutomation({
          enabled: true,
          name: name.trim(),
          title: title.trim(),
          delaySec: isNaN(parsedDelay) || parsedDelay < 1 ? 5 : parsedDelay,
          durationSec: isNaN(parsedDuration) || parsedDuration < 5 ? 10 : parsedDuration,
        }),
      );
    }
  };

  const handleHide = () => {
    broadcast(null);
  };

  const handleToggleAutomation = () => {
    if (!name.trim()) return;
    if (isAutoLoop) {
      dispatch(updateLowerThirdAutomation(undefined));
    } else {
      const parsedDelay = parseInt(delaySec, 10);
      const parsedDuration = parseInt(durationSec, 10);
      dispatch(
        updateLowerThirdAutomation({
          enabled: true,
          name: name.trim(),
          title: title.trim(),
          delaySec: isNaN(parsedDelay) || parsedDelay < 1 ? 5 : parsedDelay,
          durationSec: isNaN(parsedDuration) || parsedDuration < 5 ? 10 : parsedDuration,
        }),
      );
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[340px] max-h-[calc(100vh-2rem)] overflow-y-auto bg-white dark:bg-dark-secondary rounded-2xl shadow-2xl border border-Gray-200 dark:border-Gray-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-Gray-100 dark:border-Gray-700 sticky top-0 bg-white dark:bg-dark-secondary z-10">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="text-sm font-bold text-Gray-900 dark:text-white">Tên Diễn Giả</h3>
            {isLive && (
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-Gray-100 dark:hover:bg-white/10 transition-colors">
            <svg className="w-4 h-4 text-Gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Preview */}
        <div className="mx-3 mt-3">
          <div className="bg-gray-900 rounded-lg p-3 relative overflow-hidden min-h-[50px] flex items-end">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-purple-900/20" />
            {name.trim() ? (
              <div className="relative flex items-stretch overflow-hidden rounded">
                <div className="w-1 bg-gradient-to-b from-indigo-400 via-violet-500 to-fuchsia-500 shrink-0" />
                <div className="bg-slate-900/90 backdrop-blur pl-3 pr-4 py-1.5 border border-white/[0.08] border-l-0">
                  <p className="text-xs font-extrabold text-white">{name}</p>
                  {title.trim() && <p className="text-[10px] text-indigo-300/90 mt-0.5">{title}</p>}
                </div>
              </div>
            ) : (
              <p className="relative text-[10px] text-white/30 italic">Nhập tên để xem trước...</p>
            )}
          </div>
        </div>

        {/* Inputs */}
        <div className="px-3 py-3 space-y-2">
          <div>
            <label className="text-[10px] font-semibold text-Gray-500 dark:text-Gray-400 mb-0.5 block">Họ tên *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-3 py-2 rounded-lg border border-Gray-200 dark:border-Gray-700 bg-Gray-50 dark:bg-dark-primary text-sm font-semibold text-Gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-Gray-500 dark:text-Gray-400 mb-0.5 block">Chức danh</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="CEO Thanh Nguyên Group"
              className="w-full px-3 py-2 rounded-lg border border-Gray-200 dark:border-Gray-700 bg-Gray-50 dark:bg-dark-primary text-sm font-semibold text-Gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Live Toggle */}
        <div className="mx-3 mb-2">
          <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
            isLive
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
              : 'bg-Gray-50 dark:bg-dark-primary border-Gray-200 dark:border-Gray-700'
          }`}>
            <div className="flex items-center gap-2">
              <svg className={`w-4 h-4 ${isLive ? 'text-emerald-500' : 'text-Gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className={`text-xs font-bold ${isLive ? 'text-emerald-700 dark:text-emerald-400' : 'text-Gray-500 dark:text-Gray-400'}`}>
                {isLive ? 'Đang hiển thị cho Khán giả' : 'Chưa hiển thị'}
              </span>
            </div>
            <button
              onClick={() => {
                if (isLive) {
                  handleHide();
                } else {
                  handleShow();
                }
              }}
              disabled={!isLive && !name.trim()}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                isLive ? 'bg-emerald-500' : 'bg-Gray-300 dark:bg-Gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                  isLive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Automation Section */}
        <div className="mx-3 mb-4 mt-2 border-t border-Gray-100 dark:border-Gray-700 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-Gray-700 dark:text-Gray-300 flex items-center gap-1">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Tự động lặp lại (Auto Loop)
            </span>
            <button
              onClick={handleToggleAutomation}
              disabled={!name.trim()}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                isAutoLoop ? 'bg-indigo-500' : 'bg-Gray-300 dark:bg-Gray-600'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                  isAutoLoop ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className={`grid grid-cols-2 gap-2 transition-all ${!isAutoLoop ? 'opacity-50 pointer-events-none' : ''}`}>
            <div>
              <label className="text-[9px] font-semibold text-Gray-500 dark:text-Gray-400 mb-0.5 block">Thời gian nghỉ (giây)</label>
              <input
                type="number"
                min="1"
                value={delaySec}
                onChange={(e) => setDelaySec(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-Gray-200 dark:border-Gray-700 bg-Gray-50 dark:bg-dark-primary text-xs font-semibold text-Gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-Gray-500 dark:text-Gray-400 mb-0.5 block">Hiện trong (giây)</label>
              <input
                type="number"
                min="5"
                value={durationSec}
                onChange={(e) => setDurationSec(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-Gray-200 dark:border-Gray-700 bg-Gray-50 dark:bg-dark-primary text-xs font-semibold text-Gray-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-t border-Gray-100 dark:border-Gray-700">
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-Gray-500 hover:bg-Gray-100 dark:hover:bg-white/10 transition-all"
          >
            Đóng
          </button>
          <button
            onClick={() => { handleShow(); onClose(); }}
            disabled={!name.trim()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all disabled:opacity-40"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {isLive ? 'Cập nhật & Đóng' : 'Hiển thị & Đóng'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LowerThirdModal;
