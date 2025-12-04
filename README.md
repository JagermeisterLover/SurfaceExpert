# SurfaceExpert

Desktop application for analyzing and visualizing optical surface characteristics. Built with Electron and React, this tool provides real-time calculation and visualization of optical surface properties for various surface types used in optical design.

![Version](https://img.shields.io/badge/version-2.9.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)

<img width="1919" height="1023" alt="surfaceexpert" src="https://github.com/user-attachments/assets/dc9274a8-b7ee-4f0c-a657-aee136ecb538" />

## Features

### Surface Types Support

- **Sphere** - Simple spherical surfaces
- **Even Asphere** - Standard aspheric surfaces with even polynomial terms
- **Odd Asphere** - Aspheric surfaces with odd and even polynomial terms
- **Zernike** - Zernike Standard Sag surfaces (FZERNSAG) with up to 37 terms
- **Irregular** - IRREGULA surface type with coordinate transformations
- **Opal Un U** - Specialized iterative optical surfaces
- **Opal Un Z** - Newton-Raphson iterative solver surfaces
- **Poly** - Pure polynomial surfaces

### Calculated Metrics

- **Sag (z)** - Surface height as a function of radial position
- **Slope (dz/dr)** - First derivative of sag
- **Angle** - Slope converted to degrees
- **Asphericity** - Deviation from best-fit sphere
- **Aberration of Normals** - Optical aberration metric
- **Best Fit Sphere** - Optimal fitting sphere radius
- **Paraxial F/#** - Paraxial focal ratio
- **Working F/#** - Effective focal ratio based on max slope
- **RMS Error** - Root Mean Square wavefront error (Zernike/Irregular)
- **P-V Error** - Peak-to-Valley wavefront error (Zernike/Irregular)

### Visualization Tools

- **3D Surface Plots** - Interactive 3D visualization with rotation and zoom
- **2D Contour Maps** - False color heatmaps with customizable colorscales
- **Cross-Section Plots** - Radial cross-section analysis
- **Data Tables** - Detailed tabular data export
- **Summary View** - Comprehensive metrics and analysis

### Advanced Features

- **Zemax ZMX Import** - Import surfaces from Zemax optical design files
  - Supports STANDARD, EVENASPH, ODDASPHE, IRREGULA, FZERNSAG surface types
- **Surface Fitting** - Python-based curve fitting with lmfit library
  - Fit data points to various surface equations
  - Statistical metrics: RMSE, R², AIC, BIC, Chi-square
- **Report Generation** - Export professional HTML and PDF reports
  - Embedded high-resolution plots
  - Complete parameter documentation
  - Summary metrics and data tables
- **Folder Organization** - Hierarchical organization for managing multiple surfaces
- **Settings Persistence** - Customizable colorscales, wavelength, and grid sizes
- **Modern UI** - Custom title bar and menu bar with dark theme

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm (included with Node.js)
- Python 3.7+ (for surface fitting feature)

### Install Dependencies

```bash
npm install
```

### Python Dependencies (Optional - for surface fitting)

```bash
pip install -r requirements.txt
```

## Usage

### Running the Application

**Development mode** (with DevTools):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

### Building Distributables

Build installers for your platform:
```bash
npm run build
```

Outputs will be in the `dist/` directory:
- **Windows**: NSIS installer
- **macOS**: DMG package
- **Linux**: AppImage

## User Guide

### Getting Started

1. **Add a Surface**: Click "Add Surface" or press `Ctrl+Shift+A`
2. **Select Surface Type**: Choose from the dropdown menu
3. **Enter Parameters**: Input your surface parameters in the properties panel
4. **View Results**: Switch between visualization tabs (3D, 2D, Cross-Section, Data, Summary)

### Managing Surfaces

- **Create New**: `Ctrl+N` - Add a new surface
- **Remove**: `Delete` - Remove the selected surface
- **Switch**: Click on surface name in the list
- **Organize**: Use folders to group related surfaces

### Importing from Zemax

1. **File → Import ZMX File** (or `Ctrl+O`)
2. Select your `.zmx` file
3. Choose which surfaces to import
4. Surfaces are automatically converted and added to your project

### Exporting Reports

Generate professional reports with all calculations and plots:

- **HTML Report**: `Ctrl+E` or File → Export HTML Report
- **PDF Report**: `Ctrl+P` or File → Export PDF Report

Reports include:
- Surface parameters
- Summary metrics (F/#, BFS, RMS/P-V errors)
- High-resolution plots (3D, 2D, cross-section)
- Complete data tables

### Settings

Access settings via `Ctrl+,` or View → Settings:

- **Plot Colorscale**: Choose from 12 color maps (Viridis, Jet, Hot, Cool, etc.)
- **Reference Wavelength**: Set wavelength for RMS/P-V calculations (default: 632.8 nm)
- **Grid Sizes**: Customize 3D and 2D plot calculation density

### Surface Fitting

Fit experimental data to surface equations:

1. Prepare data in `tempsurfacedata.txt` (r, z pairs)
2. Configure `ConvertSettings.txt` with fitting parameters
3. Run Python fitter: `python src/surfaceFitter.py`
4. Review results in `FitReport.txt` and `FitMetrics.txt`

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New Surface |
| `Ctrl+Shift+A` | Add Surface |
| `Delete` | Remove Surface |
| `F5` | Recalculate All |
| `Ctrl+E` | Export HTML Report |
| `Ctrl+P` | Export PDF Report |
| `Ctrl+,` | Settings |
| `Ctrl+Shift+I` | Toggle DevTools |

## Technical Details

### Tech Stack

- **Framework**: Electron 28.3.3
- **UI Library**: React 18.2.0 (without JSX, using `React.createElement`)
- **Visualization**: Plotly.js 2.27.0
- **Architecture**: Multi-process Electron with IPC communication
- **Language**: Pure JavaScript (ES6 modules, no TypeScript, no transpilation)
- **Styling**: Inline styles with dark theme color palette

### Project Structure

```
SurfaceExpert/
├── src/
│   ├── main.js                    # Electron main process
│   ├── preload.js                 # Context isolation bridge
│   ├── renderer-modular.js        # React application
│   ├── calculationsWrapper.js     # Surface calculation engine
│   ├── zmxParser.js               # Zemax ZMX file parser
│   ├── calculations.py            # Python reference implementation
│   ├── surfaceFitter.py           # Surface equation fitter
│   ├── index.html                 # Entry point HTML
│   ├── styles.css                 # Global CSS styles
│   ├── components/                # React components (19 files)
│   │   ├── TitleBar.js
│   │   ├── MenuBar.js
│   │   ├── Icons.js
│   │   ├── dialogs/               # Modal dialogs (7 files)
│   │   ├── plots/                 # Plot generators (3 files)
│   │   ├── ui/                    # UI components (4 files)
│   │   └── views/                 # View components (2 files)
│   ├── constants/                 # Application constants (3 files)
│   │   ├── surfaceTypes.js
│   │   ├── colorscales.js
│   │   └── colorPalettes.js
│   └── utils/                     # Utility functions (3 files)
│       ├── calculations.js
│       ├── formatters.js
│       └── reportGenerator.js
├── package.json
├── requirements.txt
├── README.md                       # This file
└── CLAUDE.md                       # Developer documentation
```

### Performance Characteristics

- **3D Plots**: 60×60 grid (3,600 calculations) - adjustable
- **2D Contour**: 100×100 grid (10,000 calculations) - adjustable
- **Cross-Section**: 100 points
- **Best-Fit Sphere Caching**: Automatic caching for faster asphericity calculations

## Development

### Development Mode

Run with DevTools enabled:
```bash
npm run dev
```

### Code Organization

The application uses a modular ES6 architecture with clear separation of concerns:

- **Components**: Reusable React UI components
- **Constants**: Surface type definitions and configuration
- **Utils**: Pure utility functions for calculations and formatting
- **Dialogs**: Modal dialogs for user interactions
- **Plots**: Plotly visualization generators

### Testing

Manual testing checklist and test files:
- `test_irregular.html` - Test suite for Irregular surface calculations
- `test_precision.js` - Precision testing for surface calculations
- `test_zemax_comparison.js` - Zemax comparison tests

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork: `git push origin feature/my-feature`
6. Create a Pull Request

See `CLAUDE.md` for detailed developer documentation.

## Recent Updates

### Version 2.4.0 (2025-11-23)
- Custom title bar and menu bar for modern UI
- Settings persistence (colorscale, wavelength, grid sizes)
- NormalizeUnZDialog for Opal Un Z surface transformations
- Improved component modularity

### Version 2.3.0 (2025-11-20)
- RMS and P-V wavefront error calculations for Zernike and Irregular surfaces
- Wavelength setting for error calculations
- Enhanced report visualization

### Version 2.2.0 (2025-11-18)
- HTML and PDF report generation
- Modular ES6 architecture
- DebouncedInput component for better UX

### Version 2.1.0 (2025-11)
- ZMX file import support
- Surface fitting with Python/lmfit
- Folder organization system

## License

MIT License - See LICENSE file for details

## Support

For bug reports and feature requests, please create an issue on the project repository.

## Acknowledgments

- Built with Electron and React
- Visualization powered by Plotly.js
- Surface fitting using lmfit library
- Mathematical formulations based on Zemax optical design software conventions

---

**Version**: 2.4.0
**Last Updated**: November 2025
