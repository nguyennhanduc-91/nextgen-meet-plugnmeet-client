import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface PopoutWindowProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  width?: number;
  height?: number;
}

const PopoutWindow: React.FC<PopoutWindowProps> = ({ 
  title, 
  children, 
  onClose,
  width = 400,
  height = 700 
}) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const newWindowRef = useRef<Window | null>(null);
  const onCloseRef = useRef(onClose);
  const isReadyRef = useRef(false);

  // Keep onClose ref up-to-date without re-triggering the effect
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    // Prevent re-opening if already open
    if (newWindowRef.current && !newWindowRef.current.closed) {
      return;
    }

    // 1. Open a new blank window
    const left = Math.round(window.screenX + (window.outerWidth - width) / 2);
    const top = Math.round(window.screenY + (window.outerHeight - height) / 2);
    const win = window.open(
      'about:blank',
      `popout_${title.replace(/\s/g, '_')}_${Date.now()}`,
      `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
    );

    if (!win) {
      console.error('Popup blocker prevented opening the window. Please allow popups for this site.');
      onCloseRef.current();
      return;
    }

    newWindowRef.current = win;

    // 2. Build document structure
    win.document.open();
    win.document.write('<!DOCTYPE html><html><head></head><body></body></html>');
    win.document.close();

    // 3. Set title
    win.document.title = title;

    // 4. Copy styles from parent window
    Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).forEach(element => {
      win.document.head.appendChild(element.cloneNode(true));
    });

    // 5. Copy class attributes from html and body (for dark mode)
    win.document.documentElement.className = document.documentElement.className;
    win.document.body.className = document.body.className;

    // 6. Apply body styles
    win.document.body.style.margin = '0';
    win.document.body.style.padding = '0';
    win.document.body.style.height = '100vh';
    win.document.body.style.overflow = 'hidden';

    // 7. Create container div for our portal
    const el = win.document.createElement('div');
    el.id = 'popout-root';
    el.style.height = '100vh';
    el.style.width = '100vw';
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    win.document.body.appendChild(el);

    // 8. Mark as ready, then attach close listener with a delay
    //    to avoid catching the initial page load events
    setTimeout(() => {
      isReadyRef.current = true;
    }, 500);

    // Use 'unload' instead of 'beforeunload' and guard with isReady
    const handleUnload = () => {
      if (isReadyRef.current) {
        onCloseRef.current();
      }
    };
    win.addEventListener('unload', handleUnload);

    // Also poll for window closed (fallback for cross-origin edge cases)
    const pollTimer = setInterval(() => {
      if (win.closed) {
        clearInterval(pollTimer);
        if (isReadyRef.current) {
          onCloseRef.current();
        }
      }
    }, 500);

    // 9. Set container for Portal
    setContainer(el);

    // Cleanup when component unmounts from parent
    return () => {
      clearInterval(pollTimer);
      isReadyRef.current = false;
      if (win && !win.closed) {
        win.removeEventListener('unload', handleUnload);
        win.close();
      }
      newWindowRef.current = null;
      setContainer(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, width, height]); // intentionally exclude onClose — use ref instead

  // If container is ready, render children via Portal
  return container ? createPortal(children, container) : null;
};

export default PopoutWindow;
