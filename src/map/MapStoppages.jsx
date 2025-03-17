import { useId, useEffect } from 'react';
import { map } from './core/MapView';
import StartFlag from "../resources/images/icon/start.svg";
import FinishFlag from "../resources/images/icon/finish.svg";

const stoppageIcon = (index) => {
  const iconId = `stoppage-icon-${index}`;
  // Avoid adding the image if it already exists
  if (map.hasImage(iconId)) return iconId;

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
`
  // Create a data URL from the SVG string.
  const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;

  // Create a new image element and set its source.
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
  // Avoid adding the image if it already exists
  if (map.hasImage(iconId)) return iconId;

  const img = new Image();
  img.src = type === 'end'? FinishFlag : StartFlag;
  img.onload = () => {
    if (!map.hasImage(iconId)) {
      map.addImage(iconId, img);
    }
    loaded(iconId);
  };
})


const MapStoppages = ({ positions, startPosition, endPosition }) => {
  const id = useId();

  useEffect(() => {
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

    return () => {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, []);

  const addSources = async() => {
    let sources = [];
    if(positions.length > 0){
      if(startPosition) positions.shift();
      if(endPosition) positions.pop();
      sources = positions.map((positionGroup, index) => {
        // find the middle point of the stoppage
        if(positionGroup.length < 1) return null;
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
    if(startPosition){
      let startIconId = await startEndIcons('start');
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
    if(endPosition){
      let endIconId = await startEndIcons('end');
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
  }

  useEffect(() => {
    addSources();
  }, [positions]);

  return null;
};

export default MapStoppages;
