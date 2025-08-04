import React, { useEffect, useRef, useState } from 'react';
import { map } from './core/MapView';

const MapAutoCenter = ({ position, enabled = true, padding = 100 }) => {
  const lastCenteredRef = useRef(null);
  const [userInteracting, setUserInteracting] = useState(false);
  const userInteractionTimeoutRef = useRef(null);

  // Setup event listeners for map interactions
  useEffect(() => {
    const handleMapInteraction = () => {
      setUserInteracting(true);

      // Clear any existing timeout
      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current);
      }

      // Set a timeout to re-enable auto-centering after user stops interacting
      userInteractionTimeoutRef.current = setTimeout(() => {
        setUserInteracting(false);
      }, 2000); // 2 seconds delay before re-enabling auto-center
    };

    // Add event listeners for map interactions
    map.on('mousedown', handleMapInteraction);
    map.on('touchstart', handleMapInteraction);
    map.on('wheel', handleMapInteraction);

    map.on('zoom', handleMapInteraction);
    map.on('zoomstart', handleMapInteraction);
    map.on('drag', handleMapInteraction);
    map.on('dragstart', handleMapInteraction);
    map.on('pitch', handleMapInteraction);
    map.on('pitchstart', handleMapInteraction);
    map.on('rotate', handleMapInteraction);
    map.on('rotatestart', handleMapInteraction);
    map.on('move', handleMapInteraction);
    map.on('movestart', handleMapInteraction);

    // Cleanup event listeners
    return () => {
      map.off('mousedown', handleMapInteraction);
      map.off('touchstart', handleMapInteraction);
      map.off('wheel', handleMapInteraction);

      map.off('zoom', handleMapInteraction);
      map.off('zoomstart', handleMapInteraction);
      map.off('drag', handleMapInteraction);
      map.off('dragstart', handleMapInteraction);
      map.off('pitch', handleMapInteraction);
      map.off('pitchstart', handleMapInteraction);
      map.off('rotate', handleMapInteraction);
      map.off('rotatestart', handleMapInteraction);
      map.off('move', handleMapInteraction);
      map.off('movestart', handleMapInteraction);

      if (userInteractionTimeoutRef.current) {
        clearTimeout(userInteractionTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Skip auto-centering if disabled, no position, or user is currently interacting with the map
    if (!enabled || !position || !position.latitude || !position.longitude || userInteracting) {
      return;
    }

    // Get the map's current bounds
    const bounds = map.getBounds();
    const { _sw, _ne } = bounds;

    // Create a larger padding to detect when marker is approaching edge
    // Use a more aggressive padding to catch markers before they go off-screen
    const paddedBounds = {
      _sw: {
        lng: _sw.lng + padding * map.getZoom() * 0.0002, // Doubled padding factor
        lat: _sw.lat + padding * map.getZoom() * 0.0002  // Doubled padding factor
      },
      _ne: {
        lng: _ne.lng - padding * map.getZoom() * 0.0002, // Doubled padding factor
        lat: _ne.lat - padding * map.getZoom() * 0.0002  // Doubled padding factor
      },
      contains: function (lngLat) {
        return lngLat.lng >= this._sw.lng &&
          lngLat.lng <= this._ne.lng &&
          lngLat.lat >= this._sw.lat &&
          lngLat.lat <= this._ne.lat;
      }
    };

    // Check if the position is outside the padded bounds
    const markerLngLat = { lng: position.longitude, lat: position.latitude };

    // Also check if marker is completely outside the actual map bounds
    // This helps catch markers that have gone far off-screen
    const isCompletelyOutsideBounds =
      markerLngLat.lng < _sw.lng ||
      markerLngLat.lng > _ne.lng ||
      markerLngLat.lat < _sw.lat ||
      markerLngLat.lat > _ne.lat;

    // More responsive centering with smaller threshold for change detection
    const positionChanged = !lastCenteredRef.current ||
      Math.abs(lastCenteredRef.current.lng - markerLngLat.lng) > 0.00001 ||
      Math.abs(lastCenteredRef.current.lat - markerLngLat.lat) > 0.00001;

    // Center if marker is outside padded bounds OR completely outside actual bounds
    if ((isCompletelyOutsideBounds || !paddedBounds.contains(markerLngLat)) && positionChanged) {
      // Very fast but smooth centering with minimal delay
      map.easeTo({
        center: [position.longitude, position.latitude],
        duration: 100, // Very short duration - just enough for smoothness
        easing: (t) => t // Linear easing for more immediate response
      });

      // Update the last centered position
      lastCenteredRef.current = { ...markerLngLat };
    }
  }, [position, enabled, padding, userInteracting]);

  return null;
};

export default MapAutoCenter;
