import { useState, useEffect } from 'react';
import { useAppSelector } from '../../store';

/**
 * usePiPDetector - Hook to detect both app-level custom PiP and browser native PiP.
 * Useful for layout adjustments that should happen when cameras are popped out.
 */
export const usePiPDetector = () => {
  const isCustomPipActive = useAppSelector(
    (state) => state.bottomIconsActivity.isActivePiPWebcams,
  );
  
  const [isNativePipActive, setIsNativePipActive] = useState(
    typeof document !== 'undefined' && !!document.pictureInPictureElement
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handlePipChange = () => {
      setIsNativePipActive(!!document.pictureInPictureElement);
    };

    document.addEventListener('enterpictureinpicture', handlePipChange, true);
    document.addEventListener('leavepictureinpicture', handlePipChange, true);

    return () => {
      document.removeEventListener('enterpictureinpicture', handlePipChange, true);
      document.removeEventListener('leavepictureinpicture', handlePipChange, true);
    };
  }, []);

  return {
    isCustomPipActive,
    isNativePipActive,
    isAnyPipActive: isCustomPipActive || isNativePipActive,
  };
};
