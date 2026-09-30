import React from 'react';
import { useTranslation } from 'react-i18next';
import { isSupported } from '@twilio/video-processors';

import { useAppDispatch, useAppSelector } from '../../../../store';
import { updateVirtualBackground } from '../../../../store/slices/bottomIconsActivitySlice';
import { BackgroundConfig } from '../../../../helpers/libs/TrackProcessor';
import WebcamPreview from './webcamPreview';
import BackgroundItems from './backgroundItems';

interface WebcamSettingsProps {
  deviceId: string;
}

const WebcamSettings = ({ deviceId }: WebcamSettingsProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const selectedBg = useAppSelector(
    (state) => state.bottomIconsActivity.virtualBackground,
  );

  const onSelectBg = (bg: BackgroundConfig) => {
    dispatch(updateVirtualBackground(bg));
  };

  const setBeautifyLevel = (level: 'none' | 'low' | 'medium' | 'high') => {
    onSelectBg({ ...selectedBg, beautifyLevel: level });
  };

  const setAspectRatio = (ratio: 'default' | '16/9' | '4/3' | '1/1' | '3/4') => {
    onSelectBg({ ...selectedBg, aspectRatio: ratio });
  };

  const toggleMirror = () => {
    onSelectBg({ ...selectedBg, isMirrored: !selectedBg.isMirrored });
  };

  // Determine current aspect ratio for preview container styling
  const ratio = selectedBg.aspectRatio || 'default';
  const previewAspectClass = 
    ratio === '16/9' || ratio === 'default' ? 'aspect-video w-full' :
    ratio === '4/3' ? 'aspect-[4/3] w-[80%] mx-auto' :
    ratio === '1/1' ? 'aspect-square w-[70%] mx-auto' :
    ratio === '3/4' ? 'aspect-[3/4] max-h-[60vh] mx-auto w-auto' : 'aspect-video w-full';

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* LÃNH ĐỊA PREVIEW (Left Column) */}
      <div className="w-full lg:w-[50%] flex flex-col justify-center shrink-0">
        <div className={`overflow-hidden rounded-2xl bg-black relative shadow-inner ring-1 ring-white/10 flex items-center justify-center transition-all duration-300 ${previewAspectClass}`}>
          <WebcamPreview deviceId={deviceId} />
        </div>
      </div>

      {/* LÃNH ĐỊA CÀI ĐẶT (Right Column) */}
      <div className="w-full lg:w-[50%] flex flex-col gap-6 overflow-y-auto pr-2 scrollBar">
        
        {/* 1. Hiển thị & Khung hình */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Định dạng hiển thị</h4>
            <label className="flex items-center gap-2 cursor-pointer select-none" title="Chỉ lật trên giao diện của bạn">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Lật gương</span>
              <div className="relative">
                <input type="checkbox" className="sr-only" checked={!!selectedBg.isMirrored} onChange={toggleMirror} />
                <div className={`block w-10 h-6 rounded-full transition-colors ${selectedBg.isMirrored ? 'bg-[#00a1f2]' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${selectedBg.isMirrored ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'default', label: '16:9' },
              { id: '4/3', label: '4:3' },
              { id: '1/1', label: '1:1' },
              { id: '3/4', label: '3:4' },
            ].map((ar) => (
              <button
                key={ar.id}
                onClick={() => setAspectRatio(ar.id as any)}
                className={`py-2 px-1 text-[11px] font-bold rounded-xl border-2 transition-all duration-200 ${
                  (selectedBg.aspectRatio || 'default') === ar.id
                    ? 'bg-blue-500/10 border-[#00a1f2] text-[#00a1f2]'
                    : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Làm đẹp (Beautification) */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Làm mịn & Sáng da</h4>
          <div className="flex gap-2">
            {[
              { id: 'none', label: 'Tắt', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
              { id: 'low', label: 'Nhẹ', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
              { id: 'medium', label: 'Vừa', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
              { id: 'high', label: 'Mạnh', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                onClick={() => setBeautifyLevel(lvl.id as any)}
                className={`flex-1 py-2 px-1 flex flex-col items-center gap-1 rounded-xl border-2 transition-all duration-200 ${
                  (selectedBg.beautifyLevel || 'none') === lvl.id
                    ? 'bg-pink-500/10 border-pink-500 text-pink-500'
                    : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={lvl.icon} /></svg>
                <span className="text-[10px] font-bold">{lvl.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Hình nền ảo */}
        {isSupported && (
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('footer.modal.chose-virtual-bg')}
            </h4>
            <BackgroundItems onSelect={onSelectBg} />
          </div>
        )}
      </div>
    </div>
  );
};

export default WebcamSettings;
