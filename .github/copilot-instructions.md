# SurfaceExpert - AI Coding Guidelines

## Architecture Overview

**Stack:** Electron (desktop) + React (UI) + JavaScript calculations + Python reference
- `main.js`: Electron main process, window management, IPC event routing, native menus
- `preload.js`: Context isolation bridge exposing `window.electronAPI.onMenuAction()`
- `renderer-modular.js`: React app (~984 LOC) - all UI orchestration with ES6 modular architecture
- `calculationsWrapper.js`: Mathematical surface calculation library (Sag, Slope, Asphericity, Aberration)
- `calculations.py`: Python reference implementations (not currently integrated)

**Data Flow:** Menu actions → IPC → React state → render plots + metrics. Surface parameters change → recalculate via `SurfaceCalculations` class.

## Key Components & Patterns

### Surface Types & Parameters
Define surfaces by type: `Sphere`, `Even Asphere`, `Odd Asphere`, `Opal Un U/Z`, `Poly`. Each type has unique parameters (e.g., Even Asphere needs Radius, Conic Constant, A4-A20 coefficients). The `surfaceTypes` object maps types to required params; when type changes, parameters are rebuilt.

### Calculation Workflow
1. Parse surface parameters with `parseParam(name)` helper
2. Call appropriate `SurfaceCalculations.calculate*()` method for surface type
3. Return `{sag, slope, asphericity, aberration, angle}` object
4. For asphericity/aberration, cache best-fit-sphere params via `getBestFitSphereParams()` to avoid recalculation

### Plotting
Plotly renders in 3 sub-tabs: `3d` (surface plot with contours), `2d` (contour map), `cross` (radial cross-section). Grid generation in `generatePlotData()` respects annular region bounds (Min Height ≤ r ≤ Max Height).

### React Component Structure
- `OpticalSurfaceAnalyzer`: Main container, manages surfaces array + selected surface + tab state
- `SummaryView`: Generates data table (20 samples per height range), computes optical metrics (F/#, max deviations)
- `PropertiesPanel`: Right sidebar with editable params, calculated metrics, quick actions
- `PropertySection` / `PropertyRow`: Reusable UI components for consistent styling

## Developer Workflows

### Running
- `npm start` - Launch Electron app (calls `src/main.js`)
- `npm run dev` - Same, but opens DevTools (`--dev` flag)
- `npm run build` - Package with electron-builder (outputs to `dist/`)

### Key Commands in App
- Ctrl+N / Menu → New Surface
- Ctrl+Shift+A / Menu → Add Surface  
- Delete / Menu → Remove Surface
- Ctrl+D → Duplicate Surface
- F5 → Recalculate All
- Ctrl+S → Save (not yet implemented)

### Debugging
- DevTools available via `npm run dev` or Ctrl+Shift+I
- Menu actions logged via IPC (check console for action strings)
- Plot errors fail silently; check browser console for Plotly issues

## Project-Specific Conventions

### Naming & Units
- Radial coordinates: `r` (mm), zenith height range: `[minHeight, maxHeight]` (mm)
- Optical metrics: sag (mm), slope (rad), angle (°), asphericity (mm), aberration (mm)
- Angle DMS: degrees/minutes/seconds format via `degreesToDMS()` helper

### Value Formatting
Use `formatValue()` helper: returns '0' for NaN/Inf, scientific notation for <1e-7, else 7 decimals.

### State Management
All state in React (no external stores). `setSurfaces()` creates new array/objects to trigger re-renders. Derived state (selected surface, tabs) updates via `useEffect()` watchers on parameter changes.

### Error Handling
Math functions wrapped in try-catch; silent fail returns 0 (prevents UI crashes from numerical edge cases).

### Color Scheme
Dark theme constants in `colors` object: `bg: '#2b2b2b'`, `panel: '#353535'`, `accent: '#4a90e2'`, etc. Passed as `c` prop for consistency.

## Integration Points

### Menu System
Menu bar in `main.js` sends action strings via `mainWindow.webContents.send('menu-action', action)`. React listens via `window.electronAPI.onMenuAction()` in `useEffect`. Add handlers in `handleMenuAction()` switch.

### Calculation Library
`SurfaceCalculations` class methods are static, deterministic, no side effects. Add new surface types by:
1. Add to `surfaceTypes` object in `renderer.js`
2. Implement `calculateSurfaceType*Sag()` and `calculateSurfaceType*Slope()` in `calculationsWrapper.js`
3. Update `calculateSurfaceValues()` switch statement

### File I/O (Future)
Currently no save/load. To add: implement in `main.js` via `ipcMain.handle()`, call from React via `window.electronAPI.saveFile()`. Surface objects serialize as `{id, name, type, color, parameters}` JSON.

## Testing & Validation

- **Sample data** in `sampleSurfaces` initializes with sphere R=100mm, height 0-25mm
- **Expected calculations**: Sphere sag at r=10mm, R=100mm should be ~0.5mm
- **UI responsiveness**: Annular region rendering (r < minHeight) renders as null (transparent)
- **Metric accuracy**: Best-fit sphere uses 3-point method (minHeight=0) or 4-point (annular), cached to avoid repeated expensive calculations

## File Organization

```
src/
  main.js           ← Electron process, window, menu setup
  preload.js        ← IPC bridge (minimal, security-focused)
  renderer.js       ← React app + components + helpers
  calculationsWrapper.js ← Math functions for all surface types
  calculations.py   ← Python reference (not integrated)
  index.html        ← Template + external CDNs (React, Plotly)
  styles.css        ← Global styles (minimal, inline styles preferred)
```

## Common Tasks

**Add a menu item:** Update menu template in `createMenu()`, add IPC handler string, implement in `handleMenuAction()` switch in renderer.

**Add surface type:** Update `surfaceTypes`, implement Sag/Slope methods in `calculationsWrapper.js`, add to calculation switch in `calculateSurfaceValues()`.

**Modify UI layout:** Edit `PropertiesPanel`, `SummaryView` React.createElement calls. Use color constants (`c` object) for theming.

**Fix calculation bug:** Likely in `SurfaceCalculations` static method or in parsing parameters. Check sample values in test case, compare against Python reference.
