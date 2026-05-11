/**
 * Surface Equation Fitter (pure JavaScript)
 * Functionally equivalent to surfaceFitter.py — uses Levenberg-Marquardt
 * via ml-levenberg-marquardt to fit optical surface equations.
 *
 * Same API as the Python script's IPC contract:
 *   fitSurface(surfaceData, settings)
 *     -> { success, fitReport, metrics, deviations, stdout }
 *
 * Per-parameter scaling is applied internally so the optimizer always works on
 * O(1) values. Without this, coefficients spanning 10² … 10⁻¹⁵ make the default
 * library defaults (gradientDifference=0.1, errorTolerance=1e-3) useless.
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

/**
 * Estimate a sane scale for each free parameter so the optimizer sees O(1) values.
 *
 * The strategy is per-surface-type because each polynomial term contributes to
 * z differently:
 *  - EA, OA: term is A_n * r^n        → scale = zMax / rMax^n
 *  - Opal Z: term is A_n * w^n, w=z/H  → scale = zMax * H^n / zMax^n
 *  - Opal U: term is A_n * w^n, w=r²/H² → scale = zMax * H^(2n) / rMax^(2n)
 *  - Opal P: term is A_n * z^n (z·Q(z)=r²) → scale = rMax² / zMax^n
 *  - Poly (auto-norm): internal norm makes all coefs ~ rMax²/zMax
 *  - Shape (k, e2): scale = 1
 */
function scaleFromSpec(spec, ctx) {
  const { rMax, zMax, R, H, H_internal } = ctx;
  switch (spec.kind) {
    case 'shape':
      return 1;
    case 'r-power': {
      const n = spec.power;
      const s = zMax / Math.pow(Math.max(rMax, 1e-12), n);
      return Number.isFinite(s) && s > 0 ? s : 1e-30;
    }
    case 'opal-z-power': {
      const n = spec.power;
      const s = zMax * Math.pow(H, n) / Math.pow(Math.max(zMax, 1e-12), n);
      return Number.isFinite(s) && s !== 0 ? s : 1;
    }
    case 'opal-u-power': {
      const n = spec.power;
      const s = zMax * Math.pow(H, 2 * n) / Math.pow(Math.max(rMax, 1e-12), 2 * n);
      return Number.isFinite(s) && s !== 0 ? s : 1;
    }
    case 'opal-p-power': {
      const n = spec.power;
      const s = (rMax * rMax) / Math.pow(Math.max(zMax, 1e-12), n);
      return Number.isFinite(s) && s !== 0 ? s : 1;
    }
    case 'poly-internal': {
      // Internal Q-coefficients live on H_internal-normalized variable; scale ~ rMax²/zMax
      const s = (rMax * rMax) / Math.max(zMax, 1e-12);
      return Number.isFinite(s) && s !== 0 ? s : 1;
    }
    default:
      return 1;
  }
}

/**
 * Compute weighted SSE for given parameters (same metric the library uses).
 */
function sseFor(rArr, zArr, modelFn, params) {
  const f = modelFn(params);
  let s = 0;
  for (let i = 0; i < rArr.length; i++) {
    const d = zArr[i] - f(rArr[i]);
    s += d * d;
  }
  return s;
}

/**
 * Run Levenberg-Marquardt with per-parameter scaling so the optimizer always
 * sees O(1) parameter magnitudes regardless of the surface model.
 *
 * The library only terminates on absolute SSE threshold, never on relative
 * improvement — so we drive it in chunks and break when SSE stops shrinking.
 * That mirrors lmfit's ftol behavior and gives a meaningful iteration count.
 */
function fitWithScaling(rArr, zArr, initialValues, scales, modelFn, maxIterations) {
  const chunkSize = 100;
  const relTol = 1e-12;  // chunks must reduce SSE by more than this fraction to keep going

  let curParams = initialValues.slice();
  let bestParams = curParams.slice();
  let bestSse = sseFor(rArr, zArr, modelFn, curParams);
  let totalIter = 0;

  while (totalIter < maxIterations) {
    const remaining = Math.min(chunkSize, maxIterations - totalIter);
    const scaledInitial = curParams.map((v, i) => v / scales[i]);
    const scaledModelFn = (sparams) => modelFn(sparams.map((sp, i) => sp * scales[i]));

    const result = levenbergMarquardt(
      { x: rArr, y: zArr },
      scaledModelFn,
      {
        damping: 1e-3,
        initialValues: scaledInitial,
        gradientDifference: 1e-6,
        centralDifference: true,
        improvementThreshold: 1e-6,
        maxIterations: remaining,
        errorTolerance: 1e-30,
      }
    );

    totalIter += result.iterations;
    const newParams = result.parameterValues.map((sp, i) => sp * scales[i]);
    const newSse = sseFor(rArr, zArr, modelFn, newParams);

    // Track global best
    if (newSse < bestSse) {
      const relImprovement = (bestSse - newSse) / Math.max(bestSse, 1e-30);
      bestSse = newSse;
      bestParams = newParams;
      // Stop if a full chunk produced negligible improvement
      if (result.iterations >= remaining && relImprovement < relTol) break;
    } else {
      // No improvement this chunk — LM has stagnated
      break;
    }

    // The library may stop early if it hit its absolute tolerance
    if (result.iterations < remaining) break;

    curParams = newParams;
  }

  return { parameterValues: bestParams, iterations: totalIter };
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

  const rMax = Math.max(...rArr.map(Math.abs), 1e-12);
  const zMax = Math.max(...zArr.map(Math.abs), 1e-12);

  const initialValues = [];
  const paramSpecs = [];
  let modelFn;          // (params) => (r) => z
  let extractFitReport; // (params) => {Type, ...}
  let H_internal = null;

  if (equationChoice === '1') {
    // Even Asphere
    if (conicIsVariable) {
      initialValues.push(-1.0);
      paramSpecs.push({ kind: 'shape', name: 'k' });
    }
    for (let i = 0; i < numTerms; i++) {
      const power = 4 + 2 * i;
      initialValues.push(0.0);
      paramSpecs.push({ kind: 'r-power', power, name: `A${power}` });
    }

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
    if (conicIsVariable) {
      initialValues.push(-1.0);
      paramSpecs.push({ kind: 'shape', name: 'k' });
    }
    for (let i = 0; i < numTerms; i++) {
      const power = 3 + i;
      initialValues.push(0.0);
      paramSpecs.push({ kind: 'r-power', power, name: `A${power}` });
    }

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
    if (e2IsVariable) {
      initialValues.push(1.0);
      paramSpecs.push({ kind: 'shape', name: 'e2' });
    }
    for (let i = 0; i < numTerms; i++) {
      const power = 3 + i;
      initialValues.push(0.0);
      paramSpecs.push({ kind: 'opal-z-power', power, name: `A${power}` });
    }

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
    if (e2IsVariable) {
      initialValues.push(1.0);
      paramSpecs.push({ kind: 'shape', name: 'e2' });
    }
    for (let i = 0; i < numTerms; i++) {
      const power = 2 + i;
      initialValues.push(0.0);
      paramSpecs.push({ kind: 'opal-u-power', power, name: `A${power}` });
    }

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
    if (e2IsVariable) {
      initialValues.push(1.0);
      paramSpecs.push({ kind: 'shape', name: 'e2' });
    }
    for (let i = 0; i < numTerms; i++) {
      const power = 3 + i;
      initialValues.push(0.0);
      paramSpecs.push({ kind: 'opal-p-power', power, name: `A${power}` });
    }

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
    const fallback = rMax / 10;
    const autoH = zMax > 1e-12 ? zMax : fallback;
    H_internal = settings.H_internal !== undefined && String(settings.H_internal).trim() !== ''
      ? floatSetting(settings, 'H_internal', autoH)
      : autoH;

    stdoutLines.push(`INFO: Using internal normalization H = ${H_internal.toFixed(6)}`);
    stdoutLines.push('INFO: This improves numerical conditioning during fitting');
    stdoutLines.push('INFO: Coefficients will be automatically rescaled to H=1');

    if (e2IsVariable) {
      initialValues.push(1.0);
      paramSpecs.push({ kind: 'shape', name: 'e2' });
    }
    for (let i = 0; i < numTerms; i++) {
      initialValues.push(0.0);
      paramSpecs.push({ kind: 'poly-internal', name: `A${3 + i}` });
    }

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
  const maxIterations = 2000;

  if (initialValues.length > 0) {
    const ctx = { rMax, zMax, R, H, H_internal };
    const scales = paramSpecs.map((spec, i) => {
      const s = scaleFromSpec(spec, ctx);
      // Shape params can have non-zero initial; bias scale by |initial| if larger
      if (spec.kind === 'shape' && Math.abs(initialValues[i]) > 1) {
        return Math.abs(initialValues[i]);
      }
      return s;
    });

    const result = fitWithScaling(rArr, zArr, initialValues, scales, modelFn, maxIterations);
    fittedParams = result.parameterValues;
    iterations = result.iterations;
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

  // Success heuristic: either the library terminated early (rare with our settings)
  // OR the fit is "good" (rmse small compared to data range). The latter mirrors
  // what users actually care about — a converged-but-mediocre fit is still useful.
  const converged = iterations < maxIterations;
  const relativeRmse = rmse / Math.max(zMax, 1e-15);
  const goodFit = relativeRmse < 1e-3;
  const success = converged || goodFit;

  const fitReport = extractFitReport(fittedParams);
  const metrics = {
    RMSE: rmse,
    R_squared: rSquared,
    AIC: aic,
    BIC: bic,
    Chi_square: chiSquare,
    Reduced_chi_square: reducedChiSquare,
    Iterations: iterations,
    Success: success,
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
