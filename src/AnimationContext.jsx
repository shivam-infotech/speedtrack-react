// zustand store + logic integrated from original context-based system
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { create } from "zustand";
import useAnimationEase from "./common/util/useAnimationEase";
import { calculateBearing } from "./common/util/position";

export const useAnimatedPositions = create((set, get) => ({
  animPositions: {},
  animHistory: {},
  setPositions: (positions) => set({ animPositions: positions }),
  setHistory: (history) => set({ animHistory: history }),
}));

export const AnimationController = ({animationDuration = 1000, targetFPS = 30}) => {
  const positions = useSelector((state) => state.session.positions);
  const easing = useAnimationEase("easeInOutQuad");

  const animationQueueRef = useRef({});
  const lastPositionRef = useRef({});
  const animatedRef = useRef(null);
  const isAnimating = useRef(false);
  const adjustedDurationRef = useRef(animationDuration);
  const focusRef = useRef(true);
  const unfocusedStartRef = useRef(null);
  const missedStepsRef = useRef(0);
  const speedResetTimeoutRef = useRef(null);

  const frameInterval = 1000 / targetFPS;
  let lastFrameTime = performance.now();

  const { setPositions, setHistory } = useAnimatedPositions.getState();

  useEffect(() => {
    for (const [deviceId, pos] of Object.entries(positions)) {
      const last = lastPositionRef.current[deviceId];
      if (!last || last.latitude !== pos.latitude || last.longitude !== pos.longitude) {
        const from = last || pos;
        const to = pos;

        if (!animationQueueRef.current[deviceId]) {
          animationQueueRef.current[deviceId] = [];
        }

        animationQueueRef.current[deviceId].push([{ ...from, _startTime: performance.now() }, to]);
        lastPositionRef.current[deviceId] = pos;

        if (!focusRef.current) missedStepsRef.current += 1;
      }
    }

    if (!isAnimating.current) {
      isAnimating.current = true;
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => ProcessQueue());
      } else {
        setTimeout(() => ProcessQueue(), 0);
      }
    }
  }, [positions]);

  const ProcessQueue = () => {
    const animate = (now) => {
      const delta = now - lastFrameTime;
      if (delta < frameInterval) {
        animatedRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = now;

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
            hasWork = true;
          } else {
            queue.shift();
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
        animatedRef.current = requestAnimationFrame(animate);
      } else {
        isAnimating.current = false;
        animatedRef.current = null;
      }
    };

    animatedRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const onBlur = () => {
      focusRef.current = false;
      unfocusedStartRef.current = performance.now();
    };

    const onFocus = () => {
      clearTimeout(speedResetTimeoutRef.current);
      focusRef.current = true;
      const now = performance.now();
      const missedTime = (now - (unfocusedStartRef.current || now)) / 1000;
      const missedSteps = missedStepsRef.current;

      if (missedSteps > 0 && missedTime > 0) {
        const speedFactor = missedSteps / missedTime;
        adjustedDurationRef.current = Math.max(300, animationDuration / speedFactor);
        speedResetTimeoutRef.current = setTimeout(() => {
          adjustedDurationRef.current = animationDuration;
        }, missedSteps * adjustedDurationRef.current);
      }

      missedStepsRef.current = 0;
      unfocusedStartRef.current = null;
    };

    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return null;
};
