import { useId, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/styles';
import { map } from '../core/MapView';
import { useAttributePreference } from '../../common/util/preferences';
import { useAnimatedPositions } from '../../AnimationContext';

const MapLiveRoutes = ({ filteredDevices }) => {
  const id = useId();
  const theme = useTheme();
  const type = useAttributePreference('mapLiveRoutes', 'none');

  const devices = useSelector((state) => state.devices.items);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  // const history = useSelector((state) => state.session.history);
  const { animHistory: history } = useAnimatedPositions();

  const deviceIds = useMemo(() => Object.values(devices)
    .map((device) => device.id)
    .filter((id) => (type === 'selected' ? id === selectedDeviceId : true))
    .filter((id) => history.hasOwnProperty(id))
    .filter(d => filteredDevices ? filteredDevices.map(fd => fd.id).includes(d) : true)
    , [devices, type, selectedDeviceId, filteredDevices, history]);

  // Add MapLibre source & layer
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
          properties: {
            color: theme.palette.success.main
          }
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
        if (map.getLayer(id)) map.removeLayer(id);
        if (map.getSource(id)) map.removeSource(id);
      };
    }
  }, [type]);

  // First time source update
  useEffect(() => {
    if (type !== 'none') {
      map.getSource(id)?.setData({
        type: 'FeatureCollection',
        features: deviceIds.map((deviceId) => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: history[deviceId] || [],
          },
          properties: {
            color: devices[deviceId]?.attributes['web.reportColor'] || theme.palette.success.main,
          },
        })),
      });
    }
  }, [history]);

return null;
};

export default MapLiveRoutes;
