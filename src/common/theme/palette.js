import { grey, green, indigo, purple, yellow, blue, lightBlue, teal } from '@mui/material/colors';

const validatedColor = (color) => (/^#([0-9A-Fa-f]{3}){1,2}$/.test(color) ? color : null);

// Helper function for consistent dark/light mode colors


export default (server, darkMode) => {
  
  const getModeColor = (darkColor, lightColor, serverAttribute) => 
    validatedColor(server?.attributes?.[serverAttribute]) || (darkMode ? darkColor : lightColor);

  return ({
  mode: darkMode ? 'dark' : 'light',
  greys: {...grey},
  background: {
    default: darkMode ? grey[900] : grey[50],
  },
  primary: {
    main: getModeColor(indigo[200], indigo[800], 'colorPrimary'),
    light: darkMode ? indigo[100] : indigo[400],
    dark: darkMode ? indigo[400] : indigo[900],
    contrastText: darkMode ? grey[900] : grey[50],
  },
  secondary: {
    main: getModeColor(green[200], green[800], 'colorSecondary'),
    light: darkMode ? green[100] : green[500],
    dark: darkMode ? green[400] : green[900],
    contrastText: darkMode ? grey[900] : grey[50],
  },
  tertiary: {
    main: getModeColor(purple[200], purple[800], 'colorTertiary'),
    light: darkMode ? purple[100] : purple[500],
    dark: darkMode ? purple[400] : purple[900],
    contrastText: darkMode ? grey[900] : grey[50],
  },
  analogous: {
    main: getModeColor(lightBlue[200], lightBlue[800], 'colorAnalogous'),
    light: darkMode ? lightBlue[100] : lightBlue[500],
    dark: darkMode ? lightBlue[400] : lightBlue[900],
    contrastText: darkMode ? grey[900] : grey[50],
  },
  quadrial: {
    main: getModeColor(teal[200], teal[800], 'colorQuadrial'),
    light: darkMode ? teal[100] : teal[500],
    dark: darkMode ? teal[400] : teal[900],
    contrastText: darkMode ? grey[900] : grey[50],
  },
  error: {
    main: "#e81e1e",
    light: "#ff5c5c",
    dark: "#b30000",
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
  // Common colors
  common: {
    black: '#000',
    white: '#fff',
  },
  // Text colors
  text: {
    primary: darkMode ? grey[100] : grey[900],
    secondary: darkMode ? grey[400] : grey[600],
    disabled: darkMode ? grey[600] : grey[400],
  },
  // Divider color
  divider: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
})}