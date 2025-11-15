// Wrapper to call Python calculations from Electron renderer
// This will be replaced with direct JS implementation or Python bridge

class SurfaceCalculations {
    static calculateSphereSag(r, R) {
        if (R === 0) return 0;
        const r2 = r * r;
        const R2 = R * R;
        // Exact formula: z = R - sqrt(R^2 - r^2)
        const sqrtTerm = Math.sqrt(R2 - r2);
        return R - sqrtTerm;
    }

    static calculateSphereSlope(r, R) {
        if (R === 0) return 0;
        const r2 = r * r;
        const R2 = R * R;
        // Exact derivative: dz/dr = r / sqrt(R^2 - r^2)
        const sqrtTerm = Math.sqrt(R2 - r2);
        if (sqrtTerm === 0) return 0;
        return r / sqrtTerm;
    }

    static calculateEvenAsphereSag(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20) {
        try {
            const baseSag = (r ** 2) / (R * (1 + Math.sqrt(1 - (1 + k) * (r ** 2) / (R ** 2))));
            return (baseSag +
                   A4 * r**4 + A6 * r**6 + A8 * r**8 + A10 * r**10 +
                   A12 * r**12 + A14 * r**14 + A16 * r**16 + A18 * r**18 + A20 * r**20);
        } catch {
            return 0;
        }
    }

    static calculateOddAsphereSag(r, R, k, A3, A4, A5, A6, A7, A8, A9, A10,
                                   A11, A12, A13, A14, A15, A16, A17, A18, A19, A20) {
        try {
            const baseSag = (r ** 2) / (R * (1 + Math.sqrt(1 - (1 + k) * (r ** 2) / (R ** 2))));
            return (baseSag +
                   A3 * r**3 + A4 * r**4 + A5 * r**5 + A6 * r**6 + A7 * r**7 +
                   A8 * r**8 + A9 * r**9 + A10 * r**10 + A11 * r**11 + A12 * r**12 +
                   A13 * r**13 + A14 * r**14 + A15 * r**15 + A16 * r**16 + A17 * r**17 +
                   A18 * r**18 + A19 * r**19 + A20 * r**20);
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
            const Q = Math.sqrt(1 - (1 + k) * (r ** 2) / (R ** 2));
            const baseSagSlope = ((2 * r * (1 + Q) + (1 + k) * (r ** 3) / ((R ** 2) * Q)) /
                                (R * (1 + Q) ** 2));

            const polySlope = (4 * A4 * r**3 + 6 * A6 * r**5 + 8 * A8 * r**7 +
                             10 * A10 * r**9 + 12 * A12 * r**11 + 14 * A14 * r**13 +
                             16 * A16 * r**15 + 18 * A18 * r**17 + 20 * A20 * r**19);

            return baseSagSlope + polySlope;
        } catch {
            return 0;
        }
    }

    static calculateOddAsphereSlope(r, R, k, A3, A4, A5, A6, A7, A8, A9, A10,
                                     A11, A12, A13, A14, A15, A16, A17, A18, A19, A20) {
        try {
            const Q = Math.sqrt(1 - (1 + k) * (r ** 2) / (R ** 2));
            const baseSagSlope = ((2 * r * (1 + Q) + (1 + k) * (r ** 3) / ((R ** 2) * Q)) /
                                (R * (1 + Q) ** 2));

            const polySlope = (3 * A3 * r**2 + 4 * A4 * r**3 + 5 * A5 * r**4 + 6 * A6 * r**5 +
                             7 * A7 * r**6 + 8 * A8 * r**7 + 9 * A9 * r**8 + 10 * A10 * r**9 +
                             11 * A11 * r**10 + 12 * A12 * r**11 + 13 * A13 * r**12 + 14 * A14 * r**13 +
                             15 * A15 * r**14 + 16 * A16 * r**15 + 17 * A17 * r**16 + 18 * A18 * r**17 +
                             19 * A19 * r**18 + 20 * A20 * r**19);

            return baseSagSlope + polySlope;
        } catch {
            return 0;
        }
    }

    static calculateOpalUnUSlope(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12) {
        const z = this.calculateOpalUnUSag(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12);
        const rSquared = r * r;
        const invR2 = 1.0 / (2 * R);
        const w = rSquared / (H * H);

        let dQdr = 0;
        let wPower = w;
        const coeffs = [A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12];
        for (let i = 1; i < coeffs.length; i++) {
            dQdr += i * coeffs[i] * wPower;
            wPower *= w;
        }

        dQdr *= 2 * r / (H * H);

        const denominator = 1 - (1 - e2) * z / R;
        if (denominator === 0) return 0;
        return (r * invR2 + dQdr) / denominator;
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
}
