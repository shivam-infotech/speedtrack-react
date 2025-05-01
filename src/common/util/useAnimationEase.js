import { useMemo } from 'react';

const useAnimationEase = (type) => useMemo(() => {
  const animationTypes = ['linear', 'easeInOutQuad', 'easeInOutQuart', 'easeInOutQuint', 'easeInOutSine', 'easeInOutExpo', 'easeInOutCirc', 'easeInOutBack'];
  const selectedType = type && animationTypes.includes(type) ? animationTypes[animationTypes.indexOf(type)] : animationTypes[0];

  const animations = {
    linear: (t) => t,
    easeInOutQuad(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },
    easeInOutQuart(t) { return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t; },
    easeInOutQuint(t) { return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t; },
    easeInOutSine(t) { return -0.5 * (Math.cos(Math.PI * t) - 1); },
    easeInOutExpo(t) { return t == 0 ? 0 : t == 1 ? 1 : t < 0.5 ? 2 ** (20 * t - 10) / 2 : -(2 ** (-20 * t + 10)) / 2 + 1; },
    easeInOutCirc(t) { return t < 0.5 ? (1 - Math.sqrt(1 - 2 * t)) / 2 : (Math.sqrt(1 - (2 * t - 1) ** 2) + 1) / 2; },
    easeInOutBack(t) { return t < 0.5 ? (2 * t ** 2 * ((1.525 + 1) * 2 * t - 1.525)) / 2 : (2 * t ** 2 * ((1.525 + 1) * 2 * t - 1.525) + 2) / 2; },
  };

  return animations[selectedType];
}, [type]);

export default useAnimationEase;
