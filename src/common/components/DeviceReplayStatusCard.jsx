import React, { useEffect, useState } from 'react';
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
    Stack,
    Slider,
    Accordion,
    AccordionDetails,
    AccordionSummary
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import FmdGoodIcon from '@mui/icons-material/FmdGood';
import SpeedIcon from '@mui/icons-material/Speed';
import RouteIcon from '@mui/icons-material/Route';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import BackHandIcon from '@mui/icons-material/BackHand';
import { ExpandMore, LocalGasStation } from '@mui/icons-material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { useTranslation } from './LocalizationProvider';
import RemoveDialog from './RemoveDialog';
import PositionValue from './PositionValue';
import { useDeviceReadonly } from '../util/permissions';
import { devicesActions } from '../../store';
import { useCatch, useCatchCallback } from '../../reactHelper';
import { useAttributePreference } from '../util/preferences';
import { device3dIcons } from '../../map/core/preloadImages';
import { formatDistance, formatNumericHours, formatTime, getDeviceStatusColor } from '../util/formatter';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import { calculateDistanceFromCoords } from '../util/position';
import EngineIcon from '../../resources/images/data/engine.svg?react';
import Speedometer from './Speedometer';
import { statusIcon } from './PostionalHelpers';
import CloseIcon from '@mui/icons-material/Close';

const useStyles = makeStyles((theme) => ({
    root: ({ desktopPadding }) => ({
        pointerEvents: 'none',
        position: 'fixed',
        zIndex: 2,
        right: '0',
        [theme.breakpoints.up('md')]: {
            left: `calc(50% + ${desktopPadding} / 2)`,
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
        alignItems: 'center',
        width: "30%"
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
        paddingBottom: `${theme.spacing(1)} !important`
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
        // overflowX: 'auto',
        // scrollbarWidth: 'none',
        // '&::-webkit-scrollbar': { display: 'none' }
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
        <Typography variant="subtitle2" fontWeight={500} sx={{ textAlign: 'center' }}>
            {value || 'N/A'}
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{
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


const DeviceReplayStatusCard = ({ deviceId, positions, onClose, index, desktopPadding = 0, summary = {}, closeIcon = null, minimize = false, playing, setPlaying, setIndex }) => {
    const classes = useStyles({ desktopPadding });
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const t = useTranslation();
    const deviceReadonly = useDeviceReadonly();
    const distanceUnit = useAttributePreference('distanceUnit');
    const device = useSelector((state) => state.devices.items[deviceId]);
    const [removing, setRemoving] = useState(false);
    const shareDisabled = useSelector((state) => state.session.server.attributes.disableShare);
    const user = useSelector((state) => state.session.user);
    const [position, setPosition] = useState(null);
    const [secondaryExpanded, setSecondaryExpanded] = useState(false);

    useEffect(() => {
        setPosition(positions[index])
    }, [index, positions])

    const primaryFields = [
        { key: 'distance', label: t('sharedDistance'), icon: <RouteIcon color='primary' />, value: formatDistance(calculateDistanceFromCoords(positions.slice(0, index)), distanceUnit, t) },
        { key: 'averageSpeed', label: t('reportAverageSpeed'), icon: <SpeedIcon color='secondary' />, value: <PositionValue position={summary} property={'averageSpeed'} /> },
        { key: 'maxSpeed', label: t('reportMaximumSpeed'), icon: <RocketLaunchIcon color='tertiary' />, value: <PositionValue position={summary} property={'maxSpeed'} /> },
        { key: 'runningHours', label: t('reportIgnitionHours'), icon: <DirectionsRunIcon color='success' />, value: <PositionValue position={summary} property={'runningHours'} /> },
        { key: 'StoppedHours', label: t('reportStoppedHours'), icon: <BackHandIcon color='error' />, value: <PositionValue position={summary} property={'stoppedHours'} /> },
        { key: 'idleHours', label: t('reportIgnitionIdleHours'), icon: <DirectionsWalkIcon color='warning' />, value: <PositionValue position={summary} property={'idleHours'} /> }
    ]

    const secondaryFields = [
        // { key: 'distance1', label: t('positionLastDistance'), icon: <RouteIcon fontSize="small" />, value: <PositionValue position={position} attribute={'distance'} /> },
        { key: 'distance', label: t('positionTripDistance'), icon: <RouteIcon fontSize="small" />, value: <PositionValue position={summary} property={'distance'} /> },
        { key: 'spentFuel', label: t('reportSpentFuel'), icon: <LocalGasStation fontSize="small" />, value: <PositionValue position={summary} property={'spentFuel'} /> },
        { key: 'averageSpeed', label: t('reportAverageSpeed'), icon: <SpeedIcon fontSize="small" />, value: <PositionValue position={summary} property={'averageSpeed'} /> },
        { key: 'maxSpeed', label: t('reportMaximumSpeed'), icon: <RocketLaunchIcon fontSize="small" />, value: <PositionValue position={summary} property={'maxSpeed'} /> },
        // { key: 'fuelConsumption', label: t('positionFuelConsumption'), icon: <RouteIcon fontSize="small" />, value: <PositionValue position={summary} property={'fuelConsumption'} /> },

        { key: 'startOdometer', label: t('reportStartOdometer'), icon: <RouteIcon fontSize="small" />, value: <PositionValue position={summary} property={'startOdometer'} /> },
        { key: 'endOdometer', label: t('reportEndOdometer'), icon: <RouteIcon fontSize="small" />, value: <PositionValue position={summary} property={'endOdometer'} /> },
        { key: 'runningHours', label: t('reportIgnitionHours'), icon: <DirectionsRunIcon fontSize="small" />, value: <PositionValue position={summary} property={'runningHours'} /> },
        { key: 'StoppedHours', label: t('reportStoppedHours'), icon: <BackHandIcon fontSize="small" />, value: <PositionValue position={summary} property={'stoppedHours'} /> },
        { key: 'idleHours', label: t('reportIgnitionIdleHours'), icon: <DirectionsWalkIcon fontSize="small" />, value: <PositionValue position={summary} property={'idleHours'} /> },
        { key: 'ignitionOff', label: `${t('positionIgnition')} ${t('positionIgnitionOff')}`, icon: <EngineIcon width={24} height={24} />, value: formatNumericHours(summary?.stoppedHours, t) },
        { key: 'ignitionOn', label: `${t('positionIgnition')} ${t('positionIgnitionOn')}`, icon: <EngineIcon width={24} height={24} />, value: formatNumericHours(summary?.runningHours + summary?.idleHours, t) },
        { key: 'totalDistance', label: t('deviceTotalDistance'), icon: <RouteIcon fontSize="small" />, value: <PositionValue position={position} attribute={'totalDistance'} /> },

    ];

    const handleRemove = useCatch(async (removed) => {
        runningHours
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

    const card = <Card className={classes.card} elevation={3}>
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
            <Box>
                <Speedometer speed={position?.speed || 0} />
            </Box>
            { onClose ? <IconButton size="small" onClick={onClose}>
                {closeIcon || <CloseIcon fontSize='small' />}
            </IconButton> : <></> }
        </Box>
        <Divider />
        {position && <>
            <CardContent className={classes.content}>
                {!minimize && <Box mb={2}>
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
                </Box>}
                <Stack direction="row" spacing={0} sx={{ alignItems: 'center', padding: `0px ${theme.spacing(1)}` }}>
                    <Slider
                        size='small'
                        max={positions.length - 1}
                        step={null}
                        marks={positions.map((_, index) => ({ value: index }))}
                        value={index}
                        sx={{ marginLeft: theme.spacing(1) }}
                        onChange={(_, index) => setIndex(index)}
                    />
                    <IconButton onClick={() => setIndex((index) => index - 1)} disabled={playing || index <= 0}>
                        <FastRewindIcon />
                    </IconButton>
                    <IconButton onClick={() => setPlaying(!playing)} disabled={index >= positions.length - 1}>
                        {playing ? <PauseIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    <IconButton onClick={() => setIndex((index) => index + 1)} disabled={playing || index >= positions.length - 1}>
                        <FastForwardIcon />
                    </IconButton>
                </Stack>

                <Accordion elevation={0} expanded={!minimize && secondaryExpanded } onChange={() => setSecondaryExpanded(!secondaryExpanded)} >
                    <AccordionSummary expandIcon={!minimize && <ExpandMore />} >
                        {position?.address ? (
                            <>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <FmdGoodIcon fontSize="small" color="primary" />
                                    <Typography variant="body2" sx={{ flex: 1 }}>
                                        <PositionValue position={position} property="address" attribute="address" />
                                    </Typography>
                                    
                                </Box>
                            </>
                        ) : <Typography variant='caption' color="secondary">No address found</Typography>}
                    </AccordionSummary>
                    {!minimize && <AccordionDetails>
                        <Grid container spacing={1}>
                            {secondaryFields.map((field) => (
                                <Grid item xs={4} key={field.key}>
                                    <FieldItem
                                        label={field.label}
                                        value={field.value}
                                        icon={field.icon}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    </AccordionDetails>}
                </Accordion>
            </CardContent>
        </>}
    </Card>

    return (
        <div className={classes.root}>
            {!isMobile ? (
                <Draggable handle=".drag-handle">
                    {card}
                </Draggable>
            ) : card}
            <RemoveDialog
                open={removing}
                endpoint="devices"
                itemId={deviceId}
                onResult={handleRemove}
            />
        </div>
    );
};

export default DeviceReplayStatusCard;