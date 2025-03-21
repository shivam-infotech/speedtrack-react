import React, { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Toolbar, IconButton, OutlinedInput, InputAdornment, Popover, FormControl, InputLabel, Select, MenuItem, FormGroup, FormControlLabel, Checkbox, Badge, ListItemButton, ListItemText, Tooltip,
  List,
  ListItem,
  Chip,
  Divider,
} from '@mui/material';
import { makeStyles, useTheme } from '@mui/styles';
import MapIcon from '@mui/icons-material/Map';
import ViewListIcon from '@mui/icons-material/ViewList';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import TuneIcon from '@mui/icons-material/Tune';
import SortIcon from '@mui/icons-material/Sort';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useDeviceReadonly } from '../common/util/permissions';
import DeviceRow from './DeviceRow';

const useStyles = makeStyles((theme) => ({
  toolbarContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start', 
    padding: theme.spacing(1),
    gap: theme.spacing(1),
  },
  toolbar: {
    width: '100%',
    display: 'flex',
    gap: theme.spacing(1),
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
  }
}));

const MainToolbar = ({
  filteredDevices,
  devicesOpen,
  setDevicesOpen,
  keyword,
  setKeyword,
  filter,
  setFilter,
  filterSort,
  setFilterSort,
  filterMap,
  setFilterMap,
  selectedDeviceId,
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
  const [sortAnchorEl, setSortAnchorEl] = useState(null);

  // const deviceStatusCount = (status) => Object.values(devices).filter((d) => d.status === status).length;

  const checkDeviceCountForStatus = (status) => {
    const dvsc = Object.values(devices);
    switch (status) {
      case 'online':
        return dvsc.filter((d) => d.status === 'online').length;
      case 'offline':
        return dvsc.filter((d) => d.status === 'offline').length;
      case 'running':
        return dvsc.filter((d) => positions[d.id]?.attributes?.ignition && positions[d.id]?.speed > 5).length;
      case 'idle':
        return dvsc.filter((d) => positions[d.id]?.attributes?.ignition && positions[d.id]?.speed <= 5).length;
      case 'stopped':
        return dvsc.filter((d) => !positions[d.id]?.attributes?.ignition && d.status === 'online').length;
      case 'unknown':
        return dvsc.filter((d) => d.status === 'unknown').length;
      default:
        return 0;
    }
  }

  return (
    <Toolbar ref={toolbarRef} className={classes.toolbarContainer} >
      <div className={classes.toolbar}>
        <IconButton edge="start" onClick={() => setDevicesOpen(!devicesOpen)}>
          {devicesOpen ? <MapIcon /> : <ViewListIcon />}
        </IconButton>
        <OutlinedInput
          ref={inputRef}
          placeholder={t('sharedSearchDevices')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => setDevicesAnchorEl(toolbarRef.current)}
          onBlur={() => setDevicesAnchorEl(null)}
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
        <Popover
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
        </Popover>
        <Popover
          open={!!filterAnchorEl}
          anchorEl={filterAnchorEl}
          onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
        >
          <div className={classes.filterPanel}>
            {/* <FormControl>
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
            </FormControl> */}
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
        </Popover>
        <IconButton edge="end" onClick={() => navigate('/settings/device')} disabled={deviceReadonly}>
          <Tooltip open={!deviceReadonly && Object.keys(devices).length === 0} title={t('deviceRegisterFirst')} arrow>
            <AddIcon />
          </Tooltip>
        </IconButton>
      </div>
      {devicesOpen && <div className={classes.filterContainer}>
        <List className={classes.chipContainer} >
          <Chip
            icon={filter.statuses.includes('running') && <CheckIcon />}
            size="small"
            // color='secondary'
            onClick={() => setFilter({ ...filter, statuses: (!filter.statuses.includes('running') ? 'running' : '') })}
            label={`${checkDeviceCountForStatus('running')} ${t('deviceStatusRunning')}`}
          />
          <Chip
            icon={filter.statuses.includes('stopped') && <CheckIcon />}
            size="small"
            // color='error'
            onClick={() => setFilter({ ...filter, statuses: (!filter.statuses.includes('stopped') ? 'stopped' : '') })}
            label={`${checkDeviceCountForStatus('stopped')} ${t('deviceStatusStopped')}`}
          />
          <Chip
            icon={filter.statuses.includes('idle') && <CheckIcon />}
            size="small"
            // color='warning'
            onClick={() => setFilter({ ...filter, statuses: (!filter.statuses.includes('idle') ? 'idle' : '') })}
            label={`${checkDeviceCountForStatus('idle')} ${t('deviceStatusIdle')}`}
          />
          <Chip
            icon={filter.statuses.includes('online') && <CheckIcon />}
            size="small"
            // color='success'
            // style={{ color: 'white' }}
            onClick={() => setFilter({ ...filter, statuses: (!filter.statuses.includes('online') ? 'online' : '') })}
            label={`${checkDeviceCountForStatus('online')} ${t('deviceStatusOnline')}`}
          />
          <Chip
            icon={filter.statuses.includes('offline') && <CheckIcon />}
            label={`${checkDeviceCountForStatus('offline')} ${t('deviceStatusOffline')}`}
            size="small"
            onClick={() => setFilter({ ...filter, statuses: (!filter.statuses.includes('offline') ? 'offline' : '') })}
          />
          {Object.values(groups).length > 0 && <Divider orientation="vertical" flexItem className={classes.divider} />}
          {Object.values(groups).sort((a, b) => a.name.localeCompare(b.name)).map((group) => (
            <Chip key={group.id} icon={filter.groups === group.id && <CheckIcon />} label={group.name} size="small" onClick={() => setFilter({ ...filter, groups: (filter.groups === group.id ? '' : group.id) })} />
          ))}
        </List>

        <IconButton onClick={(e) => setSortAnchorEl(e.currentTarget)}>
          <SortIcon />
        </IconButton>
      </div>}
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
