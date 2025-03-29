import { Box, Chip, Typography, useTheme } from "@mui/material";
import ShareButton from "./ShareButton";

const PopupContent = ({ duration, startTime, endTime, address, coordinates, deviceName, activityStatus }) => {
    const theme = useTheme();
    
    return (
      <Box sx={{
        minWidth: '200px',
        maxWidth: '300px',
        p: 1,
        position: 'relative',
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-start', 
          alignItems: 'center',
          mb: 2 
        }}>
          <div style={{ flex: 1 }}>
            <Chip 
              size="small" 
              label={`Duration: ${duration}`}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: 'white',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            />
          </div>
          <ShareButton
            deviceName={deviceName}
            activityStatus={activityStatus}
            duration={duration}
            startTime={startTime}
            endTime={endTime}
            location={address}
            coordinates={coordinates}
          />
        </Box>
        
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 1,
          mb: 2,
          backgroundColor: theme.palette.grey[50],
          p: 1.5,
          borderRadius: 1,
        }}>
          <Box>
            <Typography 
              fontSize="0.75rem" 
              color="textSecondary"
              sx={{ mb: 0.5 }}
            >
              Start Time
            </Typography>
            <Typography 
              fontSize="0.875rem" 
              fontWeight={600}
              color={theme.palette.primary.main}
            >
              {startTime.toLocaleTimeString()}
            </Typography>
          </Box>
          <Box>
            <Typography 
              fontSize="0.75rem" 
              color="textSecondary"
              sx={{ mb: 0.5 }}
            >
              End Time
            </Typography>
            <Typography 
              fontSize="0.875rem" 
              fontWeight={600}
              color={theme.palette.primary.main}
            >
              {endTime.toLocaleTimeString()}
            </Typography>
          </Box>
        </Box>
  
        <Box>
          <Typography 
            fontSize="0.75rem" 
            color="textSecondary"
            sx={{ mb: 0.5 }}
          >
            Location
          </Typography>
          <Typography 
            fontSize="0.875rem"
            sx={{
              color: theme.palette.text.primary,
              lineHeight: 1.4,
            }}
          >
            {address}
          </Typography>
        </Box>
      </Box>
    );
  };

  export default PopupContent;