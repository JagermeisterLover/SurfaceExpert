// Universal parameters that apply to all or most surface types
// These are displayed in a separate "Universal" section in the UI
export const universalParameters = {
    'Sphere': ['Radius', 'Min Height', 'Max Height', 'Step'],
    'Even Asphere': ['Radius', 'Min Height', 'Max Height', 'Step'],
    'Odd Asphere': ['Radius', 'Min Height', 'Max Height', 'Step'],
    'Zernike': ['Radius', 'Min Height', 'Max Height', 'Step'],
    'Irregular': ['Radius', 'Min Height', 'Max Height', 'Step'],
    'Opal Un U': ['Radius', 'Min Height', 'Max Height', 'Step'],
    'Opal Un Z': ['Radius', 'Min Height', 'Max Height', 'Step'],
    'Poly': ['Min Height', 'Max Height', 'Step'] // Note: Poly uses A1 instead of Radius
};

// Surface-specific parameters (only the parameters unique to each surface type)
// These are displayed in the main parameters section
export const surfaceTypes = {
    'Sphere': [],
    'Even Asphere': ['Conic Constant', 'A4', 'A6', 'A8', 'A10', 'A12', 'A14', 'A16', 'A18', 'A20'],
    'Odd Asphere': ['Conic Constant', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15', 'A16', 'A17', 'A18', 'A19', 'A20'],
    'Zernike': ['Conic Constant', 'Extrapolate', 'Norm Radius', 'Number of Terms', 'A2', 'A4', 'A6', 'A8', 'A10', 'A12', 'A14', 'A16', 'Decenter X', 'Decenter Y', 'Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7', 'Z8', 'Z9', 'Z10', 'Z11', 'Z12', 'Z13', 'Z14', 'Z15', 'Z16', 'Z17', 'Z18', 'Z19', 'Z20', 'Z21', 'Z22', 'Z23', 'Z24', 'Z25', 'Z26', 'Z27', 'Z28', 'Z29', 'Z30', 'Z31', 'Z32', 'Z33', 'Z34', 'Z35', 'Z36', 'Z37', 'Scan Angle', 'X Coordinate', 'Y Coordinate'],
    'Irregular': ['Conic Constant', 'Decenter X', 'Decenter Y', 'Tilt X', 'Tilt Y', 'Spherical', 'Astigmatism', 'Coma', 'Angle', 'Scan Angle', 'X Coordinate', 'Y Coordinate'],
    'Opal Un U': ['e2', 'H', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12'],
    'Opal Un Z': ['e2', 'H', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13'],
    'Poly': ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13']
};

// Sample surface data
export const sampleSurfaces = [
    {
        id: 1,
        name: 'Spherical Surface',
        type: 'Sphere',
        color: '#4a90e2',
        parameters: {
            'Radius': '100.0',
            'Min Height': '0',
            'Max Height': '25.0'
        }
    }
];

// Zernike coefficient names (Z1-Z37)
export const zernikeNames = {
    'Z1': 'Piston',
    'Z2': 'Tilt X',
    'Z3': 'Tilt Y',
    'Z4': 'Defocus',
    'Z5': 'Astigmatism X',
    'Z6': 'Astigmatism Y',
    'Z7': 'Coma X',
    'Z8': 'Coma Y',
    'Z9': 'Primary Spherical',
    'Z10': 'Trefoil X',
    'Z11': 'Trefoil Y',
    'Z12': 'Secondary Astigmatism X',
    'Z13': 'Secondary Astigmatism Y',
    'Z14': 'Secondary Coma X',
    'Z15': 'Secondary Coma Y',
    'Z16': 'Secondary Spherical',
    'Z17': 'Tetrafoil X',
    'Z18': 'Tetrafoil Y',
    'Z19': 'Secondary Trefoil X',
    'Z20': 'Secondary Trefoil Y',
    'Z21': 'Tertiary Astigmatism X',
    'Z22': 'Tertiary Astigmatism Y',
    'Z23': 'Tertiary Coma X',
    'Z24': 'Tertiary Coma Y',
    'Z25': 'Tertiary Spherical',
    'Z26': 'Pentafoil X',
    'Z27': 'Pentafoil Y',
    'Z28': 'Secondary Tetrafoil X',
    'Z29': 'Secondary Tetrafoil Y',
    'Z30': 'Tertiary Trefoil X',
    'Z31': 'Tertiary Trefoil Y',
    'Z32': 'Quaternary Astigmatism X',
    'Z33': 'Quaternary Astigmatism Y',
    'Z34': 'Quaternary Coma X',
    'Z35': 'Quaternary Coma Y',
    'Z36': 'Quaternary Spherical',
    'Z37': 'Quinary Spherical'
};

// Color scheme for dark theme
export const colors = {
    bg: '#2b2b2b',        // Main background
    panel: '#353535',     // Panel background
    border: '#454545',    // Borders
    text: '#e0e0e0',      // Primary text
    textDim: '#a0a0a0',   // Secondary text
    accent: '#4a90e2',    // Accent color
    hover: '#454545'      // Hover state
};
