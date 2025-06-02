import React from 'react';
import { useTheme } from '@mui/styles';
import { useId, useEffect, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { map } from './core/MapView';
import getSpeedColor from '../common/util/colors';
import LocationDetailsModal from '../common/components/LocationDetailsModal';
import MapFocusPoint from './MapFocusPoint';

const MapRoutePath = ({ positions, color = null, width = 3, onLineClick = null, selectedSegment = null, index = null }) => {
  const id = useId();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [focusPoint, setFocusPoint] = useState({ active: false, latitude: null, longitude: null });
  const handleLineClick = useCallback((e) => {
    // If there's a custom click handler, use it
    if (onLineClick) {
      onLineClick(e);
      return;
    }

    try {
      // Prevent the default map click behavior
      e.preventDefault();
      
      // Check if there are any marker layers at the click point
      const point = e.point;
      const markerFeatures = map.queryRenderedFeatures(point, {
        layers: Object.keys(map.style._layers).filter(layerId => 
          layerId !== `${id}-line` && 
          layerId !== `${id}-line-hit` && 
          !layerId.includes('background') && 
          map.style._layers[layerId].type === 'symbol'
        )
      });
      
      // If there are marker features at this point, don't process as a line click
      if (markerFeatures && markerFeatures.length > 0) {
        return;
      }
      
      // Get the clicked feature (line segment)
      const feature = e.features?.[0];
      if (!feature) {
        console.log('No feature found in click event');
        return;
      }
      
      if (feature.source !== id) {
        // Set the location data and open the modal
        const position = positions[feature.properties?.index];
        if (!position) {
          return;
        }
        
        // Get the address from the position data
        const address = position.address || 'Address not available';
        const speed = position.speed !== undefined ? `${position.speed.toFixed(1)} km/h` : 'N/A';
        const timestamp = position.fixTime ? new Date(position.fixTime).toLocaleString() : 'N/A';
        
        setSelectedLocation({
          latitude: position.latitude,
          longitude: position.longitude,
          address,
          speed,
          timestamp,
        });
        
        setModalOpen(true);
        return;
      }
      
      // Get the index of the clicked line segment
      const segmentIndex = feature.properties?.index;
      
      if (typeof segmentIndex !== 'number') {
        return;
      }
      
      // Get the position data for this segment
      const position = positions[segmentIndex];
      if (!position) {
        return;
      }
      
      // Get the address from the position data
      const address = position.address || 'Address not available';
      const speed = position.speed !== undefined ? `${position.speed.toFixed(1)} km/h` : 'N/A';
      const timestamp = position.fixTime ? new Date(position.fixTime).toLocaleString() : 'N/A';
      
      // Set the location data and open the modal
      setSelectedLocation({
        latitude: position.latitude,
        longitude: position.longitude,
        address,
        speed,
        timestamp,
      });
      
      // Set the focus point to maintain focus on this location
      setFocusPoint({
        active: true,
        latitude: position.latitude,
        longitude: position.longitude
      });
      setModalOpen(true);
    } catch (error) {
      console.error('Error handling line click:', error);
    }
  }, [onLineClick,id, positions]);
  
  const theme = useTheme();

  const reportColor = useSelector((state) => {
    const position = positions?.find(() => true);
    if (position) {
      const attributes = state.devices.items[position.deviceId]?.attributes;
      if (attributes) {
        const color = attributes['web.reportColor'];
        if (color) {
          return color;
        }
      }
    }
    return null;
  });

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [],
        },
      },
    });
    map.addLayer({
      source: id,
      id: `${id}-line`,
      type: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': width,
      },
    });

    // Enable feature state for the layer
    map.on('click', `${id}-line`, handleLineClick);
    
    // Add a larger invisible line for better click target
    map.addLayer({
      source: id,
      id: `${id}-line-hit`,
      type: 'line',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': 'transparent',
        'line-width': width + 10, // Wider clickable area
      },
    });
    
    // Add click handler to the wider invisible line as well
    map.on('click', `${id}-line-hit`, handleLineClick);

    return () => {
      map.off('click', `${id}-line`, handleLineClick);
      map.off('click', `${id}-line-hit`, handleLineClick);

      if (map.getLayer(`${id}-title`)) {
        map.removeLayer(`${id}-title`);
      }
      if (map.getLayer(`${id}-line-hit`)) {
        map.removeLayer(`${id}-line-hit`);
      }
      if (map.getLayer(`${id}-line`)) {
        map.removeLayer(`${id}-line`);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, [width, color]);

  useEffect(() => {
    const minSpeed = positions.map((p) => p.speed).reduce((a, b) => Math.min(a, b), Infinity);
    const maxSpeed = positions.map((p) => p.speed).reduce((a, b) => Math.max(a, b), -Infinity);
    const features = [];
    for (let i = 0; i < positions.length - 1; i += 1) {
      features.push({
        type: 'Feature',
        index: i,
        geometry: {
          type: 'LineString',
          coordinates: [[positions[i].longitude, positions[i].latitude], [positions[i + 1].longitude, positions[i + 1].latitude]],
        },
        properties: {
          index: i,
          color: color || reportColor || getSpeedColor(
            positions[i + 1].speed,
            minSpeed,
            maxSpeed,
          ),
        },
      });
    }
    map.getSource(id)?.setData({
      type: 'FeatureCollection',
      features,
    });
  }, [theme, positions, reportColor]);

  // Handler for when the modal is closed
  const handleModalClose = () => {
    setModalOpen(false);
    // Keep focus for 1 second after closing to allow user to see the location
    setTimeout(() => {
      setFocusPoint({ active: false, latitude: null, longitude: null });
    }, 1000);
  };

  // Using React.createElement instead of JSX to avoid syntax errors in .js files
  return [
    modalOpen ? React.createElement(LocationDetailsModal, {
      open: modalOpen,
      onClose: handleModalClose,
      locationData: selectedLocation
    }) : null,
    React.createElement(MapFocusPoint, {
      ...focusPoint,
      key: 'focus-point'
    })
  ];
};

export default MapRoutePath;
