import React from 'react';
import {
  Dialog, DialogActions, DialogContent, Button, Typography, Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useTranslation } from './LocalizationProvider';
import DirectionsIcon from '@mui/icons-material/Directions';
import ShareIcon from '@mui/icons-material/Share';
import useNativePlatform from '../util/useNativePlatform';


const useStyles = makeStyles((theme) => ({
  dialog: {
    '& .MuiDialog-paper': {
      borderRadius: 16,
      maxWidth: 320,
      width: '100%',
    },
  },
  dialogContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    padding: theme.spacing(3, 2),
    paddingBottom: theme.spacing(1),
  },
  icon: {
    fontSize: 48,
    color: theme.palette.warning.main,
    marginBottom: theme.spacing(1),
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: 500,
    marginBottom: theme.spacing(2),
    color: theme.palette.text.secondary,
  },
  address: {
    fontSize: '1rem',
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
  },
  details: {
    fontSize: '0.9rem',
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: theme.spacing(2),
    paddingTop: 0,
  },
  directionsButton: {
    backgroundColor: '#e57373',
    color: 'white',
    '&:hover': {
      backgroundColor: '#d32f2f',
    },
    flex: 1,
    marginRight: theme.spacing(1),
  },
  shareButton: {
    backgroundColor: '#66bb6a',
    color: 'white',
    '&:hover': {
      backgroundColor: '#43a047',
    },
    flex: 1,
    marginLeft: theme.spacing(1),
  },
}));

const LocationDetailsModal = ({ open, onClose, locationData }) => {
  const classes = useStyles();
  const t = useTranslation();
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const { postNativeMessage } = useNativePlatform();

  if (!locationData) return null;

  const { latitude, longitude, address, speed, timestamp } = locationData;
  
  const handleShare = () => {
    const shareUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
    if (isMobile) {
      postNativeMessage('share-data', { url: shareUrl, title: 'Location Details', text: `Check out this location: ${address}` });
      navigator.share({
        title: 'Location Details',
        text: `Check out this location: ${address}`,
        url: shareUrl,
      }).catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(shareUrl)
        .then(() => {
          alert(t('sharedLinkCopied'));
        })
        .catch((err) => {
          console.error('Could not copy text: ', err);
        });
    }
  };

  // Format the address and details as shown in the image
  const formattedAddress = address || 'Location Address';
  const formattedDetails = `Time: ${timestamp}, Speed: ${speed}`;
  
  const handleDirections = () => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`, '_blank');
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      className={classes.dialog}
    >
      <DialogContent className={classes.dialogContent}>
        {/* Warning icon */}
        <Box className={classes.icon}>⚠️</Box>
        
        {/* Title */}
        <Typography className={classes.title}>
          Use this Location
        </Typography>
        
        {/* Address */}
        <Typography className={classes.address}>
          {formattedAddress}
        </Typography>
        
        {/* Details (time and speed) */}
        <Typography className={classes.details}>
          [ {formattedDetails} ]
        </Typography>
      </DialogContent>
      
      <DialogActions className={classes.actions}>
        <Button
          variant="contained"
          className={classes.directionsButton}
          startIcon={<DirectionsIcon />}
          onClick={handleDirections}
          fullWidth
        >
          Directions
        </Button>
        
        <Button
          variant="contained"
          className={classes.shareButton}
          startIcon={<ShareIcon />}
          onClick={handleShare}
          fullWidth
        >
          Share
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationDetailsModal;
