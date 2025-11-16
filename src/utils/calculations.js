// Cache for best fit sphere parameters to avoid recalculation
const bfsCache = new Map();

// Helper function to get or calculate best fit sphere parameters
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
        const R3 = SurfaceCalculations.calculateBestFitSphereRadius3Points(maxHeight, zmax);
        const R = surface.type !== 'Poly' ? parseParam('Radius') : 0;
        params = { method: 'R3', R3, R };
    } else {
        const result = SurfaceCalculations.calculateBestFitSphereRadius4Points(minHeight, maxHeight, zmin, zmax);
        params = { method: 'R4', ...result };
    }

    bfsCache.set(cacheKey, params);
    return params;
};

// Helper function to calculate only sag (no asphericity or aberration to avoid recursion)
export const calculateSagOnly = (r, surface) => {
    const params = surface.parameters;
    const parseParam = (name) => parseFloat(params[name]) || 0;
    let sag = 0;

    try {
        if (surface.type === 'Sphere') {
            const R = parseParam('Radius');
            sag = SurfaceCalculations.calculateSphereSag(r, R);
        } else if (surface.type === 'Even Asphere') {
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const A4 = parseParam('A4'), A6 = parseParam('A6'), A8 = parseParam('A8'), A10 = parseParam('A10');
            const A12 = parseParam('A12'), A14 = parseParam('A14'), A16 = parseParam('A16'), A18 = parseParam('A18'), A20 = parseParam('A20');
            sag = SurfaceCalculations.calculateEvenAsphereSag(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20);
        } else if (surface.type === 'Odd Asphere') {
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6'), A7 = parseParam('A7');
            const A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12');
            const A13 = parseParam('A13'), A14 = parseParam('A14'), A15 = parseParam('A15'), A16 = parseParam('A16'), A17 = parseParam('A17');
            const A18 = parseParam('A18'), A19 = parseParam('A19'), A20 = parseParam('A20');
            sag = SurfaceCalculations.calculateOddAsphereSag(r, R, k, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16, A17, A18, A19, A20);
        } else if (surface.type === 'Opal Un U') {
            const R = parseParam('Radius'), e2 = parseParam('e2'), H = parseParam('H');
            const A2 = parseParam('A2'), A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6');
            const A7 = parseParam('A7'), A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12');
            sag = SurfaceCalculations.calculateOpalUnUSag(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12);
        } else if (surface.type === 'Opal Un Z') {
            const R = parseParam('Radius'), e2 = parseParam('e2'), H = parseParam('H');
            const A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6'), A7 = parseParam('A7');
            const A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12'), A13 = parseParam('A13');
            sag = SurfaceCalculations.calculateOpalUnZSag(r, R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
        } else if (surface.type === 'Poly') {
            const A1 = parseParam('A1'), A2 = parseParam('A2'), A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5');
            const A6 = parseParam('A6'), A7 = parseParam('A7'), A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10');
            const A11 = parseParam('A11'), A12 = parseParam('A12'), A13 = parseParam('A13');
            sag = SurfaceCalculations.calculatePolySag(r, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
        }
    } catch (e) {
        // Silent fail
    }

    return sag;
};

// Helper function to calculate all values for a given r
export const calculateSurfaceValues = (r, surface, x = null, y = null) => {
    const params = surface.parameters;
    const parseParam = (name) => parseFloat(params[name]) || 0;

    let sag = 0, slope = 0, asphericity = 0, aberration = 0;

    try {
        if (surface.type === 'Sphere') {
            const R = parseParam('Radius');
            sag = SurfaceCalculations.calculateSphereSag(r, R);
            slope = SurfaceCalculations.calculateSphereSlope(r, R);
        } else if (surface.type === 'Even Asphere') {
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const A4 = parseParam('A4'), A6 = parseParam('A6'), A8 = parseParam('A8'), A10 = parseParam('A10');
            const A12 = parseParam('A12'), A14 = parseParam('A14'), A16 = parseParam('A16'), A18 = parseParam('A18'), A20 = parseParam('A20');
            sag = SurfaceCalculations.calculateEvenAsphereSag(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20);
            slope = SurfaceCalculations.calculateEvenAsphereSlope(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20);
        } else if (surface.type === 'Odd Asphere') {
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6'), A7 = parseParam('A7');
            const A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12');
            const A13 = parseParam('A13'), A14 = parseParam('A14'), A15 = parseParam('A15'), A16 = parseParam('A16'), A17 = parseParam('A17');
            const A18 = parseParam('A18'), A19 = parseParam('A19'), A20 = parseParam('A20');
            sag = SurfaceCalculations.calculateOddAsphereSag(r, R, k, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16, A17, A18, A19, A20);
            slope = SurfaceCalculations.calculateOddAsphereSlope(r, R, k, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16, A17, A18, A19, A20);
        } else if (surface.type === 'Zernike') {
            // Zernike surface requires x,y coordinates (non-rotationally symmetric)
            // Only sag is calculated for Zernike surfaces
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const normRadius = parseParam('Norm Radius');
            const dx = parseParam('Decenter X'), dy = parseParam('Decenter Y');

            // Collect aspheric coefficients
            const A2 = parseParam('A2'), A4 = parseParam('A4'), A6 = parseParam('A6'), A8 = parseParam('A8');
            const A10 = parseParam('A10'), A12 = parseParam('A12'), A14 = parseParam('A14'), A16 = parseParam('A16');

            // Collect all Zernike coefficients (Z1-Z37)
            const coeffs = {};
            for (let i = 1; i <= 37; i++) {
                coeffs[`Z${i}`] = parseParam(`Z${i}`);
            }

            // Use provided x,y or default to (r, 0) for radial calculations
            const xCoord = x !== null ? x : r;
            const yCoord = y !== null ? y : 0;

            sag = SurfaceCalculations.calculateZernikeSag(xCoord, yCoord, R, k, normRadius, dx, dy, A2, A4, A6, A8, A10, A12, A14, A16, coeffs);
            // No slope, asphericity, aberration for Zernike surfaces
            return { sag, slope: 0, asphericity: 0, aberration: 0, angle: 0 };
        } else if (surface.type === 'Irregular') {
            // Irregular surface requires x,y coordinates (non-rotationally symmetric)
            // Only sag is calculated for Irregular surfaces
            const R = parseParam('Radius'), k = parseParam('Conic Constant');
            const dx = parseParam('Decenter X'), dy = parseParam('Decenter Y');
            const tiltX = parseParam('Tilt X'), tiltY = parseParam('Tilt Y');
            const Zs = parseParam('Spherical'), Za = parseParam('Astigmatism'), Zc = parseParam('Coma');
            const angle = parseParam('Angle');
            const maxHeight = parseParam('Max Height');

            // Use provided x,y or default to (r, 0) for radial calculations
            const xCoord = x !== null ? x : r;
            const yCoord = y !== null ? y : 0;

            sag = SurfaceCalculations.calculateIrregularSag(xCoord, yCoord, R, k, dx, dy, tiltX, tiltY, Zs, Za, Zc, angle, maxHeight);
            // No slope, asphericity, aberration for Irregular surfaces
            return { sag, slope: 0, asphericity: 0, aberration: 0, angle: 0 };
        } else if (surface.type === 'Opal Un U') {
            const R = parseParam('Radius'), e2 = parseParam('e2'), H = parseParam('H');
            const A2 = parseParam('A2'), A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6');
            const A7 = parseParam('A7'), A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12');
            sag = SurfaceCalculations.calculateOpalUnUSag(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12);
            slope = SurfaceCalculations.calculateOpalUnUSlope(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12);
        } else if (surface.type === 'Opal Un Z') {
            const R = parseParam('Radius'), e2 = parseParam('e2'), H = parseParam('H');
            const A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5'), A6 = parseParam('A6'), A7 = parseParam('A7');
            const A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10'), A11 = parseParam('A11'), A12 = parseParam('A12'), A13 = parseParam('A13');
            sag = SurfaceCalculations.calculateOpalUnZSag(r, R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
            slope = SurfaceCalculations.calculateOpalUnZSlope(r, R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
        } else if (surface.type === 'Poly') {
            const A1 = parseParam('A1'), A2 = parseParam('A2'), A3 = parseParam('A3'), A4 = parseParam('A4'), A5 = parseParam('A5');
            const A6 = parseParam('A6'), A7 = parseParam('A7'), A8 = parseParam('A8'), A9 = parseParam('A9'), A10 = parseParam('A10');
            const A11 = parseParam('A11'), A12 = parseParam('A12'), A13 = parseParam('A13');
            sag = SurfaceCalculations.calculatePolySag(r, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
            slope = SurfaceCalculations.calculatePolySlope(r, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
        }

        // Calculate asphericity using cached BFS parameters
        const bfsParams = getBestFitSphereParams(surface);

        if (bfsParams.method === 'R3') {
            asphericity = SurfaceCalculations.calculateAsphericityForR3(r, sag, bfsParams.R3, bfsParams.R);
        } else {
            asphericity = SurfaceCalculations.calculateAsphericityForR4(r, sag, bfsParams.R4, bfsParams.zm, bfsParams.rm, bfsParams.g, bfsParams.Lz);
        }

        // Calculate aberration
        const R = surface.type !== 'Poly' ? parseParam('Radius') : 0;
        aberration = SurfaceCalculations.calculateAberrationOfNormals(sag, r, slope, R);

    } catch (e) {
        // Silent fail for calculation errors
    }

    // Calculate angle from slope
    const angle = Math.atan(slope) * (180 / Math.PI); // Convert to degrees

    return { sag, slope, asphericity, aberration, angle };
};
