import { useDispatch, useSelector } from "react-redux";
import MainMap from "./MainMap";
import { useEffect, useState } from "react";
import makeStyles from '@mui/styles/makeStyles';
import { Icon, IconButton, Paper, Toolbar, Typography, useTheme } from "@mui/material";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useTranslation } from "../common/components/LocalizationProvider";
import StatusCard from "../common/components/StatusCard";
import { devicesActions } from '../store';
import { useNavigate, useSearchParams } from "react-router-dom";
import MainToolbar from "./MainToolbar";
import usePersistedState from '../common/util/usePersistedState';
import useFilter from "./useFilter";
import DeviceStatusCard from "../common/components/DeviceStatusCard";

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
            height: `100%`
        },
    },
    hideFilterMapContainer: {
        [theme.breakpoints.down('md')]: {
            marginTop: theme.spacing('56px'), // Height of the toolbar
        },
    }
}));

export default function LiveMap() {
    const t = useTranslation()
    const styles = useStyles();
    const theme = useTheme();
    const positions = useSelector((state) => state.session.positions);
    const selectedDeviceId = useSelector((state) => state.devices.selectedId);
    const { items: summaries } = useSelector((state) => state.summary);
    const devices = useSelector(state => state.devices.items)
    const dispatch = useDispatch();

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

    useFilter(keyword, filter, filterSort, filterMap, positions, setFilteredDevices, setFilteredPositions);

    useEffect(() => {
        setFilteredPositions(Object.values(filteredDevices).map((device) => positions[device.id]).filter(Boolean))
    }, [positions, filteredDevices])

    return (
        <div className={styles.root}>
            <div className={styles.sidebar}>
                <Paper elevation={3} square>
                    <MainToolbar
                        filteredDevices={filteredDevices}
                        devicesOpen={devicesOpen}
                        setDevicesOpen={setDevicesOpen}
                        hideDevicesOpen={true}
                        onLeftTop={
                            <IconButton edge="start" size="small" onClick={() => navigate(-1)} >
                                <ArrowBackIcon fontSize="small" />
                            </IconButton>
                        }
                        keyword={keyword}
                        setKeyword={setKeyword}
                        filter={filter}
                        setFilter={setFilter}
                        filterSort={filterSort}
                        setFilterSort={setFilterSort}
                        filterMap={filterMap}
                        setFilterMap={setFilterMap}
                        selectedDeviceId={selectedDeviceId}
                        hidefilters={params.has('deviceId')}
                    />
                </Paper>
            </div>
            <div className={`${styles.mapContainer} ${params.has('deviceId') ? styles.hideFilterMapContainer : ''}`}>                
                <MainMap
                    filteredPositions={filteredPositions}
                    selectedPosition={filteredPositions.find((position) => selectedDeviceId && position.deviceId === selectedDeviceId)}
                    hideControls={true}
                    onEventsClick={() => {}}
                    filteredDevices={ params.has('deviceId') && Object.values(devices).map(fd => fd.id).includes(Number(params.get('deviceId'))) ? Object.values(devices).filter(fd => fd.id == params.get('deviceId')) :  filteredDevices}
                />
            </div>
            {selectedDeviceId && <DeviceStatusCard
                deviceId={selectedDeviceId}
                position={ params.has('deviceId') && Object.values(devices).map(fd => fd.id).includes(Number(params.get('deviceId'))) ? Object.values(positions).find(position => selectedDeviceId && position.deviceId === selectedDeviceId ) : filteredPositions.find((position) => selectedDeviceId && position.deviceId === selectedDeviceId)}
                // onClose={() => dispatch(devicesActions.selectId(null))}
                desktopPadding={theme.dimensions.drawerWidthDesktop}
                summary={summaries[selectedDeviceId] || {}}
            />}
        </div>
    )
}