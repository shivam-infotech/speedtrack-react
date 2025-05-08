import {
  blue, green, grey, yellow,
} from '@mui/material/colors';

const validatedColor = (color) => (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color) ? color : null);

export default (server, darkMode) => {
  const getModeColor = (darkColor, lightColor, serverAttribute) => validatedColor(server?.attributes?.[serverAttribute]) || (darkMode ? darkColor : lightColor);

  return ({
    mode: darkMode ? 'dark' : 'light',
    greys: { ...grey },
    background: {
      default: darkMode ? '#1E1E1E' : '#FAF9F6',
    },
    primary: {
      main: getModeColor('#8AB4F8', '#3B82F6', 'colorPrimary'),
      light: darkMode ? '#93C5FD' : '#60A5FA',
      dark: darkMode ? '#2563EB' : '#1D4ED8',
      contrastText: darkMode ? grey[900] : grey[50],
    },
    secondary: {
      main: getModeColor('#FDE68A', '#FBBF24', 'colorSecondary'),
      light: darkMode ? '#FEF3C7' : '#FCD34D',
      dark: darkMode ? '#F59E0B' : '#B45309',
      contrastText: darkMode ? grey[900] : grey[50],
    },
    tertiary: {
      main: getModeColor('#C4B5FD', '#8B5CF6', 'colorTertiary'),
      light: darkMode ? '#DDD6FE' : '#A78BFA',
      dark: darkMode ? '#7C3AED' : '#6D28D9',
      contrastText: darkMode ? grey[900] : grey[50],
    },
    analogous: {
      main: getModeColor('#BAE6FD', '#38BDF8', 'colorAnalogous'),
      light: darkMode ? '#E0F2FE' : '#0EA5E9',
      dark: darkMode ? '#7DD3FC' : '#0369A1',
      contrastText: darkMode ? grey[900] : grey[50],
    },
    quadrial: {
      main: getModeColor('#A7F3D0', '#34D399', 'colorQuadrial'),
      light: darkMode ? '#D1FAE5' : '#10B981',
      dark: darkMode ? '#6EE7B7' : '#047857',
      contrastText: darkMode ? grey[900] : grey[50],
    },
    error: {
      main: '#e81e1e',
      light: '#ff5c5c',
      dark: '#b30000',
      contrastText: grey[50],
    },
    warning: {
      main: yellow[700],
      light: yellow[500],
      dark: yellow[900],
      contrastText: grey[900],
    },
    info: {
      main: blue[500],
      light: blue[300],
      dark: blue[700],
      contrastText: grey[50],
    },
    success: {
      main: green[500],
      light: green[300],
      dark: green[700],
      contrastText: grey[50],
    },
    neutral: {
      main: grey[500],
      light: grey[300],
      dark: grey[700],
      contrastText: grey[50],
    },
    geometry: {
      main: '#3bb2d0',
      light: '#7fd8ed',
      dark: '#008fb3',
      contrastText: grey[50],
    },
    common: {
      black: '#000',
      white: '#fff',
    },
    text: {
      primary: darkMode ? grey[100] : '#1E293B',
      secondary: darkMode ? grey[400] : '#475569',
      disabled: darkMode ? grey[600] : grey[400],
    },
    divider: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    action: {
      active: darkMode ? grey[300] : grey[700],
      hover: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      selected: darkMode ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)',
      disabled: darkMode ? grey[600] : grey[400],
      disabledBackground: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      focus: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    },
  });
};
