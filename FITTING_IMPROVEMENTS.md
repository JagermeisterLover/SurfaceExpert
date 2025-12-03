# Polynomial Fitting Improvements

## The Problem: Ill-Conditioned Polynomial Fitting

When fitting high-order polynomials like the **Poly** surface, you often encounter numerical conditioning problems:

### Symptoms:
- Adding more polynomial terms doesn't improve the fit
- Extra coefficients get tiny values (1e-300) that don't contribute
- Fit quality plateaus no matter how many terms you add
- Optimization struggles to converge

### Root Cause:
The Poly surface equation is:
```
z * (A1*z + A2*z² + A3*z³ + ... + A13*z¹³) = r²
```

When r and z are in the 10-50mm range:
- **r¹³** can reach **10¹³** or more
- Higher powers of z become astronomically large
- The coefficient matrix becomes ill-conditioned (nearly singular)
- Small numerical errors get amplified dramatically
- Optimizer can't find meaningful coefficient values

This is a classic problem in numerical analysis called **polynomial ill-conditioning**.

## The Solution: Internal Normalization

### Your Discovery
You discovered that using a larger normalization factor **H** (10, 100, etc.) in Opal UnZ and Opal UnU surfaces dramatically improves fitting. This works because it rescales the polynomial to work with normalized variables in the range [0, 1] instead of [0, 50].

### Implementation
I've added a new **Poly fitting mode (SurfaceType=6)** that uses internal normalization automatically:

1. **During Fitting**: Uses H_internal to normalize z → w = z/H
   - Keeps all polynomial terms in similar numerical range
   - Improves matrix conditioning
   - Optimizer can find meaningful coefficients

2. **After Fitting**: Automatically rescales coefficients back to H=1
   - You get standard Poly coefficients
   - No manual conversion needed
   - Direct compatibility with your application

### Mathematical Details

**Normalized Equation:**
```
P(z) = z * Q(z/H) = A1*z + A2*z²/H + A3*z³/H² + ... = r²
```

**Coefficient Rescaling:**
```
A_standard[1] = A_fitted[1]         (no rescaling)
A_standard[2] = A_fitted[2] / H
A_standard[3] = A_fitted[3] / H²
A_standard[i] = A_fitted[i] / H^(i-1)
```

## Usage

### Option 1: Automatic H (Recommended)

Create `ConvertSettings.txt`:
```
SurfaceType=6
Radius=0
TermNumber=10
OptimizationAlgorithm=leastsq
```

The fitter automatically calculates optimal H_internal from your data range.

### Option 2: Manual H Override

If you want to specify H_internal manually:
```
SurfaceType=6
Radius=0
H_internal=10.0
TermNumber=10
OptimizationAlgorithm=leastsq
```

### Example Output

**FitReport.txt:**
```
Type=Poly
# Fitted with internal H=12.345678, rescaled to H=1
A1=1.234567890123e-02
A2=5.678901234567e-04
A3=9.876543210987e-06
...
```

The coefficients are automatically rescaled and ready to use in your application!

## Alternative Solutions

If you still have fitting issues, try these complementary approaches:

### 1. Data Preprocessing
```python
# Scale your data to [0, 1] range before fitting
r_scaled = r_data / r_data.max()
z_scaled = z_data / z_data.max()
# ... fit with scaled data
# ... rescale coefficients back
```

### 2. Regularization (L2/Ridge)
Add penalty for large coefficients in lmfit:
```python
def objective_regularized(params, r, z, alpha=1e-6):
    model = poly_surface(r, H, *coeffs)
    residual = model - z
    # Add L2 penalty
    penalty = alpha * sum(p.value**2 for p in params.values())
    return np.append(residual, np.sqrt(penalty))
```

### 3. Sequential Fitting
Start with low-order terms, progressively add higher orders:
```python
# Fit A1-A5 first
# Then fit A1-A8 using previous result as initial guess
# Then fit A1-A10, etc.
```

### 4. Orthogonal Polynomials
Instead of monomials (z, z², z³), use Chebyshev or Legendre polynomials which are orthogonal and numerically stable. (Requires more extensive code changes)

## Why Internal Normalization is Best

✅ **Simple**: No manual coefficient conversion needed
✅ **Automatic**: Optimal H calculated from data
✅ **Transparent**: Same surface representation
✅ **Effective**: Dramatically improves conditioning
✅ **Compatible**: Output works directly in your app

This is the same trick used in numerical methods like finite element analysis where coordinate transformations improve matrix conditioning.

## Testing Your Fits

After fitting, verify quality by:

1. Check **RMSE** in `FitMetrics.txt` (should be small)
2. Check **R²** value (should be close to 1.0)
3. Check **coefficient magnitudes** (should be reasonable, not 1e-300)
4. Plot deviations from `FitDeviations.txt` (should be random, not systematic)

Example good fit:
```
RMSE=1.234567e-06
R_squared=0.999999
```

Example bad fit (before fix):
```
RMSE=5.678901e-02
R_squared=0.850000
# Many coefficients near 1e-300
```

## References

This numerical issue is well-documented in numerical analysis:

- **Ill-conditioning**: Small changes in input cause large changes in output
- **Condition Number**: Ratio of largest to smallest singular value
- **Polynomial Basis**: Standard monomials are poorly conditioned
- **Orthogonal Polynomials**: Chebyshev, Legendre are numerically stable
- **Preconditioning**: Transforming problem to improve conditioning

Your intuition about normalization was exactly right!

---

**Last Updated**: 2025-12-03
**Version**: 1.0
**Author**: AI Assistant
