import React, { Fragment } from 'react';
import { Menu, MenuButton, MenuItems, Transition } from '@headlessui/react';

import { useAppSelector, useAppDispatch } from '../../../store';
import LockSettingsModal from '../modals/lockSettingsModal';
import RtmpModal from '../modals/rtmpModal';
import ManageWaitingRoom from '../../waiting-room';
import BreakoutRoom from '../../breakout-room';
import { FooterMenuIconSVG } from '../../../assets/Icons/FooterMenuIconSVG';
import ExternalMediaPlayerModal from '../../external-media-player/modal';
import DisplayExternalLinkModal from '../../display-external-link/modal';
import AdminMenus from './menus/adminMenus';
import PresenterMenus from './menus/presenterMenus';
import IconsInMenu from './menus/iconsInMenu';
import TranslationTranscriptionSettingModal from '../../translation-transcription/settingModal';
import InsightsAiSettingsModal from '../../insights-ai';
import CTAAdminModal from '../../webinar-tools/CTAAdminModal';
import LowerThirdModal from '../../webinar-tools/LowerThirdModal';
import { updateShowLowerThirdModal } from '../../../store/slices/roomSettingsSlice';
import { updateShowCTAModal, updateShowTeleprompter } from '../../../store/slices/bottomIconsActivitySlice';
import FooterMenuItem from './menus/menuItem';

interface MenusIconProps {
  isAdmin: boolean;
  isPresenter?: boolean;
}

const MenusIcon = ({ isAdmin, isPresenter }: MenusIconProps) => {
  const dispatch = useAppDispatch();
  const showRtmpModal = useAppSelector(
    (state) => state.bottomIconsActivity.showRtmpModal,
  );

  const showExternalMediaPlayerModal = useAppSelector(
    (state) => state.bottomIconsActivity.showExternalMediaPlayerModal,
  );
  const showManageWaitingRoomModal = useAppSelector(
    (state) => state.bottomIconsActivity.showManageWaitingRoomModal,
  );
  const showManageBreakoutRoomModal = useAppSelector(
    (state) => state.bottomIconsActivity.showManageBreakoutRoomModal,
  );
  const showDisplayExternalLinkModal = useAppSelector(
    (state) => state.bottomIconsActivity.showDisplayExternalLinkModal,
  );
  const showLockSettingsModal = useAppSelector(
    (state) => state.bottomIconsActivity.showLockSettingsModal,
  );
  const showSpeechSettingsModal = useAppSelector(
    (state) => state.bottomIconsActivity.showSpeechSettingsModal,
  );
  const showInsightsAISettingsModal = useAppSelector(
    (state) => state.bottomIconsActivity.showInsightsAISettingsModal,
  );
  const showCTAModal = useAppSelector(
    (state) => state.bottomIconsActivity.showCTAModal,
  );
  const showLowerThirdModal = useAppSelector(
    (state) => state.roomSettings.showLowerThirdModal,
  );

  const roomMode = useAppSelector((state) => state.session.currentRoom.metadata?.roomFeatures?.roomMode);
  const isMeetingMode = roomMode === 'normal' || roomMode === undefined;
  const showTeleprompter = useAppSelector((state) => state.bottomIconsActivity.showTeleprompter);

  return (
    <>
      <div className="menu relative z-[110] footer-main-menu">
        <Menu>
          {({ open }) => (
            <div>
              <MenuButton className="outline-none">
                <div
                  className={`footer-menu relative footer-icon cursor-pointer w-9 md:w-10 3xl:w-11 h-9 md:h-10 3xl:h-11 rounded-[10px] md:rounded-[12px] 3xl:rounded-[15px] border-[2px] 3xl:border-[3px] ${open ? 'border-[rgba(124,206,247,0.25)] dark:border-Gray-800' : 'border-transparent'}`}
                >
                  <div
                    className={`footer-icon-bg relative footer-icon flex items-center justify-center cursor-pointer w-full h-full rounded-[8px] md:rounded-[10px] 3xl:rounded-[12px] border border-Gray-300 dark:border-Gray-700 shadow-sm transition-all duration-300 hover:bg-gray-100 dark:hover:bg-Gray-700 text-Gray-950 dark:text-white ${open ? 'bg-gray-100 dark:bg-Gray-700' : 'bg-white dark:bg-Gray-800'}`}
                  >
                    <FooterMenuIconSVG />
                  </div>
                </div>
              </MenuButton>
              <Transition
                as={Fragment}
                show={open}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95 translate-y-2"
                enterTo="transform opacity-100 scale-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="transform opacity-100 scale-100 translate-y-0"
                leaveTo="transform opacity-0 scale-95 translate-y-2"
              >
                <MenuItems
                  static={false}
                  className="origin-bottom-right z-[9999] fixed right-2 md:right-auto md:left-auto w-[300px] shadow-dropdown-menu rounded-[15px] overflow-hidden border border-Gray-100 dark:border-Gray-700 bg-white dark:bg-dark-primary p-2"
                  style={{ bottom: '48px' }}
                  id="footer-menu"
                >
                  <div className="inner">
                    {isAdmin && (
                      <>
                        <AdminMenus />
                      </>
                    )}
                    {isPresenter && !isAdmin && (
                      <>
                        <PresenterMenus />
                      </>
                    )}
                    {!isAdmin && !isPresenter && isMeetingMode && (
                      <>
                        <FooterMenuItem
                          onClick={() => dispatch(updateShowTeleprompter(!showTeleprompter))}
                          isActive={showTeleprompter}
                          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                          text={showTeleprompter ? "Tắt Máy nhắc chữ" : "Mở Máy nhắc chữ"}
                          customColor="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        />
                      </>
                    )}
                    <div className="mobile-menu-icons block md:hidden">
                      <div className="h-px w-full bg-Gray-100 dark:bg-Gray-700 my-1"></div>
                      <IconsInMenu />
                    </div>
                  </div>
                </MenuItems>
              </Transition>
            </div>
          )}
        </Menu>
      </div>
      {showLockSettingsModal && <LockSettingsModal />}
      {showRtmpModal && <RtmpModal />}
      {showExternalMediaPlayerModal && <ExternalMediaPlayerModal />}
      {showManageWaitingRoomModal && <ManageWaitingRoom />}
      {showManageBreakoutRoomModal && <BreakoutRoom />}
      {showDisplayExternalLinkModal && <DisplayExternalLinkModal />}
      {showSpeechSettingsModal && <TranslationTranscriptionSettingModal />}
      {showInsightsAISettingsModal && <InsightsAiSettingsModal />}
      {showCTAModal && (
        <CTAAdminModal
          onClose={() => dispatch(updateShowCTAModal(false))}
        />
      )}
      {showLowerThirdModal && (
        <LowerThirdModal onClose={() => dispatch(updateShowLowerThirdModal(false))} />
      )}
    </>
  );
};

export default MenusIcon;
