import React from 'react';
import { Menu, MenuButton, Transition } from '@headlessui/react';
import { Room } from 'livekit-client';

import WebcamMenuItems from './items';
import { ArrowUp } from '../../../../../assets/Icons/ArrowUp';

interface IWebcamMenuProps {
  currentRoom: Room;
  isActiveWebcam: any;
  toggleWebcam: () => void;
}

const WebcamMenu = ({
  currentRoom,
  isActiveWebcam,
  toggleWebcam,
}: IWebcamMenuProps) => {
  return (
    <div className="menu relative">
      <Menu as="div">
        {({ open }) => (
          <>
            <MenuButton
              className={`w-[14px] md:w-[18px] 3xl:w-[22px] h-full flex items-center justify-center overflow-hidden cursor-pointer transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-Gray-700 rounded-r-[8px] md:rounded-r-[10px] 3xl:rounded-r-[12px] ${!isActiveWebcam ? 'text-Red-400' : 'text-Gray-500 dark:text-Gray-400'}`}
            >
              <div className="scale-75 md:scale-90 opacity-70">
                <ArrowUp />
              </div>
            </MenuButton>

            {/* Use the Transition component. */}
            <Transition
              as="div"
              show={open}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95 translate-y-2"
              enterTo="transform opacity-100 scale-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="transform opacity-100 scale-100 translate-y-0"
              leaveTo="transform opacity-0 scale-95 translate-y-2"
            >
              <WebcamMenuItems
                currentRoom={currentRoom}
                toggleWebcam={toggleWebcam}
              />
            </Transition>
          </>
        )}
      </Menu>
    </div>
  );
};

export default WebcamMenu;
