import React, { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { getNatsConn } from '../../helpers/nats';
import { DataMsgBodyType } from 'plugnmeet-protocol-js';
import { updateActiveLowerThird, updateTimer } from '../../store/slices/roomSettingsSlice';
import { updateShowTimer } from '../../store/slices/bottomIconsActivitySlice';

/**
 * WebinarAutomationManager
 * Headless component that listens to Redux automation states and sets up
 * setInterval loops to automatically broadcast NATS messages (Lower Third & Timer).
 * Only runs if the user is an Admin/Host.
 */
const WebinarAutomationManager = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.session.currentUser);
  
  const canManageAutomation = !!currentUser?.metadata?.isAdmin;

  const lowerThirdAutomation = useAppSelector((state) => state.roomSettings.lowerThirdAutomation);
  const timerAutomation = useAppSelector((state) => state.roomSettings.timerAutomation);

  // References to keep track of active intervals/timeouts
  const ltIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const ltTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Lower Third Automation ---
  useEffect(() => {
    if (!canManageAutomation) return;

    // Clear existing
    if (ltIntervalRef.current) clearInterval(ltIntervalRef.current);
    if (ltTimeoutRef.current) clearTimeout(ltTimeoutRef.current);

    if (lowerThirdAutomation?.enabled) {
      const { name, title, delaySec, durationSec } = lowerThirdAutomation;

      const triggerLowerThird = () => {
        try {
          const conn = getNatsConn();
          
          // Show
          const showPayload = { name, title: title || undefined };
          conn?.sendDataMessage(DataMsgBodyType.INFO, JSON.stringify({ type: 'WEBINAR_LOWER_THIRD', payload: showPayload }));
          dispatch(updateActiveLowerThird(showPayload));

          // Hide after duration
          ltTimeoutRef.current = setTimeout(() => {
            conn?.sendDataMessage(DataMsgBodyType.INFO, JSON.stringify({ type: 'WEBINAR_LOWER_THIRD', payload: null }));
            dispatch(updateActiveLowerThird(null));
          }, durationSec * 1000);

        } catch (e) {
          console.error('LowerThird auto broadcast error:', e);
        }
      };

      // Run immediately first time
      triggerLowerThird();
      
      // Then loop every durationSec + delaySec
      ltIntervalRef.current = setInterval(triggerLowerThird, (durationSec + delaySec) * 1000);
    }

    return () => {
      if (ltIntervalRef.current) clearInterval(ltIntervalRef.current);
      if (ltTimeoutRef.current) clearTimeout(ltTimeoutRef.current);
    };
  }, [lowerThirdAutomation, canManageAutomation, dispatch]);

  // --- Timer Automation ---
  useEffect(() => {
    if (!canManageAutomation) return;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);

    if (timerAutomation?.enabled) {
      const { delaySec, durationSec } = timerAutomation;

      const triggerTimer = () => {
        try {
          const conn = getNatsConn();
          
          // Show Timer
          const timerPayload = {
            isActive: true,
            secondsRemaining: durationSec,
            duration: durationSec,
          };
          
          conn?.sendDataMessage(DataMsgBodyType.INFO, JSON.stringify({ type: 'WEBINAR_TIMER', payload: timerPayload }));
          dispatch(updateTimer(timerPayload));
          dispatch(updateShowTimer(true)); // Ensure UI is shown locally

        } catch (e) {
          console.error('Timer auto broadcast error:', e);
        }
      };

      // Run immediately
      triggerTimer();

      // Loop
      timerIntervalRef.current = setInterval(triggerTimer, (durationSec + delaySec) * 1000);
    } else {
      // If disabled, ensure it's not popping up
      // Note: We don't automatically stop an active timer when automation is turned off,
      // let the Host stop it manually if needed.
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (timerTimeoutRef.current) clearTimeout(timerTimeoutRef.current);
    };
  }, [timerAutomation, canManageAutomation, dispatch]);

  // This component renders nothing
  return null;
};

export default WebinarAutomationManager;
