import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { RoomUploadedFileType } from 'plugnmeet-protocol-js';

import { useAppSelector } from '../../../../store';
import { getConfigValue } from '../../../../helpers/utils';
import { backgroundImageUrls } from './backgroundHelper';
import { BackgroundConfig } from '../../../../helpers/libs/TrackProcessor';

interface IBackgroundItemsProps {
  onSelect: (bg: BackgroundConfig) => void;
}

const BackgroundItems = ({ onSelect }: IBackgroundItemsProps) => {
  const allowedFileTypes = ['jpg', 'jpeg', 'png'];
  const selectedBg = useAppSelector(
    (state) => state.bottomIconsActivity.virtualBackground,
  );

  const [bgImgs, setBgImgs] = useState<Array<string>>(backgroundImageUrls);
  const customFileRef = useRef<HTMLInputElement>(null);

  const handleOnClick = (type: 'none' | 'blur' | 'image', url: string, blurRadius?: number) => {
    const bg: BackgroundConfig = {
      ...selectedBg,
      type,
      url,
      blurRadius,
    };
    onSelect(bg);
  };

  const customBgImage = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) {
      return;
    }
    const file = files[0];
    const objectUrl = URL.createObjectURL(file);

    const newBgImgs = [...bgImgs];
    newBgImgs.push(objectUrl);
    setBgImgs(newBgImgs);

    const bg: BackgroundConfig = {
      ...selectedBg,
      type: 'image',
      url: objectUrl,
    };
    onSelect(bg);

    if (customFileRef.current) {
      customFileRef.current.value = '';
    }
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1 md:h-[175px] overflow-auto scrollBar">
      <div
        className={`wrap overflow-hidden rounded-2xl h-20 ${selectedBg.type === 'none' ? 'border-4 border-[rgba(124,206,247,0.25)]' : 'border-4 border-transparent'}`}
        onClick={() => handleOnClick('none', '')}
      >
        <div
          className={`cursor-pointer w-full h-full flex flex-col items-center justify-center bg-Gray-50 dark:bg-transparent overflow-hidden ${selectedBg.type === 'none' ? 'border border-Blue dark:border-none shadow-virtual-item dark:shadow-none rounded-xl' : 'rounded-2xl dark:border dark:border-Gray-700'}`}
        >
          <i className="pnm-ban-solid dark:text-white text-xl" />
          <span className="text-[10px] mt-1 dark:text-Gray-300">Không</span>
        </div>
      </div>

      {/* Light Blur */}
      <div
        className={`wrap overflow-hidden rounded-2xl h-20 ${selectedBg.type === 'blur' && selectedBg.blurRadius === 8 ? 'border-4 border-[rgba(124,206,247,0.25)]' : 'border-4 border-transparent'}`}
        onClick={() => handleOnClick('blur', '', 8)}
      >
        <div
          className={`cursor-pointer w-full h-full flex flex-col items-center justify-center bg-Gray-50 dark:bg-transparent overflow-hidden ${selectedBg.type === 'blur' && selectedBg.blurRadius === 8 ? 'border border-Blue dark:border-none shadow-virtual-item dark:shadow-none rounded-xl' : 'rounded-2xl dark:border dark:border-Gray-700'}`}
        >
          <i className="pnm-blur dark:text-white text-xl opacity-40" />
          <span className="text-[10px] mt-1 dark:text-Gray-300 text-center leading-tight">Mờ nhẹ</span>
        </div>
      </div>

      {/* Medium Blur */}
      <div
        className={`wrap overflow-hidden rounded-2xl h-20 ${selectedBg.type === 'blur' && (selectedBg.blurRadius === 15 || !selectedBg.blurRadius) ? 'border-4 border-[rgba(124,206,247,0.25)]' : 'border-4 border-transparent'}`}
        onClick={() => handleOnClick('blur', '', 15)}
      >
        <div
          className={`cursor-pointer w-full h-full flex flex-col items-center justify-center bg-Gray-50 dark:bg-transparent overflow-hidden ${selectedBg.type === 'blur' && (selectedBg.blurRadius === 15 || !selectedBg.blurRadius) ? 'border border-Blue dark:border-none shadow-virtual-item dark:shadow-none rounded-xl' : 'rounded-2xl dark:border dark:border-Gray-700'}`}
        >
          <i className="pnm-blur dark:text-white text-xl opacity-70" />
          <span className="text-[10px] mt-1 dark:text-Gray-300 text-center leading-tight">Mờ vừa</span>
        </div>
      </div>

      {/* Strong Blur */}
      <div
        className={`wrap overflow-hidden rounded-2xl h-20 ${selectedBg.type === 'blur' && selectedBg.blurRadius === 25 ? 'border-4 border-[rgba(124,206,247,0.25)]' : 'border-4 border-transparent'}`}
        onClick={() => handleOnClick('blur', '', 25)}
      >
        <div
          className={`cursor-pointer w-full h-full flex flex-col items-center justify-center bg-Gray-50 dark:bg-transparent overflow-hidden ${selectedBg.type === 'blur' && selectedBg.blurRadius === 25 ? 'border border-Blue dark:border-none shadow-virtual-item dark:shadow-none rounded-xl' : 'rounded-2xl dark:border dark:border-Gray-700'}`}
        >
          <i className="pnm-blur dark:text-white text-xl" />
          <span className="text-[10px] mt-1 dark:text-Gray-300 text-center leading-tight">Mờ mạnh</span>
        </div>
      </div>
      {bgImgs.map((imageUrl, i) => {
        return (
          <div
            className={`wrap overflow-hidden rounded-2xl h-20 transition-all duration-200 ${selectedBg.url === imageUrl ? 'border-4 border-[rgba(124,206,247,0.25)]' : 'border-4 border-transparent'}`}
            onClick={() => handleOnClick('image', imageUrl)}
            key={imageUrl}
          >
            <div
              className={`cursor-pointer w-full h-full flex items-center justify-center bg-Gray-50 overflow-hidden ${selectedBg.url === imageUrl ? 'border border-Blue shadow-virtual-item rounded-xl' : 'rounded-2xl'}`}
            >
              <img
                src={imageUrl}
                alt={`bg-${i + 1}`}
                className={`object-cover w-full h-full`}
              />
            </div>
          </div>
        );
      })}
      {/* Upload Custom Background */}
      <div className="upload-btn-wrap relative border-4 border-transparent col-span-1">
        <button className={`cursor-pointer h-20 w-full border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all border-slate-300 dark:border-slate-600 hover:border-[#00a1f2] hover:bg-slate-50 dark:hover:bg-slate-800`}>
          <svg className="w-5 h-5 md:w-6 md:h-6 text-slate-400 dark:text-slate-500 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Tải ảnh lên</span>
        </button>
        <input
          className="absolute left-0 top-0 opacity-0 w-full h-full cursor-pointer"
          ref={customFileRef}
          type="file"
          id="customBgImage"
          onChange={customBgImage}
          accept="image/png, image/jpeg, image/jpg"
        />
      </div>
    </div>
  );
};

export default BackgroundItems;
