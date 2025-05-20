import React, { useEffect } from 'react';
import { map } from './core/MapView';

const MapFocusPoint = ({ latitude, longitude, zoom = null, active = false }) => {
  useEffect(() => {
    if (!active || !latitude || !longitude) return;

    // Initial focus on the point
    map.flyTo({
      center: [longitude, latitude],
      zoom: zoom || map.getZoom(),
      essential: true // This animation is considered essential for the user experience
    });

    // Add event listener for zoom changes to maintain focus
    const handleZoomEnd = () => {
      if (active && latitude && longitude) {
        map.setCenter([longitude, latitude]);
      }
    };

    // Add event listeners
    map.on('zoomend', handleZoomEnd);
    map.on('pitchend', handleZoomEnd);
    map.on('rotateend', handleZoomEnd);

    // Cleanup function
    return () => {
      map.off('zoomend', handleZoomEnd);
      map.off('pitchend', handleZoomEnd);
      map.off('rotateend', handleZoomEnd);
    };
  }, [latitude, longitude, zoom, active]);

  return null;
};

export default MapFocusPoint;
