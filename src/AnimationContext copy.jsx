import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { create } from 'zustand';
import useAnimationEase from './common/util/useAnimationEase';
import { calculateBearing } from './common/util/position';

export const useAnimatedPositions = create((set, get) => ({
  animPositions: {},
  animHistory: {},
  setPositions: (positions) => set({ animPositions: positions }),
  setHistory: (history) => set({ animHistory: history }),
  resetHistory: () => set({ animHistory: {} }),
}));

export const AnimationController = ({ animationDuration = 1000, targetFPS = 30 }) => {
  const positions = useSelector((state) => state.session.positions);
  const easing = useAnimationEase('linear');

  const animationQueueRef = useRef({});
  const lastPositionRef = useRef({});
  const animatedRef = useRef(null);
  const isAnimating = useRef(false);
  const adjustedDurationRef = useRef(animationDuration);
  const isUnfocused = useRef(false);

  const { setPositions, setHistory } = useAnimatedPositions.getState();

  useEffect(() => {
    for (const [deviceId, pos] of Object.entries(positions)) {
      const last = lastPositionRef.current[deviceId];
      if (!last || last.latitude !== pos.latitude || last.longitude !== pos.longitude || last?.attributes?.activity !== pos?.attributes?.activity) {
        const from = last || pos;
        const to = pos;

        if (!animationQueueRef.current[deviceId]) {
          animationQueueRef.current[deviceId] = [];
        }

        animationQueueRef.current[deviceId].push([{ ...from, _startTime: performance.now() }, to]);
        lastPositionRef.current[deviceId] = pos;
      }
    }

    if (!isAnimating.current) {
      isAnimating.current = true;

      if (isUnfocused.current) skipToLatest();
      else ProcessQueue();
    }
  }, [positions]);

  const ProcessQueue = () => {
    const animate = (now) => {
      let hasWork = false;
      const newPositions = { ...useAnimatedPositions.getState().animPositions };
      const newHistory = { ...useAnimatedPositions.getState().animHistory };

      for (const [deviceId, queue] of Object.entries(animationQueueRef.current)) {
        if (queue.length > 0) {
          const [from, to] = queue[0];
          const adjustedDuration = adjustedDurationRef.current;
          const elapsed = performance.now() - from._startTime;
          const progress = Math.min(Math.max(elapsed / adjustedDuration, 0), 1);
          const eased = easing(progress);

          const latitude = from.latitude + (to.latitude - from.latitude) * eased;
          const longitude = from.longitude + (to.longitude - from.longitude) * eased;
          const rotation = calculateBearing(from.latitude, from.longitude, to.latitude, to.longitude);

          newPositions[deviceId] = {
            ...to,
            latitude,
            longitude,
            rotation,
          };

          if (!newHistory[deviceId]) newHistory[deviceId] = [];
          newHistory[deviceId].push([longitude, latitude]);

          if (progress < 1) {
            if (isUnfocused.current) return skipToLatest();
            hasWork = true;
          } else {
            queue.shift();
            if (isUnfocused.current) return skipToLatest();
            if (queue.length > 0) {
              queue[0][0]._startTime = performance.now();
              hasWork = true;
            }
          }
        }
      }

      setPositions(newPositions);
      setHistory(newHistory);

      if (hasWork) {
        if (isUnfocused.current) return skipToLatest();
        animatedRef.current = requestAnimationFrame(animate);
      } else {
        isAnimating.current = false;
        animatedRef.current = null;
        animationQueueRef.current = {};
      }
    };

    animatedRef.current = requestAnimationFrame(animate);
  };

  const skipToLatest = () => {
    if (animatedRef.current) cancelAnimationFrame(animatedRef.current);

    const newPositions = { ...useAnimatedPositions.getState().animPositions };
    const newHistory = { ...useAnimatedPositions.getState().animHistory };

    for (const [deviceId, queue] of Object.entries(animationQueueRef.current)) {
      if (queue.length > 0) {
        const [, to] = queue[0];
        const { longitude, latitude } = to;

        newPositions[deviceId] = to;

        if (!newHistory[deviceId]) newHistory[deviceId] = [];
        newHistory[deviceId].push([longitude, latitude]);

        queue.shift();
      }
    }

    setPositions(newPositions);
    setHistory(newHistory);

    isAnimating.current = false;
    animatedRef.current = null;
    animationQueueRef.current = {};
  };

  useEffect(() => {
    const whenBlur = (evt) => {
      console.log('goes to blur state');
      isUnfocused.current = true;
    };

    const whenFocus = (evt) => {
      console.log('comes back to focus state');
      isUnfocused.current = false;
    };

    window.addEventListener('blur', whenBlur);
    window.addEventListener('focus', whenFocus);

    return () => {
      window.removeEventListener('blur', whenBlur);
      window.removeEventListener('focus', whenFocus);

      if (animatedRef.current) {
        skipToLatest();
        cancelAnimationFrame(animatedRef.current);
      }
    };
  }, []);

  return null;
};
