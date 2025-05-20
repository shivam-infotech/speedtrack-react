import React, { useEffect, useRef } from 'react';
import { map } from './core/MapView';

const MapAutoCenter = ({ position, enabled = true, padding = 100 }) => {
  const lastCenteredRef = useRef(null);
  
  useEffect(() => {
    if (!enabled || !position || !position.latitude || !position.longitude) {
      return;
    }

    // Get the map's current bounds
    const bounds = map.getBounds();
    const { _sw, _ne } = bounds;
    
    // Create a smaller bounds with padding to detect when marker is approaching edge
    const paddedBounds = {
      _sw: {
        lng: _sw.lng + padding * map.getZoom() * 0.0001,
        lat: _sw.lat + padding * map.getZoom() * 0.0001
      },
      _ne: {
        lng: _ne.lng - padding * map.getZoom() * 0.0001,
        lat: _ne.lat - padding * map.getZoom() * 0.0001
      },
      contains: function(lngLat) {
        return lngLat.lng >= this._sw.lng && 
               lngLat.lng <= this._ne.lng && 
               lngLat.lat >= this._sw.lat && 
               lngLat.lat <= this._ne.lat;
      }
    };
    
    // Check if the position is outside the padded bounds
    const markerLngLat = { lng: position.longitude, lat: position.latitude };
    
    // Prevent too frequent centering (only center if position changed significantly)
    const positionChanged = !lastCenteredRef.current || 
      Math.abs(lastCenteredRef.current.lng - markerLngLat.lng) > 0.0001 ||
      Math.abs(lastCenteredRef.current.lat - markerLngLat.lat) > 0.0001;
    
    if (!paddedBounds.contains(markerLngLat) && positionChanged) {
      // Smoothly center the map on the marker
      map.easeTo({
        center: [position.longitude, position.latitude],
        duration: 500,
        easing: (t) => t * (2 - t) // easeOutQuad for smooth animation
      });
      
      // Update the last centered position
      lastCenteredRef.current = { ...markerLngLat };
    }
  }, [position, enabled, padding]);

  return null;
};

export default MapAutoCenter;
