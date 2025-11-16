// Plot2DContour - Creates 2D false color map using Plotly scatter plot
// Generates a 100x100 grid with color-coded markers

import { calculateSurfaceValues } from '../../utils/calculations.js';

/**
 * Create 2D contour/false color map
 * @param {Object} plotRef - React ref to plot container
 * @param {Object} selectedSurface - Surface object with type and parameters
 * @param {string} activeTab - Current metric tab (sag, slope, asphericity, aberration)
 * @param {string} colorscale - Plotly colorscale name
 * @param {Object} c - Color scheme object
 */
export const create2DContour = (plotRef, selectedSurface, activeTab, colorscale, c) => {
    const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
    const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
    const size = 100;

    // Generate grid data
    const gridData = [];
    for (let i = 0; i < size; i++) {
        const xi = -maxHeight + (i * (2 * maxHeight)) / (size - 1);
        const row = [];
        for (let j = 0; j < size; j++) {
            const yj = -maxHeight + (j * (2 * maxHeight)) / (size - 1);
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
            } else {
                row.push(null);
            }
        }
        gridData.push(row);
    }

    // Convert grid to scatter points with color mapping
    const x = [], y = [], color = [], hovertext = [];
    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            if (gridData[i][j] !== null) {
                const xi = -maxHeight + (i * (2 * maxHeight)) / (size - 1);
                const yj = -maxHeight + (j * (2 * maxHeight)) / (size - 1);
                x.push(xi);
                y.push(yj);
                color.push(gridData[i][j]);
                hovertext.push(`X: ${xi.toFixed(2)}<br>Y: ${yj.toFixed(2)}<br>${activeTab}: ${gridData[i][j].toFixed(6)}`);
            }
        }
    }

    const zMin = Math.min(...color);
    const zMax = Math.max(...color);
    const unit = activeTab === 'slope' ? 'rad' : 'mm';

    const data = [{
        x, y,
        mode: 'markers',
        type: 'scatter',
        marker: {
            size: 6,
            color,
            colorscale: colorscale,
            showscale: true,
            cmin: zMin,
            cmax: zMax,
            colorbar: {
                title: `${activeTab}<br>(${unit})`,
                thickness: 15,
                len: 0.7
            }
        },
        text: hovertext,
        hoverinfo: 'text',
        showlegend: false
    }];

    const layout = {
        title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} False Color Map`,
        xaxis: { title: 'X (mm)', scaleanchor: 'y', scaleratio: 1 },
        yaxis: { title: 'Y (mm)', scaleanchor: 'x', scaleratio: 1 },
        paper_bgcolor: c.panel,
        plot_bgcolor: c.bg,
        font: { color: c.text },
        margin: { l: 60, r: 120, t: 60, b: 60 }
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false
    };

    window.Plotly.newPlot(plotRef.current, data, layout, config);
};
