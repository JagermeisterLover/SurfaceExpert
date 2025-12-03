// ZMX File Parser for Zemax Optical Design Files
// Parses SURF entries and extracts optical surface parameters

class ZMXParser {
    /**
     * Parse ZMX file content and extract surface information
     * @param {string} content - The raw ZMX file content
     * @returns {Array} Array of parsed surface objects
     */
    static parse(content) {
        const surfaces = [];
        const lines = content.split('\n').map(line => line.trim());

        let currentSurface = null;
        let currentSurfaceIndex = -1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Start of a new surface
            if (line.startsWith('SURF ')) {
                if (currentSurface) {
                    surfaces.push(currentSurface);
                }

                const surfaceNumber = parseInt(line.split(' ')[1]);
                currentSurface = {
                    surfaceNumber,
                    type: 'STANDARD',
                    radius: 0,
                    curvature: 0,
                    conicConstant: 0,
                    diameter: 0,
                    parameters: {},
                    rawType: 'STANDARD'
                };
                currentSurfaceIndex = surfaceNumber;
            }

            if (!currentSurface) continue;

            // Parse TYPE
            if (line.startsWith('TYPE ')) {
                const type = line.substring(5).trim();
                currentSurface.type = type;
                currentSurface.rawType = type;

                // Check for USERSURF polynomial
                if (type.includes('USERSURF') && type.includes('us_polynomial.dll')) {
                    currentSurface.type = 'USERSURF_POLYNOMIAL';
                }
            }

            // Parse CURV (curvature - reciprocal is radius)
            if (line.startsWith('CURV ')) {
                const parts = line.split(/\s+/);
                const curvature = parseFloat(parts[1]);
                currentSurface.curvature = curvature;
                // Radius = 1/curvature (handle zero curvature)
                currentSurface.radius = curvature !== 0 ? 1 / curvature : 0;
            }

            // Parse DIAM (diameter/max radial height)
            if (line.startsWith('DIAM ')) {
                const parts = line.split(/\s+/);
                const diameter = parseFloat(parts[1]);
                currentSurface.diameter = diameter;
            }

            // Parse CONI (conic constant)
            if (line.startsWith('CONI ')) {
                const parts = line.split(/\s+/);
                const conic = parseFloat(parts[1]);
                currentSurface.conicConstant = isNaN(conic) ? 0 : conic;
            }

            // Parse PARM (polynomial parameters)
            if (line.startsWith('PARM ')) {
                const parts = line.split(/\s+/);
                const paramNumber = parseInt(parts[1]);
                const paramValue = parseFloat(parts[2]);
                currentSurface.parameters[`PARM${paramNumber}`] = isNaN(paramValue) ? 0 : paramValue;
            }

            // Parse XDAT (extra data fields)
            if (line.startsWith('XDAT ')) {
                const parts = line.split(/\s+/);
                const xdatNumber = parseInt(parts[1]);
                const xdatValue = parseFloat(parts[2]);
                currentSurface.parameters[`XDAT${xdatNumber}`] = isNaN(xdatValue) ? 0 : xdatValue;
            }
        }

        // Add the last surface
        if (currentSurface) {
            surfaces.push(currentSurface);
        }

        return surfaces;
    }

    /**
     * Convert ZMX surface to application surface format
     * @param {object} zmxSurface - Parsed ZMX surface
     * @param {number} id - Surface ID for the application
     * @param {string} color - Color for the surface
     * @returns {object} Surface object in application format
     */
    static convertToAppSurface(zmxSurface, id, color) {
        const name = `ZMX Surface ${zmxSurface.surfaceNumber}`;
        const maxHeight = zmxSurface.diameter || 25;
        const radius = zmxSurface.radius;
        const conicConstant = zmxSurface.conicConstant;

        // Determine surface type and map parameters
        let surfaceType = 'Even Asphere'; // Default
        let parameters = {};

        if (zmxSurface.type === 'STANDARD') {
            // STANDARD surfaces are treated as Even Asphere
            surfaceType = 'Even Asphere';
            parameters = {
                'Radius': String(radius),
                'Conic Constant': String(conicConstant),
                'A4': '0',
                'A6': '0',
                'A8': '0',
                'A10': '0',
                'A12': '0',
                'A14': '0',
                'A16': '0',
                'A18': '0',
                'A20': '0',
                'Min Height': '0',
                'Max Height': String(maxHeight),
                'Step': '1'
            };
        } else if (zmxSurface.type === 'EVENASPH') {
            // EVENASPH surface
            // PARM 1 is A2 (r² term - ignore, not used in standard even asphere)
            // PARM 2 is A4 (r⁴ term)
            // PARM 3 is A6 (r⁶ term), etc.
            surfaceType = 'Even Asphere';
            parameters = {
                'Radius': String(radius),
                'Conic Constant': String(conicConstant),
                'A4': String(zmxSurface.parameters['PARM2'] || 0),
                'A6': String(zmxSurface.parameters['PARM3'] || 0),
                'A8': String(zmxSurface.parameters['PARM4'] || 0),
                'A10': String(zmxSurface.parameters['PARM5'] || 0),
                'A12': String(zmxSurface.parameters['PARM6'] || 0),
                'A14': String(zmxSurface.parameters['PARM7'] || 0),
                'A16': String(zmxSurface.parameters['PARM8'] || 0),
                'A18': String(zmxSurface.parameters['PARM9'] || 0),
                'A20': String(zmxSurface.parameters['PARM10'] || 0),
                'Min Height': '0',
                'Max Height': String(maxHeight),
                'Step': '1'
            };
        } else if (zmxSurface.type === 'ODDASPHE') {
            // ODDASPHE surface
            // PARM 1 is A1 (ignore)
            // PARM 2 is A2 (ignore)
            // PARM 3 is A3, PARM 4 is A4, etc.
            surfaceType = 'Odd Asphere';
            parameters = {
                'Radius': String(radius),
                'Conic Constant': String(conicConstant),
                'A3': String(zmxSurface.parameters['PARM3'] || 0),
                'A4': String(zmxSurface.parameters['PARM4'] || 0),
                'A5': String(zmxSurface.parameters['PARM5'] || 0),
                'A6': String(zmxSurface.parameters['PARM6'] || 0),
                'A7': String(zmxSurface.parameters['PARM7'] || 0),
                'A8': String(zmxSurface.parameters['PARM8'] || 0),
                'A9': String(zmxSurface.parameters['PARM9'] || 0),
                'A10': String(zmxSurface.parameters['PARM10'] || 0),
                'A11': String(zmxSurface.parameters['PARM11'] || 0),
                'A12': String(zmxSurface.parameters['PARM12'] || 0),
                'A13': String(zmxSurface.parameters['PARM13'] || 0),
                'A14': String(zmxSurface.parameters['PARM14'] || 0),
                'A15': String(zmxSurface.parameters['PARM15'] || 0),
                'A16': String(zmxSurface.parameters['PARM16'] || 0),
                'A17': String(zmxSurface.parameters['PARM17'] || 0),
                'A18': String(zmxSurface.parameters['PARM18'] || 0),
                'A19': String(zmxSurface.parameters['PARM19'] || 0),
                'A20': String(zmxSurface.parameters['PARM20'] || 0),
                'Min Height': '0',
                'Max Height': String(maxHeight),
                'Step': '1'
            };
        } else if (zmxSurface.type === 'IRREGULA') {
            // IRREGULA surface
            // PARM 1 = Decenter X
            // PARM 2 = Decenter Y
            // PARM 3 = Tilt X
            // PARM 4 = Tilt Y
            // PARM 5 = Spherical aberration
            // PARM 6 = Astigmatism
            // PARM 7 = Coma
            // PARM 8 = Angle
            // CONI = Conic Constant
            surfaceType = 'Irregular';
            parameters = {
                'Radius': String(radius),
                'Conic Constant': String(conicConstant),
                'Decenter X': String(zmxSurface.parameters['PARM1'] || 0),
                'Decenter Y': String(zmxSurface.parameters['PARM2'] || 0),
                'Tilt X': String(zmxSurface.parameters['PARM3'] || 0),
                'Tilt Y': String(zmxSurface.parameters['PARM4'] || 0),
                'Spherical': String(zmxSurface.parameters['PARM5'] || 0),
                'Astigmatism': String(zmxSurface.parameters['PARM6'] || 0),
                'Coma': String(zmxSurface.parameters['PARM7'] || 0),
                'Angle': String(zmxSurface.parameters['PARM8'] || 0),
                'Scan Angle': '0',
                'X Coordinate': '0',
                'Y Coordinate': '0',
                'Min Height': '0',
                'Max Height': String(maxHeight),
                'Step': '1'
            };
        } else if (zmxSurface.type === 'FZERNSAG') {
            // FZERNSAG surface (Zernike Standard Sag)
            // PARM 0 = Extrapolate
            // PARM 1-8 = A2, A4, A6, A8, A10, A12, A14, A16 (aspheric coefficients)
            // PARM 9 = Zernike Decenter X
            // PARM 10 = Zernike Decenter Y
            // XDAT 1 = Number of Terms
            // XDAT 2 = Normalization Radius
            // XDAT 3-39 = Z1-Z37 (Zernike coefficients)
            surfaceType = 'Zernike';

            // Get key parameters
            const extrapolate = zmxSurface.parameters['PARM0'] || 0;
            const numTerms = zmxSurface.parameters['XDAT1'] || 0;
            const normRadius = zmxSurface.parameters['XDAT2'] || maxHeight;
            const decenterX = zmxSurface.parameters['PARM9'] || 0;
            const decenterY = zmxSurface.parameters['PARM10'] || 0;

            parameters = {
                'Radius': String(radius),
                'Conic Constant': String(conicConstant),
                'Extrapolate': String(extrapolate),
                'Norm Radius': String(normRadius),
                'Number of Terms': String(numTerms),
                'A2': String(zmxSurface.parameters['PARM1'] || 0),
                'A4': String(zmxSurface.parameters['PARM2'] || 0),
                'A6': String(zmxSurface.parameters['PARM3'] || 0),
                'A8': String(zmxSurface.parameters['PARM4'] || 0),
                'A10': String(zmxSurface.parameters['PARM5'] || 0),
                'A12': String(zmxSurface.parameters['PARM6'] || 0),
                'A14': String(zmxSurface.parameters['PARM7'] || 0),
                'A16': String(zmxSurface.parameters['PARM8'] || 0),
                'Decenter X': String(decenterX),
                'Decenter Y': String(decenterY),
                'Z1': String(zmxSurface.parameters['XDAT3'] || 0),
                'Z2': String(zmxSurface.parameters['XDAT4'] || 0),
                'Z3': String(zmxSurface.parameters['XDAT5'] || 0),
                'Z4': String(zmxSurface.parameters['XDAT6'] || 0),
                'Z5': String(zmxSurface.parameters['XDAT7'] || 0),
                'Z6': String(zmxSurface.parameters['XDAT8'] || 0),
                'Z7': String(zmxSurface.parameters['XDAT9'] || 0),
                'Z8': String(zmxSurface.parameters['XDAT10'] || 0),
                'Z9': String(zmxSurface.parameters['XDAT11'] || 0),
                'Z10': String(zmxSurface.parameters['XDAT12'] || 0),
                'Z11': String(zmxSurface.parameters['XDAT13'] || 0),
                'Z12': String(zmxSurface.parameters['XDAT14'] || 0),
                'Z13': String(zmxSurface.parameters['XDAT15'] || 0),
                'Z14': String(zmxSurface.parameters['XDAT16'] || 0),
                'Z15': String(zmxSurface.parameters['XDAT17'] || 0),
                'Z16': String(zmxSurface.parameters['XDAT18'] || 0),
                'Z17': String(zmxSurface.parameters['XDAT19'] || 0),
                'Z18': String(zmxSurface.parameters['XDAT20'] || 0),
                'Z19': String(zmxSurface.parameters['XDAT21'] || 0),
                'Z20': String(zmxSurface.parameters['XDAT22'] || 0),
                'Z21': String(zmxSurface.parameters['XDAT23'] || 0),
                'Z22': String(zmxSurface.parameters['XDAT24'] || 0),
                'Z23': String(zmxSurface.parameters['XDAT25'] || 0),
                'Z24': String(zmxSurface.parameters['XDAT26'] || 0),
                'Z25': String(zmxSurface.parameters['XDAT27'] || 0),
                'Z26': String(zmxSurface.parameters['XDAT28'] || 0),
                'Z27': String(zmxSurface.parameters['XDAT29'] || 0),
                'Z28': String(zmxSurface.parameters['XDAT30'] || 0),
                'Z29': String(zmxSurface.parameters['XDAT31'] || 0),
                'Z30': String(zmxSurface.parameters['XDAT32'] || 0),
                'Z31': String(zmxSurface.parameters['XDAT33'] || 0),
                'Z32': String(zmxSurface.parameters['XDAT34'] || 0),
                'Z33': String(zmxSurface.parameters['XDAT35'] || 0),
                'Z34': String(zmxSurface.parameters['XDAT36'] || 0),
                'Z35': String(zmxSurface.parameters['XDAT37'] || 0),
                'Z36': String(zmxSurface.parameters['XDAT38'] || 0),
                'Z37': String(zmxSurface.parameters['XDAT39'] || 0),
                'Scan Angle': '0',
                'X Coordinate': '0',
                'Y Coordinate': '0',
                'Min Height': '0',
                'Max Height': String(maxHeight),
                'Step': '1'
            };
        } else if (zmxSurface.type === 'USERSURF_POLYNOMIAL') {
            // USERSURF us_polynomial.dll surface
            // CURV = 1/R, so A1 = 2*R = 2/CURV
            // PARM 1-12 = A2-A13
            surfaceType = 'Poly';

            // Calculate A1 from curvature: A1 = 2*R = 2/CURV
            const a1 = zmxSurface.curvature !== 0 ? 2 / zmxSurface.curvature : 0;

            parameters = {
                'A1': String(a1),
                'A2': String(zmxSurface.parameters['PARM1'] || 0),
                'A3': String(zmxSurface.parameters['PARM2'] || 0),
                'A4': String(zmxSurface.parameters['PARM3'] || 0),
                'A5': String(zmxSurface.parameters['PARM4'] || 0),
                'A6': String(zmxSurface.parameters['PARM5'] || 0),
                'A7': String(zmxSurface.parameters['PARM6'] || 0),
                'A8': String(zmxSurface.parameters['PARM7'] || 0),
                'A9': String(zmxSurface.parameters['PARM8'] || 0),
                'A10': String(zmxSurface.parameters['PARM9'] || 0),
                'A11': String(zmxSurface.parameters['PARM10'] || 0),
                'A12': String(zmxSurface.parameters['PARM11'] || 0),
                'A13': String(zmxSurface.parameters['PARM12'] || 0),
                'Min Height': '0',
                'Max Height': String(maxHeight),
                'Step': '1'
            };
        } else {
            // Unsupported surface type, default to Even Asphere
            surfaceType = 'Even Asphere';
            parameters = {
                'Radius': String(radius),
                'Conic Constant': String(conicConstant),
                'A4': '0',
                'A6': '0',
                'A8': '0',
                'A10': '0',
                'A12': '0',
                'A14': '0',
                'A16': '0',
                'A18': '0',
                'A20': '0',
                'Min Height': '0',
                'Max Height': String(maxHeight),
                'Step': '1'
            };
        }

        return {
            id,
            name,
            type: surfaceType,
            color,
            parameters,
            zmxType: zmxSurface.rawType,
            zmxSurfaceNumber: zmxSurface.surfaceNumber
        };
    }

    /**
     * Get a human-readable summary of a ZMX surface
     * @param {object} zmxSurface - Parsed ZMX surface
     * @returns {object} Summary information
     */
    static getSurfaceSummary(zmxSurface) {
        const parmCount = Object.keys(zmxSurface.parameters).length;
        return {
            number: zmxSurface.surfaceNumber,
            type: zmxSurface.type,
            radius: zmxSurface.radius.toFixed(6),
            diameter: zmxSurface.diameter.toFixed(3),
            conic: zmxSurface.conicConstant.toFixed(6),
            parameterCount: parmCount
        };
    }
}

// Export for use in Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ZMXParser;
}
