import React, {
  Dispatch,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';

import { store, useAppDispatch, useAppSelector } from '../../store';
import { toggleStartup } from '../../store/slices/sessionSlice';
import {
  addAudioDevices,
  addVideoDevices,
  updateSelectedAudioDevice,
  updateSelectedVideoDevice,
} from '../../store/slices/roomSettingsSlice';
import { Volume } from '../../assets/Icons/Volume';
import { roomConnectionStatus } from '../app/helper';
import { getNatsConn } from '../../helpers/nats';
import { useMediaDevices } from './hooks/useMediaDevices';
import { MicrophoneOff } from '../../assets/Icons/MicrophoneOff';
import { CameraOff } from '../../assets/Icons/CameraOff';
import { LoadingIcon } from '../../assets/Icons/Loading';

import MicrophoneIcon from './microphone';
import WebcamIcon from './webcam';
import WebcamPreview from '../footer/modals/webcam/webcamPreview';

interface StartupJoinModalProps {
  setIsAppReady: Dispatch<boolean>;
  roomConnectionStatus: roomConnectionStatus;
}

const Landing = ({
  setIsAppReady,
  roomConnectionStatus,
}: StartupJoinModalProps) => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  // static values
  const { isWebcamAllowed } = useMemo(() => {
    const session = store.getState().session;
    const roomFeatures = session.currentRoom.metadata?.roomFeatures;
    const isAdmin = !!session.currentUser?.metadata?.isAdmin;

    let show = true;
    if (!roomFeatures?.allowWebcams) {
      show = false;
    } else if (roomFeatures?.adminOnlyWebcams && !isAdmin) {
      show = false;
    }

    return {
      isWebcamAllowed: show,
    };
  }, []);

  const isStartup = useAppSelector((state) => state.session.isStartup);
  const waitForApproval = useAppSelector(
    (state) => state.session.currentUser?.metadata?.waitForApproval,
  );
  const waitingRoomMessage = useAppSelector(
    (state) =>
      state.session.currentRoom.metadata?.roomFeatures?.waitingRoomFeatures
        ?.waitingRoomMsg,
  );
  const lockMicrophone = useAppSelector(
    (state) =>
      state.session.currentUser?.metadata?.lockSettings?.lockMicrophone,
  );
  const lockWebcam = useAppSelector(
    (state) => state.session.currentUser?.metadata?.lockSettings?.lockWebcam,
  );

  const {
    audioDevices,
    videoDevices,
    selectedAudioDevice,
    selectedVideoDevice,
    setSelectedAudioDevice,
    setSelectedVideoDevice,
    enableMediaDevices,
    disableWebcam,
    disableMic,
  } = useMediaDevices();

  const [showLoadingMsg, setShowLoadingMsg] = useState<string | undefined>(
    undefined,
  );
  const [isReadyToConn, setIsReadyToConn] = useState<boolean | undefined>(
    undefined,
  );
  const [hasAutoRequested, setHasAutoRequested] = useState(false);

  // Auto-request or Auto-join from Dashboard
  useEffect(() => {
    if (isStartup && !hasAutoRequested && !showLoadingMsg) {
      // If user needs waiting room approval, load saved devices then skip to waiting room
      if (waitForApproval) {
        // Still load saved devices so mic/camera are ready when approved
        const savedVideo = localStorage.getItem('pnm_video_device');
        const savedAudio = localStorage.getItem('pnm_audio_device');
        if (savedVideo) {
          dispatch(updateSelectedVideoDevice(savedVideo));
          setSelectedVideoDevice(savedVideo);
        }
        if (savedAudio) {
          dispatch(updateSelectedAudioDevice(savedAudio));
          setSelectedAudioDevice(savedAudio);
        }
        // Enumerate full device list
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          const audioList = devices
            .filter((d) => d.kind === 'audioinput' && d.deviceId)
            .map((d) => ({ id: d.deviceId, label: d.label }));
          const videoList = devices
            .filter((d) => d.kind === 'videoinput' && d.deviceId)
            .map((d) => ({ id: d.deviceId, label: d.label }));
          if (audioList.length) dispatch(addAudioDevices(audioList));
          if (videoList.length) dispatch(addVideoDevices(videoList));
        }).catch(() => { /* permission denied, ignore */ });

        setHasAutoRequested(true);
        setIsReadyToConn(true);
        return;
      }

      if (!selectedAudioDevice && !selectedVideoDevice) {
        // 1. Check if user already setup devices in Dashboard
        const savedVideo = localStorage.getItem('pnm_video_device');
        const savedAudio = localStorage.getItem('pnm_audio_device');
        
        if (savedVideo !== null || savedAudio !== null) {
          if (savedVideo) {
             dispatch(updateSelectedVideoDevice(savedVideo));
             setSelectedVideoDevice(savedVideo);
          }
          if (savedAudio) {
             dispatch(updateSelectedAudioDevice(savedAudio));
             setSelectedAudioDevice(savedAudio);
          }

          // Also enumerate and populate the full device list in Redux
          // so the in-meeting mic/cam menus show all available devices
          navigator.mediaDevices.enumerateDevices().then((devices) => {
            const audioList = devices
              .filter((d) => d.kind === 'audioinput' && d.deviceId)
              .map((d) => ({ id: d.deviceId, label: d.label }));
            const videoList = devices
              .filter((d) => d.kind === 'videoinput' && d.deviceId)
              .map((d) => ({ id: d.deviceId, label: d.label }));
            if (audioList.length) dispatch(addAudioDevices(audioList));
            if (videoList.length) dispatch(addVideoDevices(videoList));
          }).catch(() => { /* permission denied, ignore */ });
          
          setHasAutoRequested(true);
          setIsReadyToConn(true); // Jump directly to NATS finalize/Waiting Room!
          return;
        }

        // 2. Otherwise auto request (fallback)
        setHasAutoRequested(true);
        if (!lockMicrophone && (!lockWebcam && isWebcamAllowed)) {
           enableMediaDevices('both');
        } else if (!lockMicrophone) {
           enableMediaDevices('audio');
        } else if (!lockWebcam && isWebcamAllowed) {
           enableMediaDevices('video');
        }
      }
    }
  }, [isStartup, hasAutoRequested, waitForApproval, showLoadingMsg, selectedAudioDevice, selectedVideoDevice, lockMicrophone, lockWebcam, isWebcamAllowed, enableMediaDevices, dispatch, setSelectedAudioDevice, setSelectedVideoDevice]);

  useEffect(() => {
    switch (roomConnectionStatus) {
      case 'media-server-conn-start':
        setShowLoadingMsg(t('landing.connecting-media-server'));
        break;
      case 'media-server-conn-established':
        dispatch(toggleStartup(false));
        setIsAppReady(true);
        setShowLoadingMsg(undefined);
        break;
    }
  }, [roomConnectionStatus, t, dispatch, setIsAppReady]);

  useEffect(() => {
    if (waitForApproval) {
      // Show waiting room immediately — no need to wait for isReadyToConn
      setShowLoadingMsg(t('landing.waiting-for-approval-title'));
    } else {
      if (isReadyToConn) {
        const conn = getNatsConn();
        if (conn) {
          setShowLoadingMsg(t('landing.finalizing-app'));
          conn.finalizeAppConn();
        }
      }
    }
  }, [t, waitForApproval, isReadyToConn, roomConnectionStatus]);

  const openConn = useCallback(() => {
    if (selectedVideoDevice !== '') {
      dispatch(updateSelectedVideoDevice(selectedVideoDevice));
      dispatch(addVideoDevices(videoDevices));
    }
    if (selectedAudioDevice !== '') {
      dispatch(updateSelectedAudioDevice(selectedAudioDevice));
      dispatch(addAudioDevices(audioDevices));
    }

    setIsReadyToConn(true);
  }, [
    selectedAudioDevice,
    selectedVideoDevice,
    dispatch,
    videoDevices,
    audioDevices,
  ]);

  const getJoinPrompt = useCallback(() => {
    if (lockMicrophone && (lockWebcam || !isWebcamAllowed)) {
      return t('landing.join-prompt-both-locked');
    } else if (lockMicrophone) {
      return t('landing.join-prompt-mic-locked');
    } else if (lockWebcam || !isWebcamAllowed) {
      return t('landing.join-prompt-cam-locked');
    }
    return t('landing.join-prompt');
  }, [lockMicrophone, lockWebcam, isWebcamAllowed, t]);

  const getEnableDeviceButton = useCallback(() => {
    if (lockMicrophone) {
      return {
        text: t('landing.enable-cam-btn'),
        action: () => enableMediaDevices('video'),
      };
    } else if (lockWebcam || !isWebcamAllowed) {
      return {
        text: t('landing.enable-mic-btn'),
        action: () => enableMediaDevices('audio'),
      };
    }
    return {
      text: t('landing.enable-mic-cam-btn'),
      action: () => enableMediaDevices('both'),
    };
  }, [t, lockMicrophone, lockWebcam, isWebcamAllowed, enableMediaDevices]);

  return (
    isStartup && (
      <div
        id="startupJoinModal"
        className={`absolute w-full join-the-audio-popup bg-Gray-100 dark:bg-dark-primary min-h-full flex items-center justify-center p-5 scrollBar`}
      >
        <div className="inner m-auto bg-Gray-50 dark:bg-dark-primary border border-Gray-300 dark:border-Gray-700 overflow-hidden rounded-2xl w-full max-w-4xl 3xl:max-w-5xl">
          <div className="head bg-white dark:bg-dark-secondary  h-[50px] 3xl:h-[60px] px-3 sm:px-5 flex justify-center sm:justify-start text-center sm:text-left items-center text-Gray-950 dark:text-white text-sm sm:text-base 3xl:text-lg font-medium border-b border-Gray-200 dark:border-Gray-700">
            {t('landing.modal-title')}
          </div>
          <div className="wrapper bg-Gray-50 dark:bg-dark-secondary pt-4 sm:pt-8 3xl:pt-11 pb-4 sm:pb-10 3xl:pb-14 px-4 sm:px-8 3xl:px-12 flex flex-wrap">
            {/* WAITING ROOM 2.0 (Premium Event Lobby) */}
            {waitForApproval && showLoadingMsg ? (
              <div className="w-full relative overflow-hidden rounded-2xl bg-slate-950 text-white min-h-[400px] flex shadow-2xl">
                {/* Background overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/40 to-slate-900/90 z-0"></div>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay z-0"></div>

                <div className="relative z-10 w-full flex flex-col md:flex-row items-center p-8 lg:p-12 gap-10">
                  {/* Left: Trailer / Hero Image */}
                  <div className="w-full md:w-1/2 rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 aspect-video relative group bg-black flex items-center justify-center">
                    {/* Placeholder for Video Trailer */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                      <h4 className="text-white font-bold text-lg">Sự kiện sắp diễn ra...</h4>
                      <p className="text-white/70 text-sm">Vui lòng chờ trong giây lát</p>
                    </div>
                    <button className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all shadow-lg text-white">
                      <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>

                  {/* Right: Info & Countdown */}
                  <div className="w-full md:w-1/2 flex flex-col justify-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-widest w-fit mb-4">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                      </span>
                      Phòng chờ Sự Kiện
                    </div>
                    
                    <h3 className="font-black text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-4 tracking-tight">
                      {t('landing.waiting-for-approval-title')}
                    </h3>
                    
                    <p className="text-base lg:text-lg text-slate-300 mb-8 max-w-lg leading-relaxed">
                      {waitingRoomMessage || 'Sự kiện sắp bắt đầu. Vui lòng giữ cửa sổ này mở, Host sẽ duyệt bạn vào trong giây lát.'}
                    </p>

                    {/* Fake Countdown Timer */}
                    <div className="flex gap-4 mb-8">
                      {['Giờ', 'Phút', 'Giây'].map((label, i) => (
                        <div key={label} className="flex flex-col items-center">
                          <div className="w-16 h-16 rounded-xl bg-slate-800/80 backdrop-blur-md border border-slate-700 flex items-center justify-center text-2xl font-black text-indigo-400 font-mono shadow-inner shadow-black/50">
                            {['00', '15', '45'][i]}
                          </div>
                          <span className="text-xs font-semibold text-slate-400 mt-2 uppercase tracking-wider">{label}</span>
                        </div>
                      ))}
                    </div>
                
                    <button
                      type="button"
                      onClick={() => {
                         localStorage.removeItem('pnm_recent_name');
                         window.location.href = window.location.origin;
                      }}
                      className="px-6 py-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-sm tracking-wide transition-all flex items-center gap-2 hover:text-white w-fit"
                    >
                      <i className="pnm-call-disconnect text-lg" />
                      Rời khỏi sảnh chờ
                    </button>
                  </div>
                </div>
              </div>
            ) : (
            <>
            {/* NORMAL: Two-column device selection layout */}
            <div className="left relative z-20 bg-Gray-25 dark:bg-Gray-800 shadow-box1 border border-Gray-200 dark:border-Gray-700 p-2 w-full md:w-1/2 rounded-2xl mb-5 sm:mb-0">
              <div className="camera bg-Gray-950 rounded-lg overflow-hidden w-full h-56 sm:h-72 3xl:h-80">
                {selectedVideoDevice !== '' && (
                  <WebcamPreview deviceId={selectedVideoDevice} />
                )}
              </div>
              <div className="micro-cam-wrap flex justify-center py-5 gap-5 empty:hidden">
                {lockMicrophone ? (
                  <div className="microphone-wrap relative cursor-not-allowed shadow-IconBox border border-Red-200 rounded-2xl h-11 w-11 flex items-center justify-center transition-all duration-300 text-Gray-950">
                    <MicrophoneOff classes="h-6 w-6 text-red-200" />
                    <i className="pnm-lock absolute -top-1 -right-1 z-10 text-red-500"></i>
                  </div>
                ) : (
                  <MicrophoneIcon
                    audioDevices={audioDevices}
                    enableMediaDevices={enableMediaDevices}
                    disableMic={disableMic}
                    setSelectedAudioDevice={setSelectedAudioDevice}
                    selectedAudioDevice={selectedAudioDevice}
                  />
                )}
                {lockWebcam || !isWebcamAllowed ? (
                  <div className="cam-wrap relative cursor-not-allowed shadow-IconBox border border-Red-200 rounded-2xl h-11 w-11 flex items-center justify-center transition-all duration-300 text-Gray-950">
                    <CameraOff classes="h-6 w-6 text-red-200" />
                    <i className="pnm-lock absolute -top-1 -right-1 z-10 text-red-500" />
                  </div>
                ) : (
                  <WebcamIcon
                    videoDevices={videoDevices}
                    enableMediaDevices={enableMediaDevices}
                    disableWebcam={disableWebcam}
                    setSelectedVideoDevice={setSelectedVideoDevice}
                    selectedVideoDevice={selectedVideoDevice}
                  />
                )}
              </div>
            </div>
            <div className="right w-full md:w-1/2 md:pl-8 3xl:pl-16 sm:py-8 flex items-center">
              {showLoadingMsg ? (
                <div className="inner waiting-room-contents relative md:-mt-10 w-full">
                  <div className="texts text-center md:text-left">
                    <h3 className="font-bold text-lg md:text-xl 3xl:text-2xl text-Gray-950 dark:text-white leading-snug pb-2 flex items-center justify-center md:justify-start gap-2">
                      <LoadingIcon
                        className="inline w-7 h-7 text-Gray-200 animate-spin"
                        fillColor={'var(--color-primary-color)'}
                      />
                      {showLoadingMsg}
                    </h3>
                  </div>
                  <div className="mt-8 flex justify-center md:justify-start">
                     <button
                        type="button"
                        onClick={() => {
                           localStorage.removeItem('pnm_recent_name');
                           window.location.href = window.location.origin;
                        }}
                        className="px-6 py-2.5 rounded-[12px] border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold text-sm tracking-wide transition-colors flex items-center gap-2"
                     >
                        <i className="pnm-call-disconnect text-lg" />
                        Rời khỏi đây / Hủy kết nối
                     </button>
                  </div>
                </div>
              ) : (
                <div className="inner relative w-full">
                  <div className="texts text-center md:text-left">
                    <h3 className="font-bold text-xl 3xl:text-2xl text-Gray-950 dark:text-white leading-snug pb-2">
                      {t('landing.ready-to-join')}
                    </h3>
                    <p className="text-sm 3xl:text-base text-Gray-800 dark:text-white/90">
                      {getJoinPrompt()}
                    </p>
                  </div>
                  <div className="buttons grid gap-3 w-full pt-10">
                    {lockMicrophone && (lockWebcam || !isWebcamAllowed) ? (
                      // Case 1: Both devices are locked, only show the listener button.
                      <button
                        id="listenOnlyJoin"
                        type="button"
                        disabled={isReadyToConn === true}
                        className="secondary-button w-full h-10 3xl:h-11 cursor-pointer text-sm 3xl:text-base font-semibold bg-Gray-25 hover:bg-Blue hover:text-white border border-Gray-300 rounded-[15px] flex justify-center items-center gap-2 transition-all duration-300 shadow-button-shadow disabled:bg-Gray-200 disabled:border-Gray-300 disabled:text-Gray-400 disabled:cursor-not-allowed"
                        onClick={() => openConn()}
                      >
                        {t('landing.join-as-listener-btn')}
                        <Volume />
                      </button>
                    ) : // Case 2: At least one device is available.
                    selectedAudioDevice !== '' || selectedVideoDevice !== '' ? (
                      // Sub-case 2a: A device has been selected, show the "Join" button.
                      <button
                        type="button"
                        disabled={isReadyToConn === true}
                        className="primary-button w-full h-10 3xl:h-11 cursor-pointer text-sm 3xl:text-base font-semibold bg-Blue hover:bg-white border border-[#4338ca] rounded-[15px] text-white hover:text-Gray-950 transition-all duration-300 shadow-button-shadow disabled:bg-Gray-200 disabled:border-Gray-300 disabled:text-Gray-400 disabled:cursor-not-allowed"
                        onClick={() => openConn()}
                      >
                        {t('join')}
                      </button>
                    ) : (
                      // Sub-case 2b: No device selected yet, show the "Enable..." and "Listener" buttons.
                      <>
                        <button
                          type="button"
                          className="primary-button w-full h-10 3xl:h-11 cursor-pointer text-sm 3xl:text-base font-semibold hover:bg-white border rounded-[15px] transition-all duration-300 shadow-button-shadow relative border-[#4338ca] bg-Blue text-white hover:text-Gray-950 disabled:bg-Gray-200 disabled:border-Gray-300 disabled:text-Gray-400 disabled:cursor-not-allowed"
                          disabled={isReadyToConn === true}
                          onClick={getEnableDeviceButton().action}
                        >
                          <span className="relative flex items-center justify-center gap-2">
                            {getEnableDeviceButton().text}
                          </span>
                        </button>
                        <button
                          id="listenOnlyJoin"
                          type="button"
                          disabled={isReadyToConn === true}
                          className="secondary-button w-full h-10 3xl:h-11 cursor-pointer text-sm 3xl:text-base font-semibold bg-Gray-25 hover:bg-Blue hover:text-white border border-Gray-300 rounded-[15px] flex justify-center items-center gap-2 transition-all duration-300 shadow-button-shadow disabled:bg-Gray-200 disabled:border-Gray-300 disabled:text-Gray-400 disabled:cursor-not-allowed"
                          onClick={() => openConn()}
                        >
                          {t('landing.join-as-listener-btn')}
                          <Volume />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            </>
            )}
          </div>
        </div>
      </div>
    )
  );
};

export default Landing;
