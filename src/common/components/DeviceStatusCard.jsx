import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Draggable from 'react-draggable';
import {
    Card,
    CardContent,
    Typography,
    IconButton,
    Box,
    Divider,
    useTheme,
    useMediaQuery,
    Grid,
    CardActions
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import SpeedIcon from '@mui/icons-material/Speed';
import RouteIcon from '@mui/icons-material/Route';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import BackHandIcon from '@mui/icons-material/BackHand';
import ExploreIcon from '@mui/icons-material/Explore';
import {LocalGasStation } from '@mui/icons-material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { useTranslation } from './LocalizationProvider';
import RemoveDialog from './RemoveDialog';
import PositionValue from './PositionValue';
import CloseIcon from '@mui/icons-material/Close';
import { devicesActions } from '../../store';
import { useCatch, useCatchCallback } from '../../reactHelper';
import { device3dIcons } from '../../map/core/preloadImages';
import { formatNumericHours, formatTime, getDeviceStatusColor } from '../util/formatter';
import EngineIcon from '../../resources/images/data/engine.svg?react';
import { ACIcon, BatteryLevelIcon, ChargingIcon, ChargingStatus, GSMConditionStatus, GSMSignalIcon, IgnitionIcon, MotionIcon, ParkingIcon, ParkingStatus, SatelliteConditionStatus, SatelliteSignalIcon, statusIcon } from './PostionalHelpers';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import Speedometer from "./Speedometer";
import LockOpenIcon from '@mui/icons-material/LockOpen';
import useGlobalSpeech from '../util/useGlobalSpeech';

const useStyles = makeStyles((theme) => ({
    root: ({ desktopPadding }) => ({
        pointerEvents: 'none',
        position: 'fixed',
        zIndex: 2,
        right: '0',
        [theme.breakpoints.up('md')]: {
            left: `calc(77% + ${desktopPadding} / 2)`,
            bottom: theme.spacing(3),
            width: theme.dimensions.popupMaxWidth
        },
        [theme.breakpoints.down('md')]: {
            left: '50%',
            bottom: theme.spacing(0.5),
            width: "100%"
        },
        transform: 'translateX(-50%)',
    }),
    cell: {
        display: 'flex',
        flexDirection: 'column',
        mb: 1,
        alignItems: 'flex-start',
        width: "47%"
    },
    card: {
        pointerEvents: 'auto',
        borderRadius: theme.spacing(1),
        width: theme.dimensions.popupMaxWidth,
        [theme.breakpoints.down('md')]: {
            width: "100vw",
        },
    },
    deviceImage: {
        height: 'inherit',
        width: 'inherit',
        objectFit: 'cover'
    },
    content: {
        padding: theme.spacing(1),
        maxHeight: theme.dimensions.cardContentMaxHeight,
        overflow: 'auto',
        paddingBottom: `0 !important`,
        paddingTop: `0 !important`,
    },
    icon: {
        width: '20px',
        height: '20px',
        filter: 'brightness(0) invert(1)',
    },
    tabPanel: {
        padding: theme.spacing(1, 0),
    },
    fieldItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: theme.spacing(0.5),
    },
    actionBar: {
        display: 'flex',
        gap: theme.spacing(1),
        padding: theme.spacing(1, 0),
        flexWrap: 'wrap',
        maxWidth: "22rem",
        margin: 'auto',
    },
    actionItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '60px',
        padding: theme.spacing(0.5),
        borderRadius: theme.spacing(0.5),
        backgroundColor: theme.palette.background.default,
    },
    disabledAction: {
        opacity: 0.5,
        pointerEvents: 'none',
    },
    actionCell: {
        padding: `${theme.spacing(1)} ${theme.spacing(0)}`,
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        minWidth: "4rem",
        backgroundColor: theme.palette.background.default,
    },
    speedMeter: {
        background: `linear-gradient(90deg, rgba(81,180,58,1) 0%, rgba(252,253,29,1) 50%, rgba(252,69,69,1) 100%)`,
        height: theme.spacing(1),
        width: theme.spacing(5)
    }
}));

const CompactFieldChip = ({ label, value, icon }) => {
    const theme = useTheme();

    return (<Box sx={{ display: 'flex', alignItems: 'center', margin: `${theme.spacing(1)} ${theme.spacing(0)}` }}>
        <Box sx={{ padding: `${theme.spacing(1)} ${theme.spacing(0.5)}`, display: 'flex', alignItems: 'center' }}>
            {icon}
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1, marginLeft: 0.5 }}>
            <Typography variant="caption" color={"textSecondary"} sx={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%'}} >
                {label}
            </Typography>
            <Typography variant="body2" lineHeight={1} fontWeight={500}>
                {value || 'N/A'}
            </Typography>
        </Box>
    </Box>)
}

const FieldItem = ({ label, value, icon }) => (
    <Box className="fieldItem" sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: 0.5,
        flex: '1 0',
    }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
            {icon}
        </Box>
        <Typography variant="subtitle2" fontWeight={500} lineHeight={1.2} sx={{ textAlign: 'center' }}>
            {value || 'N/A'}
        </Typography>
        <Typography variant="caption" color="textSecondary" lineHeight={1} sx={{
            textAlign: 'center',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%'
        }}>
            {label}
        </Typography>
    </Box>
);

const ActionCell = ({ icon, title, onClick, href, disabled }) => {
    const classes = useStyles();
    let cell = <Box onClick={!disabled && onClick} className={`${classes.actionCell} ${disabled ? classes.disabledAction : ''}`} >
        <div>{icon}</div>
        <Typography fontSize={"0.65rem"} color="textSecondary" >{title}</Typography>
    </Box>;
    if (href && !disabled) cell = <a href={href} target='_blank'>{cell}</a>
    return cell;
}

const PositionCell = ({ title, value }) => {
    const classes = useStyles();
    return <Box className={classes.cell}>
        <Typography fontSize={"0.8rem"} fontFamily={'monospace'}>{value}</Typography>
        <Typography fontSize={"0.65rem"} color="textSecondary" >{title}</Typography>
    </Box>
}

const DeviceStatusCard = ({ deviceId, position, onClose, disableActions, desktopPadding = 0, summary = {}, closeIcon = null, minimize = false }) => {
    const classes = useStyles({ desktopPadding });
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const t = useTranslation();
    // const deviceReadonly = useDeviceReadonly();
    const device = useSelector((state) => state.devices.items[deviceId]);
    const [activeTab, setActiveTab] = useState(0);
    const [removing, setRemoving] = useState(false);
    const shareDisabled = useSelector((state) => state.session.server.attributes.disableShare);
    const user = useSelector((state) => state.session.user);
    // const { start, stop, speechStatus } = useSpeech({ pitch: 1, rate: 0.8, volume: 1, lang: "hi-IN", voiceURI: "Google हिन्दी", autoPlay: false, text: position?.address || 'No Available address' });
    const start = useGlobalSpeech(position?.address || 'No Available address');

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

    const primaryFields = [
        { key: 'distance', label: t('sharedDistance'), icon: <RouteIcon color='primary' />, value: <PositionValue position={summary} property={'distance'} /> },
        { key: 'averageSpeed', label: t('reportAverageSpeed'), icon: <SpeedIcon color='secondary' />, value: <PositionValue position={summary} property={'averageSpeed'} /> },
        { key: 'maxSpeed', label: t('reportMaximumSpeed'), icon: <RocketLaunchIcon color='tertiary' />, value: <PositionValue position={summary} property={'maxSpeed'} /> },
        { key: 'runningHours', label: t('reportIgnitionHours'), icon: <DirectionsRunIcon color='success' />, value: <PositionValue position={summary} property={'runningHours'} /> },
        { key: 'StoppedHours', label: t('reportStoppedHours'), icon: <BackHandIcon color='error' />, value: <PositionValue position={summary} property={'stoppedHours'} /> },
        { key: 'idleHours', label: t('reportIgnitionIdleHours'), icon: <DirectionsWalkIcon color='warning' />, value: <PositionValue position={summary} property={'idleHours'} /> }
    ]

    const secondaryFields = [
        { key: 'totalDistance', label: t('deviceTotalDistance'), icon: <RouteIcon fontSize="small" />, value: <PositionValue position={position} attribute={'totalDistance'} /> },
        { key: 'engineHours', label: t('reportEngineHours'), icon: <EngineIcon height={20} />, value: <PositionValue position={summary} property={'engineHours'} /> },
        { key: 'spentFuel', label: t('reportSpentFuel'), icon: <LocalGasStation fontSize="small" />, value: <PositionValue position={summary} property={'spentFuel'} /> },
        { key: 'averageSpeed', label: t('reportAverageSpeed'), icon: <SpeedIcon fontSize="small" />, value: <PositionValue position={summary} property={'averageSpeed'} /> },
        { key: 'maxSpeed', label: t('reportMaximumSpeed'), icon: <RocketLaunchIcon fontSize="small" />, value: <PositionValue position={summary} property={'maxSpeed'} /> },
        { key: 'startOdometer', label: t('reportStartOdometer'), icon: <RouteIcon fontSize="small" />, value: <PositionValue position={summary} property={'startOdometer'} /> },
        { key: 'endOdometer', label: t('reportEndOdometer'), icon: <RouteIcon fontSize="small" />, value: <PositionValue position={summary} property={'endOdometer'} /> },
        { key: 'runningHours', label: t('reportIgnitionHours'), icon: <DirectionsRunIcon fontSize="small" />, value: <PositionValue position={summary} property={'runningHours'} /> },
        { key: 'StoppedHours', label: t('reportStoppedHours'), icon: <BackHandIcon fontSize="small" />, value: <PositionValue position={summary} property={'stoppedHours'} /> },
        { key: 'idleHours', label: t('reportIgnitionIdleHours'), icon: <DirectionsWalkIcon fontSize="small" />, value: <PositionValue position={summary} property={'idleHours'} /> }
    ];

    const sensorFields = [
        { key: 'ignition', label: t('positionIgnition'), icon: IgnitionIcon(position?.attributes?.ignition || undefined), value: <PositionValue position={position} attribute={'ignition'} /> },
        { key: 'charging', label: '', icon: ChargingIcon(position?.attributes?.charge || undefined), value: t(ChargingStatus(position?.attributes?.charge || undefined)) },
        { key: 'batteryLevel', label: t('positionBattery'), icon: BatteryLevelIcon(position?.attributes?.batteryLevel || undefined), value: position ? <PositionValue position={position} attribute={'batteryLevel'} />: 'N/A' },
        { key: 'immobilizer', label: t('sharedImmobilizer'), icon: <LockOpenIcon fontSize='small' color='success' />, value: 'N/A' },
        { key: 'parking', label: t('deviceParking'), icon: ParkingIcon(position), value: t(ParkingStatus(position)) },
        { key: 'rssi', label: t('positionGsm'), icon: GSMSignalIcon(position?.attributes?.rssi || undefined), value: position && position?.attributes?.rssi ? t(GSMConditionStatus(position?.attributes?.rssi)) : 'N/A' },
        { key: 'motion', label: t('positionMotion'), icon: MotionIcon(position?.attributes?.motion || undefined), value: position ? <PositionValue position={position} attribute={'motion'} />: t('sharedNo') },
        { key: 'sat', label: t('positionGps'), icon: SatelliteSignalIcon(position?.attributes?.sat || undefined), value: position && position?.attributes?.sat ? t(SatelliteConditionStatus(position?.attributes?.sat)) : 'N/A' },
        { key: 'ac', label: t('attributeAc'), icon: ACIcon(position?.attributes?.ac || undefined), value: <PositionValue position={position} attribute={'ac'} />},
        // { key: 'radioType', label: t('positionRadioType'), icon: <NetworkCell />, value: position ? position?.network?.radioType?.ucfirst() : 'N/A' },
        { key: 'course', label: t('positionCourse'), icon: <ExploreIcon />, value: position ? position?.course : '0' },
        { key: 'accuracy', label: t('positionAccuracy'), icon: <MyLocationIcon />, value: position ? position?.accuracy : '0' }
    ];

    const card = (<Card className={classes.card} elevation={3}>
        <Box
            className="drag-handle"
            sx={{ padding: theme.spacing(1), display: 'flex',  }}
        >
            <img src={device3dIcons.car[position ? getDeviceStatusColor(position) : 'neutral']} width={"56px"} />
            <Box sx={{ flex: 1, marginLeft: 1, display: 'flex', flexDirection: 'column',  }}>
                <Typography fontWeight={"600"} lineHeight={1.2}>{device?.name}</Typography>
                <Typography color={"neutral"} variant={'caption'} fontWeight={"400"}>{position?.fixTime ? formatTime(position.fixTime) : 'N/A'}</Typography>
                <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
                    {statusIcon(position?.attributes?.activity, position ? (getDeviceStatusColor(position)) : 'default', '0.6rem')}
                    <Typography align='center' fontSize={"0.8rem"} sx={{ marginLeft: 0.5 }} color={position ? (getDeviceStatusColor(position)) : 'default'} >{position ? (position?.attributes?.activity ? (t(`deviceStatus${position?.attributes?.activity.ucfirst()}`) + " since " + formatNumericHours(position.attributes.activityDurationHours, t)) : t('deviceStatusStopped')) : t('deviceStatusOffline')}</Typography>
                </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Speedometer speed={position?.speed || 0} />
            </Box>
            { onClose ? <IconButton size="small" onClick={onClose}>
                {closeIcon || <CloseIcon fontSize='small' />}
            </IconButton> : <></> }
        </Box>
        <Divider />
        { (position && !minimize ) && <>
        <CardContent className={classes.content}>
            <Grid container spacing={1}>
                {primaryFields.map((field) => (
                    <Grid item xs={4} key={field.key}>
                        <CompactFieldChip
                            label={field.label}
                            value={field.value}
                            icon={field.icon}
                        />
                    </Grid>
                ))}
            </Grid>
            {position?.address && (
                <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FmdGoodIcon fontSize="small" color="primary" />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                            <PositionValue position={position} property="address" attribute="address" />
                        </Typography>
                        <IconButton size='small' onClick={(e) => {e.stopPropagation(); start();}}>
                            <VolumeUpIcon />
                        </IconButton>
                    </Box>
                </>
            )}
            <Divider sx={{ margin: `${theme.spacing(1)} ${theme.spacing(0)}` }} />
            <Box>
                <Box sx={{ display: 'flex', overflowX: 'auto' }}>
                    {sensorFields.map((field) => (
                        <Box sx={{ minWidth: "5rem" }} key={field.key}>
                            <FieldItem
                                label={field.label}
                                value={field.value}
                                icon={field.icon}
                            />
                        </Box>
                    ))}
                </Box>
            </Box>
        </CardContent>
    </> }
    </Card>);

    return (
        <div className={classes.root}>
            { !isMobile ? (
                <Draggable handle=".drag-handle">
                    {card}
                </Draggable>
            ) : card }
            <RemoveDialog
                open={removing}
                endpoint="devices"
                itemId={deviceId}
                onResult={handleRemove}
            />
        </div>
    );
};

export default DeviceStatusCard;
  