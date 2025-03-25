import { useDispatch, useSelector } from "react-redux";
import MainMap from "./MainMap";
import { useEffect, useState } from "react";
import makeStyles from '@mui/styles/makeStyles';
import { IconButton, Paper, Toolbar, Typography, useTheme } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from "../common/components/LocalizationProvider";
import StatusCard from "../common/components/StatusCard";
import { devicesActions } from '../store';
import { useNavigate } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
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
        height: "100%",
    }
}));

export default function LiveMap() {
    const t = useTranslation()
    const styles = useStyles();
    const theme = useTheme();
    const devices = useSelector((state) => state.devices.items);
    const positions = useSelector((state) => state.session.positions);
    const selectedDeviceId = useSelector((state) => state.devices.selectedId);
    const { items: summaries } = useSelector((state) => state.summary);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [filteredPositions, setFilteredPositions] = useState([]);

    useEffect(() => {
        setFilteredPositions(Object.values(devices).map((device) => positions[device.id]).filter(Boolean))
    }, [positions, devices])

    return (
        <>
            <div className={styles.sidebar}>
                <Paper elevation={3} square>
                    <Toolbar>
                        <IconButton edge="start" sx={{ mr: 2 }} onClick={() => {dispatch(devicesActions.selectId(null)) ; navigate(-1);}}>
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h6" sx={{ flexGrow: 1 }} >{t('mapLiveRoutes')}</Typography>
                    </Toolbar>
                </Paper>
            </div>
            <div className={styles.mapContainer}>
                <MainMap
                    filteredPositions={filteredPositions}
                    selectedPosition={filteredPositions.find((position) => selectedDeviceId && position.deviceId === selectedDeviceId)}
                    hideControls={true}
                    onEventsClick={() => {}}
                />
            </div>
            {selectedDeviceId && <StatusCard
                deviceId={selectedDeviceId}
                position={filteredPositions.find((position) => selectedDeviceId && position.deviceId === selectedDeviceId)}
                onClose={() => dispatch(devicesActions.selectId(null))}
                desktopPadding={theme.dimensions.drawerWidthDesktop}
                summary={summaries[selectedDeviceId] || {}}
            />}
        </>
    )
}