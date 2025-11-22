/**
 * Surface Transformations Utility
 * Provides functions for normalizing, converting, and inverting optical surfaces
 */

/**
 * Normalize Opal Un Z surface coefficients to a new H value
 * Scales all polynomial coefficients (A3 through A13) based on the ratio between
 * the desired normalization value and the current H value
 *
 * @param {number} normalizationValue - Target H value (must be > 0)
 * @param {number} currentH - Current H value (must be > 0)
 * @param {Object} coefficients - Current coefficients {A3, A4, ..., A13}
 * @returns {Object} { coefficients, H, message }
 */
export const normalizeUnZ = (normalizationValue, currentH, coefficients) => {
    // Validate inputs
    if (normalizationValue <= 0) {
        throw new Error("Normalization value must be positive");
    }
    if (currentH <= 0) {
        throw new Error("Current H value must be positive");
    }
    if (currentH === normalizationValue) {
        return { coefficients, H: currentH, message: "H already equals normalization value" };
    }

    // Calculate ratio
    const ratio = normalizationValue / currentH;

    // Normalize coefficients A3 to A13
    const normalizedCoeffs = {};
    for (let n = 3; n <= 13; n++) {
        const key = `A${n}`;
        const currentValue = parseFloat(coefficients[key]) || 0;
        const factor = Math.pow(ratio, n);
        normalizedCoeffs[key] = (currentValue * factor).toString();
    }

    return {
        coefficients: normalizedCoeffs,
        H: normalizationValue,
        message: "Coefficients normalized successfully"
    };
};

/**
 * Convert Poly surface to Opal UnZ surface
 * Formula: A_n^(UnZ) = -(H^n / (2R)) × A_n^(Poly)
 * With H = 1, this simplifies to: A_n^(UnZ) = -(1 / (2R)) × A_n^(Poly)
 * Also: UnZ_e2 = Poly_A2 + 1
 *
 * @param {Object} polyParams - Poly surface parameters
 * @returns {Object} UnZ surface parameters
 */
export const convertPolyToUnZ = (polyParams) => {
    // Step 1: Parse input
    const polyA1 = parseFloat(polyParams.A1) || 0;
    const R = polyA1 / 2.0;
    const H = 1.0;

    // Step 2: Convert coefficients A3-A13
    const unzCoeffs = {};
    for (let n = 3; n <= 13; n++) {
        const polyA_n = parseFloat(polyParams[`A${n}`]) || 0;
        unzCoeffs[`A${n}`] = (-(Math.pow(H, n) / (2 * R)) * polyA_n).toString();
    }

    // Step 3: Convert A2
    const polyA2 = parseFloat(polyParams.A2) || 0;
    const unZ_e2 = polyA2 + 1;

    // Return converted parameters
    return {
        H: H.toString(),
        Radius: R.toString(),
        e2: unZ_e2.toString(),
        ...unzCoeffs
    };
};

/**
 * Convert Opal UnZ surface to Poly surface
 * Formula: A_n^(Poly) = -(2R / H^n) × A_n^(UnZ)
 * Also: Poly_A2 = UnZ_e2 - 1
 *
 * @param {Object} unzParams - UnZ surface parameters
 * @returns {Object} Poly surface parameters
 */
export const convertUnZToPoly = (unzParams) => {
    // Step 1: Parse input
    const R = parseFloat(unzParams.Radius) || 0;
    const H = parseFloat(unzParams.H) || 1;

    if (H <= 0) {
        throw new Error("H must be positive");
    }

    // Step 2: Convert coefficients A3-A13
    const polyCoeffs = {};
    for (let n = 3; n <= 13; n++) {
        const unzA_n = parseFloat(unzParams[`A${n}`]) || 0;
        polyCoeffs[`A${n}`] = (-(2 * R / Math.pow(H, n)) * unzA_n).toString();
    }

    // Step 3: Convert e2 to A2
    const unZ_e2 = parseFloat(unzParams.e2) || 0;
    const polyA2 = unZ_e2 - 1;

    // Return converted parameters
    return {
        A1: (2 * R).toString(),
        A2: polyA2.toString(),
        ...polyCoeffs
    };
};

/**
 * Change sign helper function
 * @param {string} value - Numeric string value
 * @returns {string} Negated value as string
 */
const changeSign = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue === 0) {
        return value; // Return original if not a number or if zero
    }
    return (-numValue).toString();
};

/**
 * Invert surface parameters by changing signs according to surface type rules
 *
 * @param {string} surfaceType - Type of surface
 * @param {Object} parameters - Current surface parameters
 * @returns {Object} Parameters with inverted signs
 */
export const invertSurface = (surfaceType, parameters) => {
    const result = { ...parameters };

    switch(surfaceType) {
        case 'Sphere':
            // Change sign of Radius only
            result.Radius = changeSign(result.Radius);
            break;

        case 'Even Asphere':
            // Change sign of Radius and all even coefficients
            result.Radius = changeSign(result.Radius);
            [4, 6, 8, 10, 12, 14, 16, 18, 20].forEach(n => {
                const key = `A${n}`;
                if (result[key] !== undefined) {
                    result[key] = changeSign(result[key]);
                }
            });
            break;

        case 'Odd Asphere':
            // Change sign of Radius and all coefficients A3-A20
            result.Radius = changeSign(result.Radius);
            for (let n = 3; n <= 20; n++) {
                const key = `A${n}`;
                if (result[key] !== undefined) {
                    result[key] = changeSign(result[key]);
                }
            }
            break;

        case 'Opal Un U':
            // Change sign of Radius and coefficients A2-A12
            result.Radius = changeSign(result.Radius);
            for (let n = 2; n <= 12; n++) {
                const key = `A${n}`;
                if (result[key] !== undefined) {
                    result[key] = changeSign(result[key]);
                }
            }
            break;

        case 'Opal Un Z':
            // Change sign of Radius and only even coefficients
            result.Radius = changeSign(result.Radius);
            [4, 6, 8, 10, 12].forEach(n => {
                const key = `A${n}`;
                if (result[key] !== undefined) {
                    result[key] = changeSign(result[key]);
                }
            });
            break;

        case 'Poly':
            // Change sign of only odd coefficients
            [1, 3, 5, 7, 9, 11, 13].forEach(n => {
                const key = `A${n}`;
                if (result[key] !== undefined) {
                    result[key] = changeSign(result[key]);
                }
            });
            break;

        case 'Irregular':
            // Change signs of: Radius, aberration coefficients, tilt parameters
            // Don't touch: angle and decenters
            result.Radius = changeSign(result.Radius);
            // Aberration coefficients
            if (result.Spherical !== undefined) result.Spherical = changeSign(result.Spherical);
            if (result.Astigmatism !== undefined) result.Astigmatism = changeSign(result.Astigmatism);
            if (result.Coma !== undefined) result.Coma = changeSign(result.Coma);
            // Tilt parameters
            if (result['Tilt X'] !== undefined) result['Tilt X'] = changeSign(result['Tilt X']);
            if (result['Tilt Y'] !== undefined) result['Tilt Y'] = changeSign(result['Tilt Y']);
            break;

        case 'Zernike':
            // Invert: radius, aspheric coefficients A4-A16, all Zernike coefficients Z1-Z37
            // Don't touch: Zernike decenter
            result.Radius = changeSign(result.Radius);
            // Aspheric coefficients A4, A6, A8, A10, A12, A14, A16
            [4, 6, 8, 10, 12, 14, 16].forEach(n => {
                const key = `A${n}`;
                if (result[key] !== undefined) {
                    result[key] = changeSign(result[key]);
                }
            });
            // Zernike coefficients Z1-Z37
            for (let n = 1; n <= 37; n++) {
                const key = `Z${n}`;
                if (result[key] !== undefined) {
                    result[key] = changeSign(result[key]);
                }
            }
            break;

        default:
            throw new Error(`Unsupported surface type for inversion: ${surfaceType}`);
    }

    return result;
};
