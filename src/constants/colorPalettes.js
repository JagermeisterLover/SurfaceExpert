/**
 * Color palette definitions for the application
 * Each palette defines colors for background, panels, borders, text, and accents
 */

export const colorPalettes = {
  'Dark Gray (Default)': {
    bg: '#2b2b2b',
    panel: '#353535',
    border: '#454545',
    text: '#e0e0e0',
    textDim: '#a0a0a0',
    accent: '#4a90e2',
    hover: '#454545'
  },
  'Dark Blue': {
    bg: '#1e2433',
    panel: '#2a3144',
    border: '#3a4255',
    text: '#e0e6f0',
    textDim: '#8b95a8',
    accent: '#5b9bd5',
    hover: '#3a4255'
  },
  'Dark Purple': {
    bg: '#2a1f35',
    panel: '#362949',
    border: '#443558',
    text: '#e8e0f0',
    textDim: '#9d8fae',
    accent: '#9b72cf',
    hover: '#443558'
  },
  'Dark Green': {
    bg: '#1f2b24',
    panel: '#2a3832',
    border: '#384540',
    text: '#e0f0e6',
    textDim: '#8fa99a',
    accent: '#5cb85c',
    hover: '#384540'
  },
  'Dark Red': {
    bg: '#2b1f1f',
    panel: '#3d2a2a',
    border: '#4d3535',
    text: '#f0e0e0',
    textDim: '#a88f8f',
    accent: '#e74c3c',
    hover: '#4d3535'
  },
  'Dark Teal': {
    bg: '#1a2e2e',
    panel: '#253d3d',
    border: '#2f4d4d',
    text: '#e0f0f0',
    textDim: '#8ba8a8',
    accent: '#1abc9c',
    hover: '#2f4d4d'
  },
  'Midnight Blue': {
    bg: '#0f1419',
    panel: '#1a2332',
    border: '#283447',
    text: '#d9e6f2',
    textDim: '#7a8ea8',
    accent: '#3b8eea',
    hover: '#283447'
  },
  'Warm Amber': {
    bg: '#2d2416',
    panel: '#3d3123',
    border: '#4d3e2f',
    text: '#f0e8d9',
    textDim: '#b8a789',
    accent: '#f39c12',
    hover: '#4d3e2f'
  },
  'Forest': {
    bg: '#1a2618',
    panel: '#243325',
    border: '#2e4030',
    text: '#e6f0e0',
    textDim: '#92a88a',
    accent: '#27ae60',
    hover: '#2e4030'
  },
  'Sunset Orange': {
    bg: '#2b1e16',
    panel: '#3d2e23',
    border: '#4d3d2f',
    text: '#f0e4d9',
    textDim: '#b89d85',
    accent: '#e67e22',
    hover: '#4d3d2f'
  },
  'Cool Gray': {
    bg: '#22252a',
    panel: '#2e3238',
    border: '#3d4148',
    text: '#e8eaed',
    textDim: '#9fa3a8',
    accent: '#5294e2',
    hover: '#3d4148'
  },
  'Deep Ocean': {
    bg: '#0d1a26',
    panel: '#162938',
    border: '#1f3a4d',
    text: '#d9e8f5',
    textDim: '#7a9cb8',
    accent: '#1890ff',
    hover: '#1f3a4d'
  },
  'Mocha': {
    bg: '#2a1f1a',
    panel: '#3a2d26',
    border: '#4a3a32',
    text: '#ede4d9',
    textDim: '#a89685',
    accent: '#c78a5c',
    hover: '#4a3a32'
  },
  'Slate': {
    bg: '#1e2228',
    panel: '#282e38',
    border: '#353c48',
    text: '#e0e4ea',
    textDim: '#8b95a5',
    accent: '#64b5f6',
    hover: '#353c48'
  },
  'Wine': {
    bg: '#261a1f',
    panel: '#36252c',
    border: '#463039',
    text: '#f0e0e5',
    textDim: '#a88992',
    accent: '#c2185b',
    hover: '#463039'
  },
  'Charcoal': {
    bg: '#181818',
    panel: '#242424',
    border: '#333333',
    text: '#e8e8e8',
    textDim: '#888888',
    accent: '#2196f3',
    hover: '#333333'
  },
  'True Black': {
    bg: '#000000',
    panel: '#121212',
    border: '#2a2a2a',
    text: '#ffffff',
    textDim: '#909090',
    accent: '#0d7bff',
    hover: '#2a2a2a'
  },
  'Light': {
    bg: '#f5f5f5',
    panel: '#ffffff',
    border: '#d0d0d0',
    text: '#2b2b2b',
    textDim: '#6b6b6b',
    accent: '#0066cc',
    hover: '#e8e8e8'
  },
  'Light Blue': {
    bg: '#e8f4f8',
    panel: '#f5fafc',
    border: '#b8d4e0',
    text: '#1a3d4d',
    textDim: '#4a6d7d',
    accent: '#0277bd',
    hover: '#d8e9f0'
  },
  'Light Warm': {
    bg: '#f8f4e8',
    panel: '#fffcf5',
    border: '#e0d4b8',
    text: '#3d2d1a',
    textDim: '#6d5d4a',
    accent: '#d68910',
    hover: '#f0e9d8'
  },
  'High Contrast': {
    bg: '#000000',
    panel: '#0a0a0a',
    border: '#ffffff',
    text: '#ffffff',
    textDim: '#cccccc',
    accent: '#00ff00',
    hover: '#1a1a1a'
  }
};

// Get palette by name, fallback to default if not found
export const getPalette = (name) => {
  return colorPalettes[name] || colorPalettes['Dark Gray (Default)'];
};

// Get list of palette names
export const getPaletteNames = () => {
  return Object.keys(colorPalettes);
};

// Check if a palette is light themed (for plot adjustments)
export const isLightPalette = (name) => {
  const lightPalettes = ['Light', 'Light Blue', 'Light Warm'];
  return lightPalettes.includes(name);
};

// Calculate luminance from hex color
const getLuminance = (hexColor) => {
  const rgb = parseInt(hexColor.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  // Relative luminance formula
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

// Get appropriate grid color for the palette
// Can accept either a palette name (string) or a palette object
export const getGridColor = (palette) => {
  // If palette is a string (theme name), check if it's light
  if (typeof palette === 'string') {
    if (isLightPalette(palette)) {
      return 'rgba(0, 0, 0, 0.1)';
    }
    return 'rgba(255, 255, 255, 0.1)';
  }

  // If palette is an object, check background luminance
  if (palette && palette.bg) {
    const luminance = getLuminance(palette.bg);
    // If background is light (luminance > 128), use dark grid lines
    if (luminance > 128) {
      return 'rgba(0, 0, 0, 0.1)';
    }
  }

  // Default to light grid lines for dark themes
  return 'rgba(255, 255, 255, 0.1)';
};
