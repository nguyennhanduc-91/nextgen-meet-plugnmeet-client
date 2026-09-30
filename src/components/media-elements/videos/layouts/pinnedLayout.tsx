import React, { ReactElement } from 'react';

import VerticalLayout from './verticalLayout';
import { VideoParticipantProps } from '../videoParticipant';
import { useAppSelector } from '../../../../store';
import { usePiPDetector } from '../../../../helpers/hooks/usePiPDetector';
import { useDeviceInfo } from '../helpers/useDeviceInfo';

interface IPinnedLayoutProps {
  allParticipants: ReactElement<VideoParticipantProps>[];
  participantsToRender: Array<ReactElement>;
  pinParticipants: ReactElement[];
  totalNumWebcams: number;
  currentPage: number;
  isSidebarOpen: boolean;
  isEnabledExtendedVerticalCamView: boolean;
  isDesktop: boolean;
}

const PinnedLayout = ({
  allParticipants,
  participantsToRender,
  pinParticipants,
  totalNumWebcams,
  currentPage,
  isSidebarOpen,
  isEnabledExtendedVerticalCamView,
  isDesktop,
}: IPinnedLayoutProps) => {
  // Calculate grid columns based on number of pinned participants
  const count = pinParticipants.length;
  let gridClass = 'grid-cols-1';
  if (count === 2) gridClass = 'grid-cols-1 md:grid-cols-2';
  else if (count === 3) gridClass = 'grid-cols-1 md:grid-cols-3';
  else if (count === 4) gridClass = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2';
  else if (count >= 5) gridClass = 'grid-cols-1 md:grid-cols-3 lg:grid-cols-3';

  const { isAnyPipActive } = usePiPDetector();
  const { isLandscape } = useDeviceInfo();
  const isSmallLandscape = !isDesktop && isLandscape;
  
  const hasVerticalWebcams = participantsToRender.length > 0;
  
  // Calculate dynamic padding to avoid overlap with VerticalLayout
  let paddingClasses = 'p-0.5 md:p-1';
  if (hasVerticalWebcams && !isAnyPipActive && !isSmallLandscape) {
    if (isEnabledExtendedVerticalCamView) {
      paddingClasses = 'p-0.5 md:p-1 pb-[126px] lg:pb-[200px] xl:pb-0 xl:pr-[416px]';
    } else {
      paddingClasses = 'p-0.5 md:p-1 pb-[126px] lg:pb-[200px] xl:pb-0 xl:pr-[212px]';
    }
  }

  return (
    <>
      <div className={`pinView-camera-fullWidth w-full h-full flex items-center justify-center ${paddingClasses}`}>
        <div className={`w-full max-h-full h-full grid gap-0.5 md:gap-1 ${gridClass} items-center justify-center`}>
          {pinParticipants.map((pinParticipant, index) => (
            <div key={`pin-${index}`} className="w-full h-full flex justify-center items-center overflow-hidden">
              {pinParticipant}
            </div>
          ))}
        </div>
      </div>
      <VerticalLayout
        allParticipants={allParticipants}
        participantsToRender={participantsToRender}
        totalNumWebcams={totalNumWebcams}
        currentPage={currentPage}
        isSidebarOpen={isSidebarOpen}
        isEnabledExtendedVerticalCamView={isEnabledExtendedVerticalCamView}
        isDesktop={isDesktop}
      />
    </>
  );
};

export default PinnedLayout;
