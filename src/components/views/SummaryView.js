// SummaryView component - Displays comprehensive surface summary with metrics and detailed data table
// Shows summary statistics, F/#, best fit sphere, and full analysis table

import { calculateSurfaceValues, calculateSurfaceMetrics } from '../../utils/calculations.js';
import { formatValue, degreesToDMS } from '../../utils/formatters.js';
import { parseNumber } from '../../utils/numberParsing.js';

const { createElement: h } = React;

export const SummaryView = ({ selectedSurface, wavelength = 632.8, c, t }) => {
    if (!selectedSurface) return null;

    // Generate data table for summary
    const generateDataTable = () => {
        const minHeight = parseNumber(selectedSurface.parameters['Min Height']);
        const maxHeight = parseNumber(selectedSurface.parameters['Max Height']);
        const step = parseNumber(selectedSurface.parameters['Step']);
        const data = [];

        for (let r = minHeight; r < maxHeight; r += step) {
            // For non-rotationally symmetric surfaces (Zernike, Irregular), use scan angle to determine direction
            let values;
            if (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike') {
                const scanAngle = parseNumber(selectedSurface.parameters['Scan Angle']);
                const scanAngleRad = scanAngle * Math.PI / 180;
                const x = r * Math.cos(scanAngleRad);
                const y = r * Math.sin(scanAngleRad);
                values = calculateSurfaceValues(r, selectedSurface, x, y);
            } else {
                values = calculateSurfaceValues(r, selectedSurface);
            }
            data.push({
                r: r.toFixed(7),
                sag: formatValue(values.sag),
                slope: formatValue(values.slope),
                angle: formatValue(values.angle),
                angleDMS: degreesToDMS(values.angle),
                asphericity: formatValue(values.asphericity),
                aberration: formatValue(values.aberration),
                // Store raw values for max calculations
                rawSag: values.sag,
                rawSlope: values.slope,
                rawAngle: values.angle,
                rawAsphericity: values.asphericity,
                rawAberration: values.aberration
            });
        }

        // Always include maxHeight
        let values;
        if (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike') {
            const scanAngle = parseNumber(selectedSurface.parameters['Scan Angle']);
            const scanAngleRad = scanAngle * Math.PI / 180;
            const x = maxHeight * Math.cos(scanAngleRad);
            const y = maxHeight * Math.sin(scanAngleRad);
            values = calculateSurfaceValues(maxHeight, selectedSurface, x, y);
        } else {
            values = calculateSurfaceValues(maxHeight, selectedSurface);
        }
        data.push({
            r: maxHeight.toFixed(7),
            sag: formatValue(values.sag),
            slope: formatValue(values.slope),
            angle: formatValue(values.angle),
            angleDMS: degreesToDMS(values.angle),
            asphericity: formatValue(values.asphericity),
            aberration: formatValue(values.aberration),
            // Store raw values for max calculations
            rawSag: values.sag,
            rawSlope: values.slope,
            rawAngle: values.angle,
            rawAsphericity: values.asphericity,
            rawAberration: values.aberration
        });

        return data;
    };

    const dataTable = generateDataTable();

    // Calculate all metrics using shared utility function
    const metrics = calculateSurfaceMetrics(selectedSurface, wavelength);
    const { maxSag, maxSlope, maxAngle, maxAsphericity, maxAberration, maxAsphGradient, bestFitSphere, paraxialFNum, workingFNum } = metrics;

    const minHeight = parseNumber(selectedSurface.parameters['Min Height']);
    const maxHeight = parseNumber(selectedSurface.parameters['Max Height']);

    // Calculate single-point sag for non-rotationally symmetric surfaces
    const isNonRotSymmetric = selectedSurface.type === 'Zernike' || selectedSurface.type === 'Irregular';
    let singlePointSag = null;
    let xCoord = 0, yCoord = 0;
    if (isNonRotSymmetric) {
        xCoord = parseNumber(selectedSurface.parameters['X Coordinate']);
        yCoord = parseNumber(selectedSurface.parameters['Y Coordinate']);
        const r = Math.sqrt(xCoord * xCoord + yCoord * yCoord);
        const values = calculateSurfaceValues(r, selectedSurface, xCoord, yCoord);
        singlePointSag = values.sag;
    }

    return h('div', { style: { padding: '20px' } },
        // Single-point sag section for non-rotationally symmetric surfaces
        isNonRotSymmetric && h('div', { style: { marginBottom: '30px' } },
            h('h3', { style: { marginBottom: '15px', fontSize: '16px' } }, 'Single Point Calculation'),
            h('table', {
                style: {
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '13px',
                    marginBottom: '10px',
                    backgroundColor: c.panel,
                    border: `2px solid ${c.accent}`
                }
            },
                h('thead', null,
                    h('tr', { style: { borderBottom: `2px solid ${c.border}` } },
                        h('th', { style: { padding: '10px', textAlign: 'left', color: c.textDim } }, t.summary.tableHeaders.coordinate),
                        h('th', { style: { padding: '10px', textAlign: 'right' } }, t.summary.tableHeaders.value),
                        h('th', { style: { padding: '10px', textAlign: 'left', paddingLeft: '20px' } }, t.summary.tableHeaders.unit)
                    )
                ),
                h('tbody', null,
                    h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                        h('td', { style: { padding: '10px' } }, t.summary.tableHeaders.xCoordinate),
                        h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(xCoord)),
                        h('td', { style: { padding: '10px', paddingLeft: '20px' } }, t.summary.units.mm)
                    ),
                    h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                        h('td', { style: { padding: '10px' } }, t.summary.tableHeaders.yCoordinate),
                        h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(yCoord)),
                        h('td', { style: { padding: '10px', paddingLeft: '20px' } }, t.summary.units.mm)
                    ),
                    h('tr', { style: { borderBottom: `1px solid ${c.border}`, backgroundColor: c.hover } },
                        h('td', { style: { padding: '10px', fontWeight: 'bold' } }, t.summary.tableHeaders.sagAtXY),
                        h('td', { style: { padding: '10px', textAlign: 'right', fontWeight: 'bold' } }, formatValue(singlePointSag)),
                        h('td', { style: { padding: '10px', paddingLeft: '20px' } }, t.summary.units.mm)
                    )
                )
            )
        ),
        h('h3', { style: { marginBottom: '20px', fontSize: '16px' } }, t.summary.title),
        h('table', {
            style: {
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                marginBottom: '30px'
            }
        },
            h('thead', null,
                h('tr', { style: { borderBottom: `2px solid ${c.border}` } },
                    h('th', { style: { padding: '10px', textAlign: 'left', color: c.textDim } }, t.summary.tableHeaders.property),
                    h('th', { style: { padding: '10px', textAlign: 'right' } }, t.summary.tableHeaders.value),
                    h('th', { style: { padding: '10px', textAlign: 'left', paddingLeft: '20px' } }, t.summary.tableHeaders.unit)
                )
            ),
            h('tbody', null,
                h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, t.summary.heightRange),
                    h('td', { style: { padding: '10px', textAlign: 'right' } },
                        `${selectedSurface.parameters['Min Height']} - ${selectedSurface.parameters['Max Height']}`
                    ),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, t.summary.units.mm)
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, t.properties.paraxialFNum),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(paraxialFNum)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, '—')
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, t.properties.workingFNum),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(workingFNum)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, '—')
                ),
                h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, t.properties.maxSag),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxSag)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, t.summary.units.mm)
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, t.properties.maxSlope),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxSlope)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, t.summary.units.rad)
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, t.properties.maxAngle),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAngle)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, t.summary.units.deg)
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, `${t.properties.maxAngle} (DMS)`),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, degreesToDMS(maxAngle)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, '—')
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, t.properties.maxAsphericity),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAsphericity)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, t.summary.units.mm)
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, t.properties.maxAsphGradient),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAsphGradient)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, t.summary.units.perMm)
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, t.properties.bestFitSphere),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(bestFitSphere)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, t.summary.units.mm)
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, t.properties.maxAberration),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAberration)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, t.summary.units.mm)
                )
            )
        ),

        // Detailed data table
        h('h3', { style: { marginBottom: '15px', marginTop: '20px', fontSize: '16px' } }, t.summary.detailedAnalysis),
        h('table', {
            style: {
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px'
            }
        },
            h('thead', null,
                h('tr', { style: { borderBottom: `2px solid ${c.border}` } },
                    h('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, `${t.summary.analysisHeaders.radius} (${t.summary.units.mm})`),
                    h('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, `${t.summary.analysisHeaders.sag} (${t.summary.units.mm})`),
                    !isNonRotSymmetric && h('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, `${t.summary.analysisHeaders.slope} (${t.summary.units.rad})`),
                    !isNonRotSymmetric && h('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, `${t.summary.analysisHeaders.angle} (${t.summary.units.deg})`),
                    !isNonRotSymmetric && h('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, `${t.summary.analysisHeaders.angle} (DMS)`),
                    !isNonRotSymmetric && h('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, `${t.summary.analysisHeaders.asphericity} (${t.summary.units.mm})`),
                    !isNonRotSymmetric && h('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, `${t.summary.analysisHeaders.aberration} (${t.summary.units.mm})`)
                )
            ),
            h('tbody', null,
                dataTable.map((row, idx) =>
                    h('tr', { key: idx, style: { borderBottom: `1px solid ${c.border}` } },
                        h('td', { style: { padding: '8px', textAlign: 'right' } }, row.r),
                        h('td', { style: { padding: '8px', textAlign: 'right' } }, row.sag),
                        !isNonRotSymmetric && h('td', { style: { padding: '8px', textAlign: 'right' } }, row.slope),
                        !isNonRotSymmetric && h('td', { style: { padding: '8px', textAlign: 'right' } }, row.angle),
                        !isNonRotSymmetric && h('td', { style: { padding: '8px', textAlign: 'right' } }, row.angleDMS),
                        !isNonRotSymmetric && h('td', { style: { padding: '8px', textAlign: 'right' } }, row.asphericity),
                        !isNonRotSymmetric && h('td', { style: { padding: '8px', textAlign: 'right' } }, row.aberration)
                    )
                )
            )
        )
    );
};
