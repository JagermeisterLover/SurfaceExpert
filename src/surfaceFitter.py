#!/usr/bin/env python3
"""
Surface Equation Fitter using lmfit
Fits optical surface equations to data points
"""

from numpy import loadtxt, any, isnan, isinf, isfinite, maximum, errstate, sqrt, where, inf, log
import numpy as np
from lmfit import Parameters, minimize, report_fit
import sys
import os

def check_for_nan_or_inf(data, label):
    if any(isnan(data)) or any(isinf(data)):
        raise ValueError(f"{label} contains NaN or infinite values.")

def even_asphere_sag(r, R, k, *coeffs):
    discriminant = 1 - (1 + k) * r**2 / R**2
    discriminant = maximum(discriminant, 0)
    with errstate(divide='ignore', invalid='ignore'):
        term1 = (r**2) / (R * (1 + sqrt(discriminant)))
        term1 = where(isfinite(term1), term1, 0)
    term2 = sum(A * r**(4 + 2*i) for i, A in enumerate(coeffs))
    return term1 + term2

def extended_asphere_sag(r, R, k, *coeffs):
    discriminant = 1 - (1 + k) * r**2 / R**2
    discriminant = maximum(discriminant, 0)
    with errstate(divide='ignore', invalid='ignore'):
        term1 = (r**2) / (R * (1 + sqrt(discriminant)))
        term1 = where(isfinite(term1), term1, 0)
    term2 = sum(A * r**(3 + i) for i, A in enumerate(coeffs))
    return term1 + term2

def opal_universal_z(r, R, H, e2, *coeffs):
    z = r**2 / (2 * R)
    for _ in range(10):
        w = z / H
        Q = sum(A * w**(3 + i) for i, A in enumerate(coeffs))
        z_new = ((r**2) + (1 - e2) * (z**2)) / (2 * R) + Q
        z_new = where(isfinite(z_new), z_new, 0)
        z = z_new
    return z

def poly_surface(r, H, *coeffs):
    """Pure polynomial surface with internal normalization.

    The surface satisfies: P(z) = z * Q(z/H) = r² where Q is a polynomial.
    Q(w) = A1 + A2*w + A3*w² + ... where w = z/H
    P(z) = z * (A1 + A2*z/H + A3*z²/H² + ...) = A1*z + A2*z²/H + A3*z³/H² + ...

    Args:
        r: Radial coordinate array
        H: Normalization factor (improves numerical conditioning)
        coeffs: Polynomial coefficients A1, A2, A3, ..., A13
    """
    tolerance = 1e-12
    max_iterations = 1000
    r_squared = r**2
    z = np.ones_like(r)  # Initial guess

    for iteration in range(max_iterations):
        w = z / H  # Normalized variable

        # Evaluate Q(w) = A1 + A2*w + A3*w² + ... using Horner's method
        # Start from highest power and work down
        Q = np.zeros_like(w)
        for i in range(len(coeffs) - 1, -1, -1):
            Q = Q * w + coeffs[i]
        # Now Q = A1 + A2*w + A3*w² + ...

        # Evaluate Q'(w) = A2 + 2*A3*w + 3*A4*w² + ... for Newton-Raphson
        Q_deriv = np.zeros_like(w)
        for i in range(len(coeffs) - 1, 0, -1):  # Skip A1 (index 0)
            Q_deriv = Q_deriv * w + coeffs[i] * i
        # Now Q_deriv = A2 + 2*A3*w + 3*A4*w² + ...

        # Newton-Raphson: solve P(z) = z * Q(z/H) - r² = 0
        P = z * Q
        P_deriv = Q + z * Q_deriv / H

        delta = (P - r_squared) / np.where(np.abs(P_deriv) > 1e-15, P_deriv, 1e-15)
        z_new = z - delta

        if np.all(np.abs(delta) < tolerance):
            return z_new

        z = z_new

    return z

def opal_polynomial_z(r, R, e2, *coeffs):
    A1 = 2 * R
    A2 = e2 - 1
    z = r**2 / A1
    for _ in range(10):
        Q = sum(A * (z**(3 + i)) for i, A in enumerate(coeffs))
        z_new = (r**2 - A2 * z**2 - Q) / A1
        z_new = where(isfinite(z_new), z_new, 0)
        z = z_new
    return z

def opal_universal_u(r, R, H, e2, *coeffs):
    z = r**2 / (2 * R)
    for _ in range(10):
        w = r**2 / H**2
        Q = sum(A * w**(2 + i) for i, A in enumerate(coeffs))
        z_new = ((r**2) + (1 - e2) * (z**2)) / (2 * R) + Q
        z_new = where(isfinite(z_new), z_new, 0)
        z = z_new
    return z

def rescale_poly_coefficients(coeffs, H_internal):
    """Rescale polynomial coefficients from internal H to H=1.

    The Poly equation is: P(z) = z * Q(z) where Q(z) = A1 + A2*z + A3*z² + ...
    This gives: P(z) = A1*z + A2*z² + A3*z³ + ... = r²

    When fitting with normalization H:
    P(z) = z * Q(z/H) where Q(w) = A1 + A2*w + A3*w² + ... and w = z/H
    This gives: P(z) = z * (A1 + A2*z/H + A3*z²/H² + ...)
              = A1*z + A2*z²/H + A3*z³/H² + ...

    To convert back to standard form (H=1):
    A_std[1] = A_fit[1] / H⁰ = A_fit[1]  (no rescaling)
    A_std[2] = A_fit[2] / H¹
    A_std[3] = A_fit[3] / H²
    Generally: A_std[i] = A_fit[i] / H^(i-1)

    Args:
        coeffs: List of fitted coefficients [A1, A2, A3, ...]
        H_internal: Internal normalization factor used during fitting

    Returns:
        List of rescaled coefficients for H=1
    """
    rescaled = []
    for i, coeff in enumerate(coeffs):
        power = i  # A1 (i=0) has H^0, A2 (i=1) has H^1, etc.
        if power == 0:
            rescaled.append(coeff)  # A1 doesn't need rescaling
        else:
            rescaled.append(coeff / (H_internal ** power))
    return rescaled

def generate_fit_report(filename, equation_choice, result, R, H, num_terms, A1=None, A2=None, H_internal=None):
    with open(filename, 'w') as file:
        if equation_choice == '1':  # Even Asphere
            file.write("Type=EA\n")
            file.write(f"R={R:.12f}\n")
            file.write(f"k={result.params['k'].value:.12f}\n")
            for i in range(num_terms):
                key = f"A{4 + 2 * i}"
                file.write(f"{key}={result.params[key].value:.12e}\n")

        elif equation_choice == '2':  # Odd Asphere
            file.write("Type=OA\n")
            file.write(f"R={R:.12f}\n")
            file.write(f"k={result.params['k'].value:.12f}\n")
            for i in range(num_terms):
                key = f"A{3 + i}"
                file.write(f"{key}={result.params[key].value:.12e}\n")

        elif equation_choice == '3':  # Opal Universal Z
            file.write("Type=OUZ\n")
            file.write(f"R={R:.12f}\n")
            file.write(f"H={H:.12f}\n")
            file.write(f"e2={result.params['e2'].value:.12f}\n")
            for i in range(num_terms):
                key = f"A{3 + i}"
                file.write(f"{key}={result.params[key].value:.12e}\n")

        elif equation_choice == '4':  # Opal Universal U
            file.write("Type=OUU\n")
            file.write(f"R={R:.12f}\n")
            file.write(f"e2={result.params['e2'].value:.12f}\n")
            file.write(f"H={H:.12f}\n")
            for i in range(num_terms):
                key = f"A{2 + i}"
                file.write(f"{key}={result.params[key].value:.12e}\n")

        elif equation_choice == '5':  # Opal Polynomial
            file.write("Type=OP\n")
            file.write(f"A1={A1:.12e}\n")
            file.write(f"A2={A2:.12e}\n")
            for i in range(num_terms):
                key = f"A{3 + i}"
                file.write(f"{key}={result.params[key].value:.12e}\n")

        elif equation_choice == '6':  # Poly (with automatic rescaling)
            file.write("Type=Poly\n")
            file.write(f"# Fitted with internal H={H_internal:.6f}, rescaled to H=1\n")
            # Construct full coefficient list and rescale
            e2 = result.params['e2'].value
            A1_fit = 2 * R  # Fixed, not rescaled
            A2_fit = e2 - 1  # Fixed relationship
            higher_coeffs = [result.params[f'A{3 + i}'].value for i in range(num_terms)]

            # Rescale: A1 stays same, A2 through A13 get rescaled by H^(i-1)
            full_coeffs = [A1_fit, A2_fit] + higher_coeffs
            rescaled_coeffs = rescale_poly_coefficients(full_coeffs, H_internal)

            for i, coeff in enumerate(rescaled_coeffs):
                file.write(f"A{i+1}={coeff:.12e}\n")

def main():
    A1 = None
    A2 = None
    H_internal = None

    # Read data
    data = loadtxt("tempsurfacedata.txt")
    r_data, z_data = data[:, 0], data[:, 1]
    check_for_nan_or_inf(r_data, "r_data")
    check_for_nan_or_inf(z_data, "z_data")

    # Read settings
    settings = {}
    with open("ConvertSettings.txt", "r") as file:
        for line in file:
            if '=' in line:
                key, value = line.strip().split('=', 1)
                settings[key] = value

    equation_choice = settings['SurfaceType']
    R = float(settings['Radius'])
    H = float(settings.get('H', '1.0'))
    e2_isVariable = int(settings.get('e2_isVariable', '0'))
    e2_value = float(settings.get('e2', '1.0'))
    conic_isVariable = int(settings.get('conic_isVariable', '0'))
    conic_value = float(settings.get('conic', '0.0'))
    num_terms = int(settings.get('TermNumber', '0'))
    optimization_algorithm = settings.get('OptimizationAlgorithm', 'leastsq')

    params = Parameters()

    # Setup parameters based on equation type
    if equation_choice == '1':  # Even Asphere
        if conic_isVariable == 0:
            params.add('k', value=conic_value, vary=False)
        else:
            params.add('k', value=-1.0, vary=True)

        for i in range(num_terms):
            params.add(f'A{4 + 2*i}', value=0.0)

        def objective(params, r, z):
            k = params['k']
            coeffs = [params[f'A{4 + 2*i}'] for i in range(num_terms)]
            model = even_asphere_sag(r, R, k, *coeffs)
            return model - z

    elif equation_choice == '2':  # Odd Asphere
        if conic_isVariable == 0:
            params.add('k', value=conic_value, vary=False)
        else:
            params.add('k', value=-1.0, vary=True)

        for i in range(num_terms):
            params.add(f'A{3 + i}', value=0.0)

        def objective(params, r, z):
            k = params['k']
            coeffs = [params[f'A{3 + i}'] for i in range(num_terms)]
            model = extended_asphere_sag(r, R, k, *coeffs)
            return model - z

    elif equation_choice == '3':  # Opal Universal Z
        if e2_isVariable == 0:
            params.add('e2', value=e2_value, vary=False)
        else:
            params.add('e2', value=1.0, vary=True)

        for i in range(num_terms):
            params.add(f'A{3 + i}', value=0.0)

        def objective(params, r, z):
            e2 = params['e2'].value
            coeffs = [params[f'A{3 + i}'].value for i in range(num_terms)]
            model = opal_universal_z(r, R, H, e2, *coeffs)
            return model - z

    elif equation_choice == '4':  # Opal Universal U
        if e2_isVariable == 0:
            params.add('e2', value=e2_value, vary=False)
        else:
            params.add('e2', value=1.0, vary=True)

        for i in range(num_terms):
            params.add(f'A{2 + i}', value=0.0)

        def objective(params, r, z):
            e2 = params['e2'].value
            coeffs = [params[f'A{2 + i}'].value for i in range(num_terms)]
            model = opal_universal_u(r, R, H, e2, *coeffs)
            return model - z

    elif equation_choice == '5':  # Opal Polynomial
        if e2_isVariable == 0:
            params.add('e2', value=e2_value, vary=False)
        else:
            params.add('e2', value=1.0, vary=True)

        for i in range(num_terms):
            params.add(f'A{3 + i}', value=0.0)

        def objective(params, r, z):
            e2 = params['e2'].value
            coeffs = [params[f'A{3 + i}'].value for i in range(num_terms)]
            model = opal_polynomial_z(r, R, e2, *coeffs)
            return model - z

    elif equation_choice == '6':  # Poly (with automatic normalization)
        # Calculate optimal internal normalization factor
        # Use the maximum z value or a reasonable estimate
        z_max_estimate = np.max(np.abs(z_data))
        if z_max_estimate == 0:
            z_max_estimate = np.max(np.abs(r_data)) / 10  # Fallback estimate

        # Set H_internal to scale z to order 1-10 range
        # This can be overridden in settings if desired
        H_internal = float(settings.get('H_internal', z_max_estimate))

        print(f"INFO: Using internal normalization H = {H_internal:.6f}")
        print(f"INFO: This improves numerical conditioning during fitting")
        print(f"INFO: Coefficients will be automatically rescaled to H=1")

        # Setup parameters like Opal Polynomial but with H normalization
        # A1 = 2*R (fixed), A2 = e2-1 (variable or fixed), A3-A13 (fitted)
        if e2_isVariable == 0:
            params.add('e2', value=e2_value, vary=False)
        else:
            params.add('e2', value=1.0, vary=True)

        # Setup higher order coefficients A3-A13
        for i in range(num_terms):
            params.add(f'A{3 + i}', value=0.0)

        def objective(params, r, z):
            e2 = params['e2'].value
            # Construct full coefficient list: [A1, A2, A3, ..., A13]
            A1 = 2 * R
            A2 = e2 - 1
            coeffs = [A1, A2] + [params[f'A{3 + i}'].value for i in range(num_terms)]
            model = poly_surface(r, H_internal, *coeffs)
            return model - z

    else:
        print("ERROR: Invalid surface type")
        sys.exit(1)

    # Run optimization
    try:
        if optimization_algorithm in ['leastsq', 'least_squares']:
            result = minimize(objective, params, args=(r_data, z_data),
                            method=optimization_algorithm, max_nfev=10000,
                            xtol=1e-12, ftol=1e-12)
        else:
            result = minimize(objective, params, args=(r_data, z_data),
                            method=optimization_algorithm, max_nfev=10000)
    except Exception as e:
        print(f"ERROR: Optimization failed: {e}")
        sys.exit(1)

    # Calculate fitted values and metrics
    if equation_choice == '1':
        fitted_z = even_asphere_sag(r_data, R, result.params['k'],
                                   *[result.params[f'A{4 + 2*i}'] for i in range(num_terms)])
    elif equation_choice == '2':
        fitted_z = extended_asphere_sag(r_data, R, result.params['k'],
                                       *[result.params[f'A{3 + i}'] for i in range(num_terms)])
    elif equation_choice == '3':
        e2 = result.params['e2'].value
        fitted_z = opal_universal_z(r_data, R, H, e2,
                                   *[result.params[f'A{3 + i}'] for i in range(num_terms)])
    elif equation_choice == '4':
        e2 = result.params['e2'].value
        fitted_z = opal_universal_u(r_data, R, H, e2,
                                   *[result.params[f'A{2 + i}'] for i in range(num_terms)])
    elif equation_choice == '5':
        e2 = result.params['e2'].value
        fitted_z = opal_polynomial_z(r_data, R, e2,
                                    *[result.params[f'A{3 + i}'] for i in range(num_terms)])
        A1 = 2 * R
        A2 = e2 - 1
    elif equation_choice == '6':
        e2 = result.params['e2'].value
        A1 = 2 * R
        A2 = e2 - 1
        coeffs = [A1, A2] + [result.params[f'A{3 + i}'] for i in range(num_terms)]
        fitted_z = poly_surface(r_data, H_internal, *coeffs)

    deviations = fitted_z - z_data

    # Compute goodness-of-fit metrics
    rmse = sqrt(((deviations)**2).mean())
    ss_res = ((deviations)**2).sum()
    ss_tot = ((z_data - z_data.mean())**2).sum()
    r_squared = 1 - ss_res/ss_tot if ss_tot != 0 else float('nan')
    n = len(z_data)
    k_params = len(result.params)
    aic = n * log(ss_res/n) + 2 * k_params if ss_res > 0 else float('nan')
    bic = n * log(ss_res/n) + k_params * log(n) if ss_res > 0 else float('nan')

    # Generate fit report
    generate_fit_report("FitReport.txt", equation_choice, result, R, H, num_terms, A1, A2, H_internal)

    # Write metrics to separate file
    with open("FitMetrics.txt", 'w') as f:
        f.write(f"RMSE={rmse:.12e}\n")
        f.write(f"R_squared={r_squared:.12f}\n")
        f.write(f"AIC={aic:.12f}\n")
        f.write(f"BIC={bic:.12f}\n")
        f.write(f"Chi_square={result.chisqr:.12e}\n")
        f.write(f"Reduced_chi_square={result.redchi:.12e}\n")
        f.write(f"Iterations={result.nfev}\n")
        f.write(f"Success={result.success}\n")

    # Write deviations for plotting
    with open("FitDeviations.txt", 'w') as f:
        for r, oz, fz, dev in zip(r_data, z_data, fitted_z, deviations):
            f.write(f"{r:.12e}\t{oz:.12e}\t{fz:.12e}\t{dev:.12e}\n")

    print("SUCCESS: Fitting completed")
    return 0

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"ERROR: {str(e)}")
        sys.exit(1)
