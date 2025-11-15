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
├── optical_surface_analyzer.html  # Standalone HTML version (legacy)
├── various code for claude/
│   └── SurfaceCalculations.cs     # C# reference implementation
└── src/
    ├── main.js                    # Electron main process (window management)
    ├── preload.js                 # Context isolation bridge (IPC)
    ├── renderer.js                # React UI application (~1520 lines)
    ├── calculationsWrapper.js     # Surface calculation engine (~340 lines)
    ├── index.html                 # Entry point HTML template
    └── styles.css                 # Global CSS styles (~50 lines)
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

3. **Renderer Process** (`src/renderer.js`):
   - React application (no JSX, uses `React.createElement`)
   - State management via React hooks (`useState`, `useEffect`)
   - All UI components and business logic
   - Calculation orchestration

### Data Flow

```
User Action → Native Menu (main.js)
    ↓ IPC message
React Handler (renderer.js)
    ↓
State Update (setSurfaces)
    ↓
useEffect Triggers
    ↓
Recalculation (SurfaceCalculations)
    ↓
Plot Update (Plotly.newPlot)
```

## Surface Types & Mathematical Models

The application supports 6 surface types, each with unique mathematical formulations:

1. **Sphere**
   - Parameters: Radius, Min Height, Max Height
   - Simple spherical surface (R > 0 = concave, R < 0 = convex)

2. **Even Asphere**
   - Parameters: Radius, Conic Constant (k), A4-A20 (even powers)
   - Standard aspheric surface with even polynomial terms
   - Classification: Sphere (k=0), Parabola (k=-1), Ellipsoid (-1<k<0), Hyperbola (k<-1), Oblate Ellipsoid (k>0)

3. **Odd Asphere**
   - Parameters: Radius, Conic Constant, A3-A20 (all powers)
   - Aspheric surface with both odd and even polynomial terms

4. **Opal Un U**
   - Parameters: Radius, e2, H, A2-A12
   - Iterative solution for specialized optical surfaces
   - Uses convergence tolerance 1e-15, max 1M iterations

5. **Opal Un Z**
   - Parameters: Radius, e2, H, A3-A13
   - Newton-Raphson iterative solver
   - Uses convergence tolerance 1e-12, max 1K iterations

6. **Poly**
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

1. **Define parameters** in `surfaceTypes` object (renderer.js):
   ```javascript
   'New Surface': ['Radius', 'Param1', 'Param2', 'Min Height', 'Max Height']
   ```

2. **Implement calculations** in `calculationsWrapper.js`:
   ```javascript
   static calculateNewSurfaceSag(r, param1, param2) { ... }
   static calculateNewSurfaceSlope(r, param1, param2) { ... }
   ```

3. **Add to calculation dispatcher** in `calculateSurfaceValues()` (renderer.js):
   ```javascript
   } else if (surface.type === 'New Surface') {
     const p1 = parseParam('Param1'), p2 = parseParam('Param2');
     sag = SurfaceCalculations.calculateNewSurfaceSag(r, p1, p2);
     slope = SurfaceCalculations.calculateNewSurfaceSlope(r, p1, p2);
   }
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

2. **Handle in renderer** (renderer.js `handleMenuAction()`):
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

- **main.js:** Electron-specific only, no business logic
- **preload.js:** Minimal security bridge, no calculations
- **renderer.js:** All React components and UI logic (consider splitting if >2000 lines)
- **calculationsWrapper.js:** Pure mathematical functions, no UI dependencies
- **styles.css:** Global styles only (scrollbars, focus states), prefer inline styles

## Dependencies & Security

### NPM Dependencies

**Production:**
- `react@18.2.0` - UI framework
- `react-dom@18.2.0` - React DOM rendering
- Plotly.js loaded via CDN (not NPM)

**Development:**
- `electron@28.0.0` - Desktop framework
- `electron-builder@24.9.1` - Build/packaging tool

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

## Future Development Roadmap

### Planned Features (from menu stubs)

1. **File I/O:**
   - Save/Load surface configurations
   - Export results to CSV/JSON
   - Import from optical design software

2. **Surface Operations:**
   - Duplicate surface (Ctrl+D) - menu exists, not implemented
   - Convert between surface types
   - Surface comparison view

3. **Advanced Calculations:**
   - Additional optical metrics
   - Multi-surface systems
   - Tolerance analysis

4. **UI Enhancements:**
   - Customizable color schemes
   - Plot export (PNG, SVG)
   - Print/report generation

### Technical Debt

1. **Code organization:** renderer.js is 1520 lines - consider splitting:
   - `components/` - React components
   - `utils/` - Helper functions
   - `hooks/` - Custom React hooks
   - `constants/` - Surface types, colors, etc.

2. **Build modernization:**
   - Consider Vite or esbuild for faster dev/build
   - TypeScript for type safety
   - JSX for more readable components

3. **Testing:**
   - Add unit tests for calculations
   - Add integration tests for UI
   - Visual regression tests for plots

4. **Documentation:**
   - API documentation for SurfaceCalculations
   - User guide with examples
   - Video tutorials

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

- **UI Changes:** `src/renderer.js` (components) + `src/styles.css` (global styles)
- **Calculations:** `src/calculationsWrapper.js`
- **Menu/IPC:** `src/main.js` + `src/preload.js`
- **Build Config:** `package.json` (electron-builder section)
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

---

**Last Updated:** 2025-11-15
**Version:** 1.0.0
**Maintained by:** AI Assistants working with this codebase
