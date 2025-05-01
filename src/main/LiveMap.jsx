import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useMemo, useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import {
  Box, Icon, IconButton, Paper, Toolbar, Typography, useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ExpandMore, MoreVert } from '@mui/icons-material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MainMap from './MainMap';
import { useTranslation } from '../common/components/LocalizationProvider';
import StatusCard from '../common/components/StatusCard';
import { devicesActions } from '../store';
import MainToolbar from './MainToolbar';
import usePersistedState from '../common/util/usePersistedState';
import useFilter from './useFilter';
import DeviceStatusCard from '../common/components/DeviceStatusCard';
import MapControlLinks from '../map/extras/MapControlLinks';
import { useAnimatedPositions } from '../AnimationContext';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100vw',
    overflow: 'hidden',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 3,
    left: 0,
    top: 0,
    margin: theme.spacing(1.5),
    width: theme.dimensions.drawerWidthDesktop,
    [theme.breakpoints.down('md')]: {
      width: '100%',
      margin: 0,
    },
  },
  mapContainer: {
    flex: 1,
    height: '100vh',
    width: '100%',
    marginLeft: theme.dimensions.drawerWidthDesktop,
    [theme.breakpoints.down('md')]: {
      marginLeft: 0,
      marginTop: theme.spacing('104px'), // Height of the toolbar
      height: '100%',
    },
  },
  hideFilterMapContainer: {
    [theme.breakpoints.down('md')]: {
      marginTop: theme.spacing('0px'), // Height of the toolbar
    },
  },
  floatingNavContainer: {
    position: 'absolute',
    top: theme.spacing(1),
    left: theme.spacing(1),
  },
}));

export default function LiveMap() {
  const t = useTranslation();
  const styles = useStyles();
  const theme = useTheme();
  const positions = useSelector((state) => state.session.positions);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const { items: summaries } = useSelector((state) => state.summary);
  const devices = useSelector((state) => state.devices.items);
  const dispatch = useDispatch();
  const [statusCardMinimized, setStatusCardMinimized] = useState(true);

  // Add necessary state variables for MainToolbar
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = usePersistedState('filter', {
    statuses: [],
    groups: [],
  });
  const [filterSort, setFilterSort] = usePersistedState('filterSort', '');
  const [filterMap, setFilterMap] = usePersistedState('filterMap', false);
  const [devicesOpen, setDevicesOpen] = useState(true);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { resetHistory } = useAnimatedPositions();

  useFilter(keyword, filter, filterSort, filterMap, positions, setFilteredDevices, setFilteredPositions);

  useEffect(() => {
    setFilteredPositions(Object.values(filteredDevices).map((device) => positions[device.id]).filter(Boolean));
  }, [positions, filteredDevices]);

  useEffect(() => {
    resetHistory();
    if (params.has('deviceId') && selectedDeviceId === null) {
      dispatch(devicesActions.selectId(Number(params.get('deviceId'))));
    }
  }, []);

  const mapLinks = useMemo(() => (selectedDeviceId || params.has('deviceId')) && <MapControlLinks links={[{ title: 'playback', icon: <PlayArrowIcon />, onClick: () => navigate('/replay') }]} />, [selectedDeviceId, params]);

  return (
    <div className={styles.root}>
      <div className={styles.sidebar}>
        { params.has('deviceId') ? (
          <Box className={styles.floatingNavContainer}>
            <IconButton onClick={() => navigate(-1)} sx={{ backgroundColor: theme.palette.background.default }}>
              <ArrowBackIcon />
            </IconButton>
          </Box>
        ) : (
          <Paper elevation={3} square>
            <MainToolbar
              pageTitle={(
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                  <Typography variant="h6">Live Map</Typography>
                </Box>
)}
                            // filteredDevices={filteredDevices}
              devicesOpen={devicesOpen}
              setDevicesOpen={setDevicesOpen}
              hideDevicesOpen
              onLeftTop={(
                <IconButton edge="start" size="small" onClick={() => navigate(-1)}>
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
                              )}
              keyword={keyword}
              setKeyword={setKeyword}
              filter={filter}
              setFilter={setFilter}
              filterSort={filterSort}
              setFilterSort={setFilterSort}
              filterMap={filterMap}
              setFilterMap={setFilterMap}
              selectedDeviceId={selectedDeviceId}
              nMap
              filteredPositions={filteredPositions}
              selectedPosition={filteredPositions.find((position) => selectedDeviceId && position.deviceId === selectedDeviceId)}
              hideControls
              onEventsClick={() => {}}
              filteredDevices={params.has('deviceId') && Object.values(devices).map((fd) => fd.id).includes(Number(params.get('deviceId'))) ? Object.values(devices).filter((fd) => fd.id == params.get('deviceId')) : filteredDevices}
              hidefilters={params.has('deviceId')}
            />
          </Paper>
        )}
      </div>
      <div className={`${styles.mapContainer} ${params.has('deviceId') ? styles.hideFilterMapContainer : ''}`}>
        <MainMap
          filteredPositions={filteredPositions}
          selectedPosition={filteredPositions.find((position) => selectedDeviceId && position.deviceId === selectedDeviceId)}
          hideControls
          onEventsClick={() => {}}
          filteredDevices={params.has('deviceId') && Object.values(devices).map((fd) => fd.id).includes(Number(params.get('deviceId'))) ? Object.values(devices).filter((fd) => fd.id == params.get('deviceId')) : filteredDevices}
          animationDuration={4000}
        />
        {mapLinks}
      </div>
      {selectedDeviceId && (
      <DeviceStatusCard
        deviceId={selectedDeviceId}
        position={params.has('deviceId') && Object.values(devices).map((fd) => fd.id).includes(Number(params.get('deviceId'))) ? Object.values(positions).find((position) => selectedDeviceId && position.deviceId === selectedDeviceId) : filteredPositions.find((position) => selectedDeviceId && position.deviceId === selectedDeviceId)}
        onClose={params.has('deviceId') ? (() => setStatusCardMinimized(!statusCardMinimized)) : (() => dispatch(devicesActions.selectId(null)))}
        desktopPadding={theme.dimensions.drawerWidthDesktop}
        minimize={statusCardMinimized}
        closeIcon={params.has('deviceId') && <ExpandMore />}
        summary={summaries[selectedDeviceId] || {}}
      />
      )}
    </div>
  );
}
