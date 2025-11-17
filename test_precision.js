// Test precision levels to see if we can match Zemax exactly
// This compares JavaScript 64-bit vs high-precision calculations

const Decimal = require('decimal.js');

// Test parameters from the user's ZMX file (SURF 2 EVENASPH)
const params = {
    R: 1 / -3.333333333333333547e-03,  // CURV -> Radius
    k: -1,                              // CONI
    A4: 5.3300000000000002e-10,        // PARM 2
    A6: 1e-13,                         // PARM 3
    A8: 1.0000000000000001e-15,        // PARM 4
    A10: 0,
    A12: 0,
    A14: 0,
    A16: 0,
    A18: 0,
    A20: 0
};

// Test at max aperture (25mm based on DIAM 50)
const r = 25.0;

console.log('=== PRECISION COMPARISON TEST ===\n');
console.log('Parameters:');
console.log(`  R = ${params.R}`);
console.log(`  k = ${params.k}`);
console.log(`  A4 = ${params.A4}`);
console.log(`  A6 = ${params.A6}`);
console.log(`  A8 = ${params.A8}`);
console.log(`  r = ${r}`);
console.log('');

// ============================================
// 1. Standard JavaScript (64-bit IEEE 754)
// ============================================
function calculateSlopeJS(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20) {
    const r2 = r * r;
    const r3 = r2 * r;
    const R2 = R * R;
    const kp1 = 1.0 + k;

    const Q = Math.sqrt(1.0 - kp1 * r2 / R2);
    const Qp1 = 1.0 + Q;
    const Qp1_sq = Qp1 * Qp1;

    const numerator = 2.0 * r * Qp1 + kp1 * r3 / (R2 * Q);
    const baseSagSlope = numerator / (R * Qp1_sq);

    let rPower = r3;
    let polySlope = 4.0 * A4 * rPower;
    rPower *= r2; polySlope += 6.0 * A6 * rPower;
    rPower *= r2; polySlope += 8.0 * A8 * rPower;
    rPower *= r2; polySlope += 10.0 * A10 * rPower;
    rPower *= r2; polySlope += 12.0 * A12 * rPower;
    rPower *= r2; polySlope += 14.0 * A14 * rPower;
    rPower *= r2; polySlope += 16.0 * A16 * rPower;
    rPower *= r2; polySlope += 18.0 * A18 * rPower;
    rPower *= r2; polySlope += 20.0 * A20 * rPower;

    return baseSagSlope + polySlope;
}

const jsResult = calculateSlopeJS(r, params.R, params.k, params.A4, params.A6, params.A8,
                                   params.A10, params.A12, params.A14, params.A16, params.A18, params.A20);

console.log('1. JavaScript (64-bit IEEE 754):');
console.log(`   Slope = ${jsResult}`);
console.log(`   Slope = ${jsResult.toExponential(15)}`);
console.log('');

// ============================================
// 2. Decimal.js with different precision levels
// ============================================
function calculateSlopeDecimal(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20, precision) {
    Decimal.set({ precision: precision });

    const r_d = new Decimal(r);
    const R_d = new Decimal(R);
    const k_d = new Decimal(k);
    const A4_d = new Decimal(A4);
    const A6_d = new Decimal(A6);
    const A8_d = new Decimal(A8);
    const A10_d = new Decimal(A10);
    const A12_d = new Decimal(A12);
    const A14_d = new Decimal(A14);
    const A16_d = new Decimal(A16);
    const A18_d = new Decimal(A18);
    const A20_d = new Decimal(A20);

    const r2 = r_d.pow(2);
    const r3 = r2.mul(r_d);
    const R2 = R_d.pow(2);
    const kp1 = new Decimal(1).plus(k_d);

    // Q = sqrt(1 - (1+k)*r²/R²)
    const Q = new Decimal(1).minus(kp1.mul(r2).div(R2)).sqrt();
    const Qp1 = new Decimal(1).plus(Q);
    const Qp1_sq = Qp1.pow(2);

    // numerator = 2*r*(1+Q) + (1+k)*r³/(R²*Q)
    const numerator = new Decimal(2).mul(r_d).mul(Qp1).plus(kp1.mul(r3).div(R2.mul(Q)));
    const baseSagSlope = numerator.div(R_d.mul(Qp1_sq));

    // Polynomial slope
    let rPower = r3;
    let polySlope = new Decimal(4).mul(A4_d).mul(rPower);

    rPower = rPower.mul(r2); polySlope = polySlope.plus(new Decimal(6).mul(A6_d).mul(rPower));
    rPower = rPower.mul(r2); polySlope = polySlope.plus(new Decimal(8).mul(A8_d).mul(rPower));
    rPower = rPower.mul(r2); polySlope = polySlope.plus(new Decimal(10).mul(A10_d).mul(rPower));
    rPower = rPower.mul(r2); polySlope = polySlope.plus(new Decimal(12).mul(A12_d).mul(rPower));
    rPower = rPower.mul(r2); polySlope = polySlope.plus(new Decimal(14).mul(A14_d).mul(rPower));
    rPower = rPower.mul(r2); polySlope = polySlope.plus(new Decimal(16).mul(A16_d).mul(rPower));
    rPower = rPower.mul(r2); polySlope = polySlope.plus(new Decimal(18).mul(A18_d).mul(rPower));
    rPower = rPower.mul(r2); polySlope = polySlope.plus(new Decimal(20).mul(A20_d).mul(rPower));

    return baseSagSlope.plus(polySlope);
}

// Test with different precision levels
const precisionLevels = [
    { bits: 64, digits: 20, desc: '64-bit equivalent' },
    { bits: 80, digits: 24, desc: '80-bit extended (x87)' },
    { bits: 128, digits: 34, desc: '128-bit quadruple' },
    { bits: 256, digits: 77, desc: '256-bit (overkill)' }
];

precisionLevels.forEach(({ bits, digits, desc }) => {
    const result = calculateSlopeDecimal(r, params.R, params.k, params.A4, params.A6, params.A8,
                                        params.A10, params.A12, params.A14, params.A16, params.A18, params.A20,
                                        digits);
    console.log(`2. Decimal.js (${bits}-bit / ${digits} digits) - ${desc}:`);
    console.log(`   Slope = ${result.toString()}`);
    console.log(`   Slope = ${result.toExponential()}`);
    console.log(`   Diff from JS = ${result.minus(jsResult).toExponential()}`);
    console.log('');
});

// ============================================
// Comparison with Zemax value
// ============================================
const zemaxValue = -0.1599566; // User reported value from Zemax

console.log('=== COMPARISON WITH ZEMAX ===');
console.log(`Zemax value:      ${zemaxValue}`);
console.log(`JavaScript value: ${jsResult}`);
console.log(`Difference:       ${(jsResult - zemaxValue).toExponential()}`);
console.log(`Relative error:   ${(Math.abs((jsResult - zemaxValue) / zemaxValue) * 100).toFixed(6)}%`);
console.log('');

// Test with high precision
const highPrecResult = calculateSlopeDecimal(r, params.R, params.k, params.A4, params.A6, params.A8,
                                             params.A10, params.A12, params.A14, params.A16, params.A18, params.A20,
                                             50);
console.log(`High-precision (50 digits): ${highPrecResult.toString()}`);
console.log(`Diff from Zemax: ${highPrecResult.minus(zemaxValue).toExponential()}`);
console.log('');

console.log('=== CONCLUSION ===');
if (Math.abs(jsResult - zemaxValue) < 1e-6) {
    console.log('✓ JavaScript matches Zemax to within 1e-6 (excellent)');
} else {
    console.log('✗ Discrepancy detected - investigating precision requirements');
}
