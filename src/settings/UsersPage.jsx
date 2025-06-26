import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Table, TableRow, TableCell, TableHead, TableBody, Switch, TableFooter, FormControlLabel,
  Card, CardContent, Typography, Grid, Box, Divider, Stack, Avatar, Chip, useMediaQuery, useTheme,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LinkIcon from '@mui/icons-material/Link';
import EmailIcon from '@mui/icons-material/Email';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
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

  const manager = useManager();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [temporary, setTemporary] = useState(false);

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

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'settingsUsers']}>
      <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
      {!loading ? (
        isMobile ? (
          <Grid container spacing={1}>
            {items.filter((u) => temporary || !u.temporary).filter(filterByKeyword(searchKeyword)).map((item) => {
              const hasAdditionalFields = item.phone || item.disabled || item.administrator || item.expirationTime;

              return (
                <Grid item xs={12} key={item.id}>
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
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <EmailIcon fontSize="small" color="primary" />
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {item.email}
                            </Typography>
                          </Stack>
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
        (userRole == 'admin' || userRole == 'distributor') &&
        <CollectionFab editPath="/settings/user" />
      }
    </PageLayout>
  );
};

export default UsersPage;
