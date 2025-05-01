const MapPin = ({ colors, color, text }) => {
  const colorA = colors ? colors[0] : color || '#ff8a80';
  const colorB = colors ? colors[1] : color || '#d32f2f';

  return `
        <svg version="1.1" id="Icons" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 32 32" xml:space="preserve" width="48px" height="48px">
            <defs>
            <linearGradient id="pinGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${colorA}"/>
                <stop offset="100%" stop-color="${colorB}"/>
            </linearGradient>
            </defs>
            <g id="SVGRepo_iconCarrier">
                <path d="M25,13c0,8-9,15-9,15s-9-7-9-15c0-5,4-9,9-9S25,8,25,13z" fill="url(#pinGradient)"/>
                <text x="16" y="16" text-anchor="middle" dominant-baseline="middle" style="font-family:Arial; font-size:8px; fill:#ffffff;">${text}</text>
            </g>
        </svg>
    `;
};

export default MapPin;
