/**
 * Report Generator Utility
 * Generates HTML and PDF reports with surface data, plots, and calculations
 */

import { formatValue, degreesToDMS } from './formatters.js';

/**
 * Generate a complete HTML report for a surface
 * @param {Object} surface - Surface object with parameters and data
 * @param {Object} plotData - Plot data (sag, slope, asphericity, aberration)
 * @param {Object} summaryMetrics - Summary metrics (max/min values, F-numbers, etc.)
 * @param {Object} plotImages - Base64 encoded plot images {plot3D, plot2D, crossSection}
 * @returns {string} Complete HTML report
 */
export const generateHTMLReport = (surface, plotData, summaryMetrics, plotImages) => {
    const timestamp = new Date().toLocaleString();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Surface Report - ${surface.name}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header {
            border-bottom: 3px solid ${surface.color};
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .header h1 {
            color: #2c3e50;
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .header .subtitle {
            color: #7f8c8d;
            font-size: 1.1em;
        }

        .header .timestamp {
            color: #95a5a6;
            font-size: 0.9em;
            margin-top: 10px;
        }

        .section {
            margin-bottom: 40px;
        }

        .section h2 {
            color: #2c3e50;
            font-size: 1.8em;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #ecf0f1;
        }

        .section h3 {
            color: #34495e;
            font-size: 1.3em;
            margin-bottom: 15px;
            margin-top: 25px;
        }

        .params-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }

        .param-item {
            background: #f8f9fa;
            padding: 12px 15px;
            border-radius: 5px;
            border-left: 4px solid ${surface.color};
        }

        .param-label {
            font-weight: 600;
            color: #555;
            font-size: 0.9em;
            margin-bottom: 5px;
        }

        .param-value {
            font-size: 1.1em;
            color: #2c3e50;
            font-family: 'Courier New', monospace;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .metric-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .metric-card.secondary {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .metric-card.tertiary {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .metric-card h4 {
            font-size: 0.9em;
            opacity: 0.9;
            margin-bottom: 8px;
            font-weight: 500;
        }

        .metric-card .value {
            font-size: 1.8em;
            font-weight: 600;
            font-family: 'Courier New', monospace;
        }

        .plot-container {
            margin-bottom: 30px;
            text-align: center;
        }

        .plot-container img {
            max-width: 100%;
            height: auto;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .plot-title {
            font-weight: 600;
            color: #555;
            margin-bottom: 15px;
            font-size: 1.1em;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 0.9em;
        }

        .data-table th {
            background: #34495e;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: 600;
        }

        .data-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #ecf0f1;
        }

        .data-table tr:nth-child(even) {
            background: #f8f9fa;
        }

        .data-table tr:hover {
            background: #e9ecef;
        }

        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #ecf0f1;
            text-align: center;
            color: #7f8c8d;
            font-size: 0.9em;
        }

        @media print {
            body {
                background: white;
                padding: 0;
            }

            .container {
                box-shadow: none;
                padding: 20px;
            }

            .section {
                page-break-inside: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${surface.name}</h1>
            <div class="subtitle">Surface Type: ${surface.type}</div>
            <div class="timestamp">Generated: ${timestamp}</div>
        </div>

        <div class="section">
            <h2>Surface Parameters</h2>
            ${generateParametersHTML(surface)}
        </div>

        <div class="section">
            <h2>Summary Metrics</h2>
            ${generateSummaryMetricsHTML(summaryMetrics)}
        </div>

        <div class="section">
            <h2>Visualizations</h2>
            ${generatePlotsHTML(plotImages)}
        </div>

        <div class="section">
            <h2>Calculated Data</h2>
            ${generateDataTableHTML(plotData)}
        </div>

        <div class="footer">
            <p>Generated by SurfaceExpert - Optical Surface Analyzer</p>
            <p>© 2025 SurfaceExpert</p>
        </div>
    </div>
</body>
</html>`;
};

/**
 * Generate HTML for surface parameters
 */
const generateParametersHTML = (surface) => {
    const params = Object.entries(surface.parameters);

    let html = '<div class="params-grid">';

    for (const [name, value] of params) {
        // Skip zero or empty values for cleaner display
        if (value === '0' || value === '' || value === '0.0') continue;

        html += `
            <div class="param-item">
                <div class="param-label">${name}</div>
                <div class="param-value">${value}</div>
            </div>
        `;
    }

    html += '</div>';
    return html;
};

/**
 * Generate HTML for summary metrics
 */
const generateSummaryMetricsHTML = (metrics) => {
    if (!metrics) return '<p>No summary metrics available.</p>';

    const metricCards = [
        { label: 'Max Sag', value: formatValue(metrics.maxSag) + ' mm', class: '' },
        { label: 'Max Slope', value: formatValue(metrics.maxSlope) + ' rad', class: 'secondary' },
        { label: 'Max Asphericity', value: formatValue(metrics.maxAsphericity) + ' mm', class: 'tertiary' },
        { label: 'Max Aberration', value: formatValue(metrics.maxAberration) + ' mm', class: '' },
        { label: 'Best Fit Radius', value: formatValue(metrics.bestFitRadius) + ' mm', class: 'secondary' },
        { label: 'Paraxial F/#', value: formatValue(metrics.paraxialFNum), class: 'tertiary' },
        { label: 'Working F/#', value: formatValue(metrics.workingFNum), class: '' },
        { label: 'Max Angle', value: degreesToDMS(metrics.maxAngle), class: 'secondary' }
    ];

    let html = '<div class="metrics-grid">';

    for (const metric of metricCards) {
        html += `
            <div class="metric-card ${metric.class}">
                <h4>${metric.label}</h4>
                <div class="value">${metric.value}</div>
            </div>
        `;
    }

    html += '</div>';
    return html;
};

/**
 * Generate HTML for plot images
 */
const generatePlotsHTML = (plotImages) => {
    if (!plotImages) return '<p>No plots available.</p>';

    let html = '';

    if (plotImages.plot3D) {
        html += `
            <div class="plot-container">
                <div class="plot-title">3D Surface Plot</div>
                <img src="${plotImages.plot3D}" alt="3D Surface Plot" />
            </div>
        `;
    }

    if (plotImages.plot2D) {
        html += `
            <div class="plot-container">
                <div class="plot-title">2D Contour Plot</div>
                <img src="${plotImages.plot2D}" alt="2D Contour Plot" />
            </div>
        `;
    }

    if (plotImages.crossSection) {
        html += `
            <div class="plot-container">
                <div class="plot-title">Cross Section</div>
                <img src="${plotImages.crossSection}" alt="Cross Section Plot" />
            </div>
        `;
    }

    return html;
};

/**
 * Generate HTML table with calculated data
 */
const generateDataTableHTML = (plotData) => {
    if (!plotData || !plotData.rValues || plotData.rValues.length === 0) {
        return '<p>No calculated data available.</p>';
    }

    const { rValues, sagValues, slopeValues, asphericityValues, aberrationValues, angleValues } = plotData;

    // Sample every nth point to keep table manageable (max 30 rows)
    const maxRows = 30;
    const step = Math.max(1, Math.floor(rValues.length / maxRows));

    let html = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Radius (mm)</th>
                    <th>Sag (mm)</th>
                    <th>Slope (rad)</th>
                    <th>Angle (°)</th>
                    <th>Asphericity (mm)</th>
                    <th>Aberration (mm)</th>
                </tr>
            </thead>
            <tbody>
    `;

    for (let i = 0; i < rValues.length; i += step) {
        html += `
            <tr>
                <td>${formatValue(rValues[i])}</td>
                <td>${formatValue(sagValues[i])}</td>
                <td>${formatValue(slopeValues[i])}</td>
                <td>${formatValue(angleValues[i])}</td>
                <td>${formatValue(asphericityValues[i])}</td>
                <td>${formatValue(aberrationValues[i])}</td>
            </tr>
        `;
    }

    html += `
            </tbody>
        </table>
        <p style="color: #7f8c8d; font-size: 0.9em;">
            Showing ${Math.min(maxRows, Math.ceil(rValues.length / step))} of ${rValues.length} calculated points
        </p>
    `;

    return html;
};

/**
 * Export Plotly plot to base64 image
 * @param {string} plotId - DOM ID of the plot element
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {Promise<string>} Base64 encoded PNG image
 */
export const exportPlotToImage = async (plotId, width = 1200, height = 800) => {
    try {
        const imgData = await Plotly.toImage(plotId, {
            format: 'png',
            width: width,
            height: height,
            scale: 2 // Higher resolution for better quality
        });
        return imgData;
    } catch (error) {
        console.error('Error exporting plot to image:', error);
        return null;
    }
};

/**
 * Generate complete report data for current surface
 * @param {Object} surface - Current surface
 * @param {Object} plotData - Plot data arrays
 * @param {Object} summaryMetrics - Summary metrics
 * @returns {Promise<Object>} Report data with HTML and images
 */
export const generateReportData = async (surface, plotData, summaryMetrics) => {
    // Export all plots to images
    const plotImages = {
        plot3D: await exportPlotToImage('plot3d', 1200, 800),
        plot2D: await exportPlotToImage('plot2d', 1200, 800),
        crossSection: await exportPlotToImage('plotCrossSection', 1200, 600)
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
