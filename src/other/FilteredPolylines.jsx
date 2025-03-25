import React, { useEffect } from 'react';
import MapRoutePath from '../map/MapRoutePath';
import dayjs from 'dayjs';

const FilteredPolylines = ({ positions, stoppedMoreThan, idleMoreThan, speedMoreThan, inactivity }) => {
  const [stoppedSegments, setStoppedSegments] = React.useState([]);
  const [idleSegments, setIdleSegments] = React.useState([]);
  const [speedSegments, setSpeedSegments] = React.useState([]);
  const [inactiveSegments, setInactiveSegments] = React.useState([]);


  const calculateStoppedSegments = (positions, stoppedMoreThan) => {
    if (!stoppedMoreThan) return [];
    const segments = [];
    let currentSegment = [];
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      if (position.attributes.ignition === false) {
        currentSegment.push(position);
      } else if (currentSegment.length > 0) {
        const duration = dayjs(currentSegment[currentSegment.length - 1].fixTime || undefined).diff(dayjs(currentSegment[0].fixTime), 'second') / 60;
        if (duration >= stoppedMoreThan) {
          segments.push(currentSegment);
        }
        currentSegment = [];
      }
    }
    return segments;
  };

  const calculateIdleSegments = (positions, idleMoreThan) => {
    if (!idleMoreThan) return [];
    const segments = [];
    let currentSegment = [];
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      if (position.attributes.ignition === true && position.attributes.speed < 5) {
        currentSegment.push(position);
      } else if (currentSegment.length > 0) {
        const duration = (dayjs(currentSegment[currentSegment.length - 1].fixTime) - dayjs(currentSegment[0].fixTime)) / 1000 / 60;
        if (duration >= idleMoreThan) {
          segments.push(currentSegment);
        }
        currentSegment = [];
      }
    }
    return segments;
  };

  const calculateSpeedSegments = (positions, speedMoreThan) => {
    if (!speedMoreThan) return [];
    const segments = [];
    let currentSegment = [];
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      if (position.speed > speedMoreThan) {
        currentSegment.push(position);
      } else if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }
    if (currentSegment.length > 0) {
      segments.push(currentSegment);
    }
    return segments;
  };

  const calculateInactiveSegments = (positions, inactivity) => {
    if (!inactivity) return [];
    const segments = [];
    let currentSegment = [];
    for (let i = 1; i < positions.length; i++) {
      const prevPosition = positions[i - 1];
      const currentPosition = positions[i];
      const timeDifference = (dayjs(currentPosition.fixTime) - dayjs(prevPosition.fixTime)) / 1000 / 60;
      if (timeDifference > 1) {
        currentSegment.push(prevPosition);
      }else if (currentSegment.length > 0) {
        segments.push(currentSegment);
        currentSegment = [];
      }
    }
    return segments;
  };

  useEffect(() => {
    setStoppedSegments(calculateStoppedSegments(positions, stoppedMoreThan));
    setIdleSegments(calculateIdleSegments(positions, idleMoreThan));
    setSpeedSegments(calculateSpeedSegments(positions, speedMoreThan));
    setInactiveSegments(calculateInactiveSegments(positions, inactivity));
  }, [positions, stoppedMoreThan, idleMoreThan, speedMoreThan, inactivity]);

  return (
    <>
      {stoppedSegments.map((segment, index) => (
        <MapRoutePath key={`stopped-${index}`} positions={segment} color="#e33124" width={8} />
      ))}
      {idleSegments.map((segment, index) => (
        <MapRoutePath key={`idle-${index}`} positions={segment} color="#FFC107" width={8} />
      ))}
      {speedSegments.map((segment, index) => (
        <MapRoutePath key={`speed-${index}`} positions={segment} color="#c70fff" width={8} />
      ))}
      {inactiveSegments.map((segment, index) => (
        <MapRoutePath key={`inactive-${index}`} positions={segment} color="#2950ff" width={8} />
      ))}
    </>
  );
};

export default FilteredPolylines;
