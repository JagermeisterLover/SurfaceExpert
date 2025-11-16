# Renderer.js Refactoring Plan

## Problem
The `src/renderer.js` file has grown to **3,435 lines**, making it difficult to maintain, navigate, and test. This violates single responsibility principles and makes the codebase harder to work with.

## Solution
Break down the monolithic file into a modular structure with clear separation of concerns.

---

## New Folder Structure

```
src/
├── constants/
│   └── surfaceTypes.js          ✅ DONE - Surface types, sample data, colorscales, colors
├── utils/
│   ├── formatters.js            ✅ DONE - formatValue, degreesToDMS
│   └── calculations.js          ✅ DONE - calculateSurfaceValues, calculateSagOnly, getBestFitSphereParams
├── components/
│   ├── Icons.js                 ✅ DONE - PlusIcon, MinusIcon
│   ├── ui/
│   │   ├── PropertySection.js   ✅ DONE - Section wrapper component
│   │   └── PropertyRow.js       ✅ DONE - Property label/value row
│   ├── views/
│   │   ├── SummaryView.js       ⏳ TODO - Summary metrics and data table
│   │   └── DataView.js          ⏳ TODO - Tabular data view
│   ├── dialogs/
│   │   ├── SettingsModal.js     ⏳ TODO - Colorscale settings
│   │   ├── ZMXImportDialog.js   ⏳ TODO - ZMX file import dialog
│   │   ├── ConversionDialog.js  ⏳ TODO - Surface fitting dialog
│   │   ├── ConversionResultsDialog.js ⏳ TODO - Fit results dialog
│   │   ├── ContextMenu.js       ⏳ TODO - Right-click context menu
│   │   └── InputDialog.js       ⏳ TODO - Generic input dialog
│   ├── panels/
│   │   ├── SurfaceListPanel.js  ⏳ TODO - Left panel (folder tree)
│   │   ├── VisualizationPanel.js ⏳ TODO - Center panel (plots/tabs)
│   │   └── PropertiesPanel.js   ⏳ TODO - Right panel (parameters)
│   └── plots/
│       ├── Plot3D.js            ⏳ TODO - 3D surface plot
│       ├── Plot2DContour.js     ⏳ TODO - 2D contour plot
│       └── PlotCrossSection.js  ⏳ TODO - Cross-section plot
├── hooks/
│   ├── useFolders.js            ⏳ TODO - Folder CRUD operations
│   ├── useSurfaces.js           ⏳ TODO - Surface CRUD operations
│   └── usePlots.js              ⏳ TODO - Plot generation logic
├── renderer.js                  ⏳ TODO - Main entry point (imports all modules)
└── (existing files: main.js, preload.js, calculationsWrapper.js, zmxParser.js, etc.)
```

---

## Completed Extractions

### 1. **Constants** - `src/constants/surfaceTypes.js` ✅
**Size:** ~50 lines
**Exports:**
- `surfaceTypes` - Object defining parameters for each surface type
- `sampleSurfaces` - Default sample surface data
- `colorscales` - Available Plotly colorscales
- `colors` - Dark theme color scheme

**Dependencies:** None

---

### 2. **Formatters** - `src/utils/formatters.js` ✅
**Size:** ~40 lines
**Exports:**
- `formatValue(value)` - Format numeric values for display
- `degreesToDMS(angle)` - Convert degrees to DMS format

**Dependencies:** None

---

### 3. **Calculations** - `src/utils/calculations.js` ✅
**Size:** ~220 lines
**Exports:**
- `getBestFitSphereParams(surface)` - Get/calculate cached BFS params
- `calculateSagOnly(r, surface)` - Calculate sag without recursion
- `calculateSurfaceValues(r, surface, x, y)` - Calculate all surface values
- `clearBFSCache()` - Clear best-fit sphere cache

**Dependencies:**
- `window.SurfaceCalculations` (from calculationsWrapper.js)

---

### 4. **Icons** - `src/components/Icons.js` ✅
**Size:** ~15 lines
**Exports:**
- `PlusIcon` - Plus icon SVG component
- `MinusIcon` - Minus icon SVG component

**Dependencies:** React

---

### 5. **PropertySection** - `src/components/ui/PropertySection.js` ✅
**Size:** ~20 lines
**Exports:**
- `PropertySection` - Section wrapper with title

**Props:** `{ title, children, c }`
**Dependencies:** React

---

### 6. **PropertyRow** - `src/components/ui/PropertyRow.js` ✅
**Size:** ~35 lines
**Exports:**
- `PropertyRow` - Property label/value row (editable or read-only)

**Props:** `{ label, value, editable, c }`
**Dependencies:** React

---

## Pending Extractions

### Priority 1: View Components (Medium complexity, self-contained)

#### **SummaryView** - `src/components/views/SummaryView.js`
**Original:** Lines 1492-1752 (~260 lines)
**Exports:** `SummaryView`
**Props:** `{ selectedSurface, c }`
**Dependencies:**
- `calculateSurfaceValues` from `../../utils/calculations.js`
- `formatValue`, `degreesToDMS` from `../../utils/formatters.js`
- `window.SurfaceCalculations`

**Contains:**
- `generateDataTable()` nested function
- Summary metrics table
- Data table rendering

---

#### **DataView** - `src/components/views/DataView.js`
**Original:** Lines 1754-1843 (~90 lines)
**Exports:** `DataView`
**Props:** `{ activeTab, selectedSurface, c }`
**Dependencies:**
- `calculateSurfaceValues` from `../../utils/calculations.js`
- `formatValue` from `../../utils/formatters.js`

**Contains:**
- `generateTabData()` nested function
- Tabular data rendering

---

### Priority 2: Dialog Components (Medium-high complexity, mostly self-contained)

#### **SettingsModal** - `src/components/dialogs/SettingsModal.js`
**Original:** Lines 3341-3432 (~90 lines)
**Exports:** `SettingsModal`
**Props:** `{ colorscale, setColorscale, onClose, c }`
**Dependencies:**
- `colorscales` from `../../constants/surfaceTypes.js`

---

#### **ZMXImportDialog** - `src/components/dialogs/ZMXImportDialog.js`
**Original:** Lines 2239-2464 (~225 lines)
**Exports:** `ZMXImportDialog`
**Props:** `{ zmxSurfaces, onImport, onClose, c }`
**Dependencies:** React.useState

**Contains:**
- Local state (selectedSurfaces, selectAll)
- toggleSurface, handleSelectAll handlers
- Surface selection table UI

---

#### **ConversionDialog** - `src/components/dialogs/ConversionDialog.js`
**Original:** Lines 2466-2850 (~385 lines)
**Exports:** `ConversionDialog`
**Props:** `{ selectedSurface, folders, selectedFolder, setFolders, setSelectedSurface, setShowConvert, setShowConvertResults, setConvertResults, c }`
**Dependencies:**
- React.useState
- `calculateSurfaceValues` from `../../utils/calculations.js`
- `window.electronAPI`

**Contains:**
- Conversion settings state
- runConversion() handler
- Complex form UI

---

#### **ConversionResultsDialog** - `src/components/dialogs/ConversionResultsDialog.js`
**Original:** Lines 2852-3339 (~487 lines)
**Exports:** `ConversionResultsDialog`
**Props:** `{ convertResults, folders, selectedFolder, setFolders, setSelectedSurface, onClose, c }`
**Dependencies:**
- React.useState
- `surfaceTypes` from `../../constants/surfaceTypes.js`
- `window.electronAPI`

**Contains:**
- calculateMaxDeviation() function
- createSurfaceFromFitReport() function
- handleAddSurface() handler
- Results display UI

---

#### **ContextMenu** - `src/components/dialogs/ContextMenu.js`
**Original:** Lines 789-869 (~80 lines)
**Exports:** `ContextMenu`
**Props:** `{ contextMenu, setContextMenu, handlers, c }`
**Dependencies:** None

**Contains:**
- Right-click menu UI
- Folder/surface specific actions

---

#### **InputDialog** - `src/components/dialogs/InputDialog.js`
**Original:** Lines 871-965 (~95 lines)
**Exports:** `InputDialog`
**Props:** `{ inputDialog, setInputDialog, c }`
**Dependencies:** React.useState

**Contains:**
- Generic text input dialog
- Rename/new folder functionality

---

### Priority 3: Plot Components (Medium complexity)

#### **Plot3D** - `src/components/plots/Plot3D.js`
**Original:** Lines 236-326 (~90 lines)
**Exports:** `create3DPlot`
**Parameters:** `(plotRef, gridData, c, colorscale)`
**Dependencies:** Plotly

---

#### **Plot2DContour** - `src/components/plots/Plot2DContour.js`
**Original:** Lines 328-418 (~90 lines)
**Exports:** `create2DContour`
**Parameters:** `(plotRef, gridData, c, colorscale)`
**Dependencies:** Plotly

---

#### **PlotCrossSection** - `src/components/plots/PlotCrossSection.js`
**Original:** Lines 420-494 (~75 lines)
**Exports:** `createCrossSection`
**Parameters:** `(plotRef, data, c)`
**Dependencies:** Plotly

---

### Priority 4: Custom Hooks (High complexity - state management)

#### **useFolders** - `src/hooks/useFolders.js`
**Original:** Lines 635-725 (~90 lines)
**Exports:** `useFolders`
**Returns:** `{ folders, setFolders, addFolder, removeFolder, renameFolder, toggleFolderExpanded, loadFoldersFromDisk }`

**Contains:**
- addFolder() - Lines 635-660
- removeFolder() - Lines 662-687
- renameFolder() - Lines 689-718
- toggleFolderExpanded() - Lines 720-725
- loadFoldersFromDisk() - Lines 74-97

---

#### **useSurfaces** - `src/hooks/useSurfaces.js`
**Original:** Lines 496-633 (~138 lines)
**Exports:** `useSurfaces`
**Returns:** `{ selectedSurface, setSelectedSurface, updateSurfaceName, updateSurfaceType, updateParameter, addSurface, removeSurface }`

**Contains:**
- updateSurfaceName() - Lines 496-520
- updateSurfaceType() - Lines 522-547
- updateParameter() - Lines 549-570
- addSurface() - Lines 572-603
- removeSurface() - Lines 605-633

---

#### **usePlots** - `src/hooks/usePlots.js`
**Original:** Lines 123-494 (~370 lines)
**Exports:** `usePlots`
**Returns:** `{ generatePlotData, create3DPlot, create2DContour, createCrossSection }`

**Contains:**
- generatePlotData() - Lines 123-234
- create3DPlot() - Lines 236-326
- create2DContour() - Lines 328-418
- createCrossSection() - Lines 420-494

---

### Priority 5: Panel Components (Highest complexity - orchestration)

#### **PropertiesPanel** - `src/components/panels/PropertiesPanel.js`
**Original:** Lines 1845-2191 (~345 lines)
**Exports:** `PropertiesPanel`
**Props:** `{ selectedSurface, updateSurfaceName, updateSurfaceType, updateParameter, onConvert, c }`
**Dependencies:**
- `surfaceTypes` from `../../constants/surfaceTypes.js`
- `calculateSurfaceValues` from `../../utils/calculations.js`
- `formatValue`, `degreesToDMS` from `../../utils/formatters.js`
- `PropertySection`, `PropertyRow` from `../ui/`
- `window.SurfaceCalculations`

**Contains:**
- calculateMetrics() nested function (Lines 1863-1932)
- Parameters form
- Metrics display

---

#### **SurfaceListPanel** - `src/components/panels/SurfaceListPanel.js`
**Original:** Lines 969-1146 (~177 lines)
**Exports:** `SurfaceListPanel`
**Props:** `{ folders, selectedSurface, setSelectedSurface, selectedFolder, setSelectedFolder, onAddFolder, onAddSurface, onContextMenu, c }`
**Dependencies:**
- `PlusIcon`, `MinusIcon` from `../Icons.js`

**Contains:**
- Folder tree rendering
- Surface list rendering
- Add folder/surface buttons

---

#### **VisualizationPanel** - `src/components/panels/VisualizationPanel.js`
**Original:** Lines 1148-1261 (~113 lines)
**Exports:** `VisualizationPanel`
**Props:** `{ selectedSurface, activeTab, setActiveTab, activeSubTab, setActiveSubTab, plotRef, c }`
**Dependencies:**
- `SummaryView` from `../views/SummaryView.js`
- `DataView` from `../views/DataView.js`

**Contains:**
- Main tabs (summary, sag, slope, etc.)
- Sub-tabs (3D, 2D, cross-section, data)
- Plot container
- Conditional rendering of views

---

### Priority 6: Main App Component

#### **renderer.js** (NEW - Main Entry Point)
**Original:** Lines 53-1274 + 3434-3435 (~1220 lines → ~200 lines after refactor)
**Exports:** None (mounts app)
**Dependencies:** ALL modules above

**Will contain:**
- Imports from all modules
- OpticalSurfaceAnalyzer component (orchestrator)
- State management (useState hooks)
- Effect hooks (useEffect)
- Menu action handler
- Event handlers that coordinate between components
- Main layout (3-panel structure)
- ReactDOM.render()

---

## Migration Strategy

### Phase 1: Extract Independent Modules ✅ DONE
1. Constants ✅
2. Utilities (formatters, calculations) ✅
3. Icons ✅
4. Simple UI components (PropertySection, PropertyRow) ✅

### Phase 2: Extract View Components (NEXT STEP)
1. SummaryView
2. DataView

### Phase 3: Extract Dialog Components
1. SettingsModal (simplest)
2. ContextMenu
3. InputDialog
4. ZMXImportDialog
5. ConversionDialog
6. ConversionResultsDialog (most complex)

### Phase 4: Extract Plot Components
1. Plot3D
2. Plot2DContour
3. PlotCrossSection

### Phase 5: Create Custom Hooks
1. useSurfaces
2. useFolders
3. usePlots

### Phase 6: Extract Panel Components
1. PropertiesPanel
2. SurfaceListPanel
3. VisualizationPanel

### Phase 7: Final Integration
1. Create new modular renderer.js
2. Update index.html to support ES6 modules
3. Test all functionality
4. Fix any import/export issues
5. Update CLAUDE.md documentation

---

## Benefits After Refactoring

1. **Maintainability**: Each file has a single, clear responsibility
2. **Testability**: Can unit test individual components in isolation
3. **Reusability**: Components can be reused across the app
4. **Readability**: Easier to find and understand code
5. **Collaboration**: Multiple developers can work on different files
6. **Performance**: Can optimize individual components with React.memo
7. **Type Safety**: Easier to add TypeScript/PropTypes in the future

---

## Technical Challenges

### Challenge 1: ES6 Module Support
**Problem:** Browser ES6 modules require `<script type="module">`
**Solution:** Update index.html to use module scripts

### Challenge 2: Circular Dependencies
**Problem:** Some components may have circular dependencies
**Solution:** Use hooks pattern and prop drilling to avoid

### Challenge 3: Global SurfaceCalculations
**Problem:** SurfaceCalculations is loaded globally via script tag
**Solution:** Keep as `window.SurfaceCalculations` for now, refactor later

### Challenge 4: React without JSX
**Problem:** Using React.createElement is verbose
**Solution:** Use `const h = React.createElement` shorthand consistently

### Challenge 5: State Management
**Problem:** Deep component trees need state from top level
**Solution:** Pass props down or use custom hooks to encapsulate state logic

---

## Next Steps

1. ⏳ Extract SummaryView and DataView components
2. ⏳ Extract all dialog components
3. ⏳ Extract plot components
4. ⏳ Create custom hooks for state management
5. ⏳ Extract panel components
6. ⏳ Create new modular renderer.js
7. ⏳ Update index.html for ES6 modules
8. ⏳ Test thoroughly
9. ⏳ Update CLAUDE.md with new architecture

---

## Files Created So Far

### Phase 1: Independent Modules ✅ COMPLETE
1. `src/constants/surfaceTypes.js` ✅ (~50 lines)
2. `src/utils/formatters.js` ✅ (~40 lines)
3. `src/utils/calculations.js` ✅ (~220 lines)
4. `src/components/Icons.js` ✅ (~15 lines)
5. `src/components/ui/PropertySection.js` ✅ (~20 lines)
6. `src/components/ui/PropertyRow.js` ✅ (~35 lines)

### Phase 2: View Components ✅ COMPLETE
7. `src/components/views/SummaryView.js` ✅ (~260 lines)
8. `src/components/views/DataView.js` ✅ (~95 lines)

### Phase 3: Dialog Components ✅ COMPLETE
9. `src/components/dialogs/SettingsModal.js` ✅ (~95 lines)
10. `src/components/dialogs/ContextMenu.js` ✅ (~100 lines)
11. `src/components/dialogs/InputDialog.js` ✅ (~105 lines)
12. `src/components/dialogs/ZMXImportDialog.js` ✅ (~240 lines)
13. `src/components/dialogs/ConversionDialog.js` ✅ (~385 lines)
14. `src/components/dialogs/ConversionResultsDialog.js` ✅ (~490 lines)

### Phase 4: Plot Components ✅ COMPLETE
15. `src/components/plots/Plot3D.js` ✅ (~100 lines)
16. `src/components/plots/Plot2DContour.js` ✅ (~105 lines)
17. `src/components/plots/PlotCrossSection.js` ✅ (~90 lines)

### Helper Files
18. `refactor_script.py` ✅ (automation helper)
19. `REFACTORING.md` ✅ (this document)
20. `REFACTORING_REVIEW.md` ✅ (review document)
21. `PHASE3_COMPLETE.md` ✅ (phase 3 summary)

**Total Progress:** ~2,540 lines extracted from 3,435 lines (~74.0% complete)
**Files Created:** 21 files
**Estimated Remaining Work:** ~15 hours (for remaining phases + testing)

---

**Last Updated:** 2025-11-16
**Author:** AI Assistant (Claude)
