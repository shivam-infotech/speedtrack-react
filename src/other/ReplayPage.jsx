import React, {
  useState, useEffect, useRef, useCallback,
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
  Badge
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import { formatTime } from '../common/util/formatter';
import ReportFilter from '../reports/components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatch } from '../reactHelper';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import StatusCard from '../common/components/StatusCard';
import MapScale from '../map/MapScale';
import { calculateDistance, calculateDistanceFromCoords, decimateCoordinates } from '../common/util/position';
import { ExpandLess, ExpandMore, FilterAlt } from '@mui/icons-material';
import MapStoppages from '../map/MapStoppages';
import FilteredPolylines from './FilteredSegments';
import FilteredSegments from './FilteredSegments';
import dayjs from 'dayjs';
import DeviceReplayStatusCard from '../common/components/DeviceReplayStatusCard';
import { useAttributePreference } from '../common/util/preferences';
import { green } from '@mui/material/colors';

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

const Indicator = ({ color }) => (
  <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: color, borderRadius: '50%', margin: '0 5px' }}></span>
)

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
  const [statusCardMinimized, setStatusCardMinimized] = useState(false);

  const [multiplierAnchor, setMultiplierAnchor] = useState(null);
  const multiplierMenuExpanded = Boolean(multiplierAnchor);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const filterMenuExpanded = Boolean(filterAnchor);
  const [filters, setFilters] = useState({
    stoppedMoreThan: null,
    idleMoreThan: null,
    speedMoreThan: null,
    inactivity: null
  });
  const filterRenderType = {
    stoppedMoreThan: 'marker',
    idleMoreThan: 'marker',
    speedMoreThan: 'line',
    inactivity: 'marker',
  }

  const ReportColor = useAttributePreference('web.reportColor', green[500]);

  const openMultiplierMenu = (event) => {
    setMultiplierAnchor(event.currentTarget);
  }

  const closeMultiplierMenu = () => {
    setMultiplierAnchor(null);
  }

  const openFilterMenu = (event) => {
    setFilterAnchor(event.currentTarget);
  }

  const closeFilterMenu = () => {
    setFilterAnchor(null);
  }

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
      }, 1000 / multiplier);
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

  const onPointClick = useCallback((_, index) => {
    setIndex(index);
  }, [setIndex]);

  const onMarkerClick = useCallback((positionId, deviceId) => {
    console.log(deviceId);
    setShowCard(!!positionId);
  }, [setShowCard]);

  const findStoppages = (positions) => {
    // check if the ignition is off then push it into stopages
    let currentStoppage = [];
    let startPosition = positions[0];
    let endPosition = positions[positions.length - 1];
    
    const stoppages = [];
    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      if(calculateDistance(startPosition.latitude, startPosition.longitude, position.latitude, position.longitude) < 10 && calculateDistance(position.latitude, position.longitude, endPosition.latitude, endPosition.longitude) < 10) continue;
      if (position.attributes.ignition === false) { currentStoppage.push(position); }
      else if(position.attributes.ignition === true && currentStoppage.length > 1){
        stoppages.push(currentStoppage);
        currentStoppage = [];
      }
    }
    if(currentStoppage.length > 0) {
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
      if (response.ok) {
        setIndex(0);
        const rawPosition = await response.json();
        const positions = decimateCoordinates(rawPosition, 10);
        setRawPositions(rawPosition);
        setPositions(positions);
        if (positions.length) {
          setExpanded(false);
          setShowCard(true);
          // setStoppages(findStoppages(rawPosition));
          setSummary(await fetchSummary(deviceId, from, to));
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
    if (rawPositions.length > 0) {
      setStoppages(findStoppages(rawPositions));
    }
  }, [rawPositions]); // Update stoppages whenever rawPositions changes

  const handleDownload = () => {
    const query = new URLSearchParams({ deviceId: selectedDeviceId, from, to });
    window.location.assign(`/api/positions/kml?${query.toString()}`);
  };

  return (
    <div className={classes.root}>
      <MapView>
        <MapGeofence />
        {index < positions.length && (
          <>
            <MapRoutePath positions={positions} color={ReportColor} />
            <MapRoutePoints positions={positions} onClick={onPointClick} color={ReportColor} />
            <MapPositions positions={[positions[index]]} onClick={onMarkerClick} showStatus titleField="" animationDuration={1000 / multiplier - 100} />
            {(stoppages && !(filters.stoppedMoreThan || filters.idleMoreThan || filters.speedMoreThan || filters.inactivity)) && 
              <MapStoppages positions={stoppages} startPosition={positions[0]} endPosition={positions[positions.length - 1]} device={devices[selectedDeviceId]} />
            }
            { filters.stoppedMoreThan &&  <FilteredSegments
                positions={rawPositions}
                isValidPosition={(current, previous) => current.attributes.ignition === false}
                isValidSegment={(segment) => {
                  const duration = dayjs(segment[segment.length - 1].fixTime).diff(dayjs(segment[0].fixTime), 'second') / 60;
                  return duration >= filters.stoppedMoreThan;
                }}
                renderType="marker"
                color="#e33124"
                activityType="Stoppage"
                device={devices[selectedDeviceId]}
              /> }
            { filters.idleMoreThan && <FilteredSegments
              positions={rawPositions}
              isValidPosition={(current, previous) => 
                current.attributes.activity === 'idle'
              }
              isValidSegment={(segment) => {
                const duration = dayjs(segment[segment.length - 1].fixTime).diff(dayjs(segment[0].fixTime), 'second') / 60;
                return duration >= filters.idleMoreThan;
              }}
              activityType="Idle"
              renderType="marker"
              color="#FFC107"
              device={devices[selectedDeviceId]}
            /> }
            { filters.speedMoreThan && <FilteredSegments
                positions={rawPositions}
                isValidPosition={(current, previous) => current.speed > filters.speedMoreThan}
                isValidSegment={(segment) => segment.length > 0}
                renderType="line"
                color="#c70fff"
                activityType="Speed"
                device={devices[selectedDeviceId]}
              /> }
            { filters.inactivity && <FilteredSegments
              positions={rawPositions}
              isValidPosition={(current, previous) => {
                if (!previous) return false;
                const timeDifference = dayjs(current.fixTime).diff(dayjs(previous.fixTime), 'second') / 60;
                return timeDifference > 1;
              }}
              isValidSegment={(segment) => segment.length > 0}
              renderType="marker"
              color="#2950ff"
              activityType="Inactivity"
              device={devices[selectedDeviceId]}
            /> }
          </>
        )}
      </MapView>
      <MapScale />
      <MapCamera positions={positions} />
      <div className={classes.sidebar}>
        <Paper elevation={3} square>
          <Toolbar>
            <IconButton edge="start" sx={{ mr: 2 }} onClick={() => navigate(-1)}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" className={classes.title}>{t('reportReplay')}</Typography>
            {!expanded && (
              <>
                {/* <IconButton onClick={handleDownload}>
                  <DownloadIcon />
                </IconButton> */}
                <div>
                  <IconButton aria-haspopup="true" aria-controls='multiplier-menu' aria-expanded={multiplierMenuExpanded} size='small' onClick={openMultiplierMenu} >{multiplier}x</IconButton>
                  <Menu
                      id="multiplier-menu"
                      anchorEl={multiplierAnchor}
                      open={multiplierMenuExpanded}
                      onClose={closeMultiplierMenu}
                      MenuListProps={{
                          'aria-labelledby': 'multiplier-button',
                      }}
                  >
                      <MenuItem onClick={() => { setMultiplier(1); closeMultiplierMenu() }}>1x</MenuItem>
                      <MenuItem onClick={() => { setMultiplier(2); closeMultiplierMenu() }}>2x</MenuItem>
                      <MenuItem onClick={() => { setMultiplier(3); closeMultiplierMenu() }}>3x</MenuItem>
                      <MenuItem onClick={() => { setMultiplier(4); closeMultiplierMenu() }}>4x</MenuItem>
                      <MenuItem onClick={() => { setMultiplier(5); closeMultiplierMenu() }}>5x</MenuItem>
                      <MenuItem onClick={() => { setMultiplier(6); closeMultiplierMenu() }}>6x</MenuItem>
                  </Menu>
              </div>
              <IconButton onClick={openFilterMenu} >
                  <Badge color="info" variant="dot" fontSize="small" invisible={Object.values(filters).every(f => f === null)}>
                      <FilterAlt fontSize='small' />
                  </Badge>
              </IconButton>
              <Menu
                  id="filter-menu"
                  anchorEl={filterAnchor}
                  open={filterMenuExpanded}
                  onClose={closeFilterMenu}
                  MenuListProps={{
                      'aria-labelledby': 'filter-button',
                  }}
              >
                  <MenuItem>
                      <label style={{ flex: 1 }}>
                          <Checkbox
                              checked={filters.stoppedMoreThan !== null}
                              onChange={(e) => setFilters({ ...filters, stoppedMoreThan: e.target.checked ? 1 : null })}
                          />
                          Stopped more than
                          <Indicator color="#e33124" />
                      </label>
                      <Select
                          size='small'
                          value={filters.stoppedMoreThan || ''}
                          onChange={(e) => setFilters({ ...filters, stoppedMoreThan: e.target.value })}
                          disabled={filters.stoppedMoreThan === null}
                          sx={{ ml: 1 }}
                      >
                          <MenuItem value={1}>1 min</MenuItem>
                          <MenuItem value={2}>2 min</MenuItem>
                          <MenuItem value={5}>5 min</MenuItem>
                          <MenuItem value={10}>10 min</MenuItem>
                          <MenuItem value={15}>15 min</MenuItem>
                          <MenuItem value={30}>30 min</MenuItem>
                      </Select>
                  </MenuItem>
                  <MenuItem>
                      <label style={{ flex: 1 }}>
                          <Checkbox
                              checked={filters.idleMoreThan !== null}
                              onChange={(e) => setFilters({ ...filters, idleMoreThan: e.target.checked ? 1 : null })}
                          />
                          Idle more than
                          <Indicator color="#FFC107" />
                      </label>
                      <Select
                          size='small'
                          value={filters.idleMoreThan || ''}
                          onChange={(e) => setFilters({ ...filters, idleMoreThan: e.target.value })}
                          disabled={filters.idleMoreThan === null}
                          sx={{ ml: 1 }}
                      >
                          <MenuItem value={1}>1 min</MenuItem>
                          <MenuItem value={2}>2 min</MenuItem>
                          <MenuItem value={5}>5 min</MenuItem>
                          <MenuItem value={10}>10 min</MenuItem>
                          <MenuItem value={15}>15 min</MenuItem>
                          <MenuItem value={30}>30 min</MenuItem>
                      </Select>
                  </MenuItem>
                  <MenuItem>
                      <label style={{ flex: 1 }}>
                          <Checkbox
                              checked={filters.speedMoreThan !== null}
                              onChange={(e) => setFilters({ ...filters, speedMoreThan: e.target.checked ? 0 : null })}
                          />
                          Speed more than
                          <Indicator color="#c70fff" />
                      </label>
                      <TextField
                          type="number"
                          value={filters.speedMoreThan || ''}
                          onChange={(e) => setFilters({ ...filters, speedMoreThan: e.target.value })}
                          disabled={filters.speedMoreThan === null}
                          sx={{ ml: 1, width: '100px' }}
                      />
                  </MenuItem>
                  <MenuItem>
                      <label>
                          <Checkbox
                              checked={filters.inactivity}
                              onChange={(e) => setFilters({ ...filters, inactivity: e.target.checked })}
                          />
                          Inactivity
                          <Indicator color="#2950ff" />
                      </label>
                  </MenuItem>
              </Menu>
              </>
            )}
            <IconButton edge="end" onClick={() => setExpanded(!expanded)}>
              <CalendarTodayIcon fontSize='small' />
            </IconButton>
          </Toolbar>
        </Paper>
          { expanded && <Paper className={classes.content} square><ReportFilter handleSubmit={handleSubmit} fullScreen showOnly loading={loading} /></Paper> }
      </div>
      {(showCard && positions.length > 0 && summary) &&(
        <>
          <DeviceReplayStatusCard
            deviceId={selectedDeviceId}
            positions={positions}

            index={index}
            playing={playing}
            setPlaying={setPlaying}
            setIndex={setIndex}
            closeIcon={statusCardMinimized ? <ExpandLess /> : <ExpandMore />}
            minimize={statusCardMinimized}

            onClose={() => setStatusCardMinimized(!statusCardMinimized)}
            disableActions
            summary={summary}
          />
        </>
      )}
    </div>
  );
};

export default ReplayPage;
