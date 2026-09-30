import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import ErrorPage, { IErrorPageProps } from '../extra-pages/Error';
import Loading from '../extra-pages/Loading';
import Footer from '../footer';
import Header from '../header';
import MainArea from '../main-area';
import Landing from '../landing';
import InsertE2EEKey from '../extra-pages/InsertE2EEKey';
import DummyAudio from './dummyAudio';
import ReactionOverlay from './reactionOverlay';
import ReactionHUD from './reactionHUD';
import CTAPopup from '../webinar-tools/CTAPopup';
import LowerThirdOverlay from '../webinar-tools/LowerThirdOverlay';
import QALiveOverlay from '../webinar-tools/QALiveOverlay';
import Teleprompter from '../webinar-tools/Teleprompter';
import CountdownTimer from '../webinar-tools/CountdownTimer';

import { store, useAppDispatch } from '../../store';
import { addServerVersion, addToken } from '../../store/slices/sessionSlice';
import HomeDashboard from '../dashboard';
import AudioNotification from './audioNotification';
import useKeyboardShortcuts from '../../helpers/hooks/useKeyboardShortcuts';
import useClientCustomization from '../../helpers/hooks/useClientCustomization';
import useWatchWindowSize from '../../helpers/hooks/useWatchWindowSize';
import useWatchVisibilityChange from '../../helpers/hooks/useWatchVisibilityChange';
import useThemeSettings from '../../helpers/hooks/useThemeSettings';
import { IConnectLivekit } from '../../helpers/livekit/types';
import { isUserRecorder } from '../../helpers/utils';
import { startNatsConn } from '../../helpers/nats';
import { InfoToOpenConn, roomConnectionStatus, verifyToken } from './helper';
import { setActiveSidePanel } from '../../store/slices/bottomIconsActivitySlice';
import { setUIVisibility } from '../../store/slices/roomSettingsSlice';
import { useAppSelector } from '../../store';

const App = () => {
  const dispatch = useAppDispatch();
  const { t, i18n } = useTranslation();
  const visibleFooter = useAppSelector(
    (state) => state.roomSettings.visibleFooter,
  );
  const visibleHeader = useAppSelector(
    (state) => state.roomSettings.visibleHeader,
  );
  // make sure we're using correct body dir
  document.dir = i18n.dir();

  const [loading, setLoading] = useState<boolean>(true);
  // it could be recorder or RTMP bot
  const [userTypeClass, setUserTypeClass] = useState('participant');
  const [currentMediaServerConn, setCurrentMediaServerConn] =
    useState<IConnectLivekit>();

  const [error, setError] = useState<IErrorPageProps | undefined>();
  const [roomConnectionStatus, setRoomConnectionStatus] =
    useState<roomConnectionStatus>('loading');
  const [openConnInfo, setOpenConnInfo] = useState<InfoToOpenConn | undefined>(
    undefined,
  );
  const [openConn, setOpenConn] = useState<boolean>(false);
  const [isAppReady, setIsAppReady] = useState<boolean>(false);
  const [isMouseIdle, setIsMouseIdle] = useState<boolean>(false);
  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visibleFooter) return;

    const handleMouseMove = () => {
      setIsMouseIdle(false);
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
      mouseTimeoutRef.current = setTimeout(() => {
        setIsMouseIdle(true);
      }, 3000);
    };

    window.addEventListener('mousemove', handleMouseMove);
    handleMouseMove(); // Initial trigger

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
    };
  }, [visibleFooter]);

  useKeyboardShortcuts(currentMediaServerConn?.room);
  // to handle different customization
  useClientCustomization();
  useWatchVisibilityChange();
  const { deviceClass, orientationClass, screenHeight } = useWatchWindowSize(
    currentMediaServerConn?.room,
  );
  useThemeSettings();

  const toggleUI = () => {
    // Only toggle on mobile devices for better immersive experience
    if (deviceClass === 'mobile') {
      dispatch(setUIVisibility(!visibleFooter));
    }
  };

  useEffect(() => {
    verifyToken(
      setLoading,
      setError,
      setOpenConnInfo,
      setRoomConnectionStatus,
      setOpenConn,
    ).then();
  }, []);

  useEffect(() => {
    if (openConnInfo && openConn) {
      // we'll store the token that we received from the URL
      dispatch(addToken(openConnInfo.accessToken));
      dispatch(addServerVersion(openConnInfo.serverVersion));

      setRoomConnectionStatus('connecting');
      startNatsConn(
        openConnInfo.natsWsUrls,
        openConnInfo.accessToken,
        openConnInfo.roomId,
        openConnInfo.userId,
        openConnInfo.roomStreamName,
        openConnInfo.natsSubjects,
        setError,
        setRoomConnectionStatus,
        setCurrentMediaServerConn,
      ).then();
    }
  }, [dispatch, openConnInfo, openConn]);

  useEffect(() => {
    switch (roomConnectionStatus) {
      case 'connecting':
      case 'checking':
      case 'receiving-data':
        setLoading(true);
        break;
      case 'error':
        setLoading(false);
        break;
      case 'ready': {
        setLoading(false);
        const session = store.getState().session;
        if (session.currentUser && isUserRecorder(session.currentUser.userId)) {
          dispatch(setActiveSidePanel(null));
        }
        if (session.currentUser?.metadata?.isAdmin) {
          setUserTypeClass('admin');
        }
        break;
      }
    }
  }, [dispatch, roomConnectionStatus]);

  const renderElms = useMemo(() => {
    switch (true) {
      case loading:
        return <Loading text={t('app.' + roomConnectionStatus)} />;
      case error && !loading:
        return <ErrorPage title={error.title} text={error.text} />;
      case roomConnectionStatus === 'showing-dashboard':
        return <HomeDashboard />;
      case roomConnectionStatus === 'insert-e2ee-key':
        return <InsertE2EEKey setOpenConn={setOpenConn} />;
      case isAppReady:
        return (
          <div 
            className={`plugNmeet-app overflow-hidden h-full relative flex flex-col ${!visibleFooter ? 'focus-mode' : ''} ${isMouseIdle && !visibleFooter ? 'cursor-none' : ''}`}
            onClick={toggleUI}
          >
            <div className={`flex-shrink-0 w-full transition-all duration-300 ${!visibleHeader ? 'absolute top-0 z-[100] h-0 overflow-hidden' : 'relative z-10'}`}>
              <Header />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden w-full relative z-0">
              <MainArea />
              <LowerThirdOverlay />
              <QALiveOverlay />
            </div>
            <div className={`flex-shrink-0 w-full transition-all duration-300 ${!visibleFooter ? 'absolute bottom-0 z-[100] h-0 overflow-hidden' : 'relative z-10'}`}>
              <Footer />
            </div>
            <AudioNotification />
            <DummyAudio />
            <ReactionOverlay />
            <ReactionHUD />
            <CTAPopup />
            <Teleprompter />
            <CountdownTimer />

            {/* Floating Restore Button when UI is hidden */}
            {!visibleFooter && (
              <button
                className={`fixed left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[12px] font-medium border border-white/10 shadow-lg z-[200] outline-none transition-all duration-500 ${
                  isMouseIdle ? 'opacity-0 pointer-events-none bottom-[-50px]' : 'opacity-100 bottom-4 animate-pulse hover:animate-none hover:bg-black/60 active:scale-95'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(setUIVisibility(true));
                }}
              >
                {t('footer.show-ui', 'Hiển thị công cụ họp')}
              </button>
            )}
          </div>
        );
      default:
        return (
          <Landing
            setIsAppReady={setIsAppReady}
            roomConnectionStatus={roomConnectionStatus}
          />
        );
    }
    //eslint-disable-next-line
  }, [loading, error, roomConnectionStatus, isAppReady, visibleFooter, visibleHeader, isMouseIdle, deviceClass, dispatch]);

  return (
    <div
      className={`${orientationClass} ${deviceClass} ${userTypeClass} bg-white dark:bg-dark-primary`}
      style={{ height: screenHeight }}
    >
      {renderElms}
    </div>
  );
};

export default App;
