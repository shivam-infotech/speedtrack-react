import { useSpeech } from 'react-text-to-speech';
import useNativePlatform from './useNativePlatform';

export default function useGlobalSpeech(text) {
  const config = { pitch: 1, rate: 0.8, volume: 1, lang: 'hi-IN', voiceURI: 'Google हिन्दी', autoPlay: false, text };
  const { start: webSpeechStart } = useSpeech(config);
  const { isWeb, isNative, postNativeMessage } = useNativePlatform();

  const start = () => {
    if (isWeb) webSpeechStart();
    else postNativeMessage('tts-speech', text);
  };

  return start;
}
