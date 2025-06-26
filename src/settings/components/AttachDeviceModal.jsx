import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Checkbox,
    IconButton,
    InputAdornment,
    Typography,
    Box,
    Divider,
    CircularProgress
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DevicesOtherIcon from '@mui/icons-material/DevicesOther';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { BASE_URL } from '../../config';

const useStyles = makeStyles((theme) => ({
    dialogTitle: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing(1, 2),
    },
    searchContainer: {
        padding: theme.spacing(2, 2, 1, 2),
        position: 'sticky',
        top: 0,
        backgroundColor: theme.palette.background.paper,
        zIndex: 1,
    },
    listContainer: {
        maxHeight: '50vh',
        overflow: 'auto',
        padding: 0,
    },
    listItem: {
        borderBottom: `1px solid ${theme.palette.divider}`,
    },
    addButton: {
        minWidth: '40px',
        height: '30px'
    },
    noDevices: {
        padding: theme.spacing(3),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    deviceInfo: {
        display: 'flex',
        flexDirection: 'column',
    },
    deviceId: {
        fontSize: '0.75rem',
        color: theme.palette.text.secondary,
    },
    actions: {
        padding: theme.spacing(2),
    },
}));

const AttachDeviceModal = ({ open, onClose, onAttach, userId, navigate }) => {
    const classes = useStyles();
    const t = useTranslation();
    const [devices, setDevices] = useState([]);
    const [filteredDevices, setFilteredDevices] = useState([]);
    const [selectedDevices, setSelectedDevices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchDevices();
            fetchAssignedDevices();
        }
    }, [open]);

    useEffect(() => {
        if (searchQuery) {
            const filtered = devices.filter(
                (device) =>
                    device.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    device.uniqueId.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredDevices(filtered);
        } else {
            setFilteredDevices(devices);
        }
    }, [searchQuery, devices]);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/devices?all=true');
            if (response.ok) {
                const data = await response.json();
                setDevices(data);
                setFilteredDevices(data);
            } else {
                throw Error(await response.text());
            }
        } catch (error) {
            console.error('Error fetching devices:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignedDevices = async () => {
        if (!userId) return;

        try {
            const response = await fetch(`/api/devices?userId=${userId}`);
            if (response.ok) {
                const assignedDevices = await response.json();
                const assignedDeviceIds = assignedDevices.map(device => device.id);
                setSelectedDevices(assignedDeviceIds);
            } else {
                throw Error(await response.text());
            }
        } catch (error) {
            console.error('Error fetching assigned devices from primary API:', error);

            // Fallback to Node API endpoint
            try {
                const nodeResponse = await fetch(`${BASE_URL}/api/node/users/devices/${userId}`);
                if (nodeResponse.ok) {
                    const nodeData = await nodeResponse.json();
                    if (nodeData && nodeData.data) {
                        // Extract deviceid from the Node API response format
                        const assignedDeviceIds = nodeData.data.map(device => device.deviceid);
                        setSelectedDevices(assignedDeviceIds);
                        console.log('Successfully fetched devices from Node API fallback');
                    } else {
                        console.error('Node API response missing data structure');
                    }
                } else {
                    console.error('Node API fallback also failed:', await nodeResponse.text());
                }
            } catch (nodeError) {
                console.error('Error fetching assigned devices from Node API fallback:', nodeError);
            }
        }
    };

    const handleToggleDevice = (deviceId) => {
        setSelectedDevices((prev) => {
            if (prev.includes(deviceId)) {
                return prev.filter((id) => id !== deviceId);
            } else {
                return [...prev, deviceId];
            }
        });
    };

    const handleAttachDevices = async () => {
        try {
            let currentDeviceIds = [];

            try {
                const response = await fetch(`/api/devices?userId=${userId}`);

                if (response.ok) {
                    const currentAssignedDevices = await response.json();
                    currentDeviceIds = currentAssignedDevices.map(device => device.id);
                } else {
                    const nodeResponse = await fetch(`${BASE_URL}/api/node/users/devices/${userId}`);
                    if (nodeResponse.ok) {
                        const nodeData = await nodeResponse.json();
                        if (nodeData && nodeData.data) {
                            currentDeviceIds = nodeData.data.map(device => device.deviceid);
                        }
                    }
                }
            } catch (fetchError) {
                console.log('No devices currently attached to user or error fetching devices');
            }

            const devicesToAdd = selectedDevices.filter(deviceId => !currentDeviceIds.includes(deviceId));
            const devicesToRemove = currentDeviceIds.filter(deviceId => !selectedDevices.includes(deviceId));

            const addPromises = devicesToAdd.map(deviceId =>
                fetch('/api/permissions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        deviceId,
                    }),
                })
            );

            const removePromises = devicesToRemove.map(deviceId => {
                return fetch(`/api/permissions`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId,
                        deviceId,
                    }),
                });
            });

            await Promise.all([...addPromises, ...removePromises]);

            onAttach(selectedDevices);
            onClose();
        } catch (error) {
            console.error('Error updating device permissions:', error);
        }
    };

    const handleAddNewDevice = () => {
        navigate(`/settings/device/user/${userId}`);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle className={classes.dialogTitle}>
                <Typography variant="h6">{t('deviceTitle')}</Typography>
                <Box>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddNewDevice}
                        className={classes.addButton}
                    >
                        <AddIcon />
                    </Button>
                    <IconButton edge="end" onClick={onClose} aria-label="close">
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <Divider />

            <Box className={classes.searchContainer}>
                <TextField
                    fullWidth
                    placeholder={t('sharedSearch')}
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <DialogContent className={classes.listContainer}>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : filteredDevices.length > 0 ? (
                    <List disablePadding>
                        {filteredDevices.map((device) => (
                            <ListItem
                                key={device.id}
                                className={classes.listItem}
                                button
                                onClick={() => handleToggleDevice(device.id)}
                            >
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        checked={selectedDevices.includes(device.id)}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemIcon>
                                    <DevicesOtherIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary={device.name}
                                    secondary={device.uniqueId}
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Box className={classes.noDevices}>
                        <Typography variant="body1">
                            {searchQuery ? t('sharedNoDeviceFound') : t('sharedNoDevices')}
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <Divider />

            <DialogActions className={classes.actions}>
                <Button onClick={onClose} color="primary">
                    {t('sharedCancel')}
                </Button>
                <Button
                    onClick={handleAttachDevices}
                    color="primary"
                    variant="contained"
                    disabled={selectedDevices.length === 0}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AttachDeviceModal;
