import maplibregl from 'maplibre-gl';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useAttributePreference, usePreference } from '../../common/util/preferences';
import { map } from '../core/MapView';

const MapDefaultCamera = ({ animationDuration = 1000, focusableDeviceId = null }) => {
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);

  const defaultLatitude = usePreference('latitude');
  const defaultLongitude = usePreference('longitude');
  const defaultZoomPref = usePreference('zoom', 15);
  const defaultZoom = useAttributePreference('zoom', defaultZoomPref);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (selectedDeviceId) {
      setInitialized(true);
    } else if (!initialized) {
      if (defaultLatitude && defaultLongitude) {
        map.jumpTo({
          center: [defaultLongitude, defaultLatitude],
          zoom: defaultZoom
        });
        setInitialized(true);
      } else {
        const coordinates = Object.values(positions).map((item) => [item.longitude, item.latitude]);
        if (coordinates.length > 1) {
          const bounds = coordinates.reduce((bounds, item) => bounds.extend(item), new maplibregl.LngLatBounds(coordinates[0], coordinates[1]));
          const canvas = map.getCanvas();
          map.fitBounds(bounds, {
            duration: 1000,
            padding: Math.min(canvas.width, canvas.height) * 0.1,
          });
          setInitialized(true);
        } else if (coordinates.length) {
          const [individual] = coordinates;
          map.jumpTo({
            center: individual,
            zoom: Math.max(map.getZoom(), 10),
            // duration: animationDuration,
          });
          setInitialized(true);
        }
      }
    }
  }, [selectedDeviceId, initialized, defaultLatitude, defaultLongitude, defaultZoom, positions]);

  return null;
};

export default MapDefaultCamera;
