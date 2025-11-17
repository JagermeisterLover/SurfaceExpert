// Direct comparison with Zemax values
// Testing at r=50 with exact parameters from SURF 2

const Decimal = require('decimal.js');

// Parse ZMX parameters
const CURV = -3.333333333333333547e-03;
const R = 1 / CURV;  // -300.0000000000000...
const k = -1;
const A4 = 5.3300000000000002e-10;  // PARM 2
const A6 = 1e-13;                     // PARM 3
const A8 = 1.0000000000000001e-15;   // PARM 4
const A10 = 0;
const A12 = 0;
const A14 = 0;
const A16 = 0;
const A18 = 0;
const A20 = 0;

const r = 50.0;  // Test position

// Zemax reference values
const zemaxSag = -4.122710;
const zemaxSlope = -0.1599566;

console.log('=== ZEMAX COMPARISON TEST ===\n');
console.log('Parameters from ZMX:');
console.log(`  CURV = ${CURV}`);
console.log(`  R = 1/CURV = ${R}`);
console.log(`  k (CONI) = ${k}`);
console.log(`  A4 (PARM 2) = ${A4}`);
console.log(`  A6 (PARM 3) = ${A6}`);
console.log(`  A8 (PARM 4) = ${A8}`);
console.log(`  r = ${r} mm`);
console.log('');

// ============================================
// JavaScript 64-bit calculation
// ============================================

function calculateSag(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20) {
    const r2 = r * r;
    const R2 = R * R;
    const kp1 = 1.0 + k;

    const sqrtTerm = Math.sqrt(1.0 - kp1 * r2 / R2);
    const baseSag = r2 / (R * (1.0 + sqrtTerm));

    let rPower = r2 * r2;
    let polySag = A4 * rPower;
    rPower *= r2; polySag += A6 * rPower;
    rPower *= r2; polySag += A8 * rPower;
    rPower *= r2; polySag += A10 * rPower;
    rPower *= r2; polySag += A12 * rPower;
    rPower *= r2; polySag += A14 * rPower;
    rPower *= r2; polySag += A16 * rPower;
    rPower *= r2; polySag += A18 * rPower;
    rPower *= r2; polySag += A20 * rPower;

    return baseSag + polySag;
}

function calculateSlope(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20) {
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

const jsSag = calculateSag(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20);
const jsSlope = calculateSlope(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20);

console.log('JavaScript (64-bit) Results:');
console.log(`  Sag   = ${jsSag}`);
console.log(`  Slope = ${jsSlope}`);
console.log('');

console.log('Zemax Results:');
console.log(`  Sag   = ${zemaxSag}`);
console.log(`  Slope = ${zemaxSlope}`);
console.log('');

console.log('Differences:');
console.log(`  Sag diff   = ${jsSag - zemaxSag} (${((jsSag - zemaxSag) / zemaxSag * 100).toExponential(4)}%)`);
console.log(`  Slope diff = ${jsSlope - zemaxSlope} (${((jsSlope - zemaxSlope) / zemaxSlope * 100).toExponential(4)}%)`);
console.log('');

// ============================================
// High-precision calculation with Decimal.js
// ============================================

function calculateSagDecimal(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20, precision) {
    Decimal.set({ precision: precision });

    const r_d = new Decimal(r);
    const R_d = new Decimal(R);
    const k_d = new Decimal(k);
    const A4_d = new Decimal(A4);
    const A6_d = new Decimal(A6);
    const A8_d = new Decimal(A8);

    const r2 = r_d.pow(2);
    const R2 = R_d.pow(2);
    const kp1 = new Decimal(1).plus(k_d);

    const sqrtTerm = new Decimal(1).minus(kp1.mul(r2).div(R2)).sqrt();
    const baseSag = r2.div(R_d.mul(new Decimal(1).plus(sqrtTerm)));

    let rPower = r2.mul(r2);
    let polySag = A4_d.mul(rPower);
    rPower = rPower.mul(r2); polySag = polySag.plus(A6_d.mul(rPower));
    rPower = rPower.mul(r2); polySag = polySag.plus(A8_d.mul(rPower));

    return baseSag.plus(polySag);
}

function calculateSlopeDecimal(r, R, k, A4, A6, A8, A10, A12, A14, A16, A18, A20, precision) {
    Decimal.set({ precision: precision });

    const r_d = new Decimal(r);
    const R_d = new Decimal(R);
    const k_d = new Decimal(k);
    const A4_d = new Decimal(A4);
    const A6_d = new Decimal(A6);
    const A8_d = new Decimal(A8);

    const r2 = r_d.pow(2);
    const r3 = r2.mul(r_d);
    const R2 = R_d.pow(2);
    const kp1 = new Decimal(1).plus(k_d);

    const Q = new Decimal(1).minus(kp1.mul(r2).div(R2)).sqrt();
    const Qp1 = new Decimal(1).plus(Q);
    const Qp1_sq = Qp1.pow(2);

    const numerator = new Decimal(2).mul(r_d).mul(Qp1).plus(kp1.mul(r3).div(R2.mul(Q)));
    const baseSagSlope = numerator.div(R_d.mul(Qp1_sq));

    let rPower = r3;
    let polySlope = new Decimal(4).mul(A4_d).mul(rPower);
    rPower = rPower.mul(r2); polySlope = polySlope.plus(new Decimal(6).mul(A6_d).mul(rPower));
    rPower = rPower.mul(r2); polySlope = polySlope.plus(new Decimal(8).mul(A8_d).mul(rPower));

    return baseSagSlope.plus(polySlope);
}

console.log('=== HIGH-PRECISION ANALYSIS ===\n');

const precisionLevels = [24, 34, 50, 100];
precisionLevels.forEach(digits => {
    const hpSag = calculateSagDecimal(r, R, k, A4, A6, A8, 0, 0, 0, 0, 0, 0, digits);
    const hpSlope = calculateSlopeDecimal(r, R, k, A4, A6, A8, 0, 0, 0, 0, 0, 0, digits);

    console.log(`Precision: ${digits} digits`);
    console.log(`  Sag:   ${hpSag.toString()}`);
    console.log(`  Slope: ${hpSlope.toString()}`);
    console.log(`  Sag diff from Zemax:   ${hpSag.minus(zemaxSag).toExponential()}`);
    console.log(`  Slope diff from Zemax: ${hpSlope.minus(zemaxSlope).toExponential()}`);
    console.log('');
});

console.log('=== CONCLUSION ===');
const sagError = Math.abs((jsSag - zemaxSag) / zemaxSag * 100);
const slopeError = Math.abs((jsSlope - zemaxSlope) / zemaxSlope * 100);

console.log(`Sag relative error:   ${sagError.toFixed(6)}%`);
console.log(`Slope relative error: ${slopeError.toFixed(6)}%`);

if (sagError < 0.01 && slopeError < 0.01) {
    console.log('✓ Excellent agreement with Zemax (< 0.01% error)');
    console.log('✓ Precision is already optimal for JavaScript');
} else if (sagError < 0.1 && slopeError < 0.1) {
    console.log('✓ Good agreement with Zemax (< 0.1% error)');
    console.log('⚠ Consider if higher precision is needed for your use case');
} else {
    console.log('✗ Significant discrepancy - formula or parameter issue');
}
