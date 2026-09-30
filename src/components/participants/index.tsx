import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useVirtual from 'react-cool-virtual';

import ParticipantComponent from './participant';
import RemoveParticipantAlertModal, {
  IRemoveParticipantAlertModalData,
} from './removeParticipantAlertModal';
import { SearchIconSVG } from '../../assets/Icons/SearchIconSVG';
import { CloseIconSVG } from '../../assets/Icons/CloseIconSVG';

import { store, useAppDispatch, useAppSelector } from '../../store';
import { selectVisibleParticipants } from '../../store/slices/participantSlice';
import { setActiveSidePanel, setIsParticipantsPopout } from '../../store/slices/bottomIconsActivitySlice';

const PopoutIconSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
);

interface ParticipantsComponentProps {
  isPopoutWindow?: boolean;
}

const ParticipantsComponent = ({ isPopoutWindow = false }: ParticipantsComponentProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [searchParticipant, setSearchParticipant] = useState<string>('');
  const [removeParticipantData, setRemoveParticipantData] =
    useState<IRemoveParticipantAlertModalData>();

  const session = useAppSelector((state) => state.session);
  const currentUser = session.currentUser;
  const currentIsAdmin = !!currentUser?.metadata?.isAdmin;
  const currentUserUserId = currentUser?.userId;
  const allowViewOtherUsers = !!session.currentRoom.metadata?.roomFeatures?.allowViewOtherUsersList;

  const participants = useAppSelector((state) =>
    selectVisibleParticipants(
      state,
      currentIsAdmin,
      searchParticipant,
      allowViewOtherUsers,
      currentUserUserId,
    ),
  );

  const { outerRef, innerRef, items } = useVirtual({
    itemCount: participants.length,
  });

  const onOpenRemoveParticipantAlert = useCallback(
    (name: string, user_id: string, type: string) => {
      setRemoveParticipantData({
        name,
        userId: user_id,
        removeType: type,
      });
    },
    [],
  );

  const onCloseAlertModal = () => {
    setRemoveParticipantData(undefined);
  };

  const closePanel = () => {
    dispatch(setActiveSidePanel(null));
  };

  const handlePopout = () => {
    dispatch(setActiveSidePanel(null));
    dispatch(setIsParticipantsPopout(true));
  };

  const renderParticipant = useCallback(
    (index: number) => {
      if (!participants.length || typeof participants[index] === 'undefined') {
        return null;
      }
      const participant = participants[index];
      const isRemoteParticipant = currentUser?.userId !== participant.userId;

      return (
        <ParticipantComponent
          key={participant.userId}
          participant={participant}
          isRemoteParticipant={isRemoteParticipant}
          openRemoveParticipantAlert={onOpenRemoveParticipantAlert}
          currentUser={currentUser}
        />
      );
    },
    [participants, currentUser, onOpenRemoveParticipantAlert],
  );

  return (
    <div className="side-panel-bg-color relative z-10 w-full bg-white dark:bg-dark-primary border-l border-Gray-200 dark:border-Gray-800 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between h-12 px-4 3xl:px-5 border-b border-Gray-100 dark:border-Gray-800/60 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-Green-100 dark:bg-Green-700/20 flex items-center justify-center text-Green-700 dark:text-Green-100">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <p className="text-[15px] 3xl:text-base text-Gray-900 dark:text-white font-semibold tracking-tight whitespace-nowrap truncate">
            {t('left-panel.participants', {
              total: participants.length,
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isPopoutWindow && (
            <button 
              className="w-8 h-8 flex items-center justify-center rounded-full text-Gray-500 hover:bg-Gray-100 hover:text-Blue dark:hover:bg-Gray-800 dark:hover:text-white transition-colors cursor-pointer" 
              onClick={handlePopout}
              title="Bật ra cửa sổ mới"
            >
              <PopoutIconSVG />
            </button>
          )}
          {!isPopoutWindow && (
            <button 
              className="w-8 h-8 flex items-center justify-center rounded-full text-Gray-500 hover:bg-Gray-100 hover:text-Gray-900 dark:hover:bg-Gray-800 dark:hover:text-white transition-colors cursor-pointer" 
              onClick={closePanel}
            >
              <CloseIconSVG />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="search-participants-wrap px-4 3xl:px-5 py-2 shrink-0">
        <div className="w-full relative">
          <div className="search-icon text-Gray-500 absolute top-1/2 -translate-y-1/2 left-3 3xl:left-4 pointer-events-none">
            <SearchIconSVG />
          </div>
          <input
            type="text"
            name="search-participants"
            id="search-participants"
            placeholder="Search for Participant"
            className="text-Gray-950 dark:text-white placeholder:text-Gray-500 h-9 rounded-xl bg-Gray-50 dark:bg-dark-secondary border border-Gray-200 dark:border-Gray-700/60 w-full pl-8 3xl:pl-10 outline-hidden text-xs 3xl:text-sm transition-colors focus:border-Blue focus:ring-1 focus:ring-Blue/20"
            onChange={(e) => setSearchParticipant(e.target.value)}
          />
        </div>
      </div>

      {!currentIsAdmin && !allowViewOtherUsers && (
        <div className="px-4 py-2 mx-4 my-2 mb-3 shrink-0 rounded-lg bg-Blue-50/80 dark:bg-Blue-900/20 border border-Blue-100 dark:border-Blue-800/50 flex flex-col gap-1 shadow-sm">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-Blue-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            <p className="text-xs font-semibold text-Blue-700 dark:text-Blue-300">Chế độ Webinar</p>
          </div>
          <p className="text-[11px] leading-tight text-Blue-600/80 dark:text-Blue-200/70">
            Danh sách khán giả đang được giữ kín để bảo mật thông tin.
          </p>
        </div>
      )}

      {/* List */}
      <div
        ref={outerRef as any}
        className="scrollBar overflow-auto flex-1 min-h-0"
      >
        <div
          className="all-participants-wrap px-2 xl:px-3 3xl:px-5"
          ref={innerRef as any}
        >
          {items.map(({ index, measureRef }) => (
            <li
              key={index}
              ref={measureRef}
              className="w-full list-none min-h-[40px] 3xl:min-h-[60px] py-1 flex items-center"
            >
              {renderParticipant(index)}
            </li>
          ))}
        </div>
      </div>

      {removeParticipantData && (
        <RemoveParticipantAlertModal
          name={removeParticipantData.name}
          userId={removeParticipantData.userId}
          removeType={removeParticipantData.removeType}
          closeAlertModal={onCloseAlertModal}
        />
      )}
    </div>
  );
};

export default ParticipantsComponent;
