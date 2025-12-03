# CLAUDE.md - AI Assistant Guide for SurfaceExpert

## Project Overview

**SurfaceExpert** is an Electron-based desktop application for analyzing and visualizing optical surface characteristics. It provides real-time calculation and visualization of optical surface properties including sag, slope, asphericity, and aberration for various surface types used in optical design.

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
├── test_precision.js              # Precision testing for surface calculations
├── test_zemax_comparison.js       # Zemax comparison tests with exact parameters
├── various code for claude/
│   └── SurfaceCalculations.cs     # C# reference implementation
└── src/
    ├── main.js                    # Electron main process (~567 lines)
    ├── preload.js                 # Context isolation bridge (~14 lines)
    ├── renderer-modular.js        # Modular React application (~984 lines) ⚡ 49% reduction!
    ├── calculationsWrapper.js     # Surface calculation engine (~806 lines)
    ├── zmxParser.js               # Zemax ZMX file parser (~341 lines)
    ├── calculations.py            # Python reference implementation (~347 lines)
    ├── surfaceFitter.py           # Surface equation fitter using lmfit (~294 lines)
    ├── index.html                 # Entry point HTML template (loads renderer-modular.js)
    ├── styles.css                 # Global CSS styles (~49 lines)
    ├── components/                # React component modules (23 files)
    │   ├── Icons.js               # SVG icon components
    │   ├── TitleBar.js            # Custom window title bar with controls (~172 lines)
    │   ├── MenuBar.js             # Modern custom menu bar (~234 lines)
    │   ├── dialogs/               # Dialog components (8 files)
    │   │   ├── AboutDialog.js     # About dialog with version info
    │   │   ├── ContextMenu.js
    │   │   ├── ConversionDialog.js
    │   │   ├── ConversionResultsDialog.js
    │   │   ├── InputDialog.js
    │   │   ├── NormalizeUnZDialog.js  # Normalize Opal Un Z surfaces
    │   │   ├── SettingsModal.js
    │   │   └── ZMXImportDialog.js
    │   ├── panels/                # Major layout panels (3 files) 🆕
    │   │   ├── PropertiesPanel.js    # Right sidebar - properties/metrics (~370 lines)
    │   │   ├── SurfacesPanel.js      # Left sidebar - folder tree (~225 lines)
    │   │   └── VisualizationPanel.js # Center - tabs/plots/data (~133 lines)
    │   ├── plots/                 # Plot generation components (3 files)
    │   │   ├── Plot2DHeatmap.js   # 2D heatmap visualization
    │   │   ├── Plot3D.js
    │   │   └── PlotCrossSection.js
    │   ├── ui/                    # Reusable UI components (4 files)
    │   │   ├── DebouncedInput.js  # Debounced input to prevent freezing (~92 lines)
    │   │   ├── PropertyRow.js     # Single parameter row display (~33 lines)
    │   │   ├── PropertySection.js # Grouped parameter section (~19 lines)
    │   │   └── SurfaceActionButtons.js  # Surface action buttons (~102 lines)
    │   └── views/                 # View components (2 files)
    │       ├── DataView.js
    │       └── SummaryView.js
    ├── constants/                 # Application constants (3 files)
    │   ├── colorscales.js         # Plotly.js colorscale names
    │   ├── colorPalettes.js       # UI color theme definitions
    │   └── surfaceTypes.js        # Surface type and parameter definitions
    └── utils/                     # Utility functions (8 files)
        ├── calculations.js        # Surface calculations with BFS caching, RMS/P-V (~386 lines)
        ├── dataSanitization.js    # Data sanitization utilities
        ├── formatters.js          # Value formatting utilities
        ├── reportGenerator.js     # HTML/PDF report generation with embedded plots
        ├── reportHandlers.js      # Report generation business logic (~157 lines) 🆕
        ├── surfaceOperationHandlers.js  # Surface transformation handlers + fast convert (~376 lines) 🆕
        ├── surfaceTransformations.js    # Pure transformation functions
        └── zmxImportHandlers.js   # ZMX import business logic (~117 lines) 🆕
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
   - **Highly modular ES6 architecture** - Refactored from 1935 → 984 lines (49% reduction)
   - State management via React hooks (`useState`, `useEffect`)
   - UI orchestration layer - delegates to specialized components and utilities
   - Imports 22 component modules + 7 utility modules

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

### Modular Architecture (Nov 2025 Refactoring - Phase 1 & 2)

The application underwent comprehensive refactoring in two phases to improve maintainability and organization.

**Refactoring History:**
- **Original:** Monolithic `renderer.js` (3,435 lines) - All code in one file
- **Phase 1 (Nov 2025):** Extract major UI panels → `renderer-modular.js` (1,316 lines)
  - Created 3 panel components (PropertiesPanel, SurfacesPanel, VisualizationPanel)
  - Reduced by 619 lines (32%)
- **Phase 2 (Nov 2025):** Extract business logic handlers → `renderer-modular.js` (984 lines)
  - Created 3 utility handler modules (reportHandlers, zmxImportHandlers, surfaceOperationHandlers)
  - Reduced by 332 lines (25%)
- **Total Reduction:** 1,935 → 984 lines (**49% reduction, -951 lines**)

**Key Benefits:**
- **Maintainability**: Each module has a single, focused responsibility
- **Reusability**: Components and utilities can be easily reused
- **Testability**: Isolated modules are easier to unit test
- **Readability**: Smaller files (< 400 lines each) are easier to understand
- **Scalability**: Clear patterns for adding new features
- **Performance**: ES6 modules enable better tree-shaking and code splitting

**Module Organization:**
1. **Constants** (`src/constants/`): Surface types, colorscales, color palettes (3 files)
2. **Utilities** (`src/utils/`): Business logic and pure functions (7 files)
   - Core utilities: calculations, formatters, reportGenerator, surfaceTransformations
   - Handler utilities (Phase 2): reportHandlers, zmxImportHandlers, surfaceOperationHandlers
3. **Panel Components** (`src/components/panels/`): Major layout panels (3 files) **🆕 Phase 1**
   - PropertiesPanel: Right sidebar with parameters and metrics
   - SurfacesPanel: Left sidebar with folder tree and surface list
   - VisualizationPanel: Center panel with tabs, plots, and data views
4. **Layout Components** (`src/components/`): TitleBar, MenuBar - application chrome
5. **UI Components** (`src/components/ui/`): Reusable building blocks (4 files)
6. **View Components** (`src/components/views/`): Data presentation (2 files)
7. **Dialog Components** (`src/components/dialogs/`): Modal dialogs (7 files)
8. **Plot Components** (`src/components/plots/`): Plotly visualization generators (3 files)
9. **Icons** (`src/components/Icons.js`): SVG icon library

**Import Pattern:**
```javascript
// ES6 module imports - Constants
import { surfaceTypes, sampleSurfaces } from './constants/surfaceTypes.js';
import { colorscales } from './constants/colorscales.js';
import { getPalette } from './constants/colorPalettes.js';

// ES6 module imports - Utilities
import { formatValue, degreesToDMS } from './utils/formatters.js';
import { calculateSurfaceValues, calculateSurfaceMetrics } from './utils/calculations.js';
import { exportHTMLReport, exportPDFReport } from './utils/reportHandlers.js';
import { handleZMXImport, importSelectedSurfaces } from './utils/zmxImportHandlers.js';
import { handleInvertSurface, handleConvertToUnZ } from './utils/surfaceOperationHandlers.js';

// ES6 module imports - Components
import { PropertiesPanel } from './components/panels/PropertiesPanel.js';
import { SurfacesPanel } from './components/panels/SurfacesPanel.js';
import { VisualizationPanel } from './components/panels/VisualizationPanel.js';
import { create3DPlot } from './components/plots/Plot3D.js';
import { SummaryView } from './components/views/SummaryView.js';

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

The application supports 8 surface types, each with unique mathematical formulations.

### Parameter Organization

Parameters are organized into two categories:

1. **Universal Parameters** (common across surface types):
   - **Radius**: Base radius of curvature (mm) - all types except Poly which uses A1
   - **Min Height**: Inner radius of annular region (mm)
   - **Max Height**: Outer radius (mm)
   - **Step**: Calculation step size for grid generation

2. **Surface-Specific Parameters**: Unique to each surface type (conic constant, polynomial coefficients, aberrations, etc.)

This separation improves UI organization and makes parameter management more intuitive.

### Surface Type Definitions

1. **Sphere**
   - Universal: Radius, Min Height, Max Height, Step
   - Surface-Specific: (none)
   - Simple spherical surface (R > 0 = concave, R < 0 = convex)
   - Uses exact formula: z = R - sqrt(R² - r²)

2. **Even Asphere**
   - Universal: Radius, Min Height, Max Height, Step
   - Surface-Specific: Conic Constant (k), A4-A20 (even powers)
   - Standard aspheric surface with even polynomial terms
   - Classification: Sphere (k=0), Parabola (k=-1), Ellipsoid (-1<k<0), Hyperbola (k<-1), Oblate Ellipsoid (k>0)

3. **Odd Asphere**
   - Universal: Radius, Min Height, Max Height, Step
   - Surface-Specific: Conic Constant, A3-A20 (all powers)
   - Aspheric surface with both odd and even polynomial terms

4. **Zernike**
   - Universal: Radius, Min Height, Max Height, Step
   - Surface-Specific: Conic Constant, Extrapolate, Norm Radius, Number of Terms, A2-A16, Decenter X/Y, Z1-Z37, Scan Angle, X/Y Coordinate
   - Zernike Standard Sag surface (FZERNSAG in Zemax)
   - Combines base aspheric surface with Zernike polynomial aberrations
   - Uses standard (non-normalized) Zernike polynomials
   - Supports up to 37 Zernike terms

5. **Irregular**
   - Universal: Radius, Min Height, Max Height, Step
   - Surface-Specific: Conic Constant, Decenter X/Y, Tilt X/Y, Spherical, Astigmatism, Coma, Angle, Scan Angle, X/Y Coordinate
   - IRREGULA surface type from Zemax
   - Combines base conic surface with coordinate transformations and Zernike-like aberrations
   - Tilt convention matches Zemax (negative signs applied internally)

6. **Opal Un U**
   - Universal: Radius, Min Height, Max Height, Step
   - Surface-Specific: e2, H, A2-A12
   - Iterative solution for specialized optical surfaces
   - Uses convergence tolerance 1e-15, max 1M iterations

7. **Opal Un Z**
   - Universal: Radius, Min Height, Max Height, Step
   - Surface-Specific: e2, H, A3-A13
   - Newton-Raphson iterative solver
   - Uses convergence tolerance 1e-12, max 1K iterations

8. **Poly**
   - Universal: Min Height, Max Height, Step (Note: uses A1 instead of Radius)
   - Surface-Specific: A1-A13
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
- **RMS Error**: Root Mean Square wavefront error for Zernike/Irregular surfaces (mm and waves)
  - Calculated with piston removal over 64×64 grid (standard practice)
  - Matches Zemax calculation methodology
- **P-V Error**: Peak-to-Valley wavefront error for Zernike/Irregular surfaces (mm and waves)
  - Calculated without piston removal (matches Zemax "no removal" option)
  - Peak-to-valley range of raw aberration values

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
   // Add universal parameters
   export const universalParameters = {
     ...
     'New Surface': ['Radius', 'Min Height', 'Max Height', 'Step']
   };

   // Add surface-specific parameters
   export const surfaceTypes = {
     ...
     'New Surface': ['Param1', 'Param2', 'Param3']
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

- **main.js:** Electron-specific, window management, file I/O handlers (~567 lines)
- **preload.js:** Minimal security bridge, no calculations (~14 lines)
- **renderer-modular.js:** Main React application with ES6 imports (~1929 lines)
- **components/**: Modular React components organized by type (19 files)
  - `TitleBar.js`: Custom window title bar with minimize/maximize/close buttons (~172 lines)
  - `MenuBar.js`: Modern custom menu bar replacing OS menu bar (~234 lines)
  - `dialogs/`: Modal dialogs and context menus (7 files)
    - `ContextMenu.js`, `ConversionDialog.js`, `ConversionResultsDialog.js`
    - `InputDialog.js`, `NormalizeUnZDialog.js`, `SettingsModal.js`, `ZMXImportDialog.js`
  - `plots/`: Plotly visualization generators (3 files)
  - `ui/`: Reusable UI building blocks (4 files)
    - `DebouncedInput.js`: Input component that prevents UI freezing during typing (~92 lines)
    - `PropertyRow.js`: Single parameter row display (~33 lines)
    - `PropertySection.js`: Grouped parameter section (~19 lines)
    - `SurfaceActionButtons.js`: Surface action buttons component (~102 lines)
  - `views/`: Data presentation components (2 files)
    - `DataView.js`: Tabular data display (~98 lines)
    - `SummaryView.js`: Summary metrics and detailed analysis (~251 lines)
  - `Icons.js`: SVG icon library
- **constants/**: Application configuration and data (1 file)
  - `surfaceTypes.js`: Universal and surface-specific parameter definitions
- **utils/**: Pure utility functions (3 files)
  - `calculations.js`: Surface calculations with BFS caching, RMS/P-V error calculations (~386 lines)
  - `formatters.js`: Value formatting utilities
  - `reportGenerator.js`: HTML/PDF report generation with embedded plots
- **calculationsWrapper.js:** Pure mathematical functions for all surface types (~801 lines)
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

### Latest Updates (2025-11-23)

1. **Phase 2 Refactoring: Business Logic Extraction (Major Architectural Improvement):**
   - Extracted business logic handlers from renderer into dedicated utility modules
   - Reduced `renderer-modular.js` from 1316 → 984 lines (-332 lines, -25%)
   - Combined with Phase 1: **Total reduction of 49% (1935 → 984 lines, -951 lines)**
   - Created 3 new utility handler modules:
     - `reportHandlers.js` (157 lines): HTML/PDF report generation logic
     - `zmxImportHandlers.js` (117 lines): ZMX file import and parsing logic
     - `surfaceOperationHandlers.js` (227 lines): Surface transformation operations
   - Benefits:
     - Clear separation of concerns (UI vs business logic)
     - Better testability and maintainability
     - Easier to locate and modify specific functionality
     - Consistent architectural patterns throughout codebase
   - Commits: 95b1888 (Phase 2), e0b6275 (Phase 1)

2. **Phase 1 Refactoring: UI Panel Extraction (Major Architectural Improvement):**
   - Extracted major layout panels from renderer into dedicated components
   - Reduced `renderer-modular.js` from 1935 → 1316 lines (-619 lines, -32%)
   - Created 3 new panel components:
     - `PropertiesPanel.js` (370 lines): Right sidebar with parameters and metrics
     - `SurfacesPanel.js` (225 lines): Left sidebar with folder tree and surface list
     - `VisualizationPanel.js` (133 lines): Center panel with tabs, plots, data views
   - Benefits:
     - Single Responsibility Principle - each panel has one focused purpose
     - Improved code organization and maintainability
     - Easier to navigate and modify specific UI sections
     - Better performance with isolated components
   - Total component count increased from 19 → 22 files

3. **Custom Title Bar and Menu Bar (UI Modernization):**
   - Replaced OS title bar with custom title bar component (TitleBar.js)
   - Added minimize, maximize, and close window controls
   - Replaced OS menu bar with modern custom menu bar (MenuBar.js)
   - Integrated menu bar with application color scheme
   - Added window state tracking (maximized/unmaximized)
   - Improved application branding with icon integration
   - File changes: 3 new components, updated main.js and preload.js
     - `TitleBar.js`: 172 lines (new)
     - `MenuBar.js`: 234 lines (new)
     - `main.js`: 567 lines (+18)
     - `preload.js`: Added window control IPC handlers

4. **Settings Persistence and Grid Controls:**
   - Added persistent settings storage for colorscale and wavelength preferences
   - Added grid size controls for 3D and 2D plots
   - Settings now saved to localStorage and restored on application launch
   - Grid size controls allow customization of calculation density
   - Improved performance tuning for complex surfaces

5. **Surface Transformation Features:**
   - Added NormalizeUnZDialog component for Opal Un Z surface normalization
   - Added surface transformation tools for renormalizing surfaces to different H values
   - Enhanced surface fitting workflow with better parameter control
   - File changes: 1 new dialog component
     - `NormalizeUnZDialog.js`: 156 lines (new)

6. **Component Extraction and Organization:**
   - Extracted SurfaceActionButtons component from main renderer
   - Improved component modularity and reusability
   - Better separation of concerns for surface operations
   - File changes:
     - `SurfaceActionButtons.js`: 102 lines (new)
     - `renderer-modular.js`: 1929 lines (before Phase 1 & 2 refactoring)

### Previous Updates (2025-11-19 to 2025-11-20)

1. **Zernike RMS and P-V Error Calculations (Major Feature):**
   - Added comprehensive RMS (Root Mean Square) and P-V (Peak-to-Valley) wavefront error calculations for Zernike and Irregular surfaces
   - Calculations performed over 64×64 2D grid matching Zemax methodology
   - RMS calculated with piston removal (standard optical practice)
   - P-V calculated without piston removal (matches Zemax "no removal" option)
   - Results displayed in both millimeters and wave units (λ)
   - Added wavelength setting to Settings modal (Ctrl+,) with default 632.8 nm (HeNe laser)
   - Integrated into HTML/PDF report generation
   - New helper functions in `calculationsWrapper.js`:
     - `calculateZernikeBaseSag()`: Calculate base conic+aspheric surface for error calculation
     - `calculateIrregularBaseSag()`: Calculate base conic surface for error calculation
   - File changes: 252 additions across 6 files
     - `calculationsWrapper.js`: 801 lines (+82)
     - `calculations.js`: 386 lines (+74)
     - `SettingsModal.js`: Added wavelength input field (+40)
     - `reportGenerator.js`: Display RMS/P-V in reports (+73)
     - `renderer-modular.js`: 1652 lines (+28)

2. **Report Visualization Improvements:**
   - Modified step size and maximum rows in data tables for better readability
   - Removed plot titles from embedded images for cleaner presentation
   - Added 1:1 aspect ratio to Sag plots for accurate visualization
   - Changed axis labels from 'Radius' to 'Radial Coordinate' for technical accuracy
   - Matched 2D plot style to Sag tab: switched from contour to false color map
   - Fixed Content Security Policy to allow base64-encoded plot images
   - Fixed Plotly.toImage() errors with off-screen positioning
   - Fixed plot generation to calculate 2D grids directly instead of interpolating
   - Fixed Zernike equation notation to match program parameter names

### Previous Updates (2025-11-18)

1. **Report Generation System:**
   - Added comprehensive HTML report export with embedded plots and data
   - Added PDF report export using Electron's built-in printToPDF
   - Reports include: surface parameters, summary metrics, 3D/2D/cross-section plots, calculated data table
   - Professional styling with gradient metric cards and responsive layout
   - Accessible via File → Export HTML Report (Ctrl+E) or Export PDF Report (Ctrl+P)
   - Uses Plotly.toImage() to export plots as high-resolution PNG images
   - Self-contained HTML files with base64-encoded images

2. **Parameter Architecture Refactoring:**
   - Separated universal parameters (Radius, Min Height, Max Height, Step) from surface-specific parameters
   - Added Step parameter to all surface types for grid generation control
   - Improved UI organization with dedicated Universal parameters section

3. **Input UX Improvements:**
   - Created DebouncedInput component to prevent UI freezing during typing
   - Added Enter key navigation to move between parameter inputs
   - Implemented scroll position preservation when editing parameters
   - Fixed input interruption issues with focused state management

4. **Calculation Precision:**
   - Enhanced numerical precision in asphere calculations
   - Fixed max sag calculations to handle absolute values correctly
   - Improved NaN/Infinity handling in summary statistics
   - Created test suite for precision validation (`test_precision.js`)

5. **Zemax Compatibility:**
   - Fixed EVENASPH parameter mapping in ZMX parser
   - Added Zemax comparison test with exact user parameters (`test_zemax_comparison.js`)
   - Improved Opal Un U slope derivative calculations

6. **Code Cleanup:**
   - Removed legacy `renderer.js` (3435 lines)
   - Extracted metrics calculation to shared utility function
   - Improved code organization and maintainability

### Implemented Features (2025-11)

1. **ZMX File Import:**
   - Full Zemax ZMX file parser (`zmxParser.js`)
   - Supports STANDARD, EVENASPH, ODDASPHE, IRREGULA, FZERNSAG, USERSURF us_polynomial.dll surface types
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
   - Fixed F-number calculations and input validation
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
   - ✅ ~~Plot export and report generation~~ **COMPLETED (Nov 2025)**
   - Keyboard navigation improvements
   - Enhanced data export options (CSV, Excel)

4. **Code Quality:**
   - ✅ ~~Split renderer.js into separate component files~~ **COMPLETED (Nov 2025)**
   - Add TypeScript for type safety
   - Implement automated testing
   - Add PropTypes or TypeScript interfaces for component props

### Technical Debt

1. **✅ RESOLVED - Code organization (Nov 2025):**
   - ~~renderer.js 3435 lines - MUST SPLIT~~ → **COMPLETED!**
   - Successfully refactored into 19 modular ES6 files
   - New structure: `components/` (19 files), `utils/` (3 files), `constants/` (1 file)
   - Main file reduced from 3435 → 1929 lines (44% reduction)
   - Legacy `renderer.js` removed after successful migration
   - Continued modularization with TitleBar, MenuBar, SurfaceActionButtons, NormalizeUnZDialog
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
  - **Constants:**
    - `src/constants/surfaceTypes.js` - Surface type definitions
    - `src/constants/colorscales.js` - Plotly.js colorscale names
    - `src/constants/colorPalettes.js` - UI color theme definitions
- **Calculations:**
  - **JavaScript:** `src/calculationsWrapper.js` (SurfaceCalculations class, RMS/P-V base calculations)
  - **Utilities:** `src/utils/calculations.js` (surface value calculator with BFS caching, RMS/P-V error calculations)
  - **Python Reference:** `src/calculations.py` (validation/testing)
- **Formatting:** `src/utils/formatters.js` (formatValue, degreesToDMS)
- **Report Generation:** `src/utils/reportGenerator.js` (HTML/PDF export with embedded plots, RMS/P-V metrics)
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
| Ctrl+E | Export HTML Report |
| Ctrl+P | Export PDF Report |
| Ctrl+, | Settings (Colorscale & Wavelength) |
| Ctrl+Shift+I | Toggle DevTools |

### Application Settings

Access via Ctrl+, or View → Settings:

- **Plot Colorscale**: Choose from multiple color maps for plot visualization
  - Options: Viridis, Jet, Hot, Cool, Rainbow, Portland, Picnic, Electric, Earth, Blackbody, YlOrRd, YlGnBu
- **Reference Wavelength**: Set wavelength for RMS/P-V error calculations
  - Default: 632.8 nm (HeNe laser)
  - Range: 100-10000 nm
  - Used for converting mm to wave units (λ) in Zernike and Irregular surface error calculations

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
6. **USERSURF "us_polynomial.dll"** → Converts to Poly surface

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

**USERSURF "us_polynomial.dll":**
- CURV: 1/R (curvature), converted to A1 = 2*R = 2/CURV
- PARM 1-12: A2-A13 polynomial coefficients

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

**Last Updated:** 2025-12-03
**Version:** 2.9.1 (Fast Convert to Poly Feature)
**Major Changes:**
- Added "Fast Convert to Poly" button for automatic iterative polynomial fitting
- Automatically adds higher order coefficients (A3-A13) until deviation threshold is met
- Configurable max deviation threshold in Settings (default: 0.000001 mm)
- Iterative algorithm: starts with A1+A2, adds A3, A4, A5... until threshold satisfied
- Uses Poly (Auto-Normalized) surface type for numerical stability
- Console logging shows progress and deviation for each iteration
- Integrated with standard conversion results dialog for user review
- Settings persistence for threshold value

**Previous Version (2.9.0 - 2025-12-03):**
- Added support for USERSURF "us_polynomial.dll" surface type in ZMX parser
- Converts Zemax polynomial surfaces to application Poly surface type
- CURV field converted to A1 parameter (A1 = 2*R = 2/CURV)
- PARM 1-12 mapped to A2-A13 polynomial coefficients
- Full compatibility with Zemax polynomial surface files

**Previous Version (2.5.0 - 2025-11-23):**
- **🎯 Phase 2:** Extracted business logic handlers into 3 utility modules
  - reportHandlers.js (157 lines): Report generation logic
  - zmxImportHandlers.js (117 lines): ZMX import logic
  - surfaceOperationHandlers.js (227 lines): Surface transformation logic
  - Reduced renderer from 1316 → 984 lines (-25%)
- **🎯 Phase 1:** Extracted major UI panels into 3 panel components
  - PropertiesPanel.js (370 lines): Right sidebar
  - SurfacesPanel.js (225 lines): Left sidebar
  - VisualizationPanel.js (133 lines): Center panel
  - Reduced renderer from 1935 → 1316 lines (-32%)
- **📊 Combined Results:** 49% total reduction (1935 → 984 lines, -951 lines)
- Updated file counts: 22 components (was 19), 7 utilities (was 4)
- Clear separation of concerns: UI orchestration vs business logic
- Improved maintainability, testability, and scalability
- All functionality preserved - purely architectural refactoring

**Previous Version (2.4.0 - 2025-11-23):**
- Custom title bar with window controls (minimize/maximize/close)
- Modern custom menu bar replacing OS menu bar
- Settings persistence (colorscale, wavelength, grid sizes)
- NormalizeUnZDialog for Opal Un Z surface transformations
- Extracted SurfaceActionButtons component for better modularity

**Version 2.3.0 (2025-11-20):**
- Added RMS and P-V wavefront error calculations for Zernike and Irregular surfaces
- Wavelength setting in Settings modal for error calculations (default: 632.8 nm)
- Enhanced report visualization with improved plots and axis labels
- Added helper functions for Zernike and Irregular base surface calculations
- Comprehensive test coverage for Zemax compatibility

**Version 2.2.0 (2025-11-18):**
- Separated universal and surface-specific parameters
- Added Step parameter to all surface types
- Created DebouncedInput component to prevent UI freezing
- Removed legacy renderer.js (3435 lines)
- Initial modular ES6 architecture

**Maintained by:** AI Assistants working with this codebase
