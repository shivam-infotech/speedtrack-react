import React, { useCallback, useEffect, useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControlLabel,
  Checkbox,
  TextField,
  FormControl,
  Paper,
  useTheme,
  Alert,
  InputAdornment,
  IconButton,
  Dialog,
  Box,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import MessageIcon from '@mui/icons-material/Message';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import SendIcon from '@mui/icons-material/Send';
import { DropzoneArea } from 'react-mui-dropzone';
import { Close } from '@mui/icons-material';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import SelectField from '../common/components/SelectField';
import deviceCategories from '../common/util/deviceCategories';
import { useTranslation } from '../common/components/LocalizationProvider';
import useDeviceAttributes from '../common/attributes/useDeviceAttributes';
import { useAdministrator } from '../common/util/permissions';
import SettingsMenu from './components/SettingsMenu';
import useCommonDeviceAttributes from '../common/attributes/useCommonDeviceAttributes';
import { useCatch } from '../reactHelper';
import useQuery from '../common/util/useQuery';
import useSettingsStyles from './common/useSettingsStyles';
import { useParams } from 'react-router-dom';
import { useGeneralStore } from '../store/general';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../config';

const DevicePage = () => {
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  // Example list of SMS commands for GPS devices
  const smsCommands = [
    'STATUS#',
    'RESTART#',
    'RESET#',
    'GPRS123456',
    'APN123456 internet',
    // Add more as needed
  ];
  const classes = useSettingsStyles();
  const t = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { userId } = useParams();
  const { setHasSavedDevice, setSavedDeviceId, userData } = useGeneralStore()

  const admin = useAdministrator();

  const commonDeviceAttributes = useCommonDeviceAttributes(t);
  const deviceAttributes = useDeviceAttributes(t);

  const query = useQuery();
  const uniqueId = query.get('uniqueId');

  const [protocols, setProtocols] = useState([]);
  const [protocol, setProtocol] = useState(null);
  const [item, setItem] = useState(uniqueId ? { uniqueId } : null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [allowGoBack, setAllowGoBack] = useState(false);
  const [savedDevices, setSavedDevices] = useState(0);

  useEffect(() => {
    if (userId) {
      setAllowGoBack(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userData && userData.user_id) {
      const fetchNodeData = async () => {
        try {
          const response = await fetch(`${BASE_URL}/api/node/users/devices/${userData.user_id}`);
          if (response.ok) {
            const data = await response.json();
            setSavedDevices(data.data.length);
          } else {
            console.error('Failed to fetch node data');
          }
        } catch (error) {
          console.error('Error fetching node data:', error);
        }
      };

      fetchNodeData();
    }
  }, [userData]);

  useEffect(() => {
    setHasSavedDevice(false);
    setSavedDeviceId(null);
  }, []);

  // Handle barcode data coming from React Native
  useEffect(() => {
    // Define the handler function for direct function call
    window.handleBarcodeData = (barcodeType, barcodeData) => {
      console.log('Received barcode data via function call:', barcodeType, barcodeData);
      if (barcodeData) {
        setItem({ ...item, uniqueId: barcodeData });
      }
    };

    // Define the handler for postMessage events
    const handlePostMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'barcode-data') {
          console.log('Received barcode data via postMessage:', data.barcodeType, data.barcodeData);
          if (data.barcodeData) {
            setItem({ ...item, uniqueId: data.barcodeData });
          }
        }
      } catch (error) {
        console.error('Error parsing postMessage data:', error);
      }
    };

    // Add event listener for postMessage
    window.addEventListener('message', handlePostMessage);

    // Cleanup function
    return () => {
      window.removeEventListener('message', handlePostMessage);
      delete window.handleBarcodeData;
    };
  }, [item, setItem]);

  const handleFiles = useCatch(async (files) => {
    if (files.length > 0) {
      const response = await fetch(`/api/devices/${item.id}/image`, {
        method: 'POST',
        body: files[0],
      });
      if (response.ok) {
        setItem({ ...item, attributes: { ...item.attributes, deviceImage: await response.text() } });
      } else {
        throw Error(await response.text());
      }
    }
  });

  const fetchProtocols = useCallback(async () => {
    try {
      const res = await fetch('/api/protocols');
      const protos = await res.json();
      setProtocols(protos);
    } catch (error) {
      console.error('Fail to fetch the protocols', error);
    }
  }, []);

  const validate = () => item && item.name && item.uniqueId;

  useEffect(() => {
    if (!protocols.length) fetchProtocols();
  });

  useEffect(() => {
    if (item?.model != null && protocols.length > 0) {
      const proto = protocols.find((p) => p.device === item.model);
      if (proto) setProtocol(proto.id);
    }
  }, [item, protocols]);

  const onItemSaved = useCatch(async (result) => {
    setHasSavedDevice(true);
    setSavedDeviceId(result.id);
    if (userId) {
      await fetch(`/api/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          deviceId: result.id,
        }),
      });
      setSuccessModalOpen(true);
    } else {
      setSuccessModalOpen(true);
    }
  });

  return (
    <>
      <EditItemView
        endpoint="devices"
        from="create_device"
        item={item}
        allowGoBack={allowGoBack}
        onItemSaved={onItemSaved}
        hideButtons={savedDevices >= userData.device_limit && userData.user_type !== 'admin'}
        setItem={setItem}
        // whenItemsLoaded={(res) => { console.log(res, protocols); res?.model != null && setProtocol(protocols.find(p => p.device === res.model)) }}
        validate={validate}
        menu={<SettingsMenu />}
        breadcrumbs={['settingsTitle', 'sharedDevice']}
      >
        {savedDevices >= userData.device_limit && userData.user_type !== 'admin' && <Alert severity="error">You have reached the maximum number of devices you can create.</Alert>}
        {(savedDevices < userData.device_limit || userData.user_type === 'admin') && item && (
          <>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  {t('sharedRequired')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <TextField
                  value={item.name || ''}
                  onChange={(event) => setItem({ ...item, name: event.target.value })}
                  label={"Vehicle Number"}
                />
                <TextField
                  value={item.uniqueId || ''}
                  onChange={(event) => setItem({ ...item, uniqueId: event.target.value })}
                  label={`${t('deviceIdentifier')} / ${t('deviceImei')}`}
                  helperText={t('deviceIdentifierHelp')}
                  disabled={Boolean(uniqueId)}
                  size="small"
                  sx={{ width: '100%' }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          size="small"
                          color="primary"
                          onClick={() => {
                            // Post message to React Native for barcode scanning
                            console.log('Barcode scan button clicked');
                            try {
                              if (window.ReactNativeWebView) {
                                // Send message to React Native
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                  type: 'open-barcode-scanner',
                                  field: 'uniqueId',
                                  currentValue: item.uniqueId || ''
                                }));
                              } else {
                                console.log('ReactNativeWebView not available');
                              }
                            } catch (error) {
                              console.error('Error posting message to React Native:', error);
                            }
                          }}
                        >
                          <QrCodeScannerIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  type='number'
                  value={item.phone || ''}
                  onChange={(event) => setItem({ ...item, phone: event.target.value })}
                  label={`${t('sharedPhone')} / ${t('ShareSimNumber')}`}
                  size="small"
                  sx={{ width: '100%' }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          size="small"
                          color="primary"
                          onClick={() => setSmsModalOpen(true)}
                        >
                          <MessageIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {/* SMS Command Modal */}
                <Dialog open={smsModalOpen} onClose={() => setSmsModalOpen(false)}>
                  <DialogTitle>Send SMS Command</DialogTitle>
                  <DialogContent>
                    <List sx={{ maxHeight: 300, overflowY: 'auto' }}>
                      {smsCommands.map((command, idx) => (
                        <ListItem key={idx} secondaryAction={
                          <IconButton
                            edge="end"
                            color="primary"
                            onClick={() => {
                              const smsUrl = `sms:${item.phone || ''}?body=${encodeURIComponent(command)}`;
                              window.open(smsUrl);
                            }}
                          >
                            <SendIcon />
                          </IconButton>
                        }>
                          <ListItemText primary={command} />
                        </ListItem>
                      ))}
                    </List>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setSmsModalOpen(false)} color="primary" variant="contained">
                      Close
                    </Button>
                  </DialogActions>
                </Dialog>
                {/* <TextField
                value={item.model || ''}
                onChange={(event) => setItem({ ...item, model: event.target.value })}
                label={t('deviceModel')}
              /> */}
                <SelectField
                  value={item.category || 'default'}
                  onChange={(event) => setItem({ ...item, category: event.target.value })}
                  data={deviceCategories.map((category) => ({
                    id: category,
                    name: t(`category${category.replace(/^\w/, (c) => c.toUpperCase())}`),
                  })).sort((a, b) => a.name.localeCompare(b.name))}
                  label={t('deviceCategory')}
                />
                <FormControl>
                  <SelectField
                    value={protocol}
                    onChange={(event) => { setItem({ ...item, model: protocols.find((p) => p.id === event.target.value).device }); setProtocol(Number(event.target.value)); }}
                    data={protocols.map((p) => ({ id: p.id, name: p.device }))}
                    label={t('deviceModel')}
                  />
                  <Typography variant="caption">{t('deviceConnectHelp')}</Typography>
                </FormControl>
                {(protocols.length > 0 && (protocol !== 0 && protocol != undefined)) ? (
                  <Alert severity="info">
                    <Typography variant="caption" gutterBottom>
                      {t('PortConnectCaption')}
                    </Typography>
                    <Typography variant="h6">
                      {import.meta.env.VITE_SERVER_IP}
                      :
                      {protocols[protocol].port}
                    </Typography>
                  </Alert>
                ) : <></>}
              </AccordionDetails>
            </Accordion>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">
                  {t('sharedExtra')}
                </Typography>
              </AccordionSummary>
              <AccordionDetails className={classes.details}>
                <SelectField
                  value={item.groupId}
                  onChange={(event) => setItem({ ...item, groupId: Number(event.target.value) })}
                  endpoint="/api/groups"
                  label={t('groupParent')}
                />
                <TextField
                  value={item.contact || ''}
                  onChange={(event) => setItem({ ...item, contact: event.target.value })}
                  label={t('deviceContact')}
                />
                <SelectField
                  value={item.calendarId}
                  onChange={(event) => setItem({ ...item, calendarId: Number(event.target.value) })}
                  endpoint="/api/calendars"
                  label={t('sharedCalendar')}
                />
                <TextField
                  label={t('userExpirationTime')}
                  type="date"
                  value={item.expirationTime ? item.expirationTime.split('T')[0] : '2099-01-01'}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="Clear"
                          onClick={() => setItem({ ...item, expirationTime: null })}
                          edge="end"
                          size="small"
                        >
                          <Close />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  onChange={(e) => {
                    if (e.target.value) {
                      setItem({ ...item, expirationTime: new Date(e.target.value).toISOString() });
                    }
                  }}
                  disabled={!admin}
                />
                <FormControlLabel
                  control={<Checkbox checked={item.disabled} onChange={(event) => setItem({ ...item, disabled: event.target.checked })} />}
                  label={t('sharedDisabled')}
                  disabled={!admin}
                />
              </AccordionDetails>
            </Accordion>
            {item.id && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    {t('attributeDeviceImage')}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails className={classes.details}>
                  <DropzoneArea
                    dropzoneText={t('sharedDropzoneText')}
                    acceptedFiles={['image/*']}
                    filesLimit={1}
                    onChange={handleFiles}
                    showAlerts={false}
                    maxFileSize={500000}
                  />
                </AccordionDetails>
              </Accordion>
            )}
            <EditAttributesAccordion
              attributes={item.attributes}
              setAttributes={(attributes) => setItem({ ...item, attributes })}
              definitions={{ ...commonDeviceAttributes, ...deviceAttributes }}
            />
          </>
        )}
      </EditItemView>

      {/* Success Modal */}
      <Dialog
        open={successModalOpen}
        onClose={() => {
          setSuccessModalOpen(false);
          if (userId) {
            navigate(`/settings/devices`);
          }
        }}
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
            Device saved successfully!
          </Typography>

          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => {
              setSuccessModalOpen(false);
              if (userId) {
                navigate(`/settings/devices`);
              }
            }}
            sx={{ mt: 2, minWidth: '100px' }}
            autoFocus
          >
            OK
          </Button>
        </Box>
      </Dialog>
    </>
  );
};

export default DevicePage;
