import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Draggable from 'react-draggable';
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Menu,
  MenuItem,
  CardMedia,
  Tooltip,
  Box,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import PublishIcon from '@mui/icons-material/Publish';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoIcon from '@mui/icons-material/Info';
import { useTranslation } from './LocalizationProvider';
import RemoveDialog from './RemoveDialog';
import PositionValue from './PositionValue';
import { useDeviceReadonly } from '../util/permissions';
import usePositionAttributes from '../attributes/usePositionAttributes';
import { devicesActions } from '../../store';
import { useCatch, useCatchCallback } from '../../reactHelper';
import { useAttributePreference } from '../util/preferences';
import useSummaryAttributes from '../attributes/useSummaryAttributes';

const useStyles = makeStyles((theme) => ({
  card: {
    pointerEvents: 'auto',
    width: theme.dimensions.popupMaxWidth,
    [theme.breakpoints.down('md')]: {
      width: "100vw", 
      padding: theme.spacing(1),
    },
  },
  media: {
    height: theme.dimensions.popupImageHeight,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  mediaButton: {
    color: theme.palette.primary.contrastText,
    mixBlendMode: 'difference',
  },
  content: {
    paddingTop: 0,
    paddingBottom: "0px !important",
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(1),
    },
    maxHeight: theme.dimensions.cardContentMaxHeight,
    overflow: 'auto',
  },
  icon: {
    width: '25px',
    height: '25px',
    filter: 'brightness(0) invert(1)',
  },
  table: {
    '& .MuiTableCell-sizeSmall': {
      paddingLeft: 0,
      paddingRight: 0,
    },
    '& .MuiTableCell-sizeSmall:first-child': {
      paddingRight: theme.spacing(1),
    },
  },
  cell: {
    display: 'flex',
    flexDirection: 'column',
    mb: 1,
    [theme.breakpoints.up('md')]: {
      width: "33%",
      justifyContent: 'center',
      alignItems: 'center',
    },
    [theme.breakpoints.down('md')]: {
      width: "30%",
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    }
  },
  cellHeader: {
    fontSize: '0.25rem'
  },
  cellValue: {
    fontSize: '0.25rem',
    fontWeight: 600,
  },
  actions: {
    justifyContent: 'space-between',
    padding: theme.spacing(0.5, 1),
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(0.5, 1, 0, 2),
    marginBottom: theme.spacing(1),
  },
  root: ({ desktopPadding }) => ({
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: 5,
    right: '0',
    [theme.breakpoints.up('md')]: {
      left: `calc(50% + ${desktopPadding} / 2)`,
      bottom: theme.spacing(3),
    },
    [theme.breakpoints.down('md')]: {
      left: '50%',
      bottom: `calc(${theme.spacing(3)} + ${theme.dimensions.bottomBarHeight}px)`,
    },
    [theme.breakpoints.down('sm')]: {
      left: '50%',
      width: "100%",
      bottom: `calc(${theme.spacing(1)} + ${theme.dimensions.bottomBarHeight}px)`
    },
    transform: 'translateX(-50%)',
  }),
  floatingInfo: {
    position: 'absolute',
    bottom: theme.spacing(5),
    right: theme.spacing(2),
    overflow: 'hidden',
    [theme.breakpoints.down('sm')]: {
      bottom: theme.spacing(1),
      right: theme.spacing(1),
    }
  },
}));

const StatusRow = ({ name, content, fullColumn = false }) => {
  const classes = useStyles();

  return (
    <Box
      className={classes.cell}
      sx={{
        ...(fullColumn ? { flex: 1 } : {}),
      }}
    >
      <Typography fontSize={"0.75rem"} color="textSecondary">
        {name}
      </Typography>
      <Typography fontSize={"0.75rem"} fontWeight={600}>
        {content}
      </Typography>
    </Box>
  );
};

const StatusCard = ({ deviceId, position, onClose, disableActions, desktopPadding = 0, summary = undefined }) => {
  const keepInFullSpaceColumns = ['address'];
  const classes = useStyles({ desktopPadding });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();
  const deviceReadonly = useDeviceReadonly();

  const shareDisabled = useSelector((state) => state.session.server.attributes.disableShare);
  const user = useSelector((state) => state.session.user);
  const device = useSelector((state) => state.devices.items[deviceId]);

  const deviceImage = device?.attributes?.deviceImage;

  const positionAttributes = usePositionAttributes(t);
  const summaryAttributes = useSummaryAttributes(t);
  const positionItems = useAttributePreference('positionItems', 'fixTime,speed,totalDistance,address');
  const SummaryFields = useAttributePreference('popupSummaryInfo');
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const navigationAppLink = useAttributePreference('navigationAppLink');
  const navigationAppTitle = useAttributePreference('navigationAppTitle');

  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileActionMenuEl, setMobileActionMenuEL] = useState(null);
  const [removing, setRemoving] = useState(false);


  const handleRemove = useCatch(async (removed) => {
    if (removed) {
      const response = await fetch('/api/devices');
      if (response.ok) {
        dispatch(devicesActions.refresh(await response.json()));
      } else {
        throw Error(await response.text());
      }
    }
    setRemoving(false);
  });

  const handleGeofence = useCatchCallback(async () => {
    const newItem = {
      name: t('sharedGeofence'),
      area: `CIRCLE (${position.latitude} ${position.longitude}, 50)`,
    };
    const response = await fetch('/api/geofences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    if (response.ok) {
      const item = await response.json();
      const permissionResponse = await fetch('/api/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: position.deviceId, geofenceId: item.id }),
      });
      if (!permissionResponse.ok) {
        throw Error(await permissionResponse.text());
      }
      navigate(`/settings/geofence/${item.id}`);
    } else {
      throw Error(await response.text());
    }
  }, [navigate, position]);

  let card = (<Card elevation={3} className={classes.card}>
    {deviceImage ? (
      <CardMedia
        className={classes.media}
        image={`/api/media/${device.uniqueId}/${deviceImage}`}
      >
        <IconButton
          size="small"
          onClick={onClose}
          onTouchStart={onClose}
        >
          <CloseIcon fontSize="small" className={classes.mediaButton} />
        </IconButton>
      </CardMedia>
    ) : (
      <div className={[classes.header]}>
        <Typography variant="body2" color="textSecondary" style={{ flex: 1 }}>
          {device?.name}
        </Typography>
        { isMobile && (
          <>
            <IconButton size="small" onClick={e => setMobileActionMenuEL(e.currentTarget)} >
              <MoreVertIcon fontSize='small' />
            </IconButton>
            <Menu anchorEl={mobileActionMenuEl} open={Boolean(mobileActionMenuEl)} onClose={() => setMobileActionMenuEL(null)}>
              <MenuItem onClick={() => navigate('/replay')} disabled={disableActions || !position} >{t('reportReplay')}</MenuItem>
              <MenuItem onClick={() => navigate(`/settings/device/${deviceId}/command`)} disabled={disableActions} >{t('commandTitle')}</MenuItem>
              <MenuItem onClick={() => navigate(`/settings/device/${deviceId}`)} disabled={disableActions || deviceReadonly} >{t('sharedEdit')}</MenuItem>
              <MenuItem onClick={() => setRemoving(true)} disabled={disableActions || deviceReadonly} >{t('sharedRemove')}</MenuItem>
            {position && (
              <>
                <MenuItem onClick={handleGeofence}>{t('sharedCreateGeofence')}</MenuItem>
                <MenuItem component="a" target="_blank" href={`https://www.google.com/maps/search/?api=1&query=${position.latitude}%2C${position.longitude}`}>{t('linkGoogleMaps')}</MenuItem>
                <MenuItem component="a" target="_blank" href={`http://maps.apple.com/?ll=${position.latitude},${position.longitude}`}>{t('linkAppleMaps')}</MenuItem>
                <MenuItem component="a" target="_blank" href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${position.latitude}%2C${position.longitude}&heading=${position.course}`}>{t('linkStreetView')}</MenuItem>
                {navigationAppTitle && <MenuItem component="a" target="_blank" href={navigationAppLink.replace('{latitude}', position.latitude).replace('{longitude}', position.longitude)}>{navigationAppTitle}</MenuItem>}
                {!shareDisabled && !user.temporary && (
                  <MenuItem onClick={() => navigate(`/settings/device/${deviceId}/share`)}><Typography color="secondary">{t('deviceShare')}</Typography></MenuItem>
                )}
              </>
            )}
            </Menu>
          </>
        ) }
        <IconButton
          size="small"
          onClick={onClose}
          onTouchStart={onClose}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
    )}
    {position && (
      <CardContent className={classes.content}>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            [theme.breakpoints.down('sm')]: {
              gap: theme.spacing(0.5),
            }
          }}
        >
          {positionItems.split(',').filter((key) => (position.hasOwnProperty(key) || position.attributes.hasOwnProperty(key)) && key !== "address").map((key) => (
            <StatusRow
              key={key}
              name={positionAttributes[key]?.name || key}
              fullColumn={keepInFullSpaceColumns.includes(key)}
              content={(
                <PositionValue
                  position={position}
                  property={position.hasOwnProperty(key) ? key : null}
                  attribute={position.hasOwnProperty(key) ? null : key}
                />
              )}
            />
          ))}
        </Box>
        {summary && (
          <Box sx={{ display: summaryExpanded ? 'block' : 'none' }} >
            <Divider sx={{ margin: theme.spacing(2, 0) }} />
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                [theme.breakpoints.down('sm')]: {
                  justifyContent: 'flex-start',
                  gap: theme.spacing(0.5),
                }
              }}
            >
              {SummaryFields.split(',').filter((key) => summary.hasOwnProperty(key)).map((key) => (
                <StatusRow
                  key={key}
                  name={summaryAttributes[key]?.name || key}
                  content={
                    <PositionValue
                      position={summary}
                      property={key}
                      attribute={null}
                    />
                  }
                />))}
            </Box>
          </Box>
        )}
        {positionItems.split(',').includes('address') &&
          <Box sx={{ mt: 1 }}>
            <Typography fontSize={"0.75rem"} color="textSecondary" >
              {t('positionAddress')}
            </Typography>
            <Typography fontSize={"0.75rem"} fontWeight={600}>
              <PositionValue
                position={position}
                property={position.hasOwnProperty('address') ? 'address' : null}
                attribute={position.hasOwnProperty('address') ? null : 'address'}
              />
            </Typography>
          </Box>
        }
        
          <div className={classes.floatingInfo}>
          <Tooltip title={t('sharedShowDetails')}>
            <IconButton size='small' onClick={e => setSummaryExpanded(!summaryExpanded)} >
              { summaryExpanded ? <ExpandMoreIcon fontSize='small' /> : <ExpandLessIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
            <Tooltip title={t('sharedShowDetails')}>
            <IconButton size='small' onClick={e => navigate(`/position/${position.id}`)} >
              <InfoIcon fontSize='small' />
            </IconButton>
          </Tooltip>
          </div>
      </CardContent>
    )}
    { !isMobile && (
      <CardActions classes={{ root: classes.actions }} disableSpacing>
      <Tooltip title={t('reportReplay')}>
        <IconButton
          size="small"
          onClick={() => navigate('/replay')}
          disabled={disableActions || !position}
        >
          <ReplayIcon fontSize='small' />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('commandTitle')}>
        <IconButton
          size="small"
          onClick={() => navigate(`/settings/device/${deviceId}/command`)}
          disabled={disableActions}
        >
          <PublishIcon fontSize='small' />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('sharedEdit')}>
        <IconButton
          size="small"
          onClick={() => navigate(`/settings/device/${deviceId}`)}
          disabled={disableActions || deviceReadonly}
        >
          <EditIcon fontSize='small' />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('sharedRemove')}>
        <IconButton
          size="small"
          color="error"
          onClick={() => setRemoving(true)}
          disabled={disableActions || deviceReadonly}
        >
          <DeleteIcon fontSize='small' />
        </IconButton>
      </Tooltip>
      <Tooltip title={t('sharedExtra')}>
        <IconButton
          color="secondary"
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          disabled={!position}
        >
          <MoreVertIcon fontSize='small' />
        </IconButton>
      </Tooltip>
    </CardActions>
    ) }
  </Card>)

  if(!isMobile) card = (
    <Draggable
      handle={`.${classes.media}, .${classes.header}`}
    >
     {card}       
    </Draggable>
  )

  return (
    <>
      <div className={classes.root}>
        {device && card}
      </div>
      {position && (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem onClick={handleGeofence}>{t('sharedCreateGeofence')}</MenuItem>
          <MenuItem component="a" target="_blank" href={`https://www.google.com/maps/search/?api=1&query=${position.latitude}%2C${position.longitude}`}>{t('linkGoogleMaps')}</MenuItem>
          <MenuItem component="a" target="_blank" href={`http://maps.apple.com/?ll=${position.latitude},${position.longitude}`}>{t('linkAppleMaps')}</MenuItem>
          <MenuItem component="a" target="_blank" href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${position.latitude}%2C${position.longitude}&heading=${position.course}`}>{t('linkStreetView')}</MenuItem>
          {navigationAppTitle && <MenuItem component="a" target="_blank" href={navigationAppLink.replace('{latitude}', position.latitude).replace('{longitude}', position.longitude)}>{navigationAppTitle}</MenuItem>}
          {!shareDisabled && !user.temporary && (
            <MenuItem onClick={() => navigate(`/settings/device/${deviceId}/share`)}><Typography color="secondary">{t('deviceShare')}</Typography></MenuItem>
          )}
        </Menu>
      )}
      <RemoveDialog
        open={removing}
        endpoint="devices"
        itemId={deviceId}
        onResult={(removed) => handleRemove(removed)}
      />
    </>
  );
};

export default StatusCard;
