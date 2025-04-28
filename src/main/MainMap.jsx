import React, { useCallback, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import MapView from '../map/core/MapView';
import MapSelectedDevice from '../map/main/MapSelectedDevice';
import MapAccuracy from '../map/main/MapAccuracy';
import MapGeofence from '../map/MapGeofence';
import MapCurrentLocation from '../map/MapCurrentLocation';
import PoiMap from '../map/main/PoiMap';
import MapPadding from '../map/MapPadding';
import { devicesActions } from '../store';
import MapDefaultCamera from '../map/main/MapDefaultCamera';
import MapLiveRoutes from '../map/main/MapLiveRoutes';
import MapPositions from '../map/MapPositions';
import MapOverlay from '../map/overlay/MapOverlay';
import MapGeocoder from '../map/geocoder/MapGeocoder';
import MapScale from '../map/MapScale';
import MapNotification from '../map/notification/MapNotification';
import useFeatures from '../common/util/useFeatures';
import { useAnimatedPositions } from '../AnimationContext';

const MainMap = ({ filteredPositions, selectedPosition, onEventsClick, filteredDevices, onMarkerClick, animationDuration = 1000 }) => {
  const theme = useTheme();
  const dispatch = useDispatch();

  const desktop = useMediaQuery(theme.breakpoints.up('md'));

  const eventsAvailable = useSelector((state) => !!state.events.items.length);

  const features = useFeatures();
  const {animPositions: positions} = useAnimatedPositions();

  const markerClick = useCallback((_, deviceId) => {
    if (onMarkerClick) onMarkerClick(deviceId)
    else dispatch(devicesActions.selectId(deviceId));
  }, [dispatch]);

  const deviceIds = useMemo(() => filteredDevices?.map(fd => fd.id), [filteredDevices] || []);

  const animatedPositions = useMemo(() => {
    return Object.values(positions).filter(p => deviceIds?.includes(p.deviceId) || true);
  }, [positions]);

  return (
    <>
      <MapView>
        <MapOverlay />
        <MapGeofence />
        <MapAccuracy positions={filteredPositions} />
        <MapLiveRoutes filteredDevices={filteredDevices} />
        <MapPositions
          positions={animatedPositions}
          onClick={markerClick}
          selectedPosition={selectedPosition}
          filteredDevices={filteredDevices}
          showStatus
        />
        <MapDefaultCamera animationDuration={animationDuration} />
        <MapSelectedDevice />
        <PoiMap />
      </MapView>
      {/* <MapScale /> */}
      <MapCurrentLocation />
      {/* <MapGeocoder /> */}
      {/* {!features.disableEvents && (
        <MapNotification enabled={eventsAvailable} onClick={onEventsClick} />
      )} */}
      {desktop && (
        <MapPadding left={parseInt(theme.dimensions.drawerWidthDesktop, 10) + parseInt(theme.spacing(1.5), 10)} />
      )}
    </>
  );
};

export default MainMap;
