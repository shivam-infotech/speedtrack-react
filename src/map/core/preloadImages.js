import { grey } from '@mui/material/colors';
import createPalette from '@mui/material/styles/createPalette';
import { loadImage, prepareIcon } from './mapUtil';

// Car
import carPng from '../../resources/images/icon/car.png';
import carSuccessPng from '../../resources/images/icon/car-success.png';
import carErrorPng from '../../resources/images/icon/car-error.png';
import carWarningPng from '../../resources/images/icon/car-warning.png';
// 3d variant
import carSuccess3d from '../../resources/images/icon/3d/car-success-3d.png';
import carError3d from '../../resources/images/icon/3d/car-error-3d.png';
import carWarning3d from '../../resources/images/icon/3d/car-warning-3d.png';
import carNeutral3d from '../../resources/images/icon/3d/car-neutral-3d.png';

// Bicycle
import bicyclePng from '../../resources/images/icon/bicycle.png';
import bicycleSuccessPng from '../../resources/images/icon/bicycle-success.png';
import bicycleWarningPng from '../../resources/images/icon/bicycle-warning.png';
import bicycleErrorPng from '../../resources/images/icon/bicycle-error.png';
// 3d Variant
import bicycle3d from '../../resources/images/icon/3d/bicycle-neutral-3d.png';
import bicycleSuccess3d from '../../resources/images/icon/3d/bicycle-success-3d.png';
import bicycleWarning3d from '../../resources/images/icon/3d/bicycle-warning-3d.png';
import bicycleError3d from '../../resources/images/icon/3d/bicycle-error-3d.png';

// Boat
import boatPng from '../../resources/images/icon/boat.png';
import boatSuccessPng from '../../resources/images/icon/boat-success.png';
import boatWarningPng from '../../resources/images/icon/boat-warning.png';
import boatErrorPng from '../../resources/images/icon/boat-error.png';
// 3d Variant
import boat3d from '../../resources/images/icon/3d/boat-neutral-3d.png';
import boatSuccess3d from '../../resources/images/icon/3d/boat-success-3d.png';
import boatWarning3d from '../../resources/images/icon/3d/boat-warning-3d.png';
import boatError3d from '../../resources/images/icon/3d/boat-error-3d.png';

// Bus
import busPng from '../../resources/images/icon/bus.png';
import busSuccessPng from '../../resources/images/icon/bus-success.png';
import busErrorPng from '../../resources/images/icon/bus-error.png';
import busWarningPng from '../../resources/images/icon/bus-warning.png';
// 3d variant
import bus3d from '../../resources/images/icon/3d/bus-neutral-3d.png';
import busSuccess3d from '../../resources/images/icon/3d/bus-success-3d.png';
import busError3d from '../../resources/images/icon/3d/bus-error-3d.png';
import busWarning3d from '../../resources/images/icon/3d/bus-warning-3d.png';

// Van
import vanPng from '../../resources/images/icon/van.png';
import vanSuccessPng from '../../resources/images/icon/van-success.png';
import vanWarningPng from '../../resources/images/icon/van-warning.png';
import vanErrorPng from '../../resources/images/icon/van-error.png';
// 3d variant
import van3d from '../../resources/images/icon/3d/van-neutral-3d.png';
import vanSuccess3d from '../../resources/images/icon/3d/van-success-3d.png';
import vanWarning3d from '../../resources/images/icon/3d/van-warning-3d.png';
import vanError3d from '../../resources/images/icon/3d/van-error-3d.png';

// Truck
import truckPng from '../../resources/images/icon/truck.png';
import truckSuccessPng from '../../resources/images/icon/truck-success.png';
import truckWarningPng from '../../resources/images/icon/truck-warning.png';
import truckErrorPng from '../../resources/images/icon/truck-error.png';
// 3d variant
import truck3d from '../../resources/images/icon/3d/truck-neutral-3d.png';
import truckSuccess3d from '../../resources/images/icon/3d/truck-success-3d.png';
import truckWarning3d from '../../resources/images/icon/3d/truck-warning-3d.png';
import truckError3d from '../../resources/images/icon/3d/truck-error-3d.png';

// Traveller
import travellerPng from '../../resources/images/icon/traveller.png';
import travellerSuccessPng from '../../resources/images/icon/traveller-success.png';
import travellerWarningPng from '../../resources/images/icon/traveller-warning.png';
import travellerErrorPng from '../../resources/images/icon/traveller-error.png';
// 3d variant
import traveller3d from '../../resources/images/icon/3d/traveller-neutral-3d.png';
import travellerSuccess3d from '../../resources/images/icon/3d/traveller-success-3d.png';
import travellerWarning3d from '../../resources/images/icon/3d/traveller-warning-3d.png';
import travellerError3d from '../../resources/images/icon/3d/traveller-error-3d.png';

// Bike
import bikePng from '../../resources/images/icon/bike.png';
import bikeSuccessPng from '../../resources/images/icon/bike-success.png';
import bikeWarningPng from '../../resources/images/icon/bike-warning.png';
import bikeErrorPng from '../../resources/images/icon/bike-error.png';
// 3d Variant
import bike3d from '../../resources/images/icon/3d/bike-neutral-3d.png';
import bikeSuccess3d from '../../resources/images/icon/3d/bike-success-3d.png';
import bikeWarning3d from '../../resources/images/icon/3d/bike-warning-3d.png';
import bikeError3d from '../../resources/images/icon/3d/bike-error-3d.png';

// Scooter
import scooterPng from '../../resources/images/icon/scooter.png';
import scooterSuccessPng from '../../resources/images/icon/scooter-success.png';
import scooterWarningPng from '../../resources/images/icon/scooter-warning.png';
import scooterErrorPng from '../../resources/images/icon/scooter-error.png';
// 3d variant
import scooter3d from '../../resources/images/icon/3d/scooter-neutral-3d.png';
import scooterSuccess3d from '../../resources/images/icon/3d/scooter-success-3d.png';
import scooterWarning3d from '../../resources/images/icon/3d/scooter-warning-3d.png';
import scooterError3d from '../../resources/images/icon/3d/scooter-error-3d.png';

// E-Rickshaw
import eRickshawPng from '../../resources/images/icon/erickshaw.png';
import eRickshawSuccessPng from '../../resources/images/icon/erickshaw-success.png';
import eRickshawWarningPng from '../../resources/images/icon/erickshaw-warning.png';
import eRickshawErrorPng from '../../resources/images/icon/erickshaw-error.png';
// 3d Variant
import eRickshaw3d from '../../resources/images/icon/3d/erickshaw-neutral-3d.png';
import eRickshawSuccess3d from '../../resources/images/icon/3d/erickshaw-success-3d.png';
import eRickshawWarning3d from '../../resources/images/icon/3d/erickshaw-warning-3d.png';
import eRickshawError3d from '../../resources/images/icon/3d/erickshaw-error-3d.png';

// Rickshaw

import ricksawPng from '../../resources/images/icon/rickshaw.png';
import ricksawSuccessPng from '../../resources/images/icon/rickshaw-success.png';
import ricksawWarningPng from '../../resources/images/icon/rickshaw-warning.png';
import ricksawErrorPng from '../../resources/images/icon/rickshaw-error.png';

import ricksaw3d from '../../resources/images/icon/3d/rickshaw-neutral-3d.png';
import ricksawSuccess3d from '../../resources/images/icon/3d/rickshaw-success-3d.png';
import ricksawWarning3d from '../../resources/images/icon/3d/rickshaw-warning-3d.png';
import ricksawError3d from '../../resources/images/icon/3d/rickshaw-error-3d.png';

// Crane/JCB
import cranePng from '../../resources/images/icon/crane.png';
import craneSuccessPng from '../../resources/images/icon/crane-success.png';
import craneWarningPng from '../../resources/images/icon/crane-warning.png';
import craneErrorPng from '../../resources/images/icon/crane-error.png';
// 3d Variant
import crane3d from '../../resources/images/icon/3d/crane-neutral-3d.png';
import craneSuccess3d from '../../resources/images/icon/3d/crane-success-3d.png';
import craneWarning3d from '../../resources/images/icon/3d/crane-warning-3d.png';
import craneError3d from '../../resources/images/icon/3d/crane-error-3d.png';
// JCB 3d Variant
import jcb3d from '../../resources/images/icon/3d/jcb-neutral-3d.png';
import jcbSuccess3d from '../../resources/images/icon/3d/jcb-success-3d.png';
import jcbWarning3d from '../../resources/images/icon/3d/jcb-warning-3d.png';
import jcbError3d from '../../resources/images/icon/3d/jcb-error-3d.png';

// Buldozer
import buldozerPng from '../../resources/images/icon/buldozer.png';
import buldozerSuccessPng from '../../resources/images/icon/buldozer-success.png';
import buldozerWarningPng from '../../resources/images/icon/buldozer-warning.png';
import buldozerErrorPng from '../../resources/images/icon/buldozer-error.png';
// 3d variant
import buldozer3d from '../../resources/images/icon/3d/buldozer-neutral-3d.png';
import buldozerSuccess3d from '../../resources/images/icon/3d/buldozer-success-3d.png';
import buldozerWarning3d from '../../resources/images/icon/3d/buldozer-warning-3d.png';
import buldozerError3d from '../../resources/images/icon/3d/buldozer-error-3d.png';

// Tractor
import tractorPng from '../../resources/images/icon/tractor.png';
import tractorSuccessPng from '../../resources/images/icon/tractor-success.png';
import tractorWarningPng from '../../resources/images/icon/tractor-warning.png';
import tractorErrorPng from '../../resources/images/icon/tractor-error.png';
// 3d variant
import tractor3d from '../../resources/images/icon/3d/tractor-neutral-3d.png';
import tractorSuccess3d from '../../resources/images/icon/3d/tractor-success-3d.png';
import tractorWarning3d from '../../resources/images/icon/3d/tractor-warning-3d.png';
import tractorError3d from '../../resources/images/icon/3d/tractor-error-3d.png';

// Jeep
import jeepPng from '../../resources/images/icon/jeep.png';
import jeepSuccessPng from '../../resources/images/icon/jeep-success.png';
import jeepWarningPng from '../../resources/images/icon/jeep-warning.png';
import jeepErrorPng from '../../resources/images/icon/jeep-error.png';
// 3d variant
import jeep3d from '../../resources/images/icon/3d/jeep-neutral-3d.png';
import jeepSuccess3d from '../../resources/images/icon/3d/jeep-success-3d.png';
import jeepWarning3d from '../../resources/images/icon/3d/jeep-warning-3d.png';
import jeepError3d from '../../resources/images/icon/3d/jeep-error-3d.png';

// Default Icons
import defaultSvg from '../../resources/images/icon/default.svg';
import startSvg from '../../resources/images/icon/start.svg';
import finishSvg from '../../resources/images/icon/finish.svg';
import directionSvg from '../../resources/images/direction.svg';
import backgroundSvg from '../../resources/images/background.svg';

// Map Icons Object
export const mapIcons = {
  car: carPng,
  van: vanPng,
  truck: truckPng,
  traveller: travellerPng,
  bus: busPng,
  bike: bikePng,
  scooter: scooterPng,
  bicycle: bicyclePng,
  erickshaw: eRickshawPng,
  rickshaw: ricksawPng,
  crane: cranePng,
  jcb: cranePng,
  buldozer: buldozerPng,
  tractor: tractorPng,
  jeep: jeepPng,
  boat: boatPng,
  default: defaultSvg,
  finish: finishSvg,
  start: startSvg,
};

// Icon variants for different statuses (2D)
export const mapIconsVariants = {
  car: {
    success: carSuccessPng,
    warning: carWarningPng,
    error: carErrorPng,
  },
  van: {
    success: vanSuccessPng,
    warning: vanWarningPng,
    error: vanErrorPng,
  },
  truck: {
    success: truckSuccessPng,
    warning: truckWarningPng,
    error: truckErrorPng,
  },
  traveller: {
    success: travellerSuccessPng,
    warning: travellerWarningPng,
    error: travellerErrorPng,
  },
  bus: {
    success: busSuccessPng,
    warning: busWarningPng,
    error: busErrorPng,
  },
  bike: {
    success: bikeSuccessPng,
    warning: bikeWarningPng,
    error: bikeErrorPng,
  },
  scooter: {
    success: scooterSuccessPng,
    warning: scooterWarningPng,
    error: scooterErrorPng,
  },
  bicycle: {
    success: bicycleSuccessPng,
    warning: bicycleWarningPng,
    error: bicycleErrorPng,
  },
  erickshaw: {
    success: eRickshawSuccessPng,
    warning: eRickshawWarningPng,
    error: eRickshawErrorPng,
  },
  rickshaw: {
    success: ricksawSuccessPng,
    warning: ricksawWarningPng,
    error: ricksawErrorPng,
  },
  crane: {
    success: craneSuccessPng,
    warning: craneWarningPng,
    error: craneErrorPng,
  },
  jcb: {
    success: craneSuccessPng,
    warning: craneWarningPng,
    error: craneErrorPng,
  },
  buldozer: {
    success: buldozerSuccessPng,
    warning: buldozerWarningPng,
    error: buldozerErrorPng,
  },
  tractor: {
    success: tractorSuccessPng,
    warning: tractorWarningPng,
    error: tractorErrorPng,
  },
  jeep: {
    success: jeepSuccessPng,
    warning: jeepWarningPng,
    error: jeepErrorPng,
  },
  boat: {
    success: boatSuccessPng,
    warning: boatWarningPng,
    error: boatErrorPng,
  },
};

// 3D Device Icons with variants
export const device3dIcons = {
  car: {
    success: carSuccess3d,
    warning: carWarning3d,
    error: carError3d,
    neutral: carNeutral3d,
  },
  van: {
    success: vanSuccess3d,
    warning: vanWarning3d,
    error: vanError3d,
    neutral: van3d,
  },
  truck: {
    success: truckSuccess3d,
    warning: truckWarning3d,
    error: truckError3d,
    neutral: truck3d,
  },
  traveller: {
    success: travellerSuccess3d,
    warning: travellerWarning3d,
    error: travellerError3d,
    neutral: traveller3d,
  },
  bus: {
    success: busSuccess3d,
    warning: busWarning3d,
    error: busError3d,
    neutral: bus3d,
  },
  bike: {
    success: bikeSuccess3d,
    warning: bikeWarning3d,
    error: bikeError3d,
    neutral: bike3d,
  },
  scooter: {
    success: scooterSuccess3d,
    warning: scooterWarning3d,
    error: scooterError3d,
    neutral: scooter3d,
  },
  bicycle: {
    success: bicycleSuccess3d,
    warning: bicycleWarning3d,
    error: bicycleError3d,
    neutral: bicycle3d,
  },
  erickshaw: {
    success: eRickshawSuccess3d,
    warning: eRickshawWarning3d,
    error: eRickshawError3d,
    neutral: eRickshaw3d,
  },
  rickshaw: {
    success: ricksawSuccess3d,
    warning: ricksawWarning3d,
    error: ricksawError3d,
    neutral: ricksaw3d,
  },
  crane: {
    success: craneSuccess3d,
    warning: craneWarning3d,
    error: craneError3d,
    neutral: crane3d,
  },
  jcb: {
    success: jcbSuccess3d,
    warning: jcbWarning3d,
    error: jcbError3d,
    neutral: jcb3d,
  },
  buldozer: {
    success: buldozerSuccess3d,
    warning: buldozerWarning3d,
    error: buldozerError3d,
    neutral: buldozer3d,
  },
  tractor: {
    success: tractorSuccess3d,
    warning: tractorWarning3d,
    error: tractorError3d,
    neutral: tractor3d,
  },
  jeep: {
    success: jeepSuccess3d,
    warning: jeepWarning3d,
    error: jeepError3d,
    neutral: jeep3d,
  },
  boat: {
    success: boatSuccess3d,
    warning: boatWarning3d,
    error: boatError3d,
    neutral: boat3d,
  },
};

export const mapIconKey = (category) => {
  switch (category) {
    case 'offroad':
    case 'pickup':
      return 'car';
    case 'trolleybus':
      return 'bus';
    default:
      return mapIcons.hasOwnProperty(category) ? category : 'car';
  }
};

// Hook to dynamically load 3D icons
export const useDeviceIcon3d = (category, status) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [icon, setIcon] = useState(null);

  useEffect(() => {
    const iconName = device3dIcons[category]?.[status] || device3dIcons.car.neutral;
    setIcon(iconName);
    setLoading(false);
  }, [category, status]);

  return { loading, error, icon };
};

// Load all images into memory for performance
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

  await Promise.all(
    Object.keys(mapIcons).map(async (category) => {
      const results = [];
      const svg = mapIcons[category];
      ['info', 'success', 'error', 'neutral', 'warning'].forEach((color) => {
        let svgIcon = svg;
        if (
          mapIconsVariants.hasOwnProperty(category)
          && mapIconsVariants[category].hasOwnProperty(color)
        ) {
          svgIcon = mapIconsVariants[category][color];
        }

        results.push(
          loadImage(svgIcon, color).then((icon) => {
            mapImages[`${category}-${color}`] = prepareIcon(icon, null, mapPalette[color].main);
          }).catch((err) => console.error(`Failed to load image for ${category}-${color}`, err)),
        );
      });
      await Promise.all(results);
    }),
  );
};
