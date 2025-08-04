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
    IconButton,
    InputAdornment,
    Typography,
    Box,
    Divider,
    CircularProgress,
    Avatar
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
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
    noUsers: {
        padding: theme.spacing(3),
        textAlign: 'center',
        color: theme.palette.text.secondary,
    },
    userInfo: {
        display: 'flex',
        flexDirection: 'column',
    },
    userId: {
        fontSize: '0.75rem',
        color: theme.palette.text.secondary,
    },
    actions: {
        padding: theme.spacing(2),
    },
    avatar: {
        backgroundColor: theme.palette.primary.main,
        width: 32,
        height: 32,
    },
}));

const DeviceUsersModal = ({ open, onClose, deviceId }) => {
    const classes = useStyles();
    const t = useTranslation();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [removing, setRemoving] = useState(false);

    // Get current user from Redux store
    const currentUser = useSelector((state) => state.session.user);

    useEffect(() => {
        if (open && deviceId) {
            fetchAssignedUsers();
        }
    }, [open, deviceId]);

    useEffect(() => {
        if (searchQuery) {
            const filtered = users.filter(
                (user) =>
                    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            setFilteredUsers(filtered);
        } else {
            setFilteredUsers(users);
        }
    }, [searchQuery, users]);

    const fetchAssignedUsers = async () => {
        if (!deviceId) return;

        setLoading(true);
        try {
            // Try the primary API first
            const response = await fetch(`/api/users?deviceId=${deviceId}`);
            if (response.ok) {
                const assignedUsers = await response.json();
                setUsers(assignedUsers);
                setFilteredUsers(assignedUsers);
            } else {
                throw Error(await response.text());
            }
        } catch (error) {
            console.error('Error fetching assigned users from primary API:', error);

            // Fallback to Node API endpoint if available
            try {
                const nodeResponse = await fetch(`${BASE_URL}/api/node/devices/users/${deviceId}`);
                if (nodeResponse.ok) {
                    const nodeData = await nodeResponse.json();
                    if (nodeData && nodeData.data) {
                        setUsers(nodeData.data);
                        setFilteredUsers(nodeData.data);
                    } else {
                        console.error('Node API response missing data structure');
                    }
                } else {
                    console.error('Node API fallback also failed:', await nodeResponse.text());
                }
            } catch (nodeError) {
                console.error('Error fetching assigned users from Node API fallback:', nodeError);
            }
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Check if user is an admin
    const isAdmin = (user) => {
        return user.administrator === true ||
            user.user_type === 'admin' ||
            (user.attributes && user.attributes.userAdminRole === true);
    };

    // Handle removing a user from the device
    const handleRemoveUser = async (userId) => {
        if (!deviceId || !userId) return;

        setRemoving(true);
        try {
            // Remove the user from the device
            const response = await fetch(`/api/permissions`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    deviceId: deviceId,
                }),
            });

            if (response.ok) {
                // Update the users list after successful removal
                setUsers(users.filter(user => (user.id || user.user_id) !== userId));
                setFilteredUsers(filteredUsers.filter(user => (user.id || user.user_id) !== userId));
            } else {
                console.error('Failed to remove user from device');
            }
        } catch (error) {
            console.error('Error removing user from device:', error);
        } finally {
            setRemoving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle className={classes.dialogTitle}>
                <Typography variant="h6">{t('sharedUsers')}</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
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
                ) : filteredUsers.length > 0 ? (
                    <List disablePadding>
                        {filteredUsers.map((user) => {
                            const userId = user.id || user.user_id;
                            const userIsAdmin = isAdmin(user);
                            const isSelf = userId === currentUser.id;
                            // Don't allow removing admin users or self
                            const canRemove = !userIsAdmin && !isSelf;

                            return (
                                <ListItem
                                    key={userId}
                                    className={classes.listItem}
                                    secondaryAction={
                                        canRemove && (
                                            <IconButton
                                                edge="end"
                                                aria-label="delete"
                                                onClick={() => handleRemoveUser(userId)}
                                                disabled={removing}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        )
                                    }
                                >
                                    <ListItemIcon>
                                        <Avatar className={classes.avatar}>
                                            {getInitials(user.name)}
                                        </Avatar>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={user.name}
                                        secondary={
                                            <>
                                                {user.email || user.username || ''}
                                                {userIsAdmin && (
                                                    <Typography
                                                        component="span"
                                                        sx={{
                                                            display: 'block',
                                                            color: 'primary.main',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.75rem'
                                                        }}
                                                    >
                                                        Admin
                                                    </Typography>
                                                )}
                                            </>
                                        }
                                    />
                                </ListItem>
                            );
                        })}
                    </List>
                ) : (
                    <Box className={classes.noUsers}>
                        <Typography variant="body1">
                            {searchQuery ? t('sharedNoUserFound') : t('sharedNoUsers')}
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <Divider />

            <DialogActions className={classes.actions}>
                <Button size="small" onClick={onClose} color="primary" variant="contained">
                    Close
                </Button>
                <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                        onClose();
                        navigate(`/settings/device/assign/user/${deviceId}`);
                    }}
                >
                    Assign User
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeviceUsersModal;
