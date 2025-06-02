import React, {
  useState, useEffect, useRef, useCallback,
  useMemo,
} from 'react';
import {
  Box,
  IconButton, Paper, Slider, Toolbar, Typography,
  useTheme, Stack,
  Menu,
  MenuItem,
  Checkbox,
  Select,
  TextField,
  Badge,
  Popover,
  Button,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ExpandLess, ExpandMore, FilterAlt } from '@mui/icons-material';
import dayjs from 'dayjs';
import { green } from '@mui/material/colors';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import MapAutoCenter from '../map/MapAutoCenter';
import { formatDistance, formatTime, TimeDiffInHumanReadableFormat } from '../common/util/formatter';
import ReportFilter from '../reports/components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatch } from '../reactHelper';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import StatusCard from '../common/components/StatusCard';
import MapScale from '../map/MapScale';
import {
  calculateDistance, calculateDistanceFromCoords, decimateCoordinates, useInterpolatedPosition,
} from '../common/util/position';
import MapStoppages from '../map/MapStoppages';
import FilteredPolylines from './FilteredSegments';
import FilteredSegments from './FilteredSegments';
import DeviceReplayStatusCard from '../common/components/DeviceReplayStatusCard';
import { useAttributePreference } from '../common/util/preferences';
import PositionValue from '../common/components/PositionValue';
import PopupContent from '../common/components/MarkerPopupContent';
import { createRoot } from 'react-dom/client';
import { Popup } from 'maplibre-gl';
import PlaybackSegmentCard from '../common/components/PlaybackSegmentCard';
import useNativeNavigateBack from '../common/util/nativeNavigation';
import ActivityLoader from '../common/components/ActivityLoader';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
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
  title: {
    flexGrow: 1,
  },
  slider: {
    width: '100%',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formControlLabel: {
    height: '100%',
    width: '100%',
    paddingRight: theme.spacing(1),
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    padding: `${theme.spacing(0.5)} ${theme.spacing(2)}`,
    [theme.breakpoints.down('md')]: {
      margin: theme.spacing(1),
    },
    [theme.breakpoints.up('md')]: {
      marginTop: theme.spacing(1),
    },
  },
}));

const FilterMarkingColors = {
  stoppedMoreThan: '#e33124',
  idleMoreThan: '#FFC107',
  speedMoreThan: '#c70fff',
  inactivity: '#2950ff',
};

const PlaybackFilters = ({ filterAnchor, filterMenuExpanded, closeFilterMenu, filters, setFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const t = useTranslation();
  // Sync local state when props.filters change (e.g., on open)
  useEffect(() => {
    if (filterMenuExpanded) {
      setLocalFilters(filters);
    }
  }, [filterMenuExpanded, filters]);

  const handleApply = () => {
    setFilters(localFilters);
    closeFilterMenu();
  };

  const handleReset = () => {
    const resetState = {
      stoppedMoreThan: null,
      idleMoreThan: null,
      speedMoreThan: null,
      inactivity: false,
    };
    setLocalFilters(resetState);
  };

  return (
    <Popover
      id="filter-popover"
      anchorEl={filterAnchor}
      open={filterMenuExpanded}
      onClose={closeFilterMenu}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
    >
      <Box sx={{ p: 1, minWidth: 280 }}>
        <MenuItem>
          <label style={{ flex: 1 }}>
            <Checkbox
              checked={localFilters.stoppedMoreThan !== null}
              onChange={(e) => setLocalFilters({ ...localFilters, stoppedMoreThan: e.target.checked ? 1 : null })}
            />
            {t('reportStoppedMoreThan')}
            <Indicator color={FilterMarkingColors.stoppedMoreThan} />
          </label>
          <Select
            size="small"
            value={localFilters.stoppedMoreThan || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, stoppedMoreThan: e.target.value })}
            disabled={localFilters.stoppedMoreThan === null}
            sx={{ ml: 1 }}
          >
            {[1, 2, 5, 10, 15, 30].map((val) => (
              <MenuItem key={val} value={val}>
                {val}
                {' '}
                min
              </MenuItem>
            ))}
          </Select>
        </MenuItem>

        <MenuItem>
          <label style={{ flex: 1 }}>
            <Checkbox
              checked={localFilters.idleMoreThan !== null}
              onChange={(e) => setLocalFilters({ ...localFilters, idleMoreThan: e.target.checked ? 1 : null })}
            />
            {t('reportIdleMoreThan')}
            <Indicator color={FilterMarkingColors.idleMoreThan} />
          </label>
          <Select
            size="small"
            value={localFilters.idleMoreThan || ''}
            onChange={(e) => setLocalFilters({ ...localFilters, idleMoreThan: e.target.value })}
            disabled={localFilters.idleMoreThan === null}
            sx={{ ml: 1 }}
          >
            {[1, 2, 5, 10, 15, 30].map((val) => (
              <MenuItem key={val} value={val}>
                {val}
                {' '}
                min
              </MenuItem>
            ))}
          </Select>
        </MenuItem>

        <MenuItem>
          <label style={{ flex: 1 }}>
            <Checkbox
              checked={localFilters.speedMoreThan !== null}
              onChange={(e) => setLocalFilters({ ...localFilters, speedMoreThan: e.target.checked ? '' : null })}
            />
            {t('reportSpeedMoreThan')}
            <Indicator color={FilterMarkingColors.speedMoreThan} />
          </label>
          <TextField
            type="number"
            size="small"
            value={localFilters.speedMoreThan ?? ''}
            onChange={(e) => setLocalFilters({ ...localFilters, speedMoreThan: parseFloat(e.target.value) || '' })}
            disabled={localFilters.speedMoreThan === null}
            sx={{ ml: 1, width: '100px' }}
          />
        </MenuItem>

        <MenuItem>
          <label>
            <Checkbox
              checked={localFilters.inactivity}
              onChange={(e) => setLocalFilters({ ...localFilters, inactivity: e.target.checked })}
            />
            {t('reportInactivity')}
            <Indicator color={FilterMarkingColors.inactivity} />
          </label>
        </MenuItem>
        <Divider my={1} />
        <Box display="flex" gap={2} justifyContent="flex-end" mt={2} px={1}>
          <Button variant="outlined" onClick={handleReset}>{t('sharedReset')}</Button>
          <Button variant="contained" onClick={handleApply}>{t('sharedApply')}</Button>
        </Box>
      </Box>
    </Popover>
  );
};

const Indicator = ({ color }) => (
  <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: color, borderRadius: '50%', margin: '0 5px' }} />
);

const ReplayPage = () => {
  const t = useTranslation();
  const classes = useStyles();
  const navigate = useNavigate();
  const timerRef = useRef();
  const theme = useTheme();

  const defaultDeviceId = useSelector((state) => state.devices.selectedId);

  const [positions, setPositions] = useState([]);
  const [rawPositions, setRawPositions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);
  const [showCard, setShowCard] = useState(false);
  const [from, setFrom] = useState();
  const [to, setTo] = useState();
  const [expanded, setExpanded] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(undefined);
  const [multiplier, setMultiplier] = useState(1);
  const [stoppages, setStoppages] = useState([]);
  const [statusCardMinimized, setStatusCardMinimized] = useState(true);
  const [params] = useSearchParams();
  const duration = 1000;
  const distanceUnit = useAttributePreference('distanceUnit');
  const [selectedSegment, setSelectedSegment] = useState(null);
  // Custom navigate back function that stops playback immediately before navigating
  const nativeNavigateBack = useNativeNavigateBack();
  const navigateBack = useCallback(() => {
    nativeNavigateBack();
    if (playing) {
      clearInterval(timerRef.current);
      setPlaying(false);
    }
  }, [nativeNavigateBack, playing])
  
  useEffect(() => {
    const handlePopState = () => {
      if (playing) {
        clearInterval(timerRef.current);
        setPlaying(false);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [playing]);

  const [filterAnchor, setFilterAnchor] = useState(null);
  const filterMenuExpanded = Boolean(filterAnchor);
  const [filters, setFilters] = useState({
    stoppedMoreThan: null,
    idleMoreThan: null,
    speedMoreThan: null,
    inactivity: null,
  });

  const filterRenderType = {
    stoppedMoreThan: 'marker',
    idleMoreThan: 'marker',
    speedMoreThan: 'line',
    inactivity: 'marker',
  };

  const ReportColor = useAttributePreference('web.reportColor', green[500]);

  const openFilterMenu = (event) => {
    setFilterAnchor(event.currentTarget);
  };

  const closeFilterMenu = () => {
    setFilterAnchor(null);
  };

  const deviceName = useSelector((state) => {
    if (selectedDeviceId) {
      const device = state.devices.items[selectedDeviceId];
      if (device) {
        return device.name;
      }
    }
    return null;
  });

  const devices = useSelector((state) => state.devices.items);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (playing && positions.length > 0) {
      timerRef.current = setInterval(() => {
        setIndex((index) => index + 1);
      }, duration / multiplier);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [playing, positions, multiplier]);

  useEffect(() => {
    if (index >= positions.length - 1) {
      clearInterval(timerRef.current);
      setPlaying(false);
    }
  }, [index, positions]);

  const onPointClick = (_, index) => {
    setIndex(index);
  };

  const onMarkerClick = useCallback((positionId, deviceId) => {
    console.log(deviceId);
    setShowCard(!!positionId);
  }, [setShowCard]);

  const findStoppages = (positions) => {
    // check if the ignition is off then push it into stopages
    let currentStoppage = [];
    const startPosition = positions[0];
    const endPosition = positions[positions.length - 1];

    const stoppages = [];
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      if (calculateDistance(startPosition.latitude, startPosition.longitude, position.latitude, position.longitude) < 10 && calculateDistance(position.latitude, position.longitude, endPosition.latitude, endPosition.longitude) < 10) continue;
      if (position.attributes.ignition === false) { currentStoppage.push(position); } else if (position.attributes.ignition === true && currentStoppage.length > 1) {
        stoppages.push(currentStoppage);
        currentStoppage = [];
      }
    }
    if (currentStoppage.length > 0) {
      stoppages.push(currentStoppage);
    }
    return stoppages;
  };

  const fetchSummary = async (deviceId, from, to) => {
    const response = await fetch(`/api/reports/summary?deviceId=${deviceId}&from=${from}&to=${to}`, {
      headers: { Accept: 'application/json' },
    });
    if (response.ok) {
      const [summary] = await response.json();
      return summary;
    }
    return undefined;
  };

  const handleSubmit = useCatch(async ({ deviceId, from, to }) => {
    setLoading(true);
    setSelectedDeviceId(deviceId);
    setFrom(from);
    setTo(to);
    setStoppages(null);
    const query = new URLSearchParams({ deviceId, from, to });
    try {
      const response = await fetch(`/api/positions?${query.toString()}`);
      setSummary(await fetchSummary(deviceId, from, to));
      if (response.ok) {
        setIndex(0);
        const rawPosition = await response.json();
        const positions = decimateCoordinates(rawPosition, 10);
        setRawPositions(rawPosition);
        setPositions(positions);
        if (positions.length) {
          setExpanded(false);
          setShowCard(true);
        } else {
          throw Error(t('sharedNoData'));
        }
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    if (params.has('deviceId') && params.has('from') && params.has('to')) {
      handleSubmit({ deviceId: params.get('deviceId'), from: params.get('from'), to: params.get('to') });
    }
  }, [params]);

  useEffect(() => {
    if (rawPositions.length > 0) {
      setStoppages(findStoppages(rawPositions));
    }
  }, [rawPositions]); // Update stoppages whenever rawPositions changes

  const handleDownload = () => {
    const query = new URLSearchParams({ deviceId: selectedDeviceId, from, to });
    window.location.assign(`/api/positions/kml?${query.toString()}`);
  };

  const animatedPositions = useInterpolatedPosition(positions[index], positions[index + 1], duration / multiplier, 'linear');
  const updateSegmentSelection = (segment, filterType, options = []) => {
    setSelectedSegment({ segment, filterType, options });
  }

  // using memorizarions for preventing the non-logical rendering
  const stoppageMarkersMemo = useMemo(() => (stoppages && !(filters.stoppedMoreThan || filters.idleMoreThan || filters.speedMoreThan || filters.inactivity))
    && (<MapStoppages positions={stoppages} startPosition={positions[0]} endPosition={positions[positions.length - 1]} device={devices[selectedDeviceId]} onClick={(segment, index) => updateSegmentSelection(segment, 'stoppage', { segmentIndex: index })} />), [stoppages, filters]);

  const filterStopMoreThanMemo = useMemo(() => filters.stoppedMoreThan && (
    <FilteredSegments
      positions={rawPositions}
      isValidPosition={(current, previous) => current.attributes.ignition === false}
      isValidSegment={(segment) => {
        const duration = dayjs(segment[segment.length - 1].fixTime).diff(dayjs(segment[0].fixTime), 'second') / 60;
        return duration >= filters.stoppedMoreThan;
      }}
      renderType={filterRenderType.stoppedMoreThan}
      color={FilterMarkingColors.stoppedMoreThan}
      highlightSegmentIndex={selectedSegment && selectedSegment?.filterType === 'stoppage' ? selectedSegment.options.segmentIndex : null}
      onClick={(segment, index) => updateSegmentSelection(segment, 'stoppage', { segmentIndex: index })}
    />
  ), [filters.stoppedMoreThan, selectedSegment]);

  const filterIdleMoreThanMemo = useMemo(() => filters.idleMoreThan && (
    <FilteredSegments
      positions={rawPositions}
      isValidPosition={(current, previous) => current.attributes.activity === 'idle'}
      isValidSegment={(segment) => {
        const duration = dayjs(segment[segment.length - 1].fixTime).diff(dayjs(segment[0].fixTime), 'second') / 60;
        return duration >= filters.idleMoreThan;
      }}
      renderType={filterRenderType.idleMoreThan}
      color={FilterMarkingColors.idleMoreThan}
      highlightSegmentIndex={selectedSegment && selectedSegment?.filterType === 'idle' ? selectedSegment.options.segmentIndex : null}
      onClick={(segment, index) => updateSegmentSelection(segment, 'idle', { segmentIndex: index })}
    />
  ), [filters.idleMoreThan, selectedSegment]);

  const filterSpeedMoreThanFilterMemo = useMemo(() => filters.speedMoreThan && (
    <FilteredSegments
      positions={rawPositions}
      isValidPosition={(current, previous) => current.speed > filters.speedMoreThan}
      isValidSegment={(segment) => segment.length > 0}
      renderType={filterRenderType.speedMoreThan}
      color={FilterMarkingColors.speedMoreThan}
      highlightSegmentIndex={selectedSegment && selectedSegment?.filterType === 'speed' ? selectedSegment.options.segmentIndex : null}
      onClick={(segment, index) => updateSegmentSelection(segment, 'speed', { segmentIndex: index })}
    />
  ), [filters.speedMoreThan, selectedSegment]);

  const filterInactiveMemo = useMemo(() => filters.inactivity && (
    <FilteredSegments
      positions={rawPositions}
      isValidPosition={(current, previous) => {
        if (!previous) return false;
        const timeDifference = dayjs(current.fixTime).diff(dayjs(previous.fixTime), 'second') / 60;
        return timeDifference > 1;
      }}
      isValidSegment={(segment) => segment.length > 0}
      renderType={filterRenderType.inactivity}
      color={FilterMarkingColors.inactivity}
      highlightSegmentIndex={selectedSegment && selectedSegment?.filterType === 'inactive' ? selectedSegment.options.segmentIndex : null}
      onClick={(segment) => updateSegmentSelection(segment, 'inactive')}
    />
  ), [filters.inactivity, selectedSegment]);

  const segmentSelectionCardMemo = useMemo(() => {
    if (selectedSegment) {
      const start = selectedSegment.segment[0];
      const end = selectedSegment.segment[selectedSegment.segment.length - 1];
      const startTime = new Date(start.fixTime);
      const endTime = new Date(end.fixTime);
      const duration = TimeDiffInHumanReadableFormat(start.fixTime, end.fixTime);
      const address = start.address

      return <PlaybackSegmentCard
        deviceName={devices[selectedDeviceId].name}
        startTime={startTime}
        endTime={endTime}
        duration={duration}
        location={address}
        segmentOf={selectedSegment.filterType}
        coords={{ longitude: start.longitude, latitude: start.latitude }}
        onClose={() => setSelectedSegment(null)}
      />
    }

  }, [selectedSegment])

  return (
    <div className={classes.root}>
      {loading && <ActivityLoader />}
      <MapView>
        <MapGeofence />
        {index < positions.length && (
          <>
            <MapRoutePoints positions={positions} onClick={onPointClick} color={ReportColor} />
            <MapRoutePath selectedSegment={selectedSegment} positions={positions} index={index} color={ReportColor} />
            {stoppageMarkersMemo}
            {filterStopMoreThanMemo}
            {filterIdleMoreThanMemo}
            {filterSpeedMoreThanFilterMemo}
            {filterInactiveMemo}
            <MapPositions positions={animatedPositions ? [animatedPositions] : [positions[index]]} onClick={onMarkerClick} showStatus titleField="" />
            <MapAutoCenter position={animatedPositions || positions[index]} enabled={true} />
          </>
        )}
      </MapView>
      <MapScale />
      <MapCamera positions={positions} />
      <div className={classes.sidebar}>
        <Paper elevation={3} square>
          <Toolbar>
            <IconButton edge="start" sx={{ mr: 2 }} onClick={() => navigateBack()}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>{t('reportReplay')}</Typography>
            {!expanded && (
              <>
                {/* <IconButton onClick={handleDownload}>
                  <DownloadIcon />
                </IconButton> */}
                {positions
                  && (
                    <Box sx={{ background: theme.palette.background.default, padding: 1 }}>
                      <Typography fontSize="1.1rem" lineHeight={1} textAlign="center" fontWeight={700}>{formatDistance(calculateDistanceFromCoords(positions), distanceUnit, t)}</Typography>
                      <Typography fontSize="0.6rem" lineHeight={1} textAlign="center">{t('deviceTotalDistance')}</Typography>
                    </Box>
                  )}
                <IconButton onClick={openFilterMenu}>
                  <Badge color="info" variant="dot" fontSize="small" invisible={Object.values(filters).every((f) => f === null)}>
                    <FilterAlt fontSize="small" />
                  </Badge>
                </IconButton>
                <PlaybackFilters
                  filterAnchor={filterAnchor}
                  filterMenuExpanded={filterMenuExpanded}
                  closeFilterMenu={closeFilterMenu}
                  filters={filters}
                  setFilters={setFilters}
                />
              </>
            )}
            <IconButton edge="end" onClick={() => setExpanded(!expanded)}>
              <CalendarTodayIcon fontSize="small" />
            </IconButton>
          </Toolbar>
        </Paper>
        {(expanded && !loading) && <Paper className={classes.content} square><ReportFilter handleSubmit={handleSubmit} fullScreen showOnly loading={loading} /></Paper>}
        <Paper elevation={3} square sx={{ marginTop: 1 }}>
          {segmentSelectionCardMemo}
        </Paper>
      </div>
      {(showCard && positions.length > 0 && summary) && (
        <DeviceReplayStatusCard
          deviceId={selectedDeviceId}
          positions={positions}

          index={index}
          playing={playing}
          setPlaying={setPlaying}
          setIndex={setIndex}
          closeIcon={statusCardMinimized ? <ExpandLess /> : <ExpandMore />}
          minimize={statusCardMinimized}
          multiplier={multiplier}
          setMultiplier={setMultiplier}

          onClose={() => setStatusCardMinimized(!statusCardMinimized)}
          disableActions
          summary={summary}
        />
      )}
    </div>
  );
};

export default ReplayPage;
