import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Table, TableRow, TableCell, TableHead, TableBody, Button, TableFooter, FormControlLabel, Switch, Card, CardContent, Typography, Grid, Box, useMediaQuery, useTheme, Divider, Stack, IconButton, Tooltip, Chip,
  Avatar, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  DirectionsCar, // Car
  LocalShipping, // Truck
  TwoWheeler, // Bike/Motorcycle
  DirectionsBus, // Bus
  AirplanemodeActive, // Aircraft
  DirectionsBoat, // Marine vessel
  Train, // Train
  DevicesOther, // Default
} from '@mui/icons-material';
import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import { formatTime } from '../common/util/formatter';
import { useDeviceReadonly, useManager } from '../common/util/permissions';
import useSettingsStyles from './common/useSettingsStyles';
import DeviceUsersValue from './components/DeviceUsersValue';
import usePersistedState from '../common/util/usePersistedState';
import { useGeneralStore } from '../store/general';
import AssignUserModal from './components/AssignUserModal';
import { BASE_URL } from '../config';

const DevicesPage = () => {
  const classes = useSettingsStyles();
  const navigate = useNavigate();
  const t = useTranslation();
  const { userId } = useParams();
  const router = useLocation();

  const { userRole } = useGeneralStore();
  const groups = useSelector((state) => state.groups.items);

  const manager = useManager();
  const deviceReadonly = useDeviceReadonly();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAll, setShowAll] = usePersistedState('showAllDevices', false);
  const [loading, setLoading] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [successToast, setSuccessToast] = useState(false);
  const [assignedDeviceName, setAssignedDeviceName] = useState('');
  const [alreadyAssignedDialogOpen, setAlreadyAssignedDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ all: showAll });
      const response = await fetch(`/api/devices?${query.toString()}`);
      if (response.ok) {
        setItems(await response.json());
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  }, [timestamp, showAll]);

  const handleExport = () => {
    window.location.assign('/api/reports/devices/xlsx');
  };

  const handleDeviceClick = (deviceId) => {
    if (userId) {
      // Find the selected device from items
      const device = items.find(item => item.id === deviceId);
      setSelectedDevice(device);
      setSelectedDeviceId(deviceId);

      // Check if device is already assigned to this user
      checkDeviceAssignment(deviceId, userId, device);
    }
  };

  const checkDeviceAssignment = async (deviceId, userId, device) => {
    try {
      const resultData = await fetch(`${BASE_URL}/api/node/users/isdevice/assigned/${userId}/${deviceId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await resultData.json();

      if (result.data) {
        // Show the already assigned dialog
        setAlreadyAssignedDialogOpen(true);
      } else {
        // Show the regular assignment dialog
        setAssignModalOpen(true);
      }
    } catch (error) {
      console.error('Error checking device assignment:', error);
      // Fallback to regular assignment dialog in case of error
      setAssignModalOpen(true);
    }
  };

  const handleAssignUser = async (selectedUserId, deviceName) => {
    try {
      // Refresh the device list after assignment
      setTimestamp(Date.now());
      // Show success toast
      setAssignedDeviceName(deviceName);
      setSuccessToast(true);
    } catch (error) {
      console.error('Error handling user assignment:', error);
    }
  };

  const handleContinueAssigning = () => {
    setSuccessToast(false);
  };

  const handleDone = () => {
    setSuccessToast(false);
    // Navigate to users list
    navigate('/settings/users');
  };

  const actionConnections = {
    key: 'connections',
    title: t('sharedConnections'),
    icon: <LinkIcon fontSize="small" />,
    handler: (deviceId) => navigate(`/settings/device/${deviceId}/connections`),
  };

  const renderFieldChip = (icon, value, fallback = t('sharedNone')) => {
    if (!value) return null;
    return (
      <Chip
        size="small"
        icon={icon}
        label={<Typography variant="body2" noWrap>{value || fallback}</Typography>}
        sx={{ m: 0.5 }}
      />
    );
  };

  const getVehicleAvatar = (category) => {
    const avatarStyle = { bgcolor: 'primary.main', color: 'white', width: 40, height: 40 };

    if (!category) {
      return <Avatar sx={avatarStyle}><DevicesOther /></Avatar>;
    }

    const normalizedCategory = category.toLowerCase();

    if (normalizedCategory.includes('car') || normalizedCategory.includes('sedan') || normalizedCategory.includes('suv')) {
      return <Avatar sx={avatarStyle}><DirectionsCar /></Avatar>;
    }
    if (normalizedCategory.includes('truck') || normalizedCategory.includes('lorry') || normalizedCategory.includes('van')) {
      return <Avatar sx={avatarStyle}><LocalShipping /></Avatar>;
    }
    if (normalizedCategory.includes('bike') || normalizedCategory.includes('motorcycle')) {
      return <Avatar sx={avatarStyle}><TwoWheeler /></Avatar>;
    }
    if (normalizedCategory.includes('bicycle') || normalizedCategory.includes('cycle')) {
      return <Avatar sx={avatarStyle}><DirectionsBikeIcon /></Avatar>;
    }
    if (normalizedCategory.includes('bus') || normalizedCategory.includes('coach')) {
      return <Avatar sx={avatarStyle}><DirectionsBus /></Avatar>;
    }
    if (normalizedCategory.includes('air') || normalizedCategory.includes('plane') || normalizedCategory.includes('helicopter')) {
      return <Avatar sx={avatarStyle}><AirplanemodeActive /></Avatar>;
    }
    if (normalizedCategory.includes('boat') || normalizedCategory.includes('ship') || normalizedCategory.includes('marine')) {
      return <Avatar sx={avatarStyle}><DirectionsBoat /></Avatar>;
    }
    if (normalizedCategory.includes('train') || normalizedCategory.includes('rail')) {
      return <Avatar sx={avatarStyle}><Train /></Avatar>;
    }

    return <Avatar sx={avatarStyle}><DevicesOther /></Avatar>;
  };

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'deviceTitle']}>
      <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
      {!loading ? (
        isMobile ? (
          <Grid container spacing={1}>
            {items.filter(filterByKeyword(searchKeyword)).map((item) => {
              const hasAdditionalFields = item.groupId !== 0 && groups[item.groupId]?.name ? true : false || item.phone || item.model || item.contact || item.expirationTime;
              return (
                <Grid item xs={12} key={item.id}>
                  <Card
                    elevation={1}
                    sx={{
                      borderRadius: 2,
                      cursor: userId ? 'pointer' : 'default',
                      '&:hover': userId ? { backgroundColor: 'rgba(0, 0, 0, 0.04)' } : {}
                    }}
                    onClick={() => userId && handleDeviceClick(item.id)}
                  >
                    <CardContent sx={{ p: 1.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ marginBottom: 2 }}>
                        {getVehicleAvatar(item.category)}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={500} noWrap>
                            {item.name}
                          </Typography>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <DeviceHubIcon fontSize="small" color="primary" />
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {item.uniqueId}
                            </Typography>
                          </Stack>
                        </Box>
                        <CollectionActions
                          itemId={item.id}
                          editPath="/settings/device"
                          endpoint="devices"
                          setTimestamp={setTimestamp}
                          customActions={[actionConnections]}
                          readonly={deviceReadonly}
                          icon={<MoreVertIcon />}
                        />
                      </Stack>

                      {hasAdditionalFields && (
                        <>
                          {/* <Divider sx={{ my: 1 }} /> */}
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, marginBottom: 1 }}>
                            {renderFieldChip(<GroupWorkIcon fontSize="small" />, item.groupId ? groups[item.groupId]?.name : null)}
                            {renderFieldChip(<PhoneIphoneIcon fontSize="small" />, item.phone)}
                            {renderFieldChip(<ModelTrainingIcon fontSize="small" />, item.model)}
                            {renderFieldChip(<ContactPhoneIcon fontSize="small" />, item.contact)}
                            {renderFieldChip(<AccessTimeIcon fontSize="small" />, item.expirationTime && formatTime(item.expirationTime, 'date'))}
                          </Box>
                        </>
                      )}

                      {manager && (
                        <>
                          {/* <Divider sx={{ my: 1 }} /> */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="subtitle2" color="text.secondary">{t('settingsUsers')}</Typography>
                            <DeviceUsersValue deviceId={item.id} />
                          </Box>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        ) : (
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell>{t('sharedName')}</TableCell>
                <TableCell>{t('deviceIdentifier')}</TableCell>
                <TableCell>{t('groupParent')}</TableCell>
                <TableCell>{t('sharedPhone')}</TableCell>
                <TableCell>{t('deviceModel')}</TableCell>
                <TableCell>{t('deviceContact')}</TableCell>
                <TableCell>{t('userExpirationTime')}</TableCell>
                {manager && <TableCell>{t('settingsUsers')}</TableCell>}
                <TableCell className={classes.columnAction} />
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading ? items.filter(filterByKeyword(searchKeyword)).map((item) => (
                <TableRow
                  key={item.id}
                  hover={!!userId}
                  style={{ cursor: userId ? 'pointer' : 'default' }}
                  onClick={() => userId && handleDeviceClick(item.id)}
                >
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.uniqueId}</TableCell>
                  <TableCell>{item.groupId ? groups[item.groupId]?.name : null}</TableCell>
                  <TableCell>{item.phone}</TableCell>
                  <TableCell>{item.model}</TableCell>
                  <TableCell>{item.contact}</TableCell>
                  <TableCell>{formatTime(item.expirationTime, 'date')}</TableCell>
                  {manager && <TableCell><DeviceUsersValue deviceId={item.id} /></TableCell>}
                  <TableCell className={classes.columnAction} padding="none">
                    <CollectionActions
                      itemId={item.id}
                      editPath="/settings/device"
                      endpoint="devices"
                      setTimestamp={setTimestamp}
                      customActions={[actionConnections]}
                      readonly={deviceReadonly}
                      onClick={(e) => e.stopPropagation()} // Prevent row click when clicking on actions
                    />
                  </TableCell>
                </TableRow>
              )) : (<TableShimmer columns={manager ? 8 : 7} endAction />)}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell>
                  <Button onClick={handleExport} variant="text">{t('reportExport')}</Button>
                </TableCell>
                <TableCell colSpan={manager ? 8 : 7} align="right">
                  <FormControlLabel
                    control={(
                      <Switch
                        checked={showAll}
                        onChange={(e) => setShowAll(e.target.checked)}
                        size="small"
                      />
                    )}
                    label={t('notificationAlways')}
                    labelPlacement="start"
                    disabled={!manager}
                  />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )
      ) : (
        <Table className={classes.table}>
          <TableBody>
            <TableShimmer columns={manager ? 8 : 7} endAction />
          </TableBody>
        </Table>
      )}
      {(userRole == "admin" || userRole == "distributor") && <CollectionFab editPath={router.pathname.includes('devices/user/') ? '/settings/device/user/' + userId : '/settings/device'} />}

      {/* User Assignment Modal */}
      <AssignUserModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onAssign={handleAssignUser}
        deviceId={selectedDeviceId}
        hasUserId={router.pathname.includes('devices/user/')}
        userId={userId}
      />

      {/* Already Assigned Dialog */}
      <Dialog
        open={alreadyAssignedDialogOpen}
        onClose={() => setAlreadyAssignedDialogOpen(false)}
        PaperProps={{
          sx: {
            width: '400px',
            minWidth: '400px',
            borderRadius: '8px'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeviceHubIcon color="warning" />
            <Typography variant="h6">Device Already Assigned</Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
              <DevicesOther color="primary" />
              <Box>
                <Typography variant="subtitle1" fontWeight="500">
                  {selectedDevice?.name || 'Unknown Device'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedDevice?.uniqueId || 'No identifier'}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body1" color="text.secondary">
              This device is already assigned to this user. Would you like to:
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setAlreadyAssignedDialogOpen(false);
            }}
            sx={{ minWidth: '100px' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              // Force reassignment anyway
              setAlreadyAssignedDialogOpen(false);
              setAssignModalOpen(true);
            }}
            sx={{ minWidth: '100px' }}
          >
            Reassign Anyway
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Toast */}
      <Snackbar
        open={successToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 90, sm: 24 } }}
      >
        <Alert
          severity="success"
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            '& .MuiAlert-action': { alignItems: 'center' }
          }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="primary" size="small" onClick={handleContinueAssigning}>
                Continue Assigning
              </Button>
              <Button color="primary" variant="contained" size="small" onClick={handleDone}>
                Done
              </Button>
            </Box>
          }
        >
          {assignedDeviceName ? `${assignedDeviceName} assigned successfully!` : 'Device assigned successfully!'}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default DevicesPage;
