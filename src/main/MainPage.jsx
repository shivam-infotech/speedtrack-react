import React, {
	useState, useCallback, useEffect, useRef,
	useMemo,
} from 'react';
import {
	Box, Paper, Typography, IconButton,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useDispatch, useSelector } from 'react-redux';
import { createSearchParams, useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeviceList from './DeviceList';
import BottomMenu from '../common/components/BottomMenu';
import { devicesActions } from '../store';
import usePersistedState from '../common/util/usePersistedState';
import EventsDrawer from './EventsDrawer';
import useFilter from './useFilter';
import MainToolbar from './MainToolbar';
import MainMap from './MainMap';
import { useAttributePreference } from '../common/util/preferences';
import DeviceCard from './DeviceCard';
import DeviceStatusCard from '../common/components/DeviceStatusCard';
import MapControlLinks from '../map/extras/MapControlLinks';
import AccountModal from '../common/components/AccountModal';
import { useTranslation } from '../common/components/LocalizationProvider';
import { ExpandMore } from '@mui/icons-material';
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';

const useStyles = makeStyles((theme) => ({
	root: {
		height: '100%',
		background: theme.palette.background.default,
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
			maxWidth: theme.dimensions.drawerWidthDesktop,
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
		background: 'none',
	},
	sectionHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
}));

const LiveMap = () => {
	const classes = useStyles();
	const dispatch = useDispatch();
	const theme = useTheme();
	const navigate = useNavigate();
	const hasClearedDevice = useRef(false);
	const t = useTranslation();

	const desktop = useMediaQuery(theme.breakpoints.up('md'));
	const isSmallDevice = useMediaQuery(theme.breakpoints.down('md'));

	const mapOnSelect = useAttributePreference('mapOnSelect', true);
	const dashboardType = useAttributePreference('dashboardType', 'live-map');
	const selectedDeviceId = useSelector((state) => state.devices.selectedId);
	const user = useSelector((state) => state.session.user);
	const [accountPopupOpen, setAccountPopupOpen] = useState(false);
	const [statusCardMinimized, setStatusCardMinimized] = useState(true);
	const [focusDeviceId, setFocusDeviceId] = useState(null);
	const mapClickdeviceId = useRef(null);

	// Clear selected device only once when page loads in compact layout on small devices
	useEffect(() => {
		if (!hasClearedDevice.current && isSmallDevice && dashboardType === 'compact' && selectedDeviceId) {
			dispatch(devicesActions.selectId(null));
			hasClearedDevice.current = true;
		}
		if (focusDeviceId !== selectedDeviceId) setFocusDeviceId(null);
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

	useEffect(() => {
		if (isSmallDevice && !desktop) {
			setDevicesOpen(true);
		}
	}, [isSmallDevice, desktop]);

	useFilter(keyword, filter, filterSort, filterMap, positions, setFilteredDevices, setFilteredPositions);

	const mapLinksMemo = useMemo(() =>
		selectedDeviceId && <MapControlLinks links={[{ title: t('reportReplay'), icon: <PlayArrowIcon />, onClick: () => navigate('/replay') }, { title: t('deviceKeepFocus'), icon: <CenterFocusWeakIcon color={focusDeviceId === selectedDeviceId ? 'primary' : ''} />, onClick: () => { setFocusDeviceId(focusDeviceId ? null : selectedDeviceId) } }]} />
		, [selectedDeviceId, focusDeviceId])

	const handleMapClick = () => {
		setFilter({ statuses: [], groups: [] })
		if (mapClickdeviceId.current) navigate({ pathname: '/live', search: createSearchParams({ deviceId: mapClickdeviceId.current }).toString() })
		else navigate('/live')
	}

	const renderCompactLayout = () => (
		<div className={classes.root}>
			<Paper square elevation={3} className={classes.header} sx={{ position: 'sticky', top: 0 }}>
				<MainToolbar
					pageTitle={(
						<Box onClick={() => setAccountPopupOpen(true)} sx={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: theme.spacing(0.5), justifyContent: 'center' }}>
							<Typography fontSize="0.6rem" color="neutral">{t('sharedWelcome')}</Typography>
							<Typography fontSize="1rem" lineHeight={1} color="primary">{user.name}</Typography>
						</Box>
					)}
					onLeftTop={(
						<IconButton onClick={() => setAccountPopupOpen(true)} edge="start" sx={{ backgroundColor: theme.palette.primary.contrastText }}>
							<PersonIcon color="primary" />
						</IconButton>
					)}
					filteredDevices={filteredDevices}
					devicesOpen={devicesOpen}
					setDevicesOpen={setDevicesOpen}
					hideDevicesOpen
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
			<div className={classes.contentMap} style={{ padding: `${theme.spacing(1)} ${theme.spacing(2)}`, aspectRatio: 1, marginBottom: theme.spacing(1) }}>
				<Box className={classes.sectionHeader} sx={{ marginBottom: 0.5, marginTop: 0.5 }}>
					<Typography varient="body2" fontWeight="bold">{t('dashboardTypeLiveMap')}</Typography>
					<Typography
						variant="body3"
						sx={{ cursor: 'pointer' }}
						onClick={() => navigate('/live')}
					>
						{t('sharedSeeAll')}
					</Typography>
				</Box>
				<Box sx={{ borderRadius: '8px', height: '100%', width: '100%', overflow: 'hidden' }} onClick={(event) => {
					// if (event.defaultPrevented) return; 
					// navigate('/live')
					handleMapClick()
				}}>
					<MainMap
						filteredPositions={filteredPositions}
						selectedPosition={selectedPosition}
						onEventsClick={onEventsClick}
						filteredDevices={filterMap ? filteredDevices : undefined}
						hideControls
						animationDuration={7000}
						onMarkerClick={(deviceId, event) => {
							event.preventDefault();
							mapClickdeviceId.current = deviceId
							// event.stopPropagation();
							// setFilter({ statuses: [], groups: [] }); 
							// navigate({ pathname: '/live', search: createSearchParams({ deviceId: deviceId }).toString() })  
						}}
					/>
					{mapLinksMemo}
				</Box>
			</div>
			<Paper square className={classes.contentList}>
				<Box className={classes.sectionHeader} sx={{ padding: `0 ${theme.spacing(2)}` }}>
					<Typography varient="body2" fontWeight="bold">{t('sharedRecentDevices')}</Typography>
					{/* <Typography variant='body3'>{t('sharedSeeAll')}</Typography> */}
				</Box>
				{filteredDevices.map((_, index) => (
					<DeviceCard
						key={filteredDevices[index].id}
						isDeviceSelected={selectedDeviceId == filteredDevices[index].id}
						data={filteredDevices}
						index={index}
						style={{ marginBottom: theme.spacing(1) }}
						onClick={() => {
							setFilter({
								statuses: [],
								groups: [],
							});
							navigate({ pathname: '/live', search: createSearchParams({ deviceId: filteredDevices[index].id }).toString() });
						}}
					/>
				))}
			</Paper>
			<EventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
			{selectedDeviceId && !isSmallDevice && (
				<DeviceStatusCard
					deviceId={selectedDeviceId}
					position={selectedPosition}
					onClose={() => dispatch(devicesActions.selectId(null))}
					desktopPadding={theme.dimensions.drawerWidthDesktop}
					summary={summaries[selectedDeviceId] || {}}
				/>
			)}
			<AccountModal open={accountPopupOpen} onClose={() => setAccountPopupOpen(false)} />
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
					animationDuration={7000}
					selectedDeviceId={focusDeviceId}
				/>
			)}
			<div className={classes.sidebar}>
				<Paper square elevation={3} className={classes.header} sx={{ position: 'sticky', top: 0 }}>
					<MainToolbar
						pageTitle={(
							<Box onClick={() => setAccountPopupOpen(true)} sx={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: theme.spacing(0.5), justifyContent: 'center' }}>
								<Typography fontSize="0.6rem" color="neutral">Welcome</Typography>
								<Typography fontSize="1rem" lineHeight={1} color="primary">{user.name}</Typography>
							</Box>
						)}
						onLeftTop={(
							<IconButton onClick={() => setAccountPopupOpen(true)} edge="start" sx={{ backgroundColor: theme.palette.primary.contrastText }}>
								<PersonIcon color="primary" />
							</IconButton>
						)}
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
								animationDuration={7000}
							/>
							{mapLinksMemo}
							{/* { selectedDeviceId && <MapControlLinks links={[{ title: 'playback', icon: <PlayArrowIcon />, onClick: () => navigate('/replay') }]} /> } */}
						</div>
					)}
					<Paper square className={classes.contentList} background={theme.palette.background.default} style={devicesOpen ? {} : { visibility: 'hidden' }}>
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
					desktopPadding={theme.dimensions.drawerWidthDesktop}
					summary={summaries[selectedDeviceId] || {}}
					haveBottomTabs={isSmallDevice}
					minimize={statusCardMinimized}
					onClose={(() => setStatusCardMinimized(!statusCardMinimized))}
					closeIcon={<ExpandMore />}
				/>
			)}
			<AccountModal open={accountPopupOpen} onClose={() => setAccountPopupOpen(false)} />
		</div>
	);

	return isSmallDevice && dashboardType === 'compact' ? renderCompactLayout() : renderLiveMapLayout();
};

export default LiveMap;
