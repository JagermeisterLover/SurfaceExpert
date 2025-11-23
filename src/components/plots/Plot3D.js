// Plot3D - Creates 3D surface plot using Plotly
// Generates a 60x60 grid with surface visualization, contours, and Z-axis projection

import { calculateSurfaceValues } from '../../utils/calculations.js';

/**
 * Create 3D surface plot
 * @param {Object} plotRef - React ref to plot container
 * @param {Object} selectedSurface - Surface object with type and parameters
 * @param {string} activeTab - Current metric tab (sag, slope, asphericity, aberration)
 * @param {string} colorscale - Plotly colorscale name
 * @param {number} gridSize - Grid size (odd number to ensure point at 0)
 * @param {Object} c - Color palette object
 */
export const create3DPlot = (plotRef, selectedSurface, activeTab, colorscale, gridSize = 61, c = null) => {
    // Default colors if palette not provided
    const colors = c || {
        bg: '#2b2b2b',
        panel: '#353535',
        text: '#e0e0e0'
    };
    const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
    const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
    const size = gridSize;
    const unit = activeTab === 'slope' ? 'rad' : 'mm';

    // Create coordinate arrays
    const x = [], y = [];
    for (let i = 0; i < size; i++) {
        x.push(-maxHeight + (i * (2 * maxHeight)) / (size - 1));
        y.push(-maxHeight + (i * (2 * maxHeight)) / (size - 1));
    }

    // Generate full grid data for 3D plot
    const z = [];
    const validValues = [];

    for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
            const xi = x[i];
            const yj = y[j];
            const r = Math.sqrt(xi * xi + yj * yj);

            if (r >= minHeight && r <= maxHeight) {
                // For non-rotationally symmetric surfaces (Zernike, Irregular), pass x,y coordinates; for others use r
                const values = (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike')
                    ? calculateSurfaceValues(r, selectedSurface, xi, yj)
                    : calculateSurfaceValues(r, selectedSurface);
                let val = 0;
                if (activeTab === 'sag') val = values.sag;
                else if (activeTab === 'slope') val = values.slope;
                else if (activeTab === 'asphericity') val = values.asphericity;
                else if (activeTab === 'aberration') val = values.aberration;
                row.push(val);
                validValues.push(val);
            } else {
                row.push(null);
            }
        }
        z.push(row);
    }

    // Use iterative min/max to avoid stack overflow with large arrays
    let zMin = Infinity;
    let zMax = -Infinity;
    for (let i = 0; i < validValues.length; i++) {
        if (validValues[i] < zMin) zMin = validValues[i];
        if (validValues[i] > zMax) zMax = validValues[i];
    }

    const data = [{
        x: x,
        y: y,
        z: z,
        type: 'surface',
        colorscale: colorscale,
        showscale: true,
        contours: {
            z: {
                show: true,
                usecolormap: true,
                highlightcolor: "#42f462",
                project: { z: true }
            }
        }
    }];

    const layout = {
        scene: {
            camera: {
                eye: { x: 1.5, y: 1.5, z: 1.5 }
            },
            xaxis: { title: 'X (mm)', range: [-maxHeight, maxHeight] },
            yaxis: { title: 'Y (mm)', range: [-maxHeight, maxHeight] },
            zaxis: { title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (${unit})`, range: [zMin, zMax] },
            bgcolor: colors.bg,
            // For sag tab, use manual aspect ratio to maintain 1:1 scale for X:Y
            // For other tabs, use cube mode for uniform scaling
            aspectmode: activeTab === 'sag' ? 'manual' : 'cube',
            aspectratio: activeTab === 'sag' ? { x: 1, y: 1, z: (zMax - zMin) / (2 * maxHeight) } : undefined
        },
        paper_bgcolor: colors.panel,
        plot_bgcolor: colors.panel,
        font: { color: colors.text },
        margin: { l: 0, r: 0, t: 0, b: 0 }
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false
    };

    window.Plotly.newPlot(plotRef.current, data, layout, config);
};
