import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    IconButton,
    Typography,
    Box,
    Divider,
    CircularProgress,
    Avatar,
    Stack
} from '@mui/material';
import { makeStyles } from '@mui/styles';

import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { BASE_URL } from '../../config';

const useStyles = makeStyles((theme) => ({
    dialogTitle: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing(1, 2),
    },
    content: {
        padding: theme.spacing(3),
    },
    userInfo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: theme.spacing(2),
    },
    avatar: {
        width: 80,
        height: 80,
        marginBottom: theme.spacing(2),
        backgroundColor: theme.palette.primary.main,
    },
    userName: {
        fontWeight: 500,
        marginBottom: theme.spacing(0.5),
    },
    userEmail: {
        fontSize: '0.9rem',
        color: theme.palette.text.secondary,
    },
    userDetail: {
        marginBottom: theme.spacing(1),
    },
    actions: {
        padding: theme.spacing(2),
    },
}));

const AssignUserModal = ({ open, onClose, onAssign, deviceId, userId, hasUserId }) => {
    const classes = useStyles();
    const t = useTranslation();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [deviceDetails, setDeviceDetails] = useState(null);

    useEffect(() => {
        if (open && userId) {
            fetchUserDetails();
            fetchDeviceDetails();
        }
    }, [open, userId, deviceId]);

    const fetchUserDetails = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/users/${userId}`);
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                throw Error(await response.text());
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDeviceDetails = async () => {
        if (!deviceId) return;

        try {
            const response = await fetch(`/api/devices/${deviceId}`);
            if (response.ok) {
                const deviceData = await response.json();
                setDeviceDetails(deviceData);
            } else {
                throw Error(await response.text());
            }
        } catch (error) {
            console.error('Error fetching device details:', error);
        }
    };

    const handleAssignDevice = async () => {
        try {
            // First, remove any existing permissions for this device
            const response = await fetch(`/api/permissions?deviceId=${deviceId}`);
            if (response.ok) {
                const permissions = await response.json();

                // Remove existing permissions
                const removePromises = permissions.map(permission =>
                    fetch(`/api/permissions`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            userId: permission.userId,
                            deviceId
                        }),
                    })
                );

                await Promise.all(removePromises);
            }

            // Add new permission for the user
            await fetch('/api/permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    deviceId
                }),
            });

            // Pass the device name back to the parent component
            onAssign(userId, deviceDetails?.name || 'Device');
            onClose();
        } catch (error) {
            console.error('Error assigning device to user:', error);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle className={classes.dialogTitle}>
                <Typography variant="h6">Assign Device</Typography>
                <IconButton edge="end" onClick={onClose} aria-label="close">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <Divider />

            <DialogContent className={classes.content}>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : user ? (
                    <>
                        <Box className={classes.userInfo}>
                            <Avatar className={classes.avatar}>
                                <PersonIcon fontSize="large" />
                            </Avatar>
                            <Typography variant="h5" className={classes.userName}>
                                {user.name}
                            </Typography>
                            <Typography variant="body1" className={classes.userEmail}>
                                {user.email}
                            </Typography>
                        </Box>

                        {deviceDetails && (
                            <Box mt={3}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Device Details:
                                </Typography>
                                <Stack spacing={1}>
                                    <Typography variant="body1" className={classes.userDetail}>
                                        <strong>Name:</strong> {deviceDetails.name}
                                    </Typography>
                                    <Typography variant="body1" className={classes.userDetail}>
                                        <strong>Identifier:</strong> {deviceDetails.uniqueId}
                                    </Typography>
                                    {deviceDetails.model && (
                                        <Typography variant="body1" className={classes.userDetail}>
                                            <strong>Model:</strong> {deviceDetails.model}
                                        </Typography>
                                    )}
                                </Stack>
                            </Box>
                        )}

                        <Box mt={4} textAlign="center">
                            <Typography variant="body1">
                                Do you want to assign this device to {user.name}?
                            </Typography>
                        </Box>
                    </>
                ) : (
                    <Box textAlign="center" p={3}>
                        <Typography variant="body1" color="error">
                            User not found
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
                    onClick={handleAssignDevice}
                    color="primary"
                    variant="contained"
                    disabled={!user}
                >
                    Assign Device
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AssignUserModal;
