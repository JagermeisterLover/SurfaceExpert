// Plot2DHeatmap - Creates 2D heatmap using Plotly's native heatmap type
// Generates a grid with proper heatmap visualization

import { calculateSurfaceValues } from '../../utils/calculations.js';
import { sanitizeValue, sanitizeArray2D, safePlotlyNewPlot } from '../../utils/dataSanitization.js';
import { getGridColor } from '../../constants/colorPalettes.js';
import { parseNumber } from '../../utils/numberParsing.js';

/**
 * Create 2D heatmap
 * @param {Object} plotRef - React ref to plot container
 * @param {Object} selectedSurface - Surface object with type and parameters
 * @param {string} activeTab - Current metric tab (sag, slope, asphericity, aberration)
 * @param {string} colorscale - Plotly colorscale name
 * @param {Object} c - Color scheme object
 * @param {number} gridSize - Grid size (odd number to ensure point at 0)
 * @param {Object} t - Locale translations object
 */
export const create2DHeatmap = (plotRef, selectedSurface, activeTab, colorscale, c, gridSize = 101, t = null) => {
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

    // Generate coordinate arrays
    const x = [];
    const y = [];
    for (let i = 0; i < size; i++) {
        const coord = -maxHeight + (i * (2 * maxHeight)) / (size - 1);
        x.push(coord);
        y.push(coord);
    }

    // Generate Z grid data
    const z = [];
    for (let j = 0; j < size; j++) {
        const yj = y[j];
        const row = [];
        for (let i = 0; i < size; i++) {
            const xi = x[i];
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
            } else {
                row.push(null);
            }
        }
        z.push(row);
    }

    // Sanitize the entire z array (additional safety check)
    const zSanitized = sanitizeArray2D(z);

    const unit = activeTab === 'slope' ? translations.summary.units.rad : translations.summary.units.mm;

    const data = [{
        x: x,
        y: y,
        z: zSanitized,
        type: 'heatmap',
        colorscale: colorscale,
        colorbar: {
            title: `${activeTab}<br>(${unit})`,
            thickness: 15,
            len: 0.7
        },
        hoverongaps: false,
        hovertemplate: `X: %{x:.2f} ${translations.summary.units.mm}<br>Y: %{y:.2f} ${translations.summary.units.mm}<br>` +
                       activeTab + ': %{z:.6f}<extra></extra>'
    }];

    const gridColor = getGridColor(c);

    const layout = {
        title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Heatmap`,
        xaxis: {
            title: 'X (mm)',
            scaleanchor: 'y',
            scaleratio: 1,
            constrain: 'domain',
            gridcolor: gridColor,
            zerolinecolor: gridColor
        },
        yaxis: {
            title: 'Y (mm)',
            constrain: 'domain',
            gridcolor: gridColor,
            zerolinecolor: gridColor
        },
        paper_bgcolor: c.panel,
        plot_bgcolor: c.bg,
        font: { color: c.text },
        margin: { l: 60, r: 120, t: 60, b: 60 }
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        scrollZoom: true
    };

    safePlotlyNewPlot(plotRef.current, data, layout, config).catch(err => {
        console.error('Failed to render 2D heatmap:', err);
    });
};
