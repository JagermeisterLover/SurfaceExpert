// Wrapper to call Python calculations from Electron renderer
// This will be replaced with direct JS implementation or Python bridge

class SurfaceCalculations {
    static calculateSphereSag(r, R) {
        if (R === 0) return 0;
        const c = 1.0 / R;
        const r2 = r * r;
        const c2r2 = c * c * r2;

        // Formula: z = cr²/(1 + √(1 - c²r²))
        // This works correctly for both positive and negative radii
        const sqrtTerm = Math.sqrt(1.0 - c2r2);
        return (c * r2) / (1.0 + sqrtTerm);
    }

    static calculateSphereSlope(r, R) {
        if (R === 0) return 0;
        const c = 1.0 / R;
        const r2 = r * r;
        const c2r2 = c * c * r2;

        // Derivative: dz/dr = cr / √(1 - c²r²)
        const sqrtTerm = Math.sqrt(1.0 - c2r2);
        if (sqrtTerm === 0) return 0;
        return (c * r) / sqrtTerm;
    }

    static calculateEvenAsphereSag(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20) {
        try {
            // Pre-compute common terms for better precision
            const r2 = r * r;
            const R2 = R * R;
            const kp1 = 1.0 + k;

            // Base sag: r²/[R*(1 + sqrt(1 - (1+k)*r²/R²))]
            const sqrtTerm = Math.sqrt(1.0 - kp1 * r2 / R2);
            const baseSag = r2 / (R * (1.0 + sqrtTerm));

            // Polynomial terms using progressive powers
            let rPower = r2 * r2; // r⁴
            let polySag = A4 * rPower;

            rPower *= r2; // r⁶
            polySag += A6 * rPower;

            rPower *= r2; // r⁸
            polySag += A8 * rPower;

            rPower *= r2; // r¹⁰
            polySag += A10 * rPower;

            rPower *= r2; // r¹²
            polySag += A12 * rPower;

            rPower *= r2; // r¹⁴
            polySag += A14 * rPower;

            rPower *= r2; // r¹⁶
            polySag += A16 * rPower;

            rPower *= r2; // r¹⁸
            polySag += A18 * rPower;

            rPower *= r2; // r²⁰
            polySag += A20 * rPower;

            return baseSag + polySag;
        } catch {
            return 0;
        }
    }

    static calculateOddAsphereSag(r, R, k, A3, A4, A5, A6, A7, A8, A9, A10,
                                   A11, A12, A13, A14, A15, A16, A17, A18, A19, A20) {
        try {
            // Pre-compute common terms for better precision
            const r2 = r * r;
            const R2 = R * R;
            const kp1 = 1.0 + k;

            // Base sag: r²/[R*(1 + sqrt(1 - (1+k)*r²/R²))]
            const sqrtTerm = Math.sqrt(1.0 - kp1 * r2 / R2);
            const baseSag = r2 / (R * (1.0 + sqrtTerm));

            // Polynomial terms using progressive powers
            let rPower = r2 * r; // r³
            let polySag = A3 * rPower;

            rPower *= r; // r⁴
            polySag += A4 * rPower;

            rPower *= r; // r⁵
            polySag += A5 * rPower;

            rPower *= r; // r⁶
            polySag += A6 * rPower;

            rPower *= r; // r⁷
            polySag += A7 * rPower;

            rPower *= r; // r⁸
            polySag += A8 * rPower;

            rPower *= r; // r⁹
            polySag += A9 * rPower;

            rPower *= r; // r¹⁰
            polySag += A10 * rPower;

            rPower *= r; // r¹¹
            polySag += A11 * rPower;

            rPower *= r; // r¹²
            polySag += A12 * rPower;

            rPower *= r; // r¹³
            polySag += A13 * rPower;

            rPower *= r; // r¹⁴
            polySag += A14 * rPower;

            rPower *= r; // r¹⁵
            polySag += A15 * rPower;

            rPower *= r; // r¹⁶
            polySag += A16 * rPower;

            rPower *= r; // r¹⁷
            polySag += A17 * rPower;

            rPower *= r; // r¹⁸
            polySag += A18 * rPower;

            rPower *= r; // r¹⁹
            polySag += A19 * rPower;

            rPower *= r; // r²⁰
            polySag += A20 * rPower;

            return baseSag + polySag;
        } catch {
            return 0;
        }
    }

    static calculateIrregularSag(x, y, R, k, dx, dy, tiltX, tiltY, Zs, Za, Zc, angle, rMax) {
        try {
            // Convert angles to radians
            // Note: Negate tilt angles to match Zemax sign convention
            const theta = angle * Math.PI / 180;
            const tiltXRad = -tiltX * Math.PI / 180;
            const tiltYRad = -tiltY * Math.PI / 180;

            // Transform coordinates from global to local (decentered and tilted) system
            // According to Zemax: decenter, then tilt about x, then tilt about y

            // Step 1: Apply decenter
            const x1 = x - dx;
            const y1 = y - dy;
            const z1 = 0;

            // Step 2: Tilt about X-axis
            const x2 = x1;
            const y2 = y1 * Math.cos(tiltXRad) - z1 * Math.sin(tiltXRad);
            const z2 = y1 * Math.sin(tiltXRad) + z1 * Math.cos(tiltXRad);

            // Step 3: Tilt about Y-axis
            const x_local = x2 * Math.cos(tiltYRad) + z2 * Math.sin(tiltYRad);
            const y_local = y2;
            // z_local = -x2 * Math.sin(tiltYRad) + z2 * Math.cos(tiltYRad); // not needed for sag calculation

            // Calculate radial distance in local coordinate system
            const r_local = Math.sqrt(x_local * x_local + y_local * y_local);

            // Base conic surface sag
            let baseSag = 0;
            if (R !== 0) {
                const c = 1 / R;
                const discriminant = 1 - (1 + k) * c * c * r_local * r_local;
                if (discriminant >= 0) {
                    baseSag = (c * r_local * r_local) / (1 + Math.sqrt(discriminant));
                }
            }

            // Zernike-like aberration terms
            // Normalized coordinates (avoid division by zero)
            let aberration = 0;
            if (rMax !== 0) {
                const rho_x = x_local / rMax;
                const rho_y = y_local / rMax;
                const rho = Math.sqrt(rho_x * rho_x + rho_y * rho_y);
                const rho_y_prime = rho_y * Math.cos(theta) - rho_x * Math.sin(theta);

                // Aberration coefficients applied at max aperture
                aberration = Zs * Math.pow(rho, 4) + Za * Math.pow(rho_y_prime, 2) + Zc * Math.pow(rho, 2) * rho_y_prime;
            }

            // The sag in local coordinate system
            const z_local = baseSag + aberration;

            // Transform the point back from local to global coordinates
            // The surface is defined in local (tilted) coordinates, but we need to return
            // the global z-coordinate for the 3D visualization.
            // Reverse the transformations: un-tilt about Y, un-tilt about X, un-decenter

            // Step 1: Un-tilt about Y-axis (reverse rotation)
            const x3 = x_local * Math.cos(tiltYRad) - z_local * Math.sin(tiltYRad);
            const y3 = y_local;
            const z3 = x_local * Math.sin(tiltYRad) + z_local * Math.cos(tiltYRad);

            // Step 2: Un-tilt about X-axis (reverse rotation)
            const x4 = x3;
            const y4 = y3 * Math.cos(tiltXRad) + z3 * Math.sin(tiltXRad);
            const z4 = -y3 * Math.sin(tiltXRad) + z3 * Math.cos(tiltXRad);

            // Step 3: Un-decenter (add back the decenters)
            // const x_global = x4 + dx;  // Not needed, we only return z
            // const y_global = y4 + dy;  // Not needed, we only return z
            const z_global = z4;

            return z_global;
        } catch {
            return 0;
        }
    }


    static calculateOpalUnUSag(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12) {
        let z = 0;
        const tolerance = 1e-15;
        const maxIterations = 1000000;
        const rSquared = r * r;
        const invR2 = 1.0 / (R * 2);
        const w = rSquared / (H * H);

        for (let iteration = 0; iteration < maxIterations; iteration++) {
            let wPower = w * w;
            let Q = A2 * wPower;
            const coeffs = [A3, A4, A5, A6, A7, A8, A9, A10, A11, A12];
            for (const coeff of coeffs) {
                wPower *= w;
                Q += coeff * wPower;
            }

            const zNew = (rSquared + (1 - e2) * (z * z)) * invR2 + Q;
            if (Math.abs(zNew - z) < tolerance) {
                return zNew;
            }

            z = zNew;
        }

        return z;
    }

    static calculateOpalUnZSag(r, R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13) {
        const tolerance = 1e-12;
        const maxIterations = 1000;
        const c = 1.0 / R;
        const rSquared = r * r;
        let z = r / R;

        for (let iteration = 0; iteration < maxIterations; iteration++) {
            const w = z / H;

            let Q = A13;
            Q = Q * w + A12;
            Q = Q * w + A11;
            Q = Q * w + A10;
            Q = Q * w + A9;
            Q = Q * w + A8;
            Q = Q * w + A7;
            Q = Q * w + A6;
            Q = Q * w + A5;
            Q = Q * w + A4;
            Q = Q * w + A3;
            Q *= w * w * w;

            const lhs = z - c * (rSquared + (1 - e2) * z * z) / 2 - Q;

            let Q_deriv = 0.0;
            if (A3 || A4 || A5 || A6 || A7 || A8 || A9 || A10 || A11 || A12 || A13) {
                Q_deriv = A13 * 13;
                Q_deriv = Q_deriv * w + A12 * 12;
                Q_deriv = Q_deriv * w + A11 * 11;
                Q_deriv = Q_deriv * w + A10 * 10;
                Q_deriv = Q_deriv * w + A9 * 9;
                Q_deriv = Q_deriv * w + A8 * 8;
                Q_deriv = Q_deriv * w + A7 * 7;
                Q_deriv = Q_deriv * w + A6 * 6;
                Q_deriv = Q_deriv * w + A5 * 5;
                Q_deriv = Q_deriv * w + A4 * 4;
                Q_deriv = Q_deriv * w + A3 * 3;
                Q_deriv *= w * w;
                Q_deriv /= H;
            }

            const lhs_deriv = 1 - c * (1 - e2) * z - Q_deriv;
            const delta = lhs / lhs_deriv;
            const zNew = z - delta;

            if (Math.abs(delta) < tolerance) {
                return zNew;
            }

            z = zNew;
        }

        return z;
    }

    static calculatePolySag(r, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13) {
        const tolerance = 1e-12;
        const maxIterations = 1000;
        const rSquared = r * r;
        let z = 1.0;

        for (let iteration = 0; iteration < maxIterations; iteration++) {
            let Q = A13;
            Q = Q * z + A12;
            Q = Q * z + A11;
            Q = Q * z + A10;
            Q = Q * z + A9;
            Q = Q * z + A8;
            Q = Q * z + A7;
            Q = Q * z + A6;
            Q = Q * z + A5;
            Q = Q * z + A4;
            Q = Q * z + A3;
            Q = Q * z + A2;
            Q = Q * z + A1;

            const P = z * Q;
            let Q_deriv = A13 * 12;
            Q_deriv = Q_deriv * z + A12 * 11;
            Q_deriv = Q_deriv * z + A11 * 10;
            Q_deriv = Q_deriv * z + A10 * 9;
            Q_deriv = Q_deriv * z + A9 * 8;
            Q_deriv = Q_deriv * z + A8 * 7;
            Q_deriv = Q_deriv * z + A7 * 6;
            Q_deriv = Q_deriv * z + A6 * 5;
            Q_deriv = Q_deriv * z + A5 * 4;
            Q_deriv = Q_deriv * z + A4 * 3;
            Q_deriv = Q_deriv * z + A3 * 2;
            Q_deriv = Q_deriv * z + A2;
            const P_deriv = Q + z * Q_deriv;
            const delta = (P - rSquared) / P_deriv;
            const zNew = z - delta;

            if (Math.abs(delta) < tolerance) {
                return zNew;
            }

            z = zNew;
        }

        return z;
    }

    static calculateEvenAsphereSlope(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20) {
        try {
            // Pre-compute common terms to minimize floating-point errors
            const r2 = r * r;
            const r3 = r2 * r;
            const R2 = R * R;
            const kp1 = 1.0 + k;

            // Compute Q with pre-computed values
            const Q = Math.sqrt(1.0 - kp1 * r2 / R2);
            const Qp1 = 1.0 + Q;
            const Qp1_sq = Qp1 * Qp1;

            // Base sag slope: [2*r*(1+Q) + (1+k)*r³/(R²*Q)] / [R*(1+Q)²]
            const numerator = 2.0 * r * Qp1 + kp1 * r3 / (R2 * Q);
            const baseSagSlope = numerator / (R * Qp1_sq);

            // Polynomial slope using progressive powers to minimize errors
            let rPower = r3;  // Start with r³
            let polySlope = 4.0 * A4 * rPower;

            rPower *= r2; // r⁵
            polySlope += 6.0 * A6 * rPower;

            rPower *= r2; // r⁷
            polySlope += 8.0 * A8 * rPower;

            rPower *= r2; // r⁹
            polySlope += 10.0 * A10 * rPower;

            rPower *= r2; // r¹¹
            polySlope += 12.0 * A12 * rPower;

            rPower *= r2; // r¹³
            polySlope += 14.0 * A14 * rPower;

            rPower *= r2; // r¹⁵
            polySlope += 16.0 * A16 * rPower;

            rPower *= r2; // r¹⁷
            polySlope += 18.0 * A18 * rPower;

            rPower *= r2; // r¹⁹
            polySlope += 20.0 * A20 * rPower;

            return baseSagSlope + polySlope;
        } catch {
            return 0;
        }
    }

    static calculateOddAsphereSlope(r, R, k, A3, A4, A5, A6, A7, A8, A9, A10,
                                     A11, A12, A13, A14, A15, A16, A17, A18, A19, A20) {
        try {
            // Pre-compute common terms to minimize floating-point errors
            const r2 = r * r;
            const r3 = r2 * r;
            const R2 = R * R;
            const kp1 = 1.0 + k;

            // Compute Q with pre-computed values
            const Q = Math.sqrt(1.0 - kp1 * r2 / R2);
            const Qp1 = 1.0 + Q;
            const Qp1_sq = Qp1 * Qp1;

            // Base sag slope: [2*r*(1+Q) + (1+k)*r³/(R²*Q)] / [R*(1+Q)²]
            const numerator = 2.0 * r * Qp1 + kp1 * r3 / (R2 * Q);
            const baseSagSlope = numerator / (R * Qp1_sq);

            // Polynomial slope using progressive powers to minimize errors
            let rPower = r2;  // Start with r²
            let polySlope = 3.0 * A3 * rPower;

            rPower *= r; // r³
            polySlope += 4.0 * A4 * rPower;

            rPower *= r; // r⁴
            polySlope += 5.0 * A5 * rPower;

            rPower *= r; // r⁵
            polySlope += 6.0 * A6 * rPower;

            rPower *= r; // r⁶
            polySlope += 7.0 * A7 * rPower;

            rPower *= r; // r⁷
            polySlope += 8.0 * A8 * rPower;

            rPower *= r; // r⁸
            polySlope += 9.0 * A9 * rPower;

            rPower *= r; // r⁹
            polySlope += 10.0 * A10 * rPower;

            rPower *= r; // r¹⁰
            polySlope += 11.0 * A11 * rPower;

            rPower *= r; // r¹¹
            polySlope += 12.0 * A12 * rPower;

            rPower *= r; // r¹²
            polySlope += 13.0 * A13 * rPower;

            rPower *= r; // r¹³
            polySlope += 14.0 * A14 * rPower;

            rPower *= r; // r¹⁴
            polySlope += 15.0 * A15 * rPower;

            rPower *= r; // r¹⁵
            polySlope += 16.0 * A16 * rPower;

            rPower *= r; // r¹⁶
            polySlope += 17.0 * A17 * rPower;

            rPower *= r; // r¹⁷
            polySlope += 18.0 * A18 * rPower;

            rPower *= r; // r¹⁸
            polySlope += 19.0 * A19 * rPower;

            rPower *= r; // r¹⁹
            polySlope += 20.0 * A20 * rPower;

            return baseSagSlope + polySlope;
        } catch {
            return 0;
        }
    }

    static calculateOpalUnUSlope(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12) {
        const z = this.calculateOpalUnUSag(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12);
        const rSquared = r * r;
        const w = rSquared / (H * H);

        // Calculate dQ/dw where Q = A2*w² + A3*w³ + A4*w⁴ + ... + A12*w¹²
        // dQ/dw = 2*A2*w + 3*A3*w² + 4*A4*w³ + ... + 12*A12*w¹¹
        let dQdw = 0;
        let wPower = w; // Start with w
        const coeffs = [A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12];
        for (let i = 0; i < coeffs.length; i++) {
            dQdw += (i + 2) * coeffs[i] * wPower; // Derivative coefficient: 2,3,4,...,12
            wPower *= w;
        }

        // Apply chain rule: dQ/dr = dQ/dw * dw/dr, where dw/dr = 2r/H²
        const dQdr = dQdw * 2 * r / (H * H);

        const denominator = 1 - (1 - e2) * z / R;
        if (denominator === 0) return 0;
        return (r / R + dQdr) / denominator;
    }

    static calculateOpalUnZSlope(r, R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13) {
        const z = this.calculateOpalUnZSag(r, R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
        const c = 1.0 / R;
        const w = z / H;

        const dQdw = (3 * A3 * w**2 + 4 * A4 * w**3 + 5 * A5 * w**4 + 6 * A6 * w**5 +
                      7 * A7 * w**6 + 8 * A8 * w**7 + 9 * A9 * w**8 + 10 * A10 * w**9 +
                      11 * A11 * w**10 + 12 * A12 * w**11 + 13 * A13 * w**12);

        const dQdz = dQdw / H;
        const dFdz = 1 - c * (1 - e2) * z - dQdz;
        const dFdr = -c * r;

        if (dFdz === 0) return 0;
        return -dFdr / dFdz;
    }

    static calculatePolySlope(r, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13) {
        const tolerance = 1e-12;
        const maxIterations = 1000;
        const rSquared = r * r;
        let z = 1.0;

        for (let iteration = 0; iteration < maxIterations; iteration++) {
            let Q = A13;
            Q = Q * z + A12;
            Q = Q * z + A11;
            Q = Q * z + A10;
            Q = Q * z + A9;
            Q = Q * z + A8;
            Q = Q * z + A7;
            Q = Q * z + A6;
            Q = Q * z + A5;
            Q = Q * z + A4;
            Q = Q * z + A3;
            Q = Q * z + A2;
            Q = Q * z + A1;

            const P = z * Q;
            let Q_deriv = A13 * 12;
            Q_deriv = Q_deriv * z + A12 * 11;
            Q_deriv = Q_deriv * z + A11 * 10;
            Q_deriv = Q_deriv * z + A10 * 9;
            Q_deriv = Q_deriv * z + A9 * 8;
            Q_deriv = Q_deriv * z + A8 * 7;
            Q_deriv = Q_deriv * z + A7 * 6;
            Q_deriv = Q_deriv * z + A6 * 5;
            Q_deriv = Q_deriv * z + A5 * 4;
            Q_deriv = Q_deriv * z + A4 * 3;
            Q_deriv = Q_deriv * z + A3 * 2;
            Q_deriv = Q_deriv * z + A2;
            const P_deriv = Q + z * Q_deriv;
            const delta = (P - rSquared) / P_deriv;
            const zNew = z - delta;

            if (Math.abs(delta) < tolerance) break;
            z = zNew;
        }

        const slopeDenominator = (A1 + 2 * A2 * z + 3 * A3 * z**2 + 4 * A4 * z**3 +
                                 5 * A5 * z**4 + 6 * A6 * z**5 + 7 * A7 * z**6 + 8 * A8 * z**7 +
                                 9 * A9 * z**8 + 10 * A10 * z**9 + 11 * A11 * z**10 + 12 * A12 * z**11 +
                                 13 * A13 * z**12);

        if (slopeDenominator === 0) return 0;
        return 2 * r / slopeDenominator;
    }

    static calculateBestFitSphereRadius3Points(maxR, zmax) {
        if (zmax === 0) return 0;
        return maxR * maxR / (2 * zmax) + zmax / 2;
    }

    static calculateBestFitSphereRadius4Points(minR, maxR, zmin, zmax) {
        const Lr = maxR - minR;
        const Lz = zmax - zmin;
        const twoF = Math.sqrt(Lz * Lz + Lr * Lr);
        const zm = (zmin + zmax) / 2;
        const rm = (minR + maxR) / 2;
        const g = twoF * rm / Math.abs(Lz);
        const R4 = Math.sqrt(g * g + (twoF / 2) ** 2);
        return { R4, zm, rm, g, Lz };
    }

    static calculateAsphericityForR3(r, z, R3, R) {
        const signR = Math.sign(R);
        if (signR === 0) return 0;
        return signR * (Math.abs(R3) - Math.sqrt((R3 - z) ** 2 + r * r));
    }

    static calculateAsphericityForR4(r, z, R4, zm, rm, g, Lz) {
        const signLz = Math.sign(Lz);
        if (signLz === 0) return 0;
        const z0 = zm + signLz * Math.sqrt(g * g - rm * rm);
        const signZ = Math.sign(z);
        if (signZ === 0) return 0;
        return signZ * (R4 - Math.sqrt((z0 - z) ** 2 + r * r));
    }

    static calculateAberrationOfNormals(z, r, slope, R) {
        if (slope === 0) return 0;
        return z + r / slope - R;
    }

    /**
     * Calculate Zernike polynomial value
     * Uses Fringe/Standard indexing (1-based)
     * Non-normalized Zernike polynomials
     * @param {number} n - Zernike term number (1-37)
     * @param {number} rho - Normalized radial coordinate (0-1)
     * @param {number} theta - Angle in radians
     * @returns {number} Zernike polynomial value
     */
    static calculateZernikePolynomial(n, rho, theta) {
        if (rho > 1) rho = 1; // Clamp to normalized range

        // Pre-calculate powers of rho for efficiency
        const rho2 = rho * rho;
        const rho3 = rho2 * rho;
        const rho4 = rho2 * rho2;
        const rho5 = rho4 * rho;
        const rho6 = rho3 * rho3;
        const rho7 = rho6 * rho;
        const rho8 = rho4 * rho4;
        const rho9 = rho8 * rho;
        const rho10 = rho5 * rho5;
        const rho12 = rho6 * rho6;

        switch(n) {
            case 1: return 1;
            case 2: return rho * Math.cos(theta);
            case 3: return rho * Math.sin(theta);
            case 4: return 2 * rho2 - 1;
            case 5: return rho2 * Math.cos(2 * theta);
            case 6: return rho2 * Math.sin(2 * theta);
            case 7: return (3 * rho2 - 2) * rho * Math.cos(theta);
            case 8: return (3 * rho2 - 2) * rho * Math.sin(theta);
            case 9: return 6 * rho4 - 6 * rho2 + 1;
            case 10: return rho3 * Math.cos(3 * theta);
            case 11: return rho3 * Math.sin(3 * theta);
            case 12: return (4 * rho2 - 3) * rho2 * Math.cos(2 * theta);
            case 13: return (4 * rho2 - 3) * rho2 * Math.sin(2 * theta);
            case 14: return (10 * rho4 - 12 * rho2 + 3) * rho * Math.cos(theta);
            case 15: return (10 * rho4 - 12 * rho2 + 3) * rho * Math.sin(theta);
            case 16: return 20 * rho6 - 30 * rho4 + 12 * rho2 - 1;
            case 17: return rho4 * Math.cos(4 * theta);
            case 18: return rho4 * Math.sin(4 * theta);
            case 19: return (5 * rho2 - 4) * rho3 * Math.cos(3 * theta);
            case 20: return (5 * rho2 - 4) * rho3 * Math.sin(3 * theta);
            case 21: return (15 * rho4 - 20 * rho2 + 6) * rho2 * Math.cos(2 * theta);
            case 22: return (15 * rho4 - 20 * rho2 + 6) * rho2 * Math.sin(2 * theta);
            case 23: return (35 * rho6 - 60 * rho4 + 30 * rho2 - 4) * rho * Math.cos(theta);
            case 24: return (35 * rho6 - 60 * rho4 + 30 * rho2 - 4) * rho * Math.sin(theta);
            case 25: return 70 * rho8 - 140 * rho6 + 90 * rho4 - 20 * rho2 + 1;
            case 26: return rho5 * Math.cos(5 * theta);
            case 27: return rho5 * Math.sin(5 * theta);
            case 28: return (6 * rho2 - 5) * rho4 * Math.cos(4 * theta);
            case 29: return (6 * rho2 - 5) * rho4 * Math.sin(4 * theta);
            case 30: return (21 * rho4 - 30 * rho2 + 10) * rho3 * Math.cos(3 * theta);
            case 31: return (21 * rho4 - 30 * rho2 + 10) * rho3 * Math.sin(3 * theta);
            case 32: return (56 * rho6 - 105 * rho4 + 60 * rho2 - 10) * rho2 * Math.cos(2 * theta);
            case 33: return (56 * rho6 - 105 * rho4 + 60 * rho2 - 10) * rho2 * Math.sin(2 * theta);
            case 34: return (126 * rho8 - 280 * rho6 + 210 * rho4 - 60 * rho2 + 5) * rho * Math.cos(theta);
            case 35: return (126 * rho8 - 280 * rho6 + 210 * rho4 - 60 * rho2 + 5) * rho * Math.sin(theta);
            case 36: return 252 * rho10 - 630 * rho8 + 560 * rho6 - 210 * rho4 + 30 * rho2 - 1;
            case 37: return 924 * rho12 - 2772 * rho10 + 3150 * rho8 - 1680 * rho6 + 420 * rho4 - 42 * rho2 + 1;
            default:
                return 0;
        }
    }

    /**
     * Calculate Zernike surface sag
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} R - Radius of curvature
     * @param {number} k - Conic constant
     * @param {number} normRadius - Normalization radius
     * @param {number} dx - Decenter X
     * @param {number} dy - Decenter Y
     * @param {number} A2 - Aspheric coefficient A2 (r^2)
     * @param {number} A4 - Aspheric coefficient A4 (r^4)
     * @param {number} A6 - Aspheric coefficient A6 (r^6)
     * @param {number} A8 - Aspheric coefficient A8 (r^8)
     * @param {number} A10 - Aspheric coefficient A10 (r^10)
     * @param {number} A12 - Aspheric coefficient A12 (r^12)
     * @param {number} A14 - Aspheric coefficient A14 (r^14)
     * @param {number} A16 - Aspheric coefficient A16 (r^16)
     * @param {Object} coeffs - Object with Z1, Z2, ..., Z37 coefficients
     * @returns {number} Sag value
     */
    static calculateZernikeSag(x, y, R, k, normRadius, dx, dy, A2, A4, A6, A8, A10, A12, A14, A16, coeffs) {
        try {
            // Calculate radial distance for base surface (conic + aspheric)
            // These use the ORIGINAL (non-decentered) coordinates
            const r = Math.sqrt(x * x + y * y);

            // Base conic surface sag
            let baseSag = 0;
            if (R !== 0) {
                const c = 1 / R;
                const r2 = r * r;
                const discriminant = 1 - (1 + k) * c * c * r2;
                if (discriminant >= 0) {
                    baseSag = (c * r2) / (1 + Math.sqrt(discriminant));
                }
            }

            // Aspheric terms (also use original coordinates)
            const asphericSag = A2 * r**2 + A4 * r**4 + A6 * r**6 + A8 * r**8 +
                               A10 * r**10 + A12 * r**12 + A14 * r**14 + A16 * r**16;

            // Zernike aberration terms - ONLY THESE use decentered coordinates
            if (normRadius === 0) return baseSag + asphericSag;

            // Apply decenter ONLY for Zernike terms
            const x_zernike = x - dx;
            const y_zernike = y - dy;
            const r_zernike = Math.sqrt(x_zernike * x_zernike + y_zernike * y_zernike);

            // Normalized coordinates for Zernike (using decentered position)
            const rho = Math.min(r_zernike / normRadius, 1);
            const theta = Math.atan2(y_zernike, x_zernike);

            // Sum Zernike terms
            let zernikeSag = 0;
            for (let i = 1; i <= 37; i++) {
                const coeff = coeffs[`Z${i}`] || 0;
                if (coeff !== 0) {
                    zernikeSag += coeff * this.calculateZernikePolynomial(i, rho, theta);
                }
            }

            return baseSag + asphericSag + zernikeSag;
        } catch {
            return 0;
        }
    }

    /**
     * Calculate base sag for Zernike surface (conic + aspheric only, no Zernike terms)
     * Used for RMS/P-V error calculations
     */
    static calculateZernikeBaseSag(x, y, R, k, A2, A4, A6, A8, A10, A12, A14, A16) {
        try {
            const r = Math.sqrt(x * x + y * y);

            // Base conic surface sag
            let baseSag = 0;
            if (R !== 0) {
                const c = 1 / R;
                const r2 = r * r;
                const discriminant = 1 - (1 + k) * c * c * r2;
                if (discriminant >= 0) {
                    baseSag = (c * r2) / (1 + Math.sqrt(discriminant));
                }
            }

            // Aspheric terms
            const asphericSag = A2 * r**2 + A4 * r**4 + A6 * r**6 + A8 * r**8 +
                               A10 * r**10 + A12 * r**12 + A14 * r**14 + A16 * r**16;

            return baseSag + asphericSag;
        } catch {
            return 0;
        }
    }

    /**
     * Calculate base sag for Irregular surface (conic only, no aberrations/tilts/decenters)
     * Used for RMS/P-V error calculations
     */
    static calculateIrregularBaseSag(x, y, R, k) {
        try {
            const r = Math.sqrt(x * x + y * y);

            // Base conic surface sag only
            let baseSag = 0;
            if (R !== 0) {
                const c = 1 / R;
                const r2 = r * r;
                const discriminant = 1 - (1 + k) * c * c * r2;
                if (discriminant >= 0) {
                    baseSag = (c * r2) / (1 + Math.sqrt(discriminant));
                }
            }

            return baseSag;
        } catch {
            return 0;
        }
    }
}
