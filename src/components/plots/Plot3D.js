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
export const create3DPlot = (plotRef, selectedSurface, activeTab, colorscale, gridSize = 61, c = null, t = null, zernikeUnit = 'mm', wavelength = 632.8) => {
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

    // Zernike unit scaling: waves or mm
    const isZernike = selectedSurface.type === 'Zernike';
    const useWaves = isZernike && zernikeUnit === 'waves';
    const wavelengthMm = wavelength * 1e-6; // nm -> mm
    const unitScale = useWaves ? (1 / wavelengthMm) : 1;
    const unit = activeTab === 'slope'
        ? translations.summary.units.rad
        : (useWaves ? 'waves' : translations.summary.units.mm);

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
                val = sanitizeValue(val) * unitScale;
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
    const zRange = zMax - zMin;

    // Subtract zMin so the surface is baseline-zeroed for the 3D plot.
    // Without this, a large piston offset (e.g. Z1=1 → ~1580 mm base sag) causes
    // the color variation (~0.002 mm) to be numerically insignificant relative to
    // the absolute z values, producing sharp color banding in WebGL.
    // The z-axis title notes the actual sag offset so information is not lost.
    const zCentered = zSanitized.map(row =>
        row.map(val => val !== null ? val - zMin : null)
    );

    const data = [{
        x: x,
        y: y,
        z: zCentered,
        type: 'surface',
        colorscale: colorscale,
        showscale: true,
        cmin: 0,
        cmax: zRange,
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
                zerolinecolor: gridColor,
                exponentformat: 'none',
                tickformat: '.4f'
            },
            yaxis: {
                title: 'Y (mm)',
                range: [-maxHeight, maxHeight],
                gridcolor: gridColor,
                zerolinecolor: gridColor,
                exponentformat: 'none',
                tickformat: '.4f'
            },
            zaxis: {
                title: zMin !== 0
                    ? `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (${unit}, offset ${zMin.toFixed(4)})`
                    : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (${unit})`,
                range: [0, zRange],
                gridcolor: gridColor,
                zerolinecolor: gridColor,
                exponentformat: 'none',
                tickformat: '.7f'
            },
            bgcolor: colors.bg,
            // Aspect ratio strategy:
            // - Non-sag tabs: cube (uniform)
            // - Zernike sag: fixed thin-slab ratio (0.15) matching interferometer-style presentation.
            //   The true physical ratio (µm Z vs mm XY) would make the surface look like a tall spike.
            //   Interferometers always compress Z visually so wavefront shape reads clearly.
            // - Other sag: physical ratio clamped to [0.05, 1].
            aspectmode: activeTab === 'sag' ? 'manual' : 'cube',
            aspectratio: (() => {
                if (activeTab !== 'sag') return undefined;
                if (isZernike) {
                    // Fixed visual thickness regardless of Z range — matches Zygo/Fizeau style
                    return { x: 1, y: 1, z: 0.15 };
                }
                const zRange = (zMax - zMin) || 0;
                const xyRange = 2 * maxHeight || 1;
                const ratio = zRange / xyRange;
                if (!isFinite(ratio) || ratio < 1e-6) {
                    return { x: 1, y: 1, z: 0.15 };
                }
                return { x: 1, y: 1, z: Math.min(Math.max(ratio, 0.05), 1) };
            })()
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