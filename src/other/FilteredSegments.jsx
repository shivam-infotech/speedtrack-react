import React, { useEffect, useId } from 'react';
import { Popup } from 'maplibre-gl';
import {
  Typography, Box, Chip, useTheme,
} from '@mui/material';
import { createRoot } from 'react-dom/client';
import MapRoutePath from '../map/MapRoutePath';
import { map } from '../map/core/MapView';
import { TimeDiffInHumanReadableFormat } from '../common/util/formatter';
import MapPin from '../common/components/MapPin';
import ShareButton from '../common/components/ShareButton';
import PopupContent from '../common/components/MarkerPopupContent';

const createMarkerIcon = (index, color) => {
  const iconId = `marker-icon-${index}-${color}`;
  if (map.hasImage(iconId)) {
    map.removeImage(iconId);
  }

  const svg = MapPin({ text: index, color });
  const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

  const img = new Image();
  img.src = dataUrl;
  img.onload = () => {
    if (!map.hasImage(iconId)) {
      map.addImage(iconId, img);
    }
  };

  return iconId;
};

const FilteredSegments = ({
  positions,
  isValidPosition,
  isValidSegment,
  renderType,
  color,
  device,
  activityType,
}) => {
  const componentId = useId();
  const sourceId = `${componentId}-source`;
  const layerId = `${componentId}-layer`;

  const processSegments = (positions, isValidPosition, isValidSegment) => {
    if (!positions || positions.length === 0) return [];

    const segments = [];
    let currentSegment = [];

    for (let i = 0; i < positions.length; i++) {
      const currentPosition = positions[i];
      const previousPosition = i > 0 ? positions[i - 1] : null;

      if (isValidPosition(currentPosition, previousPosition)) {
        currentSegment.push(currentPosition);
      } else if (currentSegment.length > 0) {
        if (isValidSegment(currentSegment)) {
          segments.push(currentSegment);
        }
        currentSegment = [];
      }
    }

    // Check the last segment if it exists
    if (currentSegment.length > 0 && isValidSegment(currentSegment)) {
      segments.push(currentSegment);
    }

    return segments;
  };

  // Initialize source and layer
  useEffect(() => {
    let popup;
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id: layerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'icon-image': '{icon}',
          'icon-size': 0.75,
          'icon-allow-overlap': true,
          'icon-optional': false,
        },
      });

      // Add click event listener
      map.on('click', layerId, (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const { properties } = e.features[0];
        const segmentIndex = parseInt(properties.index) - 1;
        const segment = segments[segmentIndex];

        if (segment) {
          const startTime = new Date(segment[0].fixTime);
          const endTime = new Date(segment[segment.length - 1].fixTime);
          const duration = TimeDiffInHumanReadableFormat(segment[0].fixTime, segment[segment.length - 1].fixTime);
          const address = segment[0]?.address || 'Address not available';
          const deviceName = device?.name || 'Unknown Device';
          const activityStatus = activityType;

          const container = document.createElement('div');
          const root = createRoot(container);
          root.render(
            <PopupContent
              duration={duration === '' ? '0s' : duration}
              startTime={startTime}
              endTime={endTime}
              address={address}
              coordinates={coordinates}
              deviceName={deviceName}
              activityStatus={activityStatus}
            />,
          );

          popup = new Popup()
            .setLngLat(coordinates)
            .setDOMContent(container)
            .addTo(map);
        }
      });
    }

    return () => {
      if (popup) popup.remove();
      map.off('click', layerId);
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, []);

  const segments = processSegments(positions, isValidPosition, isValidSegment);

  // Update markers
  useEffect(() => {
    if (renderType === 'marker' && map.getSource(sourceId)) {
      const features = segments.map((segment, index) => {
        const position = segment[Math.floor(segment.length / 2)];
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [position.longitude, position.latitude],
          },
          properties: {
            index: `${index + 1}`,
            icon: createMarkerIcon(index + 1, color),
          },
        };
      });

      map.getSource(sourceId).setData({
        type: 'FeatureCollection',
        features,
      });
    }
  }, [segments, renderType, color]);

  if (renderType === 'marker') {
    return null; // Markers are handled by the map layer
  }

  return (
    <>
      {segments.map((segment, index) => (
        <MapRoutePath
          key={`segment-${index}`}
          positions={segment}
          color={color}
          width={3}
        />
      ))}
    </>
  );
};

export default FilteredSegments;
