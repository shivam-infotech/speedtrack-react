import { useEffect, useState } from 'react';

export default function useNativePlatform() {
  const [isWeb, setIsWeb] = useState(false);
  const [isNative, setIsNative] = useState(false);

  const postNativeMessage = (namespace, data) => {
    if (isNative) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ namespace, data }));
    }
  };

  useEffect(() => {
    if (window.hasOwnProperty('ReactNativeWebView')) setIsNative(true);
    else setIsWeb(true);
  });

  return { isWeb, isNative, postNativeMessage };
}
