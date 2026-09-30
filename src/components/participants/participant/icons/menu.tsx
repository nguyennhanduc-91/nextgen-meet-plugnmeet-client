import React, { ReactElement, useMemo } from 'react';
import { Menu, MenuButton, MenuItems, Transition } from '@headlessui/react';

import MicMenuItem from './menu-items/mic';
import WebcamMenuItem from './menu-items/webcam';
import SwitchPresenterMenuItem from './menu-items/switchPresenter';
import LowerHandMenuItem from './menu-items/lowerHand';
import LockSettingMenuItem from './menu-items/lock';
import RemoveUserMenuItem from './menu-items/removeUser';
import PrivateChatMenuItem from './menu-items/privateChat';
import PinVideoMenuItem from './menu-items/pinVideo';
import SpotlightMenuItem from './menu-items/spotlight';
import PromoteMenuItem from './menu-items/promote';
import IconWrapper from './iconWrapper';

import { useAppSelector } from '../../../../store';
import { ParticipantsMenuIconSVG } from '../../../../assets/Icons/ParticipantsMenuIconSVG';

interface IMenuIconProps {
  userId: string;
  name: string;
  isAdmin: boolean;
  openRemoveParticipantAlert(userId: string, type: string): void;
}

const Divider = () => (
  <div className="h-[1px] w-full bg-Gray-100 dark:bg-Gray-700 my-1" />
);

const SectionLabel = ({ label }: { label: string }) => (
  <div className="px-3 py-1">
    <span className="text-[10px] font-semibold uppercase tracking-wider text-Gray-400 dark:text-Gray-500">
      {label}
    </span>
  </div>
);

const MenuIcon = ({
  userId,
  name,
  isAdmin,
  openRemoveParticipantAlert,
}: IMenuIconProps) => {
  const defaultLockSettings = useAppSelector(
    (state) => state.session.currentRoom.metadata?.defaultLockSettings,
  );
  const currentUser = useAppSelector((state) => state.session.currentUser);

  const menuItems = useMemo(() => {
    const items: ReactElement[] = [];

    if (currentUser?.metadata?.isAdmin) {
      const isSelf = currentUser.userId === userId;

      // ── Section 1: Audio & Video Controls ──
      items.push(<SectionLabel key="section-av" label="Âm thanh & Hình ảnh" />);
      if (!isSelf) {
        items.push(<MicMenuItem key="mic" userId={userId} />);
        items.push(<WebcamMenuItem key="webcam" userId={userId} />);
      }
      items.push(<PinVideoMenuItem key="pin-video" userId={userId} />);
      items.push(<SpotlightMenuItem key="spotlight" userId={userId} />);

      if (!isSelf) {
        items.push(
          // ── Section 2: Communication ──
          <Divider key="div-1" />,
          <SectionLabel key="section-comm" label="Giao tiếp" />,
          <PrivateChatMenuItem key="chat" userId={userId} name={name} />,

          // ── Section 3: Roles & Privileges ──
          <Divider key="div-2" />,
          <SectionLabel key="section-roles" label="Phân quyền" />,
          <SwitchPresenterMenuItem key="presenter" userId={userId} />,
          <PromoteMenuItem key="promote" userId={userId} />,
          <LowerHandMenuItem key="lower-hand" userId={userId} />,

          // ── Section 4: Lock Settings ──
          <Divider key="div-3" />,
          <SectionLabel key="section-lock" label="Khóa quyền" />,
          <LockSettingMenuItem key="lock" userId={userId} />,

          // ── Section 6: Danger Zone ──
          <Divider key="div-5" />,
          <RemoveUserMenuItem
            key="remove"
            onOpenAlert={openRemoveParticipantAlert}
            userId={userId}
          />
        );
      }
      return items;
    }

    // For non-admins, check if they can send private messages.
    const canSendPrivateMessage =
      !currentUser?.metadata?.lockSettings?.lockPrivateChat &&
      !defaultLockSettings?.lockChat &&
      !defaultLockSettings?.lockPrivateChat;

    // Or if they can send a message to an admin.
    const canSendPrivateMessageToAdmin =
      !defaultLockSettings?.lockChat &&
      defaultLockSettings?.lockPrivateChat &&
      isAdmin;

    if (canSendPrivateMessage || canSendPrivateMessageToAdmin) {
      items.push(
        <PrivateChatMenuItem key="chat" userId={userId} name={name} />,
      );
    }

    return items;
  }, [
    currentUser,
    defaultLockSettings,
    isAdmin,
    name,
    openRemoveParticipantAlert,
    userId,
  ]);

  if (menuItems.length === 0) {
    return null;
  }
  return (
    <IconWrapper>
      <Menu as="div" className="flex items-center">
        {({ open }) => (
          <>
            <MenuButton className="relative shrink-0 cursor-pointer dark:text-white">
              <ParticipantsMenuIconSVG classes="" />
            </MenuButton>
            <Transition
              show={open}
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100 z-10"
              leave="transition duration-75 ease-out"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <MenuItems
                static
                className="origin-top-right z-10 absolute top-8 ltr:right-0 rtl:left-0 w-64 border border-Gray-100 dark:border-Gray-700 bg-white dark:bg-dark-secondary3 shadow-lg rounded-2xl overflow-hidden p-2 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-Gray-300 dark:scrollbar-thumb-Gray-600"
              >
                {menuItems}
              </MenuItems>
            </Transition>
          </>
        )}
      </Menu>
    </IconWrapper>
  );
};

export default MenuIcon;

