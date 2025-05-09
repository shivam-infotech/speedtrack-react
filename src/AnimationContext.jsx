import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { create } from 'zustand';
import useAnimationEase from './common/util/useAnimationEase';
import { calculateBearing, calculateDistance } from './common/util/position';
import { distanceFromMeters } from './common/util/converter';
import { useAnimatedPositions } from './store/animation';

export { useAnimatedPositions } from './store/animation'

export const AnimationController = ({ animationDuration = 1000}) => {
  const positions = useSelector((state) => state.session.positions);
  const easing = useAnimationEase('easeInOutQuart');

  const animationQueueRef = useRef({});
  const lastPositionRef = useRef({});
  const animatedRef = useRef(null);
  const isAnimating = useRef(false);
  const adjustedDurationRef = useRef(animationDuration);
  const isUnfocused = useRef(false);

  const { setPositions, setHistory, setLastAnimatedPositions } = useAnimatedPositions.getState();

  useEffect(() => {
    for (const [deviceId, pos] of Object.entries(positions)) {
      const last = lastPositionRef.current[deviceId];
      
      if (!last || last?.latitude !== pos.latitude || last?.longitude !== pos.longitude || last?.attributes?.activity !== pos?.attributes?.activity) {
        const from = last || pos;
        const to = pos;

        if (!animationQueueRef.current[deviceId]) {
          animationQueueRef.current[deviceId] = [];
        }

        animationQueueRef.current[deviceId].push([{ ...from, _startTime: performance.now() }, {...to, _lastSet: false}]);
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

          // if the both coordinates are same and just attributes are changed, then skip the frames and directly put the coordinates
          if (from.longitude === to.longitude && from.latitude === to.latitude && from.rotation === to.rotation && to?.attributes?.distance === 0) {
            newPositions[deviceId] = to;
            if (!newHistory[deviceId]) newHistory[deviceId] = [];
            newHistory[deviceId].push([to.longitude, to.latitude]);
          } else {
            const distance = to?.attributes?.distance || calculateDistance(from.latitude, from.longitude, to.latitude, to.longitude);
            const currentSpeed = to?.speed ? Math.max(Math.min(to.speed, 25), 5) : 5;
            const speedInmps = currentSpeed * (1000 / 3600);

            const adjustedDuration = speedInmps > 0 ? (distance / speedInmps) * 600 : adjustedDurationRef.current;

            const elapsed = performance.now() - from._startTime;
            const progress = Math.min(elapsed / adjustedDuration, 1);
            const eased = easing(progress);

            const latitude = from.latitude + (to.latitude - from.latitude) * eased;
            const longitude = from.longitude + (to.longitude - from.longitude) * eased;

            const fromRotation = newPositions[deviceId]?.course ?? from.course;
            const toRotation = calculateBearing(from.latitude, from.longitude, to.latitude, to.longitude) ?? to.course;
            let delta = toRotation - fromRotation;

            // Normalize to shortest rotation direction
            if (delta > 180) delta -= 360;
            if (delta < -180) delta += 360;

            const rotation = (fromRotation + delta * eased + 360) % 360;

            newPositions[deviceId] = {
              ...to,
              latitude,
              longitude,
              course: rotation,
            };

            if (!newHistory[deviceId]) newHistory[deviceId] = [];
            newHistory[deviceId].push([longitude, latitude]);

            if (progress >= 0.7 && !to?._lastSet) {
              setLastAnimatedPositions({ ...newPositions });
              to._lastSet = true;
            }

            if (progress < 1) {
              if (isUnfocused.current) return skipToLatest();
              hasWork = true;
            } else {
              queue.shift();
              animationQueueRef.current[deviceId] = queue;

              if (isUnfocused.current) return skipToLatest();
              if (queue.length > 0) {
                hasWork = true;
                queue[0][0]._startTime = performance.now();
              }
              else delete animationQueueRef.current[deviceId];
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
    setLastAnimatedPositions(newPositions);

    isAnimating.current = false;
    animatedRef.current = null;
    animationQueueRef.current = {};
  };

  useEffect(() => {
    const whenBlur = (evt) => {
      isUnfocused.current = true;
    };

    const whenFocus = (evt) => {
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

  useEffect(() => {
    const { animPositions, animHistory } = useAnimatedPositions.getState();
    const hasInitial = Object.keys(animPositions).length > 0 || Object.keys(animHistory).length > 0;

    if (!hasInitial && Object.keys(positions).length > 0) {
      const initialPositions = {};
      const initialHistory = {};

      for (const [deviceId, pos] of Object.entries(positions)) {
        initialPositions[deviceId] = pos;
        initialHistory[deviceId] = [[pos.longitude, pos.latitude]];
      }

      setPositions(initialPositions);
      setHistory(initialHistory);
      setLastAnimatedPositions(initialPositions);
    }
  }, [positions]);

  return null;
};
