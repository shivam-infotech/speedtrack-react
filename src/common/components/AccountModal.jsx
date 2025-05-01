import {
  Avatar,
  Box,
  Dialog,
  DialogTitle,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Link,
} from '@mui/material';
import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PolicyIcon from '@mui/icons-material/Policy';
import DescriptionIcon from '@mui/icons-material/Description';
import { useNavigate } from 'react-router-dom';
import { sessionActions } from '../../store';
import { useCatch } from '../../reactHelper';
import { nativePostMessage } from './NativeInterface';

export default function AccountModal({ open, onClose }) {
  const theme = useTheme();
  const user = useSelector((state) => state.session.user);
  const [attributes, setAttributes] = useState(user.attributes);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const notificationToken = window.localStorage.getItem('notificationToken');
    if (notificationToken && !user.readonly) {
      window.localStorage.removeItem('notificationToken');
      const tokens = user.attributes.notificationTokens?.split(',') || [];
      if (tokens.includes(notificationToken)) {
        const updatedUser = {
          ...user,
          attributes: {
            ...user.attributes,
            notificationTokens: tokens.length > 1 ? tokens.filter((it) => it !== notificationToken).join(',') : undefined,
          },
        };
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser),
        });
      }
    }

    await fetch('/api/session', { method: 'DELETE' });
    nativePostMessage('logout');
    navigate('/login');
    dispatch(sessionActions.updateUser(null));
  };

  const handleSave = useCatch(async () => {
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, attributes }),
    });
    if (response.ok) {
      dispatch(sessionActions.updateUser(await response.json()));
    } else {
      throw Error(await response.text());
    }
  });

  const handleNotificationToggle = () => {
    setAttributes({ ...attributes, notifications: !attributes?.notifications });
    handleSave();
  };

  return (
    <Dialog onClose={onClose} open={open} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', paddingLeft: 2, paddingRight: 2 }}>
        <Avatar sx={{ backgroundColor: theme.palette.primary.main }} edge="start">
          {user.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ marginLeft: 1.5, flex: 1 }}>
          <Typography variant="h6" lineHeight={1}>{user.name}</Typography>
          <Typography color="textSecondary">{user.email}</Typography>
        </Box>
        <IconButton size="small" onClick={handleLogout}>
          <LogoutIcon color="error" />
        </IconButton>
      </DialogTitle>

      <Divider />

      <List>
        <ListItem>
          <ListItemIcon>
            <NotificationsIcon />
          </ListItemIcon>
          <ListItemText primary="Notifications" />
          <Switch
            edge="end"
            checked={attributes?.notifications}
            onChange={handleNotificationToggle}
          />
        </ListItem>

        <Divider />

        <ListItem
          button
          component={Link}
        >
          <ListItemIcon>
            <PolicyIcon />
          </ListItemIcon>
          <ListItemText primary="Privacy Policy" />
        </ListItem>

        <ListItem
          button
          component={Link}
        >
          <ListItemIcon>
            <DescriptionIcon />
          </ListItemIcon>
          <ListItemText primary="Terms & Conditions" />
        </ListItem>
      </List>
    </Dialog>
  );
}
