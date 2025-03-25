import { useId, useEffect } from 'react';
import { map } from './core/MapView';
import StartFlag from "../resources/images/icon/start.svg";
import FinishFlag from "../resources/images/icon/finish.svg";
import { Popup } from 'maplibre-gl';
import { TimeDiffInHumanReadableFormat } from '../common/util/formatter';
import { Typography, Box, Chip, useTheme } from '@mui/material';
import { createRoot } from 'react-dom/client';

const PopupContent = ({ duration, startTime, endTime, address }) => {
  const theme = useTheme();
  const Cell = ({ name, content, style }) => (
    <Box style={style}>
      <Typography fontSize={"0.75rem"} color="textSecondary">
        {name}
      </Typography>
      <Typography fontSize={"0.75rem"} fontWeight={600}>
        {content}
      </Typography>
    </Box>
  );

  return (
    <Box>
      <Box style={{ flex: 1 }}>
        <Chip size="small" label={`Duration: ${duration}`} />
      </Box>
      <Box sx={{ padding: 1, display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', alignItems: 'center', gap: theme.spacing(1) }}>
        <Cell name="Stopped at" content={startTime.toLocaleTimeString()} />
        <Cell name="Resumed at" content={endTime.toLocaleTimeString()} />
      </Box>
      <Cell name="Address" content={address} style={{ flex: 1 }} />
    </Box>
  );
};

const stoppageIcon = (index) => {
  const iconId = `stoppage-icon-${index}`;
  console.log(iconId, map.hasImage(iconId));
  if (map.hasImage(iconId)){
    map.removeImage(iconId);
  }

  const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
  <svg version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve" width="48px" height="48px">
    <defs>
      <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ff8a80"/>
        <stop offset="100%" stop-color="#d32f2f"/>
      </linearGradient>
    </defs>
    <g id="SVGRepo_iconCarrier">
        <path d="M25,13c0,8-9,15-9,15s-9-7-9-15c0-5,4-9,9-9S25,8,25,13z" fill="url(#redGradient)"/>
        <text x="16" y="16" text-anchor="middle" dominant-baseline="middle" style="font-family:Arial; font-size:8px; fill:#ffffff;">${index}</text>
    </g>
  </svg>
`;
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
  if (map.hasImage(iconId)){
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

const MapStoppages = ({ positions, startPosition, endPosition }) => {
  const componentId = useId();
  const id = `${componentId}-stoppage-marker`;

  // Initialize source and layer (runs only once on mount)
  useEffect(() => {
    let popup;
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
        const properties = e.features[0].properties;

        const positionGroup = positions[parseInt(properties.index) - 1];

        if (positionGroup) {
          const startTime = new Date(positionGroup[0].fixTime);
          const endTime = new Date(positionGroup[positionGroup.length - 1].fixTime);
          const duration = TimeDiffInHumanReadableFormat(positionGroup[0].fixTime, positionGroup[positionGroup.length - 1].fixTime);

          const address = "Address not available"; // Replace with actual address

          const container = document.createElement('div');
          const root = createRoot(container);
          root.render(
            <PopupContent
              duration={duration === '' ? '0s' : duration}
              startTime={startTime}
              endTime={endTime}
              address={address}
            />
          );

          popup = new Popup()
            .setLngLat(coordinates)
            .setDOMContent(container)
            .addTo(map);
        }
      });
    }

    // Cleanup function (runs only on unmount)
    return () => {
      if(popup) popup.remove();
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
        }).filter(f => f !== null);
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