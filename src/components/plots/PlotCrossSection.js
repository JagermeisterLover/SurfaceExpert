// PlotCrossSection - Creates cross-section line plot using Plotly
// Plots metric values along a radial line from -maxHeight to +maxHeight

import { calculateSurfaceValues } from '../../utils/calculations.js';
import { sanitizeValue, sanitizeArray1D, safePlotlyNewPlot } from '../../utils/dataSanitization.js';
import { getGridColor } from '../../constants/colorPalettes.js';
import { parseNumber } from '../../utils/numberParsing.js';

/**
 * Create cross-section line plot
 * @param {Object} plotRef - React ref to plot container
 * @param {Object} selectedSurface - Surface object with type and parameters
 * @param {string} activeTab - Current metric tab (sag, slope, asphericity, aberration)
 * @param {Object} c - Color palette object
 * @param {Object} t - Locale translations object
 */
export const createCrossSection = (plotRef, selectedSurface, activeTab, c = null, t = null, zernikeUnit = 'mm', wavelength = 632.8) => {
    // Default colors if palette not provided
    const colors = c || {
        bg: '#2b2b2b',
        panel: '#353535',
        text: '#e0e0e0',
        accent: '#4a90e2'
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
    const step = parseNumber(selectedSurface.parameters['Step']);
    const x = [], y = [];

    const isZernike = selectedSurface.type === 'Zernike';
    const useWaves = isZernike && zernikeUnit === 'waves';
    const wavelengthMm = wavelength * 1e-6; // nm -> mm
    const unitScale = useWaves ? (1 / wavelengthMm) : 1;
    const unit = activeTab === 'slope'
        ? translations.summary.units.rad
        : (useWaves ? 'waves' : translations.summary.units.mm);

    // Plot from -maxHeight to +maxHeight (diameter) using step
    // Build array of r values, ensuring we always include minHeight and maxHeight
    const rValues = [];
    for (let r = -maxHeight; r < maxHeight; r += step) {
        rValues.push(r);
    }
    // Always include maxHeight endpoint
    if (rValues[rValues.length - 1] !== maxHeight) {
        rValues.push(maxHeight);
    }

    for (const r of rValues) {
        x.push(r);

        const absR = Math.abs(r);
        if (absR >= minHeight && absR <= maxHeight) {
            // For non-rotationally symmetric surfaces (Zernike, Irregular), use scan angle to determine direction
            let values;
            if (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike') {
                const scanAngle = parseNumber(selectedSurface.parameters['Scan Angle']);
                const scanAngleRad = scanAngle * Math.PI / 180;
                const xCoord = r * Math.cos(scanAngleRad);
                const yCoord = r * Math.sin(scanAngleRad);
                values = calculateSurfaceValues(absR, selectedSurface, xCoord, yCoord);
            } else {
                values = calculateSurfaceValues(absR, selectedSurface);
            }
            let val = 0;
            if (activeTab === 'sag') val = values.sag;
            else if (activeTab === 'slope') val = values.slope;
            else if (activeTab === 'asphericity') val = values.asphericity;
            else if (activeTab === 'aberration') val = values.aberration;

            // Sanitize value to prevent WebGL errors
            val = sanitizeValue(val) * unitScale;
            y.push(val);
        } else {
            y.push(null);
        }
    }

    // Sanitize the entire y array (additional safety check)
    const ySanitized = sanitizeArray1D(y);

    const data = [{
        x: x,
        y: ySanitized,
        type: 'scatter',
        mode: 'lines',
        line: { color: colors.accent, width: 2 }
    }];

    const gridColor = getGridColor(colors);

    const layout = {
        xaxis: {
            title: 'Radial Distance (mm)',
            zeroline: true,
            gridcolor: gridColor,
            zerolinecolor: gridColor,
            exponentformat: 'none',
            tickformat: '.4f'
        },
        yaxis: {
            title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (${unit})`,
            // For sag on non-Zernike: maintain 1:1 aspect with radial distance (physically meaningful)
            // For Zernike with R=0: tiny sag vs mm-scale X — DON'T force 1:1 or irregularities are invisible
            scaleanchor: (activeTab === 'sag' && !isZernike) ? 'x' : undefined,
            scaleratio: (activeTab === 'sag' && !isZernike) ? 1 : undefined,
            gridcolor: gridColor,
            zerolinecolor: gridColor,
            exponentformat: 'none',
            tickformat: '.7f'
        },
        paper_bgcolor: colors.panel,
        plot_bgcolor: colors.bg,
        font: { color: colors.text },
        margin: { l: 60, r: 20, t: 20, b: 60 }
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false
    };

    safePlotlyNewPlot(plotRef.current, data, layout, config).catch(err => {
        console.error('Failed to render cross-section plot:', err);
    });
};
