import React, {
  ReactElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'react-toastify';
import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';

import NewPoll from './newPoll';
import NewBreakoutRoom from './newBreakoutRoom';
import GenericNotification from './genericNotification';

import { store, useAppSelector } from '../../../store';
import { UserNotification } from '../../../store/slices/interfaces/roomSettings';
import { PopupCloseSVGIcon } from '../../../assets/Icons/PopupCloseSVGIcon';
import { NotifyIconSVG } from '../../../assets/Icons/NotifyIconSVG';

const UserNotifications = () => {
  const toastId = useRef<number | string>('toastId');
  const userNotifications = useAppSelector(
    (state) => state.roomSettings.userNotifications,
  );
  const [hasUnreadNotifications, setHasUnreadNotifications] =
    useState<number>(0);

  const reversedNotifications = useMemo(
    () => [...userNotifications].reverse(),
    [userNotifications],
  );

  const displayToast = (
    message: string | ReactElement,
    notification: UserNotification,
  ) => {
    if (notification.disableToastNotification) {
      return;
    }

    toast(message, {
      type: notification.typeOption,
      autoClose: notification.autoClose,
      toastId: notification.newInstance ? undefined : toastId.current,
      className: 'notification-toast',
    });

    const isPNMWindowTabVisible =
      store.getState().roomSettings.isPNMWindowTabVisible;
    if (!isPNMWindowTabVisible) {
      setHasUnreadNotifications((prevState) => prevState + 1);

      if ('Notification' in window && Notification.permission === 'granted') {
        // we'll see if website has any favicon icon, then we'll use it
        const favicon = document.querySelector("link[rel*='icon']");
        let icon: string | undefined = undefined;
        if (favicon) {
          icon = favicon.getAttribute('href') ?? undefined;
        }
        // oxlint-disable-next-line no-new
        new Notification(notification.message, { icon });
      }
    }
  };

  useEffect(() => {
    if (!userNotifications.length) {
      return;
    }

    // get the last element to display as notification
    const lastNotif = userNotifications[userNotifications.length - 1];
    let toastElm: ReactElement;

    switch (lastNotif.notificationCat) {
      case 'new-poll-created':
        toastElm = (
          <NewPoll key={lastNotif.created} createdAt={lastNotif.created} />
        );
        break;
      case 'breakout-room-invitation':
        toastElm = (
          <NewBreakoutRoom
            key={lastNotif.created}
            receivedInvitationFor={lastNotif.data}
            createdAt={lastNotif.created}
          />
        );
        break;
      default:
        toastElm = (
          <GenericNotification
            key={lastNotif.created}
            notification={lastNotif}
          />
        );
    }
    displayToast(toastElm, lastNotif);
  }, [userNotifications]);

  const displayIcon = (open: boolean) => {
    if (open) {
      setTimeout(() => setHasUnreadNotifications(0), 300);
    }
    if (hasUnreadNotifications > 0) {
      return (
        <div className="relative text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center justify-center">
          <NotifyIconSVG classes="w-4 h-auto" />
          <span className="unseen-notification-count bg-secondary-color w-4 3xl:w-5 h-4 3xl:h-5 rounded-full text-[10px] 3xl:text-xs text-white absolute -top-2 -right-1 flex justify-center items-center">
            {hasUnreadNotifications}
          </span>
        </div>
      );
    } else {
      return (
        <div className="text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors flex items-center justify-center">
          <NotifyIconSVG classes="w-4 h-auto" />
        </div>
      );
    }
  };

  return (
    <Popover className="relative flex">
      {({ open, close }) => (
        <>
          <PopoverButton
            className={`w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors group ${open ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
          >
            {displayIcon(open)}
          </PopoverButton>
          <Transition
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <PopoverPanel
              className="absolute right-0 top-full mt-2 w-[320px] 3xl:w-[360px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl z-[99999] flex flex-col overflow-hidden"
              style={{ maxHeight: 'calc(100vh - 120px)' }}
            >
              {/* Top Accent Strip */}
              <div className="h-1 bg-indigo-500 w-full shrink-0" />
              
              {/* Header */}
              <div className="flex items-center justify-between h-12 px-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900">
                <p className="text-sm font-semibold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  Notifications
                </p>
                <div
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  onClick={() => close()}
                >
                  <PopupCloseSVGIcon classes="text-slate-500" />
                </div>
              </div>

              {/* Content / List */}
              <div className="overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900/50 p-2">
                <div className="grid gap-2">
                  {reversedNotifications.length > 0 ? (
                    reversedNotifications.map((notif) => {
                      switch (notif.notificationCat) {
                        case 'new-poll-created':
                          return (
                            <NewPoll
                              key={notif.created}
                              createdAt={notif.created}
                              onClosePopover={close}
                            />
                          );
                        case 'breakout-room-invitation':
                          return (
                            <NewBreakoutRoom
                              key={notif.created}
                              receivedInvitationFor={notif.data}
                              createdAt={notif.created}
                            />
                          );
                        default:
                          return (
                            <GenericNotification
                              key={notif.created}
                              notification={notif}
                            />
                          );
                      }
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-3">
                        <NotifyIconSVG classes="w-6 h-6 text-indigo-400 dark:text-indigo-500" />
                      </div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Không có thông báo mới
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

export default UserNotifications;
