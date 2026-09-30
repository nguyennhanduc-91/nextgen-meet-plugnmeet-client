import React, { useCallback, useEffect, useState } from 'react';
import { Menu, MenuButton, Transition } from '@headlessui/react';
import { useTranslation } from 'react-i18next';

import { store, useAppSelector } from '../../store';
import HeaderMenus from './menus';
import RoomSettings from './room-settings';
import KeyboardShortcuts from './keyboardShortcuts';
import VolumeControl from './volumeControl';
import DurationView from './durationView';
import DarkThemeSwitcher from './darkThemeSwitcher';
import HeaderLogo from './headerLogo';
import { getNatsConn } from '../../helpers/nats';
import { HeaderMenuIcon } from '../../assets/Icons/HeaderMenuIcon';
import UserNotifications from './user-notifications';
import FullscreenToggle from './fullscreenToggle';
import LayoutToggle from './layoutToggle';
import HeaderTimer from './headerTimer';
import ConfirmationModal from '../../helpers/ui/confirmationModal';

const Header = () => {
  const roomTitle = useAppSelector(
    (state) => state.session.currentRoom.metadata?.roomTitle,
  );
  const isRecorder = store.getState().session.currentUser?.isRecorder;
  const currentRoomId = useAppSelector(
    (state) => state.session.currentRoom.roomId,
  );

  const { t } = useTranslation();
  const [title, setTitle] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalText, setModalText] = useState('');
  const [onConfirm, setOnConfirm] = useState<() => void>(() => () => {});

  useEffect(() => {
    const localTitle = localStorage.getItem('pnm_room_title');
    
    // Priority 1: Use Redux roomTitle if it is actually loaded and not just the raw roomId (happens if backend is populated correctly)
    if (roomTitle && roomTitle !== currentRoomId && roomTitle !== 'plugNmeet') {
      setTitle(roomTitle);
    } 
    // Priority 2: Use the localStorage title the user explicitly typed in the Pre-Join phase
    else if (localTitle && localTitle !== currentRoomId) {
      setTitle(localTitle);
    } 
    // Priority 3: Fallback to whatever Redux has (might be roomId or default)
    else if (roomTitle) {
      setTitle(localTitle || roomTitle);
    }
  }, [roomTitle, currentRoomId]);

  const handleLogout = useCallback(() => {
    const confirm = async () => {
      const conn = getNatsConn();
      await conn.endSession('notifications.user-logged-out');
    };
    setModalText(t('header.menus.alert.logout'));
    setOnConfirm(() => confirm);
    setShowModal(true);
  }, [t]);

  const visibleHeader = useAppSelector(
    (state) => state.roomSettings.visibleHeader,
  );

  return (
    !isRecorder && (
      <>
        <header
          id="main-header"
          onClick={(e) => e.stopPropagation()}
          className={`relative z-99999 px-2 md:px-4 min-h-[36px] md:min-h-[40px] 3xl:min-h-[48px] py-0 md:py-0 flex flex-nowrap items-center justify-between bg-white dark:bg-dark-primary backdrop-blur-xl transition-transform duration-300 border-b border-Gray-200/40 dark:border-Gray-800/40 ${
            !visibleHeader ? '-translate-y-full' : 'translate-y-0'
          }`}
        >
          <div className="left relative z-20 flex items-center gap-2 md:gap-4 lg:gap-5 min-w-max">
            <div className="flex items-center h-full">
              <HeaderLogo />
            </div>
            <div className="dark-mode scale-[0.85] md:scale-90 origin-left flex items-center -ml-1">
              <DarkThemeSwitcher />
            </div>
          </div>
          <div className="middle hidden md:flex items-center justify-center w-full md:w-1/3 z-10 py-0.5 pointer-events-none">
            <h2 className="header-title text-base md:text-lg 3xl:text-xl font-semibold text-slate-800 dark:text-slate-100 leading-tight text-center truncate tracking-tight">
              {title}
            </h2>
          </div>
          <div className="right flex items-center justify-end relative ltr:-right-1 rtl:-left-1 min-w-max gap-1 md:gap-1.5 z-30">
            <HeaderTimer />
            <DurationView />
            <UserNotifications />
            <VolumeControl />
            <LayoutToggle />
            <FullscreenToggle />
            <Menu>
              {({ open }) => (
                <div>
                  <MenuButton
                    className={`relative shrink-0 w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors group ${open ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    <div className="text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center justify-center">
                      <HeaderMenuIcon />
                    </div>
                  </MenuButton>

                  {/* Use the Transition component. */}
                  <Transition
                    as="div"
                    show={open}
                    enter="transition ease-out duration-300"
                    enterFrom="transform opacity-0 scale-95 -translate-y-2"
                    enterTo="transform opacity-100 scale-100 translate-y-0"
                    leave="transition ease-in duration-200"
                    leaveFrom="transform opacity-100 scale-100 translate-y-0"
                    leaveTo="transform opacity-0 scale-95 -translate-y-2"
                  >
                    <HeaderMenus onOpenAlert={() => handleLogout()} />
                  </Transition>
                </div>
              )}
            </Menu>
          </div>
        </header>
        <ConfirmationModal
          show={showModal}
          onClose={() => setShowModal(false)}
          onConfirm={() => {
            onConfirm();
            setShowModal(false);
          }}
          title={t('header.menus.alert.confirm')}
          text={modalText}
        />
        <RoomSettings />
        <KeyboardShortcuts />
      </>
    )
  );
};

export default React.memo(Header);
