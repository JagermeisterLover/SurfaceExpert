/**
 * Surface Equation Fitter (pure JavaScript)
 * Functionally equivalent to surfaceFitter.py — uses Levenberg-Marquardt
 * via ml-levenberg-marquardt to fit optical surface equations.
 *
 * Same API as the Python script's IPC contract:
 *   fitSurface(surfaceData, settings)
 *     -> { success, fitReport, metrics, deviations, stdout }
 */

const { levenbergMarquardt } = require('ml-levenberg-marquardt');

// ---------- Model functions ----------

function evenAsphereSag(r, R, k, coeffs) {
  const r2 = r * r;
  let disc = 1 - (1 + k) * r2 / (R * R);
  if (disc < 0) disc = 0;
  const denom = R * (1 + Math.sqrt(disc));
  let term1 = denom !== 0 ? r2 / denom : 0;
  if (!Number.isFinite(term1)) term1 = 0;
  let term2 = 0;
  let rPow = r2 * r2; // r^4
  for (let i = 0; i < coeffs.length; i++) {
    term2 += coeffs[i] * rPow;
    rPow *= r2;
  }
  return term1 + term2;
}

function extendedAsphereSag(r, R, k, coeffs) {
  const r2 = r * r;
  let disc = 1 - (1 + k) * r2 / (R * R);
  if (disc < 0) disc = 0;
  const denom = R * (1 + Math.sqrt(disc));
  let term1 = denom !== 0 ? r2 / denom : 0;
  if (!Number.isFinite(term1)) term1 = 0;
  let term2 = 0;
  let rPow = r * r2; // r^3
  for (let i = 0; i < coeffs.length; i++) {
    term2 += coeffs[i] * rPow;
    rPow *= r;
  }
  return term1 + term2;
}

function opalUniversalZ(r, R, H, e2, coeffs) {
  const r2 = r * r;
  let z = r2 / (2 * R);
  for (let iter = 0; iter < 10; iter++) {
    const w = z / H;
    let Q = 0;
    let wPow = w * w * w; // w^3
    for (let i = 0; i < coeffs.length; i++) {
      Q += coeffs[i] * wPow;
      wPow *= w;
    }
    let zNew = (r2 + (1 - e2) * z * z) / (2 * R) + Q;
    if (!Number.isFinite(zNew)) zNew = 0;
    z = zNew;
  }
  return z;
}

function opalUniversalU(r, R, H, e2, coeffs) {
  const r2 = r * r;
  const w = r2 / (H * H);
  let Q = 0;
  let wPow = w * w; // w^2
  for (let i = 0; i < coeffs.length; i++) {
    Q += coeffs[i] * wPow;
    wPow *= w;
  }
  let z = r2 / (2 * R);
  for (let iter = 0; iter < 10; iter++) {
    let zNew = (r2 + (1 - e2) * z * z) / (2 * R) + Q;
    if (!Number.isFinite(zNew)) zNew = 0;
    z = zNew;
  }
  return z;
}

function opalPolynomialZ(r, R, e2, coeffs) {
  const A1 = 2 * R;
  const A2 = e2 - 1;
  const r2 = r * r;
  let z = r2 / A1;
  for (let iter = 0; iter < 10; iter++) {
    let Q = 0;
    let zPow = z * z * z; // z^3
    for (let i = 0; i < coeffs.length; i++) {
      Q += coeffs[i] * zPow;
      zPow *= z;
    }
    let zNew = (r2 - A2 * z * z - Q) / A1;
    if (!Number.isFinite(zNew)) zNew = 0;
    z = zNew;
  }
  return z;
}

/**
 * Pure polynomial surface with internal normalization:
 *   P(z) = z * Q(z/H) = r²,  Q(w) = A1 + A2*w + A3*w² + …
 * Solved by Newton-Raphson for z given r.
 */
function polySurface(r, H, coeffs) {
  const r2 = r * r;
  let z = 1.0;
  const tol = 1e-12;
  for (let iter = 0; iter < 1000; iter++) {
    const w = z / H;
    // Horner's method for Q(w) and Q'(w)
    let Q = 0;
    for (let i = coeffs.length - 1; i >= 0; i--) Q = Q * w + coeffs[i];
    let Qd = 0;
    for (let i = coeffs.length - 1; i >= 1; i--) Qd = Qd * w + coeffs[i] * i;
    const P = z * Q;
    const PDeriv = Q + (z * Qd) / H;
    const denom = Math.abs(PDeriv) > 1e-15 ? PDeriv : 1e-15;
    const delta = (P - r2) / denom;
    const zNew = z - delta;
    if (Math.abs(delta) < tol) return zNew;
    z = zNew;
  }
  return z;
}

function rescalePolyCoeffs(coeffs, H) {
  const out = [];
  for (let i = 0; i < coeffs.length; i++) {
    out.push(i === 0 ? coeffs[i] : coeffs[i] / Math.pow(H, i));
  }
  return out;
}

// ---------- Helpers ----------

function checkFinite(arr, label) {
  for (let i = 0; i < arr.length; i++) {
    if (!Number.isFinite(arr[i])) {
      throw new Error(`${label} contains NaN or infinite value at index ${i}`);
    }
  }
}

function intSetting(settings, key, fallback) {
  const v = settings[key];
  if (v === undefined || v === null || v === '') return fallback;
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? fallback : n;
}

function floatSetting(settings, key, fallback) {
  const v = settings[key];
  if (v === undefined || v === null || v === '') return fallback;
  const n = parseFloat(v);
  return Number.isNaN(n) ? fallback : n;
}

// ---------- Main fit entrypoint ----------

/**
 * @param {Array<{r:number,z:number}>} surfaceData
 * @param {Object} settings  — same keys as Python ConvertSettings.txt
 * @returns {{success:boolean, fitReport:Object, metrics:Object, deviations:string, stdout:string}}
 */
function fitSurface(surfaceData, settings) {
  if (!Array.isArray(surfaceData) || surfaceData.length === 0) {
    throw new Error('surfaceData must be a non-empty array of {r, z}');
  }

  const rArr = surfaceData.map(p => Number(p.r));
  const zArr = surfaceData.map(p => Number(p.z));
  checkFinite(rArr, 'r_data');
  checkFinite(zArr, 'z_data');

  const equationChoice = String(settings.SurfaceType ?? '');
  const R = floatSetting(settings, 'Radius', 0);
  const H = floatSetting(settings, 'H', 1.0);
  const e2IsVariable = intSetting(settings, 'e2_isVariable', 0) === 1;
  const e2Value = floatSetting(settings, 'e2', 1.0);
  const conicIsVariable = intSetting(settings, 'conic_isVariable', 0) === 1;
  const conicValue = floatSetting(settings, 'conic', 0.0);
  const numTerms = intSetting(settings, 'TermNumber', 0);
  const algorithm = String(settings.OptimizationAlgorithm ?? 'leastsq');

  const stdoutLines = [];
  if (algorithm !== 'leastsq' && algorithm !== 'least_squares') {
    stdoutLines.push(
      `WARN: Algorithm '${algorithm}' is not implemented in JS fitter; using Levenberg-Marquardt.`
    );
  }

  let initialValues = [];
  let modelFn;          // (params) => (r) => z
  let extractFitReport; // (params) => {Type, ...}
  let H_internal = null;

  if (equationChoice === '1') {
    // Even Asphere
    if (conicIsVariable) initialValues.push(-1.0);
    for (let i = 0; i < numTerms; i++) initialValues.push(0.0);

    modelFn = (params) => (r) => {
      let idx = 0;
      const k = conicIsVariable ? params[idx++] : conicValue;
      const coeffs = [];
      for (let i = 0; i < numTerms; i++) coeffs.push(params[idx++]);
      return evenAsphereSag(r, R, k, coeffs);
    };
    extractFitReport = (params) => {
      let idx = 0;
      const k = conicIsVariable ? params[idx++] : conicValue;
      const rep = { Type: 'EA', R, k };
      for (let i = 0; i < numTerms; i++) rep[`A${4 + 2 * i}`] = params[idx++];
      return rep;
    };
  } else if (equationChoice === '2') {
    // Odd Asphere
    if (conicIsVariable) initialValues.push(-1.0);
    for (let i = 0; i < numTerms; i++) initialValues.push(0.0);

    modelFn = (params) => (r) => {
      let idx = 0;
      const k = conicIsVariable ? params[idx++] : conicValue;
      const coeffs = [];
      for (let i = 0; i < numTerms; i++) coeffs.push(params[idx++]);
      return extendedAsphereSag(r, R, k, coeffs);
    };
    extractFitReport = (params) => {
      let idx = 0;
      const k = conicIsVariable ? params[idx++] : conicValue;
      const rep = { Type: 'OA', R, k };
      for (let i = 0; i < numTerms; i++) rep[`A${3 + i}`] = params[idx++];
      return rep;
    };
  } else if (equationChoice === '3') {
    // Opal Universal Z
    if (e2IsVariable) initialValues.push(1.0);
    for (let i = 0; i < numTerms; i++) initialValues.push(0.0);

    modelFn = (params) => (r) => {
      let idx = 0;
      const e2 = e2IsVariable ? params[idx++] : e2Value;
      const coeffs = [];
      for (let i = 0; i < numTerms; i++) coeffs.push(params[idx++]);
      return opalUniversalZ(r, R, H, e2, coeffs);
    };
    extractFitReport = (params) => {
      let idx = 0;
      const e2 = e2IsVariable ? params[idx++] : e2Value;
      const rep = { Type: 'OUZ', R, H, e2 };
      for (let i = 0; i < numTerms; i++) rep[`A${3 + i}`] = params[idx++];
      return rep;
    };
  } else if (equationChoice === '4') {
    // Opal Universal U
    if (e2IsVariable) initialValues.push(1.0);
    for (let i = 0; i < numTerms; i++) initialValues.push(0.0);

    modelFn = (params) => (r) => {
      let idx = 0;
      const e2 = e2IsVariable ? params[idx++] : e2Value;
      const coeffs = [];
      for (let i = 0; i < numTerms; i++) coeffs.push(params[idx++]);
      return opalUniversalU(r, R, H, e2, coeffs);
    };
    extractFitReport = (params) => {
      let idx = 0;
      const e2 = e2IsVariable ? params[idx++] : e2Value;
      const rep = { Type: 'OUU', R, e2, H };
      for (let i = 0; i < numTerms; i++) rep[`A${2 + i}`] = params[idx++];
      return rep;
    };
  } else if (equationChoice === '5') {
    // Opal Polynomial
    if (e2IsVariable) initialValues.push(1.0);
    for (let i = 0; i < numTerms; i++) initialValues.push(0.0);

    modelFn = (params) => (r) => {
      let idx = 0;
      const e2 = e2IsVariable ? params[idx++] : e2Value;
      const coeffs = [];
      for (let i = 0; i < numTerms; i++) coeffs.push(params[idx++]);
      return opalPolynomialZ(r, R, e2, coeffs);
    };
    extractFitReport = (params) => {
      let idx = 0;
      const e2 = e2IsVariable ? params[idx++] : e2Value;
      const A1 = 2 * R;
      const A2 = e2 - 1;
      const rep = { Type: 'OP', A1, A2 };
      for (let i = 0; i < numTerms; i++) rep[`A${3 + i}`] = params[idx++];
      return rep;
    };
  } else if (equationChoice === '6') {
    // Poly (Auto-Normalized)
    const zMaxEstimate = Math.max(...zArr.map(Math.abs));
    const fallback = Math.max(...rArr.map(Math.abs)) / 10;
    const autoH = zMaxEstimate > 0 ? zMaxEstimate : fallback;
    H_internal = settings.H_internal !== undefined && String(settings.H_internal).trim() !== ''
      ? floatSetting(settings, 'H_internal', autoH)
      : autoH;

    stdoutLines.push(`INFO: Using internal normalization H = ${H_internal.toFixed(6)}`);
    stdoutLines.push('INFO: This improves numerical conditioning during fitting');
    stdoutLines.push('INFO: Coefficients will be automatically rescaled to H=1');

    if (e2IsVariable) initialValues.push(1.0);
    for (let i = 0; i < numTerms; i++) initialValues.push(0.0);

    modelFn = (params) => (r) => {
      let idx = 0;
      const e2 = e2IsVariable ? params[idx++] : e2Value;
      const A1 = 2 * R;
      const A2 = e2 - 1;
      const coeffs = [A1, A2];
      for (let i = 0; i < numTerms; i++) coeffs.push(params[idx++]);
      return polySurface(r, H_internal, coeffs);
    };
    extractFitReport = (params) => {
      let idx = 0;
      const e2 = e2IsVariable ? params[idx++] : e2Value;
      const A1 = 2 * R;
      const A2 = e2 - 1;
      const higher = [];
      for (let i = 0; i < numTerms; i++) higher.push(params[idx++]);
      const full = [A1, A2, ...higher];
      const rescaled = rescalePolyCoeffs(full, H_internal);
      const rep = { Type: 'Poly' };
      rescaled.forEach((c, i) => { rep[`A${i + 1}`] = c; });
      return rep;
    };
  } else {
    throw new Error(`Invalid surface type: '${equationChoice}'`);
  }

  // Run optimization (skip if no free parameters)
  let fittedParams = initialValues.slice();
  let iterations = 0;
  let converged = true;

  if (initialValues.length > 0) {
    const maxIterations = 200;
    const fit = levenbergMarquardt(
      { x: rArr, y: zArr },
      modelFn,
      {
        damping: 1.5,
        initialValues,
        gradientDifference: 1e-6,
        maxIterations,
        errorTolerance: 1e-12,
      }
    );
    fittedParams = fit.parameterValues;
    iterations = fit.iterations;
    converged = iterations < maxIterations;
  } else {
    stdoutLines.push('INFO: No free parameters; evaluating model directly');
  }

  // Evaluate fitted curve
  const evaluator = modelFn(fittedParams);
  const fittedZ = rArr.map(evaluator);
  const deviations = fittedZ.map((fz, i) => fz - zArr[i]);

  // Compute goodness-of-fit metrics
  const n = zArr.length;
  let ssRes = 0;
  for (const d of deviations) ssRes += d * d;
  const rmse = Math.sqrt(ssRes / n);
  const zMean = zArr.reduce((a, b) => a + b, 0) / n;
  let ssTot = 0;
  for (const z of zArr) ssTot += (z - zMean) * (z - zMean);
  const rSquared = ssTot !== 0 ? 1 - ssRes / ssTot : NaN;
  const kParams = Math.max(1, initialValues.length);
  const aic = ssRes > 0 ? n * Math.log(ssRes / n) + 2 * kParams : NaN;
  const bic = ssRes > 0 ? n * Math.log(ssRes / n) + kParams * Math.log(n) : NaN;
  const chiSquare = ssRes;
  const reducedChiSquare = n > kParams ? ssRes / (n - kParams) : NaN;

  const fitReport = extractFitReport(fittedParams);
  const metrics = {
    RMSE: rmse,
    R_squared: rSquared,
    AIC: aic,
    BIC: bic,
    Chi_square: chiSquare,
    Reduced_chi_square: reducedChiSquare,
    Iterations: iterations,
    Success: converged,
  };

  const deviationsText = rArr.map((r, i) =>
    `${r.toExponential(12)}\t${zArr[i].toExponential(12)}\t${fittedZ[i].toExponential(12)}\t${deviations[i].toExponential(12)}`
  ).join('\n');

  stdoutLines.push('SUCCESS: Fitting completed');

  return {
    success: true,
    fitReport,
    metrics,
    deviations: deviationsText,
    stdout: stdoutLines.join('\n'),
  };
}

module.exports = { fitSurface };
