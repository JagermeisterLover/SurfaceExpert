# Extracted C# Methods Analysis for JavaScript/Electron Implementation

## 1. buttonNormalizeUnZ_Click - Opal UnZ Surface Normalization

### Purpose
This method normalizes the Opal UnZ surface coefficients to a new H value. It scales all polynomial coefficients (A3 through A13) based on the ratio between the desired normalization value and the current H value.

### Algorithm

**Input validation:**
- Parse normalization value (must be > 0)
- Parse current H value (must be > 0)
- Check if H already equals normalization value (skip if equal)

**Normalization process:**
- Calculate ratio: `ratio = normalizationValue / currentH`
- For each coefficient A_n (where n = 3 to 13):
  - Calculate scaling factor: `factor = ratio^n`
  - Apply transformation: `newA_n = currentA_n × factor`
  - Update the coefficient textbox with the new value

**Final step:**
- Update H to the normalization value

### Mathematical Formula
```
For each coefficient A_n where n ∈ {3, 4, 5, ..., 13}:
    factor = (normalizationValue / currentH)^n
    A_n_new = A_n_old × factor
```

### JavaScript Implementation Example
```javascript
function normalizeUnZ(normalizationValue, currentH, coefficients) {
    // Validate inputs
    if (normalizationValue <= 0) {
        throw new Error("Normalization value must be positive");
    }
    if (currentH <= 0) {
        throw new Error("Current H value must be positive");
    }
    if (currentH === normalizationValue) {
        return { coefficients, H: currentH, message: "H already equals normalization value" };
    }

    // Calculate ratio
    const ratio = normalizationValue / currentH;
    
    // Normalize coefficients A3 to A13
    const normalizedCoeffs = {};
    for (let n = 3; n <= 13; n++) {
        const key = `A${n}`;
        const factor = Math.pow(ratio, n);
        normalizedCoeffs[key] = coefficients[key] * factor;
    }
    
    return {
        coefficients: normalizedCoeffs,
        H: normalizationValue,
        message: "Coefficients normalized successfully"
    };
}
```

---

## 2. pictureBoxChangeSign_Click - Sign Change of Surface Parameters

### Purpose
This method inverts the sign (positive ↔ negative) of surface parameters for different surface types. The behavior depends on which panel is currently visible.

### Logic by Surface Type

#### Even Asphere (panelEvenAsphere)
Changes sign of:
- Radius (R)
- All even coefficients: A4, A6, A8, A10, A12, A14, A16, A18, A20

#### Odd Asphere (panelOddAsphere)
Changes sign of:
- Radius (R)
- All coefficients: A3, A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16, A17, A18, A19, A20

#### Opal UnU Surface (panelOpalUnU)
Changes sign of:
- Radius (R)
- All coefficients: A2, A3, A4, A5, A6, A7, A8, A9, A10, A11, A12

#### Opal UnZ Surface (panelOpalUnZ)
Changes sign of:
- Radius (R)
- **Only even coefficients**: A4, A6, A8, A10, A12
- **Note:** Odd coefficients (A3, A5, A7, A9, A11, A13) are NOT changed!

#### Poly Surface (panelPoly)
Changes sign of:
- **Only odd coefficients**: A1, A3, A5, A7, A9, A11, A13
- **Note:** Even coefficients are NOT changed!

### Helper Function
The C# code uses a nested helper function that:
1. Attempts to parse the value with CurrentCulture (handles locale-specific formats)
2. Falls back to InvariantCulture if needed
3. Negates the value: `value = -value`
4. Converts back to string preserving the original culture format

### JavaScript Implementation Example
```javascript
function changeSign(value) {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
        return value; // Return original if not a number
    }
    return (-numValue).toString();
}

function changeSurfaceSigns(surfaceType, parameters) {
    const result = { ...parameters };
    
    switch(surfaceType) {
        case 'evenAsphere':
            result.radius = changeSign(result.radius);
            [4, 6, 8, 10, 12, 14, 16, 18, 20].forEach(n => {
                result[`A${n}`] = changeSign(result[`A${n}`]);
            });
            break;
            
        case 'oddAsphere':
            result.radius = changeSign(result.radius);
            for (let n = 3; n <= 20; n++) {
                result[`A${n}`] = changeSign(result[`A${n}`]);
            }
            break;
            
        case 'opalUnU':
            result.radius = changeSign(result.radius);
            for (let n = 2; n <= 12; n++) {
                result[`A${n}`] = changeSign(result[`A${n}`]);
            }
            break;
            
        case 'opalUnZ':
            result.radius = changeSign(result.radius);
            // Only even coefficients
            [4, 6, 8, 10, 12].forEach(n => {
                result[`A${n}`] = changeSign(result[`A${n}`]);
            });
            break;
            
        case 'poly':
            // Only odd coefficients
            [1, 3, 5, 7, 9, 11, 13].forEach(n => {
                result[`A${n}`] = changeSign(result[`A${n}`]);
            });
            break;
    }
    
    return result;
}
```

---

## 3. buttonConvertToUnZ_Click - Convert Poly to Opal UnZ

### Purpose
Converts polynomial surface representation (Poly) to Opal UnZ surface representation.

### Conversion Algorithm

**Step 1: Parse Poly coefficients**
- Extract A1 value (which contains 2R)
- Calculate R: `R = A1 / 2`
- Set H = 1.0 (standard for this conversion)
- Parse coefficients A3 through A13

**Step 2: Convert coefficients**
For each coefficient A_n where n ≥ 3:
```
A_n^(UnZ) = -(H^n / (2R)) × A_n^(Poly)
```

With H = 1, this simplifies to:
```
A_n^(UnZ) = -(1 / (2R)) × A_n^(Poly)
```

**Step 3: Convert A2 coefficient**
```
UnZ_e2 = Poly_A2 + 1
```

**Step 4: Update UI**
- Switch from Poly panel to UnZ panel
- Set H = 1
- Set Radius = R
- Update all converted coefficients A3-A13
- Update e2 value

### JavaScript Implementation Example
```javascript
function convertPolyToUnZ(polyParams) {
    // Step 1: Parse input
    const polyA1 = parseFloat(polyParams.A1);
    const R = polyA1 / 2.0;
    const H = 1.0;
    
    // Step 2: Convert coefficients A3-A13
    const unzCoeffs = {};
    for (let n = 3; n <= 13; n++) {
        const polyA_n = parseFloat(polyParams[`A${n}`]);
        unzCoeffs[`A${n}`] = -(Math.pow(H, n) / (2 * R)) * polyA_n;
    }
    
    // Step 3: Convert A2
    const polyA2 = parseFloat(polyParams.A2);
    const unZ_e2 = polyA2 + 1;
    
    // Return converted parameters
    return {
        H: H,
        radius: R,
        e2: unZ_e2,
        ...unzCoeffs
    };
}
```

---

## 4. buttonConvertToPoly_Click - Convert Opal UnZ to Poly

### Purpose
Converts Opal UnZ surface representation back to polynomial (Poly) surface representation. This is the inverse of the previous conversion.

### Conversion Algorithm

**Step 1: Parse UnZ parameters**
- Extract R (radius)
- Extract H (must be > 0)
- Parse coefficients A3 through A13
- Parse e2 value

**Step 2: Convert coefficients**
For each coefficient A_n where n ≥ 3:
```
A_n^(Poly) = -(2R / H^n) × A_n^(UnZ)
```

**Step 3: Convert e2 to A2**
```
Poly_A2 = UnZ_e2 - 1
```

**Step 4: Update UI**
- Switch from UnZ panel to Poly panel
- Set A1 = 2R
- Set A2 from converted e2
- Update all converted coefficients A3-A13

### JavaScript Implementation Example
```javascript
function convertUnZToPoly(unzParams) {
    // Step 1: Parse input
    const R = parseFloat(unzParams.radius);
    const H = parseFloat(unzParams.H);
    
    if (H <= 0) {
        throw new Error("H must be positive");
    }
    
    // Step 2: Convert coefficients A3-A13
    const polyCoeffs = {};
    for (let n = 3; n <= 13; n++) {
        const unzA_n = parseFloat(unzParams[`A${n}`]);
        polyCoeffs[`A${n}`] = -(2 * R / Math.pow(H, n)) * unzA_n;
    }
    
    // Step 3: Convert e2 to A2
    const unZ_e2 = parseFloat(unzParams.e2);
    const polyA2 = unZ_e2 - 1;
    
    // Return converted parameters
    return {
        A1: 2 * R,
        A2: polyA2,
        ...polyCoeffs
    };
}
```

---

## Mathematical Relationship Summary

### Poly ↔ UnZ Conversion Formulas

**Poly to UnZ (with H = 1):**
```
R_UnZ = A1_Poly / 2
H_UnZ = 1
A_n_UnZ = -(1 / (2R)) × A_n_Poly    for n ≥ 3
e2_UnZ = A2_Poly + 1
```

**UnZ to Poly:**
```
A1_Poly = 2 × R_UnZ
A_n_Poly = -(2R / H^n) × A_n_UnZ    for n ≥ 3
A2_Poly = e2_UnZ - 1
```

**These are inverse operations:**
```
If: UnZ = ConvertPolyToUnZ(Poly)
Then: Poly = ConvertUnZToPoly(UnZ)
```

---

## Implementation Notes for JavaScript/Electron

### Number Formatting
The C# code uses `CultureInfo.InvariantCulture` for consistent number formatting with decimal points (not commas). In JavaScript:
```javascript
// Format number to 15 decimal places like C# "0.###############"
function formatNumber(num) {
    return num.toPrecision(15);
}
```

### Error Handling
All methods include try-catch blocks for parsing errors. In JavaScript:
```javascript
function parseInput(value) {
    const num = parseFloat(value);
    if (isNaN(num)) {
        throw new Error(`Invalid number: ${value}`);
    }
    return num;
}
```

### UI Updates
The C# code directly updates TextBox controls. In Electron/React, you'll use state management:
```javascript
// React example
const [unzParams, setUnzParams] = useState({
    H: 1,
    radius: 0,
    A3: 0,
    // ... etc
});

// Update after conversion
setUnzParams(convertPolyToUnZ(polyParams));
```

### Validation
All methods validate inputs before processing:
- Check for positive values where required (H, normalization value)
- Parse all inputs before starting calculations
- Return early with error messages if validation fails
