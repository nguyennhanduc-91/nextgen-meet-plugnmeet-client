import React from 'react';

interface Props {
  classes?: string;
}

export const WaitingRoomIconSVG = ({ classes }: Props) => {
  return (
    <svg
      className={classes || 'w-full h-auto'}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22v-6" />
      <path d="M12 8V2" />
      <path d="M4 12H2" />
      <path d="M22 12h-2" />
      <circle cx="12" cy="12" r="4" />
      <path d="m19 5-2 2" />
      <path d="m5 19-2 2" />
      <path d="m5 5 2 2" />
      <path d="m19 19 2 2" />
    </svg>
  );
};
