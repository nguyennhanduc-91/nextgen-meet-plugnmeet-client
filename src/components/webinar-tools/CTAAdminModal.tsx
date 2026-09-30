import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DataMsgBodyType } from 'plugnmeet-protocol-js';

import Modal from '../../helpers/ui/modal';
import { useAppDispatch, useAppSelector } from '../../store';
import { getNatsConn } from '../../helpers/nats';
import { updateActiveCTA } from '../../store/slices/roomSettingsSlice';

interface Props {
  onClose: () => void;
}

const CTAAdminModal = ({ onClose }: Props) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const activeCTA = useAppSelector((state) => state.roomSettings.activeCTA);
  const [isSending, setIsSending] = useState(false);

  // Optimized for thanhnguyen.group
  const [title, setTitle] = useState('Tham gia Cộng đồng Thanh Nguyên');
  const [description, setDescription] = useState('Kết nối và học hỏi cùng cộng đồng chuyên gia tại Thanh Nguyên Group.');
  const [buttonText, setButtonText] = useState('Tìm hiểu thêm');
  const [link, setLink] = useState('https://thanhnguyen.group/');
  const [duration, setDuration] = useState(300);

  const sendCTA = async (isStop = false) => {
    setIsSending(true);
    try {
      const payload = isStop ? null : {
        type: 'WEBINAR_CTA',
        title,
        description,
        buttonText,
        link,
        duration,
        startedAt: Date.now(),
      };
      
      await getNatsConn().sendDataMessage(
        DataMsgBodyType.INFO,
        JSON.stringify(payload ? { type: 'WEBINAR_CTA', ...payload } : { type: 'WEBINAR_CTA', stop: true })
      );

      dispatch(updateActiveCTA(payload));
      if (!isStop) onClose();
    } catch (e: any) {
      console.error('Failed to handle CTA', e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      show={true}
      onClose={onClose}
      title="Thông báo & Hành động (CTA)"
    >
      <div className="flex flex-col gap-5 p-2">
        <div className="bg-indigo-50 dark:bg-indigo-500/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
          <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
            Gửi các thông báo quan trọng hoặc đường dẫn tham khảo trực tiếp đến toàn bộ khán giả để tăng tính tương tác.
          </p>
        </div>

        {activeCTA && (
          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider">Đang có thông báo hoạt động</span>
            </div>
            <button
              onClick={() => sendCTA(true)}
              disabled={isSending}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
            >
              Ngừng chạy
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-Gray-500 dark:text-white/50 flex items-center gap-1.5 ml-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Tiêu đề thông báo
            </label>
            <input
              type="text"
              value={title}
              placeholder="Vd: Tham gia Cộng đồng Thanh Nguyên..."
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 px-4 rounded-xl border-2 border-Gray-100 dark:border-white/5 bg-Gray-50 dark:bg-dark-primary outline-none text-sm font-bold dark:text-white focus:border-indigo-500/50 transition-all shadow-inner"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-Gray-500 dark:text-white/50 flex items-center gap-1.5 ml-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h7" /></svg>
              Mô tả chi tiết
            </label>
            <textarea
              value={description}
              placeholder="Nhập nội dung mô tả ngắn gọn..."
              onChange={(e) => setDescription(e.target.value)}
              className="p-4 rounded-xl border-2 border-Gray-100 dark:border-white/5 bg-Gray-50 dark:bg-dark-primary outline-none text-sm font-medium dark:text-white focus:border-indigo-500/50 transition-all shadow-inner resize-none"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-Gray-500 dark:text-white/50 flex items-center gap-1.5 ml-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              Đường dẫn liên kết (URL)
            </label>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="h-11 px-4 rounded-xl border-2 border-Gray-100 dark:border-white/5 bg-Gray-50 dark:bg-dark-primary outline-none text-sm font-bold dark:text-indigo-400 focus:border-indigo-500/50 transition-all shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-Gray-500 dark:text-white/50 flex items-center gap-1.5 ml-1">
                Tên nút bấm
              </label>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                className="h-11 px-4 rounded-xl border-2 border-Gray-100 dark:border-white/5 bg-Gray-50 dark:bg-dark-primary outline-none text-sm font-black dark:text-white focus:border-indigo-500/50 transition-all shadow-inner"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-Gray-500 dark:text-white/50 flex items-center gap-1.5 ml-1">
                Thời gian (Giây)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-11 px-4 rounded-xl border-2 border-Gray-100 dark:border-white/5 bg-Gray-50 dark:bg-dark-primary outline-none text-sm font-black dark:text-white focus:border-indigo-500/50 transition-all shadow-inner pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-Gray-300">s</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-2xl bg-white dark:bg-white/5 hover:bg-Gray-50 dark:hover:bg-white/10 border border-Gray-200 dark:border-white/10 text-[11px] font-black uppercase tracking-widest transition-all dark:text-white active:scale-95"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => sendCTA(false)}
            disabled={isSending || !title || !link}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 transition-all disabled:opacity-50 active:scale-95"
          >
            {isSending ? 'Đang xử lý...' : 'Phát thông báo'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CTAAdminModal;

