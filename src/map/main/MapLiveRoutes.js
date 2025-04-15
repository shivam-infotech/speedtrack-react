import { useId, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/styles';
import { map } from '../core/MapView';
import { useAttributePreference } from '../../common/util/preferences';

const MapLiveRoutes = ({ filteredDevices, animationDuration = 1000 }) => {
  const id = useId();
  const theme = useTheme();
  const type = useAttributePreference('mapLiveRoutes', 'none');

  const devices = useSelector((state) => state.devices.items);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const history = useSelector((state) => state.session.history);
  const [geoJson, setGeoJson] = useState({});

  const animRefs = useRef({});
  const previousCoords = useRef({});

  useEffect(() => {
    if (type !== 'none') {
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
        id,
        type: 'line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 4,
        },
      });

      return () => {
        if (map.getLayer(id)) {
          map.removeLayer(id);
        }
        if (map.getSource(id)) {
          map.removeSource(id);
        }
      };
    }
    return () => {};
  }, [type]);

  const generateGeoJsonWithAnimation = (deviceHistory, deviceId) => {
    if (animRefs.current[deviceId]) {
      cancelAnimationFrame(animRefs.current[deviceId]);
    }

    // Get previous coordinates or initialize if first time
    const prevCoords = previousCoords.current[deviceId] || 
      (deviceHistory.length > 1 ? deviceHistory.slice(0, -1) : []);

    const startCoord = deviceHistory.length > 1 
      ? deviceHistory[deviceHistory.length - 2] 
      : deviceHistory[0];
    const endCoord = deviceHistory[deviceHistory.length - 1];

    const geoJsonTemplate = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [...prevCoords, startCoord, endCoord],
      },
      properties: {
        color: devices[deviceId]?.attributes['web.reportColor'] || theme.palette.success.main,
        deviceId: deviceId
      },
    };

    const newJson = { ...geoJsonTemplate };

    const updateJsonCoords = (coords) => {
      // Keep all previous coordinates, replace only the last one with animated position
      newJson.geometry.coordinates = [...prevCoords, startCoord, coords];
      
      const data = { ...geoJson, [deviceId]: newJson };
      const source = map.getSource(id);
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: Object.values(data),
        });
      }
      setGeoJson(data);
    };

    const animateLine = (startTime) => (timestamp) => {
      const duration = animationDuration;
      const progress = Math.min((timestamp - startTime) / duration, 1);
    
      const newLon = startCoord[0] + (endCoord[0] - startCoord[0]) * progress;
      const newLat = startCoord[1] + (endCoord[1] - startCoord[1]) * progress;
    
      updateJsonCoords([newLon, newLat]);
    
      if (progress < 1) {
        animRefs.current[deviceId] = requestAnimationFrame(animateLine(startTime));
      } else {
        // Animation complete - store the final coordinates
        previousCoords.current[deviceId] = [...prevCoords, startCoord, endCoord];
      }
    };

    animRefs.current[deviceId] = requestAnimationFrame(animateLine(performance.now()));
  };

  useEffect(() => {
    if (type !== 'none') {
      const deviceIds = Object.values(devices)
        .map((device) => device.id)
        .filter((id) => (type === 'selected' ? id === selectedDeviceId : true))
        .filter((id) => history.hasOwnProperty(id));
      
      deviceIds
        .filter(d => filteredDevices ? filteredDevices.map(fd => fd.id).includes(d) : true)
        .forEach(deviceId => {
          generateGeoJsonWithAnimation(history[deviceId], deviceId);
        });
    }
  }, [theme, type, devices, selectedDeviceId, history]);

  return null;
};

export default MapLiveRoutes;