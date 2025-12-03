// ============================================
// Report Generation Handlers
// ============================================
// Business logic for HTML and PDF report generation

import { calculateSurfaceValues, calculateSurfaceMetrics } from './calculations.js';
import { generateReportData } from './reportGenerator.js';
import { parseNumber } from './numberParsing.js';

/**
 * Generate plot data arrays for report generation
 * @param {Object} surface - Surface object with parameters
 * @returns {Object} Plot data arrays (rValues, sagValues, etc.)
 */
export const generateReportPlotData = (surface) => {
    const minHeight = parseNumber(surface.parameters['Min Height']);
    const maxHeight = parseNumber(surface.parameters['Max Height']);
    const step = parseNumber(surface.parameters['Step']);

    const rValues = [];
    const sagValues = [];
    const slopeValues = [];
    const asphericityValues = [];
    const aberrationValues = [];
    const angleValues = [];

    for (let r = minHeight; r <= maxHeight; r += step) {
        // For non-rotationally symmetric surfaces, use scan angle
        let values;
        if (surface.type === 'Irregular' || surface.type === 'Zernike') {
            const scanAngle = parseNumber(surface.parameters['Scan Angle']);
            const scanAngleRad = scanAngle * Math.PI / 180;
            const x = r * Math.cos(scanAngleRad);
            const y = r * Math.sin(scanAngleRad);
            values = calculateSurfaceValues(r, surface, x, y);
        } else {
            values = calculateSurfaceValues(r, surface);
        }

        rValues.push(r);
        sagValues.push(values.sag);
        slopeValues.push(values.slope);
        asphericityValues.push(values.asphericity);
        aberrationValues.push(values.aberration);
        angleValues.push(values.angle);
    }

    return {
        rValues,
        sagValues,
        slopeValues,
        asphericityValues,
        aberrationValues,
        angleValues
    };
};

/**
 * Export HTML report for a surface
 * @param {Object} surface - Surface to export
 * @param {number} wavelength - Reference wavelength in nm
 * @param {string} colorscale - Plotly colorscale name
 * @param {number} gridSize3D - Grid size for 3D plots (default: 65)
 * @param {number} gridSize2D - Grid size for 2D plots (default: 129)
 * @param {Object} t - Locale translations object
 * @returns {Promise<void>}
 */
export const exportHTMLReport = async (surface, wavelength, colorscale, gridSize3D = 65, gridSize2D = 129, t = null) => {
    if (!surface) {
        alert('Please select a surface from the list to generate a report.\n\nClick on a surface in the left sidebar to select it.');
        return;
    }

    if (!window.electronAPI || !window.electronAPI.saveHTMLReport) {
        alert('Report export not available - please check Electron API');
        return;
    }

    try {
        console.log('Generating report for surface:', surface.name);

        // Generate plot data for the report
        const plotData = generateReportPlotData(surface);

        // Calculate summary metrics
        const summaryMetrics = calculateSurfaceMetrics(surface, wavelength);

        // Generate report data with plot images
        const reportData = await generateReportData(
            surface,
            plotData,
            summaryMetrics,
            colorscale,
            gridSize3D,
            gridSize2D,
            t
        );

        // Sanitize surface name for filename
        const sanitizedName = surface.name.replace(/[<>:"/\\|?*]/g, '_');

        // Save HTML report via Electron dialog
        const result = await window.electronAPI.saveHTMLReport(reportData.html, sanitizedName);

        // Only show error alerts, success opens folder automatically
        if (!result.canceled && !result.success) {
            alert('Error saving report: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Error generating report: ' + error.message);
        console.error('Report generation error:', error);
    }
};

/**
 * Export PDF report for a surface
 * @param {Object} surface - Surface to export
 * @param {number} wavelength - Reference wavelength in nm
 * @param {string} colorscale - Plotly colorscale name
 * @param {number} gridSize3D - Grid size for 3D plots (default: 65)
 * @param {number} gridSize2D - Grid size for 2D plots (default: 129)
 * @param {Object} t - Locale translations object
 * @returns {Promise<void>}
 */
export const exportPDFReport = async (surface, wavelength, colorscale, gridSize3D = 65, gridSize2D = 129, t = null) => {
    if (!surface) {
        alert('Please select a surface from the list to generate a report.\n\nClick on a surface in the left sidebar to select it.');
        return;
    }

    if (!window.electronAPI || !window.electronAPI.generatePDFReport) {
        alert('PDF export not available - please check Electron API');
        return;
    }

    try {
        console.log('Generating PDF report for surface:', surface.name);

        // Generate plot data for the report
        const plotData = generateReportPlotData(surface);

        // Calculate summary metrics
        const summaryMetrics = calculateSurfaceMetrics(surface, wavelength);

        // Generate report data with plot images
        const reportData = await generateReportData(
            surface,
            plotData,
            summaryMetrics,
            colorscale,
            gridSize3D,
            gridSize2D,
            t
        );

        // Sanitize surface name for filename
        const sanitizedName = surface.name.replace(/[<>:"/\\|?*]/g, '_');

        // Generate and save PDF report via Electron
        const result = await window.electronAPI.generatePDFReport(reportData.html, sanitizedName);

        // Only show error alerts, success opens folder automatically
        if (!result.canceled && !result.success) {
            alert('Error saving PDF: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Error generating PDF: ' + error.message);
        console.error('PDF generation error:', error);
    }
};
