// PlotCrossSection - Creates cross-section line plot using Plotly
// Plots metric values along a radial line from -maxHeight to +maxHeight

import { calculateSurfaceValues } from '../../utils/calculations.js';

/**
 * Create cross-section line plot
 * @param {Object} plotRef - React ref to plot container
 * @param {Object} selectedSurface - Surface object with type and parameters
 * @param {string} activeTab - Current metric tab (sag, slope, asphericity, aberration)
 */
export const createCrossSection = (plotRef, selectedSurface, activeTab) => {
    const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
    const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
    const step = parseFloat(selectedSurface.parameters['Step']) || 1;
    const x = [], y = [];
    const unit = activeTab === 'slope' ? 'rad' : 'mm';

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
                const scanAngle = parseFloat(selectedSurface.parameters['Scan Angle']) || 0;
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
            y.push(val);
        } else {
            y.push(null);
        }
    }

    const data = [{
        x: x,
        y: y,
        type: 'scatter',
        mode: 'lines',
        line: { color: '#4a90e2', width: 2 }
    }];

    const layout = {
        xaxis: { title: 'Radial Distance (mm)', zeroline: true },
        yaxis: {
            title: `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (${unit})`,
            // For sag tab, maintain 1:1 aspect ratio with radial distance
            scaleanchor: activeTab === 'sag' ? 'x' : undefined,
            scaleratio: activeTab === 'sag' ? 1 : undefined
        },
        paper_bgcolor: '#353535',
        plot_bgcolor: '#2b2b2b',
        font: { color: '#e0e0e0' },
        margin: { l: 60, r: 20, t: 20, b: 60 }
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false
    };

    window.Plotly.newPlot(plotRef.current, data, layout, config);
};
