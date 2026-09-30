import React, { ReactNode, useMemo } from 'react';

import { useAppSelector } from '../../store';
import { usePiPDetector } from '../../helpers/hooks/usePiPDetector';
import { useDeviceInfo } from '../media-elements/videos/helpers/useDeviceInfo';

interface ILayoutWrapperProps {
  isActiveScreenShare: boolean;
  showVideoElms: boolean;
  showVerticalVideoView: boolean;
  children: ReactNode;
  pinnedCamUserIds?: string[];
}

const LayoutWrapper = ({
  isActiveScreenShare,
  showVideoElms,
  showVerticalVideoView,
  children,
  pinnedCamUserIds,
}: ILayoutWrapperProps) => {
  const isEnabledExtendedVerticalCamView = useAppSelector(
    (state) => state.bottomIconsActivity.isEnabledExtendedVerticalCamView,
  );
  const { isDesktop, isLandscape } = useDeviceInfo();
  const { isAnyPipActive } = usePiPDetector();
  const isSmallLandscape = !isDesktop && isLandscape;

  const cssClasses = useMemo(() => {
    const classes = new Set<string>(['relative']);
    const hasPinnedCams = pinnedCamUserIds && pinnedCamUserIds.length > 0;

    if (isActiveScreenShare) {
      classes
        .add('middle-fullscreen-wrapper')
        .add('share-screen-wrapper')
        .add('is-share-screen-running');

      if (showVideoElms) {
        if (showVerticalVideoView && !isAnyPipActive && !isSmallLandscape) {
          classes.add('verticalsWebcamsActivated');
        }
        if (isEnabledExtendedVerticalCamView) {
          classes.add('extendedVerticalCamView');
        }
        if (hasPinnedCams) {
          classes.add('pinWebcamActivated');
        }
      }
    } else {
      if (showVideoElms && !showVerticalVideoView && !hasPinnedCams) {
        classes.add('h-full');
      } else if (showVideoElms) {
        classes.add('middle-fullscreen-wrapper').add('h-full').add('flex');

        if (showVerticalVideoView && !isAnyPipActive && !isSmallLandscape) {
          classes.add('verticalsWebcamsActivated');
        }
        if (isEnabledExtendedVerticalCamView) {
          classes.add('extendedVerticalCamView');
        }
        if (hasPinnedCams) {
          // when we've pin cam then need to manually activate verticalsWebcams layout
          // showVerticalVideoView will be false as no whiteboard or screen sharing or similar is active
          classes.add('pinWebcamActivated');
          if (!isAnyPipActive && !isSmallLandscape) {
            classes.add('verticalsWebcamsActivated');
          }
        }
      } else {
        classes
          .add('middle-fullscreen-wrapper')
          .add('h-full')
          .add('flex')
          .add('w-full');
      }
    }
    return Array.from(classes).join(' ').trim();
  }, [
    isActiveScreenShare,
    showVideoElms,
    showVerticalVideoView,
    isEnabledExtendedVerticalCamView,
    pinnedCamUserIds,
    isAnyPipActive,
    isSmallLandscape,
  ]);

  return <div className={cssClasses}>{children}</div>;
};

export default LayoutWrapper;
