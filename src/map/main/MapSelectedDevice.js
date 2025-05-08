import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import dimensions from '../../common/theme/dimensions';
import { map } from '../core/MapView';
import { usePrevious } from '../../reactHelper';
import { useAttributePreference, usePreference } from '../../common/util/preferences';
import { useAnimatedPositions } from '../../AnimationContext';

const MapSelectedDevice = ({ deviceId: propDeviceId }) => {
  // const reduxDeviceId = useSelector((state) => state.devices.selectedId);
  const selectTime = useSelector((state) => state.devices.selectTime);
  const previousTime = usePrevious(selectTime);

  // Use propDeviceId if provided, otherwise fallback to Redux
  const currentId = propDeviceId;
  const previousId = usePrevious(currentId);
  const { lastAnimatedPositions: positions } = useAnimatedPositions();

  const position = positions[currentId] || null;

  const defaultZoomPref = usePreference('zoom', 10);
  const defaultZoom = useAttributePreference('zoom', defaultZoomPref);
  const mapFollow = useAttributePreference('mapFollow', false);
  const initRef = useRef(false);

  useEffect(() => {
    if ((currentId !== previousId || selectTime !== previousTime || mapFollow) && position) {
      if(!initRef.current){
        map.setZoom(defaultZoom);
        initRef.current = true
      }
      map.easeTo({
        center: [position.longitude, position.latitude],
        // zoom: Math.max(map.getZoom(), defaultZoom),
        offset: [0, -dimensions.popupMapOffset / 2],
      });
    }
  }, [currentId, previousId, selectTime, previousTime, mapFollow, position, defaultZoom]);

  return null;
};

export default MapSelectedDevice;
