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
        'Zernike': 'z = z_{base} + \\sum_{j=1}^{37} Z_j \\cdot Zernike_j(\\rho, \\theta)',
        'Irregular': 'z = z_{base} + Spherical + Astigmatism + Coma',
        'Opal Un U': 'r^2 = 2z(R-z) + e_2 z^2 + \\sum_{i=2}^{12} A_i z^i',
        'Opal Un Z': 'z = \\sum_{i=1}^{13} A_i r^i',
        'Poly': 'z = \\sum_{i=1}^{13} A_i r^i'
    };
    return equations[surfaceType] || '';
};

/**
 * Generate complete HTML report for a surface
 */
export const generateHTMLReport = (surface, plotData, summaryMetrics, plotImages) => {
    const timestamp = new Date().toLocaleString();
    const equation = getSurfaceEquation(surface.type);

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
 * Generate compact parameters table
 */
const generateParametersTable = (surface) => {
    const params = Object.entries(surface.parameters).filter(([name, value]) => {
        // Skip zero or empty values for cleaner display
        if (value === '' || value === '0' || value === '0.0') return false;
        return true;
    });

    // Split into two columns
    const half = Math.ceil(params.length / 2);
    const leftParams = params.slice(0, half);
    const rightParams = params.slice(half);

    let html = '<table class="params-table"><tr><th>Parameter</th><th>Value</th><th>Parameter</th><th>Value</th></tr>';

    for (let i = 0; i < Math.max(leftParams.length, rightParams.length); i++) {
        html += '<tr>';
        if (i < leftParams.length) {
            html += `<td>${leftParams[i][0]}</td><td>${leftParams[i][1]}</td>`;
        } else {
            html += '<td></td><td></td>';
        }
        if (i < rightParams.length) {
            html += `<td>${rightParams[i][0]}</td><td>${rightParams[i][1]}</td>`;
        } else {
            html += '<td></td><td></td>';
        }
        html += '</tr>';
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
 * Generate complete report data for current surface
 */
export const generateReportData = async (surface, plotData, summaryMetrics) => {
    // Export main plots
    const plot3D = await exportPlotToImage('plot3d', 800, 500);
    const plot2D = await exportPlotToImage('plot2d', 800, 500);

    // Generate metric plots
    const metricPlots = await generateMetricPlots(plotData);

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
