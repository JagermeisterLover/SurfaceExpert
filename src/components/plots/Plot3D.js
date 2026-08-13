// Plot3D - Creates 3D surface plot using Plotly
// Generates a 60x60 grid with surface visualization, contours, and Z-axis projection

import { calculateSurfaceValues } from '../../utils/calculations.js';
import { sanitizeValue, sanitizeArray2D, getSafeBounds, safePlotlyNewPlot } from '../../utils/dataSanitization.js';
import { getGridColor } from '../../constants/colorPalettes.js';
import { parseNumber } from '../../utils/numberParsing.js';
import { resolveColorscale } from '../../constants/colorscales.js';

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
        : (useWaves ? (translations.summary.units.waves || 'waves') : translations.summary.units.mm);

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

    const metricLabel = t?.visualization?.tabs?.[activeTab]
        || activeTab.charAt(0).toUpperCase() + activeTab.slice(1);

    // Tick precision follows the magnitude of the range being shown. A
    // wavefront in waves spans hundreds, while a sag in mm is often a few
    // microns; one fixed precision either drops the small case to zero or
    // prints seven meaningless decimals on the large one.
    const zDecimals = zRange >= 100 ? 0
        : zRange >= 1 ? 2
        : zRange >= 0.01 ? 4
        : 7;

    // Aspect ratio strategy:
    // - Non-sag tabs: cube (uniform)
    // - Zernike sag: fixed thin-slab ratio (0.15) matching interferometer-style
    //   presentation. The true physical ratio (µm Z vs mm XY) would make the
    //   surface look like a tall spike; interferometers always compress Z
    //   visually so wavefront shape reads clearly.
    // - Other sag: physical ratio clamped to [0.05, 1].
    const zAspect = (() => {
        if (activeTab !== 'sag') return 1;
        if (isZernike) return 0.15;
        const xyRange = 2 * maxHeight || 1;
        const ratio = zRange / xyRange;
        if (!isFinite(ratio) || ratio < 1e-6) return 0.15;
        return Math.min(Math.max(ratio, 0.05), 1);
    })();

    // The flattened views leave only a sliver of vertical space, so the default
    // tick count collides with itself. Scale the count to the visible height.
    const zTickCount = zAspect <= 0.1 ? 2 : zAspect <= 0.2 ? 3 : 6;

    // Z data is plotted baseline-zeroed, so raw tick values are offsets. Label
    // both the axis and the colorbar with the true values instead, which keeps
    // them honest without needing an explanatory title.
    const zTickVals = [];
    const zTickText = [];
    for (let i = 0; i < zTickCount; i++) {
        const v = zTickCount === 1 ? 0 : (zRange * i) / (zTickCount - 1);
        zTickVals.push(v);
        zTickText.push((v + zMin).toFixed(zDecimals));
    }

    const data = [{
        x: x,
        y: y,
        z: zCentered,
        type: 'surface',
        colorscale: resolveColorscale(colorscale),
        showscale: true,
        // Kept short and anchored below centre so the bar clears the modebar,
        // which Plotly pins to the top-right corner of the plot area.
        colorbar: {
            // Plotly 3 requires the object form; a bare string is ignored.
            title: { text: unit, font: { size: 11 } },
            thickness: 12,
            len: 0.62,
            x: 1.0,
            xanchor: 'left',
            y: 0.44,
            yanchor: 'middle',
            tickfont: { size: 10 },
            bgcolor: 'rgba(0,0,0,0)',
            borderwidth: 0,
            outlinewidth: 0,
            exponentformat: 'none',
            tickmode: 'array',
            tickvals: zTickVals,
            ticktext: zTickText
        },
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
                title: { text: 'x' },
                range: [-maxHeight, maxHeight],
                gridcolor: gridColor,
                zerolinecolor: gridColor,
                exponentformat: 'none',
                tickformat: '.4f'
            },
            yaxis: {
                title: { text: 'y' },
                range: [-maxHeight, maxHeight],
                gridcolor: gridColor,
                zerolinecolor: gridColor,
                exponentformat: 'none',
                tickformat: '.4f'
            },
            zaxis: {
                title: { text: 'z' },
                range: [0, zRange],
                gridcolor: gridColor,
                zerolinecolor: gridColor,
                exponentformat: 'none',
                tickmode: 'array',
                tickvals: zTickVals,
                ticktext: zTickText
            },
            bgcolor: 'rgba(0,0,0,0)',
            aspectmode: activeTab === 'sag' ? 'manual' : 'cube',
            aspectratio: activeTab === 'sag' ? { x: 1, y: 1, z: zAspect } : undefined
        },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: colors.text },
        // Right margin reserves room for the colorbar and its tick labels;
        // with no margin they render hard against the panel edge and can end
        // up under the scrollbar.
        margin: { l: 0, r: 80, t: 0, b: 0 }
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