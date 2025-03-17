import { useId, useEffect, useState, useRef } from 'react';
import { useTheme } from '@mui/styles';
import { useMediaQuery } from '@mui/material';
import { map } from './core/MapView';
import { useAttributePreference } from '../common/util/preferences';
import { findFonts } from './core/mapUtil';

const MapMarkers = ({ markers, showTitles }) => {
  const id = useId();
  const [animatedMarkers, setAnimatedMarkers] = useState([]);
  const animationFrameId = useRef(null);

  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const iconScale = useAttributePreference('iconScale', desktop ? 0.75 : 1);

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    if (showTitles) {
      map.addLayer({
        id,
        type: 'symbol',
        source: id,
        filter: ['!has', 'point_count'],
        layout: {
          'icon-image': '{image}',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
          'text-field': '{title}',
          'text-allow-overlap': true,
          'text-anchor': 'bottom',
          'text-offset': [0, -2 * iconScale],
          'text-font': findFonts(map),
          'text-size': 12,
        },
        paint: {
          'text-halo-color': 'white',
          'text-halo-width': 1,
        },
      });
    } else {
      map.addLayer({
        id,
        type: 'symbol',
        source: id,
        layout: {
          'icon-image': '{image}',
          'icon-size': iconScale,
          'icon-allow-overlap': true,
        },
      });
    }

    return () => {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, [showTitles]);

  const animateMarkers = (startTime, targetMarkers) => {
    const duration = 1000; // 1 second
    const progress = Math.min((Date.now() - startTime) / duration, 1);

    const newMarkers = animatedMarkers.map((marker, index) => {
      const targetMarker = targetMarkers[index];
      if (!targetMarker) return marker;

      const deltaLon = targetMarker.longitude - marker.longitude;
      const deltaLat = targetMarker.latitude - marker.latitude;

      return {
        ...marker,
        longitude: marker.longitude + deltaLon * progress,
        latitude: marker.latitude + deltaLat * progress,
      };
    });

    setAnimatedMarkers(newMarkers);

    if (progress < 1) {
      animationFrameId.current = requestAnimationFrame(() => animateMarkers(startTime, targetMarkers));
    }
  };

  useEffect(() => {
    if (markers.length > 0) {
      const startTime = Date.now();
      setAnimatedMarkers(markers);
      animationFrameId.current = requestAnimationFrame(() => animateMarkers(startTime, markers));
    }

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [markers]);

  useEffect(() => {
    map.getSource(id)?.setData({
      type: 'FeatureCollection',
      features: animatedMarkers.map(({ latitude, longitude, image, title }) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        properties: {
          image: image || 'default-neutral',
          title: title || '',
        },
      })),
    });
  }, [showTitles, animatedMarkers]);

  return null;
};

export default MapMarkers;
