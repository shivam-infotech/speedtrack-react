import { useEffect, useState, useRef } from 'react';

export default function useNativePlatform() {
  const [isWeb, setIsWeb] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const ignoreNextPopState = useRef(false);

  const postNativeMessage = (type, data = {}) => {
    if (isNative) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type, ...data }));
    }
  };

  useEffect(() => {
    if (window.hasOwnProperty('ReactNativeWebView')) {
      setIsNative(true);
    } else {
      setIsWeb(true);
    }

    window.addEventListener('popstate', () => {
      if (isNative && !ignoreNextPopState.current) {
        postNativeMessage('POP_STATE', { url: window.location.href });
      }
      ignoreNextPopState.current = false;
    });
  }, []);

  const nativeBack = () => {
    if (isNative) {
      ignoreNextPopState.current = true;
      window.history.back();
    }
  };

  return { isWeb, isNative, postNativeMessage, nativeBack };
}
