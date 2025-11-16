// Surface calculation utilities
// This module contains helper functions for calculating surface properties
// Depends on: calculationsWrapper.js (SurfaceCalculations)

// Cache for best fit sphere parameters to avoid recalculation
const bfsCache = new Map();

/**
 * Get or calculate best fit sphere parameters (with caching)
 * @param {Object} surface - Surface object with type and parameters
 * @returns {Object} BFS parameters (method, R3/R4, etc.)
 */
export const getBestFitSphereParams = (surface) => {
    const cacheKey = JSON.stringify(surface.parameters);

    if (bfsCache.has(cacheKey)) {
        return bfsCache.get(cacheKey);
    }

    const parseParam = (name) => parseFloat(surface.parameters[name]) || 0;
    const minHeight = parseParam('Min Height');
    const maxHeight = parseParam('Max Height');

    // Calculate sag at min and max heights
    const zmin = calculateSagOnly(minHeight, surface);
    const zmax = calculateSagOnly(maxHeight, surface);

    let params;
    if (minHeight === 0) {
        const R3 = window.SurfaceCalculations.calculateBestFitSphereRadius3Points(maxHeight, zmax);
        const R = surface.type !== 'Poly' ? parseParam('Radius') : 0;
        params = { method: 'R3', R3, R };
    } else {
        const result = window.SurfaceCalculations.calculateBestFitSphereRadius4Points(minHeight, maxHeight, zmin, zmax);
        params = { method: 'R4', ...result };
    }

    bfsCache.set(cacheKey, params);
    return params;
};

/**
 * Calculate only sag (no asphericity or aberration to avoid recursion)
 * @param {number} r - Radial position (mm)
 * @param {Object} surface - Surface object
 * @returns {number} Sag value (mm)
 */
export const calculateSagOnly = (r, surface) => {
    const params = surface.parameters;
    const parseParam = (name) => parseFloat(params[name]) || 0;
    let sag = 0;

    try {
        if (surface.type === 'Sphere') {
            const R = parseParam('Radius');
            sag = window.SurfaceCalculations.calculateSphereSag(r, R);
        } else if (surface.type === 'Even Asphere') {
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const A4 = parseParam('A4'), A6 = parseParam('A6'), A8 = parseParam('A8'), A10 = parseParam('A10');
            const A12 = parseParam('A12'), A14 = parseParam('A14'), A16 = parseParam('A16'), A18 = parseParam('A18'), A20 = parseParam('A20');
            sag = window.SurfaceCalculations.calculateEvenAsphereSag(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20);
        } else if (surface.type === 'Odd Asphere') {
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6'), A7 = parseParam('A7');
            const A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12');
            const A13 = parseParam('A13'), A14 = parseParam('A14'), A15 = parseParam('A15'), A16 = parseParam('A16'), A17 = parseParam('A17');
            const A18 = parseParam('A18'), A19 = parseParam('A19'), A20 = parseParam('A20');
            sag = window.SurfaceCalculations.calculateOddAsphereSag(r, R, k, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16, A17, A18, A19, A20);
        } else if (surface.type === 'Opal Un U') {
            const R = parseParam('Radius'), e2 = parseParam('e2'), H = parseParam('H');
            const A2 = parseParam('A2'), A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6');
            const A7 = parseParam('A7'), A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12');
            sag = window.SurfaceCalculations.calculateOpalUnUSag(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12);
        } else if (surface.type === 'Opal Un Z') {
            const R = parseParam('Radius'), e2 = parseParam('e2'), H = parseParam('H');
            const A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6'), A7 = parseParam('A7');
            const A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12'), A13 = parseParam('A13');
            sag = window.SurfaceCalculations.calculateOpalUnZSag(r, R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
        } else if (surface.type === 'Poly') {
            const A1 = parseParam('A1'), A2 = parseParam('A2'), A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5');
            const A6 = parseParam('A6'), A7 = parseParam('A7'), A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10');
            const A11 = parseParam('A11'), A12 = parseParam('A12'), A13 = parseParam('A13');
            sag = window.SurfaceCalculations.calculatePolySag(r, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
        }
    } catch (e) {
        // Silent fail
    }

    return sag;
};

/**
 * Calculate all surface values for a given radial position
 * @param {number} r - Radial position (mm)
 * @param {Object} surface - Surface object
 * @param {number|null} x - X coordinate for non-rotationally symmetric surfaces
 * @param {number|null} y - Y coordinate for non-rotationally symmetric surfaces
 * @returns {Object} {sag, slope, asphericity, aberration, angle}
 */
export const calculateSurfaceValues = (r, surface, x = null, y = null) => {
    const params = surface.parameters;
    const parseParam = (name) => parseFloat(params[name]) || 0;

    let sag = 0, slope = 0, asphericity = 0, aberration = 0;

    try {
        if (surface.type === 'Sphere') {
            const R = parseParam('Radius');
            sag = window.SurfaceCalculations.calculateSphereSag(r, R);
            slope = window.SurfaceCalculations.calculateSphereSlope(r, R);
        } else if (surface.type === 'Even Asphere') {
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const A4 = parseParam('A4'), A6 = parseParam('A6'), A8 = parseParam('A8'), A10 = parseParam('A10');
            const A12 = parseParam('A12'), A14 = parseParam('A14'), A16 = parseParam('A16'), A18 = parseParam('A18'), A20 = parseParam('A20');
            sag = window.SurfaceCalculations.calculateEvenAsphereSag(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20);
            slope = window.SurfaceCalculations.calculateEvenAsphereSlope(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20);
        } else if (surface.type === 'Odd Asphere') {
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6'), A7 = parseParam('A7');
            const A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12');
            const A13 = parseParam('A13'), A14 = parseParam('A14'), A15 = parseParam('A15'), A16 = parseParam('A16'), A17 = parseParam('A17');
            const A18 = parseParam('A18'), A19 = parseParam('A19'), A20 = parseParam('A20');
            sag = window.SurfaceCalculations.calculateOddAsphereSag(r, R, k, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16, A17, A18, A19, A20);
            slope = window.SurfaceCalculations.calculateOddAsphereSlope(r, R, k, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16, A17, A18, A19, A20);
        } else if (surface.type === 'Zernike') {
            // Zernike surface requires x,y coordinates (non-rotationally symmetric)
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const normRadius = parseParam('Norm Radius');
            const dx = parseParam('Decenter X'), dy = parseParam('Decenter Y');
            const A2 = parseParam('A2'), A4 = parseParam('A4'), A6 = parseParam('A6'), A8 = parseParam('A8');
            const A10 = parseParam('A10'), A12 = parseParam('A12'), A14 = parseParam('A14'), A16 = parseParam('A16');

            // Collect all Zernike coefficients (Z1-Z37)
            const coeffs = {};
            for (let i = 1; i <= 37; i++) {
                coeffs[`Z${i}`] = parseParam(`Z${i}`);
            }

            const xCoord = x !== null ? x : r;
            const yCoord = y !== null ? y : 0;

            sag = window.SurfaceCalculations.calculateZernikeSag(xCoord, yCoord, R, k, normRadius, dx, dy, A2, A4, A6, A8, A10, A12, A14, A16, coeffs);
            return { sag, slope: 0, asphericity: 0, aberration: 0, angle: 0 };
        } else if (surface.type === 'Irregular') {
            // Irregular surface requires x,y coordinates (non-rotationally symmetric)
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const dx = parseParam('Decenter X'), dy = parseParam('Decenter Y');
            const tiltX = parseParam('Tilt X'), tiltY = parseParam('Tilt Y');
            const Zs = parseParam('Spherical'), Za = parseParam('Astigmatism'), Zc = parseParam('Coma');
            const angle = parseParam('Angle');
            const maxHeight = parseParam('Max Height');

            const xCoord = x !== null ? x : r;
            const yCoord = y !== null ? y : 0;

            sag = window.SurfaceCalculations.calculateIrregularSag(xCoord, yCoord, R, k, dx, dy, tiltX, tiltY, Zs, Za, Zc, angle, maxHeight);
            return { sag, slope: 0, asphericity: 0, aberration: 0, angle: 0 };
        } else if (surface.type === 'Opal Un U') {
            const R = parseParam('Radius'), e2 = parseParam('e2'), H = parseParam('H');
            const A2 = parseParam('A2'), A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6');
            const A7 = parseParam('A7'), A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12');
            sag = window.SurfaceCalculations.calculateOpalUnUSag(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12);
            slope = window.SurfaceCalculations.calculateOpalUnUSlope(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12);
        } else if (surface.type === 'Opal Un Z') {
            const R = parseParam('Radius'), e2 = parseParam('e2'), H = parseParam('H');
            const A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6'), A7 = parseParam('A7');
            const A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12'), A13 = parseParam('A13');
            sag = window.SurfaceCalculations.calculateOpalUnZSag(r, R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
            slope = window.SurfaceCalculations.calculateOpalUnZSlope(r, R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
        } else if (surface.type === 'Poly') {
            const A1 = parseParam('A1'), A2 = parseParam('A2'), A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5');
            const A6 = parseParam('A6'), A7 = parseParam('A7'), A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10');
            const A11 = parseParam('A11'), A12 = parseParam('A12'), A13 = parseParam('A13');
            sag = window.SurfaceCalculations.calculatePolySag(r, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
            slope = window.SurfaceCalculations.calculatePolySlope(r, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
        }

        // Calculate asphericity using cached BFS parameters
        const bfsParams = getBestFitSphereParams(surface);

        if (bfsParams.method === 'R3') {
            asphericity = window.SurfaceCalculations.calculateAsphericityForR3(r, sag, bfsParams.R3, bfsParams.R);
        } else {
            asphericity = window.SurfaceCalculations.calculateAsphericityForR4(r, sag, bfsParams.R4, bfsParams.zm, bfsParams.rm, bfsParams.g, bfsParams.Lz);
        }

        // Calculate aberration
        const R = surface.type !== 'Poly' ? parseParam('Radius') : 0;
        aberration = window.SurfaceCalculations.calculateAberrationOfNormals(sag, r, slope, R);

    } catch (e) {
        // Silent fail for calculation errors
    }

    // Calculate angle from slope
    const angle = Math.atan(slope) * (180 / Math.PI); // Convert to degrees

    return { sag, slope, asphericity, aberration, angle };
};

/**
 * Clear the BFS cache (useful when surfaces are modified)
 */
export const clearBFSCache = () => {
    bfsCache.clear();
};
