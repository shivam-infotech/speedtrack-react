import { useId, useEffect } from 'react';
import { Popup } from 'maplibre-gl';
import { createRoot } from 'react-dom/client';
import { map } from './core/MapView';
import StartFlag from '../resources/images/icon/start.svg';
import FinishFlag from '../resources/images/icon/finish.svg';
import { TimeDiffInHumanReadableFormat } from '../common/util/formatter';
import MapPin from '../common/components/MapPin';
import PopupContent from '../common/components/MarkerPopupContent';

const stoppageIcon = (index) => {
  const iconId = `stoppage-icon-${index}`;
  if (map.hasImage(iconId)) {
    map.removeImage(iconId);
  }

  const svg = MapPin({ text: index });
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

const startEndIcons = (type) => new Promise((loaded) => {
  const iconId = `${type}-icon`;
  if (map.hasImage(iconId)) {
    map.removeImage(iconId);
  }

  const img = new Image();
  img.src = type === 'end' ? FinishFlag : StartFlag;
  img.onload = () => {
    if (!map.hasImage(iconId)) {
      map.addImage(iconId, img);
    }
    loaded(iconId);
  };
});

const MapStoppages = ({ positions, startPosition, endPosition, device, onClick }) => {
  const componentId = useId();
  const id = `${componentId}-stoppage-marker`;

  // Initialize source and layer (runs only once on mount)
  useEffect(() => {
    if (!map.getSource(id)) {
      map.addSource(id, {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      });

      map.addLayer({
        id,
        type: 'symbol',
        source: id,
        layout: {
          'icon-image': '{icon}',
          'icon-size': ['get', 'size'],
          'icon-allow-overlap': true,
          'icon-optional': false,
        },
      });

      // Add click event listener to the map
      map.on('click', id, (e) => {
        const coordinates = e.features[0].geometry.coordinates.slice();
        const { properties } = e.features[0];

        const positionGroup = positions[parseInt(properties.index) - 1];

        if (positionGroup) {
          onClick(positionGroup, parseInt(properties.index) - 1);
        }
      });
    }

    // Cleanup function (runs only on unmount)
    return () => {
      // if (popup) popup.remove();
      map.off('click', id);
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  // Update source data when positions change
  useEffect(() => {
    const addSources = async () => {
      let sources = [];
      if (positions.length > 0) {
        const filteredPositions = [...positions]; // Create a copy of the positions array
        if (startPosition) filteredPositions.shift();
        if (endPosition) filteredPositions.pop();
        sources = filteredPositions.map((positionGroup, index) => {
          if (positionGroup.length < 1) return null;
          const position = positionGroup[positionGroup.length > 1 ? Math.floor(positionGroup.length / 2) : 0];

          return {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [position.longitude, position.latitude],
            },
            properties: {
              index: `${index + 1}`,
              size: 0.75,
              icon: stoppageIcon(index + 1),
            },
          };
        }).filter((f) => f !== null);
      }

      if (startPosition) {
        const startIconId = await startEndIcons('start');
        sources.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [startPosition.longitude, startPosition.latitude],
          },
          properties: {
            index: 'A',
            size: 1.25,
            icon: startIconId,
          },
        });
      }

      if (endPosition) {
        const endIconId = await startEndIcons('end');
        sources.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [endPosition.longitude, endPosition.latitude],
          },
          properties: {
            index: 'Z',
            size: 1.25,
            icon: endIconId,
          },
        });
      }

      map.getSource(id)?.setData({
        type: 'FeatureCollection',
        features: sources,
      });
    };

    if (map.getSource(id)) {
      addSources();
    }
  }, [positions, startPosition, endPosition]); // Re-run when positions change

  return null;
};

export default MapStoppages;
