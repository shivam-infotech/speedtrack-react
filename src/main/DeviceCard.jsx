import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import makeStyles from '@mui/styles/makeStyles';
import {
  IconButton, Tooltip, Avatar, ListItemAvatar, ListItemText, ListItemButton,
  useTheme, Typography, Box, Card, CardContent, Grid, Menu, MenuItem,
  Divider, Chip, Stack, Skeleton,
} from '@mui/material';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import Battery60Icon from '@mui/icons-material/Battery60';
import BatteryCharging60Icon from '@mui/icons-material/BatteryCharging60';
import Battery20Icon from '@mui/icons-material/Battery20';
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
  formatAlarm, formatBoolean, formatPercentage, formatSpeed, formatStatus, getDeviceStatusColor, getStatusColor,
  TimeDiffInHumanReadableFormat,
} from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
import { useAdministrator, useDeviceReadonly } from '../common/util/permissions';
import EngineIcon from '../resources/images/data/engine.svg?react';
import { useAttributePreference } from '../common/util/preferences';
import AddressValue from '../common/components/AddressValue';
import { ReplayOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import PositionValue from '../common/components/PositionValue';

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
  menuButton: {
    padding: 4,
    position: 'absolute',
    right: theme.spacing(0.5),
    top: theme.spacing(0),
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
    gap: theme.spacing(0.25),
  },
  addressText: {
    maxWidth: '100%',
    display: 'block',
  },
  chipGroup: {
    display: 'flex',
    gap: theme.spacing(0.5),
    flexWrap: 'wrap',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    padding: `${theme.spacing(0)} ${theme.spacing(1)}`
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

const DeviceCard = ({ data, index, style }) => {
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

  const handleMenuOpen = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuAction = (action) => {
    handleMenuClose();
    switch (action) {
      case 'playback':
        navigate('/replay');
        break;
      case 'follow':
        // Implement follow action
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
    if (item.lastUpdate) {
      return TimeDiffInHumanReadableFormat(item.lastUpdate);
    }
    return '';
  };

  return (
    <Card 
      className={`${classes.card} ${selectedDeviceId === item.id ? classes.selectedCard : ''}`}
      onClick={() => dispatch(devicesActions.selectId(item.id))}
      style={{...style}}
    >
      <CardContent className={classes.compactContent}>
        <Box className={classes.headerBox}>
          <ListItemAvatar sx={{ minWidth: 40, position: 'relative' }}>
            <Avatar 
              sx={{ 
                backgroundColor: position ? (theme.palette[getDeviceStatusColor(position)]?.main || theme.palette.error?.main) : theme.palette.grey[300],
                position: 'relative',
                width: 32,
                height: 32,
              }}
            >
              <img className={classes.icon} src={mapIcons[mapIconKey(item.category)]} alt="" />
            </Avatar>
            <div 
              className={`${classes.statusIndicator} ${item.status === 'online' ? classes.onlineStatus : classes.offlineStatus}`}
            />
          </ListItemAvatar>

          <Box className={classes.deviceInfo}>
            <Typography variant="body2" noWrap>
              {item[devicePrimary] || <Skeleton variant="text" width={120} />}
            </Typography>
            <Typography 
              variant="caption" 
              color="textSecondary" 
              className={classes.addressText}
              noWrap
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
          </Box>

          <IconButton 
            className={classes.menuButton}
            onClick={handleMenuOpen}
            size="small"
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={() => handleMenuAction('playback')} disabled={!position}>
              <PlayArrowIcon sx={{ mr: 1 }} /> {t('reportReplay')}
            </MenuItem>
            <MenuItem onClick={() => handleMenuAction('follow')} disabled={!position}>
              <MyLocationIcon sx={{ mr: 1 }} /> {t('deviceFollow')}
            </MenuItem>
            <MenuItem onClick={() => handleMenuAction('share')} disabled={shareDisabled || user.temporary}>
              <ShareIcon sx={{ mr: 1 }} /> {t('deviceShare')}
            </MenuItem>
            <MenuItem onClick={() => handleMenuAction('command')}>
              <SendIcon sx={{ mr: 1 }} /> {t('positionCommand')}
            </MenuItem>
            <MenuItem onClick={() => handleMenuAction('edit')} disabled={deviceReadonly}>
              <EditIcon sx={{ mr: 1 }} /> {t('sharedEdit')}
            </MenuItem>
          </Menu>
        </Box>

        <Box className={classes.chipGroup}>
          <Chip 
            size="small"
            icon={<AccessTimeIcon />}
            label={formattedLastUpdate() || 'N/A'}
            className={classes.statusChip}
          />
          <Chip
            size="small"
            icon={<BatteryFullIcon />}
            label={position?.attributes?.batteryLevel ? `${formatPercentage(position.attributes.batteryLevel)}` : 'N/A'}
            className={classes.statusChip}
            color={position?.attributes?.batteryLevel ? (position.attributes.batteryLevel > 70 ? "success" : position.attributes.batteryLevel > 30 ? "warning" : "error") : "default"}
          />
          <Tooltip title={position ? (`${t('positionIgnition')}: ${formatBoolean(position.attributes.ignition, t)}`) : t('deviceStatusOffline')}>
            <Chip
              size="small"
              icon={<EngineIcon width={16} height={16} />}
              label={
                position ? (position?.attributes?.ignition ? (position?.speed > 5 ? t('deviceStatusRunning') : t('deviceStatusIdle')) : t('deviceStatusStopped')) : t('deviceStatusOffline')
              }
              className={classes.statusChip}
              color={position ? (position?.attributes?.ignition ? (position?.speed > 5 ? "success" : "warning") : "error") : 'default'}
            />
          </Tooltip>
        </Box>

        <div className={classes.statsContainer}>
          <div className={classes.statItem}>
            <SpeedIcon color="primary" fontSize="small" />
            <div className={classes.statText}>
              <Typography variant="caption">Speed</Typography>
              <Typography variant="body2" noWrap>
                {position ? <PositionValue position={position} property={'speed'} attribute={null} /> : '0 km/h'}
              </Typography>
            </div>
          </div>

          <div className={classes.statItem}>
            <RouteIcon color="primary" fontSize="small" />
            <div className={classes.statText}>
              <Typography variant="caption">Distance</Typography>
              <Typography variant="body2" noWrap>
                {position ? <PositionValue position={position} property={null} attribute={'distance'} /> : '0 km'}
              </Typography>
            </div>
          </div>

          <div className={classes.statItem}>
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
          </div>

          <div className={classes.statItem}>
            <LocalGasStationIcon color="primary" fontSize="small" />
            <div className={classes.statText}>
              <Typography variant="caption">Fuel</Typography>
              <Typography variant="body2" noWrap>
                {summary?.spentFuel ? `${summary.spentFuel.toFixed(1)} L` : '0 L'}
              </Typography>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceCard;
