    /* Use this C# code to write actual surface calculations for the following surfaces:
    - Even Asphere sag
    - Odd Asphere sag
    - Opal Un U sag
    - Opal Un Z sag
    - Poly sag
    - Even Asphere Slope
    - Odd Asphere Slope
    - Opal Un U Slope
    - Opal Un Z Slope
    - Poly Slope
    - BFS Best Fit Sphere Radius 3 Points
    - BFS Best Fit Sphere Radius 4 Points
    - Asphericity For BFS R3
    - Asphericity For BFSR4
    - Aberration Of Normals

    surfaces have parameter r (radial distance or surface height, program uses min height and max height for calculation)
    R is universal parameter!!!
    specific parameters for each surface are listed below:
    Even asphere has parameters: R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20
    Odd asphere has parameters: R, k, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16, A17, A18, A19, A20
    Opal Un U has parameters: R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12
    Opal Un Z has parameters: R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13
    Poly has parameters: A1, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13

    */

public class SurfaceCalculations
{
    public double CalculateEvenAsphereSag(double r, double R, double k,
        double A4, double A6, double A8, double A10, double A12, double A14, double A16, double A18, double A20)
    {
        var baseSag = Math.Pow(r, 2) / (R * (1 + Math.Sqrt(1 - (1 + k) * Math.Pow(r, 2) / Math.Pow(R, 2))));
        return baseSag +
               A4 * Math.Pow(r, 4) + A6 * Math.Pow(r, 6) + A8 * Math.Pow(r, 8) + A10 * Math.Pow(r, 10) +
               A12 * Math.Pow(r, 12) + A14 * Math.Pow(r, 14) + A16 * Math.Pow(r, 16) + A18 * Math.Pow(r, 18) +
               A20 * Math.Pow(r, 20);
    }

    public double CalculateOddAsphereSag(double r, double R, double k,
        double A3, double A4, double A5, double A6, double A7, double A8, double A9, double A10,
        double A11, double A12, double A13, double A14, double A15, double A16, double A17, double A18, double A19,
        double A20)
    {
        var baseSag = Math.Pow(r, 2) / (R * (1 + Math.Sqrt(1 - (1 + k) * Math.Pow(r, 2) / Math.Pow(R, 2))));
        return baseSag +
               A3 * Math.Pow(r, 3) + A4 * Math.Pow(r, 4) + A5 * Math.Pow(r, 5) + A6 * Math.Pow(r, 6) +
               A7 * Math.Pow(r, 7) + A8 * Math.Pow(r, 8) + A9 * Math.Pow(r, 9) + A10 * Math.Pow(r, 10) +
               A11 * Math.Pow(r, 11) + A12 * Math.Pow(r, 12) + A13 * Math.Pow(r, 13) + A14 * Math.Pow(r, 14) +
               A15 * Math.Pow(r, 15) + A16 * Math.Pow(r, 16) + A17 * Math.Pow(r, 17) + A18 * Math.Pow(r, 18) +
               A19 * Math.Pow(r, 19) + A20 * Math.Pow(r, 20);
    }

    public double CalculateOpalUnUSag(double r, double R, double e2, double H,
        double A2, double A3, double A4, double A5, double A6, double A7, double A8, double A9, double A10, double A11,
        double A12)
    {
        double z = 0;
        const double tolerance = 1e-15;
        int maxIterations = 1000000, iteration = 0;
        double rSquared = r * r, invR2 = 1.0 / (R * 2);
        var w = rSquared / (H * H);

        while (iteration < maxIterations)
        {
            var wPower = w * w; // start with w^2
            var Q = A2 * wPower;
            double[] coeffs = { A3, A4, A5, A6, A7, A8, A9, A10, A11, A12 };
            for (var i = 0; i < coeffs.Length; i++)
            {
                wPower *= w;
                Q += coeffs[i] * wPower;
            }

            var zNew = (rSquared + (1 - e2) * (z * z)) * invR2 + Q;
            if (Math.Abs(zNew - z) < tolerance)
            {
                z = zNew;
                break;
            }

            z = zNew;
            iteration++;
        }

        Console.WriteLine($"Converged after {iteration} iterations: z = {z}");
        return z;
    }

    public double CalculateOpalUnZSag(
        double r, double R, double e2, double H,
        double A3, double A4, double A5, double A6, double A7, double A8,
        double A9, double A10, double A11, double A12, double A13)
    {
        // Precompute constants
        const double tolerance = 1e-12; // Convergence tolerance
        const int maxIterations = 1000; // Maximum number of iterations
        var c = 1.0 / R; // Curvature
        var rSquared = r * r;

        // Initialize z with a reasonable initial guess
        var z = r / R; // A good starting point
        var iteration = 0;

        while (iteration < maxIterations)
        {
            // Calculate w = z / H
            var w = z / H;

            // Evaluate Q(w) = A3*w^3 + A4*w^4 + ... + A13*w^13 using Horner's method
            var Q = A13;
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
            Q *= w * w * w; // Multiply by w^3 at the end

            // Compute the left-hand side of the equation: LHS = z - c * (r^2 + (1 - e^2) * z^2) / 2 - Q
            var lhs = z - c * (rSquared + (1 - e2) * z * z) / 2 - Q;

            // Compute the derivative of the left-hand side with respect to z
            // Derivative of LHS: dLHS/dz = 1 - c * (1 - e^2) * z - dQ/dz
            var Q_deriv = 0.0;
            if (A3 != 0 || A4 != 0 || A5 != 0 || A6 != 0 || A7 != 0 || A8 != 0
                || A9 != 0 || A10 != 0 || A11 != 0 || A12 != 0 || A13 != 0)
            {
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
                Q_deriv *= w * w; // Multiply by w^2 at the end
                Q_deriv /= H; // Chain rule: dQ/dz = dQ/dw * dw/dz, where dw/dz = 1/H
            }

            var lhs_deriv = 1 - c * (1 - e2) * z - Q_deriv;

            // Newton-Raphson step: z_new = z - LHS / dLHS/dz
            var delta = lhs / lhs_deriv;
            var zNew = z - delta;

            // Check for convergence
            if (Math.Abs(delta) < tolerance)
            {
                Console.WriteLine($"Converged after {iteration + 1} iterations: z = {zNew}");
                return zNew;
            }

            z = zNew;
            iteration++;
        }

        // Handle the case where maximum iterations are reached without convergence
        Console.WriteLine($"Warning: Maximum iterations reached without convergence for CalculateOpalUnZSag. z = {z}");
        return z;
    }

    public double CalculatePolySag(double r,
        double A1, double A2, double A3, double A4, double A5, double A6,
        double A7, double A8, double A9, double A10, double A11, double A12, double A13)
    {
        const double tolerance = 1e-12;
        const int maxIterations = 1000;
        var rSquared = r * r;
        var z = 1.0;
        var iteration = 0;

        while (iteration < maxIterations)
        {
            var Q = A13;
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

            var P = z * Q;
            var Q_deriv = A13 * 12;
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
            var P_deriv = Q + z * Q_deriv;
            var delta = (P - rSquared) / P_deriv;
            var zNew = z - delta;
            if (Math.Abs(delta) < tolerance)
            {
                Console.WriteLine($"Converged after {iteration + 1} iterations: z = {zNew}");
                return zNew;
            }

            z = zNew;
            iteration++;
        }

        Console.WriteLine($"Warning: Maximum iterations reached without convergence for CalculatePolySag. z = {z}");
        return z;
    }

    public double CalculateEvenAsphereSlope(double r, double R, double k,
        double A4, double A6, double A8, double A10, double A12, double A14, double A16, double A18, double A20)
    {
        // Compute Q = sqrt(1 - (1+k)*r^2/R^2)
        var Q = Math.Sqrt(1 - (1 + k) * Math.Pow(r, 2) / Math.Pow(R, 2));

        // Derivative of the base sag:
        // d/dr [r^2/(R*(1+Q))] = [2r(1+Q) + ((1+k)*r^3/(R^2*Q))] / (R*(1+Q)^2)
        var baseSagSlope = (2 * r * (1 + Q) + (1 + k) * Math.Pow(r, 3) / (Math.Pow(R, 2) * Q))
                           / (R * Math.Pow(1 + Q, 2));

        // Derivative of the polynomial (even powers only)
        var polySlope = 4 * A4 * Math.Pow(r, 3) +
                        6 * A6 * Math.Pow(r, 5) +
                        8 * A8 * Math.Pow(r, 7) +
                        10 * A10 * Math.Pow(r, 9) +
                        12 * A12 * Math.Pow(r, 11) +
                        14 * A14 * Math.Pow(r, 13) +
                        16 * A16 * Math.Pow(r, 15) +
                        18 * A18 * Math.Pow(r, 17) +
                        20 * A20 * Math.Pow(r, 19);

        return baseSagSlope + polySlope;
    }

    public double CalculateOddAsphereSlope(double r, double R, double k,
        double A3, double A4, double A5, double A6, double A7, double A8, double A9, double A10,
        double A11, double A12, double A13, double A14, double A15, double A16, double A17, double A18, double A19,
        double A20)
    {
        // Compute Q = sqrt(1 - (1+k)*r^2/R^2)
        var Q = Math.Sqrt(1 - (1 + k) * Math.Pow(r, 2) / Math.Pow(R, 2));

        // Derivative of the base sag:
        // d/dr [r^2/(R*(1+Q))] = [2r(1+Q) + ((1+k)*r^3/(R^2*Q))] / (R*(1+Q)^2)
        var baseSagSlope = (2 * r * (1 + Q) + (1 + k) * Math.Pow(r, 3) / (Math.Pow(R, 2) * Q))
                           / (R * Math.Pow(1 + Q, 2));

        // Derivative of the polynomial (odd terms included)
        var polySlope = 3 * A3 * Math.Pow(r, 2) +
                        4 * A4 * Math.Pow(r, 3) +
                        5 * A5 * Math.Pow(r, 4) +
                        6 * A6 * Math.Pow(r, 5) +
                        7 * A7 * Math.Pow(r, 6) +
                        8 * A8 * Math.Pow(r, 7) +
                        9 * A9 * Math.Pow(r, 8) +
                        10 * A10 * Math.Pow(r, 9) +
                        11 * A11 * Math.Pow(r, 10) +
                        12 * A12 * Math.Pow(r, 11) +
                        13 * A13 * Math.Pow(r, 12) +
                        14 * A14 * Math.Pow(r, 13) +
                        15 * A15 * Math.Pow(r, 14) +
                        16 * A16 * Math.Pow(r, 15) +
                        17 * A17 * Math.Pow(r, 16) +
                        18 * A18 * Math.Pow(r, 17) +
                        19 * A19 * Math.Pow(r, 18) +
                        20 * A20 * Math.Pow(r, 19);

        return baseSagSlope + polySlope;
    }

    public double CalculateOpalUnUSlope(double r, double R, double e2, double H,
        double A2, double A3, double A4, double A5, double A6, double A7, double A8, double A9, double A10, double A11,
        double A12)
    {
        var z = CalculateOpalUnUSag(r, R, e2, H, A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12);
        var rSquared = r * r;
        var invR2 = 1.0 / (2 * R);
        var w = rSquared / (H * H);

        // Calculate dQ/dw where Q = A2*w² + A3*w³ + A4*w⁴ + ... + A12*w¹²
        // dQ/dw = 2*A2*w + 3*A3*w² + 4*A4*w³ + ... + 12*A12*w¹¹
        double dQdw = 0;
        var wPower = w; // start with w
        double[] coeffs = { A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12 };
        for (var i = 0; i < coeffs.Length; i++)
        {
            dQdw += (i + 2) * coeffs[i] * wPower; // Derivative coefficient: 2,3,4,...,12
            wPower *= w;
        }

        // Apply chain rule: dQ/dr = dQ/dw * dw/dr, where dw/dr = 2r/H²
        var dQdr = dQdw * 2 * r / (H * H);

        return (r * invR2 + dQdr) / (1 - (1 - e2) * z / R);
    }

    public double CalculateOpalUnZSlope(double r, double R, double e2, double H,
        double A3, double A4, double A5, double A6, double A7, double A8,
        double A9, double A10, double A11, double A12, double A13)
    {
        // First, compute z using your sag method.
        var z = CalculateOpalUnZSag(r, R, e2, H, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13);
        var c = 1.0 / R;

        // Compute dQ/dw explicitly.
        var w = z / H;
        var dQdw = 3 * A3 * Math.Pow(w, 2) + 4 * A4 * Math.Pow(w, 3)
                                           + 5 * A5 * Math.Pow(w, 4) + 6 * A6 * Math.Pow(w, 5)
                                           + 7 * A7 * Math.Pow(w, 6) + 8 * A8 * Math.Pow(w, 7)
                                           + 9 * A9 * Math.Pow(w, 8) + 10 * A10 * Math.Pow(w, 9)
                                           + 11 * A11 * Math.Pow(w, 10) + 12 * A12 * Math.Pow(w, 11)
                                           + 13 * A13 * Math.Pow(w, 12);

        // Apply chain rule: dQ/dz = dQ/dw * (1/H)
        var dQdz = dQdw / H;

        // Now, differentiate your implicit function F(z, r) = z - (c*(r^2 + (1-e2)*z^2)/2) - Q(z/H) = 0
        // Partial derivative with respect to z:
        var dFdz = 1 - c * (1 - e2) * z - dQdz;
        // Partial derivative with respect to r (only r^2 contributes):
        var dFdr = -c * r;

        // Therefore, by implicit differentiation: dz/dr = - (dF/dr) / (dF/dz)
        var dzdr = -dFdr / dFdz;

        return dzdr;
    }

    public double CalculatePolySlope(double r,
        double A1, double A2, double A3, double A4, double A5, double A6,
        double A7, double A8, double A9, double A10, double A11, double A12, double A13)
    {
        const double tolerance = 1e-12;
        const int maxIterations = 1000;
        var rSquared = r * r;
        var z = 1.0;
        var iteration = 0;

        while (iteration < maxIterations)
        {
            var Q = A13;
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

            var P = z * Q;
            var Q_deriv = A13 * 12;
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
            var P_deriv = Q + z * Q_deriv;
            var delta = (P - rSquared) / P_deriv;
            var zNew = z - delta;
            if (Math.Abs(delta) < tolerance) break;
            z = zNew;
            iteration++;
        }

        if (iteration >= maxIterations)
            Console.WriteLine("Warning: Maximum iterations reached without convergence for CalculatePolySlope.");

        var slopeDenominator = A1 + 2 * A2 * z + 3 * A3 * z * z + 4 * A4 * z * z * z +
                               5 * A5 * Math.Pow(z, 4) + 6 * A6 * Math.Pow(z, 5) +
                               7 * A7 * Math.Pow(z, 6) + 8 * A8 * Math.Pow(z, 7) +
                               9 * A9 * Math.Pow(z, 8) + 10 * A10 * Math.Pow(z, 9) +
                               11 * A11 * Math.Pow(z, 10) + 12 * A12 * Math.Pow(z, 11) +
                               13 * A13 * Math.Pow(z, 12);

        return 2 * r / slopeDenominator;
    }


    public double CalculateBestFitSphereRadius3Points(double maxR, double zmax)
    {
        return maxR * maxR / (2 * zmax) + zmax / 2;
    }

    public (double R4, double zm, double rm, double g, double Lz) CalculateBestFitSphereRadius4Points(
        double minR, double maxR, double zmin, double zmax)
    {
        var Lr = maxR - minR;
        var Lz = zmax - zmin;
        var twoF = Math.Sqrt(Lz * Lz + Lr * Lr);
        var zm_val = (zmin + zmax) / 2;
        var rm_val = (minR + maxR) / 2;
        var g_val = twoF * rm_val / Math.Abs(Lz);
        var R4_val = Math.Sqrt(g_val * g_val + Math.Pow(twoF / 2, 2));
        return (R4_val, zm_val, rm_val, g_val, Lz);
    }

    public double CalculateAsphericityForR3(double r, double z, double R3, double R)
    {
        return Math.Sign(R) * (Math.Abs(R3) - Math.Sqrt(Math.Pow(R3 - z, 2) + r * r));
    }

    public double CalculateAsphericityForR4(double r, double z, double R4, double zm, double rm, double g, double Lz)
    {
        double signLz = Math.Sign(Lz);
        var z0 = zm + signLz * Math.Sqrt(g * g - rm * rm);
        return Math.Sign(z) * (R4 - Math.Sqrt(Math.Pow(z0 - z, 2) + r * r));
    }



    public double CalculateAberrationOfNormals(double z, double r, double slope, double R)
    {
        if (slope == 0) throw new DivideByZeroException("Slope cannot be zero when calculating aberration of normals.");
        return z + r / slope - R;
    }
}