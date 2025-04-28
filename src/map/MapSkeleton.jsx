import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { keyframes } from '@emotion/react';
import { useTheme } from '@mui/material/styles';

// Animation for moving vehicles
const moveVehicle = keyframes`
  0% { transform: translateX(-10px); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateX(calc(100vw - 50px)); opacity: 0; }
`;

// Animation for pulsing landmarks
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

function MapSkeleton() {
  const theme = useTheme();
  
  return (
    <Box 
      position="relative" 
      width="100%" 
      height="100%" 
      bgcolor="grey.100"
      overflow="hidden"
      sx={{
        // Grid pattern background
        backgroundImage: `
          linear-gradient(to right, ${theme.palette.grey[200]} 1px, transparent 1px),
          linear-gradient(to bottom, ${theme.palette.grey[200]} 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px'
      }}
    >
      {/* Main horizontal road (responsive width) */}
      <Skeleton
        variant="rectangular"
        animation="wave"
        sx={{
          position: 'absolute',
          top: '30%',
          left: 0,
          right: 0,
          height: 6,
          borderRadius: 3,
          transform: 'rotate(-0.5deg)'
        }}
      />

      {/* Diagonal road */}
      <Skeleton
        variant="rectangular"
        animation="wave"
        sx={{
          position: 'absolute',
          top: '40%',
          left: '-10%',
          width: '120%',
          height: 5,
          borderRadius: 3,
          transform: 'rotate(5deg)',
          transformOrigin: 'left center'
        }}
      />

      {/* City blocks - responsive positioning */}
      <Box sx={{ position: 'absolute', top: '15%', left: '10%', width: '30%' }}>
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{
            width: '100%',
            height: '60px',
            borderRadius: 1,
            mb: 1
          }}
        />
        <Box display="flex" gap={1}>
          <Skeleton variant="rectangular" width="40%" height="40px" animation="wave" />
          <Skeleton variant="rounded" width="60%" height="40px" animation="wave" />
        </Box>
      </Box>

      {/* Circular landmark with pulse animation */}
      <Skeleton
        variant="circular"
        animation={false}
        sx={{
          position: 'absolute',
          top: '55%',
          left: '70%',
          width: '12%',
          height: '12%',
          maxWidth: 60,
          maxHeight: 60,
          animation: `${pulse} 2s infinite ease-in-out`,
          bgcolor: 'grey.300'
        }}
      />

      {/* Moving vehicles */}
      <Box
        sx={{
          position: 'absolute',
          top: 'calc(30% - 10px)',
          left: 0,
          width: 20,
          height: 20,
          animation: `${moveVehicle} 8s linear infinite`,
          animationDelay: '0.5s'
        }}
      >
        <Skeleton variant="circular" width={20} height={20} />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          top: 'calc(30% - 8px)',
          left: 0,
          width: 24,
          height: 16,
          animation: `${moveVehicle} 6s linear infinite`,
          animationDelay: '2s'
        }}
      >
        <Skeleton variant="rounded" width={24} height={16} />
      </Box>

      {/* Water area */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          right: '15%',
          width: '20%',
          height: '20%',
          bgcolor: 'grey.200',
          borderRadius: '50%',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            width: '100%',
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${theme.palette.grey[300]}, transparent)`,
            animation: `${keyframes`
              0% { transform: translateX(-50%); }
              100% { transform: translateX(0); }
            `} 3s linear infinite`
          }}
        />
      </Box>

      {/* Loading progress text */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Skeleton variant="text" width={80} height={20} />
        <Skeleton variant="circular" width={16} height={16} />
      </Box>
    </Box>
  );
}

export default MapSkeleton;