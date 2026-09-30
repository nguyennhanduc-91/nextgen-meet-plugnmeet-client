import React from 'react';

interface Props {
  classes?: string;
}

export const StampIconSVG = ({ classes }: Props) => {
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
      <path d="M10 21V14a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v7" />
      <path d="M6 10h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2z" />
      <path d="M8 10v4" />
      <path d="M16 10v4" />
    </svg>
  );
};
