import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Table, TableBody, TableCell, TableHead, TableRow, useMediaQuery, Card, CardContent, Typography,
} from '@mui/material';
import ReportFilter from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import { useCatch } from '../reactHelper';
import MapView from '../map/core/MapView';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import { formatTime } from '../common/util/formatter';
import { prefixString } from '../common/util/stringUtils';
import MapMarkers from '../map/MapMarkers';
import MapRouteCoordinates from '../map/MapRouteCoordinates';
import MapScale from '../map/MapScale';

// import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
// import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
// import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
// import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
// import SpeedIcon from '@mui/icons-material/Speed';
// import EvStationIcon from '@mui/icons-material/EvStation';
// import WarningIcon from '@mui/icons-material/Warning';
// import DoorFrontIcon from '@mui/icons-material/DoorFront';
// import CloudOffIcon from '@mui/icons-material/CloudOff';
// import CloudQueueIcon from '@mui/icons-material/CloudQueue';
// import RadioIcon from '@mui/icons-material/Radio';
// import BuildIcon from '@mui/icons-material/Build';
// import SmsIcon from '@mui/icons-material/Sms';
// import PersonIcon from '@mui/icons-material/Person';
// import ImageIcon from '@mui/icons-material/Image';
// import DeviceUnknownIcon from '@mui/icons-material/DeviceUnknown';

// const getEventDisplay = (type) => {
//   const map = {
//     deviceOnline: { icon: <CloudQueueIcon />, color: 'green' },
//     deviceOffline: { icon: <CloudOffIcon />, color: 'gray' },
//     deviceUnknown: { icon: <DeviceUnknownIcon />, color: 'orange' },
//     deviceInactive: { icon: <PauseCircleOutlineIcon />, color: 'gray' },
//     deviceMoving: { icon: <DirectionsRunIcon />, color: 'blue' },
//     deviceStopped: { icon: <PauseCircleOutlineIcon />, color: 'red' },
//     deviceOverspeed: { icon: <SpeedIcon />, color: 'red' },
//     deviceFuelDrop: { icon: <EvStationIcon />, color: 'red' },
//     deviceFuelIncrease: { icon: <EvStationIcon />, color: 'green' },
//     queuedCommandSent: { icon: <RadioIcon />, color: 'blue' },
//     commandResult: { icon: <RadioIcon />, color: 'blue' },
//     geofenceEnter: { icon: <DoorFrontIcon />, color: 'blue' },
//     geofenceExit: { icon: <DoorFrontIcon />, color: 'orange' },
//     alarm: { icon: <WarningIcon />, color: 'red' },
//     ignitionOn: { icon: <PowerSettingsNewIcon />, color: 'green' },
//     ignitionOff: { icon: <PowerSettingsNewIcon />, color: 'gray' },
//     maintenance: { icon: <BuildIcon />, color: 'orange' },
//     textMessage: { icon: <SmsIcon />, color: 'purple' },
//     driverChanged: { icon: <PersonIcon />, color: 'blue' },
//     media: { icon: <ImageIcon />, color: 'purple' },
//   };

//   return map[type] || { icon: <NotificationsActiveIcon />, color: 'black' };
// };

const CombinedReportPage = () => {
  const classes = useReportStyles();
  const t = useTranslation();

  const devices = useSelector((state) => state.devices.items);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');

  const itemsCoordinates = useMemo(() => items.flatMap((item) => item.route), [items]);

  const createMarkers = () => items.flatMap((item) => item.events
    .map((event) => item.positions.find((p) => event.positionId === p.id))
    .filter((position) => position != null)
    .map((position) => ({
      latitude: position.latitude,
      longitude: position.longitude,
    })));

  const handleSubmit = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    groupIds.forEach((groupId) => query.append('groupId', groupId));
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/combined?${query.toString()}`);
      if (response.ok) {
        setItems(await response.json());
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  });

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportCombined']}>
      <div className={classes.container}>
        {Boolean(items.length) && (
          <div className={classes.containerMap}>
            <MapView>
              <MapGeofence />
              {items.map((item) => (
                <MapRouteCoordinates
                  key={item.deviceId}
                  name={devices[item.deviceId].name}
                  coordinates={item.route}
                  deviceId={item.deviceId}
                />
              ))}
              <MapMarkers markers={createMarkers()} />
            </MapView>
            <MapScale />
            <MapCamera coordinates={itemsCoordinates} />
          </div>
        )}
        <div className={classes.containerMain}>
          <div className={classes.header}>
            <ReportFilter handleSubmit={handleSubmit} showOnly multiDevice includeGroups loading={loading} />
          </div>

          {!loading ? (
            isMobile ? (
              items.flatMap((item) => item.events.map((event) =>
              // const { icon, color, label } = getEventDisplay(event.type);
                (
                  <Card key={event.id} sx={{ mb: 2, boxShadow: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2 }}>
                    <CardContent sx={{ flex: 1, paddingLeft: 0 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {devices[item.deviceId]?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(event.eventTime, 'seconds')}
                      </Typography>
                    </CardContent>
                    <CardContent sx={{ textAlign: 'right', minWidth: '100px' }}>
                      {/* <Typography variant="h6" component="div" sx={{ color }}>
                          {icon}
                        </Typography> */}
                      <Typography variant="body2" sx={{ color, fontWeight: 500 }}>
                        {t(prefixString('event', event.type))}
                      </Typography>
                    </CardContent>
                  </Card>
                )))

            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('sharedDevice')}</TableCell>
                    <TableCell>{t('positionFixTime')}</TableCell>
                    <TableCell>{t('sharedType')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.flatMap((item) => item.events.map((event, index) => (
                    <TableRow key={event.id}>
                      <TableCell>{index ? '' : devices[item.deviceId].name}</TableCell>
                      <TableCell>{formatTime(event.eventTime, 'seconds')}</TableCell>
                      <TableCell>{t(prefixString('event', event.type))}</TableCell>
                    </TableRow>
                  )))}
                </TableBody>
              </Table>
            )
          ) : (
            <Table>
              <TableBody>
                <TableShimmer columns={3} />
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default CombinedReportPage;
