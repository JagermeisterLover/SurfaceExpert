// SummaryView component - Displays comprehensive surface summary with metrics and detailed data table
// Shows summary statistics, F/#, best fit sphere, and full analysis table

import { calculateSurfaceValues } from '../../utils/calculations.js';
import { formatValue, degreesToDMS } from '../../utils/formatters.js';

const { createElement: h } = React;

export const SummaryView = ({ selectedSurface, c }) => {
    if (!selectedSurface) return null;

    // Generate data table for summary
    const generateDataTable = () => {
        const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
        const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
        const step = parseFloat(selectedSurface.parameters['Step']) || 1;
        const data = [];

        for (let r = minHeight; r < maxHeight; r += step) {
            // For non-rotationally symmetric surfaces (Zernike, Irregular), use scan angle to determine direction
            let values;
            if (selectedSurface.type === 'Irregular' || selectedSurface.type === 'Zernike') {
                const scanAngle = parseFloat(selectedSurface.parameters['Scan Angle']) || 0;
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
            const scanAngle = parseFloat(selectedSurface.parameters['Scan Angle']) || 0;
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

    // Calculate max values from raw (unformatted) data, filtering out NaN/Infinity
    // For sag: find the value with maximum absolute value (preserving sign)
    const sagValues = dataTable.map(row => row.rawSag).filter(v => isFinite(v));
    let maxSag = 0;
    for (const sag of sagValues) {
        if (Math.abs(sag) > Math.abs(maxSag)) {
            maxSag = sag;
        }
    }

    const slopeValues = dataTable.map(row => Math.abs(row.rawSlope)).filter(v => isFinite(v));
    const maxSlope = slopeValues.length > 0 ? Math.max(...slopeValues) : 0;

    const angleValues = dataTable.map(row => Math.abs(row.rawAngle)).filter(v => isFinite(v));
    const maxAngle = angleValues.length > 0 ? Math.max(...angleValues) : 0;

    const asphericityValues = dataTable.map(row => Math.abs(row.rawAsphericity)).filter(v => isFinite(v));
    const maxAsphericity = asphericityValues.length > 0 ? Math.max(...asphericityValues) : 0;

    const aberrationValues = dataTable.map(row => Math.abs(row.rawAberration)).filter(v => isFinite(v));
    const maxAberration = aberrationValues.length > 0 ? Math.max(...aberrationValues) : 0;

    // Calculate best fit sphere
    const minHeight = parseFloat(selectedSurface.parameters['Min Height']) || 0;
    const maxHeight = parseFloat(selectedSurface.parameters['Max Height']) || 25;
    const sagAtMax = calculateSurfaceValues(maxHeight, selectedSurface).sag;
    let bestFitSphere = 0;

    if (minHeight === 0) {
        bestFitSphere = window.SurfaceCalculations.calculateBestFitSphereRadius3Points(maxHeight, sagAtMax);
    } else {
        const sagAtMin = calculateSurfaceValues(minHeight, selectedSurface).sag;
        const result = window.SurfaceCalculations.calculateBestFitSphereRadius4Points(minHeight, maxHeight, sagAtMin, sagAtMax);
        bestFitSphere = result.R4;
    }

    // Calculate max asphericity gradient
    let maxAsphGradient = 0;
    if (dataTable.length > 1) {
        for (let i = 1; i < dataTable.length; i++) {
            const dr = parseFloat(dataTable[i].r) - parseFloat(dataTable[i-1].r);
            const dAsph = Math.abs(dataTable[i].rawAsphericity - dataTable[i-1].rawAsphericity);
            const gradient = dAsph / dr;
            if (isFinite(gradient) && gradient > maxAsphGradient) {
                maxAsphGradient = gradient;
            }
        }
    }

    // Calculate F/# (paraxial and working)
    // Paraxial F/# = EFFL / aperture_diameter = (R/2) / (2*maxHeight) = R / (4*maxHeight)
    // For Poly surface: R = A1 / 2
    let R;
    if (selectedSurface.type === 'Poly') {
        const A1 = parseFloat(selectedSurface.parameters['A1']) || 0;
        R = A1 / 2;
    } else {
        R = parseFloat(selectedSurface.parameters['Radius']) || 0;
    }
    const paraxialFNum = R !== 0 ? Math.abs(R / (4 * maxHeight)) : 0;

    // Working F/# based on marginal ray angle after reflection
    // For a mirror: reflected ray angle = 2 * arctan(surface_slope)
    // Working F/# = 1 / (2 * sin(reflected_angle))
    const edgeSlope = Math.abs(dataTable[dataTable.length - 1].rawSlope);
    const surfaceNormalAngle = Math.atan(edgeSlope); // angle of surface normal
    const reflectedRayAngle = 2 * surfaceNormalAngle; // law of reflection for collimated input
    const workingFNum = reflectedRayAngle !== 0 ? 1 / (2 * Math.sin(reflectedRayAngle)) : 0;

    // Calculate single-point sag for non-rotationally symmetric surfaces
    const isNonRotSymmetric = selectedSurface.type === 'Zernike' || selectedSurface.type === 'Irregular';
    let singlePointSag = null;
    let xCoord = 0, yCoord = 0;
    if (isNonRotSymmetric) {
        xCoord = parseFloat(selectedSurface.parameters['X Coordinate']) || 0;
        yCoord = parseFloat(selectedSurface.parameters['Y Coordinate']) || 0;
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
                        h('th', { style: { padding: '10px', textAlign: 'left', color: c.textDim } }, 'Coordinate'),
                        h('th', { style: { padding: '10px', textAlign: 'right' } }, 'Value'),
                        h('th', { style: { padding: '10px', textAlign: 'left', paddingLeft: '20px' } }, 'Unit')
                    )
                ),
                h('tbody', null,
                    h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                        h('td', { style: { padding: '10px' } }, 'X Coordinate'),
                        h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(xCoord)),
                        h('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                    ),
                    h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                        h('td', { style: { padding: '10px' } }, 'Y Coordinate'),
                        h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(yCoord)),
                        h('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                    ),
                    h('tr', { style: { borderBottom: `1px solid ${c.border}`, backgroundColor: c.hover } },
                        h('td', { style: { padding: '10px', fontWeight: 'bold' } }, 'Sag at (X, Y)'),
                        h('td', { style: { padding: '10px', textAlign: 'right', fontWeight: 'bold' } }, formatValue(singlePointSag)),
                        h('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                    )
                )
            )
        ),
        h('h3', { style: { marginBottom: '20px', fontSize: '16px' } }, 'Surface Summary'),
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
                    h('th', { style: { padding: '10px', textAlign: 'left', color: c.textDim } }, 'Property'),
                    h('th', { style: { padding: '10px', textAlign: 'right' } }, 'Value'),
                    h('th', { style: { padding: '10px', textAlign: 'left', paddingLeft: '20px' } }, 'Unit')
                )
            ),
            h('tbody', null,
                h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, 'Height Range'),
                    h('td', { style: { padding: '10px', textAlign: 'right' } },
                        `${selectedSurface.parameters['Min Height']} - ${selectedSurface.parameters['Max Height']}`
                    ),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, 'Paraxial F/#'),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(paraxialFNum)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, '—')
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, 'Working F/#'),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(workingFNum)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, '—')
                ),
                h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, 'Max Sag'),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxSag)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, 'Max Slope'),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxSlope)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'rad')
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, 'Max Angle'),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAngle)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, '°')
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, 'Max Angle DMS'),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, degreesToDMS(maxAngle)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, '—')
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, 'Max Asphericity'),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAsphericity)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, 'Max Asph. Gradient'),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAsphGradient)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, '/mm')
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, 'Best Fit Sphere'),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(bestFitSphere)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                ),
                !isNonRotSymmetric && h('tr', { style: { borderBottom: `1px solid ${c.border}` } },
                    h('td', { style: { padding: '10px' } }, 'Max Aberration'),
                    h('td', { style: { padding: '10px', textAlign: 'right' } }, formatValue(maxAberration)),
                    h('td', { style: { padding: '10px', paddingLeft: '20px' } }, 'mm')
                )
            )
        ),

        // Detailed data table
        h('h3', { style: { marginBottom: '15px', marginTop: '20px', fontSize: '16px' } }, 'Detailed Analysis'),
        h('table', {
            style: {
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '12px'
            }
        },
            h('thead', null,
                h('tr', { style: { borderBottom: `2px solid ${c.border}` } },
                    h('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Height (mm)'),
                    h('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Sag (mm)'),
                    !isNonRotSymmetric && h('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Slope (rad)'),
                    !isNonRotSymmetric && h('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Angle (°)'),
                    !isNonRotSymmetric && h('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Angle DMS'),
                    !isNonRotSymmetric && h('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Asphericity (mm)'),
                    !isNonRotSymmetric && h('th', { style: { padding: '8px', textAlign: 'right', color: c.textDim } }, 'Aberration (mm)')
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
