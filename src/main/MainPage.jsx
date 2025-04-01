import React, {
  useState, useCallback, useEffect, useRef,
} from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import DeviceList from './DeviceList';
import BottomMenu from '../common/components/BottomMenu';
import StatusCard from '../common/components/StatusCard';
import { devicesActions } from '../store';
import usePersistedState from '../common/util/usePersistedState';
import EventsDrawer from './EventsDrawer';
import useFilter from './useFilter';
import MainToolbar from './MainToolbar';
import MainMap from './MainMap';
import { useAttributePreference } from '../common/util/preferences';
import { createSearchParams, useNavigate } from 'react-router-dom';
import DeviceRow from './DeviceRow';
import DeviceCard from './DeviceCard';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeviceStatusCard from '../common/components/DeviceStatusCard';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
  },
  sidebar: {
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.up('md')]: {
      position: 'fixed',
      left: 0,
      top: 0,
      height: `calc(100% - ${theme.spacing(3)})`,
      width: theme.dimensions.drawerWidthDesktop,
      margin: theme.spacing(1.5),
      zIndex: 3,
    },
    [theme.breakpoints.down('md')]: {
      height: '100%',
      width: '100%',
    },
  },
  header: {
    pointerEvents: 'auto',
    zIndex: 6,
  },
  footer: {
    pointerEvents: 'auto',
    zIndex: 5,
  },
  middle: {
    flex: 1,
    display: 'grid',
  },
  contentMap: {
    pointerEvents: 'auto',
    gridArea: '1 / 1',
  },
  contentList: {
    pointerEvents: 'auto',
    gridArea: '1 / 1',
    zIndex: 4,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }
}));

const LiveMap = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();
  const navigate = useNavigate();
  const hasClearedDevice = useRef(false);

  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'));

  const mapOnSelect = useAttributePreference('mapOnSelect', true);
  const dashboardType = useAttributePreference('dashboardType', 'live-map');
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  // Clear selected device only once when page loads in compact layout on small devices
  useEffect(() => {
    if (!hasClearedDevice.current && isSmallDevice && dashboardType === 'compact' && selectedDeviceId) {
      dispatch(devicesActions.selectId(null));
      hasClearedDevice.current = true;
    }
  }, [isSmallDevice, dashboardType, selectedDeviceId, dispatch]);

  const positions = useSelector((state) => state.session.positions);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const selectedPosition = filteredPositions.find((position) => selectedDeviceId && position.deviceId === selectedDeviceId);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const { items: summaries } = useSelector((state) => state.summary);

  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = usePersistedState('filter', {
    statuses: [],
    groups: [],
  });
  const [filterSort, setFilterSort] = usePersistedState('filterSort', '');
  const [filterMap, setFilterMap] = usePersistedState('filterMap', false);

  const [devicesOpen, setDevicesOpen] = useState(desktop);
  const [eventsOpen, setEventsOpen] = useState(false);

  const onEventsClick = useCallback(() => setEventsOpen(true), [setEventsOpen]);

  useEffect(() => {
    if (!desktop && mapOnSelect && selectedDeviceId) {
      setDevicesOpen(false);
    }
  }, [desktop, mapOnSelect, selectedDeviceId]);

  // useEffect(() => {
  //   if (dashboardType === 'compact' && (selectedDeviceId != undefined && selectedDeviceId != null) && isSmallDevice) {
  //     navigate('/live');
  //   }
  // }, [selectedDeviceId, dashboardType, isSmallDevice])

  useEffect(() => {
    if (isSmallDevice && !desktop) {
      setDevicesOpen(true);
    }
  }, [isSmallDevice, desktop])

  useFilter(keyword, filter, filterSort, filterMap, positions, setFilteredDevices, setFilteredPositions);

  const renderCompactLayout = () => (
    <div className={classes.root}>
      <Paper square elevation={3} className={classes.header}>
        <MainToolbar
          filteredDevices={filteredDevices}
          devicesOpen={devicesOpen}
          setDevicesOpen={setDevicesOpen}
          hideDevicesOpen={true}
          keyword={keyword}
          setKeyword={setKeyword}
          filter={filter}
          setFilter={setFilter}
          filterSort={filterSort}
          setFilterSort={setFilterSort}
          filterMap={filterMap}
          setFilterMap={setFilterMap}
        />
      </Paper>
      <div className={classes.contentMap} style={{ padding: theme.spacing(2), height: "20rem", marginBottom: theme.spacing(2) }}>
        <Box className={classes.sectionHeader}>
          <Typography varient="body2" fontWeight="bold">Live Map</Typography>
          <Typography
            variant='body3'
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/live')}
          >
            See All
          </Typography>
        </Box>
        <Box sx={{ borderRadius: "8px", height: "100%", width: "100%", overflow: 'hidden' }}>
          <MainMap
            filteredPositions={filteredPositions}
            selectedPosition={selectedPosition}
            onEventsClick={onEventsClick}
            filteredDevices={filterMap ? filteredDevices : undefined}
            hideControls={true}
            onMarkerClick={(deviceId) => { }}
          />
        </Box>
      </div>
      <Paper square className={classes.contentList}>
        <Box className={classes.sectionHeader} sx={{ padding: `0 ${theme.spacing(2)}` }}>
          <Typography varient="body2" fontWeight="bold">Recent Devices</Typography>
          {/* <Typography variant='body3'>See All</Typography> */}
        </Box>
        {filteredDevices.map((_, index) => (
          <DeviceCard
            key={filteredDevices[index].id}
            isDeviceSelected={selectedDeviceId == filteredDevices[index].id}
            data={filteredDevices}
            index={index}
            style={{ marginBottom: theme.spacing(1) }}
            onClick={() => {
              setFilter
              navigate({ pathname: '/live', search: createSearchParams({ deviceId: filteredDevices[index].id }).toString() }, {replace: false});
            }}
          />
        ))}
      </Paper>
      <EventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
      {selectedDeviceId && (
        <DeviceStatusCard 
          deviceId={selectedDeviceId}
          position={selectedPosition}
          onClose={() => dispatch(devicesActions.selectId(null))}
          desktopPadding={theme.dimensions.drawerWidthDesktop}
          summary={summaries[selectedDeviceId] || {}}
        />
        // <StatusCard
        //   deviceId={selectedDeviceId}
        //   position={selectedPosition}
        //   onClose={() => dispatch(devicesActions.selectId(null))}
        //   desktopPadding={theme.dimensions.drawerWidthDesktop}
        //   summary={summaries[selectedDeviceId] || {}}
        // />
      )}
    </div>
  );

  const renderLiveMapLayout = () => (
    <div className={classes.root}>
      {desktop && (
        <MainMap
          filteredPositions={filteredPositions}
          selectedPosition={selectedPosition}
          onEventsClick={onEventsClick}
          filteredDevices={filterMap ? filteredDevices : undefined}
        />
      )}
      <div className={classes.sidebar}>
        <Paper square elevation={3} className={classes.header}>
          <MainToolbar
            filteredDevices={filteredDevices}
            devicesOpen={devicesOpen}
            setDevicesOpen={setDevicesOpen}
            keyword={keyword}
            setKeyword={setKeyword}
            filter={filter}
            setFilter={setFilter}
            filterSort={filterSort}
            setFilterSort={setFilterSort}
            filterMap={filterMap}
            setFilterMap={setFilterMap}
          />
        </Paper>
        <div className={classes.middle}>
          {!desktop && (
            <div className={classes.contentMap}>
              <MainMap
                filteredPositions={filteredPositions}
                selectedPosition={selectedPosition}
                onEventsClick={onEventsClick}
                filteredDevices={filterMap ? filteredDevices : undefined}
              />
            </div>
          )}
          <Paper square className={classes.contentList} style={devicesOpen ? {} : { visibility: 'hidden' }}>
            <DeviceList devices={filteredDevices} />
          </Paper>
        </div>
        {desktop && (
          <div className={classes.footer}>
            <BottomMenu />
          </div>
        )}
      </div>
      <EventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
      {selectedDeviceId && (
        // <StatusCard
        //   deviceId={selectedDeviceId}
        //   position={selectedPosition}
        //   onClose={() => dispatch(devicesActions.selectId(null))}
        //   desktopPadding={theme.dimensions.drawerWidthDesktop}
        //   summary={summaries[selectedDeviceId] || {}}
        // />
        <DeviceStatusCard 
          deviceId={selectedDeviceId}
          position={selectedPosition}
          onClose={() => dispatch(devicesActions.selectId(null))}
          desktopPadding={theme.dimensions.drawerWidthDesktop}
          summary={summaries[selectedDeviceId] || {}}
        />
      )}
    </div>
  );

  return isSmallDevice && dashboardType === 'compact' ? renderCompactLayout() : renderLiveMapLayout();
};

export default LiveMap;