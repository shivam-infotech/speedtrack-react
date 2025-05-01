import React, { useEffect, useState } from 'react';
import {
  useMediaQuery, Select, MenuItem, FormControl, Button, TextField, Link, Snackbar, IconButton, Tooltip, Box,
  Card, CardContent, Typography, Divider, Fade, Grid, Container,
  InputAdornment,
} from '@mui/material';
import ReactCountryFlag from 'react-country-flag';
import makeStyles from '@mui/styles/makeStyles';
import CloseIcon from '@mui/icons-material/Close';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { sessionActions } from '../store';
import { useLocalization, useTranslation } from '../common/components/LocalizationProvider';
import LoginLayout from './LoginLayout';
import usePersistedState from '../common/util/usePersistedState';
import {
  generateLoginToken, handleLoginTokenListeners, nativeEnvironment, nativePostMessage,
} from '../common/components/NativeInterface';
import LogoImage from './LogoImage';
import { useCatch } from '../reactHelper';
import Loader from '../common/components/Loader';

// Import your car illustration
import CarIllustration from '../resources/images/assets/undraw_login_screen.svg';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    maxHeight: '100vh',
    padding: theme.spacing(3),
    background: theme.palette.background.default,
    overflow: 'hidden',
    [theme.breakpoints.down('md')]: {
      padding: theme.spacing(0),
    },
  },
  splitContainer: {
    display: 'flex',
    borderRadius: 24,
    overflow: 'hidden',
    boxShadow: theme.shadows[10],
    maxWidth: 1200,
    width: '100%',
    height: '85vh',
    [theme.breakpoints.up('md')]: {
      maxHeight: 800,
    },
    [theme.breakpoints.down('md')]: {
      flexDirection: 'column',
      maxWidth: 600,
      height: '100vh',
      minHeight: '85vh',
      maxHeight: 'auto',
    },
  },
  illustrationSide: {
    flex: 1.2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(6),
    backgroundColor: theme.palette.primary.main,
    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.light} 100%)`,
    position: 'relative',
    overflow: 'hidden',
    [theme.breakpoints.down('md')]: {
      flex: 0.8,
      padding: theme.spacing(4),
    },
  },
  illustration: {
    width: '100%',
    maxWidth: 500,
    height: 'auto',
    objectFit: 'contain',
    animation: '$float 6s ease-in-out infinite',
    [theme.breakpoints.down('md')]: {
      maxWidth: 300,
    },
  },
  '@keyframes float': {
    '0%': { transform: 'translateY(0px)' },
    '50%': { transform: 'translateY(-20px)' },
    '100%': { transform: 'translateY(0px)' },
  },
  formSide: {
    flex: 0.8,
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(6),
    backgroundColor: theme.palette.background.paper,
    position: 'relative',
    [theme.breakpoints.down('md')]: {
      flex: 1.2,
      marginTop: theme.spacing(-4),
      borderRadius: '24px 24px 0 0',
      padding: theme.spacing(4),
      zIndex: 1,
    },
  },
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: theme.spacing(10),
  },
  logo: {
    height: 48,
    [theme.breakpoints.down('sm')]: {
      height: 40,
    },
  },
  welcomeText: {
    fontSize: '2rem',
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: theme.spacing(4),
    color: theme.palette.text.primary,
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.75rem',
      marginBottom: theme.spacing(3),
    },
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
  },
  linksContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    marginTop: theme.spacing(3),
  },
  linkRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: theme.spacing(3),
    alignItems: 'center',
  },
  link: {
    cursor: 'pointer',
    color: theme.palette.primary.main,
    fontWeight: 500,
    transition: 'all 0.2s ease',
    textDecoration: 'none',
    '&:hover': {
      color: theme.palette.primary.dark,
      transform: 'translateY(-1px)',
    },
  },
  divider: {
    margin: theme.spacing(3, 0, 2),
    '&::before, &::after': {
      borderColor: theme.palette.divider,
    },
  },
  dividerText: {
    padding: theme.spacing(0, 2),
    color: theme.palette.text.secondary,
  },
  options: {
    position: 'fixed',
    top: theme.spacing(2),
    right: theme.spacing(2),
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(1),
    zIndex: 10,
  },
}));

const LoginPage = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const t = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { languages, language, setLanguage } = useLocalization();
  const languageList = Object.entries(languages).map((values) => ({ code: values[0], country: values[1].country, name: values[1].name }));

  const [failed, setFailed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = usePersistedState('loginEmail', '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const registrationEnabled = useSelector((state) => state.session.server.registration);
  const languageEnabled = useSelector((state) => !state.session.server.attributes['ui.disableLoginLanguage']);
  const changeEnabled = useSelector((state) => !state.session.server.attributes.disableChange);
  const emailEnabled = useSelector((state) => state.session.server.emailEnabled);
  const openIdEnabled = useSelector((state) => state.session.server.openIdEnabled);
  const openIdForced = useSelector((state) => state.session.server.openIdEnabled && state.session.server.openIdForce);
  const [codeEnabled, setCodeEnabled] = useState(false);

  const [announcementShown, setAnnouncementShown] = useState(false);
  const announcement = useSelector((state) => state.session.server.announcement);

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    setFailed(false);
    try {
      const query = `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      const response = await fetch('/api/session', {
        method: 'POST',
        body: new URLSearchParams(code.length ? `${query}&code=${code}` : query),
      });
      if (response.ok) {
        const user = await response.json();
        generateLoginToken();
        dispatch(sessionActions.updateUser(user));
        navigate('/', { replace: true });
      } else if (response.status === 401 && response.headers.get('WWW-Authenticate') === 'TOTP') {
        setCodeEnabled(true);
      } else {
        throw Error(await response.text());
      }
    } catch (error) {
      setFailed(true);
      setPassword('');
    }
  };

  const handleTokenLogin = useCatch(async (token) => {
    const response = await fetch(`/api/session?token=${encodeURIComponent(token)}`);
    if (response.ok) {
      const user = await response.json();
      dispatch(sessionActions.updateUser(user));
      navigate('/');
    } else {
      throw Error(await response.text());
    }
  });

  const handleOpenIdLogin = () => {
    document.location = '/api/session/openid/auth';
  };

  useEffect(() => nativePostMessage('authentication'), []);

  useEffect(() => {
    const listener = (token) => handleTokenLogin(token);
    handleLoginTokenListeners.add(listener);
    return () => handleLoginTokenListeners.delete(listener);
  }, []);

  if (openIdForced) {
    handleOpenIdLogin();
    return (<Loader />);
  }

  return (
    <LoginLayout>
      <div className={classes.options}>
        {nativeEnvironment && changeEnabled && (
          <Tooltip title={t('settingsServer')}>
            <IconButton onClick={() => navigate('/change-server')} color="inherit">
              <LockOpenIcon />
            </IconButton>
          </Tooltip>
        )}
        {languageEnabled && (
          <FormControl size="small" variant="outlined">
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              sx={{
                '& .MuiSelect-select': {
                  py: 1,
                  minHeight: 'auto',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.5)',
                },
                '& .MuiSvgIcon-root': {
                  color: 'rgba(255,255,255,0.5)',
                },
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(5px)',
              }}
            >
              {languageList.map((it) => (
                <MenuItem key={it.code} value={it.code}>
                  <Box component="span" sx={{ mr: 1 }}>
                    <ReactCountryFlag countryCode={it.country} svg />
                  </Box>
                  {it.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </div>

      <Container className={classes.root} maxWidth={false} disableGutters>
        <Fade in timeout={500}>
          <div className={classes.splitContainer}>
            <div className={classes.illustrationSide}>
              <img
                src={CarIllustration}
                alt="Car Illustration"
                className={classes.illustration}
              />
            </div>

            <div className={classes.formSide}>
              <div className={classes.logoContainer}>
                <LogoImage className={classes.logo} color={theme.palette.primary.main} />
              </div>

              <Typography variant="h1" className={classes.welcomeText}>
                Welcome Back
              </Typography>

              <div className={classes.form}>
                <TextField
                  required
                  error={failed}
                  label={t('userEmail')}
                  name="email"
                  value={email}
                  autoComplete="email"
                  autoFocus={!email}
                  onChange={(e) => setEmail(e.target.value)}
                  helperText={failed && 'Invalid username or password'}
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />

                <TextField
                  required
                  error={failed}
                  label={t('userPassword')}
                  name="password"
                  value={password}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  autoFocus={!!email}
                  onChange={(e) => setPassword(e.target.value)}
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                        >
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />

                {codeEnabled && (
                  <TextField
                    required
                    error={failed}
                    label={t('loginTotpCode')}
                    name="code"
                    value={code}
                    type="number"
                    onChange={(e) => setCode(e.target.value)}
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />
                )}

                <Button
                  onClick={handlePasswordLogin}
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  disabled={!email || !password || (codeEnabled && !code)}
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    padding: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                    boxShadow: `0 3px 12px ${theme.palette.primary.main}40`,
                    '&:hover': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
                      boxShadow: `0 4px 16px ${theme.palette.primary.main}60`,
                    },
                    '&:disabled': {
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                      opacity: 0.7,
                    },
                  }}
                >
                  {t('loginLogin')}
                </Button>

                {(registrationEnabled || emailEnabled || openIdEnabled) && (
                  <>
                    <Divider className={classes.divider} />
                    <div className={classes.linksContainer}>
                      <div className={classes.linkRow}>
                        {registrationEnabled && (
                          <Link
                            onClick={() => navigate('/register')}
                            className={classes.link}
                            underline="none"
                            variant="body2"
                          >
                            {t('loginRegister')}
                          </Link>
                        )}
                        {emailEnabled && (
                          <>
                            {registrationEnabled && <Typography variant="body2" color="text.secondary">•</Typography>}
                            <Link
                              onClick={() => navigate('/reset-password')}
                              className={classes.link}
                              underline="none"
                              variant="body2"
                            >
                              {t('loginReset')}
                            </Link>
                          </>
                        )}
                      </div>

                      {openIdEnabled && (
                        <>
                          <Divider className={classes.divider}>
                            <Typography variant="body2" className={classes.dividerText}>OR</Typography>
                          </Divider>
                          <Button
                            onClick={handleOpenIdLogin}
                            variant="outlined"
                            color="primary"
                            fullWidth
                            sx={{
                              borderRadius: 2,
                              padding: '12px',
                              textTransform: 'none',
                              fontWeight: 600,
                              borderWidth: 2,
                              '&:hover': {
                                borderWidth: 2,
                              },
                            }}
                          >
                            {t('loginOpenId')}
                          </Button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </Fade>
      </Container>

      <Snackbar
        open={!!announcement && !announcementShown}
        message={announcement}
        action={(
          <IconButton size="small" color="inherit" onClick={() => setAnnouncementShown(true)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      />
    </LoginLayout>
  );
};

export default LoginPage;
