import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Table, TableRow, TableCell, TableHead, TableBody, Switch, TableFooter, FormControlLabel,
  Card, CardContent, Typography, Grid, Box, Divider, Stack, Avatar, Chip, useMediaQuery, useTheme,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar, Alert,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LinkIcon from '@mui/icons-material/Link';
import EmailIcon from '@mui/icons-material/Email';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import DevicesIcon from '@mui/icons-material/Devices';
import BlockIcon from '@mui/icons-material/Block';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PhoneIcon from '@mui/icons-material/Phone';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useCatch, useEffectAsync } from '../reactHelper';
import { formatBoolean, formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import { useManager } from '../common/util/permissions';
import SearchHeader, { filterByKeyword } from './components/SearchHeader';
import useSettingsStyles from './common/useSettingsStyles';
import { useGeneralStore } from '../store/general';
import { BASE_URL } from '../config';

const UsersPage = () => {
  const classes = useSettingsStyles();
  const navigate = useNavigate();
  const t = useTranslation();
  const { deviceId } = useParams();

  const manager = useManager();
  const router = useLocation();
  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [temporary, setTemporary] = useState(false);
  const [isDeviceAssignUser, setIsDeviceAssignUser] = useState(false);

  // Dialog state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [alreadyAssignedDialogOpen, setAlreadyAssignedDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [successToast, setSuccessToast] = useState(false);
  const [assignedDeviceName, setAssignedDeviceName] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isUserRemoved, setIsUserRemoved, userToRemove, userRole } = useGeneralStore();
  const handleLogin = useCatch(async (userId) => {
    const response = await fetch(`/api/session/${userId}`);
    if (response.ok) {
      window.location.replace('/');
    } else {
      throw Error(await response.text());
    }
  });

  const actionLogin = {
    key: 'login',
    title: t('loginLogin'),
    icon: <LoginIcon fontSize="small" />,
    handler: handleLogin,
  };

  const actionConnections = {
    key: 'connections',
    title: t('sharedConnections'),
    icon: <LinkIcon fontSize="small" />,
    handler: (userId) => navigate(`/settings/user/${userId}/connections`),
  };

  useEffect(() => {
    if (router.pathname.includes('device/assign/user')) {
      setIsDeviceAssignUser(true);
    }
  }, [router]);


  useEffectAsync(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        setItems(await response.json());
      } else {
        throw Error(await response.text());
      }
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  const renderStatusChip = (value, label, icon, color) => {
    if (!value) return null;
    return (
      <Chip
        size="small"
        icon={icon}
        label={label}
        color={color}
        variant="outlined"
        sx={{ m: 0.5 }}
      />
    );
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

  useEffect(() => {
    const deleteUser = async (userId) => {
      const response = await fetch(`${BASE_URL}/api/node/users/delete`, {
        method: 'DELETE',
        body: JSON.stringify({ userId: userId }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        setIsUserRemoved(false);
      } else {
        throw Error(await response.text());
      }
    }
    if (isUserRemoved) {
      deleteUser(userToRemove);
      setIsUserRemoved(false);
    }
  }, [isUserRemoved]);

  const handleUserClick = (userId) => {
    if (deviceId) {
      // Find the selected user from items
      const user = items.find(item => item.id === userId);
      setSelectedUser(user);
      setAssignDialogOpen(true);
    }
  };

  const assignDevice = async () => {
    try {
      if (deviceId && selectedUser?.id) {
        await fetch(`/api/permissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedUser.id,
            deviceId: deviceId,
          }),
        });
        // Show success toast
        setAssignedDeviceName(selectedUser.name || 'User');
        setSuccessToast(true);
      }
    } catch (error) {
      console.error('Error assigning device:', error);
    }
  };

  const handleContinueAssigning = () => {
    setSuccessToast(false);
  };

  const handleDone = () => {
    setSuccessToast(false);
    // Navigate to devices page
    navigate('/settings/devices');
  };

  const assignUserToDevice = async () => {
    try {
      // Ensure we have the user data before proceeding
      if (!selectedUser || !selectedUser.id) {
        console.error('No user selected');
        return;
      }

      // Store the current user data in a local variable to ensure it's preserved
      const currentUser = { ...selectedUser };

      const resultData = await fetch(`${BASE_URL}/api/node/users/isdevice/assigned/${currentUser.id}/${deviceId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await resultData.json();

      if (result.data) {
        // Make sure we're using the preserved user data
        setSelectedUser(currentUser); // Ensure the user data is set again before showing dialog
        // Show the already assigned dialog instead of alert
        setAlreadyAssignedDialogOpen(true);
      } else {
        // Proceed with assignment
        await assignDevice();
      }
    } catch (error) {
      console.error('Error checking device assignment:', error);
    }
  };

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'settingsUsers']}>
      <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
      {!loading ? (
        isMobile ? (
          <Grid container spacing={1} style={{ marginBottom: '2rem' }}>
            {items.filter((u) => temporary || !u.temporary).filter(filterByKeyword(searchKeyword)).map((item) => {
              const hasAdditionalFields = item.phone || item.disabled || item.administrator || item.expirationTime;

              return (
                <Grid item xs={12} key={item.id} onClick={() => handleUserClick(item.id)}>
                  <Card elevation={1} sx={{ borderRadius: 2 }}>
                    {/* onClick={() => navigate(`/settings/user/${item.id}`)} */}
                    <CardContent sx={{ p: 1.5 }} >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          {item.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={500} noWrap>
                            {item.name}
                          </Typography>
                          {/* <Stack direction="row" spacing={0.5} alignItems="center">
                            <EmailIcon fontSize="small" color="primary" />
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {item.email}
                            </Typography>
                          </Stack> */}
                        </Box>
                        <CollectionActions
                          itemId={item.id}
                          editPath="/settings/user"
                          endpoint="users"
                          setTimestamp={setTimestamp}
                          customActions={manager ? [actionLogin] : []}
                          icon={<MoreVertIcon />}
                        />
                      </Stack>

                      {hasAdditionalFields && (
                        <>
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {renderFieldChip(<PhoneIcon fontSize="small" />, item.phone)}
                            {renderStatusChip(item.administrator, t('userAdmin'), <AdminPanelSettingsIcon fontSize="small" />, 'primary')}
                            {renderStatusChip(item.disabled, t('sharedDisabled'), <BlockIcon fontSize="small" />, 'error')}
                            {renderFieldChip(<AccessTimeIcon fontSize="small" />, item.expirationTime && formatTime(item.expirationTime, 'date'))}
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
                <TableCell>{t('userEmail')}</TableCell>
                <TableCell>{t('sharedPhone')}</TableCell>
                <TableCell>{t('userAdmin')}</TableCell>
                <TableCell>{t('sharedDisabled')}</TableCell>
                <TableCell>{t('userExpirationTime')}</TableCell>
                <TableCell className={classes.columnAction} />
              </TableRow>
            </TableHead>
            <TableBody>
              {items.filter((u) => temporary || !u.temporary).filter(filterByKeyword(searchKeyword)).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: 14, bgcolor: theme.palette.primary.main }}>
                        {item.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography>{item.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{item.email}</TableCell>
                  <TableCell>{item.phone || '-'}</TableCell>
                  <TableCell>{formatBoolean(item.administrator, t)}</TableCell>
                  <TableCell>{formatBoolean(item.disabled, t)}</TableCell>
                  <TableCell>{formatTime(item.expirationTime, 'date')}</TableCell>
                  <TableCell className={classes.columnAction} padding="none">
                    <CollectionActions
                      itemId={item.id}
                      editPath="/settings/user"
                      endpoint="users"
                      setTimestamp={setTimestamp}
                      customActions={manager ? [actionLogin] : []}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={7} align="right">
                  <FormControlLabel
                    control={(
                      <Switch
                        value={temporary}
                        onChange={(e) => setTemporary(e.target.checked)}
                        size="small"
                      />
                    )}
                    label={t('userTemporary')}
                    labelPlacement="start"
                  />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        )
      ) : (
        <TableShimmer columns={isMobile ? 1 : 7} endAction />
      )}
      {
        ((userRole == 'admin' || userRole == 'distributor') && !isDeviceAssignUser) &&
        <CollectionFab editPath="/settings/user" />
      }
      {
        ((userRole == 'admin' || userRole == 'distributor') && isDeviceAssignUser) &&
        <CollectionFab editPath={`/settings/device/create/user/${deviceId}`} />
      }
      <Dialog
        open={assignDialogOpen}
        onClose={() => {
          setAssignDialogOpen(false);
          setSelectedUser(null);
        }}
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
            <DevicesIcon color="primary" />
            <Typography variant="h6">Assign User to Device</Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <PersonIcon color="primary" />
              <Box>
                <Typography variant="subtitle1" fontWeight="500">
                  {selectedUser?.name || 'Unknown User'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedUser?.email || 'No email'}
                </Typography>
              </Box>
            </Box>

            <Typography variant="body1" color="text.secondary">
              Are you sure you want to assign this user to the created device?
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setAssignDialogOpen(false);
              setSelectedUser(null);
            }}
            sx={{ minWidth: '100px' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              assignUserToDevice();
              setAssignDialogOpen(false);
              setSelectedUser(null);
            }}
            sx={{ minWidth: '100px' }}
            autoFocus
          >
            Assign User
          </Button>
        </DialogActions>
      </Dialog>

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
            <DevicesIcon color="warning" />
            <Typography variant="h6">Device Already Assigned</Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
              <PersonIcon color="primary" />
              <Box>
                <Typography variant="subtitle1" fontWeight="500">
                  {selectedUser?.name || 'Unknown User'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedUser?.email || 'No email'}
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
              // Force reassignment if needed
              assignDevice();
              setAlreadyAssignedDialogOpen(false);
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
          {assignedDeviceName ? `${assignedDeviceName} assigned to device successfully!` : 'User assigned to device successfully!'}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default UsersPage;
