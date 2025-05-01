import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { useAttributePreference } from '../common/util/preferences';

export default (keyword, filter, filterSort, filterMap, positions, setFilteredDevices, setFilteredPositions) => {
  const groups = useSelector((state) => state.groups.items);
  const devices = useSelector((state) => state.devices.items);
  const daysBeforeExpiry = useAttributePreference('daysBeforeExpiry');

  const isOffline = (device) => {
    const position = positions[device.id];
    return position != undefined && device.status === 'offline';
  };

  const isRunning = (device) => {
    const position = positions[device.id];
    return position && position?.attributes?.activity === 'running';
  };

  const isStopped = (device) => {
    const position = positions[device.id];
    return position && position?.attributes?.activity === 'stopped';
  };

  const isIdle = (device) => {
    const position = positions[device.id];
    return position && position?.attributes?.activity === 'idle';
  };

  const isExpired = (device) => device.expirationTime && dayjs(device.expirationTime).diff(dayjs()) < 0;

  const isNoData = (device) => {
    const position = positions[device.id];
    return position === undefined && device.status === 'offline';
  };

  const isExpireSoon = (device) => {
    if (device.expirationTime) {
      const days = dayjs(device.expirationTime).diff(dayjs(), 'days');
      return days > 0 && days < daysBeforeExpiry;
    }
    return false;
  };

  useEffect(() => {
    const deviceGroups = (device) => {
      const groupIds = [];
      let { groupId } = device;
      while (groupId) {
        groupIds.push(groupId);
        groupId = groups[groupId]?.groupId || 0;
      }
      return groupIds;
    };

    const filtered = Object.values(devices)
      .filter((device) => !filter.statuses.length
        || filter.statuses.includes('offline') && isOffline(device)
        || filter.statuses.includes('running') && isRunning(device)
        || filter.statuses.includes('stopped') && isStopped(device)
        || filter.statuses.includes('idle') && isIdle(device)
        || filter.statuses.includes('expired') && isExpired(device)
        || filter.statuses.includes('expiresoon') && isExpireSoon(device)
        || filter.statuses.includes('nodata') && isNoData(device))
      .filter((device) => (filter.groups != '' ? deviceGroups(device).includes(filter.groups) : true))
      .filter((device) => {
        const lowerCaseKeyword = keyword.toLowerCase();
        return [device.name, device.uniqueId, device.phone, device.model, device.contact].some((s) => s && s.toLowerCase().includes(lowerCaseKeyword));
      });
    switch (filterSort) {
      case 'name':
        filtered.sort((device1, device2) => device1.name.localeCompare(device2.name));
        break;
      case 'lastUpdate':
        filtered.sort((device1, device2) => {
          const time1 = device1.lastUpdate ? dayjs(device1.lastUpdate).valueOf() : 0;
          const time2 = device2.lastUpdate ? dayjs(device2.lastUpdate).valueOf() : 0;
          return time2 - time1;
        });
        break;
      default:
        break;
    }
    setFilteredDevices(filtered);
    setFilteredPositions(filterMap
      ? filtered.map((device) => positions[device.id]).filter(Boolean)
      : Object.values(positions));
  }, [keyword, filter, filterSort, filterMap, groups, devices, positions, setFilteredDevices, setFilteredPositions]);
};
