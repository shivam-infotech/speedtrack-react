import {
  Snackbar, Alert, Button, Link, Dialog, DialogContent, DialogContentText, DialogActions, Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePrevious } from '../../reactHelper';
import { errorsActions } from '../../store';
import { useTranslation } from './LocalizationProvider';

const ErrorHandler = () => {
  const dispatch = useDispatch();
  const t = useTranslation();

  const error = useSelector((state) => state.errors.errors.find(() => true));
  const cachedError = usePrevious(error);

  let message = error || cachedError;
  const multiline = message?.includes('\n');
  let displayMessage = multiline ? message.split('\n')[0] : message;

  const [expanded, setExpanded] = useState(false);

  // Auto-hide error message after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(errorsActions.pop());
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  // Extract duplicate entry text if present
  let duplicateText = null;
  if (message) {
    if (message.includes('Duplicate entry') && message.includes('IMEI')) {
      const match = message.match(/'([^']+)'/);
      if (match && match[1]) {
        duplicateText = match[1];
        message = `Device with IMEI ${duplicateText} already exists`;
        displayMessage = message;
      }
    } else if (message.includes('email') || message.includes('phone')) {
      const match = message.match(/'([^']+)'/);
      if (match && match[1]) {
        duplicateText = match[1];
        message = `User with email or phone ${duplicateText} already exists`;
        displayMessage = message;
      }
    }
  }
  return (
    <>
      <Snackbar open={Boolean(error) && !expanded}>
        <Alert
          elevation={6}
          onClose={() => dispatch(errorsActions.pop())}
          severity="error"
          variant="filled"
        >
          {displayMessage}
          {multiline && (
            <>
              {' | '}
              <Link color="inherit" href="#" onClick={() => setExpanded(true)}>{t('sharedShowDetails')}</Link>
            </>
          )}
        </Alert>
      </Snackbar>
      <Dialog
        open={expanded}
        onClose={() => setExpanded(false)}
        maxWidth={false}
      >
        <DialogContent>
          <DialogContentText>
            <Typography variant="caption">
              <pre>{message}</pre>
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpanded(false)} autoFocus>{t('sharedHide')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ErrorHandler;
