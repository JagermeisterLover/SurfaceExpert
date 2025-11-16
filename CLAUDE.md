# CLAUDE.md - AI Assistant Guide for Optical Surface Analyzer

## Project Overview

**Optical Surface Analyzer** is an Electron-based desktop application for analyzing and visualizing optical surface characteristics. It provides real-time calculation and visualization of optical surface properties including sag, slope, asphericity, and aberration for various surface types used in optical design.

**Tech Stack:**
- **Frontend:** Electron + React (vanilla, no build tools)
- **Visualization:** Plotly.js for 3D surfaces, contours, and cross-sections
- **Architecture:** Multi-process Electron app with IPC communication
- **Language:** Pure JavaScript (no TypeScript, no transpilation)

## Repository Structure

```
SurfaceExpert/
├── .git/                           # Git repository
├── .github/
│   └── copilot-instructions.md    # GitHub Copilot specific instructions
├── .gitignore                      # Git ignore patterns
├── README.md                       # User-facing documentation
├── CLAUDE.md                       # This file - AI assistant guide
├── package.json                    # NPM dependencies and scripts
├── package-lock.json              # Locked dependency versions
├── requirements.txt               # Python dependencies for surface fitter
├── test_irregular.html            # Test suite for Irregular surface calculations
├── various code for claude/
│   └── SurfaceCalculations.cs     # C# reference implementation
└── src/
    ├── main.js                    # Electron main process (~549 lines)
    ├── preload.js                 # Context isolation bridge (~14 lines)
    ├── renderer.js                # React UI application - LEGACY (~3435 lines)
    ├── renderer-modular.js        # Modular React application - CURRENT (~1358 lines)
    ├── calculationsWrapper.js     # Surface calculation engine (~555 lines)
    ├── zmxParser.js               # Zemax ZMX file parser (~341 lines)
    ├── calculations.py            # Python reference implementation (~347 lines)
    ├── surfaceFitter.py           # Surface equation fitter using lmfit (~294 lines)
    ├── index.html                 # Entry point HTML template (loads renderer-modular.js)
    ├── styles.css                 # Global CSS styles (~49 lines)
    ├── components/                # React component modules (14 files)
    │   ├── Icons.js               # SVG icon components
    │   ├── dialogs/               # Dialog components (6 files)
    │   │   ├── ContextMenu.js
    │   │   ├── ConversionDialog.js
    │   │   ├── ConversionResultsDialog.js
    │   │   ├── InputDialog.js
    │   │   ├── SettingsModal.js
    │   │   └── ZMXImportDialog.js
    │   ├── plots/                 # Plot generation components (3 files)
    │   │   ├── Plot2DContour.js
    │   │   ├── Plot3D.js
    │   │   └── PlotCrossSection.js
    │   ├── ui/                    # Reusable UI components (2 files)
    │   │   ├── PropertyRow.js
    │   │   └── PropertySection.js
    │   └── views/                 # View components (2 files)
    │       ├── DataView.js
    │       └── SummaryView.js
    ├── constants/                 # Application constants (1 file)
    │   └── surfaceTypes.js
    └── utils/                     # Utility functions (2 files)
        ├── calculations.js        # Surface calculations with BFS caching
        └── formatters.js          # Value formatting utilities
```

## Architecture Deep Dive

### Electron Multi-Process Architecture

1. **Main Process** (`src/main.js`):
   - Window lifecycle management (create, show, close)
   - Native menu bar creation and event handling
   - IPC event routing to renderer process
   - Development mode support (`--dev` flag)

2. **Preload Script** (`src/preload.js`):
   - Security boundary via `contextBridge`
   - Exposes minimal API: `window.electronAPI.onMenuAction(callback)`
   - Enables IPC communication without exposing Node.js APIs

3. **Renderer Process** (`src/renderer-modular.js`):
   - React application (no JSX, uses `React.createElement`)
   - Modular ES6 architecture with 17 extracted modules
   - State management via React hooks (`useState`, `useEffect`)
   - All UI components and business logic
   - Calculation orchestration
   - Legacy monolithic version (`src/renderer.js`) kept for reference

### Data Flow

```
User Action → Native Menu (main.js)
    ↓ IPC message
React Handler (renderer-modular.js)
    ↓
State Update (setSurfaces)
    ↓
useEffect Triggers
    ↓
Recalculation (utils/calculations.js)
    ↓
Plot Update (components/plots/*.js → Plotly.newPlot)
```

### Modular Architecture (Nov 2025 Refactoring)

The application was refactored from a 3,435-line monolithic `renderer.js` into a modular ES6 architecture:

**Key Benefits:**
- **Maintainability**: Each component has a single responsibility
- **Reusability**: Components can be easily reused across the application
- **Testability**: Isolated modules are easier to unit test
- **Readability**: Smaller, focused files are easier to understand
- **Performance**: ES6 modules enable better tree-shaking and code splitting

**Module Organization:**
1. **Constants** (`src/constants/`): Surface type definitions, sample data, colorscales
2. **Utilities** (`src/utils/`): Pure functions for calculations and formatting
3. **UI Components** (`src/components/ui/`): Reusable UI building blocks
4. **View Components** (`src/components/views/`): Data presentation components
5. **Dialog Components** (`src/components/dialogs/`): Modal dialogs and context menus
6. **Plot Components** (`src/components/plots/`): Plotly visualization generators
7. **Icons** (`src/components/Icons.js`): SVG icon library

**Import Pattern:**
```javascript
// ES6 module imports
import { surfaceTypes, sampleSurfaces } from './constants/surfaceTypes.js';
import { formatValue, degreesToDMS } from './utils/formatters.js';
import { calculateSurfaceValues } from './utils/calculations.js';
import { create3DPlot } from './components/plots/Plot3D.js';

// Global dependencies (loaded via script tags)
// - React, ReactDOM (UMD builds)
// - Plotly (CDN)
// - SurfaceCalculations (calculationsWrapper.js)
// - ZMXParser (zmxParser.js)
```

**Loading Strategy:**
- ES6 modules use `type="module"` in script tag
- Global dependencies loaded first via regular script tags
- `window.load` event ensures all dependencies available before mounting React app
- Prevents race conditions between module execution and global script loading

## Surface Types & Mathematical Models

The application supports 8 surface types, each with unique mathematical formulations:

1. **Sphere**
   - Parameters: Radius, Min Height, Max Height
   - Simple spherical surface (R > 0 = concave, R < 0 = convex)
   - Uses exact formula: z = R - sqrt(R² - r²)

2. **Even Asphere**
   - Parameters: Radius, Conic Constant (k), A4-A20 (even powers)
   - Standard aspheric surface with even polynomial terms
   - Classification: Sphere (k=0), Parabola (k=-1), Ellipsoid (-1<k<0), Hyperbola (k<-1), Oblate Ellipsoid (k>0)

3. **Odd Asphere**
   - Parameters: Radius, Conic Constant, A3-A20 (all powers)
   - Aspheric surface with both odd and even polynomial terms

4. **Zernike**
   - Parameters: Radius, Conic Constant, Extrapolate, Norm Radius, Number of Terms, A2-A16, Decenter X/Y, Z1-Z37, Scan Angle, X/Y Coordinate, Min/Max Height
   - Zernike Standard Sag surface (FZERNSAG in Zemax)
   - Combines base aspheric surface with Zernike polynomial aberrations
   - Uses standard (non-normalized) Zernike polynomials
   - Supports up to 37 Zernike terms

5. **Irregular**
   - Parameters: Radius, Conic Constant, Decenter X/Y, Tilt X/Y, Spherical, Astigmatism, Coma, Angle, Scan Angle, X/Y Coordinate, Min/Max Height
   - IRREGULA surface type from Zemax
   - Combines base conic surface with coordinate transformations and Zernike-like aberrations
   - Tilt convention matches Zemax (negative signs applied internally)

6. **Opal Un U**
   - Parameters: Radius, e2, H, A2-A12, Min Height, Max Height
   - Iterative solution for specialized optical surfaces
   - Uses convergence tolerance 1e-15, max 1M iterations

7. **Opal Un Z**
   - Parameters: Radius, e2, H, A3-A13, Min Height, Max Height
   - Newton-Raphson iterative solver
   - Uses convergence tolerance 1e-12, max 1K iterations

8. **Poly**
   - Parameters: A1-A13, Min Height, Max Height
   - Pure polynomial surface (no base radius)
   - Newton-Raphson iterative solver

### Calculated Metrics

For each surface, the application calculates:

- **Sag (z)**: Surface height as a function of radial position (mm)
- **Slope (dz/dr)**: First derivative of sag (rad)
- **Angle**: Slope converted to degrees
- **Asphericity**: Deviation from best-fit sphere (mm)
- **Aberration of Normals**: Optical aberration metric (mm)
- **Best Fit Sphere**: Radius of optimal fitting sphere using 3-point or 4-point method
- **Paraxial F/#**: R / (2 × maxHeight)
- **Working F/#**: 1 / (2 × maxSlope)

## Key Components & Code Patterns

### Surface State Management

```javascript
// Surface object structure
{
  id: number,              // Unique identifier
  name: string,           // Display name
  type: string,           // One of: 'Sphere', 'Even Asphere', etc.
  color: string,          // Hex color for UI
  parameters: {           // Dynamic based on surface type
    'Radius': string,
    'Min Height': string,
    'Max Height': string,
    // ... type-specific parameters
  }
}
```

**State Update Pattern:**
```javascript
// Always create new arrays/objects for React to detect changes
const updated = surfaces.map(s =>
  s.id === selectedSurface.id
    ? { ...s, parameters: { ...s.parameters, [param]: value } }
    : s
);
setSurfaces(updated);
```

### Calculation Caching Strategy

**Problem:** Best-fit sphere calculations are expensive and used in asphericity calculations for every point.

**Solution:** Cache BFS parameters keyed by serialized surface parameters:
```javascript
const bfsCache = new Map();
const getBestFitSphereParams = (surface) => {
  const cacheKey = JSON.stringify(surface.parameters);
  if (bfsCache.has(cacheKey)) return bfsCache.get(cacheKey);
  // ... calculate and cache
};
```

### Error Handling Philosophy

**Silent Failures:** Mathematical calculations wrapped in try-catch, returning 0 on error:
```javascript
try {
  const result = complexCalculation();
  return result;
} catch {
  return 0;  // Prevents UI crashes from numerical edge cases
}
```

**Rationale:** Optical calculations can hit numerical singularities (r approaching R, division by zero). Returning 0 allows UI to continue functioning and user to adjust parameters.

### Value Formatting

Use `formatValue(value)` helper for consistent display:
- Returns '0' for NaN/Infinity
- Scientific notation for |value| < 1e-7
- 7 decimal places otherwise
- Treats |value| < 1e-10 as zero (floating-point threshold)

### Annular Region Rendering

Surfaces can have inner exclusion zones (Min Height > 0). Grid generation:
```javascript
const r = Math.sqrt(xi * xi + yj * yj);
if (r < minHeight || r > maxHeight) {
  row.push(null);  // Transparent region in plots
} else {
  row.push(calculateValue(r));
}
```

## Development Workflows

### Setup & Running

```bash
# Install dependencies
npm install

# Run in development mode (with DevTools)
npm run dev

# Run in production mode
npm start

# Build distributable packages
npm run build  # Outputs to dist/
```

### Build Configuration

Electron Builder targets in `package.json`:
- **Windows:** NSIS installer
- **macOS:** DMG package
- **Linux:** AppImage

### Debugging Strategies

1. **DevTools Access:**
   - `npm run dev` auto-opens DevTools
   - Or Ctrl+Shift+I in running app
   - View → Toggle Developer Tools menu

2. **IPC Communication:**
   - Menu actions logged in console
   - Check main process console for `mainWindow.webContents.send()` calls
   - Check renderer console for received actions

3. **Calculation Debugging:**
   - Set breakpoints in `SurfaceCalculations` static methods
   - Compare against Python reference in `various code for claude/`
   - Test with known values (e.g., sphere r=10mm, R=100mm → sag ≈ 0.5mm)

4. **Plot Issues:**
   - Check browser console for Plotly errors
   - Verify data arrays don't contain NaN/Infinity
   - Ensure x, y, z arrays have matching dimensions

### Common Development Tasks

#### Adding a New Surface Type

1. **Define parameters** in `src/constants/surfaceTypes.js`:
   ```javascript
   export const surfaceTypes = {
     ...
     'New Surface': ['Radius', 'Param1', 'Param2', 'Min Height', 'Max Height']
   };
   ```

2. **Implement calculations** in `calculationsWrapper.js`:
   ```javascript
   static calculateNewSurfaceSag(r, param1, param2) { ... }
   static calculateNewSurfaceSlope(r, param1, param2) { ... }
   ```

3. **Add to calculation dispatcher** in `src/utils/calculations.js`:
   ```javascript
   export const calculateSurfaceValues = (r, surface, x, y) => {
     ...
     } else if (surface.type === 'New Surface') {
       const p1 = parseParam('Param1'), p2 = parseParam('Param2');
       sag = SurfaceCalculations.calculateNewSurfaceSag(r, p1, p2);
       slope = SurfaceCalculations.calculateNewSurfaceSlope(r, p1, p2);
     }
     ...
   };
   ```

4. **Test** with sample parameters and verify against reference implementation

#### Adding a Menu Item

1. **Define in menu template** (main.js `createMenu()`):
   ```javascript
   {
     label: 'New Action',
     accelerator: 'CmdOrCtrl+K',
     click: () => {
       mainWindow.webContents.send('menu-action', 'new-action');
     }
   }
   ```

2. **Handle in renderer** (`renderer-modular.js` `handleMenuAction()`):
   ```javascript
   case 'new-action':
     performNewAction();
     break;
   ```

#### Modifying UI Layout

- All UI uses `React.createElement()` (no JSX)
- Pass color scheme via `c` prop: `{bg, panel, border, text, textDim, accent, hover}`
- Follow existing component patterns: `PropertySection`, `PropertyRow`
- Maintain dark theme consistency

#### Adding a New Calculation Metric

1. Calculate in `calculateSurfaceValues()` function
2. Add to returned object: `{ sag, slope, asphericity, aberration, newMetric }`
3. Update `generatePlotData()` to handle new metric tab
4. Add tab to main tab list in OpticalSurfaceAnalyzer component
5. Update DataView and SummaryView to display

## Code Style & Conventions

### Naming Conventions

- **Variables:** camelCase (`minHeight`, `maxSlope`, `colorscale`)
- **Functions:** camelCase (`calculateSag`, `updateParameter`)
- **Components:** PascalCase (`SummaryView`, `PropertySection`)
- **Constants:** camelCase object with descriptive names (`surfaceTypes`, `colors`)
- **Units:** Always documented in comments or labels
  - Distances: mm
  - Angles: degrees (°) or radians (rad) - always specify
  - Slopes: radians
  - DMS: degrees/minutes/seconds format

### React Patterns

**No JSX - Use React.createElement:**
```javascript
React.createElement('div',
  { style: { padding: '20px' } },
  React.createElement('h3', null, 'Title'),
  children
)
```

**Hooks Usage:**
- `useState` for component state
- `useEffect` for side effects (plot updates, event listeners)
- `useRef` for DOM references (plot containers)

**State Immutability:**
```javascript
// Always create new objects/arrays
setSurfaces([...surfaces, newSurface]);  // ✓ Good
surfaces.push(newSurface);               // ✗ Bad
```

### File Organization

- **main.js:** Electron-specific, window management, file I/O handlers (~549 lines)
- **preload.js:** Minimal security bridge, no calculations (~14 lines)
- **renderer-modular.js:** Main React application with ES6 imports (~1358 lines) - **CURRENT**
- **renderer.js:** Legacy monolithic version (~3435 lines) - kept for reference
- **components/**: Modular React components organized by type (17 files)
  - `dialogs/`: Modal dialogs and context menus (6 files)
  - `plots/`: Plotly visualization generators (3 files)
  - `ui/`: Reusable UI building blocks (2 files)
  - `views/`: Data presentation components (2 files)
  - `Icons.js`: SVG icon library
- **constants/**: Application configuration and data (1 file)
- **utils/**: Pure utility functions (2 files)
  - `calculations.js`: Surface calculations with BFS caching
  - `formatters.js`: Value formatting utilities
- **calculationsWrapper.js:** Pure mathematical functions for all surface types (~555 lines)
- **zmxParser.js:** Zemax ZMX file parser and converter (~341 lines)
- **calculations.py:** Python reference implementation for validation (~347 lines)
- **surfaceFitter.py:** Surface equation fitter using lmfit library (~294 lines)
- **styles.css:** Global styles only (scrollbars, focus states), prefer inline styles (~49 lines)

## Dependencies & Security

### NPM Dependencies

**Production:**
- `react@18.2.0` - UI framework
- `react-dom@18.2.0` - React DOM rendering
- Plotly.js loaded via CDN (not NPM)

**Development:**
- `electron@28.3.3` - Desktop framework
- `electron-builder@24.9.1` - Build/packaging tool

### Python Dependencies (for surface fitting)

**Required for surface fitting feature:**
- `numpy>=1.21.0` - Numerical computing
- `lmfit>=1.0.3` - Non-linear least-squares minimization and curve fitting

**Security Notes:**
- Context isolation enabled (`contextIsolation: true`)
- Node integration disabled (`nodeIntegration: false`)
- Minimal API exposed via contextBridge
- Content Security Policy allows only Plotly CDN

### External Resources

- React UMD bundles from `node_modules/` (production builds)
- Plotly from CDN: `https://cdn.plot.ly/plotly-2.27.0.min.js`
- CSP in index.html permits: `'self' 'unsafe-inline' 'unsafe-eval' https://cdn.plot.ly`

## Testing Strategy

### Manual Testing Checklist

**Surface Operations:**
- [ ] Add surface → appears in list
- [ ] Remove surface → deleted, selection moves to remaining
- [ ] Switch surface → properties panel updates
- [ ] Change surface type → parameters rebuild correctly
- [ ] Modify parameter → plots update in real-time

**Calculations:**
- [ ] Sphere at r=10mm, R=100mm → sag ≈ 0.5mm
- [ ] Negative radius → convex classification
- [ ] Min Height > 0 → annular region renders correctly
- [ ] Extreme parameters → no crashes (silent fail to 0)

**Visualization:**
- [ ] 3D plot renders and is interactive
- [ ] 2D contour shows color gradient
- [ ] Cross-section is symmetric
- [ ] Data view shows tabular values
- [ ] Settings modal changes colorscale

**Menu/Keyboard:**
- [ ] Ctrl+N, Ctrl+Shift+A, Delete shortcuts work
- [ ] F5 recalculates
- [ ] Ctrl+, opens settings

### Unit Testing (Future)

Currently no automated tests. To add:
1. Install Jest or Vitest
2. Test `SurfaceCalculations` methods with known inputs/outputs
3. Test React components with Testing Library
4. Mock Plotly for plot component tests

## Git Workflow & Conventions

### Branch Strategy

- `main` - Production-ready code
- `claude/*` - AI assistant development branches (auto-created)
- Feature branches - Named descriptively (e.g., `feature/save-load`, `fix/asphericity-calc`)

### Commit Messages

Follow existing pattern from git log:
- Descriptive present tense: "Add feature" not "Added feature"
- Reference issue numbers if applicable
- Examples:
  - "Refactor menu actions and add settings modal with color scale options"
  - "Fix asphericity calculation for annular surfaces"
  - "Update documentation for new surface type"

### Pushing Changes

Always push to feature branches, never directly to main:
```bash
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "Descriptive message"
git push -u origin feature/my-feature
```

## Common Issues & Solutions

### Issue: Plot not updating after parameter change

**Cause:** React not detecting state change
**Solution:** Ensure new object/array created in setState:
```javascript
// Wrong:
surface.parameters[param] = value;
setSurfaces(surfaces);

// Correct:
const updated = surfaces.map(s =>
  s.id === id ? { ...s, parameters: { ...s.parameters, [param]: value } } : s
);
setSurfaces(updated);
```

### Issue: NaN or Infinity in plots

**Cause:** Numerical singularity (r → R, division by zero)
**Solution:** Check try-catch in calculations, verify parameters are reasonable

### Issue: Slow rendering on parameter change

**Cause:** Too many plot updates or missing memoization
**Solution:**
- Verify BFS caching is working
- Consider debouncing parameter updates
- Check grid size (60×60 for 3D, 100×100 for 2D)

### Issue: Menu actions not working

**Cause:** IPC communication broken
**Solution:**
1. Check main process menu definition
2. Verify preload script exposes API
3. Check renderer useEffect registers listener
4. Look for typos in action string

## Performance Considerations

### Plot Grid Sizes

- **3D plots:** 60×60 grid (3600 calculations)
- **2D contour:** 100×100 grid (10,000 calculations)
- **Cross-section:** 100 points (100 calculations)
- **Data view:** 30 samples
- **Summary view:** 20 samples

**Optimization opportunities:**
- Reduce grid size for complex surface types
- Implement Web Workers for calculations
- Debounce parameter changes before recalculating

### Caching Strategy

Current cache: Best-fit sphere parameters (Map with JSON key)
**Future caching opportunities:**
- Full surface grid results
- Plotly layout objects
- Parameter validation results

## Recent Development History

### Implemented Features (2025-11)

1. **ZMX File Import:**
   - Full Zemax ZMX file parser (`zmxParser.js`)
   - Supports STANDARD, EVENASPH, ODDASPHE, IRREGULA, FZERNSAG surface types
   - Automatic conversion to application surface format
   - Import dialog with surface selection

2. **Folder Organization:**
   - Hierarchical folder structure for organizing surfaces
   - Persistent storage in `surfaces/` directory
   - Context menus for folder/surface operations
   - Expand/collapse folder tree

3. **Surface Fitting:**
   - Python-based surface equation fitter using lmfit
   - Supports Even Asphere, Odd Asphere, Opal Universal U/Z
   - Fit metrics: RMSE, R², AIC, BIC, Chi-square
   - Deviation analysis and plotting

4. **New Surface Types:**
   - Zernike surfaces (FZERNSAG) with up to 37 terms
   - Irregular surfaces (IRREGULA) with aberration terms
   - Both imported from ZMX or created manually

5. **Bug Fixes:**
   - Fixed Irregular surface tilt sign convention to match Zemax
   - Fixed Zernike polynomial equations to use standard formulas
   - Removed shape classification feature (deprecated)

### Future Development Roadmap

1. **Surface Operations:**
   - Duplicate surface (Ctrl+D) - menu exists, not implemented
   - Surface comparison view
   - Undo/Redo support

2. **Advanced Calculations:**
   - Additional optical metrics
   - Multi-surface systems
   - Tolerance analysis
   - Ray tracing integration

3. **UI Enhancements:**
   - Plot export (PNG, SVG)
   - Print/report generation
   - Keyboard navigation improvements

4. **Code Quality:**
   - ✅ ~~Split renderer.js into separate component files~~ **COMPLETED (Nov 2025)**
   - Add TypeScript for type safety
   - Implement automated testing
   - Add PropTypes or TypeScript interfaces for component props

### Technical Debt

1. **✅ RESOLVED - Code organization (Nov 2025):**
   - ~~renderer.js 3435 lines - MUST SPLIT~~ → **COMPLETED!**
   - Successfully refactored into 17 modular ES6 files
   - New structure: `components/` (14 files), `utils/` (2 files), `constants/` (1 file)
   - Main file reduced from 3435 → 1358 lines (60% reduction)
   - Legacy `renderer.js` kept for reference
   - See "Modular Architecture" section above for details

2. **Build modernization:**
   - Consider Vite or esbuild for faster dev/build
   - TypeScript for type safety (would require refactoring React.createElement → JSX)
   - JSX for more readable components (would require build tooling)

3. **Testing:**
   - Add unit tests for calculations (test_irregular.html exists but limited)
   - Add integration tests for UI components
   - Visual regression tests for plots
   - Automated test suite for all surface types
   - Test ES6 module imports and dependencies

4. **Documentation:**
   - API documentation for SurfaceCalculations
   - API documentation for modular components
   - User guide with examples
   - Video tutorials
   - ZMX import documentation

## AI Assistant Guidelines

### When Making Changes

1. **Read before writing:** Always read the relevant source files first
2. **Test calculations:** Verify mathematical correctness with known values
3. **Maintain style:** Follow existing React.createElement patterns, no JSX
4. **Preserve dark theme:** Use color constants from `c` object
5. **Handle errors:** Wrap numerical code in try-catch, return 0 on failure
6. **Update state immutably:** Always create new objects/arrays
7. **Document units:** Always specify units in comments and labels

### When Debugging

1. Check browser DevTools console first
2. Verify IPC communication in main process console
3. Test with simple surface (sphere) before complex ones
4. Compare calculations against Python reference if available
5. Check for NaN/Infinity in calculation results

### When Adding Features

1. Check if menu item already exists (may just need implementation)
2. Follow existing patterns for similar features
3. Update both calculation and UI layers
4. Test with multiple surface types
5. Consider performance impact on grid calculations

### When Refactoring

1. Keep main.js minimal (Electron-specific only)
2. Keep calculations pure (no side effects)
3. Maintain backward compatibility with existing surfaces
4. Document breaking changes clearly
5. Test all surface types after refactoring

## Quick Reference

### Key Files by Task

- **UI Changes:**
  - **Components:** `src/components/` (dialogs, plots, ui, views) - Modular React components
  - **Main App:** `src/renderer-modular.js` - Application orchestration
  - **Styles:** `src/styles.css` - Global styles only
  - **Constants:** `src/constants/surfaceTypes.js` - Surface type definitions
- **Calculations:**
  - **JavaScript:** `src/calculationsWrapper.js` (SurfaceCalculations class)
  - **Utilities:** `src/utils/calculations.js` (surface value calculator with BFS caching)
  - **Python Reference:** `src/calculations.py` (validation/testing)
- **Formatting:** `src/utils/formatters.js` (formatValue, degreesToDMS)
- **ZMX Import:** `src/zmxParser.js` + `src/components/dialogs/ZMXImportDialog.js`
- **Surface Fitting:** `src/surfaceFitter.py` (requires `requirements.txt` dependencies)
- **Menu/IPC:** `src/main.js` + `src/preload.js`
- **File I/O:** `src/main.js` (handles folder loading/saving to `surfaces/` directory)
- **Build Config:** `package.json` (electron-builder section)
- **Testing:** `test_irregular.html` (manual test suite for Irregular surfaces)
- **Documentation:** `README.md` (users), `CLAUDE.md` (AI), `.github/copilot-instructions.md` (Copilot)

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+N | New Surface |
| Ctrl+Shift+A | Add Surface |
| Delete | Remove Surface |
| Ctrl+D | Duplicate Surface (not implemented) |
| F5 | Recalculate All |
| Ctrl+S | Save (not implemented) |
| Ctrl+Shift+S | Save As (not implemented) |
| Ctrl+, | Settings |
| Ctrl+Shift+I | Toggle DevTools |

### Color Scheme

```javascript
{
  bg: '#2b2b2b',        // Main background
  panel: '#353535',     // Panel background
  border: '#454545',    // Borders
  text: '#e0e0e0',      // Primary text
  textDim: '#a0a0a0',   // Secondary text
  accent: '#4a90e2',    // Accent color
  hover: '#454545'      // Hover state
}
```

### Useful Code Snippets

**Parse parameter safely:**
```javascript
const parseParam = (name) => parseFloat(surface.parameters[name]) || 0;
```

**Update surface parameter:**
```javascript
const updated = surfaces.map(s =>
  s.id === selectedSurface.id
    ? { ...s, parameters: { ...s.parameters, [param]: value } }
    : s
);
setSurfaces(updated);
```

**Calculate surface values:**
```javascript
const values = calculateSurfaceValues(r, surface);
// Returns: {sag, slope, asphericity, aberration, angle}
```

**Format for display:**
```javascript
const formatted = formatValue(numericValue);  // Handles NaN, scientific notation
const dms = degreesToDMS(angleInDegrees);    // Converts to °'"
```

## ZMX File Import

### Supported Zemax Surface Types

The ZMX parser (`zmxParser.js`) supports the following Zemax surface types:

1. **STANDARD** → Converts to Even Asphere (base sphere with k=0)
2. **EVENASPH** → Converts to Even Asphere
3. **ODDASPHE** → Converts to Odd Asphere
4. **IRREGULA** → Converts to Irregular surface
5. **FZERNSAG** → Converts to Zernike surface

### ZMX Parameter Mapping

**EVENASPH:**
- PARM 1: Conic constant (use CONI field instead)
- PARM 2: A2 (not supported, ignored)
- PARM 3: A4, PARM 4: A6, etc.

**ODDASPHE:**
- PARM 1: A1 (ignored)
- PARM 2: A2 (ignored)
- PARM 3: A3, PARM 4: A4, etc.

**IRREGULA:**
- PARM 1-2: Decenter X/Y
- PARM 3-4: Tilt X/Y
- PARM 5-7: Spherical, Astigmatism, Coma
- PARM 8: Angle

**FZERNSAG:**
- PARM 0: Extrapolate flag
- PARM 1-8: A2, A4, A6, A8, A10, A12, A14, A16
- PARM 9-10: Decenter X/Y
- XDAT 1: Number of Zernike terms
- XDAT 2: Normalization radius
- XDAT 3-39: Z1-Z37 (Zernike coefficients)

### Usage Workflow

1. User: File → Import ZMX File
2. Select ZMX file via file dialog
3. Parser extracts all SURF entries
4. Dialog shows list of surfaces with type/radius/diameter
5. User selects surfaces to import
6. Surfaces added to current folder with auto-generated colors

## Surface Fitting

### Python-Based Fitting Engine

The application includes a Python-based surface fitter (`surfaceFitter.py`) that uses the `lmfit` library for non-linear least-squares optimization.

### Supported Fitting Modes

1. **Even Asphere** - Fits radius, conic constant, and even polynomial coefficients
2. **Odd Asphere** - Fits radius, conic constant, and all polynomial coefficients
3. **Opal Universal U** - Fits e2 parameter and polynomial coefficients
4. **Opal Universal Z** - Fits e2 parameter and polynomial coefficients
5. **Opal Polynomial** - Fits polynomial coefficients

### Fitting Process

1. User provides (r, z) data points in `tempsurfacedata.txt`
2. Settings file `ConvertSettings.txt` specifies:
   - Surface type
   - Fixed parameters (radius, H, conic)
   - Variable parameters (e2, conic)
   - Number of polynomial terms
   - Optimization algorithm
3. Python script runs optimization
4. Results saved to:
   - `FitReport.txt` - Fitted parameters
   - `FitMetrics.txt` - RMSE, R², AIC, BIC, etc.
   - `FitDeviations.txt` - Point-by-point deviations

### Optimization Algorithms

Supported algorithms from lmfit:
- `leastsq` - Levenberg-Marquardt (default)
- `least_squares` - Trust Region Reflective
- Other lmfit methods (nelder, powell, etc.)

---

**Last Updated:** 2025-11-16
**Version:** 2.1.0 (Modular Architecture Release)
**Major Changes:**
- Refactored from monolithic 3,435-line renderer.js to modular ES6 architecture
- 17 extracted modules organized in components/, utils/, constants/
- 60% reduction in main file size (3435 → 1358 lines)
- Improved maintainability, testability, and code organization

**Maintained by:** AI Assistants working with this codebase
