# Version 2.8.0 - Polynomial Fitting Improvements

**Release Date**: 2025-12-03

## Major New Feature: Poly Surface with Internal Normalization

### Problem Solved
High-order polynomial fitting often suffered from severe numerical ill-conditioning:
- Adding more terms didn't improve fit quality
- Extra coefficients got insignificant values (1e-300)
- Optimizer struggled with poor matrix conditioning
- Fit quality plateaued regardless of term count

### Solution Implemented
Added new **Poly fitting mode (SurfaceType=6)** with automatic internal normalization:

1. **Automatic H Calculation**: Optimal normalization factor computed from data range
2. **Improved Conditioning**: Rescales polynomial basis to numerical range [0, 1]
3. **Transparent Rescaling**: Automatically converts coefficients back to standard form (H=1)
4. **Better Convergence**: Dramatically improved optimization stability
5. **Meaningful Coefficients**: All terms contribute significantly to fit

### Technical Details

**Mathematical Approach:**
```
Normalized fitting:  P(z) = z*Q(z/H) = A1*z + A2*z²/H + A3*z³/H² + ...
Coefficient rescaling: A_std[i] = A_fit[i] / H^(i-1)
```

**Benefits:**
- ✅ Prevents numerical overflow in high powers (z¹³)
- ✅ Keeps all matrix columns in similar magnitude
- ✅ Enables optimizer to find meaningful coefficient values
- ✅ Matches your discovered workaround for OpalUnZ/OpalUnU
- ✅ Fully automatic - no manual conversion needed

### Files Modified

**Core Changes:**
- `src/surfaceFitter.py` (+152 lines)
  - Added `poly_surface()` function with H normalization
  - Added `rescale_poly_coefficients()` helper
  - Added SurfaceType=6 fitting case
  - Automatic H_internal calculation from data
  - Coefficient rescaling in report generation

**Version Updates:**
- `package.json`: 2.7.9 → 2.8.0
- `package-lock.json`: 2.7.9 → 2.8.0

**Documentation:**
- `FITTING_IMPROVEMENTS.md` (new): Comprehensive explanation of the problem and solution
- `ConvertSettings_Poly_Example.txt` (new): Example configuration file
- `CHANGELOG_v2.8.0.md` (this file): Release notes

### Usage Example

**ConvertSettings.txt:**
```
SurfaceType=6
Radius=0
TermNumber=10
OptimizationAlgorithm=leastsq
```

**Output (FitReport.txt):**
```
Type=Poly
# Fitted with internal H=12.345678, rescaled to H=1
A1=1.234567890123e-02
A2=5.678901234567e-04
A3=9.876543210987e-06
...
```

Coefficients are ready to use directly in SurfaceExpert application!

### Backwards Compatibility

All existing surface types (1-5) remain unchanged:
- SurfaceType=1: Even Asphere
- SurfaceType=2: Odd Asphere
- SurfaceType=3: Opal Universal Z
- SurfaceType=4: Opal Universal U
- SurfaceType=5: Opal Polynomial
- SurfaceType=6: **Poly with normalization (NEW!)**

### Alternative Approaches Considered

1. **Orthogonal Polynomials**: Chebyshev/Legendre (requires extensive changes)
2. **Data Preprocessing**: Manual scaling (user burden)
3. **Regularization**: L2 penalty (helps but doesn't solve root cause)
4. **Sequential Fitting**: Progressive term addition (slower, still ill-conditioned)

**Selected Approach**: Internal normalization
- Most effective for this specific problem
- Transparent to user
- Automatic coefficient conversion
- Matches your successful OpalUnZ/OpalUnU workflow

### Testing Recommendations

After fitting, verify quality:

1. **RMSE**: Should be very small (< 1e-6 for good fit)
2. **R²**: Should be close to 1.0 (> 0.999)
3. **Coefficients**: Should have reasonable magnitudes (not 1e-300)
4. **Deviations**: Plot should show random scatter, not systematic pattern
5. **Convergence**: Should reach solution in < 1000 iterations

### Known Limitations

- Only applicable to Poly surface fitting
- Requires numpy and lmfit dependencies
- H_internal can be manually overridden if automatic calculation is suboptimal
- For extremely ill-conditioned problems, may need to combine with regularization

### Future Enhancements

Potential improvements for consideration:
- Add H normalization to other surface types
- Implement orthogonal polynomial basis
- Add automatic term selection (AIC/BIC-based)
- GUI for fitting workflow
- Batch fitting for multiple surfaces

### Credits

Solution inspired by user's discovery that larger H values improve OpalUnZ/OpalUnU fitting. This insight led to implementing automatic internal normalization for Poly surfaces with transparent coefficient rescaling.

---

**For detailed mathematical explanation, see:** `FITTING_IMPROVEMENTS.md`
**For usage examples, see:** `ConvertSettings_Poly_Example.txt`

**Questions or issues?** Report at: https://github.com/JagermeisterLover/SurfaceExpert/issues
