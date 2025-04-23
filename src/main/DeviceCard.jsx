import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import makeStyles from '@mui/styles/makeStyles';
import {
  IconButton, Tooltip, Avatar, ListItemAvatar, ListItemText, ListItemButton,
  useTheme, Typography, Box, Card, CardContent, Grid, Menu, MenuItem,
  Divider, Chip, Stack, Skeleton,
} from '@mui/material';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import BatteryCharging60Icon from '@mui/icons-material/BatteryCharging60';
import BatteryCharging20Icon from '@mui/icons-material/BatteryCharging20';
import ErrorIcon from '@mui/icons-material/Error';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import RouteIcon from '@mui/icons-material/Route';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { devicesActions } from '../store';
import {
  formatAlarm, formatBoolean, formatNumericHours, formatPercentage, formatSpeed, formatStatus, formatTime, getDeviceStatusColor, getStatusColor,
  TimeDiffInHumanReadableFormat,
} from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { mapIconKey, mapIcons, device3dIcons } from '../map/core/preloadImages';
import { useAdministrator, useDeviceReadonly } from '../common/util/permissions';
import EngineIcon from '../resources/images/data/engine.svg?react';
import { useAttributePreference } from '../common/util/preferences';
import AddressValue from '../common/components/AddressValue';
import { ReplayOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PositionValue from '../common/components/PositionValue';

import SensorsIcon from '@mui/icons-material/Sensors';
import SensorsOffIcon from '@mui/icons-material/SensorsOff';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import SignalCellularConnectedNoInternet0BarIcon from '@mui/icons-material/SignalCellularConnectedNoInternet0Bar';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useSpeech } from 'react-text-to-speech';
import redcar from '../resources/images/Red car.svg';

import { statusIcon, BatteryLevelIcon, GSMSignalIcon, ACIcon, SatelliteSignalIcon, ChargingIcon, ParkingIcon, FuelIcon, IgnitionIcon } from '../common/components/PostionalHelpers';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import useGlobalSpeech from '../common/util/useGlobalSpeech';
import PlaybackDurationDialog from '../common/components/PlaybackDurationDialog';

dayjs.extend(relativeTime);

const useStyles = makeStyles((theme) => ({
  card: {
    margin: theme.spacing(0.5),
    padding: theme.spacing(0.5),
    width: `calc(100% - ${theme.spacing(0.5)}) !important`,
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: theme.shadows[4],
    },
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  selectedCard: {
    backgroundColor: theme.palette.action.selected,
  },
  icon: {
    width: '20px',
    height: '20px',
    filter: 'brightness(0) invert(1)',
  },
  batteryText: {
    fontSize: '0.75rem',
    fontWeight: 'normal',
    lineHeight: '0.875rem',
    color: 'white'
  },
  success: {
    color: theme.palette.success.main,
  },
  warning: {
    color: theme.palette.warning.main,
  },
  error: {
    color: theme.palette.error.main,
  },
  neutral: {
    color: theme.palette.neutral.main,
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: theme.spacing(1),
    padding: theme.spacing(0.5),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.5),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.default,
  },
  statText: {
    flex: 1,
    minWidth: 0,
    '& .MuiTypography-caption': {
      display: 'block',
      fontSize: '0.65rem',
      lineHeight: 1,
      color: theme.palette.text.secondary,
    },
    '& .MuiTypography-body2': {
      fontSize: '0.75rem',
      lineHeight: 1.2,
      fontWeight: 500,
    },
  },
  statusChip: {
    height: '24px',
    '& .MuiChip-label': {
      padding: '0 6px',
    },
    '& .MuiChip-icon': {
      fontSize: '1rem',
      padding: '0 2px',
    },
  },
  menuButtonContainer: {
    position: 'absolute',
    right: theme.spacing(0.5),
    top: theme.spacing(0),
    display: 'flex',
    gap: 1
  },
  compactContent: {
    padding: `${theme.spacing(1)} !important`,
  },
  headerBox: {
    display: 'flex',
    gap: theme.spacing(1),
    position: 'relative',
    marginBottom: theme.spacing(1),
  },
  deviceInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    // gap: theme.spacing(0.25),
  },
  addressText: {
    maxWidth: '100%',
    display: 'block',
  },
  chipGroup: {
    display: 'flex',
    gap: theme.spacing(0.5),
    flexWrap: 'wrap',
    // marginTop: theme.spacing(1),
    // marginBottom: theme.spacing(1),
    padding: `${theme.spacing(0)} ${theme.spacing(1)} ${theme.spacing(0)} ${theme.spacing(0)}`
  },
  placeholder: {
    color: theme.palette.text.disabled,
  },
  statusIndicator: {
    position: 'absolute',
    top: 24,
    right: 8,
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    border: '1.5px solid white',
  },
  onlineStatus: {
    backgroundColor: '#36db27',
  },
  offlineStatus: {
    backgroundColor: '#b0b0b0',
  },
}));

const DeviceCard = ({ data, index, style, onClick }) => {
  const theme = useTheme();
  const classes = useStyles();
  const dispatch = useDispatch();
  const t = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const navigate = useNavigate();
  const deviceReadonly = useDeviceReadonly();
  const shareDisabled = useSelector((state) => state.session.server.attributes.disableShare);
  const user = useSelector((state) => state.session.user);
  const item = data[index];
  const position = useSelector((state) => state.session.positions[item.id]);
  const devicePrimary = useAttributePreference('devicePrimary', 'name');
  const deviceSecondary = useAttributePreference('deviceSecondary', '');
  const summary = useSelector((state) => state.summary.items[item.id]);
  const [playbackDurationOpen, setPlaybackDurationOpen] = useState(false);

  // const { start, stop, speechStatus } = useSpeech({ pitch: 1, rate: 0.8, volume: 1, lang: "hi-IN", voiceURI: "Google हिन्दी", autoPlay: false, text: position?.address || 'No Available address' });
  const start = useGlobalSpeech(position?.address || 'No Available address');

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuAction = (action) => {
    handleMenuClose();
    dispatch(devicesActions.selectId(item.id));
    switch (action) {
      case 'playback':
        navigate('/replay');
        break;
      case 'share':
        navigate(`/settings/device/${item.id}/share`)
        break;
      case 'command':
        navigate(`/settings/device/${item.id}/command`)
        break;
      case 'edit':
        navigate(`/settings/device/${item.id}`)
        break;
      default:
        break;
    }
  };

  const secondaryText = () => {
    let status;
    if (item.status === 'online' || !item.lastUpdate) {
      status = formatStatus(item.status, t);
    } else {
      status = dayjs(item.lastUpdate).fromNow();
    }
    return (
      <>
        {deviceSecondary && item[deviceSecondary] && `${item[deviceSecondary]} • `}
        <span className={classes[getStatusColor(item.status)]}>{status}</span>
      </>
    );
  };

  const formattedLastUpdate = () => {
    return position && position?.fixTime ? formatTime(position.fixTime, 'seconds') : '';
  };
  
  return (
    <>
    <Card
      className={`${classes.card} ${selectedDeviceId === item.id ? classes.selectedCard : ''}`}
      onClick={() => {
        dispatch(devicesActions.selectId(item.id));
        if (onClick) onClick();
      }}
      style={{ ...style }}
    >
      <CardContent className={classes.compactContent}>
        <Box className={classes.headerBox}>
          <ListItemAvatar sx={{ minWidth: 40, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
               <img src={device3dIcons.car[position ? getDeviceStatusColor(position) : 'neutral']} width={"56px"} />
          </ListItemAvatar>

          <Box className={classes.deviceInfo}>
            <Typography variant="body1" noWrap color={theme.palette.primary.main} fontWeight={800}>
              {item[devicePrimary] || <Skeleton variant="text" width={120} />}
            </Typography>
            <Typography variant="caption"
              color="textSecondary" className={classes.addressText}>
              {formattedLastUpdate() || 'N/A'}
            </Typography>
            <Box>
            <Tooltip title={position ? (`${t('positionIgnition')}: ${formatBoolean(position.attributes.ignition, t)}`) : t('deviceStatusOffline')}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                {statusIcon(position?.attributes?.activity, position ? (getDeviceStatusColor(position)) : 'default', '0.6rem')}
                <Typography align='center' fontSize={"0.75rem"} sx={{ marginLeft: 0.5 }} color={position ? (getDeviceStatusColor(position)) : 'default'} >{position ? (position?.attributes?.activity ? (t(`deviceStatus${position?.attributes?.activity.ucfirst()}`) + " since " + formatNumericHours(position.attributes.activityDurationHours, t)) : t('deviceStatusStopped')) : t('deviceStatusOffline')}</Typography>
              </Box>
              {/* <Chip
                size="small"
                icon={statusIcon(position?.attributes?.activity)}
                label={
                  position ? (position?.attributes?.activity ? (t(`deviceStatus${position?.attributes?.activity.ucfirst()}`) + " " + formatNumericHours(position.attributes.activityDurationHours, t)) : t('deviceStatusStopped')) : t('deviceStatusOffline')
                }
                className={classes.statusChip}
                color={position ? (getDeviceStatusColor(position)) : 'default'}
              /> */}
            </Tooltip>
            </Box>
          </Box>

          <Box className={classes.menuButtonContainer}>
            
            <IconButton
              onClick={handleMenuOpen}
              size="small"
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={(e) => {
              e.stopPropagation();
              // handleMenuAction('playback');
              setPlaybackDurationOpen(true);
            }} disabled={!position}>
              <PlayArrowIcon sx={{ mr: 1 }} /> {t('reportReplay')}
            </MenuItem>
            <MenuItem onClick={(e) => {
              e.stopPropagation();
              handleMenuAction('share');
            }} disabled={shareDisabled || user.temporary}>
              <ShareIcon sx={{ mr: 1 }} /> {t('deviceShare')}
            </MenuItem>
            <MenuItem onClick={(e) => {
              e.stopPropagation();
              handleMenuAction('command');
            }}>
              <SendIcon sx={{ mr: 1 }} /> {t('positionCommand')}
            </MenuItem>
            <MenuItem onClick={(e) => {
              e.stopPropagation();
              handleMenuAction('edit');
            }} disabled={deviceReadonly}>
              <EditIcon sx={{ mr: 1 }} /> {t('sharedEdit')}
            </MenuItem>
          </Menu>
        </Box>
        <Box className={classes.chipGroup}>
          {/* <Chip 
            size="small"
            icon={<AccessTimeIcon />}
            label={}
            className={classes.statusChip}
          /> */}
          <Box sx={{ flex: 1 }}>
            
          </Box>
        </Box>
        <div className={classes.statsContainer}>
          <div className={classes.statItem}>
              <SpeedIcon color="primary" fontSize="small" />
              <div className={classes.statText}>
                <Typography variant="caption" color="textSecondary" >Speed</Typography>
                <Typography variant="body1" noWrap fontWeight={600} >
                  {position ? <PositionValue position={position} property={'speed'} /> : '0 km/h'}
                </Typography>
              </div>
            </div>
          <div className={classes.statItem}>
            <RouteIcon color="primary" fontSize="small" />
            <div className={classes.statText}>
              <Typography variant="caption" color="textSecondary" >Distance</Typography>
              <Typography variant="body1" noWrap fontWeight={600} >
                {summary ? <PositionValue position={summary} property={'distance'} /> : '0 km'}
              </Typography>
            </div>
          </div>

          {/* <div className={classes.statItem}>
            <TimerIcon color="success" fontSize="small" />
            <div className={classes.statText}>
              <Typography variant="caption">Running</Typography>
              <Typography variant="body2" noWrap>
                {summary ? <PositionValue position={summary} property={'runningHours'} /> : '0s'}
              </Typography>
            </div>
          </div>

          <div className={classes.statItem}>
            <TimerIcon color="warning" fontSize="small" />
            <div className={classes.statText}>
              <Typography variant="caption">Idle</Typography>
              <Typography variant="body2" noWrap>
                {summary ? <PositionValue position={summary} property={'idleHours'} /> : '0s'}
              </Typography>
            </div>
          </div>

          <div className={classes.statItem}>
            <TimerIcon color="error" fontSize="small" />
            <div className={classes.statText}>
              <Typography variant="caption">Stopped</Typography>
              <Typography variant="body2" noWrap>
                {summary ? <PositionValue position={summary} property={'stoppedHours'} /> : '0s'}
              </Typography>
            </div>
          </div> */}

          {/* <div className={classes.statItem}>
            <LocalGasStationIcon color="primary" fontSize="small" />
            <div className={classes.statText}>
              <Typography variant="caption">Fuel</Typography>
              <Typography variant="body2" noWrap>
                {summary?.spentFuel ? `${summary.spentFuel.toFixed(1)} L` : '0 L'}
              </Typography>
            </div>
          </div> */}
        </div>
        <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
          <Typography
            variant="subtitle1"
            className={classes.addressText}
            noWrap
            sx={{ flex: 1 }}
          >
            {position ? (
              <AddressValue
                latitude={position.latitude}
                longitude={position.longitude}
                originalAddress={position.address}
              />
            ) : (
              <span className={classes.placeholder}>No position data available</span>
            )}
          </Typography>
          <IconButton size='small' onClick={(e) => {e.stopPropagation(); start()}}>
            <VolumeUpIcon />
          </IconButton>
        </Box>
        <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            overflowX: 'scroll', 
            gap: 2,
            "&::-webkit-scrollbar": {
              display: 'none'
            }
          }}>
          {IgnitionIcon(position?.attributes?.ignition || undefined)}
          {ChargingIcon(position?.attributes?.charge || undefined)}
          {/* <ElectricalServicesIcon fontSize='small' color={position?.attributes?.charge ? 'success' : 'error'} /> */}
          {BatteryLevelIcon(position?.attributes?.batteryLevel)}
          {GSMSignalIcon(position?.attributes?.rssi || 0)}
          {SatelliteSignalIcon(position?.attributes?.sat || 0)}
          <LockOpenIcon fontSize='small' color='success' />
          {ParkingIcon(position)}
          {/* <LocalParkingIcon fontSize='small' color='error' /> */}
          {ACIcon(position?.attributes?.ac || 0)}
          <DeviceThermostatIcon fontSize='small' color='neutral' />
          {FuelIcon(position?.attributes?.fuel || undefined)}
        </Box>
      </CardContent>
    </Card>
    <PlaybackDurationDialog deviceId={item.id} onClose={() => setPlaybackDurationOpen(false)} open={playbackDurationOpen} />
    </>
  );
};

export default DeviceCard;
