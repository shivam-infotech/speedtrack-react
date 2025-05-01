import React, { useState } from 'react';
import {
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box,
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import CloseIcon from '@mui/icons-material/Close';

const ShareButton = ({
  deviceName,
  activityStatus,
  duration,
  startTime,
  endTime,
  location,
  coordinates,
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const formatMessage = () => `Device: ${deviceName}
Status: ${activityStatus}
Duration: ${duration}
From: ${startTime.toLocaleTimeString()}
To: ${endTime.toLocaleTimeString()}
Location: ${location}
Google Maps: https://www.google.com/maps?q=${coordinates[1]},${coordinates[0]}`;

  const handleShare = async () => {
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: 'SpeedTrack Activity',
          text: formatMessage(),
        });
      } catch (error) {
        console.error('Error sharing:', error);
        setOpenDialog(true);
      }
    } else {
      setOpenDialog(true);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(formatMessage());
  };

  return (
    <>
      <IconButton
        onClick={handleShare}
        size="small"
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: 'primary.main',
        }}
      >
        <ShareIcon fontSize="small" />
      </IconButton>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Share Activity Details
          <IconButton
            onClick={() => setOpenDialog(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ whiteSpace: 'pre-line', mt: 2 }}>
            <Typography variant="body2">
              {formatMessage()}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCopyToClipboard}>
            Copy to Clipboard
          </Button>
          <Button onClick={() => setOpenDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ShareButton;
