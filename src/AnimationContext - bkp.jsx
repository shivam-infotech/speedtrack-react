import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useAnimatedPositions } from './AnimationContext copy';
import InterpolationWorker from './interpolation.worker.js?worker';

export { useAnimatedPositions } from './store/animation'

export const AnimationController = ({ animationDuration = 1000}) => {
  const positions = useSelector((state) => state.session.positions);
  const easing = 'easeInOutQuart';
  const interpolationWorkerRef = useRef(null);

  const { setPositions, setHistory, setLastAnimatedPositions } = useAnimatedPositions.getState();

  const updateStore = (positions) => {
    const newPositions = { ...useAnimatedPositions.getState().animPositions };
    const newHistory = { ...useAnimatedPositions.getState().animHistory };

    for (const [deviceId, data] of Object.entries(positions)) {
      newPositions[deviceId] = data;
      if (!newHistory[deviceId]) newHistory[deviceId] = [];
      newHistory[deviceId].push([data.longitude, data.latitude]);
    }

    setPositions(newPositions);
    setHistory(newHistory);
  }

  useEffect(() => {
    /**
     * handle the initial case when there is no coordinates, 
     * we should need to directly push the coordinates into the stores
     */

    console.log("New coordinates");
    const { animPositions, animHistory } = useAnimatedPositions.getState();
    const hasInitial = Object.keys(animPositions).length > 0 || Object.keys(animHistory).length > 0;

    if(!hasInitial && Object.keys(positions).length > 0){
      const initialPositions = {};
      const initialHistory = {};

      for (const [deviceId, pos] of Object.entries(positions)) {
        initialPositions[deviceId] = pos;
        initialHistory[deviceId] = [[pos.longitude, pos.latitude]];
      }

      setPositions(initialPositions);
      setHistory(initialHistory);
      setLastAnimatedPositions(initialPositions);
    } else if(interpolationWorkerRef.current) {
      interpolationWorkerRef.current.postMessage({ type: 'newCoordinates', payload: positions });
    }
  }, [positions]);


  useEffect(() => {
    // initiating the worker instance
    const worker = new InterpolationWorker();
    worker.postMessage({ type: 'init', payload: { easing, animationDuration } })

    // listing the events from worker
    worker.onmessage = (event) => {
      console.log('worker event', event.data.payload);
      const { type, payload } = event.data;

      switch(type){
        case 'interpolation':
          updateStore(payload); break;
      }
    }

    interpolationWorkerRef.current = worker;

    return () => {
      worker.terminate();
    };
  });

  useEffect(() => {
    const whenBlur = (evt) => {
      interpolationWorkerRef.current.postMessage({ type: 'skipToLatestPositions', payload: {} })
    };

    const whenFocus = (evt) => {
      interpolationWorkerRef.current.postMessage({ type: 'resumeAnimations', payload: {} })
    };

    window.addEventListener('blur', whenBlur);
    window.addEventListener('focus', whenFocus);

    return () => {
      window.removeEventListener('blur', whenBlur);
      window.removeEventListener('focus', whenFocus);
    };
  }, []);

  return null;
};
