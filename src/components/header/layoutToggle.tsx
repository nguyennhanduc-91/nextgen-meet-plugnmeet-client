import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store';
import { toggleIgnoreSpotlightLayout } from '../../store/slices/roomSettingsSlice';

const LayoutToggle = () => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const ignoreSpotlightLayout = useAppSelector(
    (state) => state.roomSettings.ignoreSpotlightLayout,
  );
  
  // Only show this button if there are actually spotlighted users in the room
  // so guests don't see it when the layout is normal grid anyway.
  const spotlightUserIds = useAppSelector(
    (state) => state.roomSettings.spotlightUserIds,
  );

  const hasSpotlights = spotlightUserIds && spotlightUserIds.length > 0;

  if (!hasSpotlights) {
    return null;
  }

  const toggleLayout = () => {
    dispatch(toggleIgnoreSpotlightLayout());
  };

  return (
    <button
      onClick={toggleLayout}
      title={ignoreSpotlightLayout ? 'Quay lại Tiêu điểm' : 'Chuyển sang dạng Lưới'}
      className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group relative"
    >
      <div className="text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
        {ignoreSpotlightLayout ? (
          // Star icon (Spotlight layout)
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ) : (
          // Grid icon (Grid layout)
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        )}
      </div>
      
      {/* Red dot to indicate they are ignoring the global spotlight */}
      {ignoreSpotlightLayout && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
      )}
    </button>
  );
};

export default LayoutToggle;
