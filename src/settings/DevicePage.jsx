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

const DevicePage = () => {
  const classes = useSettingsStyles();
  const t = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { userId } = useParams();
  const { setHasSavedDevice, setSavedDeviceId } = useGeneralStore()

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

  useEffect(() => {
    if (userId) {
      setAllowGoBack(false);
    }
  }, [userId]);

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
        setItem={setItem}
        // whenItemsLoaded={(res) => { console.log(res, protocols); res?.model != null && setProtocol(protocols.find(p => p.device === res.model)) }}
        validate={validate}
        menu={<SettingsMenu />}
        breadcrumbs={['settingsTitle', 'sharedDevice']}
      >
        {item && (
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
                  label={t('sharedName')}
                />
                <TextField
                  value={item.uniqueId || ''}
                  onChange={(event) => setItem({ ...item, uniqueId: event.target.value })}
                  label={`${t('deviceIdentifier')} / ${t('deviceImei')}`}
                  helperText={t('deviceIdentifierHelp')}
                  disabled={Boolean(uniqueId)}
                />
                <TextField
                  value={item.phone || ''}
                  onChange={(event) => setItem({ ...item, phone: event.target.value })}
                  label={`${t('sharedPhone')} / ${t('ShareSimNumber')}`}
                />
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
