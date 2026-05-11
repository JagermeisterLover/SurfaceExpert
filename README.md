# SurfaceExpert

Desktop application for analyzing and visualizing optical surface characteristics. Built with Electron and React.

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

<img width="1919" height="1023" alt="surfaceexpert" src="https://github.com/user-attachments/assets/dc9274a8-b7ee-4f0c-a657-aee136ecb538" />

## Features

### Surface Types Support

- **Sphere** - Simple spherical surfaces
- **Even Asphere** - Standard aspheric surfaces with even polynomial terms
- **Odd Asphere** - Aspheric surfaces with odd and even polynomial terms
- **Zernike** - Zernike Fringe Sag surfaces (FZERNSAG) with up to 37 terms
- **Irregular** - IRREGULA surface type with coordinate transformations
- **Opal Un U** - higher order surfaces from OPAL software
- **Opal Un Z** - higher order surfaces from OPAL software
- **Poly** - Pure polynomial surfaces

### Calculated Metrics

- **Sag (z)** - Surface height as a function of radial position
- **Slope (dz/dr)** - First derivative of sag
- **Angle** - Slope converted to degrees
- **Asphericity** - Deviation from best-fit sphere
- **Aberration of Normals** - useful for null lens design (shows deviation from sphere)
- **Best Fit Sphere** - Optimal fitting sphere radius
- **Paraxial F/#** - Paraxial focal ratio
- **Working F/#** - Effective focal ratio based on max slope
- **RMS Error** - Root Mean Square error (Zernike/Irregular)
- **P-V Error** - Peak-to-Valley error (Zernike/Irregular)

### Visualization Tools

- **3D Surface Plots** - Interactive 3D visualization with rotation and zoom
- **2D Contour Maps** - False color heatmaps with customizable colorscales
- **Cross-Section Plots** - Radial cross-section analysis
- **Data Tables** - Detailed tabular data export
- **Summary View** - Comprehensive metrics and analysis

### Advanced Features

- **Zemax ZMX Import** - Import surfaces from Zemax optical design files
  - Supports STANDARD, EVENASPH, ODDASPHE, IRREGULA, FZERNSAG surface types
- **Surface Fitting** - native javascript module for curve fitting or legacy Python-based curve fitting with lmfit library
  - Fit data points to various surface equations
  - Statistical metrics: RMSE, R², AIC, BIC, Chi-square
- **Report Generation** - Export professional HTML and PDF reports
  - Embedded high-resolution plots
  - Complete parameter documentation
  - Summary metrics and data tables
- **Folder Organization** - Hierarchical organization for managing multiple surfaces

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

### Exporting Reports

Generate reports with all calculations and plots:

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

Fit sag data to surface equations (installation of python with lmfit library is required)



## Technical Details

### Tech Stack

- **Framework**: Electron 28.3.3
- **UI Library**: React 18.2.0 (without JSX, using `React.createElement`)
- **Visualization**: Plotly.js 2.27.0
- **Architecture**: Multi-process Electron with IPC communication
- **Language**: Pure JavaScript (ES6 modules, no TypeScript, no transpilation)
- **Styling**: Inline styles with dark theme color palette



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


## License

MIT License - See LICENSE file for details

## Support

For bug reports and feature requests, please create an issue on the project repository.

## Acknowledgments

- Built with Electron and React
- Visualization powered by Plotly.js
- Surface fitting using lmfit library
- Mathematical formulations based on Zemax optical design software conventions

