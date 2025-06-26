import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Toolbar, IconButton, OutlinedInput, InputAdornment, Popover, FormControl, InputLabel, Select, MenuItem, FormGroup, FormControlLabel, Checkbox, Badge, ListItemButton, ListItemText, Tooltip,
  List,
  ListItem,
  Chip,
  Divider,
  Switch,
  Menu,
  ListItemIcon,
  Typography,
} from '@mui/material';
import { makeStyles, useTheme } from '@mui/styles';
import MapIcon from '@mui/icons-material/Map';
import ViewListIcon from '@mui/icons-material/ViewList';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';
import SortIcon from '@mui/icons-material/Sort';
import PinDropIcon from '@mui/icons-material/PinDrop';
import WrongLocationIcon from '@mui/icons-material/WrongLocation';
import dayjs from 'dayjs';
import SearchIcon from '@mui/icons-material/Search';
import CarRentalIcon from '@mui/icons-material/CarRental';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Close, MoreVert } from '@mui/icons-material';
import { useAttributePreference } from '../common/util/preferences';
import DeviceRow from './DeviceRow';
import { useDeviceReadonly } from '../common/util/permissions';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useGeneralStore } from '../store/general';

const useStyles = makeStyles((theme) => ({
  toolbarContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    padding: `${theme.spacing(1)} !important`,
    // gap: theme.spacing(1),
  },
  toolbar: {
    width: '100%',
    display: 'flex',
    gap: theme.spacing(0.5),
    padding: `0 ${theme.spacing(1)}`,
  },
  filterPanel: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
    gap: theme.spacing(2),
    width: theme.dimensions.drawerWidthTablet,
  },
  filterContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: theme.spacing(1),
  },
  chipContainer: {
    display: 'flex',
    gap: '4px',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    '&::-webkit-scrollbar': {
      display: 'none',
    },
  },
  divider: {
    height: 24,
    margin: theme.spacing(0, 1),
  },
}));

const MainToolbar = ({
  filteredDevices,
  devicesOpen,
  setDevicesOpen,
  hideDevicesOpen = false,
  onLeftTop,
  keyword,
  setKeyword,
  filter,
  setFilter,
  filterSort,
  setFilterSort,
  filterMap,
  setFilterMap,
  selectedDeviceId,
  hidefilters,
  pageTitle,
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const t = useTranslation();

  const deviceReadonly = useDeviceReadonly();

  const groups = useSelector((state) => state.groups.items);
  const devices = useSelector((state) => state.devices.items);
  const positions = useSelector((state) => state.session.positions);

  const toolbarRef = useRef();
  const inputRef = useRef();
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [devicesAnchorEl, setDevicesAnchorEl] = useState(null);
  const { userRole, userData } = useGeneralStore()
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const daysBeforeExpiry = useAttributePreference('daysBeforeExpiry');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [moreOptionsAnchorEl, setMoreOptionsAnchorEl] = useState(null);
  // const deviceStatusCount = (status) => Object.values(devices).filter((d) => d.status === status).length;
  const checkDeviceCountForStatus = (status) => {
    const dvsc = Object.values(devices);
    switch (status) {
      case 'all':
        return dvsc.length;
      // case 'online':
      //   return dvsc.filter((d) => d.status === 'online').length;
      case 'offline':
        return dvsc.filter((d) => d.status === 'offline' && d.lastUpdate === null).length;
      case 'running':
        return dvsc.filter((d) => positions[d.id]?.attributes?.activity === 'running' || false).length;
      case 'idle':
        return dvsc.filter((d) => positions[d.id]?.attributes?.activity === 'idle' || false).length;
      case 'stopped':
        return dvsc.filter((d) => positions[d.id]?.attributes?.ignition === false || false).length;
      case 'expired':
        return dvsc.filter((d) => d.expirationTime && dayjs(d.expirationTime).diff(dayjs()) < 0).length;
      case 'expiresoon':
        return dvsc.filter((d) => {
          if (d.expirationTime) {
            const days = dayjs(d.expirationTime).diff(dayjs(), 'days');
            return days > 0 && days < daysBeforeExpiry;
          }
          return false;
        }).length;
      case 'nodata':
        return dvsc.filter((d) => d.status === 'offline' && positions[d.id] === undefined).length;
      case 'unknown':
        return dvsc.filter((d) => d.status === 'unknown').length;
      default:
        return 0;
    }
  };

  const deviceStatus = [
    {
      status: 'running',
      title: t('deviceStatusRunning'),
      color: 'success',
    },
    {
      status: 'idle',
      title: t('deviceStatusIdle'),
      color: 'warning',
    },
    {
      status: 'stopped',
      title: t('deviceStatusStopped'),
      color: 'error',
    },
    {
      status: 'offline',
      title: t('deviceStatusOffline'),
      color: '',
    },
    {
      status: 'nodata',
      title: t('deviceStatusNoData'),
      color: 'quadrial',
    },
    {
      status: 'expiresoon',
      title: t('deviceStatusExpireSoon'),
      color: 'tertiary',
    },
    {
      status: 'expired',
      title: t('deviceStatusExpired'),
      color: 'analogous',
    },
  ];

  const handleFilter = (status) => {
    setFilter({ ...filter, statuses: (!filter.statuses.includes(status) ? status : '') })
  }

  return (
    <Toolbar ref={toolbarRef} className={classes.toolbarContainer}>
      <div className={classes.toolbar}>
        {onLeftTop}
        {!searchExpanded && pageTitle}
        {searchExpanded && (
          <OutlinedInput
            ref={inputRef}
            placeholder={t('sharedSearchDevices')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onFocus={() => setDevicesAnchorEl(toolbarRef.current)}
            onBlur={() => setDevicesAnchorEl(null)}
            endAdornment={(
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => { setKeyword(''); setSearchExpanded(false); }}>
                  <Close fontSize="small" />
                </IconButton>
              </InputAdornment>
            )}
            // endAdornment={(
            //   <InputAdornment position="end">
            //     <IconButton size="small" edge="end" onClick={() => setFilterAnchorEl(inputRef.current)}>
            //       <Badge color="info" variant="dot" invisible={!filter.statuses.length && !filter.groups.length}>
            //         <TuneIcon fontSize="small" />
            //       </Badge>
            //     </IconButton>
            //   </InputAdornment>
            // )}
            size="small"
            fullWidth
          />
        )}
        {/* <Popover
          open={!!devicesAnchorEl && !devicesOpen}
          anchorEl={devicesAnchorEl}
          onClose={() => setDevicesAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: Number(theme.spacing(2).slice(0, -2)),
          }}
          marginThreshold={0}
          slotProps={{
            paper: {
              style: { width: `calc(${toolbarRef.current?.clientWidth}px - ${theme.spacing(4)})` },
            },
          }}
          elevation={1}
          disableAutoFocus
          disableEnforceFocus
        >
          {filteredDevices.slice(0, 3).map((_, index) => (
            <DeviceRow key={filteredDevices[index].id} isDeviceSelected={selectedDeviceId == filteredDevices[index].id} data={filteredDevices} index={index} />
          ))}
          {filteredDevices.length > 3 && (
            <ListItemButton alignItems="center" onClick={() => setDevicesOpen(true)}>
              <ListItemText
                primary={t('notificationAlways')}
                style={{ textAlign: 'center' }}
              />
            </ListItemButton>
          )}
        </Popover> */}
        {/* <Popover
          open={!!filterAnchorEl}
          anchorEl={filterAnchorEl}
          onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <div className={classes.filterPanel}>
            <FormControl>
              <InputLabel>{t('deviceStatus')}</InputLabel>
              <Select
                label={t('deviceStatus')}
                value={filter.statuses}
                onChange={(e) => setFilter({ ...filter, statuses: e.target.value })}
                multiple
              >
                <MenuItem value="online">{`${t('deviceStatusOnline')} (${deviceStatusCount('online')})`}</MenuItem>
                <MenuItem value="offline">{`${t('deviceStatusOffline')} (${deviceStatusCount('offline')})`}</MenuItem>
                <MenuItem value="unknown">{`${t('deviceStatusUnknown')} (${deviceStatusCount('unknown')})`}</MenuItem>
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>{t('settingsGroups')}</InputLabel>
              <Select
                label={t('settingsGroups')}
                value={filter.groups}
                onChange={(e) => setFilter({ ...filter, groups: e.target.value })}
                multiple
              >
                {Object.values(groups).sort((a, b) => a.name.localeCompare(b.name)).map((group) => (
                  <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>{t('sharedSortBy')}</InputLabel>
              <Select
                label={t('sharedSortBy')}
                value={filterSort}
                onChange={(e) => setFilterSort(e.target.value)}
                displayEmpty
              >
                <MenuItem value="">{'\u00a0'}</MenuItem>
                <MenuItem value="name">{t('sharedName')}</MenuItem>
                <MenuItem value="lastUpdate">{t('deviceLastUpdate')}</MenuItem>
              </Select>
            </FormControl>
            <FormGroup>
              <FormControlLabel
                control={<Checkbox checked={filterMap} onChange={(e) => setFilterMap(e.target.checked)} />}
                label={t('sharedFilterMap')}
              />
            </FormGroup>
          </div>
        </Popover> */}
        {userRole === 'distributor' && (
          userData?.limit_type === 'credit' && (
            <IconButton disabled={deviceReadonly}>
              <Typography variant="body2" fontWeight="bold">Cr.{userData?.credits}</Typography>
            </IconButton>
          )
        )}
        {userRole === 'distributor' && (
          userData?.limit_type === 'device' && (
            <IconButton disabled={deviceReadonly}>
              <Typography variant="body2" fontWeight="bold">Dev. Limit: {userData?.device_limit}</Typography>
            </IconButton>
          )
        )}
        {!hideDevicesOpen && (
          <IconButton onClick={() => setDevicesOpen(!devicesOpen)}>
            {devicesOpen ? <MapIcon /> : <ViewListIcon />}
          </IconButton>
        )}
        {!searchExpanded && (
          <IconButton onClick={() => setSearchExpanded(true)}>
            <SearchIcon />
          </IconButton>
        )}
        <IconButton edge="end" onClick={(e) => setMoreOptionsAnchorEl(e.currentTarget)}>
          <MoreVert />
        </IconButton>
        <Menu
          open={Boolean(moreOptionsAnchorEl)}
          anchorEl={moreOptionsAnchorEl}
          onClose={() => setMoreOptionsAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <MenuItem onClick={() => navigate('/settings/device')} disabled={deviceReadonly}>
            <ListItemIcon><CarRentalIcon /></ListItemIcon>
            <ListItemText>{t('deviceCreate')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => navigate('/settings/user')} disabled={deviceReadonly}>
            <ListItemIcon><PersonAddAltIcon /></ListItemIcon>
            <ListItemText>{t('userCreate')}</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => navigate('/reports/event')}>
            <ListItemIcon>
              <NotificationsIcon />
            </ListItemIcon>
            <ListItemText>{t('events')}</ListItemText>
          </MenuItem>
        </Menu>
        {/* <IconButton size='small' onClick={() => navigate('/settings/device')} >
          <Tooltip open={!deviceReadonly && Object.keys(devices).length === 0} title={t('deviceRegisterFirst')} arrow>

          </Tooltip>
        </IconButton >
        <IconButton size='small'>
          <PersonAddAltIcon fontSize='small' />
        </IconButton>
        <IconButton size='small'>

        </IconButton> */}
      </div>
      {!hidefilters && (
        <div className={classes.filterContainer}>
          <List className={classes.chipContainer}>
            <Chip
              key="all"
              icon={filter.statuses === '' ? <CheckIcon /> : undefined}
              size="small"
              color="info"
              onClick={() => setFilter({ ...filter, statuses: '' })}
              label={`${checkDeviceCountForStatus('all')} ${t('deviceStatusAll')}`}
            />
            {deviceStatus.map((ds) => (
              <Chip
                key={ds.status}
                icon={filter.statuses.includes(ds.status) ? <CheckIcon /> : undefined}
                size="small"
                color={ds.color || undefined}
                onClick={() => handleFilter(ds.status)}
                label={`${checkDeviceCountForStatus(ds.status)} ${ds.title}`}
              />
            ))}
            {Object.values(groups).length > 0 && <Divider key="divider" orientation="vertical" flexItem className={classes.divider} />}
            {Object.values(groups).sort((a, b) => a.name.localeCompare(b.name)).map((group) => (
              <Chip key={group.id} icon={filter.groups === group.id ? <CheckIcon /> : undefined} label={group.name} size="small" onClick={() => setFilter({ ...filter, groups: (filter.groups === group.id ? '' : group.id) })} />
            ))}
          </List>

          <Tooltip title={t('sharedFilterMap')}>
            <IconButton onClick={() => setFilterMap(!filterMap)} size="small">
              {filterMap ? <PinDropIcon fontSize="small" sx={{ color: theme.palette.primary.main }} /> : <WrongLocationIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <Tooltip title={t('sharedSortBy')}>
            <IconButton onClick={(e) => setSortAnchorEl(e.currentTarget)} size="small">
              <SortIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      )}
      <Popover
        open={Boolean(sortAnchorEl)}
        anchorEl={sortAnchorEl}
        onClose={() => setSortAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <MenuItem onClick={() => setFilterSort('')}>{t('categoryDefault')}</MenuItem>
        <MenuItem onClick={() => setFilterSort('name')}>{t('sharedName')}</MenuItem>
        <MenuItem onClick={() => setFilterSort('lastUpdate')}>{t('deviceLastUpdate')}</MenuItem>
      </Popover>
    </Toolbar>
  );
};

export default MainToolbar;
