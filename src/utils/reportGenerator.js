/**
 * Report Generator Utility - Compact Professional Version
 * Generates HTML and PDF reports with surface data, equations, and plots
 */

import { formatValue, degreesToDMS } from './formatters.js';
import { getLocale } from '../constants/locales.js';
import { parseNumber } from './numberParsing.js';

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
        ['1', 'Piston', '1'],
        ['2', 'Tilt X', '\\rho\\cos\\phi'],
        ['3', 'Tilt Y', '\\rho\\sin\\phi'],
        ['4', 'Defocus', '2\\rho^2 - 1'],
        ['5', 'Astigmatism X', '\\rho^2\\cos2\\phi'],
        ['6', 'Astigmatism Y', '\\rho^2\\sin2\\phi'],
        ['7', 'Coma X', '(3\\rho^2 - 2)\\rho\\cos\\phi'],
        ['8', 'Coma Y', '(3\\rho^2 - 2)\\rho\\sin\\phi'],
        ['9', 'Primary Spherical', '6\\rho^4 - 6\\rho^2 + 1'],
        ['10', 'Trefoil X', '\\rho^3\\cos3\\phi'],
        ['11', 'Trefoil Y', '\\rho^3\\sin3\\phi'],
        ['12', 'Secondary Astigmatism X', '(4\\rho^2 - 3)\\rho^2\\cos2\\phi'],
        ['13', 'Secondary Astigmatism Y', '(4\\rho^2 - 3)\\rho^2\\sin2\\phi'],
        ['14', 'Secondary Coma X', '(10\\rho^4 - 12\\rho^2 + 3)\\rho\\cos\\phi'],
        ['15', 'Secondary Coma Y', '(10\\rho^4 - 12\\rho^2 + 3)\\rho\\sin\\phi'],
        ['16', 'Secondary Spherical', '20\\rho^6 - 30\\rho^4 + 12\\rho^2 - 1'],
        ['17', 'Tetrafoil X', '\\rho^4\\cos4\\phi'],
        ['18', 'Tetrafoil Y', '\\rho^4\\sin4\\phi'],
        ['19', 'Secondary Trefoil X', '(5\\rho^2 - 4)\\rho^3\\cos3\\phi'],
        ['20', 'Secondary Trefoil Y', '(5\\rho^2 - 4)\\rho^3\\sin3\\phi'],
        ['21', 'Tertiary Astigmatism X', '(15\\rho^4 - 20\\rho^2 + 6)\\rho^2\\cos2\\phi'],
        ['22', 'Tertiary Astigmatism Y', '(15\\rho^4 - 20\\rho^2 + 6)\\rho^2\\sin2\\phi'],
        ['23', 'Tertiary Coma X', '(35\\rho^6 - 60\\rho^4 + 30\\rho^2 - 4)\\rho\\cos\\phi'],
        ['24', 'Tertiary Coma Y', '(35\\rho^6 - 60\\rho^4 + 30\\rho^2 - 4)\\rho\\sin\\phi'],
        ['25', 'Tertiary Spherical', '70\\rho^8 - 140\\rho^6 + 90\\rho^4 - 20\\rho^2 + 1'],
        ['26', 'Pentafoil X', '\\rho^5\\cos5\\phi'],
        ['27', 'Pentafoil Y', '\\rho^5\\sin5\\phi'],
        ['28', 'Secondary Tetrafoil X', '(6\\rho^2 - 5)\\rho^4\\cos4\\phi'],
        ['29', 'Secondary Tetrafoil Y', '(6\\rho^2 - 5)\\rho^4\\sin4\\phi'],
        ['30', 'Tertiary Trefoil X', '(21\\rho^4 - 30\\rho^2 + 10)\\rho^3\\cos3\\phi'],
        ['31', 'Tertiary Trefoil Y', '(21\\rho^4 - 30\\rho^2 + 10)\\rho^3\\sin3\\phi'],
        ['32', 'Quaternary Astigmatism X', '(56\\rho^6 - 105\\rho^4 + 60\\rho^2 - 10)\\rho^2\\cos2\\phi'],
        ['33', 'Quaternary Astigmatism Y', '(56\\rho^6 - 105\\rho^4 + 60\\rho^2 - 10)\\rho^2\\sin2\\phi'],
        ['34', 'Quaternary Coma X', '(126\\rho^8 - 280\\rho^6 + 210\\rho^4 - 60\\rho^2 + 5)\\rho\\cos\\phi'],
        ['35', 'Quaternary Coma Y', '(126\\rho^8 - 280\\rho^6 + 210\\rho^4 - 60\\rho^2 + 5)\\rho\\sin\\phi'],
        ['36', 'Quaternary Spherical', '252\\rho^{10} - 630\\rho^8 + 560\\rho^6 - 210\\rho^4 + 30\\rho^2 - 1'],
        ['37', 'Quinary Spherical', '924\\rho^{12} - 2772\\rho^{10} + 3150\\rho^8 - 1680\\rho^6 + 420\\rho^4 - 42\\rho^2 + 1']
    ];

    let html = '<div class="zernike-table" style="margin: 12px 0;"><div class="section-title" style="font-size: 11pt; margin-bottom: 8px;">Zernike Polynomial Terms</div>';
    html += '<table class="params-table"><tr><th>Term i</th><th>Name</th><th>ψ<sub>i</sub>(ρ, φ)</th></tr>';

    for (const [num, name, formula] of terms) {
        html += `<tr><td style="text-align: center;">${num}</td><td>${name}</td><td>$${formula}$</td></tr>`;
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
export const generateHTMLReport = (surface, plotData, summaryMetrics, plotImages, t = null) => {
    // Use provided locale or default to English
    const locale = t || getLocale('en');

    const timestamp = new Date().toLocaleString();
    const equation = getSurfaceEquation(surface.type);
    const notes = getSurfaceNotes(surface.type);
    const zernikeTable = surface.type === 'Zernike' ? getZernikeTermsTable() : '';

    // Determine which metrics to show based on surface type
    const showAsphericity = surface.type !== 'Sphere' && surface.type !== 'Irregular' && surface.type !== 'Zernike';
    const showAberration = surface.type !== 'Sphere' && surface.type !== 'Irregular' && surface.type !== 'Zernike';
    const showSlope = surface.type !== 'Irregular' && surface.type !== 'Zernike';

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
            <strong>${locale.reports.surfaceType}:</strong> ${locale.surfaceTypes[surface.type] || surface.type} &nbsp;|&nbsp;
            <strong>Generated:</strong> ${timestamp}
        </div>
    </div>

    <div class="equation">
        <strong>${locale.reports.surfaceEquation}:</strong> $${equation}$
    </div>

    ${notes}
    ${zernikeTable}

    <div class="section">
        <div class="section-title">${locale.reports.surfaceParameters}</div>
        ${generateParametersTable(surface, locale)}
    </div>

    <div class="section">
        <div class="section-title">${locale.reports.summaryMetrics}</div>
        ${generateMetricsTable(summaryMetrics, surface.type, locale)}
    </div>

    <div class="section">
        <div class="section-title">${locale.reports.calculatedData}</div>
        ${generateDataTable(plotData, showSlope, showAsphericity, showAberration, locale)}
    </div>

    <div class="section">
        <div class="section-title">${locale.reports.visualizations}</div>
        ${generatePlotsSection(plotImages, showSlope, showAsphericity, showAberration, locale)}
    </div>

    <div style="text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 8pt; color: #666;">
        Generated by SurfaceExpert
    </div>
</body>
</html>`;
};

/**
 * Generate simple 2-column parameters table
 */
const generateParametersTable = (surface, locale) => {
    const params = Object.entries(surface.parameters).filter(([name, value]) => {
        // Skip zero or empty values for cleaner display
        if (value === '' || value === '0' || value === '0.0') return false;
        return true;
    });

    let html = `<table class="params-table"><tr><th>${locale.reports.parameter}</th><th>${locale.reports.value}</th></tr>`;

    for (const [name, value] of params) {
        const translatedName = locale.parameters[name] || name;
        html += `<tr><td>${translatedName}</td><td>${value}</td></tr>`;
    }

    html += '</table>';
    return html;
};

/**
 * Generate compact metrics table
 */
const generateMetricsTable = (metrics, surfaceType, locale) => {
    if (!metrics) return '<p>No metrics available.</p>';

    const metricsList = [
        { label: locale.properties.maxSag, value: `${formatValue(metrics.maxSag)} ${locale.summary.units.mm}` },
        { label: locale.properties.maxSlope, value: `${formatValue(metrics.maxSlope)} ${locale.summary.units.rad}` },
        { label: locale.properties.maxAngle, value: `${formatValue(metrics.maxAngle)}${locale.summary.units.deg}` },
        { label: `${locale.properties.maxAngle} (DMS)`, value: (metrics.maxAngle !== null && metrics.maxAngle !== undefined) ? degreesToDMS(metrics.maxAngle) : 'N/A' },
    ];

    // Add asphericity metrics only for non-sphere surfaces
    if (surfaceType !== 'Sphere') {
        metricsList.push(
            { label: locale.properties.maxAsphericity, value: `${formatValue(metrics.maxAsphericity)} ${locale.summary.units.mm}` },
            { label: locale.properties.maxAsphGradient, value: `${formatValue(metrics.maxAsphGradient)} ${locale.summary.units.perMm}` }
        );
    }

    // Add aberration only for surfaces that aren't Sphere, Irregular, or Zernike
    if (surfaceType !== 'Sphere' && surfaceType !== 'Irregular' && surfaceType !== 'Zernike') {
        metricsList.push({ label: locale.properties.maxAberration, value: `${formatValue(metrics.maxAberration)} ${locale.summary.units.mm}` });
    }

    // Add RMS and P-V error for Zernike and Irregular surfaces
    if (surfaceType === 'Zernike' || surfaceType === 'Irregular') {
        if (metrics.rmsError) {
            metricsList.push(
                { label: `${locale.properties.rmsError} (${locale.summary.units.mm})`, value: `${formatValue(metrics.rmsError.mm)} ${locale.summary.units.mm}` },
                { label: `${locale.properties.rmsError} (waves)`, value: formatValue(metrics.rmsError.waves) + ' λ' }
            );
        }
        if (metrics.pvError) {
            metricsList.push(
                { label: `${locale.properties.pvError} (${locale.summary.units.mm})`, value: `${formatValue(metrics.pvError.mm)} ${locale.summary.units.mm}` },
                { label: `${locale.properties.pvError} (waves)`, value: formatValue(metrics.pvError.waves) + ' λ' }
            );
        }
    }

    metricsList.push(
        { label: locale.properties.bestFitSphere, value: `${formatValue(metrics.bestFitSphere)} ${locale.summary.units.mm}` },
        { label: locale.properties.paraxialFNum, value: formatValue(metrics.paraxialFNum) },
        { label: locale.properties.workingFNum, value: formatValue(metrics.workingFNum) }
    );

    // Split into two columns
    const half = Math.ceil(metricsList.length / 2);
    const leftMetrics = metricsList.slice(0, half);
    const rightMetrics = metricsList.slice(half);

    let html = `<table class="metrics-table"><tr><th>${locale.reports.metric}</th><th>${locale.reports.value}</th><th>${locale.reports.metric}</th><th>${locale.reports.value}</th></tr>`;

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
const generateDataTable = (plotData, showSlope, showAsphericity, showAberration, locale) => {
    if (!plotData || !plotData.rValues || plotData.rValues.length === 0) {
        return '<p>No calculated data available.</p>';
    }

    const { rValues, sagValues, slopeValues, angleValues, asphericityValues, aberrationValues } = plotData;



    const step = 1;

    let html = '<table class="data-table"><thead><tr>';
    html += `<th>${locale.reports.radius} (${locale.summary.units.mm})</th><th>${locale.reports.sag} (${locale.summary.units.mm})</th>`;
    if (showSlope) html += `<th>${locale.reports.slope} (${locale.summary.units.rad})</th><th>${locale.reports.angle} (${locale.summary.units.deg})</th><th>${locale.reports.angleDMS}</th>`;
    if (showAsphericity) html += `<th>${locale.reports.asphericity} (${locale.summary.units.mm})</th>`;
    if (showAberration) html += `<th>${locale.reports.aberration} (${locale.summary.units.mm})</th>`;
    html += '</tr></thead><tbody>';

    for (let i = 0; i < rValues.length; i += step) {
        const angleDMS = angleValues[i] ? degreesToDMS(angleValues[i]) : 'N/A';
        html += '<tr>';
        html += `<td>${formatValue(rValues[i])}</td>`;
        html += `<td>${formatValue(sagValues[i])}</td>`;
        if (showSlope) {
            html += `<td>${formatValue(slopeValues[i])}</td>`;
            html += `<td>${formatValue(angleValues[i])}</td>`;
            html += `<td>${angleDMS}</td>`;
        }
        if (showAsphericity) html += `<td>${formatValue(asphericityValues[i])}</td>`;
        if (showAberration) html += `<td>${formatValue(aberrationValues[i])}</td>`;
        html += '</tr>';
    }

    html += '</tbody></table>';
    html += `<p style="font-size: 8pt; color: #666; margin-top: 4px;">Showing ${rValues.length} calculated points</p>`;

    return html;
};

/**
 * Generate plots section
 */
const generatePlotsSection = (plotImages, showSlope, showAsphericity, showAberration, locale) => {
    if (!plotImages) return '<p>No plots available.</p>';

    let html = '';

    // 3D and 2D plots in two columns
    html += '<div class="two-column">';
    if (plotImages.plot3D) {
        html += `<div class="plot-container">
            <div class="plot-title">${locale.reports.plot3D}</div>
            <img src="${plotImages.plot3D}" alt="${locale.reports.plot3D}" />
        </div>`;
    }
    if (plotImages.plot2D) {
        html += `<div class="plot-container">
            <div class="plot-title">${locale.reports.plot2D}</div>
            <img src="${plotImages.plot2D}" alt="${locale.reports.plot2D}" />
        </div>`;
    }
    html += '</div>';

    // Sag plot (always shown) and slope plot (conditional)
    if (plotImages.sagPlot || (showSlope && plotImages.slopePlot)) {
        html += '<div class="two-column">';
        if (plotImages.sagPlot) {
            html += `<div class="plot-container">
                <div class="plot-title">${locale.reports.plotSag}</div>
                <img src="${plotImages.sagPlot}" alt="${locale.reports.plotSag}" />
            </div>`;
        }
        if (showSlope && plotImages.slopePlot) {
            html += `<div class="plot-container">
                <div class="plot-title">${locale.reports.plotSlope}</div>
                <img src="${plotImages.slopePlot}" alt="${locale.reports.plotSlope}" />
            </div>`;
        }
        html += '</div>';
    }

    // Asphericity and aberration plots (conditional)
    if (showAsphericity || showAberration) {
        html += '<div class="two-column">';
        if (showAsphericity && plotImages.asphericityPlot) {
            html += `<div class="plot-container">
                <div class="plot-title">${locale.reports.plotAsphericity}</div>
                <img src="${plotImages.asphericityPlot}" alt="${locale.reports.plotAsphericity}" />
            </div>`;
        }
        if (showAberration && plotImages.aberrationPlot) {
            html += `<div class="plot-container">
                <div class="plot-title">${locale.reports.plotAberration}</div>
                <img src="${plotImages.aberrationPlot}" alt="${locale.reports.plotAberration}" />
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
    const createPlot = async (x, y, yaxis, equalAspect = false) => {
        const plotDiv = document.createElement('div');
        plotDiv.id = 'temp-plot-' + Date.now() + Math.random();
        plotDiv.style.position = 'absolute';
        plotDiv.style.left = '-9999px';
        plotDiv.style.width = '600px';
        plotDiv.style.height = '400px';
        document.body.appendChild(plotDiv);

        const layout = {
            xaxis: { title: 'Radial Coordinate (mm)', showgrid: true },
            yaxis: { title: yaxis, showgrid: true },
            margin: { l: 60, r: 30, t: 30, b: 50 },
            paper_bgcolor: '#fff',
            plot_bgcolor: '#f9f9f9'
        };

        // Add 1:1 aspect ratio for sag plot
        if (equalAspect) {
            layout.xaxis.scaleanchor = 'y';
            layout.xaxis.scaleratio = 1;
        }

        await Plotly.newPlot(plotDiv, [{
            x: x,
            y: y,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#2563eb', width: 2 }
        }], layout, { displayModeBar: false });

        const imgData = await exportPlotToImage(plotDiv.id, 600, 400);
        document.body.removeChild(plotDiv);
        return imgData;
    };

    return {
        sagPlot: await createPlot(rValues, sagValues, 'Sag (mm)', true),
        slopePlot: await createPlot(rValues, slopeValues, 'Slope (rad)', false),
        asphericityPlot: asphericityValues ? await createPlot(rValues, asphericityValues, 'Asphericity (mm)', false) : null,
        aberrationPlot: aberrationValues ? await createPlot(rValues, aberrationValues, 'Aberration (mm)', false) : null
    };
};

/**
 * Generate 3D surface plot for report
 * @param {Object} surface - Surface object
 * @param {Object} plotData - Plot data arrays
 * @param {string} colorscale - Plotly colorscale name
 * @param {number} gridSize - Grid size for 3D plot (default: 65)
 * @returns {Promise<string>} Base64 encoded image data
 */
const generate3DPlotImage = async (surface, plotData, colorscale = 'Jet', gridSize = 65) => {
    const minHeight = parseNumber(surface.parameters['Min Height']);
    const maxHeight = parseNumber(surface.parameters['Max Height']);
    const size = gridSize;

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
    plotDiv.style.position = 'absolute';
    plotDiv.style.left = '-9999px';
    plotDiv.style.width = '800px';
    plotDiv.style.height = '500px';
    document.body.appendChild(plotDiv);

    // Calculate z range for aspect ratio
    const validZ = z.flat().filter(v => v !== null);
    // Use iterative min/max to avoid stack overflow with large arrays
    let zMin = Infinity;
    let zMax = -Infinity;
    for (let i = 0; i < validZ.length; i++) {
        if (validZ[i] < zMin) zMin = validZ[i];
        if (validZ[i] > zMax) zMax = validZ[i];
    }

    await Plotly.newPlot(plotDiv, [{
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
    }], {
        scene: {
            camera: { eye: { x: 1.5, y: 1.5, z: 1.5 } },
            xaxis: { title: 'X (mm)', range: [-maxHeight, maxHeight] },
            yaxis: { title: 'Y (mm)', range: [-maxHeight, maxHeight] },
            zaxis: { title: 'Sag (mm)', range: [zMin, zMax] },
            // Manual aspect ratio: 1:1 for X:Y, Z scaled to sag range
            aspectmode: 'manual',
            aspectratio: { x: 1, y: 1, z: (zMax - zMin) / (2 * maxHeight) }
        },
        margin: { l: 0, r: 0, t: 0, b: 0 }
    }, { displayModeBar: false });

    const imgData = await exportPlotToImage(plotDiv.id, 800, 500);
    document.body.removeChild(plotDiv);
    return imgData;
};

/**
 * Generate 2D contour plot for report
 * @param {Object} surface - Surface object
 * @param {Object} plotData - Plot data arrays
 * @param {string} colorscale - Plotly colorscale name
 * @param {number} gridSize - Grid size for 2D plot (default: 129)
 * @returns {Promise<string>} Base64 encoded image data
 */
const generate2DContourImage = async (surface, plotData, colorscale = 'Jet', gridSize = 129) => {
    const minHeight = parseNumber(surface.parameters['Min Height']);
    const maxHeight = parseNumber(surface.parameters['Max Height']);
    const size = gridSize;

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
    for (let j = 0; j < size; j++) {
        const row = [];
        for (let i = 0; i < size; i++) {
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
    plotDiv.style.position = 'absolute';
    plotDiv.style.left = '-9999px';
    plotDiv.style.width = '800px';
    plotDiv.style.height = '500px';
    document.body.appendChild(plotDiv);

    await Plotly.newPlot(plotDiv, [{
        x: x,
        y: y,
        z: z,
        type: 'heatmap',
        colorscale: colorscale,
        colorbar: {
            title: 'Sag (mm)',
            thickness: 15,
            len: 0.7
        },
        hoverongaps: false
    }], {
        xaxis: { title: 'X (mm)', scaleanchor: 'y', scaleratio: 1, constrain: 'domain' },
        yaxis: { title: 'Y (mm)', constrain: 'domain' },
        margin: { l: 60, r: 120, t: 30, b: 60 }
    }, { displayModeBar: false });

    const imgData = await exportPlotToImage(plotDiv.id, 800, 500);
    document.body.removeChild(plotDiv);
    return imgData;
};

/**
 * Generate complete report data for current surface
 * @param {Object} surface - Surface object
 * @param {Object} plotData - Plot data arrays
 * @param {Object} summaryMetrics - Summary metrics
 * @param {string} colorscale - Plotly colorscale name
 * @param {number} gridSize3D - Grid size for 3D plots (default: 65)
 * @param {number} gridSize2D - Grid size for 2D plots (default: 129)
 * @param {Object} t - Locale translations object
 * @returns {Promise<Object>} Report data with HTML and plot images
 */
export const generateReportData = async (surface, plotData, summaryMetrics, colorscale = 'Jet', gridSize3D = 65, gridSize2D = 129, t = null) => {
    console.log('Generating report plots...');

    // Generate 3D and 2D plots in temporary containers
    const plot3D = await generate3DPlotImage(surface, plotData, colorscale, gridSize3D);
    console.log('3D plot generated:', plot3D ? 'Success' : 'Failed');

    const plot2D = await generate2DContourImage(surface, plotData, colorscale, gridSize2D);
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
    const html = generateHTMLReport(surface, plotData, summaryMetrics, plotImages, t);

    return {
        html,
        plotImages,
        surface,
        plotData,
        summaryMetrics
    };
};
