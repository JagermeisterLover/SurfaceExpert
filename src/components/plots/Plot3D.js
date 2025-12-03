// Plot3D - Creates 3D surface plot using Plotly
// Generates a 60x60 grid with surface visualization, contours, and Z-axis projection

import { calculateSurfaceValues } from '../../utils/calculations.js';
import { sanitizeValue, sanitizeArray2D, getSafeBounds, safePlotlyNewPlot } from '../../utils/dataSanitization.js';
import { getGridColor } from '../../constants/colorPalettes.js';
import { parseNumber } from '../../utils/numberParsing.js';

/**
 * Create 3D surface plot
 * @param {Object} plotRef - React ref to plot container
 * @param {Object} selectedSurface - Surface object with type and parameters
 * @param {string} activeTab - Current metric tab (sag, slope, asphericity, aberration)
 * @param {string} colorscale - Plotly colorscale name
 * @param {number} gridSize - Grid size (odd number to ensure point at 0)
 * @param {Object} c - Color palette object
 * @param {Object} t - Locale translations object
 */
export const create3DPlot = (plotRef, selectedSurface, activeTab, colorscale, gridSize = 61, c = null, t = null) => {
    // Default colors if palette not provided
    const colors = c || {
        bg: '#2b2b2b',
        panel: '#353535',
        text: '#e0e0e0'
    };
    // Default translations if not provided
    const translations = t || {
        summary: {
            units: {
                mm: 'mm',
                rad: 'rad'
            }
        }
    };
    const minHeight = parseNumber(selectedSurface.parameters['Min Height']);
    const maxHeight = parseNumber(selectedSurface.parameters['Max Height']);
    const size = gridSize;
    const unit = activeTab === 'slope' ? translations.summary.units.rad : translations.summary.units.mm;

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

                // Sanitize value to prevent WebGL errors
                val = sanitizeValue(val);
                row.push(val);
                validValues.push(val);
            } else {
                row.push(null);
            }
        }
        z.push(row);
    }

    // Sanitize the entire z array (additional safety check)
    const zSanitized = sanitizeArray2D(z);

    // Get safe bounds from valid values
    const bounds = getSafeBounds(validValues);
    const zMin = bounds.min;
    const zMax = bounds.max;

    const data = [{
        x: x,
        y: y,
        z: zSanitized,
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

    const gridColor = getGridColor(colors);

    const layout = {
        scene: {
            camera: {
                eye: { x: 1.5, y: 1.5, z: 1.5 }
            },
            xaxis: {
                title: 'X (mm)',
                range: [-maxHeight, maxHeight],
                gridcolor: gridColor,
                zerolinecolor: gridColor
            },
            yaxis: {
                title: 'Y (mm)',
                range: [-maxHeight, maxHeight],
                gridcolor: gridColor,
                zerolinecolor: gridColor
            },
            zaxis: {
                title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (${unit})`,
                range: [zMin, zMax],
                gridcolor: gridColor,
                zerolinecolor: gridColor
            },
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

    safePlotlyNewPlot(plotRef.current, data, layout, config).catch(err => {
        console.error('Failed to render 3D plot:', err);
    });
};
