import React from 'react';

import { useAppSelector } from '../../../../store';
import IconWrapper from './iconWrapper';
import { StarIconSVG } from '../../../../assets/Icons/StarIconSVG';

interface ISpotlightIconProps {
  userId: string;
}

const SpotlightIcon = ({ userId }: ISpotlightIconProps) => {
  const spotlightUserIds = useAppSelector(
    (state) => state.roomSettings.spotlightUserIds,
  );

  const isSpotlighted = spotlightUserIds && spotlightUserIds.includes(userId);

  return (
    isSpotlighted && (
      <IconWrapper>
        <StarIconSVG classes="w-[14px] h-[14px] 3xl:w-4 3xl:h-4 text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
      </IconWrapper>
    )
  );
};

export default SpotlightIcon;
