// Surface type definitions with their parameters
export const surfaceTypes = {
    'Sphere': ['Radius', 'Min Height', 'Max Height'],
    'Even Asphere': ['Radius', 'Conic Constant', 'A4', 'A6', 'A8', 'A10', 'A12', 'A14', 'A16', 'A18', 'A20', 'Min Height', 'Max Height'],
    'Odd Asphere': ['Radius', 'Conic Constant', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'A14', 'A15', 'A16', 'A17', 'A18', 'A19', 'A20', 'Min Height', 'Max Height'],
    'Zernike': ['Radius', 'Conic Constant', 'Extrapolate', 'Norm Radius', 'Number of Terms', 'A2', 'A4', 'A6', 'A8', 'A10', 'A12', 'A14', 'A16', 'Decenter X', 'Decenter Y', 'Z1', 'Z2', 'Z3', 'Z4', 'Z5', 'Z6', 'Z7', 'Z8', 'Z9', 'Z10', 'Z11', 'Z12', 'Z13', 'Z14', 'Z15', 'Z16', 'Z17', 'Z18', 'Z19', 'Z20', 'Z21', 'Z22', 'Z23', 'Z24', 'Z25', 'Z26', 'Z27', 'Z28', 'Z29', 'Z30', 'Z31', 'Z32', 'Z33', 'Z34', 'Z35', 'Z36', 'Z37', 'Scan Angle', 'X Coordinate', 'Y Coordinate', 'Min Height', 'Max Height'],
    'Irregular': ['Radius', 'Conic Constant', 'Decenter X', 'Decenter Y', 'Tilt X', 'Tilt Y', 'Spherical', 'Astigmatism', 'Coma', 'Angle', 'Scan Angle', 'X Coordinate', 'Y Coordinate', 'Min Height', 'Max Height'],
    'Opal Un U': ['Radius', 'e2', 'H', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'Min Height', 'Max Height'],
    'Opal Un Z': ['Radius', 'e2', 'H', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'Min Height', 'Max Height'],
    'Poly': ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'A13', 'Min Height', 'Max Height']
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

// Available colorscales for plots
export const colorscales = [
    'Viridis', 'Plasma', 'Inferno', 'Magma', 'Cividis',
    'Blues', 'Greens', 'Greys', 'Oranges', 'Reds',
    'Rainbow', 'Jet', 'Hot', 'Cool', 'Spring',
    'Summer', 'Autumn', 'Winter', 'RdBu', 'RdYlBu'
];

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
