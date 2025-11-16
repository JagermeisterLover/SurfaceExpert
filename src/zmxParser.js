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
                'Max Height': String(maxHeight)
            };
        } else if (zmxSurface.type === 'EVENASPH') {
            // EVENASPH surface
            // PARM 1 is conic (ignore, use CONI instead)
            // PARM 2 is A2 (ignore, not supported)
            // PARM 3 is A4, PARM 4 is A6, etc.
            surfaceType = 'Even Asphere';
            parameters = {
                'Radius': String(radius),
                'Conic Constant': String(conicConstant),
                'A4': String(zmxSurface.parameters['PARM3'] || 0),
                'A6': String(zmxSurface.parameters['PARM4'] || 0),
                'A8': String(zmxSurface.parameters['PARM5'] || 0),
                'A10': String(zmxSurface.parameters['PARM6'] || 0),
                'A12': String(zmxSurface.parameters['PARM7'] || 0),
                'A14': String(zmxSurface.parameters['PARM8'] || 0),
                'A16': String(zmxSurface.parameters['PARM9'] || 0),
                'A18': String(zmxSurface.parameters['PARM10'] || 0),
                'A20': String(zmxSurface.parameters['PARM11'] || 0),
                'Min Height': '0',
                'Max Height': String(maxHeight)
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
                'Max Height': String(maxHeight)
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
                'Min Height': '0',
                'Max Height': String(maxHeight)
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
                'Max Height': String(maxHeight)
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
