import math

class SurfaceCalculations:
    """Python implementation of optical surface calculations"""

    @staticmethod
    def calculate_sphere_sag(r, R):
        """Calculate sphere sag: z = r^2 / (2R)"""
        if R == 0:
            return 0
        return r * r / (2 * R)

    @staticmethod
    def calculate_sphere_slope(r, R):
        """Calculate sphere slope: dz/dr = r / R"""
        if R == 0:
            return 0
        return r / R

    @staticmethod
    def calculate_even_asphere_sag(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20):
        """Calculate even asphere sag"""
        try:
            base_sag = (r ** 2) / (R * (1 + math.sqrt(1 - (1 + k) * (r ** 2) / (R ** 2))))
            return (base_sag +
                   A4 * r**4 + A6 * r**6 + A8 * r**8 + A10 * r**10 +
                   A12 * r**12 + A14 * r**14 + A16 * r**16 + A18 * r**18 + A20 * r**20)
        except (ValueError, ZeroDivisionError):
            return 0

    @staticmethod
    def calculate_odd_asphere_sag(r, R, k, A3, A4, A5, A6, A7, A8, A9, A10,
                                   A11, A12, A13, A14, A15, A16, A17, A18, A19, A20):
        """Calculate odd asphere sag"""
        try:
            base_sag = (r ** 2) / (R * (1 + math.sqrt(1 - (1 + k) * (r ** 2) / (R ** 2))))
            return (base_sag +
                   A3 * r**3 + A4 * r**4 + A5 * r**5 + A6 * r**6 + A7 * r**7 +
                   A8 * r**8 + A9 * r**9 + A10 * r**10 + A11 * r**11 + A12 * r**12 +
                   A13 * r**13 + A14 * r**14 + A15 * r**15 + A16 * r**16 + A17 * r**17 +
                   A18 * r**18 + A19 * r**19 + A20 * r**20)
        except (ValueError, ZeroDivisionError):
            return 0

    @staticmethod
    def calculate_opal_un_u_sag(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12):
        """Calculate Opal Un U sag using iterative method"""
        z = 0
        tolerance = 1e-15
        max_iterations = 1000000
        r_squared = r * r
        inv_r2 = 1.0 / (R * 2)
        w = r_squared / (H * H)

        for iteration in range(max_iterations):
            w_power = w * w
            Q = A2 * w_power
            coeffs = [A3, A4, A5, A6, A7, A8, A9, A10, A11, A12]
            for coeff in coeffs:
                w_power *= w
                Q += coeff * w_power

            z_new = (r_squared + (1 - e2) * (z * z)) * inv_r2 + Q
            if abs(z_new - z) < tolerance:
                return z_new

            z = z_new

        return z

    @staticmethod
    def calculate_opal_un_z_sag(r, R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13):
        """Calculate Opal Un Z sag using Newton-Raphson method"""
        tolerance = 1e-12
        max_iterations = 1000
        c = 1.0 / R
        r_squared = r * r
        z = r / R

        for iteration in range(max_iterations):
            w = z / H

            # Evaluate Q(w) using Horner's method
            Q = A13
            Q = Q * w + A12
            Q = Q * w + A11
            Q = Q * w + A10
            Q = Q * w + A9
            Q = Q * w + A8
            Q = Q * w + A7
            Q = Q * w + A6
            Q = Q * w + A5
            Q = Q * w + A4
            Q = Q * w + A3
            Q *= w * w * w

            lhs = z - c * (r_squared + (1 - e2) * z * z) / 2 - Q

            # Derivative
            Q_deriv = 0.0
            if any([A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13]):
                Q_deriv = A13 * 13
                Q_deriv = Q_deriv * w + A12 * 12
                Q_deriv = Q_deriv * w + A11 * 11
                Q_deriv = Q_deriv * w + A10 * 10
                Q_deriv = Q_deriv * w + A9 * 9
                Q_deriv = Q_deriv * w + A8 * 8
                Q_deriv = Q_deriv * w + A7 * 7
                Q_deriv = Q_deriv * w + A6 * 6
                Q_deriv = Q_deriv * w + A5 * 5
                Q_deriv = Q_deriv * w + A4 * 4
                Q_deriv = Q_deriv * w + A3 * 3
                Q_deriv *= w * w
                Q_deriv /= H

            lhs_deriv = 1 - c * (1 - e2) * z - Q_deriv
            delta = lhs / lhs_deriv
            z_new = z - delta

            if abs(delta) < tolerance:
                return z_new

            z = z_new

        return z

    @staticmethod
    def calculate_poly_sag(r, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13):
        """Calculate Poly sag using Newton-Raphson method"""
        tolerance = 1e-12
        max_iterations = 1000
        r_squared = r * r
        z = 1.0

        for iteration in range(max_iterations):
            Q = A13
            Q = Q * z + A12
            Q = Q * z + A11
            Q = Q * z + A10
            Q = Q * z + A9
            Q = Q * z + A8
            Q = Q * z + A7
            Q = Q * z + A6
            Q = Q * z + A5
            Q = Q * z + A4
            Q = Q * z + A3
            Q = Q * z + A2
            Q = Q * z + A1

            P = z * Q
            Q_deriv = A13 * 12
            Q_deriv = Q_deriv * z + A12 * 11
            Q_deriv = Q_deriv * z + A11 * 10
            Q_deriv = Q_deriv * z + A10 * 9
            Q_deriv = Q_deriv * z + A9 * 8
            Q_deriv = Q_deriv * z + A8 * 7
            Q_deriv = Q_deriv * z + A7 * 6
            Q_deriv = Q_deriv * z + A6 * 5
            Q_deriv = Q_deriv * z + A5 * 4
            Q_deriv = Q_deriv * z + A4 * 3
            Q_deriv = Q_deriv * z + A3 * 2
            Q_deriv = Q_deriv * z + A2
            P_deriv = Q + z * Q_deriv
            delta = (P - r_squared) / P_deriv
            z_new = z - delta

            if abs(delta) < tolerance:
                return z_new

            z = z_new

        return z

    @staticmethod
    def calculate_even_asphere_slope(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20):
        """Calculate even asphere slope"""
        try:
            Q = math.sqrt(1 - (1 + k) * (r ** 2) / (R ** 2))
            base_sag_slope = ((2 * r * (1 + Q) + (1 + k) * (r ** 3) / ((R ** 2) * Q)) /
                            (R * (1 + Q) ** 2))

            poly_slope = (4 * A4 * r**3 + 6 * A6 * r**5 + 8 * A8 * r**7 +
                         10 * A10 * r**9 + 12 * A12 * r**11 + 14 * A14 * r**13 +
                         16 * A16 * r**15 + 18 * A18 * r**17 + 20 * A20 * r**19)

            return base_sag_slope + poly_slope
        except (ValueError, ZeroDivisionError):
            return 0

    @staticmethod
    def calculate_odd_asphere_slope(r, R, k, A3, A4, A5, A6, A7, A8, A9, A10,
                                     A11, A12, A13, A14, A15, A16, A17, A18, A19, A20):
        """Calculate odd asphere slope"""
        try:
            Q = math.sqrt(1 - (1 + k) * (r ** 2) / (R ** 2))
            base_sag_slope = ((2 * r * (1 + Q) + (1 + k) * (r ** 3) / ((R ** 2) * Q)) /
                            (R * (1 + Q) ** 2))

            poly_slope = (3 * A3 * r**2 + 4 * A4 * r**3 + 5 * A5 * r**4 + 6 * A6 * r**5 +
                         7 * A7 * r**6 + 8 * A8 * r**7 + 9 * A9 * r**8 + 10 * A10 * r**9 +
                         11 * A11 * r**10 + 12 * A12 * r**11 + 13 * A13 * r**12 + 14 * A14 * r**13 +
                         15 * A15 * r**14 + 16 * A16 * r**15 + 17 * A17 * r**16 + 18 * A18 * r**17 +
                         19 * A19 * r**18 + 20 * A20 * r**19)

            return base_sag_slope + poly_slope
        except (ValueError, ZeroDivisionError):
            return 0

    @staticmethod
    def calculate_opal_un_u_slope(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12):
        """Calculate Opal Un U slope"""
        z = SurfaceCalculations.calculate_opal_un_u_sag(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12)
        r_squared = r * r
        inv_r2 = 1.0 / (2 * R)
        w = r_squared / (H * H)

        dQdr = 0
        w_power = w
        coeffs = [A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12]
        for i in range(1, len(coeffs)):
            dQdr += i * coeffs[i] * w_power
            w_power *= w

        dQdr *= 2 * r / (H * H)

        denominator = 1 - (1 - e2) * z / R
        if denominator == 0:
            return 0
        return (r * inv_r2 + dQdr) / denominator

    @staticmethod
    def calculate_opal_un_z_slope(r, R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13):
        """Calculate Opal Un Z slope"""
        z = SurfaceCalculations.calculate_opal_un_z_sag(r, R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13)
        c = 1.0 / R
        w = z / H

        dQdw = (3 * A3 * w**2 + 4 * A4 * w**3 + 5 * A5 * w**4 + 6 * A6 * w**5 +
                7 * A7 * w**6 + 8 * A8 * w**7 + 9 * A9 * w**8 + 10 * A10 * w**9 +
                11 * A11 * w**10 + 12 * A12 * w**11 + 13 * A13 * w**12)

        dQdz = dQdw / H
        dFdz = 1 - c * (1 - e2) * z - dQdz
        dFdr = -c * r

        if dFdz == 0:
            return 0
        return -dFdr / dFdz

    @staticmethod
    def calculate_poly_slope(r, A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13):
        """Calculate Poly slope"""
        tolerance = 1e-12
        max_iterations = 1000
        r_squared = r * r
        z = 1.0

        for iteration in range(max_iterations):
            Q = A13
            Q = Q * z + A12
            Q = Q * z + A11
            Q = Q * z + A10
            Q = Q * z + A9
            Q = Q * z + A8
            Q = Q * z + A7
            Q = Q * z + A6
            Q = Q * z + A5
            Q = Q * z + A4
            Q = Q * z + A3
            Q = Q * z + A2
            Q = Q * z + A1

            P = z * Q
            Q_deriv = A13 * 12
            Q_deriv = Q_deriv * z + A12 * 11
            Q_deriv = Q_deriv * z + A11 * 10
            Q_deriv = Q_deriv * z + A10 * 9
            Q_deriv = Q_deriv * z + A9 * 8
            Q_deriv = Q_deriv * z + A8 * 7
            Q_deriv = Q_deriv * z + A7 * 6
            Q_deriv = Q_deriv * z + A6 * 5
            Q_deriv = Q_deriv * z + A5 * 4
            Q_deriv = Q_deriv * z + A4 * 3
            Q_deriv = Q_deriv * z + A3 * 2
            Q_deriv = Q_deriv * z + A2
            P_deriv = Q + z * Q_deriv
            delta = (P - r_squared) / P_deriv
            z_new = z - delta

            if abs(delta) < tolerance:
                break
            z = z_new

        slope_denominator = (A1 + 2 * A2 * z + 3 * A3 * z**2 + 4 * A4 * z**3 +
                            5 * A5 * z**4 + 6 * A6 * z**5 + 7 * A7 * z**6 + 8 * A8 * z**7 +
                            9 * A9 * z**8 + 10 * A10 * z**9 + 11 * A11 * z**10 + 12 * A12 * z**11 +
                            13 * A13 * z**12)

        if slope_denominator == 0:
            return 0
        return 2 * r / slope_denominator

    @staticmethod
    def calculate_best_fit_sphere_radius_3_points(max_r, zmax):
        """Calculate best fit sphere radius using 3 points (for surfaces without holes)"""
        if zmax == 0:
            return 0
        return max_r * max_r / (2 * zmax) + zmax / 2

    @staticmethod
    def calculate_best_fit_sphere_radius_4_points(min_r, max_r, zmin, zmax):
        """Calculate best fit sphere radius using 4 points (for surfaces with holes)"""
        Lr = max_r - min_r
        Lz = zmax - zmin
        two_f = math.sqrt(Lz * Lz + Lr * Lr)
        zm_val = (zmin + zmax) / 2
        rm_val = (min_r + max_r) / 2
        g_val = two_f * rm_val / abs(Lz)
        R4_val = math.sqrt(g_val * g_val + (two_f / 2) ** 2)
        return R4_val, zm_val, rm_val, g_val, Lz

    @staticmethod
    def calculate_asphericity_for_r3(r, z, R3, R):
        """Calculate asphericity using best fit sphere with 3 points"""
        sign_r = 1 if R >= 0 else -1
        try:
            return sign_r * (abs(R3) - math.sqrt((R3 - z) ** 2 + r * r))
        except (ValueError, ZeroDivisionError):
            return 0

    @staticmethod
    def calculate_asphericity_for_r4(r, z, R4, zm, rm, g, Lz):
        """Calculate asphericity using best fit sphere with 4 points"""
        sign_lz = 1 if Lz >= 0 else -1
        try:
            z0 = zm + sign_lz * math.sqrt(g * g - rm * rm)
            sign_z = 1 if z >= 0 else -1
            return sign_z * (R4 - math.sqrt((z0 - z) ** 2 + r * r))
        except (ValueError, ZeroDivisionError):
            return 0

    @staticmethod
    def calculate_aberration_of_normals(z, r, slope, R):
        """Calculate aberration of normals"""
        if slope == 0:
            return 0
        return z + r / slope - R
