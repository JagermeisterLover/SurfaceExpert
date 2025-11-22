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
