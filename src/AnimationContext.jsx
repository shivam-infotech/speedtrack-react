import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import useAnimationEase from "./common/util/useAnimationEase";

const AnimationContext = createContext(null);
export const useAnimation = () => useContext(AnimationContext);

export const AnimationProvider = ({ children, animationDuration = 1000 }) => {
  const positions = useSelector((state) => state.session.positions);
  const easing = useAnimationEase("easeInOutQuad");
  const duration = animationDuration;

  const [animPositions, setAnimPositions] = useState({});
  const [animHistory, setAnimHistory] = useState({});
  const animationQueueRef = useRef({});
  const lastPositionRef = useRef({});
  const animatedRef = useRef(null);
  const isAnimating = useRef(false);

  const focusRef = useRef(true);
  const unfocusedStartRef = useRef(null);
  const missedStepsRef = useRef(0);

  const adjustedDurationRef = useRef(duration);
  const speedResetTimeoutRef = useRef(null);


  // Push new steps to animation queue
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

        if (!focusRef.current) {
          missedStepsRef.current += 1;
        }
      }
    }

    if (!isAnimating.current) {
      isAnimating.current = true;
      setTimeout(() => ProcessQueue(), 0);
    }
  }, [positions]);

  const ProcessQueue = () => {

    const animate = () => {
      let hasWork = false;

      const newPositions = {};
      const newHistory = { ...animHistory };

      for (const [deviceId, queue] of Object.entries(animationQueueRef.current)) {
        if (queue.length > 0) {
          const [from, to] = queue[0];
          const adjustedDuration = adjustedDurationRef.current;
          const elapsed = performance.now() - from._startTime;
          const progress = Math.min(Math.max(elapsed / adjustedDuration, 0), 1);
          // const progress = Math.min((performance.now() - from._startTime) / adjustedDuration, 1);
          const eased = easing(progress);

          const latitude = from.latitude + (to.latitude - from.latitude) * eased;
          const longitude = from.longitude + (to.longitude - from.longitude) * eased;
          const rotation = Math.atan2(to.longitude - from.longitude, to.latitude - from.latitude) * (180 / Math.PI);

          newPositions[deviceId] = {
            ...to,
            latitude,
            longitude,
            rotation,
          };

          if (!newHistory[deviceId]) newHistory[deviceId] = [];
          newHistory[deviceId].push([longitude, latitude]);

          // setTick(t => t + 1);

          if (progress < 1) {
            hasWork = true;
          } else {
            queue.shift(); // step done
            if (queue.length > 0) {
              queue[0][0]._startTime = performance.now(); // start next one
              hasWork = true;
            }
          }
        }
      }
      setAnimPositions(prev => ({ ...prev, ...newPositions }));
      setAnimHistory(prev => newHistory);
      // setTick((t) => t + 1);

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
      if (speedResetTimeoutRef.current) {
        clearTimeout(speedResetTimeoutRef.current);
      }
      focusRef.current = true;
      const now = performance.now();
      const missedTime = (now - (unfocusedStartRef.current || now)) / 1000; // in seconds
      const missedSteps = missedStepsRef.current;
  
      if (missedSteps > 0 && missedTime > 0) {
        const speedFactor = missedSteps / missedTime;
        adjustedDurationRef.current = Math.max(300, duration / speedFactor);
        speedResetTimeoutRef.current = setTimeout(() => {
          adjustedDurationRef.current = duration; // back to normal after a while
        }, missedSteps * adjustedDurationRef.current); // rough timing
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

  useEffect(() => {
    const fallback = setTimeout(() => {
      adjustedDurationRef.current = duration;
    }, 10000);
  
    return () => clearTimeout(fallback);
  }, []);

  return (
    <AnimationContext.Provider
      value={{
        positions: animPositions,
        history: animHistory,
        // tick,
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
};
