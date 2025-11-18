/**
 * Report Generator Utility - Compact Professional Version
 * Generates HTML and PDF reports with surface data, equations, and plots
 */

import { formatValue, degreesToDMS } from './formatters.js';

/**
 * Get LaTeX equation for surface type
 */
const getSurfaceEquation = (surfaceType) => {
    const equations = {
        'Sphere': 'z = R - \\sqrt{R^2 - r^2}',
        'Even Asphere': 'z = \\frac{cr^2}{1 + \\sqrt{1-(1+k)c^2r^2}} + \\sum_{i=2}^{10} A_{2i}r^{2i}',
        'Odd Asphere': 'z = \\frac{cr^2}{1 + \\sqrt{1-(1+k)c^2r^2}} + \\sum_{i=1}^{10} A_i r^i',
        'Zernike': 'z = \\frac{cr^2}{1 + \\sqrt{1-(1+k)c^2r^2}} + \\sum_{i=1}^{8} A_{2i} r^{2i} + \\sum_{i=1}^{N} Z_i \\psi_i(\\rho, \\phi)',
        'Irregular': 'z = \\frac{cr^2}{1+\\sqrt{1-(1+k)c^2r^2}} + Z_s\\rho^4 + Z_a\\rho_y\'^2 + Z_c\\rho^2\\rho_y\'',
        'Opal Un U': 'z = \\frac{y^2 + (1-e^2)z^2}{2R} + A_2\\left(\\frac{y^2}{H^2}\\right)^2 + A_3\\left(\\frac{y^2}{H^2}\\right)^3 + \\cdots',
        'Opal Un Z': 'z = \\frac{y^2 + (1-e^2)z^2}{2R} + A_3\\left(\\frac{z}{H}\\right)^3 + A_4\\left(\\frac{z}{H}\\right)^4 + A_5\\left(\\frac{z}{H}\\right)^5 + \\cdots',
        'Poly': 'y^2 = A_1z + A_2z^2 + A_3z^3 + A_4z^4 + \\cdots \\quad (A_1 = 2R,\\, A_2 = e^2 - 1)'
    };
    return equations[surfaceType] || '';
};

/**
 * Get Zernike polynomial terms table
 */
const getZernikeTermsTable = () => {
    const terms = [
        ['1', '1'],
        ['2', '\\rho\\cos\\phi'],
        ['3', '\\rho\\sin\\phi'],
        ['4', '2\\rho^2 - 1'],
        ['5', '\\rho^2\\cos2\\phi'],
        ['6', '\\rho^2\\sin2\\phi'],
        ['7', '(3\\rho^2 - 2)\\rho\\cos\\phi'],
        ['8', '(3\\rho^2 - 2)\\rho\\sin\\phi'],
        ['9', '6\\rho^4 - 6\\rho^2 + 1'],
        ['10', '\\rho^3\\cos3\\phi'],
        ['11', '\\rho^3\\sin3\\phi'],
        ['12', '(4\\rho^2 - 3)\\rho^2\\cos2\\phi'],
        ['13', '(4\\rho^2 - 3)\\rho^2\\sin2\\phi'],
        ['14', '(10\\rho^4 - 12\\rho^2 + 3)\\rho\\cos\\phi'],
        ['15', '(10\\rho^4 - 12\\rho^2 + 3)\\rho\\sin\\phi'],
        ['16', '20\\rho^6 - 30\\rho^4 + 12\\rho^2 - 1'],
        ['17', '\\rho^4\\cos4\\phi'],
        ['18', '\\rho^4\\sin4\\phi'],
        ['19', '(5\\rho^2 - 4)\\rho^3\\cos3\\phi'],
        ['20', '(5\\rho^2 - 4)\\rho^3\\sin3\\phi'],
        ['21', '(15\\rho^4 - 20\\rho^2 + 6)\\rho^2\\cos2\\phi'],
        ['22', '(15\\rho^4 - 20\\rho^2 + 6)\\rho^2\\sin2\\phi'],
        ['23', '(35\\rho^6 - 60\\rho^4 + 30\\rho^2 - 4)\\rho\\cos\\phi'],
        ['24', '(35\\rho^6 - 60\\rho^4 + 30\\rho^2 - 4)\\rho\\sin\\phi'],
        ['25', '70\\rho^8 - 140\\rho^6 + 90\\rho^4 - 20\\rho^2 + 1'],
        ['26', '\\rho^5\\cos5\\phi'],
        ['27', '\\rho^5\\sin5\\phi'],
        ['28', '(6\\rho^2 - 5)\\rho^4\\cos4\\phi'],
        ['29', '(6\\rho^2 - 5)\\rho^4\\sin4\\phi'],
        ['30', '(21\\rho^4 - 30\\rho^2 + 10)\\rho^3\\cos3\\phi'],
        ['31', '(21\\rho^4 - 30\\rho^2 + 10)\\rho^3\\sin3\\phi'],
        ['32', '(56\\rho^6 - 105\\rho^4 + 60\\rho^2 - 10)\\rho^2\\cos2\\phi'],
        ['33', '(56\\rho^6 - 105\\rho^4 + 60\\rho^2 - 10)\\rho^2\\sin2\\phi'],
        ['34', '(126\\rho^8 - 280\\rho^6 + 210\\rho^4 - 60\\rho^2 + 5)\\rho\\cos\\phi'],
        ['35', '(126\\rho^8 - 280\\rho^6 + 210\\rho^4 - 60\\rho^2 + 5)\\rho\\sin\\phi'],
        ['36', '252\\rho^{10} - 630\\rho^8 + 560\\rho^6 - 210\\rho^4 + 30\\rho^2 - 1'],
        ['37', '924\\rho^{12} - 2772\\rho^{10} + 3150\\rho^8 - 1680\\rho^6 + 420\\rho^4 - 42\\rho^2 + 1']
    ];

    let html = '<div class="zernike-table" style="margin: 12px 0;"><div class="section-title" style="font-size: 11pt; margin-bottom: 8px;">Zernike Polynomial Terms</div>';
    html += '<table class="params-table"><tr><th>Term i</th><th>ψ<sub>i</sub>(ρ, φ)</th></tr>';

    for (const [num, formula] of terms) {
        html += `<tr><td style="text-align: center;">${num}</td><td>$${formula}$</td></tr>`;
    }

    html += '</table></div>';
    return html;
};

/**
 * Get additional notes for specific surface types
 */
const getSurfaceNotes = (surfaceType) => {
    const notes = {
        'Irregular': `<div class="surface-notes" style="margin: 12px 0; padding: 8px; background: #f9f9f9; border-left: 3px solid #666; font-size: 9pt;">
            <strong>Note:</strong> ρ<sub>x</sub> = x/r<sub>max</sub>, ρ<sub>y</sub> = y/r<sub>max</sub>, ρ = √(ρ<sub>x</sub>² + ρ<sub>y</sub>²), ρ'<sub>y</sub> = ρ<sub>y</sub>cosθ - ρ<sub>x</sub>sinθ<br>
            Z<sub>s</sub>, Z<sub>a</sub>, Z<sub>c</sub> represent spherical aberration, astigmatism, and coma coefficients.
            The surface is decentered, tilted about x then y, ray traced, then untilted and undecentered.
        </div>`
    };
    return notes[surfaceType] || '';
};

/**
 * Generate complete HTML report for a surface
 */
export const generateHTMLReport = (surface, plotData, summaryMetrics, plotImages) => {
    const timestamp = new Date().toLocaleString();
    const equation = getSurfaceEquation(surface.type);
    const notes = getSurfaceNotes(surface.type);
    const zernikeTable = surface.type === 'Zernike' ? getZernikeTermsTable() : '';

    // Determine which metrics to show based on surface type
    const showAsphericity = surface.type !== 'Sphere';
    const showAberration = surface.type !== 'Sphere' && surface.type !== 'Irregular' && surface.type !== 'Zernike';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Surface Report - ${surface.name}</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-AMS_HTML"></script>
    <script type="text/x-mathjax-config">
        MathJax.Hub.Config({
            tex2jax: {inlineMath: [['$','$'], ['\\\\(','\\\\)']]}
        });
    </script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            font-size: 11pt;
            line-height: 1.4;
            color: #000;
            background: #fff;
            padding: 15mm;
        }

        .header {
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }

        .header h1 {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 4px;
        }

        .header .info {
            font-size: 10pt;
            color: #333;
        }

        .equation {
            background: #f5f5f5;
            border-left: 3px solid #666;
            padding: 8px 12px;
            margin: 12px 0;
            font-size: 12pt;
        }

        .section {
            margin-bottom: 16px;
            page-break-inside: avoid;
        }

        .section-title {
            font-size: 12pt;
            font-weight: bold;
            border-bottom: 1px solid #ccc;
            padding-bottom: 3px;
            margin-bottom: 8px;
        }

        .params-table, .metrics-table, .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9pt;
            margin-bottom: 12px;
        }

        .params-table th, .metrics-table th, .data-table th {
            background: #e0e0e0;
            padding: 4px 6px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #999;
        }

        .params-table td, .metrics-table td, .data-table td {
            padding: 3px 6px;
            border: 1px solid #ccc;
        }

        .params-table tr:nth-child(even),
        .metrics-table tr:nth-child(even),
        .data-table tr:nth-child(even) {
            background: #f9f9f9;
        }

        .plot-container {
            margin: 12px 0;
            text-align: center;
            page-break-inside: avoid;
        }

        .plot-container img {
            max-width: 100%;
            height: auto;
            border: 1px solid #ccc;
        }

        .plot-title {
            font-weight: bold;
            font-size: 10pt;
            margin-bottom: 6px;
        }

        .two-column {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
        }

        @media print {
            body {
                padding: 10mm;
            }
            .section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${surface.name}</h1>
        <div class="info">
            <strong>Surface Type:</strong> ${surface.type} &nbsp;|&nbsp;
            <strong>Generated:</strong> ${timestamp}
        </div>
    </div>

    <div class="equation">
        <strong>Surface Equation:</strong> $${equation}$
    </div>

    ${notes}
    ${zernikeTable}

    <div class="section">
        <div class="section-title">Surface Parameters</div>
        ${generateParametersTable(surface)}
    </div>

    <div class="section">
        <div class="section-title">Surface Metrics</div>
        ${generateMetricsTable(summaryMetrics, surface.type)}
    </div>

    <div class="section">
        <div class="section-title">Calculated Data</div>
        ${generateDataTable(plotData, showAsphericity, showAberration)}
    </div>

    <div class="section">
        <div class="section-title">Visualizations</div>
        ${generatePlotsSection(plotImages, showAsphericity, showAberration)}
    </div>

    <div style="text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 8pt; color: #666;">
        Generated by SurfaceExpert - Optical Surface Analyzer
    </div>
</body>
</html>`;
};

/**
 * Generate simple 2-column parameters table
 */
const generateParametersTable = (surface) => {
    const params = Object.entries(surface.parameters).filter(([name, value]) => {
        // Skip zero or empty values for cleaner display
        if (value === '' || value === '0' || value === '0.0') return false;
        return true;
    });

    let html = '<table class="params-table"><tr><th>Parameter</th><th>Value</th></tr>';

    for (const [name, value] of params) {
        html += `<tr><td>${name}</td><td>${value}</td></tr>`;
    }

    html += '</table>';
    return html;
};

/**
 * Generate compact metrics table
 */
const generateMetricsTable = (metrics, surfaceType) => {
    if (!metrics) return '<p>No metrics available.</p>';

    const metricsList = [
        { label: 'Max Sag', value: formatValue(metrics.maxSag) + ' mm' },
        { label: 'Max Slope', value: formatValue(metrics.maxSlope) + ' rad' },
        { label: 'Max Angle', value: formatValue(metrics.maxAngle) + '°' },
        { label: 'Max Angle (DMS)', value: metrics.maxAngleDMS || 'N/A' },
    ];

    // Add asphericity metrics only for non-sphere surfaces
    if (surfaceType !== 'Sphere') {
        metricsList.push(
            { label: 'Max Asphericity', value: formatValue(metrics.maxAsphericity) + ' mm' },
            { label: 'Max Asph. Gradient', value: formatValue(metrics.maxAsphGradient) + ' mm' }
        );
    }

    // Add aberration only for surfaces that aren't Sphere, Irregular, or Zernike
    if (surfaceType !== 'Sphere' && surfaceType !== 'Irregular' && surfaceType !== 'Zernike') {
        metricsList.push({ label: 'Max Aberration', value: formatValue(metrics.maxAberration) + ' mm' });
    }

    metricsList.push(
        { label: 'Best Fit Sphere', value: formatValue(metrics.bestFitSphere) + ' mm' },
        { label: 'Paraxial F/#', value: formatValue(metrics.paraxialFNum) },
        { label: 'Working F/#', value: formatValue(metrics.workingFNum) }
    );

    // Split into two columns
    const half = Math.ceil(metricsList.length / 2);
    const leftMetrics = metricsList.slice(0, half);
    const rightMetrics = metricsList.slice(half);

    let html = '<table class="metrics-table"><tr><th>Metric</th><th>Value</th><th>Metric</th><th>Value</th></tr>';

    for (let i = 0; i < Math.max(leftMetrics.length, rightMetrics.length); i++) {
        html += '<tr>';
        if (i < leftMetrics.length) {
            html += `<td>${leftMetrics[i].label}</td><td>${leftMetrics[i].value}</td>`;
        } else {
            html += '<td></td><td></td>';
        }
        if (i < rightMetrics.length) {
            html += `<td>${rightMetrics[i].label}</td><td>${rightMetrics[i].value}</td>`;
        } else {
            html += '<td></td><td></td>';
        }
        html += '</tr>';
    }

    html += '</table>';
    return html;
};

/**
 * Generate compact data table
 */
const generateDataTable = (plotData, showAsphericity, showAberration) => {
    if (!plotData || !plotData.rValues || plotData.rValues.length === 0) {
        return '<p>No calculated data available.</p>';
    }

    const { rValues, sagValues, slopeValues, angleValues, asphericityValues, aberrationValues } = plotData;

    // Sample every nth point to keep table manageable (max 20 rows)
    const maxRows = 20;
    const step = Math.max(1, Math.floor(rValues.length / maxRows));

    let html = '<table class="data-table"><thead><tr>';
    html += '<th>Radius (mm)</th><th>Sag (mm)</th><th>Slope (rad)</th><th>Angle (°)</th><th>Angle (DMS)</th>';
    if (showAsphericity) html += '<th>Asphericity (mm)</th>';
    if (showAberration) html += '<th>Aberration (mm)</th>';
    html += '</tr></thead><tbody>';

    for (let i = 0; i < rValues.length; i += step) {
        const angleDMS = angleValues[i] ? degreesToDMS(angleValues[i]) : 'N/A';
        html += '<tr>';
        html += `<td>${formatValue(rValues[i])}</td>`;
        html += `<td>${formatValue(sagValues[i])}</td>`;
        html += `<td>${formatValue(slopeValues[i])}</td>`;
        html += `<td>${formatValue(angleValues[i])}</td>`;
        html += `<td>${angleDMS}</td>`;
        if (showAsphericity) html += `<td>${formatValue(asphericityValues[i])}</td>`;
        if (showAberration) html += `<td>${formatValue(aberrationValues[i])}</td>`;
        html += '</tr>';
    }

    html += '</tbody></table>';
    html += `<p style="font-size: 8pt; color: #666; margin-top: 4px;">Showing ${Math.min(maxRows, Math.ceil(rValues.length / step))} of ${rValues.length} calculated points</p>`;

    return html;
};

/**
 * Generate plots section
 */
const generatePlotsSection = (plotImages, showAsphericity, showAberration) => {
    if (!plotImages) return '<p>No plots available.</p>';

    let html = '';

    // 3D and 2D plots in two columns
    html += '<div class="two-column">';
    if (plotImages.plot3D) {
        html += `<div class="plot-container">
            <div class="plot-title">3D Surface Plot</div>
            <img src="${plotImages.plot3D}" alt="3D Surface Plot" />
        </div>`;
    }
    if (plotImages.plot2D) {
        html += `<div class="plot-container">
            <div class="plot-title">2D Contour Plot</div>
            <img src="${plotImages.plot2D}" alt="2D Contour Plot" />
        </div>`;
    }
    html += '</div>';

    // Metric plots in two columns
    html += '<div class="two-column">';
    if (plotImages.sagPlot) {
        html += `<div class="plot-container">
            <div class="plot-title">Sag vs Radius</div>
            <img src="${plotImages.sagPlot}" alt="Sag Plot" />
        </div>`;
    }
    if (plotImages.slopePlot) {
        html += `<div class="plot-container">
            <div class="plot-title">Slope vs Radius</div>
            <img src="${plotImages.slopePlot}" alt="Slope Plot" />
        </div>`;
    }
    html += '</div>';

    if (showAsphericity || showAberration) {
        html += '<div class="two-column">';
        if (showAsphericity && plotImages.asphericityPlot) {
            html += `<div class="plot-container">
                <div class="plot-title">Asphericity vs Radius</div>
                <img src="${plotImages.asphericityPlot}" alt="Asphericity Plot" />
            </div>`;
        }
        if (showAberration && plotImages.aberrationPlot) {
            html += `<div class="plot-container">
                <div class="plot-title">Aberration vs Radius</div>
                <img src="${plotImages.aberrationPlot}" alt="Aberration Plot" />
            </div>`;
        }
        html += '</div>';
    }

    return html;
};

/**
 * Export Plotly plot to base64 image
 */
export const exportPlotToImage = async (plotId, width = 800, height = 500) => {
    try {
        const imgData = await Plotly.toImage(plotId, {
            format: 'png',
            width: width,
            height: height,
            scale: 2
        });
        return imgData;
    } catch (error) {
        console.error('Error exporting plot to image:', error);
        return null;
    }
};

/**
 * Generate individual metric plots
 */
export const generateMetricPlots = async (plotData) => {
    const { rValues, sagValues, slopeValues, asphericityValues, aberrationValues } = plotData;

    // Helper to create a simple line plot
    const createPlot = async (x, y, title, yaxis) => {
        const plotDiv = document.createElement('div');
        plotDiv.id = 'temp-plot-' + Date.now() + Math.random();
        plotDiv.style.display = 'none';
        document.body.appendChild(plotDiv);

        await Plotly.newPlot(plotDiv, [{
            x: x,
            y: y,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#2563eb', width: 2 }
        }], {
            title: { text: title, font: { size: 14 } },
            xaxis: { title: 'Radius (mm)', showgrid: true },
            yaxis: { title: yaxis, showgrid: true },
            margin: { l: 60, r: 30, t: 40, b: 50 },
            paper_bgcolor: '#fff',
            plot_bgcolor: '#f9f9f9'
        }, { displayModeBar: false });

        const imgData = await exportPlotToImage(plotDiv.id, 600, 400);
        document.body.removeChild(plotDiv);
        return imgData;
    };

    return {
        sagPlot: await createPlot(rValues, sagValues, 'Sag vs Radius', 'Sag (mm)'),
        slopePlot: await createPlot(rValues, slopeValues, 'Slope vs Radius', 'Slope (rad)'),
        asphericityPlot: asphericityValues ? await createPlot(rValues, asphericityValues, 'Asphericity vs Radius', 'Asphericity (mm)') : null,
        aberrationPlot: aberrationValues ? await createPlot(rValues, aberrationValues, 'Aberration vs Radius', 'Aberration (mm)') : null
    };
};

/**
 * Generate 3D surface plot for report
 */
const generate3DPlotImage = async (surface, plotData) => {
    const minHeight = parseFloat(surface.parameters['Min Height']) || 0;
    const maxHeight = parseFloat(surface.parameters['Max Height']) || 25;
    const size = 60;

    // Import calculateSurfaceValues dynamically
    const { calculateSurfaceValues } = await import('./calculations.js');

    // Create coordinate arrays
    const x = [], y = [];
    for (let i = 0; i < size; i++) {
        x.push(-maxHeight + (i * (2 * maxHeight)) / (size - 1));
        y.push(-maxHeight + (i * (2 * maxHeight)) / (size - 1));
    }

    // Generate 3D grid by calculating actual surface values
    const z = [];
    for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
            const xi = x[i];
            const yj = y[j];
            const r = Math.sqrt(xi * xi + yj * yj);

            if (r >= minHeight && r <= maxHeight) {
                // Calculate surface value for this point
                const values = (surface.type === 'Irregular' || surface.type === 'Zernike')
                    ? calculateSurfaceValues(r, surface, xi, yj)
                    : calculateSurfaceValues(r, surface);
                row.push(values.sag);
            } else {
                row.push(null);
            }
        }
        z.push(row);
    }

    const plotDiv = document.createElement('div');
    plotDiv.id = 'temp-plot3d-' + Date.now() + Math.random();
    plotDiv.style.display = 'none';
    document.body.appendChild(plotDiv);

    await Plotly.newPlot(plotDiv, [{
        x: x,
        y: y,
        z: z,
        type: 'surface',
        colorscale: 'Viridis',
        showscale: true,
        contours: {
            z: {
                show: true,
                usecolormap: true,
                highlightcolor: "#42f462",
                project: { z: true }
            }
        }
    }], {
        scene: {
            camera: { eye: { x: 1.5, y: 1.5, z: 1.5 } },
            xaxis: { title: 'X (mm)', range: [-maxHeight, maxHeight] },
            yaxis: { title: 'Y (mm)', range: [-maxHeight, maxHeight] },
            zaxis: { title: 'Sag (mm)' }
        },
        margin: { l: 0, r: 0, t: 0, b: 0 }
    }, { displayModeBar: false });

    const imgData = await exportPlotToImage(plotDiv.id, 800, 500);
    document.body.removeChild(plotDiv);
    return imgData;
};

/**
 * Generate 2D contour plot for report
 */
const generate2DContourImage = async (surface, plotData) => {
    const minHeight = parseFloat(surface.parameters['Min Height']) || 0;
    const maxHeight = parseFloat(surface.parameters['Max Height']) || 25;
    const size = 100;

    // Import calculateSurfaceValues dynamically
    const { calculateSurfaceValues } = await import('./calculations.js');

    // Create coordinate arrays
    const x = [], y = [];
    for (let i = 0; i < size; i++) {
        x.push(-maxHeight + (i * (2 * maxHeight)) / (size - 1));
        y.push(-maxHeight + (i * (2 * maxHeight)) / (size - 1));
    }

    // Generate 2D grid by calculating actual surface values
    const z = [];
    for (let i = 0; i < size; i++) {
        const row = [];
        for (let j = 0; j < size; j++) {
            const xi = x[i];
            const yj = y[j];
            const r = Math.sqrt(xi * xi + yj * yj);

            if (r >= minHeight && r <= maxHeight) {
                // Calculate surface value for this point
                const values = (surface.type === 'Irregular' || surface.type === 'Zernike')
                    ? calculateSurfaceValues(r, surface, xi, yj)
                    : calculateSurfaceValues(r, surface);
                row.push(values.sag);
            } else {
                row.push(null);
            }
        }
        z.push(row);
    }

    const plotDiv = document.createElement('div');
    plotDiv.id = 'temp-plot2d-' + Date.now() + Math.random();
    plotDiv.style.display = 'none';
    document.body.appendChild(plotDiv);

    await Plotly.newPlot(plotDiv, [{
        x: x,
        y: y,
        z: z,
        type: 'contour',
        colorscale: 'Viridis',
        showscale: true,
        contours: {
            showlabels: true,
            labelfont: { size: 8, color: 'white' }
        }
    }], {
        xaxis: { title: 'X (mm)', showgrid: true },
        yaxis: { title: 'Y (mm)', showgrid: true, scaleanchor: 'x' },
        margin: { l: 60, r: 30, t: 30, b: 50 }
    }, { displayModeBar: false });

    const imgData = await exportPlotToImage(plotDiv.id, 800, 500);
    document.body.removeChild(plotDiv);
    return imgData;
};

/**
 * Generate complete report data for current surface
 */
export const generateReportData = async (surface, plotData, summaryMetrics) => {
    console.log('Generating report plots...');

    // Generate 3D and 2D plots in temporary containers
    const plot3D = await generate3DPlotImage(surface, plotData);
    console.log('3D plot generated:', plot3D ? 'Success' : 'Failed');

    const plot2D = await generate2DContourImage(surface, plotData);
    console.log('2D plot generated:', plot2D ? 'Success' : 'Failed');

    // Generate metric plots
    const metricPlots = await generateMetricPlots(plotData);
    console.log('Metric plots generated:', metricPlots);

    const plotImages = {
        plot3D,
        plot2D,
        ...metricPlots
    };

    // Generate HTML report
    const html = generateHTMLReport(surface, plotData, summaryMetrics, plotImages);

    return {
        html,
        plotImages,
        surface,
        plotData,
        summaryMetrics
    };
};
