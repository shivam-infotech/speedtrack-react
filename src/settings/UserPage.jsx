import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormGroup,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  OutlinedInput,
  List,
  ListItem,
  TextareaAutosize,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import CachedIcon from '@mui/icons-material/Cached';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import DevicesIcon from '@mui/icons-material/Devices';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import Fab from '@mui/material/Fab';
import { useDispatch, useSelector } from 'react-redux';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import { useTranslation } from '../common/components/LocalizationProvider';
import useUserAttributes from '../common/attributes/useUserAttributes';
import { sessionActions } from '../store';
import SelectField from '../common/components/SelectField';
import SettingsMenu from './components/SettingsMenu';
import useCommonUserAttributes from '../common/attributes/useCommonUserAttributes';
import { useAdministrator, useRestriction, useManager } from '../common/util/permissions';
import useQuery from '../common/util/useQuery';
import { useCatch } from '../reactHelper';
import useMapStyles from '../map/core/useMapStyles';
import { map } from '../map/core/MapView';
import useSettingsStyles from './common/useSettingsStyles';
import AttachDeviceModal from './components/AttachDeviceModal';
import { useGeneralStore } from '../store/general';
import { BASE_URL } from '../config';

const UserPage = () => {
  const classes = useSettingsStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();
  const router = useLocation();

  const admin = useAdministrator();
  const manager = useManager();
  const fixedEmail = useRestriction('fixedEmail');
  const [usernameError, setUsernameError] = useState(null);

  const currentUser = useSelector((state) => state.session.user);
  const registrationEnabled = useSelector((state) => state.session.server.registration);
  const openIdForced = useSelector((state) => state.session.server.openIdForce);
  const totpEnable = useSelector((state) => state.session.server.attributes.totpEnable);
  const totpForce = useSelector((state) => state.session.server.attributes.totpForce);

  const mapStyles = useMapStyles();
  const commonUserAttributes = useCommonUserAttributes(t);
  const userAttributes = useUserAttributes(t);

  const { id, deviceId } = useParams();
  const [item, setItem] = useState(id === currentUser.id.toString() ? currentUser : null);
  const [additionalData, setAdditionalData] = useState({ phone: null, email: null, username: null });
  const [deleteEmail, setDeleteEmail] = useState();
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [attachDeviceModalOpen, setAttachDeviceModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const { setHasSavedUser, userData } = useGeneralStore();
  const [savedUserId, setSavedUserId] = useState(null);

  const handleDelete = useCatch(async () => {
    if (deleteEmail === currentUser.email) {
      setDeleteFailed(false);
      const response = await fetch(`/api/users/${currentUser.id}`, { method: 'DELETE' });
      if (response.ok) {
        navigate('/login');
        dispatch(sessionActions.updateUser(null));
      } else {
        throw Error(await response.text());
      }
    } else {
      setDeleteFailed(true);
    }
  });

  useEffect(() => {
    async function fetchAdditionalData() {
      if (id) {
        const additionalUserData = await fetch(`${BASE_URL}/api/node/users/distributor/${id}`);
        if (additionalUserData.ok) {
          const additionalData = await additionalUserData.json();
          setAdditionalData(additionalData.data);
          setAdditionalData({ ...additionalData.data, role: additionalData.data.user_type === 'distributor' ? 2 : 1 })
        }
      }
    }
    fetchAdditionalData();
  }, [id]);

  const handleGenerateTotp = useCatch(async () => {
    const response = await fetch('/api/users/totp', { method: 'POST' });
    if (response.ok) {
      setItem({ ...item, totpKey: await response.text() });
    } else {
      throw Error(await response.text());
    }
  });

  const query = useQuery();
  const [queryHandled, setQueryHandled] = useState(false);
  const attribute = query.get('attribute');

  useEffect(() => {
    if (!queryHandled && item && attribute) {
      if (!item.attributes.hasOwnProperty('attribute')) {
        const updatedAttributes = { ...item.attributes };
        updatedAttributes[attribute] = '';
        setItem({ ...item, attributes: updatedAttributes });
      }
      setQueryHandled(true);
    }
  }, [item, queryHandled, setQueryHandled, attribute]);

  const onItemSaved = (result) => {
    saveAdditionalData(result);
    if (result.id === currentUser.id) {
      dispatch(sessionActions.updateUser(result));
    }
    setSavedUserId(result.id);
    setSuccessModalOpen(true);
  };

  useEffect(() => {

    setHasSavedUser(false)
  }, [])

  useEffect(() => {
    setIsDisabled(false);
    if (usernameError != null) {
      setIsDisabled(true);
    }
  }, [additionalData]);

  const saveAdditionalData = async (result) => {
    const mergedData = { ...item, ...additionalData };
    mergedData.userId = result.id;
    if (userData?.user_type === 'distributor') {
      mergedData.parent_user_id = userData.user_id;
    }
    const resultData = await fetch(`${BASE_URL}/api/node/users/distributor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mergedData),
    });
    setIsDisabled(true);
    setHasSavedUser(result.id);
    if (deviceId) {
      await fetch(`/api/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: result.id,
          deviceId: deviceId,
        }),
      });
    }
    return;
  }


  const validateUserName = async (e) => {
    const username = e.target.value;
    const response = await fetch(`${BASE_URL}/api/node/users/validate/${username}`);
    if (response.ok) {
      const data = await response.json();
      if (data.isExists) {
        setUsernameError('Username not available');
      } else {
        setUsernameError(null);
        // let customEmail = additionalData.username + "_user_user@speedtrack.com";
        // additionalData.email = customEmail;
        // setAdditionalData({ ...additionalData, email: customEmail });
        // item.email = customEmail;
        // setItem({ ...item, email: customEmail });
      }
    } else {
      throw Error(await response.text());
    }
  }


  const validate = () => item && item.name && (item.id || item.password) && (admin || !totpForce || item.totpKey);

  return (
    <EditItemView
      endpoint="users"
      from="create_user"
      allowGoBack={false}
      item={item}
      isDisabled={isDisabled}
      setItem={setItem}
      defaultItem={admin ? { deviceLimit: -1 } : {}}
      validate={validate}
      onItemSaved={onItemSaved}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'settingsUser']}
    >
      {item && (
        <>
          <Accordion defaultExpanded={!attribute}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                {t('sharedRequired')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <TextField
                value={item.name || ''}
                onChange={(e) => setItem({ ...item, name: e.target.value })}
                label={"Company Name"}
              />
              <TextField
                onBlur={validateUserName}
                value={additionalData.username || ''}
                onChange={(e) => setAdditionalData({ ...additionalData, username: e.target.value })}
                label={"Username"}
                error={usernameError !== null}
                helperText={usernameError}
              />
              {!openIdForced && (
                <TextField
                  type="password"
                  onChange={(e) => setItem({ ...item, password: e.target.value })}
                  label={t('userPassword')}
                />
              )}

              <TextField
                value={additionalData.email || ''}
                onChange={(e) => setAdditionalData({ ...additionalData, email: e.target.value })}
                label={t('userEmail')}
                disabled={fixedEmail && item.id === currentUser.id}
              />
              <TextField
                value={additionalData.phone || ''}
                onChange={(e) => setAdditionalData({ ...additionalData, phone: e.target.value })}
                label={"Mobile"}
                disabled={fixedEmail && item.id === currentUser.id}
              />

              <TextField
                value={additionalData.address || ''}
                onChange={(e) => setAdditionalData({ ...additionalData, address: e.target.value })}
                label={"Address"}
                multiline
                rows={4}
              />
              {(userData?.user_type === 'admin' || userData?.user_type === 'distributor') && (
                <SelectField
                  fullWidth
                  label={"Role"}
                  value={additionalData.role || ''}
                  onChange={(e) => setAdditionalData({ ...additionalData, role: e.target.value })}
                  data={[
                    { id: 1, name: "user" },
                    { id: 2, name: "admin" }
                  ]}
                />
              )}
              {additionalData.role === 2 && (
                <div className={classes.details}>
                  <FormControl fullWidth>
                    <InputLabel>Limit Type</InputLabel>
                    <Select
                      value={(additionalData.limit_type)}
                      onChange={(e) => setAdditionalData({ ...additionalData, limit_type: e.target.value })}
                      label="Limit Type"
                    >
                      <MenuItem value="device">License</MenuItem>
                      <MenuItem value="credit">Credit</MenuItem>
                    </Select>
                  </FormControl>

                  {(!additionalData.limit_type || additionalData.limit_type === 'device') && (
                    <FormControl fullWidth>
                      <TextField
                        value={additionalData.device_limit || ''}
                        onChange={(e) => setAdditionalData({ ...additionalData, device_limit: e.target.value })}
                        label={"Device Limit"}
                        type="number"
                        fullWidth
                      />
                    </FormControl>
                  )}

                  {(additionalData.limit_type === 'credit') && (
                    <>
                      <TextField
                        type="number"
                        label="Credits"
                        value={(additionalData.credits)}
                        onChange={(e) => setAdditionalData({ ...additionalData, credits: e.target.value })}
                        fullWidth
                      />
                      <TextField
                        type="number"
                        label="Charge Per Day"
                        value={(additionalData.per_device_credit)}
                        onChange={(e) => setAdditionalData({ ...additionalData, per_device_credit: e.target.value })}
                        fullWidth
                      />
                    </>
                  )}
                </div>
              )}

            </AccordionDetails>
          </Accordion>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                Other Settings
              </Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <TextField
                type="text"
                value={additionalData.latitude}
                onChange={(e) => setAdditionalData({ ...additionalData, latitude: e.target.value })}
                label={t('positionLatitude')}
              />
              <TextField
                type="text"
                value={additionalData.longitude}
                onChange={(e) => setAdditionalData({ ...additionalData, longitude: e.target.value })}
                label={t('positionLongitude')}
              />
              <TextField
                type="number"
                value={additionalData.zoom || 0}
                onChange={(e) => setAdditionalData({ ...additionalData, zoom: Number(e.target.value) })}
                label={t('serverZoom')}
              />
              <FormControl>
                <InputLabel>{t('settingsCoordinateFormat')}</InputLabel>
                <Select
                  label={t('settingsCoordinateFormat')}
                  value={additionalData.coordinateFormat || 'dd'}
                  onChange={(e) => setAdditionalData({ ...additionalData, coordinateFormat: e.target.value })}
                >
                  <MenuItem value="dd">{t('sharedDecimalDegrees')}</MenuItem>
                  <MenuItem value="ddm">{t('sharedDegreesDecimalMinutes')}</MenuItem>
                  <MenuItem value="dms">{t('sharedDegreesMinutesSeconds')}</MenuItem>
                </Select>
              </FormControl>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={additionalData.twelveHourFormat || false}
                      onChange={(e) => setAdditionalData({ ...additionalData, twelveHourFormat: e.target.checked })}
                    />
                  }
                  label="Twelve Hour Format"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={additionalData.disabled || false}
                      onChange={(e) => setAdditionalData({ ...additionalData, disabled: e.target.checked })}
                    />
                  }
                  label={t('sharedDisabled')}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={additionalData.readonly || false}
                      onChange={(e) => setAdditionalData({ ...additionalData, readonly: e.target.checked })}
                    />
                  }
                  label="Is Read Only"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={additionalData.deviceReadonly || false}
                      onChange={(e) => setAdditionalData({ ...additionalData, deviceReadonly: e.target.checked })}
                    />
                  }
                  label="Is Device Read Only"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={additionalData.limitCommands || false}
                      onChange={(e) => setAdditionalData({ ...additionalData, limitCommands: e.target.checked })}
                    />
                  }
                  label="Limit Commands"
                />
              </FormGroup>
              <TextField
                label="Expiry Date"
                type="date"
                value={additionalData.expiryDate ? additionalData.expiryDate.split('T')[0] : (() => {
                  // Set default expiry date to one year from now
                  const nextYear = new Date();
                  nextYear.setFullYear(nextYear.getFullYear() + 1);
                  return nextYear.toISOString().split('T')[0];
                })()}
                onChange={(e) => {
                  if (e.target.value) {
                    setAdditionalData({ ...additionalData, expiryDate: new Date(e.target.value).toISOString() });
                  } else {
                    setAdditionalData({ ...additionalData, expiryDate: null });
                  }
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </AccordionDetails>
          </Accordion>
          {
            id && (
              <Fab
                color="primary"
                aria-label="attach devices"
                onClick={() => setAttachDeviceModalOpen(true)}
                sx={{
                  position: 'fixed',
                  bottom: 80,
                  right: 16,
                  zIndex: 1000
                }}
              >
                <LocalShippingIcon />
              </Fab>
            )
          }


          <AttachDeviceModal
            navigate={navigate}
            open={attachDeviceModalOpen}
            onClose={() => setAttachDeviceModalOpen(false)}
            onAttach={(deviceIds) => {
              // Handle successful device attachment
              console.log('Attached devices:', deviceIds);
            }}
            userId={id}
          />

          {/* Success Modal */}
          <Dialog
            open={successModalOpen}
            onClose={() => setSuccessModalOpen(false)}
            PaperProps={{
              sx: {
                width: '300px',
                minWidth: '300px',
                borderRadius: '8px'
              }
            }}
          >
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="subtitle1" fontWeight="500" textAlign="center">
                User saved successfully!
              </Typography>

              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => {
                    setSuccessModalOpen(false);
                    if (deviceId) {
                      navigate(`/settings/devices`);
                    } else {
                      navigate(`/settings/users`);
                    }
                  }}
                  sx={{ minWidth: '100px' }}
                  autoFocus
                >
                  OK
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<WhatsAppIcon />}
                  onClick={() => {
                    // Create WhatsApp share URL with username and password
                    const username = additionalData.username || '';
                    const password = item.password || '';
                    const message = `SpeedTrack User Details:\nUsername: ${username}\nPassword: ${password}`;
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  sx={{ minWidth: '100px' }}
                >
                  Share
                </Button>
              </Box>
              {savedUserId && !router.pathname.includes('device/create/user') && (
                <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center' }}>
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<LocalShippingIcon />}
                    onClick={() => {
                      navigate(`/settings/devices/user/${savedUserId}`)
                    }}
                    sx={{ minWidth: '100px' }}
                    autoFocus
                  >
                    Assign Device
                  </Button>
                </Box>
              )}
            </Box>
          </Dialog>

          {/* <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                {t('sharedPreferences')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <TextField
                value={item.phone || ''}
                onChange={(e) => setItem({ ...item, phone: e.target.value })}
                label={t('sharedPhone')}
              />
              <FormControl>
                <InputLabel>{t('mapDefault')}</InputLabel>
                <Select
                  label={t('mapDefault')}
                  value={item.map || 'locationIqStreets'}
                  onChange={(e) => setItem({ ...item, map: e.target.value })}
                >
                  {mapStyles.filter((style) => style.available).map((style) => (
                    <MenuItem key={style.id} value={style.id}>
                      <Typography component="span">{style.title}</Typography>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>{t('settingsCoordinateFormat')}</InputLabel>
                <Select
                  label={t('settingsCoordinateFormat')}
                  value={item.coordinateFormat || 'dd'}
                  onChange={(e) => setItem({ ...item, coordinateFormat: e.target.value })}
                >
                  <MenuItem value="dd">{t('sharedDecimalDegrees')}</MenuItem>
                  <MenuItem value="ddm">{t('sharedDegreesDecimalMinutes')}</MenuItem>
                  <MenuItem value="dms">{t('sharedDegreesMinutesSeconds')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>{t('settingsSpeedUnit')}</InputLabel>
                <Select
                  label={t('settingsSpeedUnit')}
                  value={(item.attributes && item.attributes.speedUnit) || 'kn'}
                  onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, speedUnit: e.target.value } })}
                >
                  <MenuItem value="kn">{t('sharedKn')}</MenuItem>
                  <MenuItem value="kmh">{t('sharedKmh')}</MenuItem>
                  <MenuItem value="mph">{t('sharedMph')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>{t('settingsDistanceUnit')}</InputLabel>
                <Select
                  label={t('settingsDistanceUnit')}
                  value={(item.attributes && item.attributes.distanceUnit) || 'km'}
                  onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, distanceUnit: e.target.value } })}
                >
                  <MenuItem value="km">{t('sharedKm')}</MenuItem>
                  <MenuItem value="mi">{t('sharedMi')}</MenuItem>
                  <MenuItem value="nmi">{t('sharedNmi')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>{t('settingsAltitudeUnit')}</InputLabel>
                <Select
                  label={t('settingsAltitudeUnit')}
                  value={(item.attributes && item.attributes.altitudeUnit) || 'm'}
                  onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, altitudeUnit: e.target.value } })}
                >
                  <MenuItem value="m">{t('sharedMeters')}</MenuItem>
                  <MenuItem value="ft">{t('sharedFeet')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>{t('settingsVolumeUnit')}</InputLabel>
                <Select
                  label={t('settingsVolumeUnit')}
                  value={(item.attributes && item.attributes.volumeUnit) || 'ltr'}
                  onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, volumeUnit: e.target.value } })}
                >
                  <MenuItem value="ltr">{t('sharedLiter')}</MenuItem>
                  <MenuItem value="usGal">{t('sharedUsGallon')}</MenuItem>
                  <MenuItem value="impGal">{t('sharedImpGallon')}</MenuItem>
                </Select>
              </FormControl>
              <SelectField
                value={item.attributes && item.attributes.timezone}
                onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, timezone: e.target.value } })}
                endpoint="/api/server/timezones"
                keyGetter={(it) => it}
                titleGetter={(it) => it}
                label={t('sharedTimezone')}
              />
              <TextField
                value={item.poiLayer || ''}
                onChange={(e) => setItem({ ...item, poiLayer: e.target.value })}
                label={t('mapPoiLayer')}
              />
            </AccordionDetails>
          </Accordion> */}
          {/* <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                {t('sharedLocation')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <TextField
                type="number"
                value={item.latitude || 0}
                onChange={(e) => setItem({ ...item, latitude: Number(e.target.value) })}
                label={t('positionLatitude')}
              />
              <TextField
                type="number"
                value={item.longitude || 0}
                onChange={(e) => setItem({ ...item, longitude: Number(e.target.value) })}
                label={t('positionLongitude')}
              />
              <TextField
                type="number"
                value={item.zoom || 0}
                onChange={(e) => setItem({ ...item, zoom: Number(e.target.value) })}
                label={t('serverZoom')}
              />
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  const { lng, lat } = map.getCenter();
                  setItem({
                    ...item,
                    latitude: Number(lat.toFixed(6)),
                    longitude: Number(lng.toFixed(6)),
                    zoom: Number(map.getZoom().toFixed(1)),
                  });
                }}
              >
                {t('mapCurrentLocation')}
              </Button>
            </AccordionDetails>
          </Accordion> */}
          {/* <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                {t('sharedPermissions')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <TextField
                label={t('userExpirationTime')}
                type="date"
                value={item.expirationTime ? item.expirationTime.split('T')[0] : '2099-01-01'}
                onChange={(e) => {
                  if (e.target.value) {
                    setItem({ ...item, expirationTime: new Date(e.target.value).toISOString() });
                  }
                }}
                disabled={!manager}
              />
              <TextField
                type="number"
                value={item.deviceLimit || 0}
                onChange={(e) => setItem({ ...item, deviceLimit: Number(e.target.value) })}
                label={t('userDeviceLimit')}
                disabled={!admin}
              />
              <TextField
                type="number"
                value={item.userLimit || 0}
                onChange={(e) => setItem({ ...item, userLimit: Number(e.target.value) })}
                label={t('userUserLimit')}
                disabled={!admin}
              />
              <FormGroup>
                <FormControlLabel
                  control={<Checkbox checked={item.disabled} onChange={(e) => setItem({ ...item, disabled: e.target.checked })} />}
                  label={t('sharedDisabled')}
                  disabled={!manager}
                />
                <FormControlLabel
                  control={<Checkbox checked={item.administrator} onChange={(e) => setItem({ ...item, administrator: e.target.checked })} />}
                  label={t('userAdmin')}
                  disabled={!admin}
                />
                <FormControlLabel
                  control={<Checkbox checked={item.readonly} onChange={(e) => setItem({ ...item, readonly: e.target.checked })} />}
                  label={t('serverReadonly')}
                  disabled={!manager}
                />
                <FormControlLabel
                  control={<Checkbox checked={item.deviceReadonly} onChange={(e) => setItem({ ...item, deviceReadonly: e.target.checked })} />}
                  label={t('userDeviceReadonly')}
                  disabled={!manager}
                />
                <FormControlLabel
                  control={<Checkbox checked={item.limitCommands} onChange={(e) => setItem({ ...item, limitCommands: e.target.checked })} />}
                  label={t('userLimitCommands')}
                  disabled={!manager}
                />
                <FormControlLabel
                  control={<Checkbox checked={item.disableReports} onChange={(e) => setItem({ ...item, disableReports: e.target.checked })} />}
                  label={t('userDisableReports')}
                  disabled={!manager}
                />
                <FormControlLabel
                  control={<Checkbox checked={item.fixedEmail} onChange={(e) => setItem({ ...item, fixedEmail: e.target.checked })} />}
                  label={t('userFixedEmail')}
                  disabled={!manager}
                />
              </FormGroup>
            </AccordionDetails>
          </Accordion> */}
          {/* <EditAttributesAccordion
            attribute={attribute}
            attributes={item.attributes}
            setAttributes={(attributes) => setItem({ ...item, attributes })}
            definitions={{ ...commonUserAttributes, ...userAttributes }}
            focusAttribute={attribute}
          /> */}
          {/* {registrationEnabled && item.id === currentUser.id && !manager && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1" color="error">
                  {t('userDeleteAccount')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <TextField
                  value={deleteEmail}
                  onChange={(e) => setDeleteEmail(e.target.value)}
                  label={t('userEmail')}
                  error={deleteFailed}
                />
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDelete}
                  startIcon={<DeleteForeverIcon />}
                >
                  {t('userDeleteAccount')}
                </Button>
              </AccordionDetails>
            </Accordion>
          )} */}
        </>
      )}
    </EditItemView>
  );
};

export default UserPage;
