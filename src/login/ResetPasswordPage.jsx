import React, { useState } from 'react';
import {
  Button, TextField, Typography, Snackbar, IconButton, Container,
  InputAdornment, Fade,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { useTheme } from '@mui/material/styles';
import LoginLayout from './LoginLayout';
import { useTranslation } from '../common/components/LocalizationProvider';
import useQuery from '../common/util/useQuery';
import { snackBarDurationShortMs } from '../common/util/duration';
import { useCatch } from '../reactHelper';
import LogoImage from './LogoImage';

// Import reset password illustration
import ResetIllustration from '../resources/images/assets/undraw_forgot_password.svg';

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
      padding: theme.spacing(1),
    }
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
      maxHeight: "auto",
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
    marginBottom: theme.spacing(4),
  },
  logo: {
    height: 48,
    [theme.breakpoints.down('sm')]: {
      height: 40,
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(4),
  },
  backButton: {
    marginRight: theme.spacing(2),
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(5px)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: theme.palette.text.primary,
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.75rem',
    },
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: theme.spacing(4),
    color: theme.palette.text.secondary,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
  },
}));

const ResetPasswordPage = () => {
  const classes = useStyles();
  const navigate = useNavigate();
  const theme = useTheme();
  const t = useTranslation();
  const query = useQuery();

  const token = query.get('passwordReset');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();
    let response;
    if (!token) {
      response = await fetch('/api/password/reset', {
        method: 'POST',
        body: new URLSearchParams(`email=${encodeURIComponent(email)}`),
      });
    } else {
      response = await fetch('/api/password/update', {
        method: 'POST',
        body: new URLSearchParams(`token=${encodeURIComponent(token)}&password=${encodeURIComponent(password)}`),
      });
    }
    if (response.ok) {
      setSnackbarOpen(true);
    } else {
      throw Error(await response.text());
    }
  });

  return (
    <LoginLayout>
      <Container className={classes.root} maxWidth={false} disableGutters>
        <Fade in timeout={500}>
          <div className={classes.splitContainer}>
            <div className={classes.illustrationSide}>
              <img 
                src={ResetIllustration} 
                alt="Reset Password Illustration" 
                className={classes.illustration}
              />
            </div>
            
            <div className={classes.formSide}>
              <div className={classes.logoContainer}>
                <LogoImage className={classes.logo} color={theme.palette.primary.main} />
              </div>

              <div className={classes.header}>
                <IconButton 
                  className={classes.backButton}
                  onClick={() => navigate('/login')}
                  size="small"
                >
                  <ArrowBackIcon />
                </IconButton>
                <Typography variant="h1" className={classes.title}>
                  {t('loginReset')}
                </Typography>
              </div>

              <Typography variant="body1" className={classes.subtitle}>
                {!token 
                  ? t('loginResetDescription') 
                  : t('loginUpdateDescription')}
              </Typography>
              
              <form onSubmit={handleSubmit} className={classes.form}>
                {!token ? (
                  <TextField
                    required
                    type="email"
                    label={t('userEmail')}
                    name="email"
                    value={email}
                    autoComplete="email"
                    onChange={(event) => setEmail(event.target.value)}
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
                      }
                    }}
                  />
                ) : (
                  <TextField
                    required
                    label={t('userPassword')}
                    name="password"
                    value={password}
                    type="password"
                    autoComplete="new-password"
                    onChange={(event) => setPassword(event.target.value)}
                    variant="outlined"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                )}
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  disabled={!/(.+)@(.+)\.(.{2,})/.test(email) && !password}
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
                    "&:disabled": {
                      background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
                      opacity: 0.7,
                    }
                  }}
                >
                  {t('loginReset')}
                </Button>
              </form>
            </div>
          </div>
        </Fade>
      </Container>

      <Snackbar
        open={snackbarOpen}
        onClose={() => navigate('/login')}
        autoHideDuration={snackBarDurationShortMs}
        message={!token ? t('loginResetSuccess') : t('loginUpdateSuccess')}
      />
    </LoginLayout>
  );
};

export default ResetPasswordPage;
