import { grey } from '@mui/material/colors';
import createPalette from '@mui/material/styles/createPalette';
import { loadImage, prepareIcon } from './mapUtil';

import directionSvg from '../../resources/images/direction.svg';
import backgroundSvg from '../../resources/images/background.svg';
import animalSvg from '../../resources/images/icon/animal.svg';
import bicycleSvg from '../../resources/images/icon/bicycle.svg';
import boatSvg from '../../resources/images/icon/boat.svg';
import busSvg from '../../resources/images/icon/bus.svg';
import busSuccessSvg from '../../resources/images/icon/bus-success.svg';
import busErrorSvg from '../../resources/images/icon/bus-error.svg';
import busWarningSvg from '../../resources/images/icon/bus-warning.svg';

import carSvg from '../../resources/images/icon/car.svg';
import carSucessSvg from '../../resources/images/icon/car-success.svg';
import carErrorSvg from '../../resources/images/icon/car-error.svg';
import carWarningSvg from '../../resources/images/icon/car-warning.svg';
import camperSvg from '../../resources/images/icon/camper.svg';
import craneSvg from '../../resources/images/icon/crane.svg';
import defaultSvg from '../../resources/images/icon/default.svg';
import startSvg from '../../resources/images/icon/start.svg';
import finishSvg from '../../resources/images/icon/finish.svg';
import helicopterSvg from '../../resources/images/icon/helicopter.svg';
import motorcycleSvg from '../../resources/images/icon/motorcycle.svg';
import motorcycleSuccessSvg from '../../resources/images/icon/motorcycle-success.svg';
import motorcycleErrorSvg from '../../resources/images/icon/motorcycle-error.svg';
import motorcycleWarningSvg from '../../resources/images/icon/motorcycle-warning.svg';

import personSvg from '../../resources/images/icon/person.svg';
import planeSvg from '../../resources/images/icon/plane.svg';
import scooterSvg from '../../resources/images/icon/scooter.svg';
import shipSvg from '../../resources/images/icon/ship.svg';
import tractorSvg from '../../resources/images/icon/tractor.svg';
import trailerSvg from '../../resources/images/icon/trailer.svg';
import trainSvg from '../../resources/images/icon/train.svg';
import tramSvg from '../../resources/images/icon/tram.svg';
import truckSvg from '../../resources/images/icon/truck.svg';
import truckSuccessSvg from '../../resources/images/icon/truck-success.svg';
import truckErrorSvg from '../../resources/images/icon/truck-error.svg';
import truckWarningSvg from '../../resources/images/icon/truck-warning.svg';

import vanSvg from '../../resources/images/icon/van.svg';
import vanSuccessSvg from '../../resources/images/icon/van-success.svg';
import vanErrorSvg from '../../resources/images/icon/van-error.svg';
import vanWarningSvg from '../../resources/images/icon/van-warning.svg';

export const mapIcons = {
  animal: animalSvg,
  bicycle: bicycleSvg,
  boat: boatSvg,
  bus: busSvg,
  car: carSvg,  
  camper: camperSvg,
  crane: craneSvg,
  default: defaultSvg,
  finish: finishSvg,
  helicopter: helicopterSvg,
  motorcycle: motorcycleSvg,
  person: personSvg,
  plane: planeSvg,
  scooter: scooterSvg,
  ship: shipSvg,
  start: startSvg,
  tractor: tractorSvg,
  trailer: trailerSvg,
  train: trainSvg,
  tram: tramSvg,
  truck: truckSvg,
  van: vanSvg,
};

export const mapIconsVarients = {
  car: {
    success: carSucessSvg,
    error: carErrorSvg,
    warning: carWarningSvg,
  },
  bus: {
    success: busSuccessSvg,
    error: busErrorSvg,
    warning: busWarningSvg,
  },
  motorcycle: {
    success: motorcycleSuccessSvg,
    error: motorcycleErrorSvg,
    warning: motorcycleWarningSvg,
  },
  truck: {
    success: truckSuccessSvg,
    error: truckErrorSvg,
    warning: truckWarningSvg,
  },
  van: {
    success: vanSuccessSvg,
    error: vanErrorSvg,
    warning: vanWarningSvg,
  }
}

export const mapIconKey = (category) => {
  switch (category) {
    case 'offroad':
    case 'pickup':
      return 'car';
    case 'trolleybus':
      return 'bus';
    default:
      return mapIcons.hasOwnProperty(category) ? category : 'default';
  }
};

export const mapImages = {};

const mapPalette = createPalette({
  neutral: { main: '#0098af' },
  success: { main: '#00C853' },
  error: { main: '#FF4444' },
  warning: { main: '#FFBB33' },
  info: { main: '#33B5E5' },
});

export default async () => {
  const background = await loadImage(backgroundSvg);
  mapImages.background = await prepareIcon(background);
  mapImages.direction = await prepareIcon(await loadImage(directionSvg));
  await Promise.all(Object.keys(mapIcons).map(async (category) => {
    const results = [];
    const svg = mapIcons[category];
    ['info', 'success', 'error', 'neutral', 'warning'].forEach((color) => {
      let svgIcon = svg;
      if(mapIconsVarients.hasOwnProperty(category) && mapIconsVarients[category].hasOwnProperty(color)) {
        svgIcon = mapIconsVarients[category][color];
      }
      results.push(loadImage(svgIcon, color).then((icon) => {
        mapImages[`${category}-${color}`] = prepareIcon(icon, null, mapPalette[color].main);
      }).catch(err => console.log(err, 'while loading image')));
    });
    await Promise.all(results);
  }));
};
